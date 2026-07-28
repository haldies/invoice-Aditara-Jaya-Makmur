import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/apiAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const user = await requireApiUser(req, res);
  if (!user) return;

  if (user.role !== "admin" && user.role !== "owner" && user.role !== "manager") {
    return res.status(403).json({ error: "Forbidden" });
  }

  const {
    islandJawa,
    islandSumatera,
    islandKalimantan,
    islandSulawesi,
    islandBaliNusa,
    islandMalukuPapua,
    minOrderForFree
  } = req.body;

  const ownerId = user.role === "owner" ? user.id : await (async () => {
    const owner = await prisma.appUser.findFirst({ where: { role: "owner" } });
    return owner?.id || user.id;
  })();

  try {
    // Delete all existing shipping rates for this owner
    await prisma.shippingRate.deleteMany({ where: { user_id: ownerId } });

    const now = new Date().toISOString();

    const data = [
      { user_id: ownerId, area: "ISLAND_JAWA", price: Number(islandJawa) || 0, is_free: false, created_at: now, updated_at: now },
      { user_id: ownerId, area: "ISLAND_SUMATERA", price: Number(islandSumatera) || 0, is_free: false, created_at: now, updated_at: now },
      { user_id: ownerId, area: "ISLAND_KALIMANTAN", price: Number(islandKalimantan) || 0, is_free: false, created_at: now, updated_at: now },
      { user_id: ownerId, area: "ISLAND_SULAWESI", price: Number(islandSulawesi) || 0, is_free: false, created_at: now, updated_at: now },
      { user_id: ownerId, area: "ISLAND_BALI_NUSA", price: Number(islandBaliNusa) || 0, is_free: false, created_at: now, updated_at: now },
      { user_id: ownerId, area: "ISLAND_MALUKU_PAPUA", price: Number(islandMalukuPapua) || 0, is_free: false, created_at: now, updated_at: now },
      { user_id: ownerId, area: "GLOBAL_MIN_ORDER", price: Number(minOrderForFree) || 0, is_free: true, created_at: now, updated_at: now }
    ];

    await prisma.shippingRate.createMany({ data });

    return res.status(200).json({ message: "Pengaturan ongkos kirim per pulau berhasil disimpan." });
  } catch (error: any) {
    console.error("Global shipping rate error:", error);
    return res.status(500).json({ error: error.message });
  }
}
