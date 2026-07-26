/**
 * SalesPenawaranView
 * Komponen untuk role SALES saat melihat/mengedit transaksi berstatus "penawaran".
 * Tampilan simpel, mobile-first, bisa edit produk & harga, cetak PDF.
 */
import { useState, useMemo } from "react";
import { useRouter } from "next/router";
import { Invoice, InvoiceItemInput } from "@/types/invoice";
import { useInvoices } from "@/hooks/useInvoices";
import { usePresetItems } from "@/hooks/usePresetItems";
import { loadCompanyProfile } from "@/lib/companyProfile";
import { fmt, fmtDate, handleDownloadPDF } from "./stageUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Plus, Trash2, Save, Download, FileText, ArrowRight, ChevronRight,
} from "lucide-react";

interface Props {
  invoice: Invoice;
  onUpdated: (updated: Invoice) => void;
}

export function SalesPenawaranView({ invoice, onUpdated }: Props) {
  const router = useRouter();
  const { updateInvoice } = useInvoices();
  const { presetItems } = usePresetItems();

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
  const [isSaving, setIsSaving] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredPresets = useMemo(() => {
    if (!search.trim()) return presetItems;
    return presetItems.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [presetItems, search]);

  const subtotal = useMemo(
    () => items.reduce((s, i) => s + Number(i.quantity || 0) * Number(i.unit_price || 0), 0),
    [items]
  );

  const updateItem = (idx: number, key: keyof InvoiceItemInput, val: string | number | null) => {
    setItems((prev) => prev.map((item, i) => i === idx ? { ...item, [key]: val } : item));
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const addFromCatalog = (preset: typeof presetItems[0]) => {
    setItems((prev) => {
      const desc = preset.name + (preset.description ? ` - ${preset.description}` : "");
      return [
        ...prev,
        {
          description: desc,
          quantity: 1,
          actual_quantity: null,
          unit_price: Number(preset.unit_price) || 0,
          buy_in_price: Number(preset.buy_in_price) || 0,
          commission_rate: 5000,
          sort_order: prev.length,
        },
      ];
    });
    setCatalogOpen(false);
    setSearch("");
  };

  const addBlankItem = () => {
    setItems((prev) => [
      ...prev,
      { description: "", quantity: 1, actual_quantity: null, unit_price: 0, buy_in_price: 0, commission_rate: 5000, sort_order: prev.length },
    ]);
  };

  const save = async (nextStatus?: string) => {
    setIsSaving(true);
    try {
      const payload: any = {
        items: items
          .filter((i) => i.description.trim())
          .map((item, idx) => ({
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

  const downloadQuotation = () => {
    const company = loadCompanyProfile();
    const updatedInvoice: Invoice = {
      ...invoice,
      items: items
        .filter((i) => i.description.trim())
        .map((item, idx) => ({
          id: invoice.items[idx]?.id || `temp-${idx}`,
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
    handleDownloadPDF("quotation", updatedInvoice, company, false, setIsPdfLoading);
  };

  const downloadInvoice = () => {
    const company = loadCompanyProfile();
    const updatedInvoice: Invoice = {
      ...invoice,
      items: items
        .filter((i) => i.description.trim())
        .map((item, idx) => ({
          id: invoice.items[idx]?.id || `temp-${idx}`,
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
    handleDownloadPDF("invoice", updatedInvoice, company, false, setIsPdfLoading);
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-5 pb-28">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Penawaran</p>
          <h1 className="text-xl font-black text-foreground mt-0.5">{invoice.invoice_number}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pelanggan: <span className="font-semibold text-foreground">{invoice.client?.name || "-"}</span>
          </p>
          {invoice.client?.phone && (
            <p className="text-xs text-muted-foreground">{invoice.client.phone}</p>
          )}
        </div>
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 border">
          Penawaran
        </span>
      </div>

      {/* Products */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-sm text-foreground">Daftar Produk</h2>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addBlankItem}
              className="h-8 text-xs px-3 font-semibold"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Manual
            </Button>
            <Dialog open={catalogOpen} onOpenChange={setCatalogOpen}>
              <DialogTrigger asChild>
                <Button type="button" size="sm" className="h-8 text-xs px-3 font-semibold bg-primary text-primary-foreground hover:bg-primary/90">
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Katalog
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg w-full h-[100dvh] sm:h-auto p-0 overflow-hidden flex flex-col border-0 sm:border rounded-none sm:rounded-xl">
                <DialogHeader className="p-4 border-b">
                  <DialogTitle className="font-black text-lg">Pilih Produk</DialogTitle>
                  <Input
                    placeholder="Cari produk..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="mt-3 h-10 text-sm"
                    autoFocus
                  />
                </DialogHeader>
                <div className="flex-1 overflow-y-auto p-3 space-y-1.5 sm:max-h-[60vh]">
                  {filteredPresets.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">Tidak ada produk.</p>
                  ) : (
                    filteredPresets.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => addFromCatalog(p)}
                        className="w-full flex items-center justify-between text-left px-4 py-3.5 rounded-xl border bg-card hover:border-slate-800 hover:bg-slate-50 transition-all group"
                      >
                        <div>
                          <p className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">{p.name}</p>
                          {p.description && <p className="text-xs text-muted-foreground mt-0.5">{p.description}</p>}
                        </div>
                        <div className="text-right ml-3 shrink-0">
                          <p className="font-black text-sm">{fmt(p.unit_price)}</p>
                          <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto mt-0.5 group-hover:text-primary transition-colors" />
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {items.length === 0 && (
          <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl text-muted-foreground text-sm">
            Belum ada produk. Tambah dari katalog atau buat manual.
          </div>
        )}

        <div className="space-y-2">
          {/* Header row */}
          {items.length > 0 && (
            <div className="hidden sm:grid grid-cols-[1fr_80px_100px_32px] gap-2 px-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <div>Produk</div>
              <div className="text-center">Qty / m³</div>
              <div className="text-right">Harga (Rp)</div>
              <div />
            </div>
          )}

          {items.map((item, idx) => (
            <div key={idx} className="flex flex-col sm:grid sm:grid-cols-[1fr_80px_100px_32px] gap-2 sm:items-center bg-card border rounded-xl px-3 py-3 shadow-sm relative">
              {/* Produk name */}
              <div className="mb-2 sm:mb-0 pr-8 sm:pr-0">
                <Input
                  value={item.description}
                  onChange={(e) => updateItem(idx, "description", e.target.value)}
                  placeholder="Nama produk..."
                  className="h-8 text-xs font-semibold border-slate-200"
                />
              </div>
              
              <div className="flex gap-2 sm:contents">
                {/* Qty */}
                <div className="flex-1 sm:flex-none flex items-center justify-between sm:justify-center">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground sm:hidden">Qty</span>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                    className="h-8 w-20 sm:w-full text-center text-xs font-bold border-slate-200 px-1"
                  />
                </div>
                {/* Harga */}
                <div className="flex-1 sm:flex-none flex items-center justify-between sm:justify-end">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground sm:hidden">Harga</span>
                  <Input
                    type="number"
                    min="0"
                    value={item.unit_price}
                    onChange={(e) => updateItem(idx, "unit_price", e.target.value)}
                    className="h-8 w-28 sm:w-full text-right text-xs font-bold border-slate-200 px-1.5"
                  />
                </div>
              </div>
              
              {/* Hapus */}
              <button
                type="button"
                onClick={() => removeItem(idx)}
                className="absolute top-2 right-2 sm:static sm:h-8 sm:w-8 flex items-center justify-center text-muted-foreground hover:text-red-500 transition-colors rounded-md p-1 sm:p-0"
              >
                <Trash2 className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Total */}
        {items.length > 0 && (
          <div className="flex justify-between items-center px-3 py-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border font-bold text-foreground">
            <span className="text-sm">Total Estimasi</span>
            <span className="text-lg">{fmt(subtotal)}</span>
          </div>
        )}
      </div>

      {/* Actions - sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg px-4 py-3 flex gap-2 z-50 max-w-2xl mx-auto">
        {/* Save */}
        <Button
          type="button"
          onClick={() => save()}
          disabled={isSaving}
          variant="outline"
          className="flex-1 h-11 font-bold text-xs"
        >
          <Save className="h-4 w-4 mr-1.5" />
          {isSaving ? "Menyimpan..." : "Simpan"}
        </Button>

        {/* Cetak */}
        <Button
          type="button"
          onClick={downloadQuotation}
          disabled={isPdfLoading}
          variant="outline"
          className="h-11 font-bold text-xs px-3 border-primary text-primary"
        >
          <Download className="h-4 w-4 mr-1" />
          Penawaran
        </Button>

        <Button
          type="button"
          onClick={downloadInvoice}
          disabled={isPdfLoading}
          variant="outline"
          className="h-11 font-bold text-xs px-3 border-primary text-primary hover:bg-primary/10"
        >
          <FileText className="h-4 w-4 mr-1" />
          Invoice
        </Button>

        {/* Jadikan Tagihan */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              type="button"
              className="h-11 font-bold text-xs px-4 bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={isSaving || items.filter((i) => i.description.trim()).length === 0}
            >
              Tagihan
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Jadikan Tagihan?</AlertDialogTitle>
              <AlertDialogDescription>
                Transaksi ini akan dipindahkan ke tahap Tagihan dan diteruskan ke admin untuk proses selanjutnya.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => save("tagihan")}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Ya, Jadikan Tagihan
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
