import { ReactElement } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { TemplateEditor } from "@/components/templates/TemplateEditor";

import { useAuth } from "@/hooks/useAuth";
import { AuthGuard } from "@/components/AuthGuard";

function NewTemplatePage() {
  const { user } = useAuth();
  
  if (user && user.role === "user") {
    return (
      <div className="mx-auto max-w-xl p-8 text-center text-sm font-semibold text-destructive">
        Akses Ditolak: Anda tidak memiliki hak akses untuk mengelola Template Invoice.
      </div>
    );
  }

  return <TemplateEditor />;
}

NewTemplatePage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AuthGuard>
      <AppLayout title="Buat Template Kustom">{page}</AppLayout>
    </AuthGuard>
  );
};

export default NewTemplatePage;
