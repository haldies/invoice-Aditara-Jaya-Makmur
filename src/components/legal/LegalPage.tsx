import { ReactNode } from "react";
import Head from "next/head";
import Link from "next/link";
import { APP_NAME, SUPPORT_EMAIL } from "@/lib/appMetadata";

export function LegalPage({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <>
      <Head>
        <title>{`${title} | ${APP_NAME}`}</title>
      </Head>
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <article className="mx-auto max-w-3xl rounded-2xl border bg-white p-7 shadow-sm md:p-10 [&_a]:text-primary [&_h1]:mt-7 [&_h1]:text-3xl [&_h1]:font-bold [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_li]:my-2 [&_p]:my-4 [&_p]:leading-7 [&_ul]:list-disc [&_ul]:pl-6">
          <Link href="/" className="font-bold no-underline">
            LokerHub
          </Link>
          <h1>{title}</h1>
          <p>
            <strong>Effective date / Tanggal berlaku:</strong> 7 Juni 2026
          </p>
          {children}
          <hr className="my-8" />
          <p>
            Contact / Kontak:{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
          </p>
        </article>
      </main>
    </>
  );
}
