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

  const isGlobal = user.role === "admin" || user.role === "owner" || user.role === "manager";
  const where = isGlobal ? {} : { user_id: user.id };

  const [salesRows, productRows, clientRows, supplierRows] = await Promise.all([
    prisma.invoice.findMany({
      where,
      distinct: ["user_id"],
      select: { user: { select: { email: true } } },
      orderBy: { created_at: "desc" },
    }),
    prisma.invoiceItem.findMany({
      where: { invoice: where as any },
      distinct: ["description"],
      select: { description: true },
      orderBy: { description: "asc" },
    }),
    prisma.client.findMany({
      where,
      distinct: ["province", "city", "district", "postal_code", "address"],
      select: { province: true, city: true, district: true, postal_code: true, address: true },
      orderBy: { created_at: "desc" },
    }),
    prisma.invoiceItem.findMany({
      where: { invoice: where as any },
      distinct: ["supplier"],
      select: { supplier: true },
      orderBy: { supplier: "asc" },
    }),
  ]);

  const salesSet = new Set<string>();
  const productSet = new Set<string>();
  const citySet = new Set<string>();
  const supplierSet = new Set<string>();

  salesRows.forEach((row) => {
    if (row.user?.email) salesSet.add(row.user.email);
  });

  productRows.forEach((item) => {
    const name = (item.description || "").split("-")[0].trim();
    if (name) productSet.add(name);
  });

  clientRows.forEach((c) => {
    const location = [c.province, c.city, c.district, c.postal_code, c.address]
      .filter((part) => part && part.trim())
      .join(", ");
    if (location.trim()) citySet.add(location.trim());
  });

  supplierRows.forEach((item) => {
    if (item.supplier) supplierSet.add(item.supplier);
  });

  const suppliers = Array.from(supplierSet).sort();
  if (suppliers.length === 0) suppliers.push("KOKO SUPPLIER", "MITRA1");

  return res.status(200).json({
    sales: Array.from(salesSet).sort(),
    products: Array.from(productSet).sort(),
    suppliers,
    cities: Array.from(citySet).sort(),
  });
}
