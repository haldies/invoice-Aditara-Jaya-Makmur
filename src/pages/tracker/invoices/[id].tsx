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
import { InvoiceForm } from "@/components/invoices/InvoiceForm";
import { TagihanView } from "@/components/invoices/stages/TagihanView";
import { POView } from "@/components/invoices/stages/POView";
import { PengirimanView } from "@/components/invoices/stages/PengirimanView";
import { SelesaiView } from "@/components/invoices/stages/SelesaiView";
import { PdfHistory } from "@/components/invoices/PdfHistory";

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

    let viewContent: ReactElement | null = null;
    
    if (isSales) {
      if (status === "penawaran") {
        viewContent = <SalesPenawaranView invoice={currentInvoice} onUpdated={handleUpdated} />;
      } else {
        viewContent = <SalesReadOnlyView invoice={currentInvoice} />;
      }
    } else if (isAdmin) {
      if (status === "penawaran") {
        viewContent = <InvoiceForm invoice={currentInvoice} />;
      } else if (status === "tagihan") {
        viewContent = <TagihanView invoice={currentInvoice} onUpdated={handleUpdated} />;
      } else if (status === "po") {
        viewContent = <POView invoice={currentInvoice} onUpdated={handleUpdated} />;
      } else if (status === "pengiriman") {
        viewContent = <PengirimanView invoice={currentInvoice} onUpdated={handleUpdated} />;
      } else if (status === "selesai" || status === "batal") {
        viewContent = <SelesaiView invoice={currentInvoice} onUpdated={handleUpdated} isSales={false} />;
      }
    }

    if (!viewContent) {
      viewContent = (
        <div className="p-8 text-center text-muted-foreground text-sm">
          Tampilan untuk tahap ini belum tersedia.
        </div>
      );
    }

    return (
      <div className="pb-8">
        {viewContent}
        {isAdmin && currentInvoice.status !== "penawaran" && (
          <div className="max-w-3xl mx-auto px-4 md:px-6">
            <PdfHistory invoice={currentInvoice} />
          </div>
        )}
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
