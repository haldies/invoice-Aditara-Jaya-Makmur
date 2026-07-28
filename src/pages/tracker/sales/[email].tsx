import { useMemo } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { ReactElement } from "react";
import { ArrowLeft } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from "recharts";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthGuard } from "@/components/AuthGuard";
import { useInvoices } from "@/hooks/useInvoices";
import { useAuth } from "@/hooks/useAuth";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];
const PRODUCT_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

function formatRp(v: number) {
  if (v >= 1_000_000_000) return `Rp ${(v / 1_000_000_000).toFixed(1)} M`;
  if (v >= 1_000_000) return `Rp ${(v / 1_000_000).toFixed(1)} Jt`;
  return `Rp ${v.toLocaleString("id-ID")}`;
}

export default function SalesDetailPage() {
  const router = useRouter();
  const { email } = router.query as { email?: string };
  const { invoices, isLoading } = useInvoices();
  const { user } = useAuth();

  // Only admins/owners/managers can see this page
  const canAccess = user?.role === "owner" || user?.role === "admin" || user?.role === "manager";

  const salesEmail = email ? decodeURIComponent(email) : "";

  const data = useMemo(() => {
    if (!salesEmail) return null;

    const now = new Date();
    const currentYear = now.getFullYear();

    // Filter invoices for this sales person
    const myInvoices = invoices.filter(
      (inv) => (inv as any).user?.email === salesEmail && inv.status !== "batal"
    );

    let totalRevenue = 0;
    let totalVolume = 0;
    let totalCommission = 0;
    const productMap: Record<string, { volume: number; revenue: number }> = {};
    const monthlyMap: Record<number, { revenue: number; volume: number }> = {};

    // Pre-seed 12 months
    for (let m = 0; m < 12; m++) {
      monthlyMap[m] = { revenue: 0, volume: 0 };
    }

    for (const inv of myInvoices) {
      const issueDate = inv.issue_date ? new Date(inv.issue_date) : new Date();
      const month = issueDate.getMonth();
      const year = issueDate.getFullYear();

      for (const item of inv.items || []) {
        const qty = item.actual_quantity != null ? Number(item.actual_quantity) : Number(item.quantity || 0);
        const rev = qty * Number(item.unit_price || 0);
        const comm = qty * Math.max(0, Number(item.unit_price || 0) - Number((item as any).ajm_price || 0));

        totalVolume += qty;
        totalRevenue += rev;
        totalCommission += comm;

        const productName = (item.description || "Unknown").split("-")[0].trim();
        if (!productMap[productName]) productMap[productName] = { volume: 0, revenue: 0 };
        productMap[productName].volume += qty;
        productMap[productName].revenue += rev;

        // Only current year for monthly chart
        if (year === currentYear) {
          monthlyMap[month].revenue += rev;
          monthlyMap[month].volume += qty;
        }
      }
    }

    const monthlyData = Object.entries(monthlyMap).map(([m, d]) => ({
      label: MONTH_NAMES[Number(m)],
      revenue: d.revenue,
      volume: d.volume,
      order: Number(m),
    })).sort((a, b) => a.order - b.order);

    const productData = Object.entries(productMap)
      .sort((a, b) => b[1].volume - a[1].volume)
      .map(([name, d]) => ({ name, ...d }));

    return {
      totalRevenue,
      totalVolume,
      totalCommission,
      invoiceCount: myInvoices.length,
      monthlyData,
      productData,
    };
  }, [invoices, salesEmail]);

  if (!canAccess) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Anda tidak memiliki akses ke halaman ini.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    );
  }

  if (!data) {
    return <div className="p-8 text-center text-muted-foreground">Data tidak ditemukan.</div>;
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Back + Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/tracker"
          className="flex h-8 w-8 items-center justify-center rounded-full border bg-card hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-lg font-black text-foreground">{salesEmail}</h1>
          <p className="text-xs text-muted-foreground">Analisis Performa Sales</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="text-[10px] font-semibold uppercase text-muted-foreground">
            Total Invoice
          </div>
          <p className="mt-1 text-2xl font-bold text-foreground">{data.invoiceCount}</p>
        </div>
        <div className="rounded-lg border bg-card p-4 border-l">
          <div className="text-[10px] font-semibold uppercase text-muted-foreground">
            Total Volume
          </div>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {data.totalVolume.toLocaleString("id-ID", { maximumFractionDigits: 2 })}
            <span className="ml-1 text-sm font-medium text-muted-foreground">m³</span>
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4 border-t md:border-t-0 md:border-l">
          <div className="text-[10px] font-semibold uppercase text-muted-foreground">
            Total Revenue
          </div>
          <p className="mt-1 text-xl font-bold text-foreground">{formatRp(data.totalRevenue)}</p>
        </div>
        <div className="rounded-lg border bg-card p-4 border-t md:border-t-0 border-l">
          <div className="text-[10px] font-semibold uppercase text-muted-foreground">
            Est. Komisi
          </div>
          <p className="mt-1 text-xl font-bold text-emerald-600">{formatRp(data.totalCommission)}</p>
        </div>
      </div>

      {/* Monthly Revenue Bar Chart */}
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">Omset Bulanan (Tahun Ini)</h2>
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <BarChart data={data.monthlyData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#6b7280" }}
                dy={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#6b7280" }}
                tickFormatter={(v) => formatRp(v)}
                width={80}
              />
              <Tooltip
                cursor={{ fill: "rgba(0,0,0,0.04)" }}
                contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
                formatter={(v: any, name: any) => [
                  name === "volume"
                    ? `${Number(v).toLocaleString("id-ID")} m³`
                    : `Rp ${Number(v).toLocaleString("id-ID")}`,
                  name === "volume" ? "Volume" : "Omset",
                ]}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: "12px" }} />
              <Bar dataKey="revenue" name="Omset" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Volume per Month */}
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">Volume Pengiriman Bulanan (m³)</h2>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart data={data.monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#6b7280" }} dy={6} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#6b7280" }} width={45} />
                <Tooltip
                  cursor={{ fill: "rgba(0,0,0,0.04)" }}
                  contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
                  formatter={(v: any) => [`${Number(v).toLocaleString("id-ID")} m³`, "Volume"]}
                />
                <Bar dataKey="volume" name="Volume m³" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Product Breakdown */}
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">Produk Terlaris</h2>
          {data.productData.length === 0 ? (
            <p className="text-sm text-muted-foreground italic py-4 text-center">Belum ada data produk.</p>
          ) : (
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <PieChart>
                  <Pie
                    data={data.productData}
                    dataKey="volume"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(entry: any) => `${(entry.name || "").slice(0, 10)} ${((entry.percent || 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {data.productData.map((_, i) => (
                      <Cell key={i} fill={PRODUCT_COLORS[i % PRODUCT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: any, name: any) => [`${Number(v).toLocaleString("id-ID")} m³`, name]}
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Product Table */}
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">Rincian Produk</h2>
        <div className="relative w-full overflow-auto rounded-lg border">
          <table className="w-full caption-bottom text-sm">
            <thead className="bg-muted/40">
              <tr className="border-b uppercase">
                <th className="h-9 px-4 text-left font-semibold text-muted-foreground text-[11px]">Produk</th>
                <th className="h-9 px-4 text-right font-semibold text-muted-foreground text-[11px]">Volume</th>
                <th className="h-9 px-4 text-right font-semibold text-muted-foreground text-[11px]">Revenue</th>
                <th className="h-9 px-4 text-right font-semibold text-muted-foreground text-[11px]">Porsi Vol.</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.productData.map((p, i) => (
                <tr key={p.name} className="hover:bg-muted/20 transition-colors">
                  <td className="p-3 align-middle">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: PRODUCT_COLORS[i % PRODUCT_COLORS.length] }} />
                      <span className="font-semibold text-foreground">{p.name}</span>
                    </div>
                  </td>
                  <td className="p-3 align-middle text-right font-medium">
                    {p.volume.toLocaleString("id-ID", { maximumFractionDigits: 2 })} m³
                  </td>
                  <td className="p-3 align-middle text-right font-black text-slate-800">{formatRp(p.revenue)}</td>
                  <td className="p-3 align-middle text-right text-muted-foreground">
                    {data.totalVolume > 0 ? `${((p.volume / data.totalVolume) * 100).toFixed(1)}%` : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

SalesDetailPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AuthGuard>
      <AppLayout title="Detail Sales">{page}</AppLayout>
    </AuthGuard>
  );
};
