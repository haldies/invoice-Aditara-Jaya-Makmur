import { useState } from "react";
import { Invoice } from "@/types/invoice";
import { loadCompanyProfile } from "@/lib/companyProfile";
import { handleDownloadPDF } from "@/components/invoices/stages/stageUtils";
import { Button } from "@/components/ui/button";
import { FileText, Download, Receipt, ShoppingCart } from "lucide-react";
import { PdfActionButton } from "./stages/PdfActionButton";

interface Props {
  invoice: Invoice;
}

export function PdfHistory({ invoice }: Props) {
  const [loadingType, setLoadingType] = useState<string | null>(null);

  const includePpn = Math.abs((invoice.tax || 0) - invoice.subtotal * 0.11) < 100 && (invoice.tax || 0) > 0;

  const download = (type: "quotation" | "invoice" | "receipt" | "po", action: any) => {
    const company = loadCompanyProfile();
    setLoadingType(type);
    import("@/components/invoices/stages/stageUtils").then(({ handlePdfAction }) => {
      handlePdfAction(action, type, invoice, company, includePpn, (isLoading) => {
        if (!isLoading) setLoadingType(null);
      });
    });
  };

  const statuses = ["penawaran", "tagihan", "po", "pengiriman", "selesai"];
  const currentIdx = invoice.status === "batal" ? 4 : statuses.indexOf(invoice.status);

  return (
    <div className="bg-card border rounded-xl p-4 mt-6">
      <div className="border-b pb-2 mb-3">
        <h3 className="font-bold text-sm text-foreground">Riwayat Dokumen PDF</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Unduh dokumen yang dibutuhkan untuk transaksi ini kapan saja.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <PdfActionButton
          label="Penawaran"
          icon={FileText}
          isLoading={loadingType === "quotation"}
          onAction={(action) => download("quotation", action)}
          className="h-10 text-xs font-semibold flex items-center justify-center gap-2 hover:bg-slate-50 border-slate-200"
        />
        {currentIdx >= 1 && (
          <PdfActionButton
            label="Tagihan (Invoice)"
            icon={Download}
            isLoading={loadingType === "invoice"}
            onAction={(action) => download("invoice", action)}
            className="h-10 text-xs font-semibold flex items-center justify-center gap-2 border-primary/20 text-primary hover:bg-primary/5"
          />
        )}
        {currentIdx >= 4 && (
          <PdfActionButton
            label="Kwitansi"
            icon={Receipt}
            isLoading={loadingType === "receipt"}
            onAction={(action) => download("receipt", action)}
            className="h-10 text-xs font-semibold flex items-center justify-center gap-2 border-emerald-500/30 text-emerald-700 hover:bg-emerald-50"
          />
        )}
        {currentIdx >= 2 && (
          <PdfActionButton
            label="Surat PO"
            icon={ShoppingCart}
            isLoading={loadingType === "po"}
            onAction={(action) => download("po", action)}
            className="h-10 text-xs font-semibold flex items-center justify-center gap-2 border-indigo-500/30 text-indigo-700 hover:bg-indigo-50"
          />
        )}
      </div>
    </div>
  );
}
