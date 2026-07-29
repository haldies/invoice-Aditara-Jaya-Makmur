/**
 * SelesaiView – Tampilan read-only untuk transaksi Selesai & Batal.
 * Cetak kwitansi/invoice, lihat ringkasan margin final.
 */
import { useEffect, useState } from "react";
import { Invoice } from "@/types/invoice";
import { useInvoices } from "@/hooks/useInvoices";
import { useToast } from "@/hooks/use-toast";
import { loadCompanyProfile } from "@/lib/companyProfile";
import { fmt, fmtDate, handleDownloadPDF, handlePdfAction, calcMargin } from "./stageUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Download, FileText, Receipt, CheckCircle, XCircle, Wallet, Pencil, Trash2 } from "lucide-react";
import { PdfAction } from "@/lib/pdfExport";
import { PdfActionButton } from "./PdfActionButton";
import type { PaymentHistoryEntry } from "@/types/invoice";

interface Props {
  invoice: Invoice;
  onUpdated: (updated: Invoice) => void;
  isSales?: boolean;
}

export function SelesaiView({ invoice, onUpdated, isSales = false }: Props) {
  const { updateInvoice } = useInvoices();
  const { toast } = useToast();
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [paymentDraft, setPaymentDraft] = useState("");
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentEditOpen, setPaymentEditOpen] = useState(false);
  const [paymentDeleteOpen, setPaymentDeleteOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentHistoryEntry | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [deleteReason, setDeleteReason] = useState("");

  const includePpn = Math.abs((invoice.tax || 0) - invoice.subtotal * 0.11) < 100 && (invoice.tax || 0) > 0;
  const margin = calcMargin(invoice);
  const isSelesai = invoice.status === "selesai";
  const isBatal = invoice.status === "batal";
  const amountPaid = Number(invoice.amount_paid || 0);
  const sisaTagihan = Math.max(0, Number(invoice.total || 0) - amountPaid);
  const isLunas = sisaTagihan <= 0 && Number(invoice.total || 0) > 0;
  const paidRatio = Number(invoice.total || 0) > 0 ? Math.min(100, Math.round((amountPaid / Number(invoice.total || 1)) * 100)) : 0;
  const paymentHistory = (Array.isArray(invoice.payment_history) ? invoice.payment_history : []).map((entry, index) => ({
    id: entry.id || `legacy-${index}-${entry.paid_at}`,
    amount: Number(entry.amount || 0),
    paid_at: entry.paid_at,
    created_at: entry.created_at || entry.paid_at,
    updated_at: entry.updated_at ?? null,
    deleted_at: entry.deleted_at ?? null,
    deleted_reason: entry.deleted_reason ?? null,
    edited_from_amount: entry.edited_from_amount ?? null,
  }));
  const activePayments = paymentHistory.filter((entry) => !entry.deleted_at);
  const paymentTotal = activePayments.reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
  const selectedPaymentOtherTotal = selectedPayment
    ? activePayments
        .filter((entry) => entry.id !== selectedPayment.id)
        .reduce((sum, entry) => sum + Number(entry.amount || 0), 0)
    : 0;
  const maxEditablePayment = Math.max(0, Number(invoice.total || 0) - selectedPaymentOtherTotal);
  const paymentDraftValue = Number((paymentDraft || "").replace(/[^\d]/g, "") || 0);
  const paymentDisplayValue = paymentDraftValue ? paymentDraftValue.toLocaleString("id-ID") : "";
  const editDraftValue = Number((editDraft || "").replace(/[^\d]/g, "") || 0);
  const editDisplayValue = editDraftValue ? editDraftValue.toLocaleString("id-ID") : "";

  useEffect(() => {
    setPaymentDraft("");
  }, [amountPaid]);

  const formatMoneyInput = (value: string) => {
    const digits = value.replace(/[^\d]/g, "");
    return digits ? Number(digits).toLocaleString("id-ID") : "";
  };

  const formatMoneyNumber = (value: number) => {
    if (!Number.isFinite(value) || value <= 0) return "";
    return Math.floor(value).toLocaleString("id-ID");
  };

  const handlePdf = (type: "invoice" | "receipt", action: PdfAction) => {
    const company = loadCompanyProfile();
    handlePdfAction(action, type, invoice, company, includePpn, setIsPdfLoading);
  };

  const handlePaymentReceipt = (entry: { amount: number; paid_at: string }) => {
    const company = loadCompanyProfile();
    const receiptInvoice = {
      ...invoice,
      amount_paid: entry.amount,
      paid_date: entry.paid_at,
    };
    handlePdfAction("download", "receipt", receiptInvoice as Invoice, company, includePpn, setIsPdfLoading);
  };

  const openEditPayment = (entry: PaymentHistoryEntry) => {
    setSelectedPayment(entry);
    setEditDraft(formatMoneyNumber(entry.amount));
    setPaymentEditOpen(true);
  };

  const openDeletePayment = (entry: PaymentHistoryEntry) => {
    setSelectedPayment(entry);
    setDeleteReason("");
    setPaymentDeleteOpen(true);
  };

  const cancel = async () => {
    setIsSaving(true);
    try {
      const updated = await updateInvoice(invoice.id, { status: "batal" as any, version: invoice.version });
      onUpdated(updated);
    } catch (e: any) {
      toast({ title: "Gagal", description: e?.message || "Tidak bisa membatalkan transaksi.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const savePayment = async () => {
    if (paymentDraftValue <= 0) {
      toast({ title: "Nominal belum valid", description: "Masukkan jumlah pembayaran yang lebih dari 0.", variant: "destructive" });
      return;
    }
    if (isLunas) {
      toast({ title: "Transaksi sudah lunas", description: "Tidak bisa menambahkan pembayaran lagi.", variant: "destructive" });
      return;
    }
    if (paymentDraftValue > sisaTagihan) {
      toast({ title: "Nominal terlalu besar", description: `Maksimal pembayaran sekarang adalah Rp ${sisaTagihan.toLocaleString("id-ID")}.`, variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const nextHistory = [
        ...paymentHistory,
        {
          id: crypto.randomUUID(),
          amount: paymentDraftValue,
          paid_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: null,
          deleted_at: null,
          deleted_reason: null,
          edited_from_amount: null,
        },
      ].filter((entry) => Number(entry.amount || 0) > 0);
      const updated = await updateInvoice(invoice.id, {
        amount_paid: paymentTotal + paymentDraftValue,
        payment_history: nextHistory,
        version: invoice.version,
      });
      onUpdated(updated);
      setPaymentDraft("");
      setPaymentOpen(false);
      toast({ title: "Pembayaran tersimpan", description: `Rp ${paymentDraftValue.toLocaleString("id-ID")} berhasil dicatat.` });
    } catch (e: any) {
      toast({ title: "Gagal menyimpan", description: e?.message || "Pembayaran tidak berhasil disimpan.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const saveEditPayment = async () => {
    if (!selectedPayment) return;
    if (isLunas) {
      toast({ title: "Transaksi sudah lunas", description: "Pembayaran tidak bisa diubah lagi.", variant: "destructive" });
      return;
    }
    if (editDraftValue <= 0) {
      toast({ title: "Nominal belum valid", description: "Masukkan jumlah pembayaran yang lebih dari 0.", variant: "destructive" });
      return;
    }
    if (editDraftValue > maxEditablePayment) {
      toast({
        title: "Nominal terlalu besar",
        description: `Maksimal untuk baris ini adalah Rp ${maxEditablePayment.toLocaleString("id-ID")}.`,
        variant: "destructive",
      });
      return;
    }
    const nextHistory = paymentHistory.map((entry) => {
      if (entry.id !== selectedPayment.id) return entry;
      return {
        ...entry,
        amount: editDraftValue,
        updated_at: new Date().toISOString(),
        edited_from_amount: Number(entry.amount || 0),
      };
    });
    setIsSaving(true);
    try {
      const updated = await updateInvoice(invoice.id, {
        amount_paid: nextHistory.filter((entry) => !entry.deleted_at).reduce((sum, entry) => sum + Number(entry.amount || 0), 0),
        payment_history: nextHistory,
        version: invoice.version,
      });
      onUpdated(updated);
      setPaymentEditOpen(false);
      setSelectedPayment(null);
      toast({ title: "Pembayaran diperbarui", description: "Jejak nilai sebelumnya tetap tersimpan." });
    } catch (e: any) {
      toast({ title: "Gagal menyimpan", description: e?.message || "Pembayaran tidak berhasil diperbarui.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const deletePayment = async () => {
    if (!selectedPayment) return;
    if (!deleteReason.trim()) {
      toast({ title: "Alasan diperlukan", description: "Isi alasan penghapusan agar jejak audit tersimpan.", variant: "destructive" });
      return;
    }
    const nextHistory = paymentHistory.map((entry) => {
      if (entry.id !== selectedPayment.id) return entry;
      return {
        ...entry,
        deleted_at: new Date().toISOString(),
        deleted_reason: deleteReason.trim(),
        updated_at: new Date().toISOString(),
      };
    });
    setIsSaving(true);
    try {
      const updated = await updateInvoice(invoice.id, {
        amount_paid: nextHistory.filter((entry) => !entry.deleted_at).reduce((sum, entry) => sum + Number(entry.amount || 0), 0),
        payment_history: nextHistory,
        version: invoice.version,
      });
      onUpdated(updated);
      setPaymentDeleteOpen(false);
      setSelectedPayment(null);
      toast({ title: "Pembayaran dihapus", description: "Data lama tetap tersimpan sebagai jejak audit." });
    } catch (e: any) {
      toast({ title: "Gagal menyimpan", description: e?.message || "Pembayaran tidak berhasil dihapus.", variant: "destructive" });
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
            Nomor Transaksi {invoice.invoice_number} · {invoice.client?.name}
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
        <div className="bg-slate-50/50 rounded-2xl p-5 space-y-3 text-sm">
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
          <div className="pt-2 border-t border-slate-100 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Sudah Dibayar</span>
              <span className="font-semibold text-emerald-700">{fmt(amountPaid)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Sisa Tagihan</span>
              <span className={`font-semibold ${sisaTagihan > 0 ? "text-amber-600" : "text-emerald-700"}`}>
                {fmt(sisaTagihan)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Terbayar</span>
              <span className={`font-bold ${isLunas ? "text-emerald-700" : amountPaid > 0 ? "text-amber-600" : "text-rose-600"}`}>
                {paidRatio}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full rounded-full ${isLunas ? "bg-emerald-500" : amountPaid > 0 ? "bg-amber-500" : "bg-rose-500"}`}
                style={{ width: `${paidRatio}%` }}
              />
            </div>
            <div className="text-[10px] text-muted-foreground">
              {isLunas ? "Lunas" : amountPaid > 0 ? "Pembayaran parsial" : "Belum ada pembayaran"}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Tracking */}
      <div className="bg-slate-50/50 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-sm text-slate-700">Pembayaran Pelanggan</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Pantau pembayaran bertahap sampai lunas.
            </p>
          </div>
          <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
            <DialogTrigger asChild>
                <Button
                  type="button"
                  disabled={isLunas}
                  className={isLunas ? "h-10 bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-100" : "h-10 bg-primary text-primary-foreground hover:bg-primary/90"}
                >
                  <Wallet className="mr-1.5 h-4 w-4" />
                  {isLunas ? "Lunas" : "Bayar"}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Tambah Pembayaran</DialogTitle>
                <DialogDescription>
                  Masukkan nominal yang benar. Angka akan otomatis diformat dengan pemisah ribuan.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <label className="text-sm font-medium">Nominal pembayaran</label>
                <Input
                  inputMode="numeric"
                  value={paymentDisplayValue}
                  onChange={(e) => setPaymentDraft(formatMoneyInput(e.target.value))}
                  placeholder="100.000"
                  className="h-11 text-base font-semibold"
                  disabled={isLunas}
                />
                <p className="text-xs text-slate-500">
                  Input aman: ketik angka, titik akan ditambahkan otomatis.
                  {sisaTagihan > 0 && !isLunas && ` Maksimal Rp ${formatMoneyNumber(sisaTagihan)}.`}
                </p>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setPaymentOpen(false)} disabled={isSaving}>
                  Batal
                </Button>
                <Button type="button" onClick={savePayment} disabled={isSaving || paymentDraftValue <= 0 || isLunas} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  {isSaving ? "Memproses..." : "Bayar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase text-slate-500">Riwayat pembayaran</p>
          {paymentHistory.length === 0 ? (
            <p className="text-xs text-slate-500 italic">Belum ada pembayaran tersimpan.</p>
          ) : (
            <div className="space-y-2">
              {paymentHistory.slice().reverse().map((entry, idx) => (
                <div key={`${entry.id}-${idx}`} className={`rounded-xl border px-3 py-2 text-xs flex items-center justify-between gap-3 ${entry.deleted_at ? "bg-rose-50 border-rose-200 opacity-90" : "bg-white"}`}>
                  <div>
                    <p className={`font-semibold ${entry.deleted_at ? "text-rose-700 line-through" : "text-slate-700"}`}>
                      {fmt(entry.amount)}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {new Date(entry.paid_at).toLocaleString("id-ID", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                    {entry.edited_from_amount != null && (
                      <p className="text-[10px] text-amber-700">Diubah dari {fmt(entry.edited_from_amount)}</p>
                    )}
                    {entry.deleted_at && (
                      <p className="text-[10px] text-rose-700">Dihapus: {entry.deleted_reason || "Tanpa alasan"}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" size="sm" className="h-8 px-3 text-[10px] font-bold border-primary text-primary hover:bg-primary/10" onClick={() => handlePaymentReceipt(entry)}>
                      Kwitansi
                    </Button>
                    {!entry.deleted_at && (
                      <>
                        <Button type="button" variant="outline" size="sm" className="h-8 px-2 text-[10px] font-bold border-amber-500 text-amber-600 hover:bg-amber-50" onClick={() => openEditPayment(entry)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button type="button" variant="outline" size="sm" className="h-8 px-2 text-[10px] font-bold border-rose-500 text-rose-600 hover:bg-rose-50" onClick={() => openDeletePayment(entry)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={paymentEditOpen} onOpenChange={setPaymentEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Pembayaran</DialogTitle>
            <DialogDescription>
              Perubahan akan menyimpan jejak nilai lama agar tetap bisa diaudit.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">Nominal baru</label>
            <Input
              inputMode="numeric"
              value={editDisplayValue}
              onChange={(e) => setEditDraft(formatMoneyInput(e.target.value))}
              placeholder="100.000"
              className="h-11 text-base font-semibold"
            />
            <p className="text-xs text-slate-500">
              Maksimal untuk baris ini: Rp {maxEditablePayment.toLocaleString("id-ID")}
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPaymentEditOpen(false)} disabled={isSaving}>
              Batal
            </Button>
            <Button type="button" onClick={saveEditPayment} disabled={isSaving || editDraftValue <= 0 || editDraftValue > maxEditablePayment} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {isSaving ? "Memproses..." : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={paymentDeleteOpen} onOpenChange={setPaymentDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Hapus Pembayaran</DialogTitle>
            <DialogDescription>
              Data tidak akan benar-benar hilang. Riwayat lama tetap tersimpan sebagai jejak audit.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">Alasan hapus</label>
            <Input
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder="Contoh: input ganda / salah nominal"
              className="h-11 text-base"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPaymentDeleteOpen(false)} disabled={isSaving}>
              Batal
            </Button>
            <Button type="button" onClick={deletePayment} disabled={isSaving || !deleteReason.trim()} className="bg-rose-600 text-white hover:bg-rose-700">
              {isSaving ? "Memproses..." : "Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      {/* Riwayat Deal vs Aktual */}
      <div className="bg-slate-50/50 rounded-2xl p-5 space-y-4">
        <div>
          <h2 className="font-bold text-sm text-slate-700">Riwayat Deal vs Aktual</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Bagian ini membantu analisis kenapa volume berubah dari pesanan awal ke volume aktual terkirim.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-xs">
            <thead className="text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-2 px-2 text-left font-medium">Produk</th>
                <th className="py-2 px-2 text-right font-medium">Deal</th>
                <th className="py-2 px-2 text-right font-medium">Aktual</th>
                <th className="py-2 px-2 text-right font-medium">Harga Deal</th>
                <th className="py-2 px-2 text-right font-medium">Tagih Aktual</th>
                <th className="py-2 px-2 text-right font-medium">Selisih</th>
                <th className="py-2 px-2 text-right font-medium">Perubahan</th>
                <th className="py-2 px-2 text-left font-medium">Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoice.items.map((item, idx) => {
                const dealQty = Number(item.quantity || 0);
                const actualQty = item.actual_quantity != null ? Number(item.actual_quantity) : dealQty;
                const diff = actualQty - dealQty;
                const absDiff = Math.abs(diff);
                const pct = dealQty > 0 ? Math.round((absDiff / dealQty) * 100) : 0;
                const dealValue = dealQty * Number(item.unit_price || 0);
                const actualValue = actualQty * Number(item.unit_price || 0);
                const valueDiff = actualValue - dealValue;
                const note =
                  item.actual_quantity == null
                    ? "Belum ada revisi aktual"
                    : diff === 0
                    ? "Sesuai deal awal"
                    : diff < 0
                    ? `Turun ${pct}% dari deal`
                    : `Naik ${pct}% dari deal`;
                return (
                  <tr key={`${item.description}-${idx}`}>
                    <td className="py-2.5 px-2 text-left font-medium text-slate-700">
                      <div className="max-w-[220px] truncate" title={item.description}>{item.description}</div>
                    </td>
                    <td className="py-2.5 px-2 text-right text-slate-600">
                      {dealQty.toLocaleString("id-ID")} m³
                    </td>
                    <td className="py-2.5 px-2 text-right text-slate-600">
                      {actualQty.toLocaleString("id-ID")} m³
                    </td>
                    <td className="py-2.5 px-2 text-right text-slate-600">
                      {fmt(dealValue)}
                    </td>
                    <td className="py-2.5 px-2 text-right text-slate-600">
                      {fmt(actualValue)}
                    </td>
                    <td className={`py-2.5 px-2 text-right font-bold ${diff < 0 ? "text-amber-600" : diff > 0 ? "text-blue-600" : "text-emerald-700"}`}>
                      {diff > 0 ? "+" : ""}{diff.toLocaleString("id-ID")} m³
                    </td>
                    <td className="py-2.5 px-2 text-right text-slate-600">
                      {dealQty > 0 ? `${pct}%` : "-"}
                    </td>
                    <td className="py-2.5 px-2 text-left text-slate-500">
                      {note}
                      {valueDiff !== 0 && (
                        <div className={`mt-1 font-medium ${valueDiff < 0 ? "text-amber-600" : "text-blue-600"}`}>
                          {valueDiff > 0 ? "+" : ""}{fmt(valueDiff)} dari deal awal
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
            {amountPaid > 0 && sisaTagihan > 0 && (
              <div className="flex justify-between text-slate-500 text-xs">
                <span>Piutang Tertagih</span><span>{fmt(amountPaid)} dari {fmt(invoice.total)}</span>
              </div>
            )}
            <div className={`flex justify-between pt-3 border-t border-slate-200 font-bold text-base ${margin.netMargin >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              <span>Laba Bersih Total</span><span>{fmt(margin.netMargin)}</span>
            </div>
            <div className="flex justify-between text-slate-600 text-xs">
              <span>Laba Bersih Tertagih</span>
              <span className="font-semibold text-blue-700">
                {fmt(Math.max(0, Math.round(margin.netMargin * (amountPaid / Math.max(1, Number(invoice.total || 1))))))}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* PDF Actions */}
      {isSelesai && isLunas && (
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
      {!isSales && isSelesai && !isLunas && amountPaid === 0 && (
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
