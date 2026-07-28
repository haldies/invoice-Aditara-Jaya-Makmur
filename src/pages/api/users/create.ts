import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/authLocal";
import { requireApiUser } from "@/lib/apiAuth";
import { v4 as uuidv4 } from "uuid";

const createUserSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
  role: z.enum(["sales", "admin", "user"]).default("sales"),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const user = await requireApiUser(req, res);
  if (!user) return; // Response is already handled

  if (user.role !== "admin" && user.role !== "owner" && user.role !== "manager") {
    return res.status(403).json({ error: "Hanya Admin yang dapat membuat akun" });
  }

  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Data tidak valid", details: parsed.error.issues });
  }

  try {
    const existing = await prisma.appUser.findUnique({
      where: { email: parsed.data.username.toLowerCase() },
    });
    
    if (existing) {
      return res.status(400).json({ error: "Username sudah digunakan" });
    }

    const { salt, hash } = hashPassword(parsed.data.password);
    
    const newUser = await prisma.appUser.create({
      data: {
        id: uuidv4(),
        email: parsed.data.username.toLowerCase(),
        password_salt: salt,
        password_hash: hash,
        role: parsed.data.role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    });

    return res.status(200).json({
      success: true,
      user: { id: newUser.id, username: newUser.email, role: newUser.role },
    });
  } catch (error) {
    console.error("Create User Error:", error);
    return res.status(500).json({ error: "Terjadi kesalahan pada server." });
  }
}
