import { NextApiRequest, NextApiResponse } from "next";
import { requireApiUser } from "@/lib/apiAuth";
import * as userRepo from "@/lib/repositories/userRepo";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = await requireApiUser(req, res);
    if (!user) return;

    const { id } = req.query;
    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "ID pengguna tidak valid" });
    }

    if (req.method === "PUT") {
      const { commission_rate } = req.body;
      if (typeof commission_rate !== "number") {
        return res.status(400).json({ error: "Tarif komisi harus berupa angka" });
      }

      const updatedUser = await userRepo.updateUserCommissionRate(user, id, commission_rate);
      if (!updatedUser) {
        return res.status(404).json({ error: "Pengguna tidak ditemukan" });
      }

      return res.status(200).json(updatedUser);
    }

    res.setHeader("Allow", ["PUT"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return res.status(403).json({ error: "Akses ditolak" });
    }
    console.error("API error /users/[id]/commission:", error);
    res.status(500).json({ error: "Terjadi kesalahan server" });
  }
}
