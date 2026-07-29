import type { ReactElement } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthGuard } from "@/components/AuthGuard";
import { InvoiceDashboard } from "@/components/invoices/InvoiceDashboard";

import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/hooks/useAuth";

function TrackerDashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user?.role === "sales") {
      router.replace("/tracker/invoices");
    }
  }, [user, loading, router]);

  if (loading || (user && user.role === "sales")) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <img src="/logo.png" alt="Logo aplikasi" className="h-14 w-14 object-contain" />
      </div>
    );
  }

  if (!user) return null;

  return <InvoiceDashboard />;
}

TrackerDashboardPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AuthGuard>
      <AppLayout title="Ringkasan">
        {page}
      </AppLayout>
    </AuthGuard>
  );
};

export default TrackerDashboardPage;
