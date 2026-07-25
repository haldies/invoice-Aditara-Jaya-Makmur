import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseUrl } from "@/lib/appMetadata";

let browserClient: SupabaseClient | undefined;

export function hasSupabaseBrowserConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && key);
}

function getBrowserConfig() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !key) {
    throw new Error(
      "Supabase browser configuration is missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  return { url: getSupabaseUrl(), key };
}

export function getSupabaseBrowserClient(): SupabaseClient {
  if (!browserClient) {
    const { url, key } = getBrowserConfig();
    browserClient = createBrowserClient(url, key);
  }
  return browserClient;
}
