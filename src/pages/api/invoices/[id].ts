import type { NextApiRequest, NextApiResponse } from "next";
import { getErrorMessage, requireApiUser } from "@/lib/apiAuth";
import * as invoiceRepo from "@/lib/repositories/invoiceRepo";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query as { id: string };
  const user = await requireApiUser(req, res);
  if (!user) return;
  const actor = { id: user.id, role: user.role };

  switch (req.method) {
    case "GET": {
      const invoice = await invoiceRepo.findInvoiceById(actor, id);
      if (!invoice) return res.status(404).json({ error: "Not found" });
      return res.status(200).json(invoice);
    }

    case "PATCH":
    case "PUT": {
      try {
        const updated = await invoiceRepo.updateInvoice(actor, id, req.body);
        if (!updated) return res.status(404).json({ error: "Not found" });
        if ((updated as any).error === "conflict") {
          return res.status(409).json({
            error: "Conflict: Data has been modified on another device.",
          });
        }
        return res.status(200).json(updated);
      } catch (error: unknown) {
        return res.status(400).json({ error: getErrorMessage(error) });
      }
    }

    case "DELETE": {
      const deleted = await invoiceRepo.deleteInvoice(actor, id);
      if (!deleted) return res.status(404).json({ error: "Not found" });
      return res.status(200).json({ success: true });
    }

    default:
      res.setHeader("Allow", "GET, PUT, PATCH, DELETE");
      return res.status(405).json({ error: "Method not allowed" });
  }
}
