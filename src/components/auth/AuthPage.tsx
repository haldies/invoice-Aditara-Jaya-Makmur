import { FormEvent, ReactNode, useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { APP_NAME, SUPPORT_EMAIL } from "@/lib/appMetadata";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AuthMode = "login" | "signup" | "reset";

const copy: Record<
  AuthMode,
  { title: string; subtitle: string; action: string }
> = {
  login: {
    title: `Sistem Internal ${APP_NAME}`,
    subtitle: "Akses eksklusif untuk manajemen invoice internal.",
    action: "Masuk",
  },
  signup: {
    title: `Buat akun ${APP_NAME}`,
    subtitle:
      "Daftar dengan email dan password. Reset password belum diaktifkan.",
    action: "Daftar",
  },
  reset: {
    title: "Reset password dinonaktifkan",
    subtitle:
      "Jalur pemulihan email dimatikan. Gunakan login email dan password saja.",
    action: "Kembali ke login",
  },
};

export function AuthPage({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const { refreshSession, user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const pageCopy = copy[mode];

  useEffect(() => {
    if (!authLoading && user) {
      const next = typeof router.query.next === "string" ? router.query.next : "/tracker";
      window.location.replace(next);
    }
  }, [authLoading, user, router]);

  function getFriendlyAuthMessage(raw: unknown, fallback: string) {
    const message =
      typeof raw === "object" && raw && "error" in raw
        ? String((raw as { error?: unknown }).error ?? fallback)
        : fallback;
    if (message.includes("Email sudah terdaftar")) return message;
    if (message.includes("terlalu pendek")) return "Password minimal 8 karakter.";
    if (message.includes("tidak valid")) return "Format email tidak valid.";
    if (message.includes("Login gagal")) return "Email atau password salah.";
    return message;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mode === "reset") {
      void router.replace("/login");
      return;
    }

    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      if (mode === "login") {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password }),
        });
        
        let payload: unknown;
        try {
          payload = await response.json();
        } catch {
          payload = { error: "Terjadi kesalahan server. Cek koneksi atau database." };
        }

        if (!response.ok) {
          setError(getFriendlyAuthMessage(payload, "Login gagal."));
        } else {
          await refreshSession();
          const next =
            typeof router.query.next === "string" ? router.query.next : "/tracker";
          window.location.replace(next);
        }
      } else {
        const response = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password }),
        });
        
        let payload: unknown;
        try {
          payload = await response.json();
        } catch {
          payload = { error: "Terjadi kesalahan server. Cek koneksi atau database." };
        }

        if (!response.ok) {
          setError(getFriendlyAuthMessage(payload, "Signup gagal."));
        } else {
          await refreshSession();
          setMessage("Akun dibuat. Sekarang login bisa langsung dipakai.");
          window.location.assign("/tracker");
        }
      }
    } catch (err) {
      console.error(err);
      setError("Terjadi kesalahan jaringan.");
    } finally {
      setSubmitting(false);
    }
  }

  let alternate: ReactNode;
  if (mode === "login") {
    alternate = null;
  } else {
    alternate = (
      <>
        <Link href="/login">Kembali ke login</Link>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{`${pageCopy.title} | ${APP_NAME}`}</title>
      </Head>
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 px-4 py-12">
        <div className="mx-auto w-full max-w-md rounded-2xl bg-white/80 p-8 shadow-xl backdrop-blur-md ring-1 ring-black/5">
          <div className="flex flex-col items-center text-center">
            <Link href="/" className="text-2xl font-black tracking-tight text-primary">
              {APP_NAME}
            </Link>
            <h1 className="mt-8 text-2xl font-bold tracking-tight text-slate-900">{pageCopy.title}</h1>
            <p className="mt-2 text-sm text-slate-500">
              {pageCopy.subtitle}
            </p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Username</Label>
              <Input
                id="email"
                type="text"
                placeholder="Masukkan username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            {mode !== "reset" && (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
            {message && <p className="text-sm text-emerald-700">{message}</p>}
            {mode === "reset" ? (
              <Button className="w-full" type="button" onClick={() => router.replace("/login")}>
                {pageCopy.action}
              </Button>
            ) : (
              <Button className="w-full" disabled={submitting} type="submit">
                {submitting ? "Memproses..." : pageCopy.action}
              </Button>
            )}
          </form>
          {alternate && (
            <p className="mt-8 text-center text-sm font-medium text-slate-600">
              {alternate}
            </p>
          )}
          <div className="mt-8 border-t border-slate-200 pt-6">
            <p className="text-center text-xs text-slate-500">
              Dengan melanjutkan, Anda menyetujui{" "}
            <Link href="/terms">Terms</Link> dan{" "}
            <Link href="/privacy">Privacy Policy</Link>. Bantuan:{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
