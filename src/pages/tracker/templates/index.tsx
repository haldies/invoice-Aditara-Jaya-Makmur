import { ReactElement, useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Star, StarOff, Trash2, Edit, FileText, CheckCircle2, Eye } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { useTemplates } from "@/hooks/useTemplates";
import { useAuth } from "@/hooks/useAuth";
import { AuthGuard } from "@/components/AuthGuard";
import { InvoiceStatus } from "@/types/invoice";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const SYSTEM_PDF_TEMPLATES = [
  {
    id: "modern",
    name: "Modern (PDF)",
    description: "Template invoice minimalis, hitam-putih, bersih, cocok untuk segala kebutuhan retail/B2C.",
    type: "Invoice",
  },
  {
    id: "branded",
    name: "Branded (PDF)",
    description: "Template invoice dengan aksen hijau brand, fresh dan modern untuk branding perusahaan.",
    type: "Invoice",
  },
  {
    id: "corporate",
    name: "Corporate (PDF)",
    description: "Template invoice formal korporat dengan perpaduan navy dan emas untuk transaksi B2B.",
    type: "Invoice",
  },
  {
    id: "receipt",
    name: "Kwitansi Formal (PDF)",
    description: "Format kwitansi tanda terima pembayaran dengan detail volume beton, PPN 11%, dan terbilang.",
    type: "Kwitansi",
  },
];

const dummyInvoice = {
  id: "dummy-id",
  user_id: "dummy-user",
  client_id: "dummy-client",
  invoice_number: "INV/2026/04/007",
  status: "selesai" as InvoiceStatus,
  currency: "IDR",
  issue_date: "2026-04-29",
  due_date: "2026-05-15",
  paid_date: "2026-04-29",
  subtotal: 38400000,
  discount: 0,
  tax: 4224000,
  fee: 0,
  total: 42624000,
  notes: "Dn Gesing 0 RT 00 RW 00 Randu Pitu",
  terms: "Transfer ke Rekening BCA 1234567890 a.n CV ADITARA JAYA MAKMUR",
  template_id: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  version: 1,
  client: {
    id: "dummy-client",
    user_id: "dummy-user",
    name: "PT. SOLINDO TAMA JAYA",
    email: "solindo@mail.com",
    phone: "0812-3456-7890",
    company: "PT. SOLINDO TAMA JAYA",
    address: "Jl. Tropodo I,9, Tropodo, Waru, Kab. Sidoarjo, Jawa Timur 61256",
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  items: [
    {
      id: "dummy-item-1",
      invoice_id: "dummy-id",
      description: "Beton Jadi / Mutu : Concrete Normal with strength 400 ksc.",
      quantity: 48,
      unit_price: 800000,
      buy_in_price: 680000,
      commission_rate: 5000,
      actual_quantity: null,
      line_total: 38400000,
      sort_order: 0,
    }
  ],
};

function TemplatesPage() {
  const { user } = useAuth();
  const { templates, isLoading, updateTemplate, deleteTemplate } = useTemplates();

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState("");
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleToggleDefault = async (id: string, isCurrentlyDefault: boolean) => {
    await updateTemplate(id, { is_default: !isCurrentlyDefault });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus template ini?")) {
      await deleteTemplate(id);
    }
  };

  const handlePreviewSystemTemplate = async (templateId: string, name: string) => {
    setIsPreviewLoading(true);
    setPreviewTitle(name);
    try {
      const { pdf } = await import("@react-pdf/renderer");
      const { loadCompanyProfile } = await import("@/lib/companyProfile");
      const company = loadCompanyProfile();

      let blob: Blob;
      const includePpn = templateId === "receipt" || templateId === "branded" || templateId === "corporate";

      if (templateId === "receipt") {
        const { ReceiptPDF } = await import("@/components/invoices/ReceiptPDF");
        blob = await pdf(<ReceiptPDF invoice={dummyInvoice} company={company} includePpn={includePpn} />).toBlob();
      } else if (templateId === "branded") {
        const { TemplateBranded } = await import("@/components/invoices/templates/TemplateBranded");
        blob = await pdf(<TemplateBranded invoice={dummyInvoice} company={company} includePpn={includePpn} />).toBlob();
      } else if (templateId === "corporate") {
        const { TemplateCorporate } = await import("@/components/invoices/templates/TemplateCorporate");
        blob = await pdf(<TemplateCorporate invoice={dummyInvoice} company={company} includePpn={includePpn} />).toBlob();
      } else {
        const { TemplateModern } = await import("@/components/invoices/templates/TemplateModern");
        blob = await pdf(<TemplateModern invoice={dummyInvoice} company={company} includePpn={includePpn} />).toBlob();
      }

      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (error) {
      console.error("Preview generation error:", error);
      alert("Gagal memuat pratinjau.");
    } finally {
      setIsPreviewLoading(false);
    }
  };

  if (user && user.role === "user") {
    return (
      <div className="mx-auto max-w-xl p-8 text-center text-sm font-semibold text-destructive">
        Akses Ditolak: Anda tidak memiliki hak akses untuk mengelola Template Invoice.
      </div>
    );
  }

  if (isLoading) {
    return <div className="p-4 md:p-6 text-muted-foreground">Memuat templates...</div>;
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Daftar Template</h1>
        </div>
      </div>

      {/* Section 1: Template Sistem (PDF) */}
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-bold text-foreground">Template Sistem (PDF)</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SYSTEM_PDF_TEMPLATES.map((t) => (
            <div
              key={t.id}
              className="flex flex-col border rounded-xl bg-card p-4 shadow-xs relative overflow-hidden"
            >
              <div className="absolute top-2 right-2 bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
                {t.type}
              </div>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-muted rounded-lg text-foreground">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate">{t.name}</h3>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-4 flex-1">
                {t.description}
              </p>
              <div className="mt-auto pt-3 border-t flex items-center justify-between text-xs font-semibold">
                <span className="text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Aktif
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePreviewSystemTemplate(t.id, t.name)}
                  disabled={isPreviewLoading}
                  className="h-7 text-xs text-primary font-medium hover:bg-primary/5 flex items-center gap-1"
                >
                  <Eye className="w-3 h-3" />
                  {isPreviewLoading && previewTitle === t.name ? "Memuat..." : "Preview"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Template Kustom (HTML Print) */}
      <div className="space-y-4 pt-4 border-t">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-base font-bold text-foreground">Template Kustom (HTML)</h2>
          </div>
          <Link href="/tracker/templates/new">
            <Button size="sm" variant="outline">
              <Plus className="mr-1.5 h-4 w-4" />
              Buat Baru
            </Button>
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <div
              key={template.id}
              className="flex flex-col border rounded-xl bg-card p-4 shadow-xs"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate">{template.name}</h3>
                  <p className="text-[10px] text-muted-foreground">
                    Diperbarui {new Date(template.updated_at).toLocaleDateString("id-ID")}
                  </p>
                </div>
              </div>

              <div className="mt-auto flex items-center justify-between gap-2 border-t pt-4">
                <Button
                  variant={template.is_default ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleToggleDefault(template.id, template.is_default)}
                  className="flex-1 text-xs"
                  title={template.is_default ? "Jadikan tidak default" : "Jadikan default"}
                >
                  {template.is_default ? (
                    <><Star className="mr-1.5 h-3.5 w-3.5 fill-current" /> Default</>
                  ) : (
                    <><StarOff className="mr-1.5 h-3.5 w-3.5" /> Set Default</>
                  )}
                </Button>
                <Link href={`/tracker/templates/${template.id}`}>
                  <Button variant="outline" size="icon" className="h-8 w-8" title="Edit Template">
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleDelete(template.id)}
                  className="text-destructive hover:text-destructive h-8 w-8"
                  title="Hapus Template"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
          {templates.length === 0 && (
            <div className="col-span-full py-8 text-center border border-dashed rounded-xl bg-muted/20">
              <p className="text-muted-foreground mb-3 text-xs">Belum ada template kustom HTML.</p>
              <Link href="/tracker/templates/new">
                <Button variant="outline" size="sm" className="text-xs">
                  <Plus className="mr-1.5 h-3.5 w-3.5" /> Buat Template
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Live PDF Preview Dialog */}
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="max-w-4xl h-[85vh] p-0 overflow-hidden flex flex-col">
          <DialogHeader className="px-6 py-4 border-b shrink-0 flex flex-row items-center justify-between">
            <DialogTitle className="text-sm font-bold">
              Pratinjau Dokumen: {previewTitle}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 bg-muted/10 relative">
            {previewUrl && (
              <iframe
                src={previewUrl}
                className="w-full h-full border-none"
                title="PDF Preview"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

TemplatesPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AuthGuard>
      <AppLayout title="Manage Templates">{page}</AppLayout>
    </AuthGuard>
  );
};

export default TemplatesPage;
