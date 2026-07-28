import type { ReactElement } from "react";
import { useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { AuthGuard } from "@/components/AuthGuard";
import { AppLayout } from "@/components/layout/AppLayout";
import { APP_NAME } from "@/lib/appMetadata";
import { useInvoices } from "@/hooks/useInvoices";
import { ExternalLink, PackageMinus, ChevronLeft } from "lucide-react";

export default function SisaPOPage() {
  const { invoices, isLoading } = useInvoices();
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

  const { groupedProducts, sisaDetails, totalSisa } = useMemo(() => {
    let totalSisa = 0;
    const details: any[] = [];
    const groupedMap: Record<string, { name: string; sisa: number; poQty: number; actualQty: number }> = {};

    if (!invoices) return { groupedProducts: [], sisaDetails: details, totalSisa };

    for (const invoice of invoices) {
      if (invoice.status === "batal") continue;

      for (const item of invoice.items || []) {
        const poQty = Number(item.quantity || 0);
        const actualQty = item.actual_quantity != null ? Number(item.actual_quantity) : poQty;
        const sisa = poQty - actualQty;
        
        if (sisa !== 0) {
          totalSisa += sisa;
          details.push({
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoice_number,
            clientName: invoice.client?.company || invoice.client?.name || "Unknown",
            productName: item.description || "Unknown",
            poQty,
            actualQty,
            sisaQty: sisa,
            date: invoice.issue_date || "",
          });

          const pName = item.description || "Unknown";
          if (!groupedMap[pName]) {
            groupedMap[pName] = { name: pName, sisa: 0, poQty: 0, actualQty: 0 };
          }
          groupedMap[pName].sisa += sisa;
          groupedMap[pName].poQty += poQty;
          groupedMap[pName].actualQty += actualQty;
        }
      }
    }

    details.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const grouped = Object.values(groupedMap).sort((a, b) => b.sisa - a.sisa);

    return { groupedProducts: grouped, sisaDetails: details, totalSisa };
  }, [invoices]);

  const filteredDetails = useMemo(() => {
    if (!selectedProduct) return [];
    return sisaDetails.filter((d) => d.productName === selectedProduct);
  }, [sisaDetails, selectedProduct]);

  return (
    <>
      <Head>
        <title>Sisa Produk PO | {APP_NAME}</title>
      </Head>
      <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {selectedProduct && (
              <button
                onClick={() => setSelectedProduct(null)}
                className="h-9 w-9 border rounded-lg flex items-center justify-center hover:bg-slate-50 transition-colors shrink-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {selectedProduct ? "Detail Transaksi Sisa PO" : "Sisa Produk PO"}
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {selectedProduct 
                  ? `Rincian sisa volume PO untuk produk "${selectedProduct}"`
                  : "Ringkasan sisa volume PO per jenis produk."}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center bg-slate-50/50">
            <h2 className="font-semibold text-sm">
              {selectedProduct ? `Transaksi: ${selectedProduct}` : "Daftar Sisa Produk"}
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Memuat data...</div>
            ) : !selectedProduct ? (
              /* Product Summary View */
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="py-2.5 px-4 border-b font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Nama Produk</th>
                    <th className="py-2.5 px-4 border-b font-semibold text-muted-foreground uppercase text-[11px] tracking-wider text-right">Vol PO</th>
                    <th className="py-2.5 px-4 border-b font-semibold text-muted-foreground uppercase text-[11px] tracking-wider text-right">Terkirim</th>
                    <th className="py-2.5 px-4 border-b font-semibold text-muted-foreground uppercase text-[11px] tracking-wider text-right">Total Sisa</th>
                    <th className="py-2.5 px-4 border-b font-semibold text-muted-foreground uppercase text-[11px] tracking-wider text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedProducts.map((p, idx) => (
                    <tr key={idx} className="border-b hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4 font-bold text-foreground text-xs">{p.name}</td>
                      <td className="py-3 px-4 text-right font-medium text-slate-500">{p.poQty}</td>
                      <td className="py-3 px-4 text-right font-medium text-emerald-600">{p.actualQty}</td>
                      <td className="py-3 px-4 text-right font-black text-blue-600">
                        {p.sisa > 0 ? "+" : ""}{p.sisa}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedProduct(p.name)}
                          className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
                        >
                          Lihat Detail
                        </button>
                      </td>
                    </tr>
                  ))}
                  {groupedProducts.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-muted-foreground">
                        Tidak ada data sisa PO. Semua pengiriman sesuai pesanan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              /* Transaction Detail View for Selected Product */
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="py-2.5 px-4 border-b font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Tanggal</th>
                    <th className="py-2.5 px-4 border-b font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">No. Invoice</th>
                    <th className="py-2.5 px-4 border-b font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">Customer</th>
                    <th className="py-2.5 px-4 border-b font-semibold text-muted-foreground uppercase text-[11px] tracking-wider text-right">Vol PO</th>
                    <th className="py-2.5 px-4 border-b font-semibold text-muted-foreground uppercase text-[11px] tracking-wider text-right">Terkirim</th>
                    <th className="py-2.5 px-4 border-b font-semibold text-muted-foreground uppercase text-[11px] tracking-wider text-right">Sisa</th>
                    <th className="py-2.5 px-4 border-b font-semibold text-muted-foreground uppercase text-[11px] tracking-wider text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDetails.map((detail, idx) => (
                    <tr key={idx} className="border-b hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4 font-medium">
                        {new Date(detail.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="py-3 px-4">
                        <Link href={`/tracker/invoices/${detail.invoiceId}`} className="text-primary font-bold hover:underline flex items-center gap-1.5 w-fit">
                          {detail.invoiceNumber}
                          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                        </Link>
                      </td>
                      <td className="py-3 px-4 font-semibold text-foreground">{detail.clientName}</td>
                      <td className="py-3 px-4 text-right font-medium">{detail.poQty}</td>
                      <td className="py-3 px-4 text-right font-medium text-emerald-600">{detail.actualQty}</td>
                      <td className="py-3 px-4 text-right font-black text-blue-600">
                        {detail.sisaQty > 0 ? "+" : ""}{detail.sisaQty}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/tracker/invoices/${detail.invoiceId}`}
                          className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
                        >
                          Detail Transaksi
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

SisaPOPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AuthGuard>
      <AppLayout title="Sisa PO">
        {page}
      </AppLayout>
    </AuthGuard>
  );
};
