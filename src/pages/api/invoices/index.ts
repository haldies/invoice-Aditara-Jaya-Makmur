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
      const { status, payment_status, search, client_id, sales, product, supplier, city, sort, page, limit } = req.query;
      const invoices = await invoiceRepo.listInvoices(actor, {
        status: status as any,
        payment_status: payment_status as any,
        search: search as string | undefined,
        client_id: client_id as string | undefined,
        sales: sales as string | undefined,
        product: product as string | undefined,
        supplier: supplier as string | undefined,
        city: city as string | undefined,
        sort: sort as string | undefined,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });
      return res.status(200).json(invoices);
    }

    case "POST": {
      try {
        const invoice = await invoiceRepo.createInvoice(actor, req.body);
        return res.status(201).json(invoice);
      } catch (error: any) {
        if (error.code === 'P2002' || error.message?.includes('Unique constraint failed')) {
          return res.status(400).json({ error: `Nomor Transaksi/Invoice '${req.body?.invoice_number}' sudah pernah digunakan. Silakan gunakan nomor yang lain.` });
        }
        return res.status(400).json({ error: getErrorMessage(error) });
      }
    }

    default:
      res.setHeader("Allow", "GET, POST");
      return res.status(405).json({ error: "Method not allowed" });
  }
}
