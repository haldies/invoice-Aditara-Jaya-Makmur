import type { NextApiRequest, NextApiResponse } from "next";
import { requireApiUser } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await requireApiUser(req, res);
  if (!user) return;

  const { id } = req.query;
  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Invalid preset item ID" });
  }

  // Verify ownership
  const existing = await prisma.invoicePresetItem.findFirst({
    where: { id, user_id: user.id },
  });
  if (!existing) {
    return res.status(404).json({ error: "Preset item not found" });
  }

  if (req.method === "PUT") {
    // Hanya admin/owner/manager yang bisa edit preset
    if (user.role === "user") {
      return res.status(403).json({ error: "Akses ditolak: hanya admin yang dapat mengelola produk." });
    }
    try {
      const { name, description, unit_price, buy_in_price, tax_rate } = req.body;
      if (!name) {
        return res.status(400).json({ error: "Name is required" });
      }

      const updated = await prisma.invoicePresetItem.update({
        where: { id },
        data: {
          name,
          description: description || "",
          unit_price: Number(unit_price || 0),
          buy_in_price: Number(buy_in_price || 0),
          tax_rate: Number(tax_rate || 0),
          updated_at: new Date().toISOString(),
        },
      });
      return res.status(200).json(updated);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Failed to update preset item" });
    }
  }

  if (req.method === "DELETE") {
    try {
      await prisma.invoicePresetItem.delete({
        where: { id },
      });
      return res.status(200).json({ success: true });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Failed to delete preset item" });
    }
  }

  res.setHeader("Allow", ["PUT", "DELETE"]);
  return res.status(405).json({ error: "Method not allowed" });
}
