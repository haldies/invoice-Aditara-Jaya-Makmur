/**
 * TagihanView – Admin view untuk tahap Tagihan
 * Admin bisa konfirmasi HPP beli (buy_in_price), cetak invoice, lanjut ke PO.
 */
import { useState, useMemo } from "react";
import { Invoice, InvoiceItemInput } from "@/types/invoice";
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
import { Save, Download, ArrowRight, Info } from "lucide-react";

interface Props {
  invoice: Invoice;
  onUpdated: (updated: Invoice) => void;
}

export function TagihanView({ invoice, onUpdated }: Props) {
  const { updateInvoice } = useInvoices();

  const [items, setItems] = useState<InvoiceItemInput[]>(
    invoice.items.map((i) => ({
      description: i.description,
      quantity: i.quantity,
      actual_quantity: i.actual_quantity,
      unit_price: i.unit_price,
      buy_in_price: i.buy_in_price || 0,
      commission_rate: i.commission_rate || 5000,
      sort_order: i.sort_order,
    }))
  );
  const [fee, setFee] = useState(invoice.fee || 0);
  const [isSaving, setIsSaving] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(false);

  const subtotal = useMemo(
    () => items.reduce((s, i) => s + Number(i.quantity || 0) * Number(i.unit_price || 0), 0),
    [items]
  );
  const includePpn = Math.abs((invoice.tax || 0) - invoice.subtotal * 0.11) < 100 && (invoice.tax || 0) > 0;
  const tax = includePpn ? Math.round(subtotal * 0.11) : invoice.tax || 0;
  const total = Math.max(0, subtotal - (invoice.discount || 0) + tax);

  const margin = useMemo(() => {
    const tempItems = items.map((i, idx) => ({
      ...invoice.items[idx],
      description: i.description,
      quantity: Number(i.quantity || 0),
      actual_quantity: null,
      unit_price: Number(i.unit_price || 0),
      buy_in_price: Number(i.buy_in_price || 0),
      commission_rate: Number(i.commission_rate || 0),
      line_total: 0,
    }));
    return calcMargin({ ...invoice, items: tempItems, fee: Number(fee || 0) });
  }, [items, fee, invoice]);

  const updateItem = (idx: number, key: keyof InvoiceItemInput, val: string | number | null) =>
    setItems((prev) => prev.map((item, i) => i === idx ? { ...item, [key]: val } : item));

  const save = async (nextStatus?: string) => {
    setIsSaving(true);
    try {
      const payload: any = {
        fee: Number(fee || 0),
        items: items.map((item, idx) => ({
          ...item,
          quantity: Number(item.quantity || 0),
          unit_price: Number(item.unit_price || 0),
          buy_in_price: Number(item.buy_in_price || 0),
          sort_order: idx,
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

  const downloadInv = () => {
    const company = loadCompanyProfile();
    const upd: Invoice = {
      ...invoice,
      fee: Number(fee || 0),
      items: items.map((item, idx) => ({
        id: invoice.items[idx]?.id || `t-${idx}`,
        invoice_id: invoice.id,
        description: item.description,
        quantity: Number(item.quantity || 0),
        actual_quantity: null,
        unit_price: Number(item.unit_price || 0),
        buy_in_price: Number(item.buy_in_price || 0),
        commission_rate: Number(item.commission_rate || 5000),
        line_total: Number(item.quantity || 0) * Number(item.unit_price || 0),
        sort_order: idx,
      })),
    };
    handleDownloadPDF("invoice", upd, company, includePpn, setIsPdfLoading);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-700 px-2.5 py-0.5 text-xs font-bold mb-2">Tagihan</span>
          <h1 className="text-2xl font-black text-foreground">{invoice.invoice_number}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            <span className="font-semibold text-foreground">{invoice.client?.name}</span>
            {invoice.client?.phone && <span> · {invoice.client.phone}</span>}
          </p>
          {invoice.notes && <p className="text-xs text-muted-foreground mt-0.5">Lokasi: {invoice.notes}</p>}
        </div>
        <Button onClick={downloadInv} disabled={isPdfLoading} variant="outline" size="sm" className="h-9 text-xs font-bold gap-1.5 border-primary text-primary hover:bg-primary/10 shrink-0">
          <Download className="h-3.5 w-3.5" /> Cetak Invoice
        </Button>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
        {/* Products with HPP */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-sm">Konfirmasi HPP Beli</h2>
            <div className="flex items-center gap-1 bg-blue-50 text-blue-700 rounded-full px-2 py-0.5">
              <Info className="h-3 w-3 shrink-0" />
              <span className="text-[10px] font-medium">Isi harga modal (buy-in) per produk</span>
            </div>
          </div>

          {/* Column Headers */}
          <div className="hidden sm:grid grid-cols-[1fr_80px_100px_100px] gap-2 px-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <div>Produk</div>
            <div className="text-center">Vol Deal</div>
            <div className="text-right text-orange-600">HPP Beli</div>
            <div className="text-right">Harga Jual</div>
          </div>

          <div className="space-y-1.5">
            {items.map((item, idx) => (
              <div key={idx} className="flex flex-col sm:grid sm:grid-cols-[1fr_80px_100px_100px] gap-2 sm:items-center bg-card border rounded-xl px-3 py-3">
                <div className="mb-1 sm:mb-0">
                  <p className="font-semibold text-xs text-foreground line-clamp-2" title={item.description}>{item.description}</p>
                </div>
                <div className="flex items-center justify-between sm:justify-center">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold sm:hidden">Vol Deal</span>
                  <span className="font-bold text-xs text-center">{Number(item.quantity || 0).toLocaleString("id-ID")}</span>
                </div>
                <div className="flex items-center justify-between sm:justify-end">
                  <span className="text-[10px] text-orange-600 uppercase font-bold sm:hidden">HPP Beli</span>
                  <Input
                    type="number" min="0"
                    value={item.buy_in_price || ""}
                    onChange={(e) => updateItem(idx, "buy_in_price", e.target.value ? Number(e.target.value) : 0)}
                    placeholder="0"
                    className="h-8 w-28 sm:w-full text-right text-xs px-1.5 border-orange-200 bg-orange-50/50 focus-visible:ring-orange-300"
                  />
                </div>
                <div className="flex items-center justify-between sm:justify-end">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold sm:hidden">Harga Jual</span>
                  <div className="text-right text-xs font-semibold text-muted-foreground">
                    {fmt(item.unit_price)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Summary & Margin */}
        <div className="space-y-4 lg:sticky lg:top-4">
          {/* Total */}
          <div className="bg-card border rounded-xl p-4 space-y-2">
            <h3 className="font-bold text-sm">Nilai Transaksi</h3>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Subtotal</span>
              <span className="font-semibold text-foreground">{fmt(subtotal)}</span>
            </div>
            {(invoice.discount || 0) > 0 && (
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Diskon</span>
                <span className="font-semibold text-red-600">- {fmt(invoice.discount)}</span>
              </div>
            )}
            {tax > 0 && (
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>PPN 11%</span>
                <span className="font-semibold">+ {fmt(tax)}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t font-extrabold">
              <span className="text-sm">Total</span>
              <span className="text-lg">{fmt(total)}</span>
            </div>
          </div>

          {/* Margin Panel */}
          <div className="bg-slate-50 dark:bg-slate-900/30 border rounded-xl p-4 space-y-2 text-xs">
            <p className="font-bold text-sm text-foreground">Estimasi Margin</p>
            <div className="flex justify-between text-muted-foreground">
              <span>Total HPP (Tanpa PPN)</span>
              <span className="font-semibold text-orange-700">{fmt(margin.totalHpp)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>+ PPN ke Supplier (11%)</span>
              <span className="font-semibold text-orange-600">{fmt(margin.ppnSupplier)}</span>
            </div>
            <div>
              <Label className="text-[10px] uppercase font-semibold text-muted-foreground">Fee / Biaya Lain (Rp)</Label>
              <Input
                type="number" min="0"
                value={fee || ""}
                onChange={(e) => setFee(Number(e.target.value) || 0)}
                placeholder="0"
                className="h-8 text-xs mt-1"
              />
            </div>
            <div className={`flex justify-between items-center pt-2 border-t font-bold ${margin.netMargin >= 0 ? "text-emerald-700" : "text-red-600"}`}>
              <span>Laba Bersih</span>
              <span>{fmt(margin.netMargin)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <Button type="button" onClick={() => save()} disabled={isSaving} variant="outline" className="w-full h-10 font-bold text-xs">
              <Save className="h-4 w-4 mr-1.5" />
              {isSaving ? "Menyimpan..." : "Simpan HPP"}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" className="w-full h-11 font-bold text-sm bg-primary text-primary-foreground hover:bg-primary/90" disabled={isSaving}>
                  Lanjut ke PO
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Lanjut ke Purchase Order?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Pastikan HPP beli sudah diisi dengan benar sebelum melanjutkan.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction onClick={() => save("po")} className="bg-primary text-primary-foreground hover:bg-primary/90">
                    Ya, Ke PO
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
