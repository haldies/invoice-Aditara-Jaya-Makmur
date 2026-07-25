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
      <main className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Memuat...
      </main>
    </>
  );
}
