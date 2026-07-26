import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RevenueChart } from "./RevenueChart";
import { useInvoices } from "@/hooks/useInvoices";
import { INVOICE_STATUS_CONFIG, INVOICE_STATUSES } from "@/types/invoice";

const MARGIN_PER_PAGE = 10;

export function InvoiceDashboard() {
  const { invoices, isLoading, isValidating } = useInvoices();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"invoices" | "finance" | "sales">("invoices");
  const [timeFilter, setTimeFilter] = useState<"all" | "year" | "month">("all");
  const [marginPage, setMarginPage] = useState(1);

  const stats = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const filteredInvoices = invoices.filter(inv => {
      if (timeFilter === "all") return true;
      const issueDate = inv.issue_date ? new Date(inv.issue_date) : new Date();
      if (timeFilter === "year") return issueDate.getFullYear() === currentYear;
      if (timeFilter === "month") return issueDate.getFullYear() === currentYear && issueDate.getMonth() === currentMonth;
      return true;
    });

    const byStatus: Record<string, number> = {};
    let outstanding = 0;
    let paid = 0;
    
    // Profit & Margin stats (only counting non-void invoices)
    let totalVolume = 0;
    let totalRevenue = 0;
    let totalHpp     = 0;
    let totalHppDibayar = 0;
    let totalDiscount= 0;
    let totalPOVolume = 0;
    let totalSisaPO = 0;
    let totalAjm = 0;
    let totalEksternalFee = 0;

    const bySales: Record<
      string,
      { email: string; totalRevenue: number; totalVolume: number; invoiceCount: number; totalCommission: number; products: Record<string, { volume: number; revenue: number }> }
    > = {};
    const byProductSisa: Record<string, number> = {};
    const chartDataMap: Record<string, { label: string; revenue: number; profit: number; order: number }> = {};

    // Helper for month names
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];

    // Pre-populate chart skeleton so all slots always appear (even when empty)
    if (timeFilter === "year") {
      // 12 months for current year
      for (let m = 0; m < 12; m++) {
        chartDataMap[`${m}`] = { label: monthNames[m], revenue: 0, profit: 0, order: m };
      }
    } else if (timeFilter === "month") {
      // All days in current month
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        chartDataMap[`${d}`] = { label: `${d}`, revenue: 0, profit: 0, order: d };
      }
    } else {
      // "all" — show all 12 months for every year that has data; pre-seed current year
      for (let m = 0; m < 12; m++) {
        const key = `${currentYear}-${m}`;
        chartDataMap[key] = { label: `${monthNames[m]} '${String(currentYear).slice(2)}`, revenue: 0, profit: 0, order: currentYear * 100 + m };
      }
    }

    for (const invoice of filteredInvoices) {
      byStatus[invoice.status] = (byStatus[invoice.status] || 0) + 1;
      if (invoice.status === "selesai") paid += invoice.total;
      if (invoice.status !== "selesai" && invoice.status !== "batal") {
        outstanding += invoice.total;
      }

      if (invoice.status !== "batal") {
        totalDiscount += invoice.discount || 0;
        for (const item of invoice.items || []) {
          const poQty = Number(item.quantity || 0);
          const qty = item.actual_quantity != null
            ? Number(item.actual_quantity)
            : poQty;
            
          totalVolume  += qty;
          totalPOVolume += poQty;
          const sisa = poQty - qty;
          totalSisaPO += sisa;
          
          if (sisa !== 0) {
            const productName = (item.description || "Unknown").split("-")[0].trim();
            byProductSisa[productName] = (byProductSisa[productName] || 0) + sisa;
          }

          const dealPrice = Number(item.unit_price || 0);
          const ajmPrice = item.ajm_price != null ? Number(item.ajm_price) : dealPrice;

          totalRevenue += qty * dealPrice;  // deal (tanpa PPN)
          totalAjm += qty * ajmPrice; // AJM (tanpa PPN)
          totalEksternalFee += qty * (dealPrice - ajmPrice); // Fee mandor/eksternal
          totalHpp     += qty * Number(item.buy_in_price || 0);  // hpp terpakai (tanpa PPN)
          totalHppDibayar += poQty * Number(item.buy_in_price || 0); // uang keluar ke supplier (tanpa PPN)
        }
        // Sales Metrics
        const email = (invoice as any).user?.email || "Unknown";
        if (!bySales[email]) {
          bySales[email] = { email, totalRevenue: 0, totalVolume: 0, invoiceCount: 0, totalCommission: 0, products: {} };
        }
        bySales[email].invoiceCount += 1;
        
        let invVol = 0;
        let invRev = 0;
        let invComm = 0;
        for (const item of invoice.items || []) {
          const qty = item.actual_quantity != null ? Number(item.actual_quantity) : Number(item.quantity || 0);
          const rev = qty * Number(item.unit_price || 0);
          invVol += qty;
          invRev += rev;
          invComm += qty * Number((item as any).commission_rate ?? 5000);

          const productName = (item.description || "Unknown").split("-")[0].trim();
          if (!bySales[email].products[productName]) {
            bySales[email].products[productName] = { volume: 0, revenue: 0 };
          }
          bySales[email].products[productName].volume += qty;
          bySales[email].products[productName].revenue += rev;
        }
        bySales[email].totalVolume += invVol;
        bySales[email].totalRevenue += invRev;
        bySales[email].totalCommission += invComm;

        // Chart Data Aggregation
        const issueDate = invoice.issue_date ? new Date(invoice.issue_date) : new Date();
        let chartKey = "";
        let chartLabel = "";
        let order = 0;

        if (timeFilter === "all") {
          // Group by Month-Year (so single-year datasets still show month breakdown)
          const y = issueDate.getFullYear();
          const m = issueDate.getMonth();
          chartKey = `${y}-${m}`;
          chartLabel = `${monthNames[m]} '${String(y).slice(2)}`;
          order = y * 100 + m;
        } else if (timeFilter === "year") {
          // Group by Month within current year
          const m = issueDate.getMonth();
          chartKey = `${m}`;
          chartLabel = monthNames[m];
          order = m;
        } else if (timeFilter === "month") {
          // Group by Date within current month
          const d = issueDate.getDate();
          chartKey = `${d}`;
          chartLabel = `${d}`;
          order = d;
        }

        if (!chartDataMap[chartKey]) {
          chartDataMap[chartKey] = { label: chartLabel, revenue: 0, profit: 0, order };
        }
        
        // Calculate exact profit for this invoice
        const invHppDibayar = invoice.items.reduce((s, i) => s + (Number(i.quantity || 0) * Number(i.buy_in_price || 0)), 0);
        const invPpnSupp = Math.round(invHppDibayar * 0.11);
        const invBuyIn = invHppDibayar + invPpnSupp;
        const invFee = Number((invoice as any).fee || 0);
        
        let invAjm = 0;
        let invHpp = 0;
        for (const item of invoice.items || []) {
          const qty = item.actual_quantity != null ? Number(item.actual_quantity) : Number(item.quantity || 0);
          const dealP = Number(item.unit_price || 0);
          const ajmP = item.ajm_price != null ? Number(item.ajm_price) : dealP;
          invAjm += qty * ajmP;
          invHpp += qty * Number(item.buy_in_price || 0);
        }
        const invProfit = invAjm - invHpp - invFee;

        chartDataMap[chartKey].revenue += invRev;
        chartDataMap[chartKey].profit += invProfit;
      }
    }

    // Convert chart map to array and sort
    const chartData = Object.values(chartDataMap).sort((a, b) => a.order - b.order);

    const totalPpnSupplier = Math.round(totalHppDibayar * 0.11);
    const totalBuyIn       = totalHppDibayar + totalPpnSupplier;
    const totalGlobalFee   = invoices
      .filter((inv) => inv.status !== "batal")
      .reduce((sum, inv) => sum + Number((inv as any).fee || 0), 0);
    const grossProfit    = totalAjm - totalHpp - totalGlobalFee;
    const avgMarginPerM3 = totalVolume > 0 ? grossProfit / totalVolume : 0;

    // Top Buyers / Loyal Customers
    const byClient: Record<
      string,
      { id: string; name: string; company: string; invoiceCount: number; totalDeal: number; totalVolume: number; lastOrderDate: string }
    > = {};
    for (const inv of filteredInvoices.filter((i) => i.status !== "batal")) {
      const cid   = inv.client_id;
      const name  = inv.client?.name || "—";
      const co    = inv.client?.company || "";
      if (!byClient[cid]) byClient[cid] = { id: cid, name, company: co, invoiceCount: 0, totalDeal: 0, totalVolume: 0, lastOrderDate: "" };
      byClient[cid].invoiceCount += 1;
      byClient[cid].totalDeal    += inv.items.reduce((s, it) => {
        const q = it.actual_quantity != null ? Number(it.actual_quantity) : Number(it.quantity || 0);
        return s + q * Number(it.unit_price || 0);
      }, 0);
      byClient[cid].totalVolume  += inv.items.reduce((s, it) => {
        const q = it.actual_quantity != null ? Number(it.actual_quantity) : Number(it.quantity || 0);
        return s + q;
      }, 0);
      if (!byClient[cid].lastOrderDate || inv.issue_date > byClient[cid].lastOrderDate) {
        byClient[cid].lastOrderDate = inv.issue_date || "";
      }
    }
    const topBuyers = Object.values(byClient)
      .sort((a, b) => b.totalDeal - a.totalDeal)
      .slice(0, 10);

    return {
      byStatus,
      outstanding,
      paid,
      overdue: byStatus.overdue || 0,
      totalVolume,
      totalRevenue,
      totalHpp,
      totalHppDibayar,
      totalPpnSupplier,
      totalBuyIn,
      totalFee: totalGlobalFee + totalEksternalFee,
      grossProfit,
      avgMarginPerM3,
      totalPOVolume,
      totalSisaPO,
      salesStats: Object.values(bySales).sort((a, b) => b.totalRevenue - a.totalRevenue),
      sisaStats: Object.entries(byProductSisa).filter(([_, val]) => val !== 0).sort((a, b) => b[1] - a[1]),
      chartData,
      topBuyers,
    };
  }, [invoices, timeFilter]);

  if (isLoading) {
    return (
      <div className="space-y-4 p-4 md:p-5">
        <div className="h-10 w-48 animate-pulse rounded-lg bg-muted" />
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-20 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 md:p-5">
      {/* Syncing status */}
      {isValidating && !isLoading && (
        <div className="flex items-center justify-end gap-1.5 -mb-2">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary/60" />
          <span className="text-[10px] text-muted-foreground">Memperbarui...</span>
        </div>
      )}

      {/* Tabs Switcher & Filter */}
      <div className="flex flex-col sm:flex-row justify-between border-b gap-3 sm:gap-0">
        <div className="flex overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab("invoices")}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "invoices"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Ringkasan
          </button>
          <button
            onClick={() => setActiveTab("finance")}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "finance"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Laba Rugi
          </button>
          <button
            onClick={() => setActiveTab("sales")}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "sales"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Sales
          </button>
        </div>
        <div className="py-1 pr-2 self-start sm:self-auto">
          <Select value={timeFilter} onValueChange={(val: any) => setTimeFilter(val)}>
            <SelectTrigger className="w-[150px] h-9 text-xs font-semibold bg-background shadow-sm">
              <SelectValue placeholder="Filter Waktu" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Waktu</SelectItem>
              <SelectItem value="year">Tahun Ini</SelectItem>
              <SelectItem value="month">Bulan Ini</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {activeTab === "invoices" ? (
        <>
          {/* Metrics Panel */}
          <section className="grid grid-cols-2 overflow-hidden rounded-lg border bg-card md:grid-cols-4">
            <div className="p-4">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase">Total Invoice</p>
              <p className="mt-1 truncate text-xl font-bold text-foreground">{invoices.length}</p>
            </div>
            <div className="p-4 border-l">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase">Piutang</p>
              <p className="mt-1 truncate text-xl font-bold text-foreground">
                Rp {stats.outstanding.toLocaleString("id-ID")}
              </p>
            </div>
            <div className="p-4 border-t md:border-t-0 md:border-l">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase">Telah Dibayar</p>
              <p className="mt-1 truncate text-xl font-bold text-emerald-600">
                Rp {stats.paid.toLocaleString("id-ID")}
              </p>
            </div>
            <div className="p-4 border-t md:border-t-0 border-l">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase">Jatuh Tempo</p>
              <p className="mt-1 truncate text-xl font-bold text-destructive">{stats.overdue}</p>
            </div>
          </section>

          {/* Sisa Saldo per Produk Panel (Moved from Finance tab) */}
          <section className="rounded-lg border bg-card p-4 space-y-3">
            <h2 className="text-xs font-bold text-foreground uppercase tracking-wide flex items-center gap-1.5">
              Rincian Sisa Saldo PO per Produk
            </h2>
            {stats.sisaStats.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                {stats.sisaStats.map(([product, sisa]) => (
                  <div key={product} className="flex justify-between items-center border-b pb-2">
                    <span className="text-sm font-semibold truncate pr-2 text-slate-700">{product}</span>
                    <span className={`text-sm font-bold whitespace-nowrap ${sisa > 0 ? "text-blue-600" : "text-amber-600"}`}>
                      {sisa > 0 ? "+" : ""}{sisa.toLocaleString("id-ID", { maximumFractionDigits: 2 })} m³
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic py-2 text-center">
                Belum ada sisa saldo PO produk yang tercatat.
              </p>
            )}
          </section>

          <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
            {/* Status Breakdown */}
            <section className="rounded-lg border bg-card p-4 space-y-3">
              <h2 className="text-xs font-bold text-foreground uppercase tracking-wide">Status Breakdown</h2>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
                {INVOICE_STATUSES.map((status) => (
                  <div key={status} className="flex items-center justify-between text-sm border-b pb-1.5">
                    <span className="truncate text-muted-foreground">
                      {INVOICE_STATUS_CONFIG[status].label}
                    </span>
                    <span className="font-semibold text-foreground">{stats.byStatus[status] || 0}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Recent Invoices */}
            <section className="rounded-lg border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-xs font-bold text-foreground uppercase tracking-wide">Invoice Terbaru</h2>
                <Button asChild size="sm" variant="outline">
                  <Link href="/tracker/invoices/new">
                    Baru
                  </Link>
                </Button>
              </div>
              {invoices.length === 0 ? (
                <p className="py-8 text-center text-xs text-muted-foreground">Belum ada invoice</p>
              ) : (
                <div className="divide-y text-xs">
                  {invoices.slice(0, 5).map((invoice) => (
                    <Link
                      key={invoice.id}
                      href={`/tracker/invoices/${invoice.id}`}
                      className="flex items-center gap-3 py-2.5 hover:bg-muted/30 px-1 rounded transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{invoice.invoice_number}</p>
                        <p className="truncate text-[10px] text-muted-foreground mt-0.5">
                          {invoice.client.company || invoice.client.name}
                        </p>
                      </div>
                      <span className="shrink-0 font-bold text-foreground">
                        Rp {invoice.total.toLocaleString("id-ID")}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Top Buyer / Pelanggan Royal */}
          <section className="rounded-lg border bg-card p-4 space-y-3">
            <div>
              <h2 className="text-xs font-bold text-foreground uppercase tracking-wide flex items-center gap-1.5">
                Top Buyer & Pelanggan Royal
              </h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">Pelanggan dengan total transaksi tertinggi berdasarkan periode yang dipilih.</p>
            </div>
            {stats.topBuyers.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-3 text-center">Belum ada data pelanggan.</p>
            ) : (
              <div className="relative w-full overflow-auto rounded-lg border">
                <table className="w-full caption-bottom text-xs">
                  <thead className="bg-muted/40">
                    <tr className="border-b uppercase">
                      <th className="h-8 px-3 text-center font-semibold text-muted-foreground w-8">#</th>
                      <th className="h-8 px-3 text-left font-semibold text-muted-foreground">PELANGGAN</th>
                      <th className="h-8 px-3 text-center font-semibold text-muted-foreground">INVOICE</th>
                      <th className="h-8 px-3 text-right font-semibold text-muted-foreground">VOLUME</th>
                      <th className="h-8 px-3 text-right font-semibold text-muted-foreground">TOTAL DEAL</th>
                      <th className="h-8 px-3 text-center font-semibold text-muted-foreground">ORDER TERAKHIR</th>
                      <th className="h-8 px-3 text-center font-semibold text-muted-foreground">TIER</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {stats.topBuyers.map((buyer, idx) => {
                      // Loyalty tier logic
                      const deal = buyer.totalDeal;
                      const count = buyer.invoiceCount;
                      let tier = { label: "Bronze", color: "bg-orange-100 text-orange-700" };
                      if (deal >= 1_000_000_000 || count >= 20) tier = { label: "Diamond", color: "bg-purple-100 text-purple-700" };
                      else if (deal >= 500_000_000 || count >= 10) tier = { label: "Gold", color: "bg-amber-100 text-amber-700" };
                      else if (deal >= 100_000_000 || count >= 5) tier = { label: "Silver", color: "bg-slate-100 text-slate-700" };
                      const lastOrder = buyer.lastOrderDate
                        ? new Date(buyer.lastOrderDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
                        : "-";
                      const rankColor = idx === 0 ? "text-amber-500" : idx === 1 ? "text-slate-500" : idx === 2 ? "text-orange-700" : "text-muted-foreground";
                      return (
                        <tr key={buyer.id} className="hover:bg-muted/20 transition-colors">
                          <td className={`p-2.5 text-center font-black text-sm ${rankColor}`}>{idx + 1}</td>
                          <td className="p-2.5 align-middle">
                            <p className="font-semibold text-foreground">{buyer.company || buyer.name}</p>
                            {buyer.company && <p className="text-[10px] text-muted-foreground">{buyer.name}</p>}
                          </td>
                          <td className="p-2.5 text-center font-semibold">{buyer.invoiceCount}</td>
                          <td className="p-2.5 text-right font-medium">{buyer.totalVolume.toLocaleString("id-ID", { maximumFractionDigits: 2 })} m³</td>
                          <td className="p-2.5 text-right font-bold text-slate-800">Rp {buyer.totalDeal.toLocaleString("id-ID")}</td>
                          <td className="p-2.5 text-center text-[11px] text-muted-foreground">{lastOrder}</td>
                          <td className="p-2.5 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${tier.color}`}>
                              {tier.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      ) : activeTab === "finance" ? (
        <>
          {/* Revenue Chart Panel */}
          <section className="rounded-lg border bg-card p-4 space-y-4">
            <div>
              <h2 className="text-sm font-bold text-foreground">Grafik Omset & Laba</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Pergerakan Omset (Deal) dan Laba Bersih berdasarkan waktu yang dipilih.
              </p>
            </div>
            <RevenueChart data={stats.chartData} />
          </section>

          {/* Financial Margin Stats Panel */}
          <section className="grid grid-cols-2 overflow-hidden rounded-lg border bg-card md:grid-cols-3 lg:grid-cols-5">
            <div className="p-4">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground uppercase">
                Total Harga Deal
              </div>
              <p className="mt-1 truncate text-lg font-bold text-foreground">
                Rp {stats.totalRevenue.toLocaleString("id-ID")}
              </p>
              <p className="text-[10px] text-muted-foreground">Tanpa PPN</p>
            </div>
            <div className="p-4 border-t md:border-t-0 md:border-l">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground uppercase">
                Total HPP Terpakai
              </div>
              <p className="mt-1 truncate text-lg font-bold text-foreground">
                Rp {stats.totalHpp.toLocaleString("id-ID")}
              </p>
              <p className="text-[10px] text-muted-foreground">Tanpa PPN</p>
            </div>
            <div className="p-4 border-t md:border-t-0 border-l">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground uppercase">
                Total Uang Keluar
              </div>
              <p className="mt-1 truncate text-lg font-bold text-orange-600">
                Rp {stats.totalBuyIn.toLocaleString("id-ID")}
              </p>
              <p className="text-[10px] text-muted-foreground">HPP + Titipan PPN</p>
            </div>
            <div className="p-4 border-t md:border-t-0 border-l">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground uppercase">
                Laba Bersih
              </div>
              <p className={`mt-1 truncate text-lg font-bold ${stats.grossProfit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                Rp {stats.grossProfit.toLocaleString("id-ID")}
              </p>
              <p className="text-[10px] text-muted-foreground">setelah fee</p>
            </div>
            <div className="p-4 border-t md:border-t-0 border-l col-span-2 md:col-span-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase">Rata-rata Margin</p>
              <p className="mt-1 truncate text-lg font-bold text-primary">
                Rp {Math.round(stats.avgMarginPerM3).toLocaleString("id-ID")}/m³
              </p>
              {stats.totalFee > 0 && (
                <p className="text-[10px] text-muted-foreground">
                  Fee total: Rp {stats.totalFee.toLocaleString("id-ID")}
                </p>
              )}
            </div>
          </section>

          {/* Detailed Transaction Margins Table */}
          <section className="rounded-lg border bg-card p-4 space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-sm font-bold text-foreground">Rincian Margin per Transaksi</h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Rekapitulasi keuntungan otomatis dari data invoice deal dan harga beli dasar.
                </p>
              </div>
            </div>

            <div className="relative w-full overflow-auto rounded-lg border">
              <table className="w-full caption-bottom text-xs">
                <thead className="bg-muted/40">
                  <tr className="border-b uppercase">
                    <th className="h-9 px-3 text-left font-semibold text-muted-foreground">NO. INVOICE</th>
                    <th className="h-9 px-3 text-left font-semibold text-muted-foreground">CUSTOMER</th>
                    <th className="h-9 px-3 text-center font-semibold text-muted-foreground">VOL</th>
                    <th className="h-9 px-3 text-right font-semibold text-muted-foreground">TOTAL DEAL</th>
                    <th className="h-9 px-3 text-right font-semibold text-emerald-700">LABA BERSIH</th>
                    <th className="h-9 px-3 text-center font-semibold text-muted-foreground">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {invoices
                    .filter((inv) => inv.status !== "batal")
                    .slice((marginPage - 1) * MARGIN_PER_PAGE, marginPage * MARGIN_PER_PAGE)
                    .map((inv) => {
                      const billedQty = (it: typeof inv.items[0]) =>
                        it.actual_quantity != null ? Number(it.actual_quantity) : Number(it.quantity || 0);
                      const dealQty = (it: typeof inv.items[0]) => Number(it.quantity || 0);

                      const invVolumeDeal   = inv.items.reduce((s, it) => s + dealQty(it), 0);
                      const invVolumeActual = inv.items.reduce((s, it) => s + billedQty(it), 0);
                      const hasActual       = inv.items.some((it) => it.actual_quantity != null);

                      // Deal = harga jual × vol, excl PPN customer
                      const invDeal    = inv.items.reduce((s, it) => s + billedQty(it) * Number(it.unit_price   || 0), 0);
                      // AJM = harga net perusahaan
                      const invAjm     = inv.items.reduce((s, it) => s + billedQty(it) * (it.ajm_price != null ? Number(it.ajm_price) : Number(it.unit_price || 0)), 0);
                      // HPP = harga beli × vol, excl PPN supplier
                      const invHpp     = inv.items.reduce((s, it) => s + billedQty(it) * Number(it.buy_in_price || 0), 0);
                      
                      const globalFee    = Number((inv as any).fee || 0);
                      const invProfit    = invAjm - invHpp - globalFee; // Laba kotor perusahaan (tanpa potong PPN)

                      return (
                        <tr key={inv.id} className="hover:bg-muted/20 transition-colors">
                          <td className="p-3 align-middle font-semibold text-primary">
                            <Link href={`/tracker/invoices/${inv.id}`}>{inv.invoice_number}</Link>
                          </td>
                          <td className="p-3 align-middle">
                            <p className="font-semibold text-foreground">{inv.client.company || inv.client.name}</p>
                            {inv.notes && (
                              <p className="text-[10px] text-muted-foreground truncate max-w-[180px]" title={inv.notes}>
                                {inv.notes}
                              </p>
                            )}
                          </td>
                          <td className="p-3 align-middle text-center font-medium">
                            {hasActual ? (
                              <div>
                                <p className="font-bold">{invVolumeActual.toLocaleString("id-ID", { maximumFractionDigits: 2 })} m³</p>
                                {invVolumeActual !== invVolumeDeal && (
                                  <p className="text-[10px] text-amber-600">deal: {invVolumeDeal.toLocaleString("id-ID", { maximumFractionDigits: 2 })} m³</p>
                                )}
                              </div>
                            ) : (
                              <span>{invVolumeDeal.toLocaleString("id-ID", { maximumFractionDigits: 2 })} m³</span>
                            )}
                          </td>
                          {/* Deal */}
                          <td className="p-3 align-middle text-right font-medium">
                            Rp {invDeal.toLocaleString("id-ID")}
                          </td>
                          {/* Laba bersih */}
                          <td className={`p-3 align-middle text-right font-bold ${
                            invHpp > 0 ? (invProfit >= 0 ? "text-emerald-600" : "text-red-600") : "text-muted-foreground"
                          }`}>
                            {invHpp > 0 ? `Rp ${invProfit.toLocaleString("id-ID")}` : "-"}
                          </td>
                          <td className="p-3 align-middle text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              inv.status === "selesai"
                                ? "bg-emerald-100 text-emerald-800"
                                : inv.status === "pengiriman"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                            }`}>
                              {inv.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  {invoices.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-muted-foreground">
                        Belum ada data transaksi keuangan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls for Margin Table */}
            {(() => {
              const nonBatal = invoices.filter((inv) => inv.status !== "batal");
              const totalMarginPages = Math.ceil(nonBatal.length / MARGIN_PER_PAGE) || 1;
              if (totalMarginPages <= 1) return null;
              return (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t text-xs text-muted-foreground">
                  <div>
                    Menampilkan <span className="font-bold text-foreground">{(marginPage - 1) * MARGIN_PER_PAGE + 1}</span> - <span className="font-bold text-foreground">{Math.min(marginPage * MARGIN_PER_PAGE, nonBatal.length)}</span> dari <span className="font-bold text-foreground">{nonBatal.length}</span> transaksi
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      disabled={marginPage === 1}
                      onClick={() => setMarginPage((p) => Math.max(1, p - 1))}
                    >
                      Sebelumnya
                    </Button>
                    <span className="px-2.5 font-semibold text-foreground">
                      {marginPage} / {totalMarginPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      disabled={marginPage === totalMarginPages}
                      onClick={() => setMarginPage((p) => Math.min(totalMarginPages, p + 1))}
                    >
                      Selanjutnya
                    </Button>
                  </div>
                </div>
              );
            })()}
          </section>
        </>
      ) : (
        <>
          <section className="rounded-lg border bg-card p-4 space-y-3">
            <div>
              <h2 className="text-sm font-bold text-foreground">Penghasilan per Sales</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Total Deal dan Volume yang berhasil diamankan oleh masing-masing Sales Rep.
              </p>
            </div>
            <div className="relative w-full overflow-auto rounded-lg border mt-4">
              <table className="w-full caption-bottom text-sm">
                <thead className="bg-muted/40">
                  <tr className="border-b">
                    <th className="h-10 px-4 text-left font-semibold text-muted-foreground">SALES</th>
                    <th className="h-10 px-4 text-center font-semibold text-muted-foreground">TOTAL INVOICE</th>
                    <th className="h-10 px-4 text-right font-semibold text-muted-foreground">TOTAL VOLUME</th>
                    <th className="h-10 px-4 text-right font-semibold text-primary">TOTAL REVENUE (DEAL)</th>
                    <th className="h-10 px-4 text-right font-semibold text-emerald-600">ESTIMASI KOMISI</th>
                    <th className="h-10 px-4 w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {stats.salesStats.map((s, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-muted/30 transition-colors cursor-pointer group"
                      onClick={() => router.push(`/tracker/sales/${encodeURIComponent(s.email)}`)}
                    >
                      <td className="p-4 align-middle font-bold text-foreground group-hover:text-primary underline-offset-4 group-hover:underline">{s.email}</td>
                      <td className="p-4 align-middle text-center">{s.invoiceCount}</td>
                      <td className="p-4 align-middle text-right font-medium">{s.totalVolume.toLocaleString("id-ID", { maximumFractionDigits: 2 })} m³</td>
                      <td className="p-4 align-middle text-right font-black text-slate-800">Rp {s.totalRevenue.toLocaleString("id-ID")}</td>
                      <td className="p-4 align-middle text-right font-bold text-emerald-600">Rp {s.totalCommission.toLocaleString("id-ID")}</td>
                      <td className="p-4 align-middle text-muted-foreground">
                      </td>
                    </tr>
                  ))}
                  {stats.salesStats.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-muted-foreground">Belum ada data sales.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
