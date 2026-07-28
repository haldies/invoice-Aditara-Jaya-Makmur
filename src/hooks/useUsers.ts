import useSWR from "swr";
import { AppUser, AppRole } from "@/types/invoice";
import { swrFetcher } from "@/lib/swrConfig";

export function useUsers() {
  const { data, error, mutate, isLoading } = useSWR<{ users: AppUser[] }>(
    "/api/users",
    swrFetcher
  );

  const updateUser = async (id: string, data: Partial<AppUser>) => {
    const res = await fetch(`/api/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || "Gagal mengupdate pengguna");
    }

    const updatedUser = await res.json();
    mutate();
    return updatedUser;
  };



  return {
    users: data?.users ?? [],
    isLoading,
    isError: error,
    updateUser,
  };
}
