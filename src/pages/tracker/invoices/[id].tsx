import { useState } from "react";
import type { ReactElement } from "react";
import useSWR from "swr";
import { useRouter } from "next/router";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthGuard } from "@/components/AuthGuard";
import { swrFetcher } from "@/lib/swrConfig";
import { Invoice } from "@/types/invoice";
import { useAuth } from "@/hooks/useAuth";

// Per-stage components
import { SalesPenawaranView } from "@/components/invoices/stages/SalesPenawaranView";
import { SalesReadOnlyView } from "@/components/invoices/stages/SalesReadOnlyView";
import { AdminPenawaranView } from "@/components/invoices/stages/AdminPenawaranView";
import { TagihanView } from "@/components/invoices/stages/TagihanView";
import { POView } from "@/components/invoices/stages/POView";
import { PengirimanView } from "@/components/invoices/stages/PengirimanView";
import { SelesaiView } from "@/components/invoices/stages/SelesaiView";

function InvoiceDetailPage() {
  const router = useRouter();
  const { user } = useAuth();
  const id = typeof router.query.id === "string" ? router.query.id : null;

  const { data: initialInvoice, isLoading } = useSWR<Invoice>(
    id ? `/api/invoices/${id}` : null,
    swrFetcher
  );

  // Local state so stage views can update the invoice without full page reload
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const currentInvoice = invoice ?? initialInvoice ?? null;

  if (isLoading || !currentInvoice || !user) {
    return (
      <div className="grid gap-3 p-4 md:p-5">
        <div className="h-12 animate-pulse rounded-xl bg-muted" />
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
        <div className="h-40 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  const isSales = user.role === "sales" || user.role === "user";
  const isAdmin = user.role === "owner" || user.role === "admin" || user.role === "manager";
  const { status } = currentInvoice;

  const handleUpdated = (updated: Invoice) => {
    setInvoice(updated);
  };

  // --- Route to correct stage component ---
  if (isSales) {
    if (status === "penawaran") {
      return <SalesPenawaranView invoice={currentInvoice} onUpdated={handleUpdated} />;
    }
    // All other stages: read-only for sales
    return <SalesReadOnlyView invoice={currentInvoice} />;
  }

  if (isAdmin) {
    if (status === "penawaran") {
      return <AdminPenawaranView invoice={currentInvoice} onUpdated={handleUpdated} />;
    }
    if (status === "tagihan") {
      return <TagihanView invoice={currentInvoice} onUpdated={handleUpdated} />;
    }
    if (status === "po") {
      return <POView invoice={currentInvoice} onUpdated={handleUpdated} />;
    }
    if (status === "pengiriman") {
      return <PengirimanView invoice={currentInvoice} onUpdated={handleUpdated} />;
    }
    if (status === "selesai" || status === "batal") {
      return <SelesaiView invoice={currentInvoice} onUpdated={handleUpdated} isSales={false} />;
    }
  }

  // Fallback (shouldn't normally happen)
  return (
    <div className="p-8 text-center text-muted-foreground text-sm">
      Tampilan untuk tahap ini belum tersedia.
    </div>
  );
}

InvoiceDetailPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AuthGuard>
      <AppLayout title="Detail Transaksi">{page}</AppLayout>
    </AuthGuard>
  );
};

export default InvoiceDetailPage;
