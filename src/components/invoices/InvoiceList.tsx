import Link from "next/link";
import { FilePlus, Search, Trash2, Eye, Printer, Filter, Calendar, Building2, User, X, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useInvoices } from "@/hooks/useInvoices";
import { useClients } from "@/hooks/useClients";
import { useAuth } from "@/hooks/useAuth";
import { INVOICE_STATUS_CONFIG } from "@/types/invoice";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { downloadPDF, DocType } from "@/lib/pdfExport";
import { loadCompanyProfile } from "@/lib/companyProfile";

const ITEMS_PER_PAGE = 10;

export function InvoiceList() {
  const { invoices, isLoading, deleteInvoice } = useInvoices();
  const { clients } = useClients();
  const { user } = useAuth();
  
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [salesFilter, setSalesFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [productFilter, setProductFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isGeneratingId, setIsGeneratingId] = useState<string | null>(null);

  // Dynamic filter dropdown options
  const salesOptions = useMemo(() => {
    const set = new Set<string>();
    invoices.forEach((inv) => {
      if ((inv as any).user?.email) set.add((inv as any).user.email);
    });
    return Array.from(set).sort();
  }, [invoices]);

  const productOptions = useMemo(() => {
    const set = new Set<string>();
    invoices.forEach((inv) => {
      inv.items?.forEach((item) => {
        const name = (item.description || "").split("-")[0].trim();
        if (name) set.add(name);
      });
    });
    return Array.from(set).sort();
  }, [invoices]);

  const cityOptions = useMemo(() => {
    const set = new Set<string>();
    invoices.forEach((inv) => {
      const addr = inv.client.address || "";
      const notes = inv.notes || "";
      if (addr.trim()) set.add(addr.trim());
      if (notes.trim()) set.add(notes.trim());
    });
    return Array.from(set).slice(0, 15);
  }, [invoices]);

  const handlePrintList = async (invoice: any) => {
    setIsGeneratingId(invoice.id);
    try {
      const company = loadCompanyProfile();
      let docType: DocType = "quotation";
      if (invoice.status === "tagihan") docType = "invoice";
      if (invoice.status === "pengiriman") docType = "po";
      if (invoice.status === "selesai") docType = "receipt";
      
      const includePpn = invoice.tax > 0;
      await downloadPDF(docType, invoice, company, includePpn);
    } catch (error) {
      console.error(error);
      alert("Gagal mengunduh dokumen PDF.");
    } finally {
      setIsGeneratingId(null);
    }
  };

  const filtered = useMemo(() => {
    let result = invoices;

    // Filter by search query
    if (search.trim()) {
      const query = search.toLowerCase().trim();
      result = result.filter(
        (inv) =>
          inv.invoice_number.toLowerCase().includes(query) ||
          inv.client.name.toLowerCase().includes(query) ||
          (inv.client.company && inv.client.company.toLowerCase().includes(query)) ||
          (inv.notes && inv.notes.toLowerCase().includes(query)) ||
          (inv.client.address && inv.client.address.toLowerCase().includes(query))
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      result = result.filter((inv) => inv.status === statusFilter);
    }

    // Filter by client
    if (clientFilter !== "all") {
      result = result.filter((inv) => inv.client_id === clientFilter);
    }

    // Filter by sales
    if (salesFilter !== "all") {
      result = result.filter((inv) => (inv as any).user?.email === salesFilter);
    }

    // Filter by product
    if (productFilter !== "all") {
      result = result.filter((inv) =>
        inv.items?.some((it) => (it.description || "").toLowerCase().includes(productFilter.toLowerCase()))
      );
    }

    // Filter by city / location
    if (cityFilter !== "all") {
      result = result.filter(
        (inv) =>
          (inv.client.address && inv.client.address.includes(cityFilter)) ||
          (inv.notes && inv.notes.includes(cityFilter))
      );
    }

    // Sorting
    return [...result].sort((a, b) => {
      if (sortOrder === "total_high") return b.total - a.total;
      if (sortOrder === "total_low") return a.total - b.total;
      if (sortOrder === "oldest") return new Date(a.issue_date).getTime() - new Date(b.issue_date).getTime();
      return new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime();
    });
  }, [invoices, search, statusFilter, clientFilter, salesFilter, productFilter, cityFilter, sortOrder]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, clientFilter, salesFilter, productFilter, cityFilter, sortOrder]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  const paginatedInvoices = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  const hasActiveFilters =
    search !== "" ||
    statusFilter !== "all" ||
    clientFilter !== "all" ||
    salesFilter !== "all" ||
    productFilter !== "all" ||
    cityFilter !== "all" ||
    sortOrder !== "newest";

  const handleResetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setClientFilter("all");
    setSalesFilter("all");
    setProductFilter("all");
    setCityFilter("all");
    setSortOrder("newest");
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 p-4 md:p-6 max-w-6xl mx-auto sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="h-48 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    );
  }

  const isRestrictedUser = user?.role === "user";

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-6xl mx-auto">
      {/* Controls & Filter Bar */}
      <div className="flex flex-col gap-4 bg-card p-4 rounded-xl border shadow-xs">
        {/* Row 1: Search and Filter/Create Action */}
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari invoice, pelanggan, proyek, atau kota/lokasi..."
              className="pl-9 h-10 text-xs w-full"
            />
          </div>

          {!isRestrictedUser && (
            <Button asChild className="h-10 font-bold text-xs bg-slate-800 hover:bg-slate-900 shrink-0">
              <Link href="/tracker/invoices/new">
                <FilePlus className="mr-1.5 h-4 w-4" />
                Buat Transaksi
              </Link>
            </Button>
          )}
        </div>

        {/* Row 2: Filter Select Dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 border-t pt-3">
          {/* Urutan (Transaksi Tinggi/Kecil) */}
          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger className="h-9 text-xs font-semibold">
              <SelectValue placeholder="Urutan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Terbaru</SelectItem>
              <SelectItem value="oldest">Terlama</SelectItem>
              <SelectItem value="total_high">Transaksi Tertinggi</SelectItem>
              <SelectItem value="total_low">Transaksi Terendah</SelectItem>
            </SelectContent>
          </Select>

          {/* Filter Sales */}
          {!isRestrictedUser && (
            <Select value={salesFilter} onValueChange={setSalesFilter}>
              <SelectTrigger className="h-9 text-xs font-semibold">
                <SelectValue placeholder="Semua Sales" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Sales</SelectItem>
                {salesOptions.map((email) => (
                  <SelectItem key={email} value={email}>
                    {email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Filter Pelanggan */}
          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger className="h-9 text-xs font-semibold">
              <SelectValue placeholder="Semua Pelanggan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Pelanggan</SelectItem>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filter Produk */}
          <Select value={productFilter} onValueChange={setProductFilter}>
            <SelectTrigger className="h-9 text-xs font-semibold">
              <SelectValue placeholder="Semua Produk" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Produk</SelectItem>
              {productOptions.map((prod) => (
                <SelectItem key={prod} value={prod}>
                  {prod}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filter Tujuan / Kota */}
          {cityOptions.length > 0 && (
            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger className="h-9 text-xs font-semibold">
                <SelectValue placeholder="Tujuan / Lokasi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tujuan</SelectItem>
                {cityOptions.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city.length > 25 ? city.slice(0, 25) + "..." : city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Reset Filter Button if Active */}
        {hasActiveFilters && (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-7 text-xs text-muted-foreground hover:text-destructive flex items-center gap-1"
            >
              <X className="h-3.5 w-3.5" /> Reset Filter
            </Button>
          </div>
        )}

        {/* Row 2: Underline Category Tabs */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
          <div className="flex gap-6 overflow-x-auto no-scrollbar pb-0.5 scroll-smooth">
            {[
              { value: "all", label: "Semua" },
              { value: "penawaran", label: "Penawaran" },
              { value: "tagihan", label: "Tagihan" },
              { value: "po", label: "PO" },
              { value: "pengiriman", label: "Pengiriman" },
              { value: "selesai", label: "Selesai" },
              { value: "batal", label: "Batal" },
            ].map((tab) => {
              const isActive = statusFilter === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => setStatusFilter(tab.value)}
                  className={`whitespace-nowrap pb-2 text-xs font-extrabold transition-all relative ${
                    isActive
                      ? "text-primary border-b-2 border-primary"
                      : "text-muted-foreground border-b-2 border-transparent hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Invoice List / Grid of Cards */}
      {filtered.length === 0 ? (
        <section className="rounded-xl border bg-card p-12 text-center max-w-xl mx-auto">
          <div className="p-3 bg-muted/50 rounded-full w-fit mx-auto mb-3">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-base text-foreground">Tidak ada transaksi ditemukan</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {hasActiveFilters
              ? "Coba ubah kata kunci pencarian atau filter status Anda."
              : "Buat transaksi baru untuk mengelola penawaran, invoice, PO, dan kwitansi."}
          </p>

        </section>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedInvoices.map((invoice) => {
            const statusConfig = INVOICE_STATUS_CONFIG[invoice.status] || {
              label: invoice.status,
              bgColor: "bg-muted",
              color: "text-muted-foreground",
            };
            return (
              <div
                key={invoice.id}
                className="group relative flex flex-col justify-between border border-slate-100 dark:border-slate-800 rounded-lg bg-card p-3 shadow-none hover:shadow-xs hover:border-slate-200 transition-all duration-150"
              >
                <Link href={`/tracker/invoices/${invoice.id}`} className="block flex-1">
                  {/* Top Bar: Date & Status (Text Only, No Border/Badge) */}
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1.5">
                    <span>{new Date(invoice.issue_date).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    
                    <span className={`font-extrabold ${
                      invoice.status === "penawaran" ? "text-slate-500" :
                      invoice.status === "tagihan" ? "text-amber-600" :
                      invoice.status === "pengiriman" ? "text-blue-600" :
                      invoice.status === "selesai" ? "text-emerald-600" :
                      "text-red-600"
                    }`}>
                      {statusConfig.label}
                    </span>
                  </div>

                  {/* Invoice Number */}
                  <h4 className="font-extrabold text-xs text-foreground truncate group-hover:text-primary transition-colors mb-0.5">
                    {invoice.invoice_number}
                  </h4>

                  {/* Client Info */}
                  <div className="text-xs text-slate-700 dark:text-slate-300 truncate">
                    {invoice.client.name}
                  </div>
                  
                  {invoice.client.company && (
                    <div className="text-[10px] text-muted-foreground truncate">
                      {invoice.client.company}
                    </div>
                  )}

                  {/* Sales Rep Info for Admins */}
                  {!isRestrictedUser && invoice.user?.email && (
                    <div className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
                      <User className="h-3 w-3" />
                      Sales: {invoice.user.email}
                    </div>
                  )}

                  {/* Total Value (No Border Divider) */}
                  <div className="text-xs text-muted-foreground flex items-center justify-between mt-2 mb-2.5">
                    <span>Total</span>
                    <span className="font-extrabold text-xs text-slate-900 dark:text-slate-100">
                      {invoice.currency} {invoice.total.toLocaleString("id-ID")}
                    </span>
                  </div>
                </Link>

                {/* Action Buttons (Print, Delete only) */}
                <div className="flex items-center justify-end gap-1.5 border-t border-slate-100 pt-2.5 dark:border-slate-800">
                  {/* View/Print PDF Button */}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    title="Cetak Dokumen Saat Ini"
                    className="text-[10px] h-7 px-2.5 py-0.5 text-muted-foreground border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900"
                    disabled={isGeneratingId === invoice.id}
                    onClick={() => handlePrintList(invoice)}
                  >
                    <Printer className={`h-3 w-3 mr-1 ${isGeneratingId === invoice.id ? "animate-pulse" : ""}`} />
                    Cetak
                  </Button>

                  {/* Delete Invoice Button */}
                  {!isRestrictedUser && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      title="Hapus Transaksi"
                      className="text-[10px] h-7 px-2.5 py-0.5 text-destructive hover:bg-destructive/10 hover:text-destructive border-slate-200 dark:border-slate-800"
                      onClick={() => {
                        if (confirm("Hapus transaksi ini secara permanen?")) {
                          deleteInvoice(invoice.id).catch(() => {
                            // error sudah di-handle (toast) di dalam hook
                          });
                        }
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t text-xs text-muted-foreground">
              <div>
                Menampilkan <span className="font-bold text-foreground">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> - <span className="font-bold text-foreground">{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)}</span> dari <span className="font-bold text-foreground">{filtered.length}</span> transaksi
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 text-xs"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Sebelumnya
                </Button>
                <span className="px-3 font-semibold text-foreground">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 text-xs"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                >
                  Selanjutnya
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
