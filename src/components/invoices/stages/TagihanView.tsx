/**
 * TagihanView – Admin view untuk tahap Tagihan
 * Admin bisa konfirmasi HPP beli (buy_in_price), cetak invoice, lanjut ke PO.
 */
import { useState, useMemo } from "react";
import { Invoice, InvoiceItemInput } from "@/types/invoice";
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
import { ArrowRight, Info, Save, FileText } from "lucide-react";
import { PdfAction } from "@/lib/pdfExport";
import { PdfActionButton } from "./PdfActionButton";

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
      supplier: (i as any).supplier || null,
      sort_order: i.sort_order,
    }))
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(false);

  const subtotal = useMemo(
    () => items.reduce((s, i) => s + Number(i.quantity || 0) * Number(i.unit_price || 0), 0),
    [items]
  );
  const includePpn = Math.abs((invoice.tax || 0) - invoice.subtotal * 0.11) < 100 && (invoice.tax || 0) > 0;
  const tax = includePpn ? Math.round(subtotal * 0.11) : invoice.tax || 0;
  const total = Math.max(0, subtotal - (invoice.discount || 0) + tax + (invoice.shipping_fee || 0));

  const margin = useMemo(() => {
    const tempItems = items.map((i, idx) => ({
      ...invoice.items[idx],
      description: i.description,
      quantity: Number(i.quantity || 0),
      actual_quantity: null,
      unit_price: Number(i.unit_price || 0),
      buy_in_price: Number(i.buy_in_price || 0),
      line_total: 0,
      sort_order: idx,
    }));
    return calcMargin({ ...invoice, items: tempItems, fee: 0 });
  }, [items, invoice]);

  const updateItem = (idx: number, key: keyof InvoiceItemInput, val: string | number | null) =>
    setItems((prev) => prev.map((item, i) => i === idx ? { ...item, [key]: val } : item));

  const save = async (nextStatus?: string) => {
    const invalidItem = items.find(
      (item) => Number(item.buy_in_price || 0) > Number(item.unit_price || 0)
    );
    if (invalidItem) {
      if (nextStatus) {
        alert(`HPP Beli untuk produk "${invalidItem.description}" tidak boleh lebih besar dari Harga Jual!`);
      }
      return;
    }

    setIsSaving(true);
    try {
      const payload: any = {
        fee: 0,
        items: items.map((item, idx) => ({
          ...item,
          quantity: Number(item.quantity || 0),
          unit_price: Number(item.unit_price || 0),
          buy_in_price: Number(item.buy_in_price || 0),
          sort_order: idx,
        })),
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

  const downloadInv = (action: PdfAction) => {
    const company = loadCompanyProfile();
    const includePpn = Math.abs((invoice.tax || 0) - invoice.subtotal * 0.11) < 100 && (invoice.tax || 0) > 0;
    
    const upd: Invoice = {
      ...invoice,
      items: items.map((item, idx) => ({
        ...item,
        id: item.id || `temp-${idx}`,
        invoice_id: invoice.id,
        actual_quantity: null,
        unit_price: Number(item.unit_price || 0),
        buy_in_price: Number(item.buy_in_price || 0),
        line_total: Number(item.quantity || 0) * Number(item.unit_price || 0),
        sort_order: idx,
      })),
    };
    handlePdfAction(action, "invoice", upd, company, includePpn, setIsPdfLoading);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-0.5 text-xs font-bold mb-2">Tagihan</span>
          <h1 className="text-2xl font-black text-foreground">{invoice.invoice_number}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            <span className="font-semibold text-foreground">{invoice.client?.name}</span>
            {invoice.client?.phone && <span> · {invoice.client.phone}</span>}
          </p>
          {invoice.notes && <p className="text-xs text-muted-foreground mt-0.5">Lokasi: {invoice.notes}</p>}
        </div>
        <PdfActionButton
          label="Cetak Invoice"
          icon={FileText}
          isLoading={isPdfLoading}
          onAction={downloadInv}
          className="h-9 text-xs font-bold gap-1.5 border-primary text-primary hover:bg-primary/10 shrink-0"
        />
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
        {/* Products with HPP */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-sm">Konfirmasi HPP Beli</h2>
          </div>

          {/* Table Headers for Desktop */}
          <div className="hidden md:grid md:grid-cols-[1fr_80px_140px_120px_100px] gap-3 px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <div>Produk</div>
            <div className="text-center">Vol Deal</div>
            <div>Supplier Pengadaan</div>
            <div className="text-right text-orange-600">HPP Beli (Rp)</div>
            <div className="text-right">Harga Jual</div>
          </div>

          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={idx} className="bg-card border rounded-2xl p-4 md:p-3 space-y-3 md:space-y-0 md:grid md:grid-cols-[1fr_80px_140px_120px_100px] md:gap-3 md:items-center shadow-xs">
                {/* Product Name & Info Header */}
                <div className="border-b pb-2 md:border-0 md:pb-0 space-y-1">
                  <p className="font-bold text-sm md:text-xs text-foreground leading-snug break-words" title={item.description}>
                    {item.description.split(" - ")[0]}
                  </p>
                  <div className="flex items-center justify-between text-[11px] md:hidden">
                    <span className="text-muted-foreground font-semibold">
                      Vol: <strong className="text-foreground">{Number(item.quantity || 0).toLocaleString("id-ID")} m³</strong>
                    </span>
                    <span className="text-muted-foreground font-semibold">
                      Harga Jual: <strong className="text-foreground">{fmt(item.unit_price)}</strong>
                    </span>
                  </div>
                </div>

                {/* Volume (Desktop Only) */}
                <div className="hidden md:block text-center font-bold text-xs text-foreground">
                  {Number(item.quantity || 0).toLocaleString("id-ID")} m³
                </div>

                {/* Supplier Field */}
                <div className="space-y-1 md:space-y-0">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block md:hidden">Supplier Pengadaan</label>
                  <select
                    value={(item as any).supplier || "KOKO SUPPLIER"}
                    onChange={(e) => {
                      updateItem(idx, "supplier" as any, e.target.value);
                      setTimeout(() => save(), 50);
                    }}
                    className="h-9 md:h-8 w-full rounded-lg border border-input bg-background px-2.5 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary truncate"
                  >
                    <option value="KOKO SUPPLIER">KOKO SUPPLIER</option>
                    <option value="MITRA1">MITRA1</option>
                    <option value="MITRA2">MITRA2</option>
                    <option value="MITRA3">MITRA3</option>
                  </select>
                </div>

                {/* HPP Beli Input */}
                <div className="space-y-1 md:space-y-0">
                  <label className="text-[10px] font-bold text-orange-600 uppercase block md:hidden">HPP Beli (Rp)</label>
                  <Input
                    type="number" min="0"
                    value={item.buy_in_price || ""}
                    onChange={(e) => updateItem(idx, "buy_in_price", e.target.value ? Number(e.target.value) : 0)}
                    onBlur={() => save()}
                    placeholder="0"
                    className="h-9 md:h-8 w-full text-right text-xs px-2.5 border-orange-300 bg-orange-50/60 focus-visible:ring-orange-400 font-bold"
                  />
                </div>

                {/* Harga Jual (Desktop Only) */}
                <div className="hidden md:block text-right text-xs font-bold text-foreground">
                  {fmt(item.unit_price)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Summary & Margin */}
        <div className="space-y-4 lg:sticky lg:top-4">
          {/* Total */}
          <div className="bg-slate-50/50 rounded-2xl p-5 space-y-2">
            <h3 className="font-bold text-sm text-slate-700">Nilai Transaksi</h3>
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
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Ongkos Kirim</span>
              <span className="font-semibold">{(invoice.shipping_fee || 0) > 0 ? `+ ${fmt(invoice.shipping_fee)}` : "Rp 0"}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t font-extrabold">
              <span className="text-sm">Total</span>
              <span className="text-lg">{fmt(total)}</span>
            </div>
          </div>

          {/* Margin Panel */}
          <div className="bg-slate-50/50 rounded-2xl p-4 md:p-5 space-y-4 border">
            <p className="font-bold text-sm text-slate-700">Estimasi Margin</p>
            
            <div className="w-full overflow-x-auto no-scrollbar border-b pb-2">
              <table className="w-full text-xs text-right min-w-[280px]">
                <thead className="text-slate-500 border-b border-slate-200 text-[10px] uppercase font-bold">
                  <tr>
                    <th className="py-1.5 px-1 text-left">Komponen</th>
                    <th className="py-1.5 px-1">DPP</th>
                    <th className="py-1.5 px-1">PPN 11%</th>
                    <th className="py-1.5 px-1">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-2 px-1 text-left font-medium text-slate-600">Harga Jual</td>
                    <td className="py-2 px-1 text-slate-600 text-[11px]">{fmt(margin.dealDPP)}</td>
                    <td className="py-2 px-1 text-slate-600 text-[11px]">{fmt(margin.dealPPN)}</td>
                    <td className="py-2 px-1 font-bold text-emerald-600 text-[11px]">{fmt(margin.dealTotal)}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-1 text-left font-medium text-slate-600">Harga Dasar</td>
                    <td className="py-2 px-1 text-slate-600 text-[11px]">{fmt(margin.ajmDPP)}</td>
                    <td className="py-2 px-1 text-slate-600 text-[11px]">{fmt(margin.ajmPPN)}</td>
                    <td className="py-2 px-1 font-bold text-blue-600 text-[11px]">{fmt(margin.ajmTotal)}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-1 text-left font-medium text-slate-600">Harga Modal</td>
                    <td className="py-2 px-1 text-slate-600 text-[11px]">{fmt(margin.hppDPP)}</td>
                    <td className="py-2 px-1 text-slate-600 text-[11px]">{fmt(margin.hppPPN)}</td>
                    <td className="py-2 px-1 font-bold text-orange-600 text-[11px]">{fmt(margin.hppTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="space-y-2 pt-1 text-xs">
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
              <div className={`flex justify-between items-center pt-2.5 border-t border-slate-200 font-bold text-sm md:text-base ${margin.netMargin >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                <span>Laba Bersih</span>
                <span>{fmt(margin.netMargin)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
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
