import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/apiAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await requireApiUser(req, res);
  if (!user) return;

  const { id } = req.query;
  if (typeof id !== "string") {
    return res.status(400).json({ error: "Invalid ID" });
  }

  if (user.role !== "admin" && user.role !== "owner" && user.role !== "manager") {
    return res.status(403).json({ error: "Forbidden" });
  }

  const ownerId = user.role === "owner" ? user.id : await (async () => {
    const owner = await prisma.appUser.findFirst({ where: { role: "owner" }});
    return owner?.id || user.id;
  })();

  if (req.method === "PUT") {
    try {
      const { area, price, is_free, notes } = req.body;
      // @ts-ignore
      const rate = await prisma.shippingRate.updateMany({
        where: { id, user_id: ownerId },
        data: {
          area,
          price: price !== undefined ? Number(price) : undefined,
          is_free: is_free !== undefined ? Boolean(is_free) : undefined,
          notes,
          updated_at: new Date().toISOString(),
        }
      });
      if (rate.count === 0) return res.status(404).json({ error: "Not found" });
      return res.status(200).json({ success: true });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === "DELETE") {
    try {
      // @ts-ignore
      const rate = await prisma.shippingRate.deleteMany({
        where: { id, user_id: ownerId },
      });
      if (rate.count === 0) return res.status(404).json({ error: "Not found" });
      return res.status(200).json({ success: true });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  res.setHeader("Allow", ["PUT", "DELETE"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
