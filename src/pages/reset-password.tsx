import Head from "next/head";
import Link from "next/link";
import { APP_NAME } from "@/lib/appMetadata";

export default function ResetPasswordPage() {
  return (
    <>
      <Head>
        <title>Reset password dinonaktifkan | {APP_NAME}</title>
      </Head>
      <main className="min-h-screen bg-slate-50 px-4 py-12">
        <div className="mx-auto w-full max-w-md rounded-2xl border bg-white p-7 shadow-sm">
          <Link href="/" className="text-lg font-bold text-primary">
            {APP_NAME}
          </Link>
          <h1 className="mt-7 text-2xl font-bold">
            Reset password dinonaktifkan
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Gunakan email dan password langsung. Jalur pemulihan email belum
            diaktifkan.
          </p>
          <Link href="/login" className="mt-6 inline-block text-primary">
            Kembali ke login
          </Link>
        </div>
      </main>
    </>
  );
}
