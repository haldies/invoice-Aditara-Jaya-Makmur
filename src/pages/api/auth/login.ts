import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createAppSession, verifyPassword } from "@/lib/authLocal";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Login gagal. Periksa email dan password.",
    });
  }

  try {
    const user = await prisma.appUser.findUnique({
      where: { email: parsed.data.email.toLowerCase() },
    });
    if (!user) {
      return res.status(404).json({
        error: "Login gagal. Periksa email dan password.",
      });
    }

    if (!verifyPassword(parsed.data.password, user.password_salt, user.password_hash)) {
      return res.status(401).json({
        error: "Login gagal. Periksa email dan password.",
      });
    }

    const { token, expiresAt } = await createAppSession(user.id);
    res.setHeader(
      "Set-Cookie",
      `${"lokerhub_session"}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Expires=${expiresAt.toUTCString()}${
        process.env.NODE_ENV === "production" ? "; Secure" : ""
      }`
    );

    return res.status(200).json({
      success: true,
      user: { id: user.id, email: user.email },
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ error: "Terjadi kesalahan pada server. Silakan coba lagi nanti." });
  }
}
