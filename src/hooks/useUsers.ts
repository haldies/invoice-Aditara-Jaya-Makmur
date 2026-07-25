import useSWR from "swr";
import { AppUser, AppRole } from "@/types/invoice";
import { swrFetcher } from "@/lib/swrConfig";

export function useUsers() {
  const { data, error, mutate, isLoading } = useSWR<{ users: AppUser[] }>(
    "/api/users",
    swrFetcher
  );

  const updateUserRole = async (id: string, newRole: AppRole) => {
    const res = await fetch(`/api/users/${id}/role`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || "Gagal mengubah role pengguna");
    }

    const updatedUser = await res.json();
    mutate();
    return updatedUser;
  };

  const updateUserCommissionRate = async (id: string, newRate: number) => {
    const res = await fetch(`/api/users/${id}/commission`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commission_rate: newRate }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || "Gagal mengubah tarif komisi");
    }

    const updatedUser = await res.json();
    mutate();
    return updatedUser;
  };

  return {
    users: data?.users ?? [],
    isLoading,
    isError: error,
    updateUserRole,
    updateUserCommissionRate,
  };
}
