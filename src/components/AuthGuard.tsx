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
      <main className="min-h-screen grid place-items-center bg-background">
        <p className="text-sm text-muted-foreground">Memeriksa sesi...</p>
      </main>
    );
  }

  return <>{children}</>;
}
