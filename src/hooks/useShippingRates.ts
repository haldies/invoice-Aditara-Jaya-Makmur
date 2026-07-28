import { useState, useEffect, useCallback } from "react";
import { authenticatedFetch } from "@/lib/authenticatedFetch";

export interface ShippingRate {
  id: string;
  user_id: string;
  area: string;
  price: number;
  is_free: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useShippingRates() {
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRates = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await authenticatedFetch("/api/shipping-rates");
      if (res.ok) {
        const data = await res.json();
        setRates(data);
      }
    } catch (error) {
      console.error("Error fetching shipping rates:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  const addRate = async (data: { area: string; price: number; is_free: boolean; notes?: string }) => {
    const res = await authenticatedFetch("/api/shipping-rates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Gagal menambah tarif ongkir");
    await fetchRates();
  };

  const updateRate = async (id: string, data: { area?: string; price?: number; is_free?: boolean; notes?: string }) => {
    const res = await authenticatedFetch(`/api/shipping-rates/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Gagal memperbarui tarif ongkir");
    await fetchRates();
  };

  const deleteRate = async (id: string) => {
    const res = await authenticatedFetch(`/api/shipping-rates/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Gagal menghapus tarif ongkir");
    await fetchRates();
  };

  return {
    rates,
    isLoading,
    fetchRates,
    addRate,
    updateRate,
    deleteRate,
  };
}
