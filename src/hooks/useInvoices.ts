import { useCallback } from "react";
import useSWR from "swr";
import { useToast } from "@/hooks/use-toast";
import { swrFetcher } from "@/lib/swrConfig";
import { Invoice, InvoiceInput, PaginatedResult } from "@/types/invoice";

const API_KEY = "/api/invoices";

export function useInvoices(params?: Record<string, any>) {
  const { toast } = useToast();
  
  const query = params 
    ? "?" + new URLSearchParams(
        Object.entries(params)
          .filter(([_, v]) => v !== undefined && v !== "" && v !== "all")
          .map(([k, v]) => [k, String(v)])
      ).toString() 
    : "";
  const SWR_KEY = params ? API_KEY + query : API_KEY;

  const {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
  } = useSWR<PaginatedResult<Invoice> | Invoice[]>(SWR_KEY, swrFetcher, {
    revalidateOnFocus: true,
    refreshInterval: 10000, // Auto-refresh setiap 10 detik
  });

  const invoices = data && "data" in data ? data.data : (Array.isArray(data) ? data : []);
  const pagination = data && "total" in data ? { total: data.total, page: data.page, totalPages: data.totalPages } : { total: invoices.length, page: 1, totalPages: 1 };

  const addInvoice = useCallback(
    async (invoice: InvoiceInput) => {
      const response = await fetch(API_KEY, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invoice),
      });
      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || "Gagal menyimpan invoice");
      }
      const created = (await response.json()) as Invoice;
      await mutate([created, ...invoices], false);
      toast({
        title: "Invoice dibuat",
        description: `${created.invoice_number} untuk ${created.client.name}`,
      });
      return created;
    },
    [invoices, mutate, toast]
  );

  const updateInvoice = useCallback(
    async (id: string, updates: Partial<InvoiceInput> & { version?: number }) => {
      const previous = invoices;
      const response = await fetch(`${API_KEY}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (response.status === 409) {
        window.dispatchEvent(new Event("lokerhub:sync-conflict"));
      }
      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || "Gagal memperbarui invoice");
      }
      const updated = (await response.json()) as Invoice;
      await mutate(
        previous.map((invoice) => (invoice.id === id ? updated : invoice)),
        false
      );
      return updated;
    },
    [invoices, mutate]
  );

  const deleteInvoice = useCallback(
    async (id: string) => {
      const previous = invoices;
      try {
        // Optimistic update: hapus dari UI dulu
        await mutate(
          invoices.filter((invoice) => invoice.id !== id),
          false
        );
        const response = await fetch(`${API_KEY}/${id}`, { method: "DELETE" });
        if (!response.ok) {
          const errJson = await response.json().catch(() => ({}));
          throw new Error(errJson.error || "Gagal menghapus invoice");
        }
        // Revalidate dari server agar data sinkron
        await mutate();
        toast({ title: "Invoice dihapus" });
      } catch (error) {
        // Rollback optimistic update jika gagal
        await mutate(previous, false);
        toast({
          title: "Gagal menghapus",
          description: error instanceof Error ? error.message : "Terjadi kesalahan",
          variant: "destructive",
        });
        throw error;
      }
    },
    [invoices, mutate, toast]
  );

  return {
    invoices,
    pagination,
    error,
    isLoading,
    isValidating,
    addInvoice,
    updateInvoice,
    deleteInvoice,
    mutate,
  };
}

export function useInvoiceFilterOptions() {
  const { data, error, isLoading } = useSWR<{ sales: string[], products: string[], cities: string[] }>(
    "/api/invoices/filter-options",
    swrFetcher,
    { revalidateOnFocus: false }
  );

  return {
    options: data || { sales: [], products: [], cities: [] },
    isLoading,
    error,
  };
}
