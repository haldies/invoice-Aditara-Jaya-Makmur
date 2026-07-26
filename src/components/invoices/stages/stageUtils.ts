import { Invoice, InvoiceItem } from "@/types/invoice";
import { CompanyProfile } from "@/lib/companyProfile";
import { downloadPDF, DocType } from "@/lib/pdfExport";

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
  let totalDeal = 0;
  let totalAjm = 0;
  let totalEksternalFee = 0;
  let totalHppTerpakai = 0;
  let totalHppDibayar = 0;
  let sisaPOVol = 0;

  for (const item of invoice.items) {
    const dealQty = Number(item.quantity || 0);
    const billedQty = item.actual_quantity != null ? Number(item.actual_quantity) : dealQty;
    const dealPrice = Number(item.unit_price || 0);
    const commission = Number(item.commission_rate || 0);
    const ajmPrice = dealPrice - commission;

    totalDeal += billedQty * dealPrice;
    totalAjm += billedQty * ajmPrice;
    totalEksternalFee += billedQty * commission;
    totalHppTerpakai += billedQty * Number(item.buy_in_price || 0);
    totalHppDibayar += dealQty * Number(item.buy_in_price || 0);
    sisaPOVol += dealQty - billedQty;
  }

  const ppnSupplier = Math.round(totalHppDibayar * 0.11);
  const grossMargin = totalAjm - totalHppTerpakai;
  const netMargin = grossMargin - Number(invoice.fee || 0);

  return { totalDeal, totalAjm, totalEksternalFee, totalHpp: totalHppTerpakai, totalHppDibayar, ppnSupplier, grossMargin, netMargin, sisaPOVol };
}

/** Download PDF helper */
export async function handleDownloadPDF(
  docType: DocType,
  invoice: Invoice,
  company: CompanyProfile,
  includePpn: boolean,
  setLoading: (v: boolean) => void
) {
  setLoading(true);
  try {
    await downloadPDF(docType, invoice, company, includePpn);
  } catch (e) {
    console.error(e);
    alert("Gagal mengunduh PDF.");
  } finally {
    setLoading(false);
  }
}
