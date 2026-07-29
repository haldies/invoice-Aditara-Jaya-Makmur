import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RevenueChart } from "./RevenueChart";
import { useInvoices } from "@/hooks/useInvoices";
import { useAuth } from "@/hooks/useAuth";
import { INVOICE_STATUS_CONFIG, INVOICE_STATUSES } from "@/types/invoice";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ExternalLink } from "lucide-react";

export function InvoiceDashboard() {
  const { user } = useAuth();
  const { invoices, isLoading, isValidating } = useInvoices();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"invoices" | "finance" | "sales" | "customers">("invoices");
  const [timeFilter, setTimeFilter] = useState<"all" | "year" | "month">("all");

  const isAdmin = user && (user.role === "admin" || user.role === "manager" || user.role === "owner");

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
      { email: string; name: string; phone: string | null; totalRevenue: number; totalVolume: number; invoiceCount: number; totalCommission: number; products: Record<string, { volume: number; revenue: number }> }
    > = {};
    const byProductSisa: Record<string, number> = {};
    const sisaDetails: Array<{
      invoiceId: string;
      invoiceNumber: string;
      clientName: string;
      productName: string;
      poQty: number;
      actualQty: number;
      sisaQty: number;
      date: string;
    }> = [];
    const chartDataMap: Record<string, { label: string; revenue: number; order: number }> = {};

    // Helper for month names
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];

    // Pre-populate chart skeleton so all slots always appear (even when empty)
    if (timeFilter === "year") {
      // 12 months for current year
      for (let m = 0; m < 12; m++) {
        chartDataMap[`${m}`] = { label: monthNames[m], revenue: 0, order: m };
      }
    } else if (timeFilter === "month") {
      // All days in current month
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        chartDataMap[`${d}`] = { label: `${d}`, revenue: 0, order: d };
      }
    } else {
      // "all" — show all 12 months for every year that has data; pre-seed current year
      for (let m = 0; m < 12; m++) {
        const key = `${currentYear}-${m}`;
        chartDataMap[key] = { label: `${monthNames[m]} '${String(currentYear).slice(2)}`, revenue: 0, order: currentYear * 100 + m };
      }
    }

    for (const invoice of filteredInvoices) {
      byStatus[invoice.status] = (byStatus[invoice.status] || 0) + 1;
      if (invoice.status !== "batal") {
        const paidAmount = Number(invoice.amount_paid || 0);
        paid += paidAmount;
        outstanding += Math.max(0, invoice.total - paidAmount);
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
            sisaDetails.push({
              invoiceId: invoice.id,
              invoiceNumber: invoice.invoice_number,
              clientName: invoice.client?.name || "Unknown",
              productName: item.description || "Unknown",
              poQty,
              actualQty: qty,
              sisaQty: sisa,
              date: invoice.issue_date || "",
            });
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
        const name = (invoice as any).user?.name || "Unknown";
        const phone = (invoice as any).user?.phone || null;
        if (!bySales[email]) {
          bySales[email] = { email, name, phone, totalRevenue: 0, totalVolume: 0, invoiceCount: 0, totalCommission: 0, products: {} };
        }
        bySales[email].invoiceCount += 1;
        
        let invVol = 0;
        let invRev = 0;
        let invComm = 0;
        for (const item of invoice.items || []) {
          const qty = item.actual_quantity != null ? Number(item.actual_quantity) : Number(item.quantity || 0);
          const dealPrice = Number(item.unit_price || 0);
          const rev = qty * dealPrice;
          
          const ajmPrice = item.ajm_price != null ? Number(item.ajm_price) : dealPrice;
          
          invVol += qty;
          invRev += rev;
          invComm += qty * Math.max(0, dealPrice - ajmPrice);

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
          chartDataMap[chartKey] = { label: chartLabel, revenue: 0, order };
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

        const isPaidInFull = Number(invoice.amount_paid || 0) >= Number(invoice.total || 0) && Number(invoice.total || 0) > 0;
        if (isPaidInFull) {
          chartDataMap[chartKey].revenue += invRev;
        }
      }
    }

    // Convert chart map to array and sort
    const chartData = Object.values(chartDataMap).sort((a, b) => a.order - b.order);

    const activeTransactionInvoices = filteredInvoices.filter(
      (inv) => inv.status === "po" || inv.status === "pengiriman" || inv.status === "selesai"
    );
    const paidInvoices = filteredInvoices.filter((inv) => inv.status !== "batal" && Number(inv.amount_paid || 0) >= Number(inv.total || 0) && Number(inv.total || 0) > 0);
    const paidRevenue = activeTransactionInvoices.reduce((sum, inv) => sum + inv.items.reduce((s, item) => s + (item.actual_quantity != null ? Number(item.actual_quantity) : Number(item.quantity || 0)) * Number(item.unit_price || 0), 0), 0);
    const paidHppDibayar = activeTransactionInvoices.reduce((sum, inv) => sum + inv.items.reduce((s, item) => s + Number(item.quantity || 0) * Number(item.buy_in_price || 0), 0), 0);
    const totalPpnSupplier = Math.round(paidHppDibayar * 0.11);
    const totalBuyIn       = paidHppDibayar + totalPpnSupplier;
    const totalGlobalFee   = 0;
    const grossProfit      = paidRevenue - paidHppDibayar;
    
    // Ongkir menambah laba bersih hanya untuk transaksi yang sudah terkirim
    const totalShipping = activeTransactionInvoices
      .reduce((sum, inv) => sum + Number(inv.shipping_fee || 0), 0);
    const netProfitGlobal = grossProfit + totalShipping;

    // Top Buyers / Loyal Customers
    const byClient: Record<
      string,
      { id: string; name: string; company: string; invoiceCount: number; totalDeal: number; totalVolume: number; lastOrderDate: string; totalOutstanding: number }
    > = {};
    const byProduct: Record<string, { name: string; count: number; volume: number; revenue: number; hpp: number }> = {};
      const byDestination: Record<string, { location: string; count: number; volume: number; revenue: number; hpp: number }> = {};

    for (const inv of filteredInvoices.filter((i) => i.status !== "batal")) {
      const cid   = inv.client_id;
      const name  = inv.client?.name || "—";
      const co    = inv.client?.company || "";
      if (!byClient[cid]) byClient[cid] = { id: cid, name, company: co, invoiceCount: 0, totalDeal: 0, totalVolume: 0, lastOrderDate: "", totalOutstanding: 0 };
      
      const paidAmt = Number(inv.amount_paid || 0);
      byClient[cid].totalOutstanding += Math.max(0, inv.total - paidAmt);
      
      byClient[cid].invoiceCount += 1;
      
      let location = "Tidak Diketahui";
      const plantMatch = inv.notes?.match(/Plant:\s*([^\n,]+)/i);
      if (plantMatch) {
        location = plantMatch[1].trim();
      } else {
        const city = (inv.client?.city || "").trim();
        const province = (inv.client?.province || "").trim();
        location = city || province || "Tidak Diketahui";
      }
      
      if (!byDestination[location]) byDestination[location] = { location, count: 0, volume: 0, revenue: 0, hpp: 0 };
      byDestination[location].count += 1;

      inv.items.forEach(it => {
        const q = it.actual_quantity != null ? Number(it.actual_quantity) : Number(it.quantity || 0);
        const deal = q * Number(it.unit_price || 0);
        const ajm  = it.ajm_price != null ? q * Number(it.ajm_price) : deal;
        const hpp  = q * Number(it.buy_in_price || 0);
        
        byClient[cid].totalDeal += deal;
        byClient[cid].totalVolume += q;
        
        byDestination[location].volume += q;
        byDestination[location].revenue += deal;
        byDestination[location].hpp += hpp;

        const prodName = it.description || "Produk Lainnya";
        if (!byProduct[prodName]) byProduct[prodName] = { name: prodName, count: 0, volume: 0, revenue: 0, hpp: 0 };
        byProduct[prodName].count += 1;
        byProduct[prodName].volume += q;
        byProduct[prodName].revenue += deal;
        byProduct[prodName].hpp += hpp;
      });

      if (!byClient[cid].lastOrderDate || inv.issue_date > byClient[cid].lastOrderDate) {
        byClient[cid].lastOrderDate = inv.issue_date || "";
      }
    }
    const topBuyers = Object.values(byClient)
      .sort((a, b) => b.totalDeal - a.totalDeal)
      .slice(0, 10);

    const topUnpaidBuyers = Object.values(byClient)
      .filter((c) => c.totalOutstanding > 0)
      .sort((a, b) => b.totalOutstanding - a.totalOutstanding)
      .slice(0, 10);

    const topProducts = Object.values(byProduct)
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 10);

    const topDestinations = Object.values(byDestination)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    const allCustomers = Object.values(byClient).map((c) => {
      let segment = "Reguler";
      let action = "Pertahankan hubungan baik";
      let riskLevel = "low";
      const unpaidRatio = c.totalDeal > 0 ? c.totalOutstanding / c.totalDeal : 0;
      
      const lastOrder = c.lastOrderDate ? new Date(c.lastOrderDate) : null;
      const daysSinceLastOrder = lastOrder ? (now.getTime() - lastOrder.getTime()) / (1000 * 3600 * 24) : 0;

      if (c.totalOutstanding > 25_000_000 || unpaidRatio > 0.5) {
        segment = "Beresiko";
        action = "Tahan order baru, segera follow-up tagihan";
        riskLevel = "high";
      } else if (daysSinceLastOrder > 90) {
        segment = "Sleeping";
        action = "Follow-up kembali, tawarkan promo khusus";
        riskLevel = "medium";
      } else if (c.totalDeal >= 50_000_000 && unpaidRatio < 0.2) {
        segment = "Loyal / VIP";
        action = "Prioritaskan pelayanan, prospek bagus";
        riskLevel = "low";
      }

      return {
        ...c,
        segment,
        action,
        riskLevel,
        daysSinceLastOrder,
        unpaidRatio
      };
    }).sort((a, b) => b.totalDeal - a.totalDeal);

    // Generate Business Insights (Scale-Up Advisor)
    const businessInsights: Array<{ type: "success" | "warning" | "danger" | "info"; title: string; desc: string }> = [];
    
    // Insight 1: Product Margin
    let bestProduct = { name: "", marginPerM3: 0, revenue: 0, hpp: 0 };
    for (const p of Object.values(byProduct)) {
       const margin = p.revenue - p.hpp;
       const marginPerM3 = p.volume > 0 ? margin / p.volume : 0;
       if (marginPerM3 > bestProduct.marginPerM3 && p.volume > 10) {
         bestProduct = { name: p.name, marginPerM3, revenue: p.revenue, hpp: p.hpp };
       }
    }
    if (bestProduct.name) {
       businessInsights.push({
         type: "success",
         title: "Top Margin Produk",
         desc: `Produk: ${bestProduct.name}\nMargin / m³: Rp ${Math.round(bestProduct.marginPerM3).toLocaleString("id-ID")}`
       });
    }

    // Insight 2: Cashflow Risk
    if (outstanding > 0) {
      const topOustandingName = topUnpaidBuyers.length > 0 ? topUnpaidBuyers[0].name : "-";
      const topOutstandingAmt = topUnpaidBuyers.length > 0 ? topUnpaidBuyers[0].totalOutstanding : 0;
      businessInsights.push({
        type: "danger",
        title: "Status Piutang Transaksi",
        desc: `Total Piutang Berjalan: Rp ${outstanding.toLocaleString("id-ID")}\nBelum Lunas Terbesar: ${topOustandingName} (Rp ${topOutstandingAmt.toLocaleString("id-ID")})`
      });
    }

    // Insight 3: Sleeping Customers / Retention
    const sleepingCount = allCustomers.filter(c => c.segment === "Sleeping").length;
    if (sleepingCount > 0) {
       businessInsights.push({
         type: "info",
         title: "Pelanggan Non-Aktif (Sleeping)",
         desc: `Jumlah Pelanggan (> 90 Hari): ${sleepingCount} Pelanggan\nStatus: Perlu Follow-up`
       });
    }

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
      totalFee: totalEksternalFee,
      grossProfit,
      netProfitGlobal,
      totalPOVolume,
      totalSisaPO,
      salesStats: Object.values(bySales).sort((a, b) => b.totalRevenue - a.totalRevenue),
      sisaStats: Object.entries(byProductSisa).filter(([_, val]) => val !== 0).sort((a, b) => b[1] - a[1]),
      sisaDetails: sisaDetails.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      topBuyers,
      topUnpaidBuyers,
      topProducts,
      topDestinations,
      allCustomers,
      businessInsights,
      chartData
    };
  }, [invoices, timeFilter]);

  if (isLoading) {
    return (
      <div className="space-y-4 p-4 md:p-5 w-full">
        {/* Tabs & Filter Skeleton */}
        <div className="flex flex-col sm:flex-row justify-between border-b gap-3 pb-2 sm:pb-0">
          <div className="flex gap-4">
            <div className="h-8 w-24 animate-pulse rounded-t-md bg-muted/70" />
            <div className="h-8 w-24 animate-pulse rounded-t-md bg-muted/40" />
            <div className="h-8 w-24 animate-pulse rounded-t-md bg-muted/40" />
            <div className="h-8 w-24 animate-pulse rounded-t-md bg-muted/40" />
          </div>
          <div className="h-9 w-32 animate-pulse rounded-md bg-muted/60 mb-2 sm:mb-1" />
        </div>

        {/* Metrics Grid Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 overflow-hidden rounded-lg border bg-card">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="p-4 border-l first:border-l-0">
              <div className="h-3 w-20 animate-pulse rounded bg-muted mb-3" />
              <div className="h-6 w-28 animate-pulse rounded bg-muted/80" />
              <div className="h-2 w-16 animate-pulse rounded bg-muted mt-2" />
            </div>
          ))}
        </div>

        {/* Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          {[1, 2].map((card) => (
            <div key={card} className="rounded-lg border bg-card p-4 space-y-5 h-[320px]">
              <div className="h-4 w-1/3 animate-pulse rounded bg-muted/80" />
              <div className="space-y-3 mt-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex justify-between border-b pb-3">
                    <div className="flex gap-3 items-center w-2/3">
                      <div className="h-6 w-6 rounded-full animate-pulse bg-muted shrink-0" />
                      <div className="space-y-1.5 w-full">
                        <div className="h-3 w-full animate-pulse rounded bg-muted" />
                        <div className="h-2 w-2/3 animate-pulse rounded bg-muted/60" />
                      </div>
                    </div>
                    <div className="h-4 w-1/4 animate-pulse rounded bg-muted/80" />
                  </div>
                ))}
              </div>
            </div>
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
          {isAdmin && (
            <>
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
              <button
                onClick={() => setActiveTab("customers")}
                className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
                  activeTab === "customers"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Customer
              </button>
            </>
          )}
        </div>
        <div className="py-1 pr-2 self-start sm:self-auto">
          <Select value={timeFilter} onValueChange={(val: any) => setTimeFilter(val)}>
            <SelectTrigger className="w-[150px] h-9 text-xs font-semibold bg-background shadow-sm">
              <SelectValue placeholder="Filter Waktu" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua</SelectItem>
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
              <p className="text-[11px] font-semibold text-muted-foreground uppercase">Total Transaksi</p>
              <p className="mt-1 truncate text-xl font-bold text-foreground">{invoices.length}</p>
            </div>
            <div className="p-4 border-l">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase">Belum di bayar</p>
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

          {/* Sisa Saldo per Produk Panel */}
          <section className="rounded-lg border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xs font-bold text-foreground uppercase tracking-wide flex items-center gap-1.5">
                Rincian Sisa Saldo PO per Produk
              </h2>
              {stats.sisaStats.length > 0 && (
                <Link href="/tracker/sisa-po">
                  <Button variant="outline" size="sm" className="h-8 text-[10px]">
                    <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                    Buka Detail Lengkap
                  </Button>
                </Link>
              )}
            </div>
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
                {INVOICE_STATUSES.filter(s => s !== "tagihan").map((status) => (
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
                <h2 className="text-xs font-bold text-foreground uppercase tracking-wide">Transaksi Terbaru</h2>
                <Button asChild size="sm" variant="outline">
                  <Link href="/tracker/invoices/new">
                    Baru
                  </Link>
                </Button>
              </div>
              {invoices.length === 0 ? (
                <p className="py-8 text-center text-xs text-muted-foreground">Belum ada transaksi</p>
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

          {/* Customer Tables Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top Buyer */}
            <section className="rounded-lg border bg-card p-4 space-y-3">
              <h2 className="text-xs font-bold text-foreground uppercase tracking-wide">
                Top Pelanggan
              </h2>
              {stats.topBuyers.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-3 text-center">Belum ada data pelanggan.</p>
              ) : (
                <div className="divide-y text-xs">
                  {stats.topBuyers.slice(0, 5).map((buyer, idx) => (
                    <div key={buyer.id} className="flex items-center gap-3 py-2.5 px-1 hover:bg-muted/30 rounded transition-colors">
                      <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary font-bold text-[10px] shrink-0">
                        {idx + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-foreground">{buyer.company || buyer.name}</p>
                        {buyer.company && <p className="truncate text-[10px] text-muted-foreground mt-0.5">{buyer.name}</p>}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-bold text-foreground">Rp {buyer.totalDeal.toLocaleString("id-ID")}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{buyer.invoiceCount} Transaksi</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Top Unpaid Buyers */}
            <section className="rounded-lg border bg-card p-4 space-y-3">
              <h2 className="text-xs font-bold text-red-600 uppercase tracking-wide">
                Tagihan Belum Lunas
              </h2>
              {stats.topUnpaidBuyers.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-3 text-center">Tidak ada tagihan tertunggak.</p>
              ) : (
                <div className="divide-y text-xs">
                  {stats.topUnpaidBuyers.slice(0, 5).map((buyer, idx) => (
                    <div key={buyer.id} className="flex items-center gap-3 py-2.5 px-1 hover:bg-red-50/50 rounded transition-colors">
                      <div className="flex items-center justify-center w-5 h-5 rounded-full bg-red-100 text-red-600 font-bold text-[10px] shrink-0">
                        {idx + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-foreground">{buyer.company || buyer.name}</p>
                        {buyer.company && <p className="truncate text-[10px] text-muted-foreground mt-0.5">{buyer.name}</p>}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-bold text-red-600">Rp {buyer.totalOutstanding.toLocaleString("id-ID")}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{buyer.invoiceCount} Transaksi</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </>
      ) : activeTab === "finance" ? (
        <>
          {/* Revenue Chart Panel */}
          <section className="rounded-lg border bg-card p-4 space-y-4">
            <div>
              <h2 className="text-sm font-bold text-foreground">Grafik Omset & Laba</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Pergerakan Omset dan Laba Bersih berdasarkan waktu yang dipilih.
              </p>
            </div>
            <RevenueChart data={stats.chartData} />
          </section>

          {/* Financial Margin Stats Panel */}
          <section className="grid grid-cols-2 overflow-hidden rounded-lg border bg-card md:grid-cols-4">
            <div className="p-4">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground uppercase">
                Total Omset PO+
              </div>
              <p className="mt-1 truncate text-lg font-bold text-foreground">
                Rp {stats.totalRevenue.toLocaleString("id-ID")}
              </p>
              <p className="text-[10px] text-muted-foreground">Hanya transaksi yang sudah masuk PO atau lebih</p>
            </div>
            <div className="p-4 border-l">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground uppercase">
                Total Modal PO+
              </div>
              <p className="mt-1 truncate text-lg font-bold text-orange-600">
                Rp {stats.totalBuyIn.toLocaleString("id-ID")}
              </p>
              <p className="text-[10px] text-muted-foreground">HPP + PPN supplier</p>
            </div>
            <div className="p-4 border-t md:border-t-0 border-l">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground uppercase">
                Laba Bersih
              </div>
              <p className={`mt-1 truncate text-lg font-bold ${stats.netProfitGlobal >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                Rp {stats.netProfitGlobal.toLocaleString("id-ID")}
              </p>
              <p className="text-[10px] text-muted-foreground">Setelah komisi & ongkir, transaksi PO+</p>
            </div>
          </section>

          {/* Rincian margin transaksi disembunyikan untuk dashboard */}
          <section className="rounded-lg border bg-card p-4">
            <h2 className="text-sm font-bold text-foreground">Rincian transaksi</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Detail margin per transaksi tidak ditampilkan di dashboard agar tampilan lebih ringkas dan aman.
            </p>
          </section>
        </>
      ) : activeTab === "sales" ? (
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
                      <td className="p-4 align-middle group-hover:text-primary underline-offset-4 group-hover:underline">
                        <div className="font-bold text-foreground">{s.name !== "Unknown" ? s.name : s.email.split('@')[0]}</div>
                        <div className="text-[10px] text-muted-foreground font-normal">{s.email}</div>
                        {s.phone && <div className="text-[10px] text-emerald-600 mt-0.5 font-normal">{s.phone}</div>}
                      </td>
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
      ) : activeTab === "customers" ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top Royal / Menguntungkan */}
            <section className="rounded-lg border border-primary/20 bg-white p-4 space-y-3 shadow-none">
              <h2 className="text-xs font-bold text-primary uppercase tracking-wide">
                Pelanggan Royal
              </h2>
              {stats.topBuyers.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-3 text-center">Belum ada data</p>
              ) : (
                <div className="divide-y text-xs">
                  {stats.topBuyers.slice(0, 5).map((buyer, idx) => (
                    <div key={buyer.id} className="flex items-center gap-3 py-2.5 px-1 hover:bg-primary/5 rounded transition-colors">
                      <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary font-bold text-[10px] shrink-0">
                        {idx + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-foreground">{buyer.company || buyer.name}</p>
                        {buyer.company && <p className="truncate text-[10px] text-muted-foreground mt-0.5">{buyer.name}</p>}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-bold text-primary">Rp {buyer.totalDeal.toLocaleString("id-ID")}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{buyer.totalVolume.toLocaleString("id-ID", { maximumFractionDigits: 2 })} m³</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Sering Belum Lunas */}
            <section className="rounded-lg border border-primary/20 bg-white p-4 space-y-3 shadow-none">
              <h2 className="text-xs font-bold text-primary uppercase tracking-wide">
                Belum Lunas
              </h2>
              {stats.topUnpaidBuyers.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-3 text-center">Aman, tidak ada piutang</p>
              ) : (
                <div className="divide-y text-xs">
                  {stats.topUnpaidBuyers.slice(0, 5).map((buyer, idx) => (
                    <div key={buyer.id} className="flex items-center gap-3 py-2.5 px-1 hover:bg-primary/5 rounded transition-colors">
                      <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary font-bold text-[10px] shrink-0">
                        {idx + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-foreground">{buyer.company || buyer.name}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-bold text-primary">Rp {buyer.totalOutstanding.toLocaleString("id-ID")}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{buyer.invoiceCount} Transaksi</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Produk Paling Laris */}
            <section className="rounded-lg border border-primary/20 bg-white p-4 space-y-3 shadow-none">
              <h2 className="text-xs font-bold text-primary uppercase tracking-wide">
                Produk Laris
              </h2>
              {stats.topProducts.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-3 text-center">Belum ada data</p>
              ) : (
                <div className="divide-y text-xs">
                  {stats.topProducts.slice(0, 5).map((p, idx) => (
                    <div key={p.name} className="flex items-center gap-3 py-2.5 px-1 hover:bg-primary/5 rounded transition-colors">
                      <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary font-bold text-[10px] shrink-0">
                        {idx + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-foreground">{p.name}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-bold text-primary">Rp {p.revenue.toLocaleString("id-ID")}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{p.volume.toLocaleString("id-ID", { maximumFractionDigits: 2 })} m³</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Tujuan Populer */}
            <section className="rounded-lg border bg-white p-4 space-y-3">
              <h2 className="text-xs font-bold text-primary uppercase tracking-wide">
                Tujuan Populer
              </h2>
              {stats.topDestinations.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-3 text-center">Belum ada data</p>
              ) : (
                <div className="divide-y text-xs">
                  {stats.topDestinations.slice(0, 5).map((d, idx) => (
                    <div key={d.location} className="flex items-center gap-3 py-2.5 px-1 hover:bg-primary/5 rounded transition-colors">
                      <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary font-bold text-[10px] shrink-0">
                        {idx + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-foreground">{d.location}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-bold text-primary">Rp {d.revenue.toLocaleString("id-ID")}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{d.count} Pesanan</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </>
      ) : null}
    </div>
  );
}
