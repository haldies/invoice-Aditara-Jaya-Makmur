export type AppRole = "owner" | "admin" | "manager" | "user";

export interface AppUser {
  id: string;
  email: string | null;
  role: AppRole;
  commission_rate: number;
  created_at: string;
}

export type InvoiceStatus =
  | "penawaran"
  | "tagihan"
  | "po"
  | "pengiriman"
  | "selesai"
  | "batal";

export interface InvoiceTemplate {
  id: string;
  user_id: string;
  name: string;
  html_content: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export type InvoiceTemplateInput = Pick<InvoiceTemplate, "name" | "html_content" | "is_default">;

export interface Client {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;           // Volume deal / pesanan awal
  actual_quantity: number | null; // Volume aktual terkirim (diisi admin, bisa beda dari quantity)
  unit_price: number;
  ajm_price?: number;         // Harga net perusahaan (AJM) untuk hitung komisi/fee (diisi admin)
  buy_in_price: number;       // HPP / harga beli ke supplier (diisi admin)
  commission_rate: number;    // Komisi per m3 khusus untuk invoice ini
  line_total: number;
  sort_order: number;
}

export interface Invoice {
  id: string;
  user_id: string;
  client_id: string;
  invoice_number: string;
  status: InvoiceStatus;
  currency: string;
  issue_date: string;
  due_date: string | null;
  paid_date: string | null;
  subtotal: number;
  discount: number;
  tax: number;
  fee: number;   // Fee/biaya tambahan (dikurangi dari margin, bukan dari total customer)
  total: number;
  notes: string | null;
  terms: string | null;
  template_id: string | null;
  created_at: string;
  updated_at: string;
  version: number;
  client: Client;
  items: InvoiceItem[];
  user?: {
    email: string | null;
  };
}

export type InvoiceItemInput = Pick<
  InvoiceItem,
  "description" | "quantity" | "unit_price" | "buy_in_price" | "ajm_price" | "commission_rate"
> & {
  id?: string;
  sort_order?: number;
  actual_quantity?: number | null;
};

export interface InvoiceInput {
  client_id?: string | null;
  client?: {
    name: string;
    email?: string | null;
    phone?: string | null;
    company?: string | null;
    address?: string | null;
    notes?: string | null;
  };
  invoice_number: string;
  status?: InvoiceStatus;
  currency?: string;
  issue_date: string;
  due_date?: string | null;
  paid_date?: string | null;
  discount?: number;
  tax?: number;
  fee?: number;   // Fee/biaya tambahan, dikurangi dari margin
  notes?: string | null;
  terms?: string | null;
  template_id?: string | null;
  items: InvoiceItemInput[];
}

export interface InvoiceFilters {
  status?: InvoiceStatus;
  search?: string;
  client_id?: string;
}

export const INVOICE_STATUS_CONFIG: Record<
  InvoiceStatus,
  { label: string; color: string; bgColor: string }
> = {
  penawaran: { label: "Penawaran", color: "text-slate-700", bgColor: "bg-slate-100" },
  tagihan: { label: "Tagihan", color: "text-amber-700", bgColor: "bg-amber-100" },
  po: { label: "Purchase Order", color: "text-indigo-700", bgColor: "bg-indigo-100" },
  pengiriman: { label: "Pengiriman", color: "text-blue-700", bgColor: "bg-blue-100" },
  selesai: { label: "Selesai", color: "text-emerald-700", bgColor: "bg-emerald-100" },
  batal: { label: "Batal", color: "text-red-700", bgColor: "bg-red-100" },
};

export const INVOICE_STATUSES = Object.keys(
  INVOICE_STATUS_CONFIG
) as InvoiceStatus[];

export interface InvoicePresetItem {
  id: string;
  user_id: string;
  name: string;
  description: string;
  unit_price: number;    // Harga jual ke customer (deal price)
  buy_in_price: number;  // HPP / harga beli ke supplier (diisi admin)
  tax_rate: number;
  created_at: string;
  updated_at: string;
}

export type InvoicePresetItemInput = Pick<
  InvoicePresetItem,
  "name" | "description" | "unit_price" | "buy_in_price" | "tax_rate"
>;

