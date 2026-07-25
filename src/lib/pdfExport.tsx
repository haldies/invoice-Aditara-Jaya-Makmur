import React from "react";
import { Invoice } from "@/types/invoice";
import { CompanyProfile } from "./companyProfile";

export type DocType = "quotation" | "invoice" | "po" | "receipt";

export async function downloadPDF(
  docType: DocType,
  invoice: Invoice,
  company: CompanyProfile,
  includePpn: boolean = false
) {
  const { pdf } = await import("@react-pdf/renderer");
  let blob: Blob;

  if (docType === "receipt") {
    const { ReceiptPDF } = await import("@/components/invoices/ReceiptPDF");
    blob = await pdf(<ReceiptPDF invoice={invoice} company={company} includePpn={includePpn} />).toBlob();
  } else if (docType === "po") {
    const { POPDF } = await import("@/components/invoices/POPDF");
    blob = await pdf(<POPDF invoice={invoice} company={company} includePpn={includePpn} />).toBlob();
  } else if (docType === "quotation") {
    const { QuotationPDF } = await import("@/components/invoices/QuotationPDF");
    blob = await pdf(<QuotationPDF invoice={invoice} company={company} includePpn={includePpn} />).toBlob();
  } else {
    // We strictly use Modern template for Invoice as the default for this workflow
    const { TemplateModern } = await import("@/components/invoices/templates/TemplateModern");
    blob = await pdf(<TemplateModern invoice={invoice} company={company} includePpn={includePpn} />).toBlob();
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const prefix =
    docType === "receipt"
      ? "Kwitansi"
      : docType === "po"
      ? "PO"
      : docType === "quotation"
      ? "Penawaran"
      : "Invoice";
  link.download = `${prefix}_${invoice.invoice_number}_${invoice.client.name}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}
