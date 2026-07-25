import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Save, ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTemplates } from "@/hooks/useTemplates";
import { InvoiceTemplate, InvoiceTemplateInput } from "@/types/invoice";

// A very basic dummy invoice to render preview
const dummyInvoice = {
  invoice_number: "INV-2026-001",
  issue_date: "2026-06-20",
  due_date: "2026-07-20",
  client: {
    name: "PT. Maju Mundur",
    email: "contact@majumundur.com",
    address: "Jl. Sudirman No.1, Jakarta",
  },
  items: [
    { description: "Jasa Pembuatan Website", quantity: 1, unit_price: 5000000, line_total: 5000000 },
    { description: "Hosting & Domain (1 Tahun)", quantity: 1, unit_price: 1500000, line_total: 1500000 },
  ],
  subtotal: 6500000,
  tax: 715000,
  total: 7215000,
  currency: "IDR",
  notes: "Pembayaran dapat ditransfer ke rekening BCA 123456789 a.n LokerHub",
};

const defaultTemplateHtml = `
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', sans-serif; color: #111827; background: #fff; font-size: 13px; line-height: 1.6; }

  .header-bar {
    background: #0f1e3c;
    padding: 28px 40px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  .company-name { font-size: 18px; font-weight: 700; color: #fff; }
  .company-detail { font-size: 11px; color: rgba(255,255,255,0.6); margin-top: 3px; }
  .invoice-title { font-size: 34px; font-weight: 700; color: #fff; letter-spacing: 2px; }
  .invoice-meta { text-align: right; }
  .invoice-number { font-size: 12px; color: rgba(255,255,255,0.7); margin-top: 6px; }
  .date-label { font-size: 10px; color: rgba(255,255,255,0.5); margin-top: 5px; }
  .date-value { font-size: 12px; font-weight: 600; color: #fff; }

  .gold-rule { height: 3px; background: #c9993a; }

  .body { padding: 28px 40px 40px; }

  .info-row { display: flex; gap: 20px; margin-bottom: 28px; }
  .info-card {
    flex: 1;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    padding: 16px;
  }
  .info-card-accent {
    flex: 1;
    border: 1px solid #e5e7eb;
    border-left: 4px solid #0f1e3c;
    border-radius: 6px;
    padding: 16px;
  }
  .info-label {
    font-size: 9px;
    font-weight: 700;
    color: #6b7280;
    letter-spacing: 1px;
    text-transform: uppercase;
    margin-bottom: 8px;
  }
  .info-primary { font-size: 14px; font-weight: 700; color: #111827; }
  .info-secondary { font-size: 12px; color: #6b7280; margin-top: 3px; }
  .info-bank { font-size: 15px; font-weight: 700; color: #0f1e3c; margin-top: 4px; letter-spacing: 0.5px; }

  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  thead tr {
    background: #e8ecf4;
    border-top: 2px solid #0f1e3c;
    border-bottom: 1px solid #e5e7eb;
  }
  thead th {
    padding: 9px 12px;
    text-align: left;
    font-size: 10px;
    font-weight: 700;
    color: #0f1e3c;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }
  thead th.text-right { text-align: right; }
  tbody tr { border-bottom: 1px solid #e5e7eb; }
  tbody tr:nth-child(even) { background: #f9fafb; }
  tbody td { padding: 9px 12px; font-size: 12px; color: #111827; }
  tbody td.text-right { text-align: right; }
  tbody td.text-center { text-align: center; }

  .summary { display: flex; justify-content: flex-end; margin-bottom: 28px; }
  .summary-box { width: 260px; }
  .summary-row {
    display: flex;
    justify-content: space-between;
    padding: 7px 0;
    border-bottom: 1px solid #e5e7eb;
    font-size: 12px;
    color: #6b7280;
  }
  .summary-row span:last-child { color: #111827; }
  .total-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #0f1e3c;
    padding: 11px 14px;
    border-radius: 4px;
    margin-top: 6px;
  }
  .total-label { font-size: 13px; font-weight: 700; color: #fff; letter-spacing: 1px; }
  .total-value { font-size: 15px; font-weight: 700; color: #fff; }

  .notes-label {
    font-size: 9px;
    font-weight: 700;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 6px;
    margin-top: 14px;
  }
  .notes-box {
    background: #f3f4f6;
    border: 1px solid #e5e7eb;
    border-radius: 4px;
    padding: 12px 14px;
    font-size: 12px;
    color: #6b7280;
    line-height: 1.6;
  }

  .footer {
    background: #0f1e3c;
    padding: 16px 40px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 40px;
  }
  .footer-text { font-size: 11px; color: rgba(255,255,255,0.55); }
  .signature-box { text-align: center; }
  .signature-line { width: 100px; border-bottom: 1px solid rgba(255,255,255,0.4); margin: 0 auto 6px; }
  .signature-label { font-size: 10px; color: rgba(255,255,255,0.65); margin-top: 2px; }
</style>

<div class="header-bar">
  <div>
    <div class="company-name">{{company.name}}</div>
    <div class="company-detail">{{company.address}}</div>
    <div class="company-detail">{{company.phone}}</div>
  </div>
  <div class="invoice-meta">
    <div class="invoice-title">INVOICE</div>
    <div class="invoice-number">{{invoice_number}}</div>
    <div class="date-label">Tanggal Terbit</div>
    <div class="date-value">{{issue_date}}</div>
    <div class="date-label">Jatuh Tempo</div>
    <div class="date-value">{{due_date}}</div>
  </div>
</div>
<div class="gold-rule"></div>

<div class="body">
  <div class="info-row">
    <div class="info-card-accent">
      <div class="info-label">Tagihan Kepada</div>
      <div class="info-primary">{{client.name}}</div>
      <div class="info-secondary">{{client.address}}</div>
      <div class="info-secondary">{{client.phone}}</div>
      <div class="info-secondary">{{client.email}}</div>
    </div>
    <div class="info-card">
      <div class="info-label">Info Pembayaran</div>
      <div class="info-secondary">{{company.bank_name}}</div>
      <div class="info-bank">{{company.bank_account}}</div>
      <div class="info-secondary">a.n {{company.bank_holder}}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:28px">No</th>
        <th>Deskripsi</th>
        <th class="text-right" style="width:80px">Qty</th>
        <th class="text-right" style="width:110px">Harga Satuan</th>
        <th class="text-right" style="width:110px">Jumlah</th>
      </tr>
    </thead>
    <tbody>
      {{#items}}
      <tr>
        <td>{{no}}</td>
        <td>{{description}}</td>
        <td class="text-right">{{quantity}}</td>
        <td class="text-right">Rp {{unit_price}}</td>
        <td class="text-right">Rp {{line_total}}</td>
      </tr>
      {{/items}}
    </tbody>
  </table>

  <div class="summary">
    <div class="summary-box">
      <div class="summary-row"><span>Subtotal</span><span>Rp {{subtotal}}</span></div>
      <div class="summary-row"><span>Pajak</span><span>Rp {{tax}}</span></div>
      <div class="total-bar">
        <span class="total-label">TOTAL</span>
        <span class="total-value">Rp {{total}}</span>
      </div>
    </div>
  </div>

  {{#notes}}
  <div class="notes-label">Catatan</div>
  <div class="notes-box">{{notes}}</div>
  {{/notes}}

  {{#terms}}
  <div class="notes-label">Syarat Pembayaran</div>
  <div class="notes-box">{{terms}}</div>
  {{/terms}}
</div>

<div class="footer">
  <div class="footer-text">Terima kasih atas kepercayaan Anda.</div>
  <div class="signature-box">
    <div class="signature-line"></div>
    <div class="signature-label">{{company.name}}</div>
  </div>
</div>
`;

function renderPreview(html: string) {
  let rendered = html;
  
  // Very naive mustache-like templating replacement for preview
  rendered = rendered.replace(/\{\{invoice_number\}\}/g, dummyInvoice.invoice_number);
  rendered = rendered.replace(/\{\{issue_date\}\}/g, dummyInvoice.issue_date);
  rendered = rendered.replace(/\{\{client\.name\}\}/g, dummyInvoice.client.name);
  rendered = rendered.replace(/\{\{client\.address\}\}/g, dummyInvoice.client.address);
  rendered = rendered.replace(/\{\{subtotal\}\}/g, dummyInvoice.subtotal.toLocaleString("id-ID"));
  rendered = rendered.replace(/\{\{tax\}\}/g, dummyInvoice.tax.toLocaleString("id-ID"));
  rendered = rendered.replace(/\{\{total\}\}/g, dummyInvoice.total.toLocaleString("id-ID"));
  rendered = rendered.replace(/\{\{notes\}\}/g, dummyInvoice.notes);

  // Naive array replacement for {{#items}} ... {{/items}}
  const itemsRegex = /\{\{#items\}\}([\s\S]*?)\{\{\/items\}\}/g;
  rendered = rendered.replace(itemsRegex, (match, innerHtml) => {
    return dummyInvoice.items.map(item => {
      let row = innerHtml;
      row = row.replace(/\{\{description\}\}/g, item.description);
      row = row.replace(/\{\{quantity\}\}/g, item.quantity.toString());
      row = row.replace(/\{\{unit_price\}\}/g, item.unit_price.toLocaleString("id-ID"));
      row = row.replace(/\{\{line_total\}\}/g, item.line_total.toLocaleString("id-ID"));
      return row;
    }).join("");
  });

  return rendered;
}

export function TemplateEditor({ template }: { template?: InvoiceTemplate }) {
  const router = useRouter();
  const { addTemplate, updateTemplate } = useTemplates();
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState(template?.name || "Template Baru");
  const [htmlContent, setHtmlContent] = useState(template?.html_content || defaultTemplateHtml);
  const [previewHtml, setPreviewHtml] = useState("");

  useEffect(() => {
    // Generate preview with dummy data
    try {
      setPreviewHtml(renderPreview(htmlContent));
    } catch (e) {
      setPreviewHtml("<p style='color:red;'>Error merender HTML.</p>");
    }
  }, [htmlContent]);

  const handleSave = async () => {
    if (!name.trim() || !htmlContent.trim()) {
      alert("Nama dan konten HTML harus diisi");
      return;
    }
    setIsSaving(true);
    try {
      if (template) {
        await updateTemplate(template.id, { name, html_content: htmlContent });
      } else {
        await addTemplate({ name, html_content: htmlContent, is_default: false });
      }
      router.push("/tracker/templates");
    } catch (error) {
      console.error(error);
      alert("Gagal menyimpan template");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-screen md:h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b bg-card shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">{template ? "Edit Template" : "Buat Template"}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Menyimpan..." : "Simpan"}
          </Button>
        </div>
      </header>

      {/* Main Content: Split View */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        
        {/* Left: Editor */}
        <div className="flex-1 flex flex-col border-r md:max-w-[50%] bg-muted/10">
          <div className="p-4 border-b">
            <Label htmlFor="template-name">Nama Template</Label>
            <Input 
              id="template-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="flex-1 flex flex-col p-4 overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <Label>Kode HTML & CSS</Label>
              <div className="text-xs text-muted-foreground space-x-2">
                Gunakan tag: <code className="bg-muted px-1 rounded">{"{{invoice_number}}"}</code>, <code className="bg-muted px-1 rounded">{"{{client.name}}"}</code>, dll.
              </div>
            </div>
            <Textarea 
              value={htmlContent}
              onChange={(e) => setHtmlContent(e.target.value)}
              className="flex-1 font-mono text-sm resize-none focus-visible:ring-1"
              placeholder="Masukkan kode HTML disini..."
            />
          </div>
        </div>

        {/* Right: Preview */}
        <div className="flex-1 flex flex-col bg-slate-50 relative overflow-hidden">
          <div className="absolute top-4 left-4 z-10 bg-white/80 backdrop-blur text-xs px-2 py-1 rounded shadow-sm border font-medium text-slate-500">
            Live Preview
          </div>
          <div className="flex-1 p-8 overflow-auto">
            {/* Paper sheet */}
            <div 
              className="bg-white shadow-lg mx-auto p-8 rounded-sm min-h-[842px] max-w-[595px] w-full"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
