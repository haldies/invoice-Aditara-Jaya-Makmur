import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/apiAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await requireApiUser(req, res);
  if (!user) return; // requireApiUser handles the response

  const ownerId = user.role === "owner" ? user.id : await (async () => {
    // try to find owner
    const owner = await prisma.appUser.findFirst({ where: { role: "owner" }});
    return owner?.id || user.id;
  })();

  if (req.method === "GET") {
    try {
      // @ts-ignore
      const rates = await prisma.shippingRate.findMany({
        where: { user_id: ownerId },
        orderBy: { area: 'asc' },
      });
      return res.status(200).json(rates);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === "POST") {
    // Only admin/owner can create
    if (user.role !== "admin" && user.role !== "owner" && user.role !== "manager") {
       return res.status(403).json({ error: "Forbidden" });
    }
    
    try {
      const { area, price, is_free, notes } = req.body;
      if (!area) {
        return res.status(400).json({ error: "Area required" });
      }

      // @ts-ignore
      const rate = await prisma.shippingRate.create({
        data: {
          user_id: ownerId,
          area,
          price: Number(price) || 0,
          is_free: Boolean(is_free),
          notes: notes || "",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      });
      return res.status(201).json(rate);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
