import type { NextApiRequest, NextApiResponse } from "next";
import { requireApiUser } from "@/lib/apiAuth";
import * as invoiceRepo from "@/lib/repositories/invoiceRepo";

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
  const clients = await invoiceRepo.listClients({ id: user.id, role: user.role });
  return res.status(200).json(clients);
}
