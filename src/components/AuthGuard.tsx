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
      <main className="fixed inset-0 z-50 grid place-items-center overflow-hidden bg-background">
        <img src="/logo.png" alt="Logo aplikasi" className="h-16 w-16 object-contain" />
      </main>
    );
  }

  return <>{children}</>;
}
