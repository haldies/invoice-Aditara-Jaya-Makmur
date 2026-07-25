import type { ReactElement } from "react";
import useSWR from "swr";
import { useRouter } from "next/router";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthGuard } from "@/components/AuthGuard";
import { InvoiceForm } from "@/components/invoices/InvoiceForm";
import { swrFetcher } from "@/lib/swrConfig";
import { Invoice } from "@/types/invoice";

function InvoiceDetailPage() {
  const router = useRouter();
  const id = typeof router.query.id === "string" ? router.query.id : null;
  const { data: invoice, isLoading } = useSWR<Invoice>(
    id ? `/api/invoices/${id}` : null,
    swrFetcher
  );

  if (isLoading || !invoice) {
    return (
      <div className="grid gap-3 p-4 md:p-5">
        <div className="h-24 animate-pulse rounded-lg bg-muted" />
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  return <InvoiceForm invoice={invoice} />;
}

InvoiceDetailPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AuthGuard>
      <AppLayout title="Edit Transaksi">{page}</AppLayout>
    </AuthGuard>
  );
};

export default InvoiceDetailPage;
