import { authenticatedFetch } from "@/lib/authenticatedFetch";

export async function swrFetcher<T>(url: string): Promise<T> {
  const res = await authenticatedFetch(url);
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export const swrConfig = {
  fetcher: swrFetcher,
  dedupingInterval: 30_000,
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  revalidateIfStale: false,
  errorRetryCount: 3,
  keepPreviousData: true,
  shouldRetryOnError: (err: Error) => {
    if (typeof navigator !== "undefined" && !navigator.onLine) return false;
    return err.message.startsWith("API error: 5");
  },
} as const;
