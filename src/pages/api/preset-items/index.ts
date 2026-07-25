import type { NextApiRequest, NextApiResponse } from "next";
import { requireApiUser } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await requireApiUser(req, res);
  if (!user) return;

  if (req.method === "GET") {
    try {
      const items = await prisma.invoicePresetItem.findMany({
        where: user.role === "owner" || user.role === "admin" || user.role === "manager"
          ? {} // admin/owner lihat semua
          : { user_id: user.id },
        orderBy: { name: "asc" },
      });
      return res.status(200).json(items);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Failed to fetch preset items" });
    }
  }

  if (req.method === "POST") {
    // Hanya admin/owner/manager yang bisa buat preset
    if (user.role === "user") {
      return res.status(403).json({ error: "Akses ditolak: hanya admin yang dapat mengelola produk." });
    }
    try {
      const { name, description, unit_price, buy_in_price, tax_rate } = req.body;
      if (!name) {
        return res.status(400).json({ error: "Name is required" });
      }

      const newItem = await prisma.invoicePresetItem.create({
        data: {
          user_id: user.id,
          name,
          description: description || "",
          unit_price: Number(unit_price || 0),
          buy_in_price: Number(buy_in_price || 0),
          tax_rate: Number(tax_rate || 0),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      });
      return res.status(201).json(newItem);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Failed to create preset item" });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ error: "Method not allowed" });
}
