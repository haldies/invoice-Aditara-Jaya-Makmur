import useSWR from "swr";
import { Client } from "@/types/invoice";
import { swrFetcher } from "@/lib/swrConfig";

export function useClients() {
  const { data, error, mutate, isLoading } = useSWR<Client[]>(
    "/api/clients",
    swrFetcher
  );

  return {
    clients: data ?? [],
    isLoading,
    isError: error,
    mutate,
  };
}
