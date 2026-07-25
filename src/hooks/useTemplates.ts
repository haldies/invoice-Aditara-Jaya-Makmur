import useSWR from "swr";
import { InvoiceTemplate, InvoiceTemplateInput } from "@/types/invoice";
import { authenticatedFetch } from "@/lib/authenticatedFetch";
import { swrFetcher } from "@/lib/swrConfig";

export function useTemplates() {
  const { data, error, mutate } = useSWR<{ templates: InvoiceTemplate[] }>(
    "/api/templates",
    swrFetcher
  );

  const addTemplate = async (templateData: InvoiceTemplateInput) => {
    const res = await authenticatedFetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(templateData),
    });
    if (!res.ok) throw new Error("Gagal membuat template");
    const newTemplate = await res.json();
    mutate();
    return newTemplate;
  };

  const updateTemplate = async (id: string, templateData: Partial<InvoiceTemplateInput>) => {
    const res = await authenticatedFetch(`/api/templates/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(templateData),
    });
    if (!res.ok) throw new Error("Gagal mengupdate template");
    const updatedTemplate = await res.json();
    mutate();
    return updatedTemplate;
  };

  const deleteTemplate = async (id: string) => {
    await authenticatedFetch(`/api/templates/${id}`, { method: "DELETE" });
    mutate();
  };

  return {
    templates: data?.templates ?? [],
    isLoading: !data && !error,
    isError: error,
    addTemplate,
    updateTemplate,
    deleteTemplate,
  };
}
