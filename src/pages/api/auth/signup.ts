import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createAppSession, hashPassword } from "@/lib/authLocal";

const signupSchema = z.object({
  email: z.string().min(3),
  password: z.string().min(8),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Email tidak valid atau password terlalu pendek.",
    });
  }

  const email = parsed.data.email.toLowerCase();
  const now = new Date().toISOString();
  const exists = await prisma.appUser.findUnique({ where: { email } });
  if (exists) {
    return res.status(409).json({
      error: "Email sudah terdaftar. Silakan login.",
    });
  }

  const { salt, hash } = hashPassword(parsed.data.password);
  const user = await prisma.appUser.create({
    data: {
      id: crypto.randomUUID(),
      email,
      password_hash: hash,
      password_salt: salt,
      created_at: now,
      updated_at: now,
    },
  });

  const { token, expiresAt } = await createAppSession(user.id);
  res.setHeader(
    "Set-Cookie",
    `${"lokerhub_session"}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Expires=${expiresAt.toUTCString()}${
      process.env.NODE_ENV === "production" ? "; Secure" : ""
    }`
  );

  return res.status(201).json({
    success: true,
    user: { id: user.id, email: user.email, role: user.role },
  });
}
