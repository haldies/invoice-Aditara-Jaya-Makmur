/**
 * PengirimanView – Admin view untuk tahap Pengiriman
 * Admin isi volume aktual terkirim per item, lihat selisih vol, cetak, lanjut ke Selesai.
 */
import { useState, useMemo } from "react";
import { Invoice } from "@/types/invoice";
import { useInvoices } from "@/hooks/useInvoices";
import { loadCompanyProfile } from "@/lib/companyProfile";
import { fmt, fmtDate, handleDownloadPDF, calcMargin } from "./stageUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Save, Download, ArrowRight, AlertTriangle, CheckCircle, Truck } from "lucide-react";

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
  const [commissions, setCommissions] = useState<number[]>(
    invoice.items.map((i) => i.commission_rate || 5000)
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(false);

  const updatedItems = useMemo(
    () =>
      invoice.items.map((item, idx) => ({
        ...item,
        actual_quantity: actualQtys[idx],
        commission_rate: commissions[idx],
      })),
    [invoice.items, actualQtys, commissions]
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
  const total = Math.max(0, subtotal - (invoice.discount || 0) + tax);
  const margin = useMemo(() => calcMargin({ ...invoice, items: updatedItems }), [invoice, updatedItems]);

  const save = async (nextStatus?: string) => {
    setIsSaving(true);
    try {
      const payload: any = {
        items: invoice.items.map((item, idx) => ({
          description: item.description,
          quantity: item.quantity,
          actual_quantity: actualQtys[idx],
          unit_price: item.unit_price,
          buy_in_price: item.buy_in_price,
          commission_rate: commissions[idx],
          sort_order: item.sort_order,
        })),
        version: invoice.version,
      };
      if (nextStatus) payload.status = nextStatus;
      const updated = await updateInvoice(invoice.id, payload);
      onUpdated(updated);
    } catch (e: any) {
      alert(e?.message || "Gagal menyimpan");
    } finally {
      setIsSaving(false);
    }
  };

  const download = () => {
    const company = loadCompanyProfile();
    handleDownloadPDF("invoice", { ...invoice, items: updatedItems }, company, includePpn, setIsPdfLoading);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-700 px-2.5 py-0.5 text-xs font-bold mb-2 gap-1">
            <Truck className="h-3 w-3" /> Pengiriman
          </span>
          <h1 className="text-2xl font-black text-foreground">{invoice.invoice_number}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            <span className="font-semibold text-foreground">{invoice.client?.name}</span>
            {invoice.client?.phone && <span> · {invoice.client.phone}</span>}
          </p>
          {invoice.notes && <p className="text-xs text-muted-foreground mt-0.5">Lokasi: {invoice.notes}</p>}
          {invoice.due_date && <p className="text-xs text-muted-foreground">Tgl Pengiriman: {fmtDate(invoice.due_date)}</p>}
        </div>
        <Button onClick={download} disabled={isPdfLoading} variant="outline" size="sm" className="h-9 text-xs font-bold gap-1.5 border-primary text-primary hover:bg-primary/10 shrink-0">
          <Download className="h-3.5 w-3.5" /> Cetak Invoice
        </Button>
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
          <div className="hidden sm:grid grid-cols-[1fr_80px_80px_100px] gap-2 px-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <div>Produk</div>
            <div className="text-center">Vol Deal</div>
            <div className="text-center text-primary">Vol Aktual</div>
            <div className="text-right">Komisi/m³</div>
          </div>

          <div className="space-y-2">
            {invoice.items.map((item, idx) => {
              const dealQty = item.quantity;
              const actual = actualQtys[idx];
              const selisih = actual != null ? actual - dealQty : null;

              return (
                <div key={idx} className="space-y-1">
                  <div className="flex flex-col sm:grid sm:grid-cols-[1fr_80px_80px_100px] gap-2 sm:items-center bg-card border rounded-xl px-3 py-3">
                    <div className="mb-1 sm:mb-0">
                      <p className="font-semibold text-xs text-foreground line-clamp-2" title={item.description}>{item.description}</p>
                      <p className="text-[10px] text-muted-foreground">{fmt(item.unit_price)}/m³ · HPP: {fmt(item.buy_in_price)}</p>
                    </div>
                    <div className="flex items-center justify-between sm:justify-center">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold sm:hidden">Vol Deal</span>
                      <span className="text-center text-xs font-bold text-muted-foreground">
                        {Number(dealQty).toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between sm:justify-center">
                      <span className="text-[10px] text-primary uppercase font-bold sm:hidden">Vol Aktual</span>
                      <Input
                        type="number" min="0" step="any"
                        value={actual ?? ""}
                        placeholder={String(dealQty)}
                        onChange={(e) => {
                          const v = e.target.value === "" ? null : Number(e.target.value);
                          setActualQtys((prev) => prev.map((q, i) => i === idx ? v : q));
                        }}
                        className={`h-8 w-28 sm:w-full text-center text-xs px-1 font-bold ${selisih != null && selisih < 0 ? "border-amber-400 bg-amber-50" : selisih != null && selisih > 0 ? "border-blue-300 bg-blue-50" : "border-slate-300"}`}
                      />
                    </div>
                    <div className="flex items-center justify-between sm:justify-end">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold sm:hidden">Komisi/m³</span>
                      <Input
                        type="number" min="0" step="any"
                        value={commissions[idx] ?? ""}
                        onChange={(e) => {
                          const v = Number(e.target.value) || 0;
                          setCommissions((prev) => prev.map((c, i) => i === idx ? v : c));
                        }}
                        className="h-8 w-28 sm:w-full text-right text-xs px-1.5 border-slate-200 bg-slate-50/50"
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
            <div className="flex justify-between items-center pt-2 border-t font-extrabold">
              <span>Total Tagih</span><span className="text-lg">{fmt(total)}</span>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/30 border rounded-xl p-4 space-y-2 text-xs">
            <p className="font-bold text-sm">Margin Aktual</p>
            <div className="flex justify-between text-muted-foreground">
              <span>Total Deal</span><span className="font-semibold">{fmt(margin.totalDeal)}</span>
            </div>
            {margin.totalEksternalFee > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Fee Eksternal (Komisi)</span><span>- {fmt(margin.totalEksternalFee)}</span>
              </div>
            )}
            <div className="flex justify-between text-muted-foreground">
              <span>AJM</span><span className="font-semibold text-blue-700">{fmt(margin.totalAjm)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>HPP Terpakai</span><span className="font-semibold text-orange-700">- {fmt(margin.totalHpp)}</span>
            </div>
            <div className={`flex justify-between pt-2 border-t font-bold ${margin.netMargin >= 0 ? "text-emerald-700" : "text-red-600"}`}>
              <span>Laba Bersih</span><span>{fmt(margin.netMargin)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Button type="button" onClick={() => save()} disabled={isSaving} variant="outline" className="w-full h-10 font-bold text-xs">
              <Save className="h-4 w-4 mr-1.5" />
              {isSaving ? "Menyimpan..." : "Simpan Volume"}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" className="w-full h-11 font-bold text-sm bg-primary text-primary-foreground hover:bg-primary/90" disabled={isSaving}>
                  Tandai Selesai
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
                    Ya, Selesai
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
