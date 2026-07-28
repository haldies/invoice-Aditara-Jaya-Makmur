import "@/styles/globals.css";
import { useEffect } from "react";
import { useRouter } from "next/router";
import type { ReactElement, ReactNode } from "react";
import type { NextPage } from "next";
import type { AppProps } from "next/app";
import Head from "next/head";

type NextPageWithLayout<P = object, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};
import { SWRConfig } from "swr";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { swrConfig } from "@/lib/swrConfig";
import { OAuthCallbackRelay } from "@/components/OAuthCallbackRelay";

export default function App({ Component, pageProps }: AppPropsWithLayout) {
  const router = useRouter();
  
  // Use the layout defined at the page level, if available
  const getLayout = Component.getLayout ?? ((page) => page);

  // Register service worker for PWA
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.log("Service Worker registered successfully:", reg.scope))
        .catch((err) => console.error("Service Worker registration failed:", err));
    }
  }, []);

  useEffect(() => {
    const isPwaShell = router.pathname.startsWith("/tracker") || router.pathname.startsWith("/settings");
    if (isPwaShell) {
      document.documentElement.classList.add("pwa-body-lock");
      document.body.classList.add("pwa-body-lock");
    } else {
      document.documentElement.classList.remove("pwa-body-lock");
      document.body.classList.remove("pwa-body-lock");
    }
  }, [router.pathname]);

  return (
    /**
     * SWRConfig: global cache provider untuk semua useSWR hooks.
     * - swrConfig.fetcher: authenticated API requests
     * - Data di-share antar komponen yang pakai key yang sama
     * - Saat pindah tab → data instan dari cache
     */
    <SWRConfig value={swrConfig}>
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"
        />
      </Head>
      <AuthProvider>
        <OAuthCallbackRelay />
        <TooltipProvider>
          {getLayout(<Component {...pageProps} />)}
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </SWRConfig>
  );
}
