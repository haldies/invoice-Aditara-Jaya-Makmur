import { ReactElement } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
import { AppLayout } from "@/components/layout/AppLayout";
import { TemplateEditor } from "@/components/templates/TemplateEditor";
import { InvoiceTemplate } from "@/types/invoice";
import { swrFetcher } from "@/lib/swrConfig";

import { useAuth } from "@/hooks/useAuth";
import { AuthGuard } from "@/components/AuthGuard";

function EditTemplatePage() {
  const { user } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  const { data: template, isLoading } = useSWR<InvoiceTemplate>(
    id ? `/api/templates/${id}` : null,
    swrFetcher
  );

  if (user && user.role === "user") {
    return (
      <div className="mx-auto max-w-xl p-8 text-center text-sm font-semibold text-destructive">
        Akses Ditolak: Anda tidak memiliki hak akses untuk mengelola Template Invoice.
      </div>
    );
  }

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Memuat template...</div>;
  if (!template && id) return <div className="p-8 text-center text-destructive">Template tidak ditemukan.</div>;
  
  return template ? <TemplateEditor template={template} /> : null;
}

EditTemplatePage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AuthGuard>
      <AppLayout title="Edit Template">{page}</AppLayout>
    </AuthGuard>
  );
};

export default EditTemplatePage;
