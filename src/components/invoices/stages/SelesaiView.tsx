/**
 * SelesaiView – Tampilan read-only untuk transaksi Selesai & Batal.
 * Cetak kwitansi/invoice, lihat ringkasan margin final.
 */
import { useState } from "react";
import { Invoice } from "@/types/invoice";
import { useInvoices } from "@/hooks/useInvoices";
import { loadCompanyProfile } from "@/lib/companyProfile";
import { fmt, fmtDate, handleDownloadPDF, calcMargin } from "./stageUtils";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Download, FileText, Receipt, CheckCircle, XCircle } from "lucide-react";

interface Props {
  invoice: Invoice;
  onUpdated: (updated: Invoice) => void;
  isSales?: boolean;
}

export function SelesaiView({ invoice, onUpdated, isSales = false }: Props) {
  const { updateInvoice } = useInvoices();
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const includePpn = Math.abs((invoice.tax || 0) - invoice.subtotal * 0.11) < 100 && (invoice.tax || 0) > 0;
  const margin = calcMargin(invoice);
  const isSelesai = invoice.status === "selesai";
  const isBatal = invoice.status === "batal";

  const download = (type: "invoice" | "receipt") => {
    const company = loadCompanyProfile();
    handleDownloadPDF(type, invoice, company, includePpn, setIsPdfLoading);
  };

  const cancel = async () => {
    setIsSaving(true);
    try {
      const updated = await updateInvoice(invoice.id, { status: "batal" as any, version: invoice.version });
      onUpdated(updated);
    } catch (e: any) {
      alert(e?.message || "Gagal");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
      {/* Status Banner */}
      <div className={`flex items-center gap-3 rounded-2xl px-5 py-4 border ${isSelesai ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
        {isSelesai
          ? <CheckCircle className="h-8 w-8 text-emerald-600 shrink-0" />
          : <XCircle className="h-8 w-8 text-red-500 shrink-0" />}
        <div>
          <p className={`font-black text-lg ${isSelesai ? "text-emerald-800" : "text-red-700"}`}>
            {isSelesai ? "Transaksi Selesai" : "Transaksi Dibatalkan"}
          </p>
          <p className="text-sm text-muted-foreground mt-0.5">
            {invoice.invoice_number} · {invoice.client?.name}
          </p>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Client */}
        <div className="bg-card border rounded-xl p-4 space-y-2">
          <h3 className="font-bold text-sm">Data Pelanggan</h3>
          <p className="font-semibold text-foreground">{invoice.client?.name}</p>
          {invoice.client?.phone && <p className="text-xs text-muted-foreground">{invoice.client.phone}</p>}
          {invoice.client?.email && <p className="text-xs text-muted-foreground">{invoice.client.email}</p>}
          {invoice.client?.address && <p className="text-xs text-muted-foreground">{invoice.client.address}</p>}
          {invoice.notes && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">Lokasi Proyek: {invoice.notes}</p>
            </div>
          )}
        </div>

        {/* Financial Summary */}
        <div className="bg-card border rounded-xl p-4 space-y-2 text-sm">
          <h3 className="font-bold">Ringkasan Nilai</h3>
          <div className="flex justify-between text-xs text-muted-foreground">
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
          <div className="flex justify-between items-center pt-2 border-t font-extrabold">
            <span>Total</span><span className="text-lg">{fmt(invoice.total)}</span>
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="bg-card border rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b">
          <h2 className="font-bold text-sm">Rincian Produk</h2>
        </div>
        <div className="divide-y">
          {invoice.items.map((item, idx) => {
            const billedQty = item.actual_quantity != null ? item.actual_quantity : item.quantity;
            return (
              <div key={idx} className="px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm">{item.description}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Deal: {item.quantity} m³
                      {item.actual_quantity != null && item.actual_quantity !== item.quantity && (
                        <span className="ml-1.5 text-blue-700 font-semibold">· Aktual: {item.actual_quantity} m³</span>
                      )}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-black text-sm">{fmt(billedQty * item.unit_price)}</p>
                    <p className="text-xs text-muted-foreground">{fmt(item.unit_price)}/m³</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Margin (admin only) */}
      {!isSales && (
        <div className="bg-slate-50 dark:bg-slate-900/30 border rounded-xl p-4 space-y-2 text-xs">
          <p className="font-bold text-sm">Margin Final</p>
          {margin.totalEksternalFee > 0 && (
            <div className="flex justify-between text-red-600">
              <span>Fee Eksternal (Komisi)</span><span>- {fmt(margin.totalEksternalFee)}</span>
            </div>
          )}
          <div className="flex justify-between text-muted-foreground">
            <span>Total AJM</span><span className="font-semibold text-blue-700">{fmt(margin.totalAjm)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>HPP Terpakai</span><span className="font-semibold text-orange-700">- {fmt(margin.totalHpp)}</span>
          </div>
          {(invoice.fee || 0) > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>Fee Lain</span><span>- {fmt(invoice.fee)}</span>
            </div>
          )}
          <div className={`flex justify-between pt-2 border-t font-bold text-sm ${margin.netMargin >= 0 ? "text-emerald-700" : "text-red-600"}`}>
            <span>Laba Bersih</span><span>{fmt(margin.netMargin)}</span>
          </div>
        </div>
      )}

      {/* PDF Actions */}
      {isSelesai && (
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={() => download("receipt")} disabled={isPdfLoading} variant="outline" className="w-full sm:w-1/2 h-11 font-bold text-xs gap-1.5 border-emerald-500 text-emerald-600 hover:bg-emerald-50">
            <Receipt className="h-4 w-4" /> Cetak Kwitansi
          </Button>
          <Button onClick={() => download("invoice")} disabled={isPdfLoading} variant="outline" className="w-full sm:w-1/2 h-11 font-bold text-xs gap-1.5 border-primary text-primary hover:bg-primary/10">
            <Download className="h-4 w-4" /> Cetak Invoice
          </Button>
        </div>
      )}

      {/* Cancel Option (admin, selesai only) */}
      {!isSales && isSelesai && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" className="w-full h-10 text-red-600 hover:bg-red-50 font-bold text-xs" disabled={isSaving}>
              Batalkan Transaksi Ini
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Batalkan Transaksi?</AlertDialogTitle>
              <AlertDialogDescription>
                Tindakan ini akan menandai transaksi sebagai BATAL. Ini tidak dapat dibatalkan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Tidak</AlertDialogCancel>
              <AlertDialogAction onClick={cancel} className="bg-red-600 hover:bg-red-700">
                Ya, Batalkan
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
