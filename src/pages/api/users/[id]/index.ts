import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/authLocal";
import { requireApiUser } from "@/lib/apiAuth";

const updateUserSchema = z.object({
  username: z.string().min(3),
  password: z.string().optional(),
  role: z.enum(["sales", "admin", "user", "manager", "owner"]),
  name: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await requireApiUser(req, res);
  if (!user) return;

  if (user.role !== "admin" && user.role !== "owner" && user.role !== "manager") {
    return res.status(403).json({ error: "Akses ditolak" });
  }

  const { id } = req.query;
  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Invalid ID" });
  }

  if (req.method === "DELETE") {
    try {
      // Prevent deleting self
      if (id === user.id) {
         return res.status(400).json({ error: "Anda tidak dapat menghapus akun Anda sendiri" });
      }

      const existing = await prisma.appUser.findUnique({ where: { id } });
      if (!existing) return res.status(404).json({ error: "User not found" });

      if (existing.role === "owner" && user.role !== "owner") {
         return res.status(403).json({ error: "Hanya Owner yang dapat menghapus akun Owner" });
      }

      await prisma.appUser.delete({ where: { id } });
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  if (req.method === "PUT") {
    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Data tidak valid", details: parsed.error.issues });
    }

    try {
      const existing = await prisma.appUser.findUnique({ where: { id } });
      if (!existing) return res.status(404).json({ error: "User not found" });

      if (existing.role === "owner" && user.role !== "owner" && id !== user.id) {
         return res.status(403).json({ error: "Hanya Owner yang dapat mengubah akun Owner" });
      }

      // Check username collision if changed
      if (parsed.data.username.toLowerCase() !== existing.email) {
        const usernameCheck = await prisma.appUser.findUnique({
          where: { email: parsed.data.username.toLowerCase() }
        });
        if (usernameCheck) {
          return res.status(400).json({ error: "Username sudah digunakan" });
        }
      }

      const updateData: any = {
        email: parsed.data.username.toLowerCase(),
        role: parsed.data.role,
        ...(parsed.data.name !== undefined && { name: parsed.data.name }),
        ...(parsed.data.phone !== undefined && { phone: parsed.data.phone }),
        updated_at: new Date().toISOString(),
      };

      if (parsed.data.password && parsed.data.password.trim() !== "") {
        if (parsed.data.password.length < 6) {
           return res.status(400).json({ error: "Password minimal 6 karakter" });
        }
        const { salt, hash } = hashPassword(parsed.data.password);
        updateData.password_salt = salt;
        updateData.password_hash = hash;
      }

      const updatedUser = await prisma.appUser.update({
        where: { id },
        data: updateData
      });

      return res.status(200).json({ success: true, user: { id: updatedUser.id, username: updatedUser.email, role: updatedUser.role, name: updatedUser.name, phone: updatedUser.phone } });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  res.setHeader("Allow", ["PUT", "DELETE"]);
  return res.status(405).json({ error: "Method not allowed" });
}
