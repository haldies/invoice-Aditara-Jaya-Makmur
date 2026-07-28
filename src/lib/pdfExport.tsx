import React from "react";
import { Invoice } from "@/types/invoice";
import { CompanyProfile } from "./companyProfile";

export type DocType = "quotation" | "invoice" | "po" | "receipt";

export type PdfAction = "download" | "preview" | "share";

export async function processPDF(
  action: PdfAction,
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
  
  const { generatePdfDocumentNumber } = await import("./pdfUtils");
  const docNumber = generatePdfDocumentNumber(docType, invoice);
  const fileName = `${docNumber}_${invoice.client.name.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
  
  if (action === "download") {
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } else if (action === "preview") {
    window.open(url, "_blank");
  } else if (action === "share") {
    // For mobile devices, Web Share API can share files directly
    const file = new File([blob], fileName, { type: "application/pdf" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: `Dokumen ${docNumber}`,
          text: `Berikut adalah dokumen ${docNumber} untuk ${invoice.client.name}.`,
          files: [file],
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      // Fallback for desktop: download and open WA link
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
      
      const phone = invoice.client.phone ? invoice.client.phone.replace(/\D/g, "") : "";
      let phoneParam = phone.startsWith("0") ? "62" + phone.substring(1) : phone;
      const text = encodeURIComponent(`Halo ${invoice.client.name},\nBerikut adalah dokumen ${docNumber} dari kami.`);
      window.open(`https://wa.me/${phoneParam}?text=${text}`, "_blank");
      
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }
}

export async function downloadPDF(
  docType: DocType,
  invoice: Invoice,
  company: CompanyProfile,
  includePpn: boolean = false
) {
  return processPDF("download", docType, invoice, company, includePpn);
}
