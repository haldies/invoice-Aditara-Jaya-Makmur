/**
 * SelesaiView – Tampilan read-only untuk transaksi Selesai & Batal.
 * Cetak kwitansi/invoice, lihat ringkasan margin final.
 */
import { useState } from "react";
import { Invoice } from "@/types/invoice";
import { useInvoices } from "@/hooks/useInvoices";
import { loadCompanyProfile } from "@/lib/companyProfile";
import { fmt, fmtDate, handleDownloadPDF, handlePdfAction, calcMargin } from "./stageUtils";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Download, FileText, Receipt, CheckCircle, XCircle } from "lucide-react";
import { PdfAction } from "@/lib/pdfExport";
import { PdfActionButton } from "./PdfActionButton";

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

  const handlePdf = (type: "invoice" | "receipt", action: PdfAction) => {
    const company = loadCompanyProfile();
    handlePdfAction(action, type, invoice, company, includePpn, setIsPdfLoading);
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
      <div className={`flex items-center gap-4 rounded-2xl px-6 py-5 ${isSelesai ? "bg-emerald-50/80" : "bg-red-50/80"}`}>
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
        <div className="bg-slate-50/50 rounded-2xl p-5 space-y-2">
          <h3 className="font-bold text-sm text-slate-700">Data Pelanggan</h3>
          <p className="font-bold text-foreground text-base">{invoice.client?.name}</p>
          {invoice.client?.phone && <p className="text-xs text-slate-500">{invoice.client.phone}</p>}
          {invoice.client?.email && <p className="text-xs text-slate-500">{invoice.client.email}</p>}
          {invoice.client?.address && <p className="text-xs text-slate-500">{invoice.client.address}</p>}
          {invoice.notes && (
            <div className="pt-3 mt-1 border-t border-slate-100">
              <p className="text-xs text-slate-500">Lokasi Proyek: <span className="font-medium text-slate-700">{invoice.notes}</span></p>
            </div>
          )}
        </div>

        {/* Financial Summary */}
        <div className="bg-slate-50/50 rounded-2xl p-5 space-y-2 text-sm">
          <h3 className="font-bold text-slate-700">Ringkasan Nilai</h3>
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
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Ongkos Kirim</span>
            <span className="font-semibold">{(invoice.shipping_fee || 0) > 0 ? `+ ${fmt(invoice.shipping_fee)}` : "Rp 0"}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t font-extrabold">
            <span>Total</span><span className="text-lg">{fmt(invoice.total)}</span>
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="bg-slate-50/50 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-bold text-sm text-slate-700">Rincian Produk</h2>
        </div>
        <div className="divide-y divide-slate-100">
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
        <div className="bg-slate-50/50 rounded-2xl p-5 space-y-5">
          <p className="font-bold text-sm text-slate-700">Detail Perhitungan Margin</p>
          <div className="w-full overflow-x-auto">
            <table className="w-full text-xs text-right min-w-[350px]">
              <thead className="text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-2 px-2 text-left font-medium">Komponen</th>
                  <th className="py-2 px-2 font-medium">DPP</th>
                  <th className="py-2 px-2 font-medium">PPN 11%</th>
                  <th className="py-2 px-2 font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-2.5 px-2 text-left font-medium text-slate-600">Harga Jual</td>
                  <td className="py-2.5 px-2 text-slate-600">{fmt(margin.dealDPP)}</td>
                  <td className="py-2.5 px-2 text-slate-600">{fmt(margin.dealPPN)}</td>
                  <td className="py-2.5 px-2 font-bold text-emerald-600">{fmt(margin.dealTotal)}</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-2 text-left font-medium text-slate-600">Harga Dasar</td>
                  <td className="py-2.5 px-2 text-slate-600">{fmt(margin.ajmDPP)}</td>
                  <td className="py-2.5 px-2 text-slate-600">{fmt(margin.ajmPPN)}</td>
                  <td className="py-2.5 px-2 font-bold text-blue-600">{fmt(margin.ajmTotal)}</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-2 text-left font-medium text-slate-600">Harga Modal</td>
                  <td className="py-2.5 px-2 text-slate-600">{fmt(margin.hppDPP)}</td>
                  <td className="py-2.5 px-2 text-slate-600">{fmt(margin.hppPPN)}</td>
                  <td className="py-2.5 px-2 font-bold text-orange-600">{fmt(margin.hppTotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className="space-y-2 pt-3 border-t border-slate-200">
            {margin.totalEksternalFee > 0 && (
              <div className="flex justify-between text-rose-600 text-xs">
                <span>Fee Eksternal (Komisi)</span><span>- {fmt(margin.totalEksternalFee)}</span>
              </div>
            )}
            {margin.sisaPPN > 0 && (
              <div className="flex justify-between text-rose-600 text-xs">
                <span>Sisa Kelebihan PPN</span><span>- {fmt(margin.sisaPPN)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600 text-xs">
              <span>Total Margin Kotor</span><span className="font-semibold text-blue-700">{fmt(margin.grossMargin)}</span>
            </div>
            {(invoice.fee || 0) > 0 && (
              <div className="flex justify-between text-slate-500 text-xs">
                <span>Fee Lain / Operasional</span><span>- {fmt(invoice.fee)}</span>
              </div>
            )}
            <div className={`flex justify-between pt-3 border-t border-slate-200 font-bold text-base ${margin.netMargin >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              <span>Laba Bersih</span><span>{fmt(margin.netMargin)}</span>
            </div>
          </div>
        </div>
      )}

      {/* PDF Actions */}
      {isSelesai && (
        <div className="flex flex-col sm:flex-row gap-3">
          <PdfActionButton
            label="Kwitansi"
            icon={Receipt}
            isLoading={isPdfLoading}
            onAction={(action) => handlePdf("receipt", action)}
            className="w-full sm:w-1/2 h-11 font-bold text-xs gap-1.5 border-emerald-500 text-emerald-600 hover:bg-emerald-50"
          />
          <PdfActionButton
            label="Invoice"
            icon={FileText}
            isLoading={isPdfLoading}
            onAction={(action) => handlePdf("invoice", action)}
            className="w-full sm:w-1/2 h-11 font-bold text-xs gap-1.5 border-primary text-primary hover:bg-primary/10"
          />
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
