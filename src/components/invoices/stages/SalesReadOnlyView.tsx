import { useState } from "react";
import { Invoice } from "@/types/invoice";
import { loadCompanyProfile } from "@/lib/companyProfile";
import { fmt, fmtDate, handleDownloadPDF } from "./stageUtils";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { INVOICE_STATUS_CONFIG } from "@/types/invoice";

interface Props {
  invoice: Invoice;
}

export function SalesReadOnlyView({ invoice }: Props) {
  const [isPdfLoading, setIsPdfLoading] = useState(false);

  const statusLabel = INVOICE_STATUS_CONFIG[invoice.status]?.label || invoice.status;
  const includePpn = Math.abs((invoice.tax || 0) - invoice.subtotal * 0.11) < 100 && (invoice.tax || 0) > 0;

  const subtotal = invoice.items.reduce((s, i) => s + i.quantity * i.unit_price, 0);

  const download = (type: "quotation" | "invoice") => {
    const company = loadCompanyProfile();
    handleDownloadPDF(type, invoice, company, includePpn, setIsPdfLoading);
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-5">
      {/* Status Banner */}
      <div className="flex items-center gap-3 rounded-2xl px-5 py-4 border bg-slate-50 border-slate-200">
        <div>
          <p className="font-black text-base text-foreground">{statusLabel}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{invoice.invoice_number}</p>
        </div>
      </div>

      {/* Client Info */}
      <div className="bg-card border rounded-xl p-4">
        <h2 className="font-bold text-sm mb-3">Data Pelanggan</h2>
        <p className="font-semibold text-foreground">{invoice.client?.name}</p>
        {invoice.client?.company && <p className="text-xs text-muted-foreground">{invoice.client.company}</p>}
        {invoice.client?.phone && <p className="text-xs text-muted-foreground">{invoice.client.phone}</p>}
        {invoice.client?.email && <p className="text-xs text-muted-foreground">{invoice.client.email}</p>}
        {invoice.client?.address && <p className="text-xs text-muted-foreground mt-1">{invoice.client.address}</p>}
        
        {(invoice.notes || invoice.due_date) && (
          <div className="mt-3 pt-3 border-t space-y-1">
            {invoice.due_date && (
              <p className="text-xs text-muted-foreground"><span className="font-semibold">Tgl Kirim:</span> {fmtDate(invoice.due_date)}</p>
            )}
            {invoice.notes && (
              <p className="text-xs text-muted-foreground"><span className="font-semibold">Lokasi:</span> {invoice.notes}</p>
            )}
          </div>
        )}
      </div>

      {/* Products */}
      <div className="bg-card border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b bg-slate-50">
          <h2 className="font-bold text-sm">Produk</h2>
        </div>
        <div className="divide-y">
          {invoice.items.map((item, idx) => {
            const billedQty = item.actual_quantity != null ? item.actual_quantity : item.quantity;
            return (
              <div key={idx} className="px-4 py-3 flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-sm">{item.description}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {Number(billedQty).toLocaleString("id-ID")} m³ × {fmt(item.unit_price)}
                    {item.actual_quantity != null && item.actual_quantity !== item.quantity && (
                      <span className="ml-1 text-emerald-600 font-semibold">(Aktual)</span>
                    )}
                  </p>
                </div>
                <p className="font-black text-sm shrink-0">{fmt(billedQty * item.unit_price)}</p>
              </div>
            );
          })}
        </div>
        
        <div className="bg-slate-50 border-t p-4 space-y-2 text-sm">
          <div className="flex justify-between text-muted-foreground text-xs">
            <span>Subtotal</span><span className="font-semibold text-foreground">{fmt(invoice.subtotal)}</span>
          </div>
          {(invoice.discount || 0) > 0 && (
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Diskon</span><span className="font-semibold text-red-600">- {fmt(invoice.discount)}</span>
            </div>
          )}
          {(invoice.tax || 0) > 0 && (
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>PPN 11%</span><span className="font-semibold">+ {fmt(invoice.tax)}</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-2 border-t font-extrabold text-foreground">
            <span>Total Transaksi</span><span className="text-lg">{fmt(invoice.total)}</span>
          </div>
        </div>
      </div>

      {/* Status Message */}
      {invoice.status === "tagihan" && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-700 font-medium">
          Penawaran sudah dikirim dan sedang diproses admin. Hubungi admin untuk konfirmasi lebih lanjut.
        </div>
      )}
      {invoice.status === "po" && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-700 font-medium">
          Purchase Order sudah dibuat. Menunggu jadwal pengiriman.
        </div>
      )}
      {invoice.status === "pengiriman" && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-700 font-medium">
          Barang sedang dalam proses pengiriman ke lokasi.
        </div>
      )}
      {invoice.status === "selesai" && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-700 font-medium">
          Transaksi telah selesai.
        </div>
      )}

      {/* Actions */}
      <div className="mt-6 flex flex-col sm:flex-row gap-2">
        <Button
          onClick={() => download("quotation")}
          disabled={isPdfLoading}
          variant="outline"
          className="flex-1 h-12 font-bold text-sm gap-1.5"
        >
          <Download className="h-4 w-4" /> Cetak Penawaran
        </Button>
        <Button
          onClick={() => download("invoice")}
          disabled={isPdfLoading}
          className="flex-1 h-12 font-bold text-sm gap-1.5"
        >
          <FileText className="h-4 w-4" /> Cetak Invoice
        </Button>
      </div>
    </div>
  );
}
