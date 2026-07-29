import { useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    void router.replace(user ? "/tracker" : "/login");
  }, [loading, router, user]);

  return (
    <>
      <Head>
        <title>LokerHub - Invoice Manager</title>
        <meta
          name="description"
          content="Kelola invoice client profesional dalam satu aplikasi."
        />
      </Head>
      <main className="fixed inset-0 grid place-items-center bg-background z-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
          <div className="h-3 w-24 bg-muted animate-pulse rounded-full" />
        </div>
      </main>
    </>
  );
}
