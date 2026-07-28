/**
 * AdminPenawaranView
 * Komponen untuk role ADMIN saat melihat transaksi berstatus "penawaran".
 * Tampilan bersih, fokus pada review & aksi lanjut.
 */
import { useState, useMemo } from "react";
import { Invoice, InvoiceItemInput } from "@/types/invoice";
import { useInvoices } from "@/hooks/useInvoices";
import { usePresetItems } from "@/hooks/usePresetItems";
import { loadCompanyProfile } from "@/lib/companyProfile";
import { fmt, fmtDate, handleDownloadPDF, handlePdfAction } from "./stageUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Trash2, ArrowRight, Save, FileText, ChevronsUpDown, Search, Check } from "lucide-react";
import { PdfAction } from "@/lib/pdfExport";
import { PdfActionButton } from "./PdfActionButton";

interface Props {
  invoice: Invoice;
  onUpdated: (updated: Invoice) => void;
}

function ProductCombobox({ presetItems, onSelect }: { presetItems: any[]; onSelect: (p: any) => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    if (!q.trim()) return presetItems.slice(0, 10);
    return presetItems.filter((p) => p.name.toLowerCase().includes(q.toLowerCase())).slice(0, 15);
  }, [presetItems, q]);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 text-xs font-semibold gap-1.5 border-slate-200">
          <Plus className="h-3.5 w-3.5" />
          Tambah Produk
          <ChevronsUpDown className="h-3 w-3 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-2 shadow-lg" align="end">
        <div className="flex items-center gap-2 border-b pb-2 mb-1 px-1">
          <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <Input
            placeholder="Cari produk..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="h-7 text-xs border-0 shadow-none p-0 focus-visible:ring-0"
            autoFocus
          />
        </div>
        <div className="max-h-48 overflow-y-auto space-y-0.5">
          {filtered.length === 0 && <p className="text-xs text-center text-muted-foreground py-4">Tidak ada produk.</p>}
          {filtered.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => { onSelect(p); setOpen(false); setQ(""); }}
              className="w-full flex justify-between items-center px-2.5 py-2 rounded-lg text-xs hover:bg-slate-100 transition-colors text-left"
            >
              <span className="font-semibold">{p.name}</span>
              <span className="font-bold text-foreground">{fmt(p.unit_price)}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function AdminPenawaranView({ invoice, onUpdated }: Props) {
  const { updateInvoice } = useInvoices();
  const { presetItems } = usePresetItems();

  const [items, setItems] = useState<InvoiceItemInput[]>(
    invoice.items.map((i) => ({
      description: i.description,
      quantity: i.quantity,
      actual_quantity: i.actual_quantity,
      unit_price: i.unit_price,
      buy_in_price: i.buy_in_price || 0,
      sort_order: i.sort_order,
    }))
  );
  const [discount, setDiscount] = useState(invoice.discount || 0);
  const [includePpn, setIncludePpn] = useState(
    Math.abs((invoice.tax || 0) - invoice.subtotal * 0.11) < 100 && (invoice.tax || 0) > 0
  );
  const [notes, setNotes] = useState(invoice.notes || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(false);

  const subtotal = useMemo(
    () => items.reduce((s, i) => s + Number(i.quantity || 0) * Number(i.unit_price || 0), 0),
    [items]
  );
  const tax = includePpn ? Math.round(subtotal * 0.11) : 0;
  const total = Math.max(0, subtotal - Number(discount || 0) + tax);

  const updateItem = (idx: number, key: keyof InvoiceItemInput, val: string | number | null) =>
    setItems((prev) => prev.map((item, i) => i === idx ? { ...item, [key]: val } : item));

  const removeItem = (idx: number) =>
    setItems((prev) => prev.filter((_, i) => i !== idx));

  const addFromPreset = (p: any) => {
    const desc = p.name + (p.description ? ` - ${p.description}` : "");
    setItems((prev) => [
      ...prev,
      { description: desc, quantity: 1, actual_quantity: null, unit_price: 0, buy_in_price: 0, sort_order: prev.length },
    ]);
  };

  const addBlank = () =>
    setItems((prev) => [...prev, { description: "", quantity: 1, actual_quantity: null, unit_price: 0, buy_in_price: 0, sort_order: prev.length }]);

  const save = async (nextStatus?: string) => {
    setIsSaving(true);
    try {
      const payload: any = {
        notes,
        discount: Number(discount || 0),
        tax,
        items: items.filter((i) => i.description.trim()).map((item, idx) => ({
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

  const downloadPdf = (type: "quotation" | "invoice", action: PdfAction) => {
    const company = loadCompanyProfile();
    const updatedInvoice: Invoice = {
      ...invoice,
      discount: Number(discount || 0),
      tax,
      subtotal,
      total,
      notes,
      items: items.filter((i) => i.description.trim()).map((item, idx) => ({
        id: invoice.items[idx]?.id || `temp-${idx}`,
        invoice_id: invoice.id,
        description: item.description,
        quantity: Number(item.quantity || 0),
        actual_quantity: null,
        unit_price: Number(item.unit_price || 0),
        buy_in_price: Number(item.buy_in_price || 0),
        line_total: Number(item.quantity || 0) * Number(item.unit_price || 0),
        sort_order: idx,
      })),
    };
    handlePdfAction(action, type, updatedInvoice, company, includePpn, setIsPdfLoading);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Penawaran</p>
          <h1 className="text-2xl font-black text-foreground mt-0.5">{invoice.invoice_number}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            <span className="font-semibold text-foreground">{invoice.client?.name}</span>
            {invoice.client?.phone && <span> · {invoice.client.phone}</span>}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <PdfActionButton
            label="Cetak Penawaran"
            icon={FileText}
            isLoading={isPdfLoading}
            onAction={(action) => downloadPdf("quotation", action)}
            className="h-9 text-xs font-bold gap-1.5"
          />
          <PdfActionButton
            label="Cetak Invoice"
            icon={FileText}
            isLoading={isPdfLoading}
            onAction={(action) => downloadPdf("invoice", action)}
            className="h-9 text-xs font-bold gap-1.5 border-primary text-primary hover:bg-primary/10"
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
        {/* Left: Products */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-sm">Produk & Volume</h2>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={addBlank} className="h-8 text-xs gap-1">
                <Plus className="h-3.5 w-3.5" /> Kosong
              </Button>
              <ProductCombobox presetItems={presetItems} onSelect={addFromPreset} />
            </div>
          </div>

          {/* Column Headers */}
          <div className="hidden sm:grid grid-cols-[1fr_80px_100px_32px] gap-2 px-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <div>Produk / Layanan</div>
            <div className="text-center">Vol</div>
            <div className="text-right">Harga Jual</div>
            <div />
          </div>

          <div className="space-y-1.5">
            {items.length === 0 && (
              <div className="text-center py-8 border-2 border-dashed rounded-xl text-sm text-muted-foreground">
                Tambahkan produk dari katalog
              </div>
            )}
            {items.map((item, idx) => (
              <div key={idx} className="flex flex-col sm:grid sm:grid-cols-[1fr_80px_100px_32px] gap-2 sm:items-center bg-card border rounded-lg p-3 relative">
                <div className="mb-2 sm:mb-0 pr-8 sm:pr-0">
                  <Input
                    value={item.description}
                    onChange={(e) => updateItem(idx, "description", e.target.value)}
                    placeholder="Nama produk / layanan"
                    className="h-8 text-xs border-slate-200"
                  />
                </div>
                
                <div className="flex gap-2 sm:contents">
                  <div className="flex-1 sm:flex-none flex items-center justify-between sm:justify-center">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground sm:hidden">Vol</span>
                    <Input
                      type="number" min="0" step="any"
                      value={item.quantity}
                      onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                      className="h-8 w-20 sm:w-full text-center text-xs px-1 border-slate-200"
                    />
                  </div>
                  
                  <div className="flex-1 sm:flex-none flex items-center justify-between sm:justify-end">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground sm:hidden">Harga</span>
                    <Input
                      type="number" min="0"
                      value={item.unit_price}
                      onChange={(e) => updateItem(idx, "unit_price", e.target.value)}
                      className="h-8 w-28 sm:w-full text-right text-xs px-1.5 border-slate-200"
                    />
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  disabled={items.length === 1}
                  className="absolute top-2 right-2 sm:static sm:h-8 sm:w-8 flex items-center justify-center text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-30 p-1 sm:p-0 rounded-md"
                >
                  <Trash2 className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Notes */}
          <div>
            <Label className="text-xs text-muted-foreground font-semibold">Catatan / Lokasi Proyek</Label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Jl. Melon Raya No.79..."
              rows={2}
              className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-xs resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
        </div>

        {/* Right: Summary */}
        <div className="space-y-4 lg:sticky lg:top-4">
          {/* PPN Toggle */}
          <div className="bg-card border rounded-xl p-4 space-y-3">
            <h3 className="font-bold text-sm">Ringkasan</h3>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Subtotal</span>
              <span className="font-semibold text-foreground">{fmt(subtotal)}</span>
            </div>

            <div>
              <Label className="text-[10px] font-semibold uppercase text-muted-foreground">Diskon (Rp)</Label>
              <Input
                type="number" min="0"
                value={discount || ""}
                onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                placeholder="0"
                className="h-8 text-xs mt-1"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold">PPN 11%</p>
                <p className="text-[10px] text-muted-foreground">Dari subtotal</p>
              </div>
              <button
                type="button"
                onClick={() => setIncludePpn(!includePpn)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${includePpn ? "bg-primary" : "bg-muted-foreground/30"}`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${includePpn ? "translate-x-4" : "translate-x-0.5"}`} />
              </button>
            </div>

            {tax > 0 && (
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>PPN (11%)</span>
                <span className="font-semibold">+ {fmt(tax)}</span>
              </div>
            )}

            <div className="flex justify-between items-center pt-2 border-t font-extrabold text-foreground">
              <span className="text-sm">Total</span>
              <span className="text-lg">{fmt(total)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button
              type="button"
              onClick={() => save()}
              disabled={isSaving}
              className="w-full h-10 font-bold text-xs bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Save className="h-4 w-4 mr-1.5" />
              {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  className="w-full h-11 font-bold text-sm bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={isSaving || items.filter((i) => i.description.trim()).length === 0}
                >
                  Jadikan Tagihan
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Konfirmasi Lanjut ke Tagihan?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Penawaran akan dipindahkan ke tahap Tagihan. Pastikan data sudah benar.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction onClick={() => save("tagihan")} className="bg-primary text-primary-foreground hover:bg-primary/90">
                    Ya, Lanjutkan
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
