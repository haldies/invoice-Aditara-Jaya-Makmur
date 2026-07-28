/**
 * PengirimanView – Admin view untuk tahap Pengiriman
 * Admin isi volume aktual terkirim per item, lihat selisih vol, cetak, lanjut ke Selesai.
 */
import { useState, useMemo } from "react";
import { Invoice } from "@/types/invoice";
import { useInvoices } from "@/hooks/useInvoices";
import { loadCompanyProfile } from "@/lib/companyProfile";
import { fmt, fmtDate, handleDownloadPDF, calcMargin, handlePdfAction } from "./stageUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ArrowRight, Save, Truck, FileText, AlertTriangle, CheckCircle } from "lucide-react";
import { PdfAction } from "@/lib/pdfExport";
import { PdfActionButton } from "./PdfActionButton";

interface Props {
  invoice: Invoice;
  onUpdated: (updated: Invoice) => void;
}

export function PengirimanView({ invoice, onUpdated }: Props) {
  const { updateInvoice } = useInvoices();
  const includePpn = Math.abs((invoice.tax || 0) - invoice.subtotal * 0.11) < 100 && (invoice.tax || 0) > 0;

  const [actualQtys, setActualQtys] = useState<(number | null)[]>(
    invoice.items.map((i) => i.actual_quantity)
  );
  const [paidAmount, setPaidAmount] = useState(invoice.amount_paid || 0);

  const [isSaving, setIsSaving] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(false);

  const updatedItems = useMemo(
    () =>
      invoice.items.map((item, idx) => ({
        ...item,
        actual_quantity: actualQtys[idx],
      })),
    [invoice.items, actualQtys]
  );

  const subtotal = useMemo(
    () =>
      updatedItems.reduce((s, item) => {
        const qty = item.actual_quantity != null ? item.actual_quantity : item.quantity;
        return s + qty * item.unit_price;
      }, 0),
    [updatedItems]
  );

  const tax = includePpn ? Math.round(subtotal * 0.11) : invoice.tax || 0;
  const total = Math.max(0, subtotal - (invoice.discount || 0) + tax + (invoice.shipping_fee || 0));
  const margin = useMemo(() => calcMargin({ ...invoice, items: updatedItems }), [invoice, updatedItems]);

  const save = async (nextStatus?: string) => {
    setIsSaving(true);
    try {
      const payload: any = {
        items: invoice.items.map((item, idx) => ({
          description: item.description,
          quantity: item.quantity,
          actual_quantity: actualQtys[idx],
          unit_price: Number(item.unit_price || 0),
          buy_in_price: Number(item.buy_in_price || 0),
          sort_order: item.sort_order,
        })),
        amount_paid: paidAmount,
      };
      if (nextStatus) {
        payload.status = nextStatus;
        payload.version = invoice.version;
      }
      const updated = await updateInvoice(invoice.id, payload);
      onUpdated(updated);
    } catch (e: any) {
      alert(e?.message || "Gagal menyimpan");
    } finally {
      setIsSaving(false);
    }
  };

  const download = (action: PdfAction) => {
    const company = loadCompanyProfile();
    handlePdfAction(action, "invoice", { ...invoice, items: updatedItems }, company, includePpn, setIsPdfLoading);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-0.5 text-xs font-bold mb-2">Pengiriman</span>
          <h1 className="text-2xl font-black text-foreground">{invoice.invoice_number}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            <span className="font-semibold text-foreground">{invoice.client?.name}</span>
            {invoice.client?.phone && <span> · {invoice.client.phone}</span>}
          </p>
          {invoice.notes && <p className="text-xs text-muted-foreground mt-0.5">Lokasi: {invoice.notes}</p>}
          {invoice.due_date && <p className="text-xs text-muted-foreground mt-0.5">Tgl Pengiriman: {fmtDate(invoice.due_date)}</p>}
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto mt-2 sm:mt-0 shrink-0">
          <PdfActionButton
            label="Cetak Invoice"
            icon={FileText}
            isLoading={isPdfLoading}
            onAction={download}
            className="h-9 w-full sm:w-auto text-xs font-bold gap-1.5 border-primary text-primary hover:bg-primary/10"
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_300px] gap-6 items-start">
        {/* Items: Volume Aktual */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-sm">Volume Aktual Terkirim</h2>
          </div>
          <p className="text-xs text-muted-foreground bg-blue-50 text-blue-700 rounded-lg px-3 py-2">
            Isi volume/qty yang benar-benar terkirim. Boleh berbeda dari volume deal.
          </p>

          {/* Column Headers */}
          <div className="hidden sm:grid grid-cols-[1fr_80px_80px] gap-2 px-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <div>Produk</div>
            <div className="text-center">Vol Deal</div>
            <div className="text-center text-primary">Vol Aktual</div>
          </div>

          <div className="space-y-2">
            {invoice.items.map((item, idx) => {
              const dealQty = item.quantity;
              const actual = actualQtys[idx];
              const selisih = actual != null ? actual - dealQty : null;

              return (
                <div key={idx} className="space-y-1">
                  <div className="flex flex-col sm:grid sm:grid-cols-[1fr_80px_80px] gap-2 sm:items-center bg-card border rounded-xl px-3 py-3">
                    <div className="mb-1 sm:mb-0">
                      <p className="font-semibold text-xs text-foreground line-clamp-2" title={item.description}>{item.description}</p>
                      <p className="text-[10px] text-muted-foreground">{fmt(item.unit_price)}/m³ · HPP: {fmt(item.buy_in_price)}</p>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between sm:justify-center gap-1 sm:gap-2">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold sm:hidden">Vol Deal</span>
                      <span className="text-center text-xs font-bold text-muted-foreground">
                        {Number(dealQty).toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between sm:justify-center gap-1 sm:gap-2">
                      <span className="text-[10px] text-primary uppercase font-bold sm:hidden">Vol Aktual</span>
                      <Input
                        type="number" min="0" step="any"
                        value={actual ?? ""}
                        placeholder={String(dealQty)}
                        onChange={(e) => {
                          const v = e.target.value === "" ? null : Number(e.target.value);
                          setActualQtys((prev) => prev.map((q, i) => i === idx ? v : q));
                        }}
                        onBlur={() => save()}
                        className={`h-8 w-28 sm:w-full text-center text-xs px-1 font-bold ${selisih != null && selisih < 0 ? "border-amber-400 bg-amber-50" : selisih != null && selisih > 0 ? "border-blue-300 bg-blue-50" : "border-slate-300"}`}
                      />
                    </div>
                  </div>
                  {/* Selisih indicator */}
                  {selisih != null && selisih !== 0 && (
                    <div className={`flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-lg ${selisih < 0 ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"}`}>
                      <AlertTriangle className="h-3 w-3 shrink-0" />
                      {selisih < 0
                        ? `Kurang ${Math.abs(selisih)} m³ dari deal (${dealQty} m³) — total disesuaikan`
                        : `Lebih ${selisih} m³ dari deal — perlu konfirmasi`}
                    </div>
                  )}
                  {selisih === 0 && (
                    <div className="flex items-center gap-1.5 text-[10px] px-3 py-1 text-slate-500">
                      <CheckCircle className="h-3 w-3" /> Volume sama dengan deal ✓
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Totals & Margin */}
        <div className="space-y-4 lg:sticky lg:top-4">
          <div className="bg-card border rounded-xl p-4 space-y-2 text-sm">
            <h3 className="font-bold">Total (Vol Aktual)</h3>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Subtotal (Aktual)</span><span className="font-semibold text-foreground">{fmt(subtotal)}</span>
            </div>
            {(invoice.discount || 0) > 0 && (
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Diskon</span><span className="font-semibold text-red-600">- {fmt(invoice.discount)}</span>
              </div>
            )}
            {tax > 0 && (
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>PPN 11%</span><span className="font-semibold">+ {fmt(tax)}</span>
              </div>
            )}
            {(invoice.shipping_fee || 0) > 0 && (
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Ongkos Kirim</span><span className="font-semibold">+ {fmt(invoice.shipping_fee)}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t font-extrabold">
              <span>Total Tagih</span><span className="text-lg">{fmt(total)}</span>
            </div>
            <div className="pt-3 border-t mt-3">
              <Label className="text-[10px] uppercase font-semibold text-slate-500 mb-1 block">Konfirmasi Pembayaran (Rp)</Label>
              <Input
                type="number" min="0" step="any"
                value={paidAmount || ""}
                onChange={(e) => setPaidAmount(Number(e.target.value) || 0)}
                onBlur={() => save()}
                placeholder={String(Math.round(total))}
                className="h-9 w-full text-right font-bold focus-visible:ring-emerald-500 border-emerald-200 bg-emerald-50/30 text-emerald-700"
              />
              {paidAmount > 0 && paidAmount < Math.round(total) && (
                <p className="text-[10px] text-amber-600 mt-1.5 font-medium flex justify-between">
                  <span>Kurang bayar:</span> <span>{fmt(Math.round(total) - paidAmount)}</span>
                </p>
              )}
              {paidAmount > Math.round(total) && (
                <p className="text-[10px] text-blue-600 mt-1.5 font-medium flex justify-between">
                  <span>Lebih bayar:</span> <span>{fmt(paidAmount - Math.round(total))}</span>
                </p>
              )}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/30 border rounded-xl p-4 space-y-2 text-xs">
            <p className="font-bold text-sm">Margin Aktual</p>
            <div className="flex justify-between text-muted-foreground">
              <span>Total Deal (Penjualan)</span><span className="font-semibold">{fmt(margin.dealDPP)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>HPP Terpakai</span><span className="font-semibold text-orange-700">- {fmt(margin.hppDPP)}</span>
            </div>
            <div className={`flex justify-between pt-2 border-t font-bold ${margin.dealDPP - margin.hppDPP >= 0 ? "text-emerald-700" : "text-red-600"}`}>
              <span>Laba Bersih</span><span>{fmt(margin.dealDPP - margin.hppDPP)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" className="w-full h-11 font-bold text-sm bg-primary text-primary-foreground hover:bg-primary/90" disabled={isSaving}>
                  Selesaikan Transaksi
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Selesaikan Transaksi?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Transaksi akan ditandai SELESAI. Pastikan volume aktual sudah diisi dengan benar.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction onClick={() => save("selesai")} className="bg-primary text-primary-foreground hover:bg-primary/90">
                    Selesaikan Transaksi
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  );
}
