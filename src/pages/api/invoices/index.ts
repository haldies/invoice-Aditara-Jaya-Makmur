import type { NextApiRequest, NextApiResponse } from "next";
import { getErrorMessage, requireApiUser } from "@/lib/apiAuth";
import * as invoiceRepo from "@/lib/repositories/invoiceRepo";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await requireApiUser(req, res);
  if (!user) return;
  const actor = { id: user.id, role: user.role };

  switch (req.method) {
    case "GET": {
      const { status, search, client_id } = req.query;
      const invoices = await invoiceRepo.listInvoices(actor, {
        status: status as any,
        search: search as string | undefined,
        client_id: client_id as string | undefined,
      });
      return res.status(200).json(invoices);
    }

    case "POST": {
      try {
        const invoice = await invoiceRepo.createInvoice(actor, req.body);
        return res.status(201).json(invoice);
      } catch (error: unknown) {
        return res.status(400).json({ error: getErrorMessage(error) });
      }
    }

    default:
      res.setHeader("Allow", "GET, POST");
      return res.status(405).json({ error: "Method not allowed" });
  }
}
