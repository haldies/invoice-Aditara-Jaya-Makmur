import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="id">
      <Head>
        {/* PWA Core */}
        <meta name="application-name" content="LokerHub" />

        {/* Theme color — matches primary blue */}
        <meta name="theme-color" content="#2563eb" />
        <meta name="msapplication-TileColor" content="#2563eb" />

        {/* iOS PWA — standalone mode, no browser chrome */}
        {/* black-translucent: status bar overlays app, requires safe-area-inset padding */}

      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
