/**
 * POView – Admin view untuk tahap Purchase Order
 * Review produk & HPP, cetak PO/Invoice, lanjut ke Pengiriman.
 */
import { useState } from "react";
import { ArrowRight, Save, ShoppingCart, FileText } from "lucide-react";
import { PdfAction } from "@/lib/pdfExport";
import { PdfActionButton } from "./PdfActionButton";
import { Invoice } from "@/types/invoice";
import { useInvoices } from "@/hooks/useInvoices";
import { loadCompanyProfile } from "@/lib/companyProfile";
import { fmt, fmtDate, handleDownloadPDF, handlePdfAction, calcMargin } from "./stageUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Props {
  invoice: Invoice;
  onUpdated: (updated: Invoice) => void;
}

export function POView({ invoice, onUpdated }: Props) {
  const { updateInvoice } = useInvoices();
  const [isSaving, setIsSaving] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(false);

  const margin = calcMargin(invoice);
  const includePpn = Math.abs((invoice.tax || 0) - invoice.subtotal * 0.11) < 100 && (invoice.tax || 0) > 0;

  const advance = async (status: string) => {
    setIsSaving(true);
    try {
      const payload: any = { status: status as any, version: invoice.version };
      const updated = await updateInvoice(invoice.id, payload);
      onUpdated(updated);
    } catch (e: any) {
      alert(e?.message || "Gagal memperbarui status");
    } finally {
      setIsSaving(false);
    }
  };

  const download = (type: "invoice" | "po", action: PdfAction) => {
    const company = loadCompanyProfile();
    handlePdfAction(action, type, invoice, company, includePpn, setIsPdfLoading);
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-0.5 text-xs font-bold mb-2">Purchase Order</span>
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
            label="Cetak PO"
            icon={ShoppingCart}
            isLoading={isPdfLoading}
            onAction={(action) => download("po", action)}
            className="h-9 w-full sm:w-auto text-xs font-bold gap-1.5 border-primary text-primary hover:bg-primary/10"
          />
          <PdfActionButton
            label="Cetak Invoice"
            icon={FileText}
            isLoading={isPdfLoading}
            onAction={(action) => download("invoice", action)}
            className="h-9 w-full sm:w-auto text-xs font-bold gap-1.5 border-primary text-primary hover:bg-primary/10"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {/* Products Table */}
        <div className="sm:col-span-2 bg-card border rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b">
            <h2 className="font-bold text-sm">
              Item Purchase Order
            </h2>
          </div>
          <div className="divide-y">
            {invoice.items.map((item, idx) => (
              <div key={idx} className="px-4 py-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-4">
                <div>
                  <p className="font-semibold text-sm text-foreground">{item.description}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Vol: <span className="font-bold">{Number(item.quantity).toLocaleString("id-ID")} m³</span>
                    {" · "}Jual: <span className="font-bold">{fmt(item.unit_price)}</span>
                  </p>
                </div>
                <div className="sm:text-right flex items-center justify-between sm:block border-t sm:border-0 pt-2 sm:pt-0 mt-2 sm:mt-0">
                  <p className="text-xs text-muted-foreground">HPP Beli</p>
                  <p className="font-black text-sm text-foreground">{fmt(item.buy_in_price)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="bg-card border rounded-xl p-4 space-y-2 text-sm">
          <h3 className="font-bold">Nilai Transaksi</h3>
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
          {(invoice.shipping_fee || 0) > 0 && (
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Ongkos Kirim</span><span className="font-semibold">+ {fmt(invoice.shipping_fee)}</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-2 border-t font-extrabold">
            <span>Total</span><span className="text-lg">{fmt(invoice.total)}</span>
          </div>
        </div>

        {/* Margin */}
        <div className="bg-slate-50 dark:bg-slate-900/30 border rounded-xl p-4 space-y-2 text-xs">
          <p className="font-bold text-sm">Margin Internal</p>
          <div className="flex justify-between text-muted-foreground">
            <span>Total HPP</span><span className="font-semibold text-foreground">{fmt(margin.hppDPP)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>+ PPN Supplier</span><span className="font-semibold text-foreground">{fmt(margin.ppnSupplier)}</span>
          </div>
          {(invoice.fee || 0) > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>Fee Lain</span><span className="font-semibold text-red-600">- {fmt(invoice.fee)}</span>
            </div>
          )}
          <div className="flex justify-between pt-2 border-t font-bold text-primary">
            <span>Laba Bersih (Est.)</span><span>{fmt(margin.netMargin)}</span>
          </div>
        </div>
      </div>

      {/* Advance */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button type="button" className="w-full h-12 font-bold text-sm" disabled={isSaving}>
            Lanjut ke Pengiriman
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi ke Pengiriman?</AlertDialogTitle>
            <AlertDialogDescription>
              Transaksi akan dipindahkan ke tahap Pengiriman. Pastikan Tanggal Pengiriman sudah diisi jika diperlukan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => advance("pengiriman")} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Ya, Mulai Pengiriman
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
