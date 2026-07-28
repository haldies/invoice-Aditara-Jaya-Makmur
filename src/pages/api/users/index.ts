import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/apiAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const user = await requireApiUser(req, res);
  if (!user) return; // handled

  if (user.role !== "admin" && user.role !== "owner" && user.role !== "manager") {
    return res.status(403).json({ error: "Akses ditolak" });
  }

  try {
    const users = await prisma.appUser.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        created_at: true,
      },
      orderBy: { created_at: "desc" },
    });

    return res.status(200).json(users);
  } catch (error) {
    console.error("List Users Error:", error);
    return res.status(500).json({ error: "Gagal memuat pengguna" });
  }
}
