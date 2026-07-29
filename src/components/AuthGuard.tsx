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
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.16),transparent_45%),linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,1))]" />
        <div className="relative flex flex-col items-center gap-4 px-6 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white shadow-[0_16px_50px_rgba(15,23,42,0.12)] ring-1 ring-black/5">
            <img src="/logo.png" alt="Logo aplikasi" className="h-16 w-16 object-contain" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold tracking-[0.24em] text-primary uppercase">Invoice Manager</p>
            <p className="text-xs text-muted-foreground">Menyiapkan ruang kerja Anda</p>
          </div>
          <div className="h-1.5 w-36 overflow-hidden rounded-full bg-black/5">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-primary/80" />
          </div>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
