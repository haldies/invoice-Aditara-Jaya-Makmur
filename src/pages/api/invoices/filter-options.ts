import type { NextApiRequest, NextApiResponse } from "next";
import { requireApiUser } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await requireApiUser(req, res);
  if (!user) return;

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  // To build the filter options accurately based on actual data
  // We'll fetch the necessary fields from all invoices/items 
  // depending on the user role (owner/admin sees all, sales sees only their own).
  
  const isGlobal = user.role === "admin" || user.role === "owner" || user.role === "manager";
  
  const where = isGlobal ? {} : { user_id: user.id };

  const invoices = await prisma.invoice.findMany({
    where,
    select: {
      user: { select: { email: true } },
      client: { select: { address: true, province: true, city: true, district: true, postal_code: true } },
      notes: true,
      items: { select: { description: true } }
    }
  });

  const clients = await prisma.client.findMany({
    where,
    select: { address: true, province: true, city: true, district: true, postal_code: true }
  });

  const salesSet = new Set<string>();
  const productSet = new Set<string>();
  const citySet = new Set<string>();

  invoices.forEach((inv) => {
    if (inv.user?.email) salesSet.add(inv.user.email);
    
    inv.items.forEach((item) => {
      const name = (item.description || "").split("-")[0].trim();
      if (name) productSet.add(name);
    });

    const addr = [inv.client?.province, inv.client?.city, inv.client?.district, inv.client?.postal_code, inv.client?.address]
      .filter((part) => part && part.trim())
      .join(", ");
    const notes = inv.notes || "";
    if (addr.trim()) citySet.add(addr.trim());
    if (notes.trim()) citySet.add(notes.trim());
  });

  clients.forEach((c) => {
    const location = [c.province, c.city, c.district, c.postal_code, c.address]
      .filter((part) => part && part.trim())
      .join(", ");
    if (location.trim()) citySet.add(location.trim());
  });

  const suppliers = ["KOKO SUPPLIER", "MITRA1"];

  return res.status(200).json({
    sales: Array.from(salesSet).sort(),
    products: Array.from(productSet).sort(),
    suppliers,
    cities: Array.from(citySet).sort(),
  });
}
