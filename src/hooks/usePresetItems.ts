import useSWR from "swr";
import { InvoicePresetItem, InvoicePresetItemInput } from "@/types/invoice";
import { authenticatedFetch } from "@/lib/authenticatedFetch";
import { swrFetcher } from "@/lib/swrConfig";

export function usePresetItems() {
  const { data, error, mutate, isLoading } = useSWR<InvoicePresetItem[]>(
    "/api/preset-items",
    swrFetcher
  );

  const addPresetItem = async (itemData: InvoicePresetItemInput) => {
    const res = await authenticatedFetch("/api/preset-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(itemData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Gagal membuat item preset");
    }
    const newItem = await res.json();
    mutate();
    return newItem;
  };

  const updatePresetItem = async (id: string, itemData: Partial<InvoicePresetItemInput>) => {
    const res = await authenticatedFetch(`/api/preset-items/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(itemData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Gagal mengupdate item preset");
    }
    const updatedItem = await res.json();
    mutate();
    return updatedItem;
  };

  const deletePresetItem = async (id: string) => {
    const res = await authenticatedFetch(`/api/preset-items/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Gagal menghapus item preset");
    }
    mutate();
  };

  return {
    presetItems: data ?? [],
    isLoading,
    isError: error,
    addPresetItem,
    updatePresetItem,
    deletePresetItem,
  };
}
