import { Invoice, InvoiceItem } from "@/types/invoice";
import { CompanyProfile } from "@/lib/companyProfile";
import { downloadPDF, processPDF, DocType, PdfAction } from "@/lib/pdfExport";

/** Format number ke Rupiah */
export function fmt(val: number | null | undefined): string {
  return "Rp " + Number(val ?? 0).toLocaleString("id-ID");
}

/** Format date string ke Bahasa Indonesia */
export function fmtDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  try {
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember",
    ];
    return `${parseInt(parts[2], 10)} ${months[parseInt(parts[1], 10) - 1]} ${parts[0]}`;
  } catch {
    return dateStr;
  }
}

export function fmtDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return dateStr;
  }
}

/** Hitung totals dari invoice */
export function calcTotals(invoice: Invoice) {
  const subtotal = invoice.items.reduce((sum, item) => {
    const qty = item.actual_quantity != null ? Number(item.actual_quantity) : Number(item.quantity || 0);
    return sum + qty * Number(item.unit_price || 0);
  }, 0);
  return { subtotal, tax: invoice.tax, total: invoice.total };
}

/** Hitung margin internal dari invoice */
export function calcMargin(invoice: Invoice) {
  let rawTotalDeal = 0;
  let rawTotalAjm = 0;
  let totalHppTerpakai = 0; // HPP DPP
  let totalHppDibayar = 0; // HPP DPP (Deal Qty)
  let sisaPOVol = 0;

  for (const item of invoice.items) {
    const dealQty = Number(item.quantity || 0);
    const billedQty = item.actual_quantity != null ? Number(item.actual_quantity) : dealQty;
    const dealPrice = Number(item.unit_price || 0);
    const ajmPrice = Number(item.ajm_price ?? item.unit_price ?? 0);

    rawTotalDeal += billedQty * dealPrice;
    rawTotalAjm += billedQty * ajmPrice;
    totalHppTerpakai += billedQty * Number(item.buy_in_price || 0);
    totalHppDibayar += dealQty * Number(item.buy_in_price || 0);
    sisaPOVol += dealQty - billedQty;
  }

  const subtotal = invoice.items.reduce((s, i) => {
    const qty = i.actual_quantity != null ? Number(i.actual_quantity) : Number(i.quantity || 0);
    return s + qty * Number(i.unit_price || 0);
  }, 0);
  
  const includePpn = Math.abs((invoice.tax || 0) - subtotal * 0.11) < 100 && (invoice.tax || 0) > 0;

  const dealDPP = includePpn ? rawTotalDeal : rawTotalDeal / 1.11;
  const dealPPN = includePpn ? rawTotalDeal * 0.11 : rawTotalDeal - dealDPP;
  const dealTotal = rawTotalDeal + (includePpn ? dealPPN : 0);

  const ajmDPP = includePpn ? rawTotalAjm : rawTotalAjm / 1.11;
  const ajmPPN = includePpn ? rawTotalAjm * 0.11 : rawTotalAjm - ajmDPP;
  const ajmTotal = rawTotalAjm + (includePpn ? ajmPPN : 0);

  const hppDPP = totalHppTerpakai;
  const hppPPN = totalHppTerpakai * 0.11;
  const hppTotal = hppDPP + hppPPN;

  const ppnSupplier = totalHppDibayar * 0.11;
  const totalEksternalFee = dealTotal - ajmTotal; // Fee Eksternal is based on Harga Total
  const sisaPPN = 0; // Sisa PPN is now bundled into the Fee Eksternal

  const grossMargin = ajmDPP - hppDPP;
  const netMargin = grossMargin - Number(invoice.fee || 0);

  return {
    dealDPP, dealPPN, dealTotal,
    ajmDPP, ajmPPN, ajmTotal,
    hppDPP, hppPPN, hppTotal,
    totalEksternalFee,
    sisaPPN,
    totalHppDibayar,
    ppnSupplier,
    grossMargin,
    netMargin,
    sisaPOVol
  };
}

// ...

/** Handle PDF with action */
export async function handlePdfAction(
  action: PdfAction,
  docType: DocType,
  invoice: Invoice,
  company: CompanyProfile,
  includePpn: boolean,
  setLoading: (v: boolean) => void
) {
  setLoading(true);
  try {
    await processPDF(action, docType, invoice, company, includePpn);
  } catch (e) {
    console.error(e);
    alert("Gagal memproses PDF.");
  } finally {
    setLoading(false);
  }
}

/** Download PDF helper (legacy/compat) */
export async function handleDownloadPDF(
  docType: DocType,
  invoice: Invoice,
  company: CompanyProfile,
  includePpn: boolean,
  setLoading: (v: boolean) => void
) {
  return handlePdfAction("download", docType, invoice, company, includePpn, setLoading);
}
