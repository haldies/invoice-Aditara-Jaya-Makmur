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
      <div className="p-8 text-center text-sm text-muted-foreground">
        Memuat...
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
