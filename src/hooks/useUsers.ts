import useSWR from "swr";
import { swrFetcher } from "@/lib/swrConfig";

export type UserType = {
  id: string;
  email: string;
  role: string;
  commission_rate: number;
  created_at: string;
};

export function useUsers() {
  const { data, error, mutate, isLoading } = useSWR<UserType[]>(
    "/api/users",
    swrFetcher,
    { revalidateOnFocus: true }
  );

  const createUser = async (payload: { username: string; password?: string; role: string }) => {
    const res = await fetch("/api/users/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Gagal membuat pengguna");
    
    // Optimistic / revalidate SWR cache without full page reload
    await mutate();
    return result;
  };

  const updateUser = async (
    id: string,
    payload: Partial<{ username: string; password?: string; role: string; email?: string | null; name?: string | null; phone?: string | null }>
  ) => {
    const res = await fetch(`/api/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Gagal mengubah pengguna");
    
    // Revalidate SWR cache instantly
    await mutate();
    return result;
  };

  const deleteUser = async (id: string) => {
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    const result = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(result.error || "Gagal menghapus pengguna");
    
    // Revalidate SWR cache instantly
    await mutate();
    return result;
  };

  return {
    users: data || [],
    isLoading,
    isError: error,
    createUser,
    updateUser,
    deleteUser,
    mutate,
  };
}
