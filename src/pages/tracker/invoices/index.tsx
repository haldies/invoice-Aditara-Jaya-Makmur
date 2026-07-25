import type { ReactElement } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthGuard } from "@/components/AuthGuard";
import { InvoiceList } from "@/components/invoices/InvoiceList";

function InvoicesPage() {
  return <InvoiceList />;
}

InvoicesPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AuthGuard>
      <AppLayout title="Daftar Transaksi">{page}</AppLayout>
    </AuthGuard>
  );
};

export default InvoicesPage;
