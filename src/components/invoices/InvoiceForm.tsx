import { useState, useMemo, useEffect, type FormEvent } from "react";
import { useRouter } from "next/router";
import { useInvoices } from "@/hooks/useInvoices";
import { usePresetItems } from "@/hooks/usePresetItems";
import { useClients } from "@/hooks/useClients";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { downloadPDF, DocType } from "@/lib/pdfExport";
import { loadCompanyProfile } from "@/lib/companyProfile";
import {
  Plus, Trash2, Save, Download, Calendar, Truck,
  Check, ChevronsUpDown, Search, AlertTriangle, Info,
} from "lucide-react";
import {
  Invoice, InvoiceInput, InvoiceItemInput, INVOICE_STATUS_CONFIG,
} from "@/types/invoice";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function defaultInvoiceNumber() {
  const stamp = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `INV-${stamp}-${Math.floor(Math.random() * 900 + 100)}`;
}

function toItemInput(item: Invoice["items"][number]): InvoiceItemInput {
  return {
    description: item.description,
    quantity: item.quantity,
    actual_quantity: item.actual_quantity ?? null,
    unit_price: item.unit_price,
    buy_in_price: item.buy_in_price || 0,
    commission_rate: (item as any).commission_rate || 5000,
    sort_order: item.sort_order,
  };
}

function formatIndonesianDate(dateStr: string | null) {
  if (!dateStr) return "-";
  try {
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const months = [
      "Januari","Februari","Maret","April","Mei","Juni",
      "Juli","Agustus","September","Oktober","November","Desember",
    ];
    return `${parseInt(parts[2], 10)} ${months[parseInt(parts[1], 10) - 1]} ${parts[0]}`;
  } catch { return dateStr; }
}

// -- ProductSelector ------------------------------------------------------------
interface ProductSelectorProps {
  value: string;
  itemDescription: string;
  presetItems: any[];
  onSelect: (val: string) => void;
}

function ProductSelector({ value, itemDescription, presetItems, onSelect }: ProductSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return presetItems.slice(0, 10);
    const q = searchQuery.toLowerCase();
    return presetItems.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 15);
  }, [presetItems, searchQuery]);

  const selectedPreset = presetItems.find((p) => p.id === value);
  const displayName = selectedPreset ? selectedPreset.name : (itemDescription || "Pilih Produk...");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-9 text-xs font-semibold px-3 text-left border-slate-200 bg-card hover:bg-slate-50 truncate"
        >
          <span className="truncate flex-1">{displayName}</span>
          <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] sm:w-[420px] p-2 bg-card border rounded-lg shadow-lg" align="start">
        <div className="flex items-center gap-2 border-b pb-2 px-1 mb-1">
          <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <Input
            placeholder="Cari nama produk..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 text-xs border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
            autoFocus
          />
        </div>
        <div className="max-h-[220px] overflow-y-auto no-scrollbar space-y-0.5">
          {filteredItems.length === 0 ? (
            <div className="text-center py-4 text-xs text-muted-foreground">Tidak ada produk ditemukan.</div>
          ) : (
            filteredItems.map((p) => {
              const isSelected = p.id === value;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => { onSelect(p.id); setOpen(false); setSearchQuery(""); }}
                  className={`w-full flex items-center justify-between text-left px-2.5 py-2 rounded-md text-xs font-semibold transition-colors hover:bg-slate-100 ${
                    isSelected ? "bg-slate-100/80 text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="truncate">{p.name}</p>
                    {p.description && <p className="text-[10px] text-muted-foreground truncate">{p.description}</p>}
                  </div>
                  <div className="ml-2 text-right shrink-0">
                    <p className="font-bold text-foreground">Rp {Number(p.unit_price).toLocaleString("id-ID")}</p>
                    {isSelected && <Check className="ml-auto h-3.5 w-3.5 text-slate-800" />}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// -- InvoiceForm ----------------------------------------------------------------
export function InvoiceForm({ invoice }: { invoice?: Invoice }) {
  const router = useRouter();
  const { addInvoice, updateInvoice } = useInvoices();
  const { presetItems } = usePresetItems();
  const { clients, isLoading: clientsLoading } = useClients();
  const { user } = useAuth();

  // role helpers
  const isSales = user?.role === "user";
  const isAdmin = user?.role === "owner" || user?.role === "admin" || user?.role === "manager";

  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [manualClient, setManualClient] = useState(invoice ? !invoice.client_id : false);

  const [form, setForm] = useState<InvoiceInput>({
    invoice_number: invoice?.invoice_number ?? defaultInvoiceNumber(),
    status: invoice?.status ?? "penawaran",
    currency: invoice?.currency ?? "IDR",
    issue_date: invoice?.issue_date ?? today(),
    due_date: invoice?.due_date ?? "",
    paid_date: invoice?.paid_date ?? "",
    discount: invoice?.discount ?? 0,
    tax: invoice?.tax ?? 0,
    fee: invoice?.fee ?? 0,
    notes: invoice?.notes ?? "",
    terms: invoice?.terms ?? "Transfer ke Rekening BCA Rek. 150.455.5758 a/n CV ADITARA JAYA MAKMUR",
    template_id: invoice?.template_id ?? null,
    client_id: invoice?.client_id ?? null,
    client: invoice?.client
      ? {
          name: invoice.client.name,
          email: invoice.client.email ?? "",
          company: invoice.client.company ?? "",
          phone: invoice.client.phone ?? "",
          address: invoice.client.address ?? "",
        }
      : { name: "", email: "", company: "", phone: "", address: "" },
    items: invoice?.items.map(toItemInput) ?? [
      { description: "", quantity: 1, actual_quantity: null, unit_price: 0, buy_in_price: 0, commission_rate: 5000, sort_order: 0 },
    ],
  });

  const [includePpn, setIncludePpn] = useState(
    invoice
      ? Math.abs((invoice.tax || 0) - invoice.subtotal * 0.11) < 100 && (invoice.tax || 0) > 0
      : true
  );

  useEffect(() => {
    if (!invoice && clients.length === 0) setManualClient(true);
  }, [clients, invoice]);

  // -- totals – line_total uses actual_quantity when set ---------------------
  const totals = useMemo(() => {
    const subtotal = form.items.reduce((sum, item) => {
      const billedQty = item.actual_quantity != null ? Number(item.actual_quantity) : Number(item.quantity || 0);
      return sum + billedQty * Number(item.unit_price || 0);
    }, 0);
    const calculatedTax = includePpn ? Math.round(subtotal * 0.11) : Number(form.tax || 0);
    return {
      subtotal,
      tax: calculatedTax,
      total: Math.max(0, subtotal - Number(form.discount || 0) + calculatedTax),
    };
  }, [form.discount, form.items, form.tax, includePpn]);

  // -- margin internal (admin only) -----------------------------------------
  // Formula sesuai spreadsheet:
  //   TOTAL DEAL (Tanpa PPN) = subtotal (harga jual × vol aktual, tanpa PPN)
  //   TOTAL HPP TERPAKAI (Tanpa PPN) = Σ(vol aktual × buy_in_price)
  //   LABA KOTOR = TOTAL DEAL - TOTAL HPP TERPAKAI
  //   LABA BERSIH = LABA KOTOR - FEE
  const marginTotals = useMemo(() => {
    let totalDeal = 0;
    let totalAjm = 0;
    let totalEksternalFee = 0;
    let totalHppTerpakai = 0;
    let totalHppDibayar = 0;
    let sisaPOVol = 0;
    for (const item of form.items) {
      const dealQty = Number(item.quantity || 0);
      const billedQty = item.actual_quantity != null ? Number(item.actual_quantity) : dealQty;
      const dealPrice = Number(item.unit_price || 0);
      const commission = Number(item.commission_rate || 0);
      const ajmPrice = dealPrice - commission;
      
      totalDeal += billedQty * dealPrice;
      totalAjm += billedQty * ajmPrice;
      totalEksternalFee += billedQty * commission;
      totalHppTerpakai += billedQty * Number(item.buy_in_price || 0);
      totalHppDibayar += dealQty * Number(item.buy_in_price || 0);
      sisaPOVol += (dealQty - billedQty);
    }
    const ppnSupplier = Math.round(totalHppDibayar * 0.11);
    const globalFee = Number(form.fee || 0); // Opex / Biaya lain
    const grossMargin = totalAjm - totalHppTerpakai;
    const netMargin = grossMargin - globalFee;
    return { totalDeal, totalAjm, totalEksternalFee, totalHpp: totalHppTerpakai, totalHppDibayar, ppnSupplier, globalFee, grossMargin, netMargin, sisaPOVol };
  }, [form.items, form.fee]);

  const updateItem = (index: number, key: keyof InvoiceItemInput, value: string | number | null) => {
    setForm((cur) => ({
      ...cur,
      items: cur.items.map((item, i) => i === index ? { ...item, [key]: value } : item),
    }));
  };

  const removeItem = (index: number) => {
    setForm((cur) => ({ ...cur, items: cur.items.filter((_, i) => i !== index) }));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    const payload = {
      ...form,
      due_date: form.due_date || null,
      paid_date: form.paid_date || null,
      discount: Number(form.discount || 0),
      tax: totals.tax,
      fee: Number(form.fee || 0),
      items: form.items
        .filter((item) => item.description.trim())
        .map((item, index) => ({
          ...item,
          quantity: Number(item.quantity || 0),
          actual_quantity: item.actual_quantity != null ? Number(item.actual_quantity) : null,
          unit_price: Number(item.unit_price || 0),
          buy_in_price: Number(item.buy_in_price || 0),
          commission_rate: Number(item.commission_rate || 5000),
          sort_order: index,
        })),
    };
    try {
      const saved = invoice
        ? await updateInvoice(invoice.id, { ...payload, version: invoice.version })
        : await addInvoice(payload);
      await router.push(`/tracker/invoices/${saved.id}`);
    } catch (error: unknown) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Gagal menyimpan invoice.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDirectPrint = async (docType: DocType) => {
    if (!invoice) return;
    setIsGeneratingPDF(true);
    try {
      const company = loadCompanyProfile();
      const updatedInvoice: Invoice = {
        ...invoice,
        invoice_number: form.invoice_number,
        status: form.status as any,
        issue_date: form.issue_date,
        due_date: form.due_date || null,
        paid_date: form.paid_date || null,
        notes: form.notes ?? null,
        terms: form.terms ?? null,
        tax: totals.tax,
        discount: Number(form.discount || 0),
        subtotal: totals.subtotal,
        total: totals.total,
        items: form.items.map((item, idx) => {
          const billedQty = item.actual_quantity != null ? Number(item.actual_quantity) : Number(item.quantity || 0);
          const price = Number(item.unit_price || 0);
          return {
            id: invoice.items[idx]?.id || `temp-${idx}`,
            invoice_id: invoice.id,
            description: item.description,
            quantity: Number(item.quantity || 0),
            actual_quantity: item.actual_quantity ?? null,
            unit_price: price,
            buy_in_price: Number(item.buy_in_price || 0),
            commission_rate: Number(item.commission_rate || 5000),
            line_total: billedQty * price,
            sort_order: idx,
          };
        }),
        client: invoice.client,
      };
      await downloadPDF(docType, updatedInvoice, company, includePpn);
    } catch (error) {
      console.error(error);
      alert("Gagal mengunduh PDF.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const currentStageIndex = ["penawaran", "tagihan", "po", "pengiriman", "selesai"].indexOf(form.status || "penawaran");
  const canEditStatus = isAdmin;
  // Sales bisa buat/edit di tahap penawaran dan tagihan
  const salesCanEdit = isSales && (form.status === "penawaran" || form.status === "tagihan");
  const canEditItems = (isAdmin && form.status === "penawaran") || salesCanEdit;
  const canEditQty = canEditItems;
  const canEditActualQty = isAdmin && form.status === "pengiriman";
  const canEditBuyIn = isAdmin && (form.status === "tagihan" || form.status === "po");

  return (
    <form onSubmit={submit} className="space-y-4 p-4 md:p-6 max-w-6xl mx-auto">
      {/* Invoice number context */}
      {invoice && (
        <div className="text-[10px] uppercase font-extrabold tracking-wider text-muted-foreground">
          Nomor Transaksi: <span className="text-foreground">{invoice.invoice_number}</span>
        </div>
      )}

      {/* Workflow Stepper */}
      {!isSales && (
        <div className="flex items-center justify-between bg-muted/30 p-4 rounded-xl border">
          {["penawaran", "tagihan", "po", "pengiriman", "selesai"].map((stage, index) => {
            const isActive = index === currentStageIndex;
            const isCompleted = index < currentStageIndex;
            const stageName = INVOICE_STATUS_CONFIG[stage as keyof typeof INVOICE_STATUS_CONFIG]?.label || stage;
            return (
              <div key={stage} className="flex items-center">
                <button
                  type="button"
                  onClick={() => { if (canEditStatus) setForm({ ...form, status: stage as any }); }}
                  className={`flex items-center outline-none transition-opacity ${canEditStatus ? "cursor-pointer hover:opacity-75" : "cursor-default"}`}
                  title={canEditStatus ? `Lompat ke tahap ${stageName}` : undefined}
                >
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm border-2 transition-colors ${
                    isActive ? "bg-slate-800 text-white border-slate-800 shadow-md"
                    : isCompleted ? "bg-slate-200 text-slate-700 border-slate-200"
                    : "bg-muted text-muted-foreground border-muted-foreground/30"
                  }`}>
                    {index + 1}
                  </div>
                  <span className={`ml-2 text-xs font-bold hidden sm:block transition-colors ${
                    isActive ? "text-slate-800" : isCompleted ? "text-foreground" : "text-muted-foreground"
                  }`}>{stageName}</span>
                </button>
                {index < 4 && (
                  <div className={`w-3 sm:w-8 md:w-16 lg:w-24 h-1 mx-2 sm:mx-3 rounded-full transition-colors ${isCompleted ? "bg-slate-300" : "bg-muted"}`} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-[1fr_360px] items-start">
        {/* Left Column */}
        <div className="space-y-6">

          {/* -- Produk & Kuantitas ------------------------------------------- */}
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <div>
                <h2 className="font-bold text-foreground text-sm">Produk & Volume</h2>
                {isAdmin && (form.status === "tagihan" || form.status === "po") && (
                  <p className="text-[10px] text-blue-600 mt-0.5">Admin: isi volume deal (m³) dan konfirmasi HPP beli.</p>
                )}
                {isAdmin && form.status === "pengiriman" && (
                  <p className="text-[10px] text-emerald-600 mt-0.5">Admin: isi volume aktual terkirim. Bisa berbeda dari volume deal.</p>
                )}
              </div>
              {canEditItems && !isSales && (
                <Button
                  type="button" variant="outline" size="sm"
                  onClick={() => setForm((prev) => ({ ...prev, items: [...prev.items, { description: "", quantity: 1, actual_quantity: null, unit_price: 0, buy_in_price: 0, commission_rate: 5000, sort_order: prev.items.length }] }))}
                  className="text-xs font-semibold"
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" /> Tambah Produk
                </Button>
              )}
            </div>

            {/* Column headers (Admin only) */}
            {!isSales && (
              <div className={`grid gap-1.5 sm:gap-2 px-1 text-[10px] sm:text-xs font-bold text-muted-foreground ${
                isAdmin && (form.status === "pengiriman")
                  ? "grid-cols-[1fr_60px_60px_90px_90px_28px]"
                  : isAdmin && (form.status === "tagihan" || form.status === "po")
                    ? "grid-cols-[1fr_60px_90px_90px_28px]"
                    : form.status === "penawaran"
                      ? "grid-cols-[1fr_90px_28px]"
                      : "grid-cols-[1fr_60px_90px_28px]"
              }`}>
                <div>Produk / Spesifikasi</div>
                {form.status !== "penawaran" && <div className="text-center">Vol Deal</div>}
                {isAdmin && form.status === "pengiriman" && <div className="text-center text-emerald-700">Vol Aktual</div>}
                {isAdmin && (form.status === "tagihan" || form.status === "po" || form.status === "pengiriman") && (
                  <div className="text-right text-orange-600">HPP Beli</div>
                )}
                <div className="text-right">Harga Jual</div>
                <div></div>
              </div>
            )}

            <div className="space-y-2">
              {isSales ? (
                <>
                  {form.items.filter(i => i.description.trim()).map((item, index) => {
                    // Find actual index in original array for editing
                    const originalIndex = form.items.findIndex(i => i === item);
                    return (
                      <div key={originalIndex} className="flex items-center gap-3 py-3 border-b border-slate-100 last:border-0">
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm text-slate-800 leading-tight">{item.description}</div>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-xs text-muted-foreground font-medium">Rp {Number(item.unit_price).toLocaleString("id-ID")} &times;</span>
                            <Input 
                              type="number" min="0" step="any" 
                              value={item.quantity}
                              onChange={(e) => updateItem(originalIndex, "quantity", e.target.value)}
                              className="h-7 w-16 text-center px-1 text-xs font-bold border-slate-200 shadow-none focus-visible:ring-1" 
                            />
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                           <div className="font-black text-sm text-slate-800">
                             Rp {(Number(item.quantity || 0) * Number(item.unit_price || 0)).toLocaleString("id-ID")}
                           </div>
                        </div>
                        <button type="button" onClick={() => removeItem(originalIndex)} className="text-muted-foreground hover:text-red-500 p-2 -mr-2 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                  
                  {form.status === "penawaran" && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button type="button" variant="outline" className="w-full h-14 border-2 border-dashed border-slate-300 text-slate-600 hover:border-slate-800 hover:bg-slate-50 transition-colors rounded-xl font-bold">
                          <Plus className="mr-2 h-5 w-5" /> Tambah Produk / Layanan
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-slate-50">
                        <DialogHeader className="p-4 sm:p-6 bg-white border-b">
                          <DialogTitle className="text-xl font-black">Katalog Produk</DialogTitle>
                        </DialogHeader>
                        <div className="p-4 sm:p-6 max-h-[60vh] overflow-y-auto no-scrollbar grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {presetItems.length === 0 ? (
                            <div className="col-span-full py-8 text-center text-muted-foreground italic">Belum ada produk di katalog. Hubungi admin.</div>
                          ) : (
                            presetItems.map(p => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => {
                                  const desc = p.name + (p.description ? ` - ${p.description}` : "");
                                  setForm(cur => {
                                    const lastItem = cur.items[cur.items.length - 1];
                                    if (lastItem && !lastItem.description.trim()) {
                                      const newItems = [...cur.items];
                                      // Hanya isi nama — harga harus diisi manual
                                      newItems[cur.items.length - 1] = {
                                        ...lastItem, description: desc, quantity: 1
                                      };
                                      return { ...cur, items: newItems };
                                    } else {
                                      return {
                                        ...cur,
                                        items: [...cur.items, { description: desc, quantity: 1, actual_quantity: null, unit_price: 0, buy_in_price: 0, commission_rate: 5000, sort_order: cur.items.length }]
                                      };
                                    }
                                  });
                                  // Close dialog logic can be tricky without controlled state, but multiple selections without closing is often better for a catalog!
                                }}
                                className="text-left bg-white p-4 rounded-xl border shadow-sm hover:border-slate-800 hover:shadow-md transition-all group"
                              >
                                <div className="font-bold text-slate-800 text-sm mb-1 group-hover:text-primary transition-colors">{p.name}</div>
                                {p.description && <div className="text-[10px] text-muted-foreground line-clamp-2 mb-3">{p.description}</div>}
                                <div className="font-black text-slate-800 mt-2">Rp {Number(p.unit_price).toLocaleString("id-ID")}</div>
                              </button>
                            ))
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </>
              ) : (
              <>
                  {/* HEADER DESKTOP (ADMIN: TAGIHAN / PO / PENGIRIMAN) */}
                  {isAdmin && (form.status === "tagihan" || form.status === "po" || form.status === "pengiriman") && (
                    <div className={`hidden sm:grid ${form.status === "pengiriman" ? "grid-cols-[1fr_45px_45px_65px_80px_80px_90px_28px]" : "grid-cols-[1fr_45px_45px_80px_80px_90px_28px]"} gap-2 px-3 pb-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b mb-2`}>
                      <div>Produk / Layanan</div>
                      <div className="text-center" title="Volume/Qty Deal">Vol</div>
                      {form.status === "pengiriman" ? <div className="text-center text-emerald-600" title="Volume Aktual">Akt</div> : <div></div>}
                      {form.status === "pengiriman" ? <div className="text-right text-purple-600" title="Komisi Sales / m³">Komisi</div> : <></>}
                      <div className="text-right text-blue-600" title="Harga Net Asli Perusahaan">Net AJM</div>
                      <div className="text-right text-orange-600" title="HPP Modal Pabrik">Buy In</div>
                      <div className="text-right" title="Harga Jual ke Klien">Deal/Jual</div>
                      <div></div>
                    </div>
                  )}

                  {/* HEADER DESKTOP (ADMIN: PENAWARAN / DEFAULT) */}
                  {isAdmin && !(form.status === "tagihan" || form.status === "po" || form.status === "pengiriman") && !isSales && (
                    <div className="hidden sm:grid grid-cols-[1fr_60px_90px_28px] gap-2 px-3 pb-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b mb-2">
                      <div>Produk / Layanan</div>
                      <div className="text-center">Vol</div>
                      <div className="text-right">Harga Jual</div>
                      <div></div>
                    </div>
                  )}

              {form.items.map((item, index) => {
                const selectedPreset = presetItems.find(
                  (p) => p.name === item.description || (p.name + (p.description ? ` - ${p.description}` : "")) === item.description
                );
                const selectValue = selectedPreset ? selectedPreset.id : (item.description ? "custom" : "");
                const dealQty = Number(item.quantity || 0);
                const actualQty = item.actual_quantity != null ? Number(item.actual_quantity) : null;
                const selisih = actualQty != null ? actualQty - dealQty : null;

                return (
                  <div key={index} className="space-y-1">
                    <div className={`grid gap-2 items-center ${
                      isSales
                        ? "grid-cols-1 sm:grid-cols-[1fr_80px_120px_auto] bg-card p-3 rounded-xl border shadow-sm mb-2"
                        : isAdmin && form.status === "pengiriman"
                          ? "grid-cols-[1fr_45px_45px_65px_80px_80px_90px_28px]"
                          : isAdmin && (form.status === "tagihan" || form.status === "po")
                            ? "grid-cols-[1fr_45px_45px_80px_80px_90px_28px]"
                            : "grid-cols-[1fr_60px_90px_28px]"
                    }`}>
                      {/* Produk selector */}
                      <div className="min-w-0">
                        {canEditItems ? (
                          <ProductSelector
                            value={selectValue}
                            itemDescription={item.description}
                            presetItems={presetItems}
                            onSelect={(val) => {
                              const sel = presetItems.find((p) => p.id === val);
                              if (sel) {
                                // Hanya isi nama produk — harga deal & buy in harus diisi manual
                                // karena harga selalu berubah-ubah per deal
                                const desc = sel.name + (sel.description ? ` - ${sel.description}` : "");
                                updateItem(index, "description", desc);
                                // Tidak auto-fill unit_price & buy_in_price
                              }
                            }}
                          />
                        ) : (
                          <div className="flex items-center h-9 px-2 bg-muted/10 border border-transparent rounded-md text-xs font-semibold text-foreground truncate" title={item.description}>
                            {item.description || "-"}
                          </div>
                        )}
                      </div>

                      {/* Vol Deal */}
                      {(isSales || form.status !== "penawaran") && (
                        <div className={isSales ? "space-y-1" : ""}>
                          {isSales && <Label className="text-[10px] text-muted-foreground uppercase">Qty / Volume</Label>}
                          {canEditItems ? (
                            <Input type="number" min="0" step="any" placeholder="0" value={item.quantity}
                              onChange={(e) => updateItem(index, "quantity", e.target.value)}
                              className="h-9 text-center text-xs px-1 border-slate-200" />
                          ) : (
                            <div className="flex items-center justify-center h-9 px-1 bg-muted/10 border border-transparent rounded-md text-xs font-semibold text-center">
                              {dealQty}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Vol Aktual (pengiriman stage, admin only) */}
                      {isAdmin && form.status === "pengiriman" && (
                        <div>
                          <Input type="number" min="0" step="any" placeholder={String(dealQty)}
                            value={item.actual_quantity ?? ""}
                            onChange={(e) => updateItem(index, "actual_quantity", e.target.value === "" ? null : e.target.value)}
                            className={`h-9 text-center text-xs px-1 ${selisih != null && selisih < 0 ? "border-amber-400 bg-amber-50" : "border-emerald-300"}`}
                          />
                        </div>
                      )}

                      {/* Komisi Sales per m3 (pengiriman stage, admin only) */}
                      {isAdmin && form.status === "pengiriman" && (
                        <div>
                          <Input type="number" min="0" step="any" placeholder="5000"
                            value={item.commission_rate ?? ""}
                            onChange={(e) => updateItem(index, "commission_rate", e.target.value ? Number(e.target.value) : 0)}
                            className="h-9 text-right text-xs px-1 border-purple-200 bg-purple-50/50"
                            title="Komisi Sales per m³"
                          />
                        </div>
                      )}

                      {/* HPP Beli (admin: tagihan, po & pengiriman) */}
                      {isAdmin && (form.status === "tagihan" || form.status === "po" || form.status === "pengiriman") && (
                        <>
                          {/* Harga AJM (Net) */}
                          <div className={isSales ? "hidden" : ""}>
                            {canEditBuyIn ? (
                              <Input type="number" min="0" placeholder="0"
                                value={item.ajm_price ?? item.unit_price ?? ""}
                                onChange={(e) => updateItem(index, "ajm_price", e.target.value ? Number(e.target.value) : 0)}
                                className="h-9 text-right text-xs px-1.5 border-blue-200 bg-blue-50/50"
                                title="Harga Net AJM"
                              />
                            ) : (
                              <div className="flex items-center justify-end h-9 px-1.5 bg-muted/10 border border-transparent rounded-md text-xs font-semibold text-blue-700">
                                Rp {Number(item.ajm_price ?? item.unit_price ?? 0).toLocaleString("id-ID")}
                              </div>
                            )}
                          </div>

                          {/* Buy In */}
                          <div>
                            {canEditBuyIn ? (
                              <Input type="number" min="0" placeholder="0"
                                value={item.buy_in_price || ""}
                                onChange={(e) => updateItem(index, "buy_in_price", e.target.value ? Number(e.target.value) : 0)}
                                className="h-9 text-right text-xs px-1.5 border-orange-200 bg-orange-50/50"
                                title="Harga Modal (Buy In)"
                              />
                            ) : (
                              <div className="flex items-center justify-end h-9 px-1.5 bg-muted/10 border border-transparent rounded-md text-xs font-semibold text-orange-700">
                                Rp {Number(item.buy_in_price || 0).toLocaleString("id-ID")}
                              </div>
                            )}
                          </div>
                        </>
                      )}

                      {/* Harga Jual */}
                      <div className={isSales ? "space-y-1" : ""}>
                        {isSales && <Label className="text-[10px] text-muted-foreground uppercase">Harga Satuan (Rp)</Label>}
                        {canEditItems ? (
                          <Input type="number" min="0" value={item.unit_price}
                            onChange={(e) => updateItem(index, "unit_price", e.target.value)}
                            className="h-9 text-right text-xs px-1.5 border-slate-200"
                          />
                        ) : (
                          <div className="flex items-center justify-end h-9 px-1.5 bg-muted/10 border border-transparent rounded-md text-xs font-semibold text-foreground">
                            Rp {Number(item.unit_price || 0).toLocaleString("id-ID")}
                          </div>
                        )}
                      </div>

                      {/* Delete */}
                      <div className={`flex justify-end ${isSales ? "mt-5 sm:mt-0" : ""}`}>
                        {canEditItems && (
                          <Button type="button" variant="ghost" size="icon"
                            onClick={() => removeItem(index)}
                            disabled={form.items.length === 1}
                            className="h-9 w-9 text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Selisih volume alert */}
                    {selisih != null && form.status === "pengiriman" && (
                      <div className={`flex items-center gap-1.5 text-[10px] px-2 py-1 rounded ${
                        selisih < 0 ? "text-amber-700 bg-amber-50" : selisih > 0 ? "text-blue-700 bg-blue-50" : "text-emerald-700 bg-emerald-50"
                      }`}>
                        {selisih !== 0 && <AlertTriangle className="h-3 w-3 shrink-0" />}
                        {selisih < 0 && `Kurang ${Math.abs(selisih)} m³ dari deal (${dealQty} m³) — total customer disesuaikan`}
                        {selisih > 0 && `Lebih ${selisih} m³ dari deal — perlu konfirmasi customer`}
                        {selisih === 0 && `Volume aktual sama dengan deal ✓`}
                      </div>
                    )}
                  </div>
                );
              })}
              </>
              )}
            </div>
          </div>

          {/* -- Pelanggan & Pengiriman --------------------------------------- */}
          <div className="space-y-4 pt-4 border-t">
            <h2 className="font-bold text-foreground text-sm pb-2 border-b">Pelanggan & Alamat Pengiriman</h2>

            {form.status === "pengiriman" || form.status === "selesai" || form.status === "batal" ? (
              <div className="grid gap-6 md:grid-cols-2 text-sm pt-2">
                <div className="space-y-1.5">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Data Pelanggan</p>
                  <p className="font-semibold text-foreground text-sm">{form.client?.name || "-"}</p>
                  {form.client?.phone && <p className="text-muted-foreground text-xs">{form.client.phone}</p>}
                  {form.client?.email && <p className="text-muted-foreground text-xs">{form.client.email}</p>}
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Info Pengiriman</p>
                  <p className="font-semibold text-foreground text-sm">Tgl: {form.due_date ? formatIndonesianDate(form.due_date) : "-"}</p>
                  <p className="text-muted-foreground text-xs">Lokasi: {form.notes || "-"}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="text-xs font-semibold text-muted-foreground">Pelanggan</Label>
                  {(isAdmin || salesCanEdit) && (
                    <button type="button" onClick={() => {
                      setManualClient(!manualClient);
                      setForm((prev) => ({ ...prev, client_id: null, client: { name: "", email: "", phone: "", address: "" } }));
                    }} className="text-xs text-primary hover:underline font-semibold">
                      {manualClient ? "Pilih dari Daftar" : "Tambah Pelanggan Baru"}
                    </button>
                  )}
                </div>

                {manualClient && (isAdmin || salesCanEdit) ? (
                  <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
                    {[
                      { id: "client_name", label: "Nama Pelanggan / Perusahaan", key: "name", placeholder: "Bpk. Bachnas", required: true },
                      { id: "client_phone", label: "Telepon", key: "phone", placeholder: "0812..." },
                      { id: "client_email", label: "Email", key: "email", placeholder: "client@mail.com" },
                      { id: "client_address", label: "Alamat", key: "address", placeholder: "Jl. Sukabumi..." },
                    ].map(({ id, label, key, placeholder, required }) => (
                      <div key={id}>
                        <Label htmlFor={id} className="text-[10px] text-muted-foreground uppercase">{label}</Label>
                        <Input id={id} required={required}
                          value={(form.client as any)?.[key] ?? ""}
                          onChange={(e) => setForm({ ...form, client: { ...(form.client ?? { name: "" }), [key]: e.target.value } })}
                          placeholder={placeholder} className="h-9 mt-1 text-xs"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div>
                    {clientsLoading ? (
                      <p className="text-xs text-muted-foreground italic">Memuat pelanggan...</p>
                    ) : clients.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">Belum ada pelanggan. Klik "Tambah Pelanggan Baru".</p>
                    ) : (
                      <Select value={form.client_id ?? ""} onValueChange={(val) => {
                        const c = clients.find((x) => x.id === val);
                        if (c) setForm((prev) => ({
                          ...prev, client_id: c.id,
                          client: { name: c.name, email: c.email ?? "", phone: c.phone ?? "", company: c.company ?? "", address: c.address ?? "" },
                        }));
                      }}>
                        <SelectTrigger className="w-full h-10 mt-1">
                          <SelectValue placeholder="Pilih pelanggan dari database..." />
                        </SelectTrigger>
                        <SelectContent>
                          {clients.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ""}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}

                {form.status !== "penawaran" && (
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2 pt-2 border-t">
                    <div>
                      <Label htmlFor="due_date" className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" /> Tanggal Pengiriman
                      </Label>
                      <Input id="due_date" type="date" value={form.due_date ?? ""}
                        onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                        onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                        onKeyDown={(e) => e.preventDefault()}
                        readOnly={isSales}
                        className="h-10 mt-1.5 cursor-pointer"
                      />
                    </div>
                    {form.status !== "tagihan" && (
                      <div>
                        <Label htmlFor="notes" className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5" /> Lokasi Proyek / Alamat Kirim
                        </Label>
                        <Textarea id="notes" value={form.notes ?? ""}
                          onChange={(e) => setForm({ ...form, notes: e.target.value })}
                          placeholder="Contoh: Jl. Melon Raya No.79, Surakarta"
                          readOnly={isSales}
                          className="mt-1.5 min-h-[40px] text-xs h-10 py-2.5"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* -- Right Column: Summary Pane ----------------------------------- */}
        <div className="space-y-4 lg:sticky lg:top-4 pt-4 lg:pt-0 lg:border-l lg:pl-6 border-t lg:border-t-0">
          <div className="space-y-4">

            {/* Payment summary (non-penawaran for admin, but let's show simple total for Sales) */}
            {(form.status !== "penawaran" || isSales) && (
              <>
                <h2 className="font-bold text-foreground text-sm border-b pb-2">Ringkasan Nilai Transaksi</h2>
                
                {(!isSales || (form.discount || 0) > 0 || totals.tax > 0) && (
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Subtotal</span>
                    <span className="font-semibold text-foreground">Rp {totals.subtotal.toLocaleString("id-ID")}</span>
                  </div>
                )}

                {isAdmin && (
                  <div className="space-y-1">
                    <Label htmlFor="discount" className="text-[10px] text-muted-foreground uppercase font-semibold">Potongan Diskon (Rp)</Label>
                    {form.status === "pengiriman" || form.status === "selesai" || form.status === "batal" ? (
                      <div className="h-9 text-xs flex items-center px-2 bg-muted/20 border border-slate-100 rounded-md font-semibold">
                        Rp {Number(form.discount || 0).toLocaleString("id-ID")}
                      </div>
                    ) : (
                      <Input id="discount" type="number" min="0" value={form.discount || ""}
                        onChange={(e) => setForm({ ...form, discount: e.target.value ? Number(e.target.value) : 0 })}
                        className="h-9 text-xs" placeholder="Rp 0"
                      />
                    )}
                  </div>
                )}
                {!isAdmin && (form.discount || 0) > 0 && (
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Diskon</span>
                    <span className="font-semibold text-red-600">- Rp {Number(form.discount).toLocaleString("id-ID")}</span>
                  </div>
                )}

                {isAdmin && (
                  <div className="flex items-center justify-between py-1 text-xs">
                    <div className="space-y-0.5">
                      <p className="font-bold text-foreground">Kenakan PPN 11%</p>
                      <p className="text-[10px] text-muted-foreground">Dihitung dari subtotal</p>
                    </div>
                    {form.status === "pengiriman" || form.status === "selesai" || form.status === "batal" ? (
                      <span className="font-bold text-primary mr-1 text-sm">{includePpn ? "Ya" : "Tidak"}</span>
                    ) : (
                      <button type="button" role="switch" aria-checked={includePpn}
                        onClick={() => setIncludePpn(!includePpn)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${includePpn ? "bg-primary" : "bg-muted-foreground/30"}`}
                      >
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${includePpn ? "translate-x-4.5" : "translate-x-0.5"}`} />
                      </button>
                    )}
                  </div>
                )}

                {totals.tax > 0 && (
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>PPN (11%)</span>
                    <span className="font-semibold text-foreground">+ Rp {totals.tax.toLocaleString("id-ID")}</span>
                  </div>
                )}

                <div className={`flex justify-between font-extrabold text-foreground ${isSales ? 'text-lg' : 'border-t pt-3 text-sm'}`}>
                  <span>{isSales ? 'Total Estimasi' : 'Total Akhir'}</span>
                  <span>Rp {totals.total.toLocaleString("id-ID")}</span>
                </div>
              </>
            )}

            {/* Margin panel (admin only, tagihan+) */}
            {isAdmin && form.status !== "penawaran" && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 dark:bg-slate-900/30 p-3 space-y-2 text-xs">
                <p className="font-bold text-foreground flex items-center gap-1.5">
                  Estimasi Margin Internal
                  <span className="font-normal text-muted-foreground text-[10px]">(tidak tampil di invoice)</span>
                </p>

                {/* DEAL side */}
                <div className="flex justify-between text-muted-foreground pb-1 border-b border-dashed">
                  <span>Total Harga Deal (Tanpa PPN)</span>
                  <span className="font-semibold text-foreground">Rp {marginTotals.totalDeal.toLocaleString("id-ID")}</span>
                </div>
                
                {/* EXTERNAL FEE */}
                {marginTotals.totalEksternalFee > 0 && (
                  <div className="flex justify-between text-red-600 pb-1 border-b border-dashed font-medium">
                    <span>Fee Eksternal / Uang Mandor (Otomatis)</span>
                    <span>- Rp {marginTotals.totalEksternalFee.toLocaleString("id-ID")}</span>
                  </div>
                )}
                
                {/* AJM side */}
                <div className="flex justify-between text-muted-foreground pb-1 border-b border-dashed">
                  <span>Total Pendapatan Asli (AJM)</span>
                  <span className="font-semibold text-blue-700">Rp {marginTotals.totalAjm.toLocaleString("id-ID")}</span>
                </div>

                {/* SISA PO */}
                {marginTotals.sisaPOVol !== 0 && (
                  <div className={`flex justify-between font-medium ${marginTotals.sisaPOVol > 0 ? "text-blue-600" : "text-amber-600"} pb-1`}>
                    <span>Sisa / Saldo PO di Supplier</span>
                    <span>{marginTotals.sisaPOVol > 0 ? "+" : ""}{marginTotals.sisaPOVol} m³</span>
                  </div>
                )}

                {/* BUY IN side */}
                  <>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Total HPP Terpakai (Tanpa PPN)</span>
                      <span className="font-semibold text-orange-700">Rp {marginTotals.totalHpp.toLocaleString("id-ID")}</span>
                    </div>
                    {marginTotals.sisaPOVol !== 0 && (
                      <div className="flex justify-between text-muted-foreground border-b pb-1.5 border-dashed">
                        <span>Total HPP Dibayar (Sesuai PO)</span>
                        <span className="font-semibold text-orange-700">Rp {marginTotals.totalHppDibayar.toLocaleString("id-ID")}</span>
                      </div>
                    )}
                    <div className={`flex justify-between text-muted-foreground ${marginTotals.sisaPOVol === 0 ? "border-b pb-1.5 border-dashed" : "pt-1.5"}`}>
                      <span className={marginTotals.sisaPOVol !== 0 ? "pl-3" : ""}>+ Titipan PPN ke Supplier (11%)</span>
                      <span className="font-semibold text-orange-600">Rp {marginTotals.ppnSupplier.toLocaleString("id-ID")}</span>
                    </div>
                  </>

                {/* Fee input */}
                <div className="pt-1 space-y-1">
                  <Label htmlFor="fee" className="text-[10px] text-muted-foreground uppercase font-semibold">
                    Fee / Biaya Tambahan (Rp)
                    <span className="ml-1 font-normal normal-case">(dikurangi dari margin)</span>
                  </Label>
                  {form.status === "pengiriman" || form.status === "selesai" || form.status === "batal" ? (
                    <div className="h-8 text-xs flex items-center px-2 bg-muted/20 border border-slate-100 rounded-md font-semibold">
                      Rp {Number(form.fee || 0).toLocaleString("id-ID")}
                    </div>
                  ) : (
                    <Input
                      id="fee"
                      type="number"
                      min="0"
                      value={form.fee || ""}
                      onChange={(e) => setForm({ ...form, fee: e.target.value ? Number(e.target.value) : 0 })}
                      className="h-8 text-xs"
                      placeholder="Rp 0"
                    />
                  )}
                </div>

                {/* Net margin */}
                  <div className={`flex justify-between border-t pt-2 font-bold ${
                    marginTotals.netMargin >= 0 ? "text-emerald-700" : "text-red-600"
                  }`}>
                    <span>Laba Bersih</span>
                    <span>Rp {marginTotals.netMargin.toLocaleString("id-ID")}</span>
                  </div>
              </div>
            )}

            {/* Actions */}
            <div className={`space-y-3 ${form.status !== "penawaran" ? "pt-2 border-t" : ""}`}>
              <div className="flex items-center gap-2">
                <Button type="submit" disabled={isSaving} className="w-full font-bold h-10 text-xs bg-slate-800 hover:bg-slate-900">
                  <Save className="mr-1.5 h-4 w-4" />
                  {isSaving ? "Menyimpan..." : invoice ? "Simpan Perubahan" : "Buat Transaksi"}
                </Button>
              </div>

              {invoice && (
                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-dashed">
                  {form.status === "penawaran" && (
                    <>
                      <Button type="button" variant="outline" onClick={() => handleDirectPrint("quotation")} disabled={isGeneratingPDF} className="font-bold h-9 text-xs px-2 truncate">
                        <Download className="mr-1 h-3.5 w-3.5 shrink-0" /> Cetak Penawaran
                      </Button>
                      {isSales && (
                        <Button type="button" variant="outline" onClick={() => handleDirectPrint("invoice")} disabled={isGeneratingPDF} className="font-bold h-9 text-xs border-amber-600 text-amber-600 hover:bg-amber-50 px-2 truncate">
                          <Download className="mr-1 h-3.5 w-3.5 shrink-0" /> Cetak Invoice
                        </Button>
                      )}
                      {(isAdmin || isSales) && (
                        <Button type="button" onClick={() => { setForm({ ...form, status: "tagihan" }); setTimeout(() => document.querySelector("form")?.requestSubmit(), 100); }} disabled={isSaving} className="font-bold h-9 text-xs bg-amber-600 hover:bg-amber-700 text-white px-2">
                          Jadikan Tagihan &rarr;
                        </Button>
                      )}
                    </>
                  )}
                  {form.status === "tagihan" && (
                    <>
                      <Button type="button" variant="outline" onClick={() => handleDirectPrint("invoice")} disabled={isGeneratingPDF} className="font-bold h-9 text-xs border-amber-600 text-amber-600 hover:bg-amber-50 px-2 truncate">
                        <Download className="mr-1 h-3.5 w-3.5 shrink-0" /> Cetak Invoice
                      </Button>
                      {isAdmin && (
                        <Button type="button" onClick={() => { setForm({ ...form, status: "po" }); setTimeout(() => document.querySelector("form")?.requestSubmit(), 100); }} disabled={isSaving} className="font-bold h-9 text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-2">
                          Ke PO &rarr;
                        </Button>
                      )}
                    </>
                  )}
                  {form.status === "po" && isAdmin && (
                    <div className="col-span-2 flex flex-col gap-2">
                      <div className="grid grid-cols-2 gap-2">
                        <Button type="button" variant="outline" onClick={() => handleDirectPrint("po")} disabled={isGeneratingPDF} className="font-bold h-9 text-xs border-indigo-600 text-indigo-600 hover:bg-indigo-50 px-2 truncate">
                          <Download className="mr-1 h-3.5 w-3.5 shrink-0" /> Cetak PO
                        </Button>
                        <Button type="button" variant="outline" onClick={() => handleDirectPrint("invoice")} disabled={isGeneratingPDF} className="font-bold h-9 text-xs border-amber-600 text-amber-600 hover:bg-amber-50 px-2 truncate">
                          <Download className="mr-1 h-3.5 w-3.5 shrink-0" /> Cetak Invoice
                        </Button>
                      </div>
                      <Button type="button" onClick={() => { setForm({ ...form, status: "pengiriman" }); setTimeout(() => document.querySelector("form")?.requestSubmit(), 100); }} disabled={isSaving} className="font-bold h-9 text-xs bg-blue-600 hover:bg-blue-700 text-white w-full">
                        Ke Pengiriman &rarr;
                      </Button>
                    </div>
                  )}
                  {form.status === "pengiriman" && isAdmin && (
                    <div className="col-span-2 flex flex-col gap-2">
                      <Button type="button" variant="outline" onClick={() => handleDirectPrint("invoice")} disabled={isGeneratingPDF} className="font-bold h-9 text-xs border-amber-600 text-amber-600 hover:bg-amber-50 px-2 w-full">
                        <Download className="mr-1 h-3.5 w-3.5 shrink-0" /> Cetak Invoice
                      </Button>
                      <Button type="button" onClick={() => { setForm({ ...form, status: "selesai" }); setTimeout(() => document.querySelector("form")?.requestSubmit(), 100); }} disabled={isSaving} className="font-bold h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white w-full">
                        Selesai &rarr;
                      </Button>
                    </div>
                  )}
                  {form.status === "selesai" && isAdmin && (
                    <div className="col-span-2 flex flex-col gap-2">
                      <div className="grid grid-cols-2 gap-2">
                        <Button type="button" variant="outline" onClick={() => handleDirectPrint("receipt")} disabled={isGeneratingPDF} className="font-bold h-9 text-xs border-emerald-600 text-emerald-600 hover:bg-emerald-50 px-2 truncate">
                          <Download className="mr-1 h-3.5 w-3.5 shrink-0" /> Cetak Kwitansi
                        </Button>
                        <Button type="button" variant="outline" onClick={() => handleDirectPrint("invoice")} disabled={isGeneratingPDF} className="font-bold h-9 text-xs border-amber-600 text-amber-600 hover:bg-amber-50 px-2 truncate">
                          <Download className="mr-1 h-3.5 w-3.5 shrink-0" /> Cetak Invoice
                        </Button>
                      </div>
                      <Button type="button" onClick={() => { setForm({ ...form, status: "batal" }); setTimeout(() => document.querySelector("form")?.requestSubmit(), 100); }} disabled={isSaving} variant="ghost" className="font-bold h-9 text-xs text-red-600 hover:bg-red-50 w-full">
                        Batal Transaksi
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
