import type { ReactElement } from "react";
import { useState } from "react";
import Head from "next/head";
import { AuthGuard } from "@/components/AuthGuard";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePresetItems } from "@/hooks/usePresetItems";
import { InvoicePresetItem } from "@/types/invoice";
import { useToast } from "@/hooks/use-toast";
import { APP_NAME } from "@/lib/appMetadata";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Edit, Plus, Trash2, TrendingUp, Info } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

function PresetItemPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    presetItems,
    addPresetItem,
    updatePresetItem,
    deletePresetItem,
    isLoading: loadingPresets,
  } = usePresetItems();

  const [isPresetDialogOpen, setIsPresetDialogOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<InvoicePresetItem | null>(null);
  const [presetName, setPresetName] = useState("");
  const [presetDescription, setPresetDescription] = useState("");
  const [presetPrice, setPresetPrice] = useState("");
  const [presetBuyInPrice, setPresetBuyInPrice] = useState("");
  const [presetTaxRate, setPresetTaxRate] = useState("");
  const [savingPreset, setSavingPreset] = useState(false);

  if (user && user.role === "user") {
    return (
      <div className="mx-auto max-w-xl p-8 text-center text-sm font-semibold text-destructive">
        Akses Ditolak: Anda tidak memiliki hak akses untuk mengelola Daftar Produk.
      </div>
    );
  }

  const openPresetDialog = (preset: InvoicePresetItem | null = null) => {
    if (preset) {
      setEditingPreset(preset);
      setPresetName(preset.name);
      setPresetDescription(preset.description);
      setPresetPrice(String(preset.unit_price));
      setPresetBuyInPrice(String(preset.buy_in_price || 0));
      setPresetTaxRate(String(preset.tax_rate));
    } else {
      setEditingPreset(null);
      setPresetName("");
      setPresetDescription("");
      setPresetPrice("");
      setPresetBuyInPrice("");
      setPresetTaxRate("");
    }
    setIsPresetDialogOpen(true);
  };

  const handleSavePreset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!presetName) return;
    setSavingPreset(true);
    try {
      const payload = {
        name: presetName,
        description: presetDescription,
        unit_price: Number(presetPrice || 0),
        buy_in_price: Number(presetBuyInPrice || 0),
        tax_rate: Number(presetTaxRate || 0),
      };
      if (editingPreset) {
        await updatePresetItem(editingPreset.id, payload);
        toast({ title: "Berhasil", description: "Produk berhasil diperbarui." });
      } else {
        await addPresetItem(payload);
        toast({ title: "Berhasil", description: "Produk baru berhasil ditambahkan." });
      }
      setIsPresetDialogOpen(false);
    } catch (err: any) {
      toast({
        title: "Gagal menyimpan",
        description: err.message || "Terjadi kesalahan",
        variant: "destructive",
      });
    } finally {
      setSavingPreset(false);
    }
  };

  const handleDeletePreset = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus produk ini?")) return;
    try {
      await deletePresetItem(id);
      toast({ title: "Berhasil", description: "Produk berhasil dihapus." });
    } catch (err: any) {
      toast({
        title: "Gagal menghapus",
        description: err.message || "Terjadi kesalahan",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Head>
        <title>Daftar Produk | {APP_NAME}</title>
      </Head>
      <div className="mx-auto max-w-4xl space-y-4 p-4 md:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-foreground">Daftar Produk</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Master data produk/mutu beton. Harga jual (deal) dan HPP beli ke supplier diatur di sini oleh admin.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => openPresetDialog()}
            className="flex items-center gap-1.5 font-semibold"
          >
            <Plus className="h-4 w-4" />
            Tambah Produk
          </Button>
        </div>

        <div className="relative w-full overflow-auto rounded-xl border bg-card shadow-xs">
          {loadingPresets ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Memuat produk...</div>
          ) : presetItems.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Belum ada produk. Klik "Tambah Produk" untuk mulai membuat.
            </div>
          ) : (
            <table className="w-full caption-bottom text-sm">
              <thead className="bg-muted/40">
                <tr className="border-b transition-colors">
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Nama Produk</th>
                  <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground">Harga Jual (Deal)</th>
                  <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground">HPP Beli Supplier</th>
                  <th className="h-10 px-4 text-right align-middle font-medium text-emerald-700">Margin</th>
                  <th className="h-10 px-4 text-center align-middle font-medium text-muted-foreground">PPN</th>
                  <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground">Aksi</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {presetItems.map((item) => {
                  const margin = item.unit_price - item.buy_in_price;
                  const marginPct = item.unit_price > 0 ? (margin / item.unit_price) * 100 : 0;
                  return (
                    <tr key={item.id} className="border-b transition-colors hover:bg-muted/20">
                      <td className="p-4 align-middle">
                        <p className="font-semibold text-foreground">{item.name}</p>
                        {item.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>
                        )}
                      </td>
                      <td className="p-4 align-middle text-right font-medium">
                        Rp {item.unit_price.toLocaleString("id-ID")}
                      </td>
                      <td className="p-4 align-middle text-right text-muted-foreground">
                        {item.buy_in_price > 0
                          ? `Rp ${item.buy_in_price.toLocaleString("id-ID")}`
                          : <span className="italic text-xs">Belum diatur</span>}
                      </td>
                      <td className="p-4 align-middle text-right">
                        {item.buy_in_price > 0 ? (
                          <span className={`font-semibold text-xs ${margin >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                            Rp {margin.toLocaleString("id-ID")}
                            <span className="text-[10px] text-muted-foreground ml-1">
                              ({marginPct.toFixed(1)}%)
                            </span>
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">-</span>
                        )}
                      </td>
                      <td className="p-4 align-middle text-center font-medium">
                        {item.tax_rate > 0 ? `${item.tax_rate}%` : "-"}
                      </td>
                      <td className="p-4 align-middle text-right space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => openPresetDialog(item)}
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleDeletePreset(item.id)}
                          title="Hapus"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Dialog Form Preset Item */}
        <Dialog open={isPresetDialogOpen} onOpenChange={setIsPresetDialogOpen}>
          <DialogContent className="sm:max-w-[480px]">
            <form onSubmit={handleSavePreset} className="space-y-4">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold text-foreground">
                  {editingPreset ? "Edit Produk" : "Tambah Produk"}
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  Atur nama, harga jual ke customer, dan HPP beli ke supplier (Jayamix).
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Nama Produk / Mutu Beton</label>
                  <Input
                    required
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    placeholder="Contoh: Beton K300 NFA"
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Deskripsi (Opsional)</label>
                  <Input
                    value={presetDescription}
                    onChange={(e) => setPresetDescription(e.target.value)}
                    placeholder="Contoh: Pengiriman menggunakan Mixer besar"
                    className="h-9"
                  />
                </div>

                {/* Harga Section */}
                <div className="rounded-lg border bg-muted/20 p-3 space-y-3">
                  <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                    Harga & Margin
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground">Harga Jual ke Customer (Rp/m³)</label>
                      <Input
                        type="number"
                        min="0"
                        required
                        value={presetPrice}
                        onChange={(e) => setPresetPrice(e.target.value)}
                        placeholder="Contoh: 850000"
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground">HPP Beli ke Supplier (Rp/m³)</label>
                      <Input
                        type="number"
                        min="0"
                        value={presetBuyInPrice}
                        onChange={(e) => setPresetBuyInPrice(e.target.value)}
                        placeholder="Contoh: 780000"
                        className="h-9"
                      />
                    </div>
                  </div>
                  {/* Live margin preview */}
                  {Number(presetPrice) > 0 && Number(presetBuyInPrice) > 0 && (
                    <div className="flex items-center justify-between text-xs bg-emerald-50 dark:bg-emerald-950/30 rounded-md px-3 py-2">
                      <span className="text-muted-foreground">Margin per m³</span>
                      <span className="font-bold text-emerald-700">
                        Rp {(Number(presetPrice) - Number(presetBuyInPrice)).toLocaleString("id-ID")}
                        <span className="font-normal text-muted-foreground ml-1">
                          ({((Number(presetPrice) - Number(presetBuyInPrice)) / Number(presetPrice) * 100).toFixed(1)}%)
                        </span>
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">PPN Default (%)</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={presetTaxRate}
                    onChange={(e) => setPresetTaxRate(e.target.value)}
                    placeholder="Contoh: 11"
                    className="h-9 w-32"
                  />
                </div>
              </div>

              <DialogFooter className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsPresetDialogOpen(false)}
                  className="w-full sm:w-auto"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={savingPreset}
                  className="w-full sm:w-auto font-medium"
                >
                  {savingPreset ? "Menyimpan..." : "Simpan Produk"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}

PresetItemPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AuthGuard>
      <AppLayout title="Daftar Produk">
        {page}
      </AppLayout>
    </AuthGuard>
  );
};

export default PresetItemPage;
