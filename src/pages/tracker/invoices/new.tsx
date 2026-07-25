import type { ReactElement } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthGuard } from "@/components/AuthGuard";
import { InvoiceForm } from "@/components/invoices/InvoiceForm";

function NewInvoicePage() {
  return <InvoiceForm />;
}

NewInvoicePage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AuthGuard>
      <AppLayout title="Buat Transaksi Baru">{page}</AppLayout>
    </AuthGuard>
  );
};

export default NewInvoicePage;
