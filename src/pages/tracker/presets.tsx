import type { ReactElement } from "react";
import { useState, useMemo, Fragment } from "react";
import Head from "next/head";
import { AuthGuard } from "@/components/AuthGuard";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePresetItems } from "@/hooks/usePresetItems";
import { useInvoices } from "@/hooks/useInvoices";
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
import { Badge } from "@/components/ui/badge";
import { Edit, Plus, Trash2, TrendingUp, Info, ChevronDown, ChevronRight, Store, Search } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface GroupedProduct {
  name: string;
  category: string;
  items: InvoicePresetItem[];
  minPrice: number;
  maxPrice: number;
  suppliersCount: number;
  totalPopularity: number;
}

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
  const { invoices } = useInvoices();

  const [isPresetDialogOpen, setIsPresetDialogOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<InvoicePresetItem | null>(null);
  const [presetName, setPresetName] = useState("");
  const [presetDescription, setPresetDescription] = useState("");
  const [presetPrice, setPresetPrice] = useState("");
  const [presetBuyInPrice, setPresetBuyInPrice] = useState("");
  const [presetAjmPrice, setPresetAjmPrice] = useState("");
  const [presetTaxRate, setPresetTaxRate] = useState("");
  const [savingPreset, setSavingPreset] = useState(false);
  const [presetCategory, setPresetCategory] = useState("BETON");
  const [presetSupplier, setPresetSupplier] = useState("KOKO SUPPLIER");
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [filterSupplier, setFilterSupplier] = useState("ALL");
  const [sortOption, setSortOption] = useState("ALL"); // ALL, PRICE_HIGH, PRICE_LOW, POPULAR_HIGH, POPULAR_LOW
  const [expandedProducts, setExpandedProducts] = useState<Record<string, boolean>>({});

  const toggleExpand = (productName: string) => {
    setExpandedProducts(prev => ({
      ...prev,
      [productName]: !prev[productName]
    }));
  };

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
      setPresetCategory(preset.category || "BETON");
      setPresetSupplier(preset.supplier || (preset.category === "BESI" ? "MITRA1" : "KOKO SUPPLIER"));
      setPresetPrice(String(preset.unit_price));
      setPresetBuyInPrice(String(preset.buy_in_price || ""));
      setPresetAjmPrice(String(preset.ajm_price || ""));
      setPresetTaxRate(String(preset.tax_rate));
    } else {
      setEditingPreset(null);
      setPresetName("");
      setPresetDescription("");
      setPresetCategory("BETON");
      setPresetSupplier("KOKO SUPPLIER");
      setPresetPrice("1500000");
      setPresetBuyInPrice("");
      setPresetAjmPrice("");
      setPresetTaxRate("11");
    }
    setIsPresetDialogOpen(true);
  };

  const handleCategoryChange = (newCat: string) => {
    setPresetCategory(newCat);
    if (newCat === "BETON") {
      setPresetSupplier("KOKO SUPPLIER");
    } else if (newCat === "BESI") {
      setPresetSupplier("MITRA1");
    }
  };

  const handleSavePreset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!presetName) return;
    setSavingPreset(true);
    try {
      const unitPrice = Number(presetPrice || 0);
      const buyInPrice = Number(presetBuyInPrice || 0);
      const ajmPrice = Number(presetAjmPrice || unitPrice || 0);

      if (buyInPrice > 0 && unitPrice > 0 && buyInPrice >= unitPrice) {
        toast({
          title: "HPP Tidak Valid",
          description: "Harga HPP harus lebih kecil dari harga dasar jual supaya margin tidak minus.",
          variant: "destructive",
        });
        setSavingPreset(false);
        return;
      }

      const payload = {
        name: presetName,
        description: presetDescription,
        category: presetCategory,
        supplier: presetSupplier,
        unit_price: unitPrice,
        buy_in_price: buyInPrice,
        ajm_price: ajmPrice,
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
    if (!confirm("Apakah Anda yakin ingin menghapus opsi penawaran supplier ini?")) return;
    try {
      await deletePresetItem(id);
      toast({ title: "Berhasil", description: "Opsi produk berhasil dihapus." });
    } catch (err: any) {
      toast({
        title: "Gagal menghapus",
        description: err.message || "Terjadi kesalahan",
        variant: "destructive",
      });
    }
  };

  // Calculate popularity per product name from actual transactions
  const productPopularityMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const inv of invoices) {
      if (inv.status === "batal") continue;
      for (const item of inv.items) {
        const descName = (item.description || "").split("-")[0].trim().toLowerCase();
        const qty = item.actual_quantity != null ? item.actual_quantity : item.quantity;
        map[descName] = (map[descName] || 0) + (qty || 1);
      }
    }
    return map;
  }, [invoices]);

  // Unique suppliers list dynamically generated from current preset items
  const uniqueSuppliers = useMemo(() => {
    const set = new Set<string>();
    presetItems.forEach(item => {
      const sup = item.supplier || ((item.category || "BETON") === "BESI" ? "MITRA1" : "KOKO SUPPLIER");
      if (sup) set.add(sup);
    });
    return Array.from(set).sort();
  }, [presetItems]);

  // Group items by unique product name
  const groupedProducts = useMemo(() => {
    const map: Record<string, InvoicePresetItem[]> = {};
    const searchLower = searchTerm.trim().toLowerCase();

    for (const item of presetItems) {
      if (filterCategory !== "ALL" && (item.category || "BETON") !== filterCategory) {
        continue;
      }
      const itemSup = item.supplier || ((item.category || "BETON") === "BESI" ? "MITRA1" : "KOKO SUPPLIER");
      if (filterSupplier !== "ALL" && itemSup !== filterSupplier) {
        continue;
      }

      if (searchLower) {
        const matchesName = item.name.toLowerCase().includes(searchLower);
        const matchesDesc = (item.description || "").toLowerCase().includes(searchLower);
        const matchesSup = itemSup.toLowerCase().includes(searchLower);
        if (!matchesName && !matchesDesc && !matchesSup) continue;
      }

      const key = item.name.trim();
      if (!map[key]) map[key] = [];
      map[key].push(item);
    }

    const groups: GroupedProduct[] = Object.entries(map).map(([name, items]) => {
      const prices = items.map(i => i.unit_price);
      const category = items[0]?.category || "BETON";
      const totalPop = productPopularityMap[name.toLowerCase()] || 0;
      return {
        name,
        category,
        items,
        minPrice: Math.min(...prices),
        maxPrice: Math.max(...prices),
        suppliersCount: items.length,
        totalPopularity: totalPop,
      };
    });

    if (sortOption === "PRICE_HIGH") {
      groups.sort((a, b) => b.maxPrice - a.maxPrice);
    } else if (sortOption === "PRICE_LOW") {
      groups.sort((a, b) => a.minPrice - b.minPrice);
    } else if (sortOption === "POPULAR_HIGH") {
      groups.sort((a, b) => b.totalPopularity - a.totalPopularity);
    } else if (sortOption === "POPULAR_LOW") {
      groups.sort((a, b) => a.totalPopularity - b.totalPopularity);
    }

    return groups;
  }, [presetItems, filterCategory, filterSupplier, sortOption, searchTerm, productPopularityMap]);

  return (
    <>
      <Head>
        <title>Daftar Produk | {APP_NAME}</title>
      </Head>
      <div className="mx-auto max-w-4xl space-y-4 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-foreground">Katalog Produk & Mitra Supplier</h1>
            <p className="text-xs text-muted-foreground">Kelola produk unik serta penawaran opsi supplier</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => openPresetDialog()}
              className="flex items-center gap-1.5 font-semibold"
            >
              <Plus className="h-4 w-4" />
              Tambah Produk
            </Button>
          </div>
        </div>

        {/* Search Bar Input */}
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Cari nama produk, spesifikasi, atau supplier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-xs bg-card"
          />
        </div>

        {/* Filter Kategori & Sorting Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 border-b pb-3">
          {/* Tabs Kategori */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setFilterCategory("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterCategory === "ALL"
                  ? "bg-primary text-primary-foreground font-bold"
                  : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              Semua ({groupedProducts.length} Produk)
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory("BETON")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterCategory === "BETON"
                  ? "bg-primary text-primary-foreground font-bold"
                  : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              BETON ({groupedProducts.filter(g => g.category === "BETON").length})
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory("BESI")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterCategory === "BESI"
                  ? "bg-primary text-primary-foreground font-bold"
                  : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              BESI ({groupedProducts.filter(g => g.category === "BESI").length})
            </button>
          </div>

          {/* Filter Supplier & Sort Select Dropdowns */}
          <div className="flex items-center gap-2">
            <Select value={filterSupplier} onValueChange={setFilterSupplier}>
              <SelectTrigger className="h-8 text-xs font-semibold w-[140px]">
                <SelectValue placeholder="Semua Supplier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Supplier</SelectItem>
                {uniqueSuppliers.map((sup) => (
                  <SelectItem key={sup} value={sup}>
                    {sup}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortOption} onValueChange={setSortOption}>
              <SelectTrigger className="h-8 text-xs font-semibold w-[150px]">
                <SelectValue placeholder="Urutan Produk" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Default</SelectItem>
                <SelectItem value="PRICE_HIGH">Harga Tertinggi</SelectItem>
                <SelectItem value="PRICE_LOW">Harga Terendah</SelectItem>
                <SelectItem value="POPULAR_HIGH">Terlaris (Paling Banyak)</SelectItem>
                <SelectItem value="POPULAR_LOW">Kurang Laris</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="relative w-full overflow-auto rounded-xl border bg-card shadow-xs">
          {loadingPresets ? (
            <div className="p-8 text-center text-sm text-muted-foreground animate-pulse">
              Memuat katalog produk...
            </div>
          ) : groupedProducts.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Belum ada produk untuk kriteria filter ini. Klik "Tambah Produk" untuk mulai membuat.
            </div>
          ) : (
            <table className="w-full caption-bottom text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-xs text-muted-foreground uppercase font-bold tracking-wider text-left">Nama Produk & Spesifikasi</th>
                  <th className="px-4 py-3 text-xs text-muted-foreground uppercase font-bold tracking-wider text-left">Kategori</th>
                  <th className="px-4 py-3 text-xs text-muted-foreground uppercase font-bold tracking-wider text-right">Harga Dasar Jual</th>
                  <th className="px-4 py-3 text-xs text-muted-foreground uppercase font-bold tracking-wider text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {groupedProducts.map((group) => {
                  const mainItem = group.items[0];
                  return (
                    <tr key={group.name} className="border-b transition-colors hover:bg-muted/40">
                      <td className="px-4 py-3 align-middle">
                        <p className="font-bold text-foreground text-sm">{group.name}</p>
                        {mainItem?.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">{mainItem.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <span className="text-xs font-semibold text-muted-foreground">
                          {group.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right align-middle font-bold text-foreground">
                        Rp {group.minPrice.toLocaleString("id-ID")}
                      </td>
                      <td className="px-4 py-3 align-middle text-right space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => openPresetDialog(mainItem)}
                          title="Edit Produk"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeletePreset(mainItem.id)}
                          title="Hapus Produk"
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
                  Atur nama, kategori barang, supplier, dan harga dasar.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Nama Produk / Spesifikasi</label>
                  <Input
                    required
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    placeholder="Contoh: Beton K300 NFA / Wiremesh M6"
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Deskripsi (Opsional)</label>
                  <Input
                    value={presetDescription}
                    onChange={(e) => setPresetDescription(e.target.value)}
                    placeholder="Contoh: Readymix mutu K-300 / Per lembar 2.1m x 5.4m"
                    className="h-9"
                  />
                </div>

                {/* Kategori Barang & Supplier Section */}
                <div className="grid grid-cols-2 gap-3 p-3 rounded-lg border bg-muted/20">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Kategori Barang</label>
                    <select
                      value={presetCategory}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="BETON">BETON</option>
                      <option value="BESI">BESI</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Supplier</label>
                    <select
                      value={presetSupplier}
                      onChange={(e) => setPresetSupplier(e.target.value)}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="KOKO SUPPLIER">KOKO SUPPLIER</option>
                      <option value="MITRA1">MITRA1</option>
                    </select>
                  </div>
                </div>

                {/* Harga Section */}
                <div className="rounded-lg border bg-muted/20 p-3 space-y-3">
                  <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                    Harga & PPN
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground">Harga Dasar Jual (Rp)</label>
                      <Input
                        type="number"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        min="0"
                        required
                        value={presetPrice}
                        onChange={(e) => setPresetPrice(e.target.value)}
                        placeholder="Contoh: 850000"
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground">HPP / Harga Beli (Rp)</label>
                      <Input
                        type="number"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        min="0"
                        value={presetBuyInPrice}
                        onChange={(e) => setPresetBuyInPrice(e.target.value)}
                        placeholder="Contoh: 650000"
                        className="h-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">Harga AJM / Net</label>
                    <Input
                      type="number"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      min="0"
                      value={presetAjmPrice}
                      onChange={(e) => setPresetAjmPrice(e.target.value)}
                      placeholder="Contoh: 800000"
                      className="h-9"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">PPN Default (%)</label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
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
