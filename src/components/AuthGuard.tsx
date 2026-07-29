import { ReactNode, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/hooks/useAuth";

export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      const next = encodeURIComponent(router.asPath);
      void router.replace(`/login?next=${next}`);
    }
  }, [loading, router, user]);

  if (loading || !user) {
    return (
      <main className="fixed inset-0 grid place-items-center bg-background z-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
          <div className="h-3 w-24 bg-muted animate-pulse rounded-full" />
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
