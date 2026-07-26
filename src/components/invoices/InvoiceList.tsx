import Link from "next/link";
import { useRouter } from "next/router";
import { FilePlus, Search, Trash2, Eye, Printer, Filter, Calendar, Building2, User, X, FileText, ChevronLeft, ChevronRight, MessageCircle } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useInvoices, useInvoiceFilterOptions } from "@/hooks/useInvoices";
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

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const ITEMS_PER_PAGE = 10;

export function InvoiceList() {
  const { clients } = useClients();
  const { user } = useAuth();
  const router = useRouter();
  
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [salesFilter, setSalesFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [productFilter, setProductFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isGeneratingId, setIsGeneratingId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 500);

  const { options: filterOptions } = useInvoiceFilterOptions();

  const { invoices, pagination, isLoading, deleteInvoice } = useInvoices({
    search: debouncedSearch,
    status: statusFilter,
    client_id: clientFilter,
    sales: salesFilter,
    product: productFilter,
    city: cityFilter,
    sort: sortOrder,
    page: currentPage,
    limit: ITEMS_PER_PAGE,
  });

  // Dynamic filter dropdown options are now text inputs to support full DB search

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


  const isRestrictedUser = user?.role === "user" || user?.role === "sales";

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
            <Button asChild className="h-10 font-bold text-xs bg-primary text-primary-foreground hover:bg-primary/90 shrink-0">
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
          {!isRestrictedUser && filterOptions.sales.length > 0 && (
            <Select value={salesFilter} onValueChange={setSalesFilter}>
              <SelectTrigger className="h-9 text-xs font-semibold">
                <SelectValue placeholder="Semua Sales" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Sales</SelectItem>
                {filterOptions.sales.map((email) => (
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
          {filterOptions.products.length > 0 && (
            <Select value={productFilter} onValueChange={setProductFilter}>
              <SelectTrigger className="h-9 text-xs font-semibold">
                <SelectValue placeholder="Semua Produk" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Produk</SelectItem>
                {filterOptions.products.map((prod) => (
                  <SelectItem key={prod} value={prod}>
                    {prod.length > 25 ? prod.slice(0, 25) + "..." : prod}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Filter Tujuan / Kota */}
          {filterOptions.cities.length > 0 && (
            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger className="h-9 text-xs font-semibold">
                <SelectValue placeholder="Tujuan / Lokasi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tujuan</SelectItem>
                {filterOptions.cities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city.length > 25 ? city.slice(0, 25) + "..." : city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

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
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="group relative flex flex-col justify-between border border-slate-100 dark:border-slate-800 rounded-lg bg-card p-3 shadow-none">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="h-3 w-16 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                </div>
                <div className="h-4 w-32 bg-muted animate-pulse rounded mb-1" />
                <div className="h-3 w-40 bg-muted animate-pulse rounded" />
                <div className="h-2 w-24 bg-muted animate-pulse rounded mt-1.5" />
                <div className="flex items-center justify-between mt-3 mb-2.5">
                  <div className="h-3 w-10 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                </div>
              </div>
              <div className="flex items-center justify-end gap-1.5 border-t border-slate-100 pt-2.5 dark:border-slate-800">
                <div className="h-7 w-16 bg-muted animate-pulse rounded" />
                <div className="h-7 w-8 bg-muted animate-pulse rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : invoices.length === 0 ? (
        <section className="rounded-xl border bg-card p-12 text-center max-w-xl mx-auto">
          <div className="p-3 bg-muted/50 rounded-full w-fit mx-auto mb-3">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-base text-foreground">Tidak ada transaksi ditemukan</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Coba ubah kata kunci pencarian atau filter Anda, atau buat transaksi baru.
          </p>

        </section>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {invoices.map((invoice) => {
            const statusConfig = INVOICE_STATUS_CONFIG[invoice.status] || {
              label: invoice.status,
              bgColor: "bg-muted",
              color: "text-muted-foreground",
            };
            return (
              <div
                key={invoice.id}
                className="group relative flex flex-col justify-between border border-slate-100 dark:border-slate-800 rounded-lg bg-card p-3 shadow-none hover:shadow-xs hover:border-slate-200 transition-all duration-150 cursor-pointer"
                onClick={() => router.push(`/tracker/invoices/${invoice.id}`)}
              >
                <div className="block flex-1">
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
                    <div className="text-[10px] text-muted-foreground mt-1.5 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 truncate">
                        <User className="h-3 w-3 shrink-0" />
                        <span className="truncate">Sales: {invoice.user.email.split("@")[0]}</span>
                      </div>
                      {invoice.user.phone && (
                        <a 
                          href={`https://wa.me/62${invoice.user.phone.replace(/^0+/, "").replace(/\D/g, "")}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 hover:underline shrink-0 z-10"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MessageCircle className="h-3 w-3" />
                          Chat
                        </a>
                      )}
                    </div>
                  )}

                  {/* Total Value (No Border Divider) */}
                  <div className="text-xs text-muted-foreground flex items-center justify-between mt-2 mb-2.5">
                    <span>Total</span>
                    <span className="font-extrabold text-xs text-slate-900 dark:text-slate-100">
                      {invoice.currency} {invoice.total.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>

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
          {pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t text-xs text-muted-foreground">
              <div>
                Menampilkan <span className="font-bold text-foreground">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> - <span className="font-bold text-foreground">{Math.min(currentPage * ITEMS_PER_PAGE, pagination.total)}</span> dari <span className="font-bold text-foreground">{pagination.total}</span> transaksi
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
                  {currentPage} / {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 text-xs"
                  disabled={currentPage === pagination.totalPages}
                  onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
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
