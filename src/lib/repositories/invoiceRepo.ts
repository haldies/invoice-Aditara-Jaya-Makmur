import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import {
  AppRole,
  Client,
  Invoice,
  InvoiceFilters,
  InvoiceInput,
  InvoiceStatus,
  PaginatedResult,
} from "../../types/invoice";

const invoiceInclude = {
  client: true,
  items: { orderBy: { sort_order: "asc" as const } },
  user: { select: { email: true, name: true, phone: true } },
};

type InvoiceRow = Prisma.InvoiceGetPayload<{ include: typeof invoiceInclude }>;
type ClientRow = Prisma.ClientGetPayload<Record<string, never>>;

export interface Actor {
  id: string;
  role: AppRole;
}

export type UpdateInvoiceInput = Partial<InvoiceInput> & { version?: number };

function canManageAll(role: AppRole) {
  return role === "owner" || role === "manager" || role === "admin";
}

function ownershipWhere(actor: Actor): Prisma.InvoiceWhereInput {
  return canManageAll(actor.role) ? {} : { user_id: actor.id };
}

function clientOwnershipWhere(actor: Actor): Prisma.ClientWhereInput {
  return canManageAll(actor.role) ? {} : { user_id: actor.id };
}

function rowToClient(row: ClientRow): Client {
  return {
    ...row,
    email: row.email ?? null,
    phone: row.phone ?? null,
    company: row.company ?? null,
    address: row.address ?? null,
    province: row.province ?? null,
    city: row.city ?? null,
    district: row.district ?? null,
    postal_code: row.postal_code ?? null,
    notes: row.notes ?? null,
  };
}

function rowToInvoice(row: InvoiceRow): Invoice {
  return {
    ...row,
    status: row.status as InvoiceStatus,
    due_date: row.due_date ?? null,
    paid_date: row.paid_date ?? null,
    notes: row.notes ?? null,
    terms: row.terms ?? null,
    template_id: row.template_id ?? null,
    user: row.user,
    client: rowToClient(row.client),
    items: row.items.map((item) => ({
      ...item,
      actual_quantity: item.actual_quantity ?? null,
      ajm_price: item.ajm_price ?? undefined,
      supplier: (item as any).supplier ?? null,
    })),
  };
}

function normalizeMoney(value: number | null | undefined) {
  return Math.max(0, Number.isFinite(Number(value)) ? Number(value) : 0);
}

function calculateTotals(input: Pick<InvoiceInput, "items"> & {
  discount?: number | null;
  tax?: number | null;
  shipping_fee?: number | null;
  fee?: number | null;
}) {
  const items = input.items.map((item, index) => {
    const quantity = normalizeMoney(item.quantity);
    const unitPrice = normalizeMoney(item.unit_price);
    const buyInPrice = normalizeMoney(item.buy_in_price);
    const actualQty = item.actual_quantity != null
      ? Math.max(0, Number(item.actual_quantity))
      : null;
    const billedQty = actualQty != null ? actualQty : quantity;
    return {
      description: item.description.trim(),
      quantity,
      actual_quantity: actualQty,
      unit_price: unitPrice,
      ajm_price: item.ajm_price,
      buy_in_price: buyInPrice,
      ...(item.supplier ? { supplier: item.supplier } : {}),
      line_total: billedQty * unitPrice,
      sort_order: item.sort_order ?? index,
    };
  });
  const subtotal = items.reduce((sum, item) => sum + item.line_total, 0);
  const discount = normalizeMoney(input.discount);
  const tax = normalizeMoney(input.tax);
  const fee = normalizeMoney(input.fee);
  const shipping_fee = normalizeMoney(input.shipping_fee);
  return {
    items,
    subtotal,
    discount,
    tax,
    shipping_fee,
    fee,
    // total = tagihan ke customer (ditambah ongkir, tidak termasuk fee internal)
    total: Math.max(0, subtotal - discount + tax + shipping_fee),
  };
}

async function resolveClient(actor: Actor, data: InvoiceInput) {
  const now = new Date().toISOString();
  if (data.client_id) {
    const client = await prisma.client.findFirst({
      where: {
        id: data.client_id,
        ...clientOwnershipWhere(actor),
      },
    });
    if (!client) throw new Error("Client not found");
    return client.id;
  }
  if (!data.client?.name?.trim()) {
    throw new Error("Client name is required");
  }
  const client = await prisma.client.create({
    data: {
      user_id: actor.id,
      name: data.client.name.trim(),
      email: data.client.email || null,
      phone: data.client.phone || null,
      company: data.client.company || null,
      address: data.client.address || null,
      province: data.client.province || null,
      city: data.client.city || null,
      district: data.client.district || null,
      postal_code: data.client.postal_code || null,
      notes: data.client.notes || null,
      created_at: now,
      updated_at: now,
    },
  });
  return client.id;
}

export async function listInvoices(
  actor: Actor,
  filters: InvoiceFilters = {}
): Promise<PaginatedResult<Invoice>> {
  const where: Prisma.InvoiceWhereInput = ownershipWhere(actor);
  
  if (filters.status && filters.status !== "all") {
    where.status = filters.status;
  }
  
  if (filters.start_date || filters.end_date) {
    where.issue_date = {};
    if (filters.start_date) {
      where.issue_date.gte = filters.start_date;
    }
    if (filters.end_date) {
      where.issue_date.lte = filters.end_date;
    }
  }

  if (filters.payment_status && filters.payment_status !== "all") {
    // Determine payment status using a raw query
    if (filters.payment_status === "lunas") {
      const idsResult = await prisma.$queryRaw<{id: string}[]>`SELECT id::text FROM invoices WHERE total > 0 AND (total - amount_paid) <= 0`;
      where.id = { in: idsResult.map(r => r.id) };
    } else if (filters.payment_status === "belum_lunas") {
      const idsResult = await prisma.$queryRaw<{id: string}[]>`SELECT id::text FROM invoices WHERE (total - amount_paid) > 0`;
      where.id = { in: idsResult.map(r => r.id) };
    }
  }

  if (filters.client_id) {
    where.client_id = filters.client_id;
  }
  if (filters.sales && filters.sales !== "all") {
    where.user = { email: filters.sales };
  }
  if (filters.product && filters.product !== "all") {
    where.items = {
      ...(where.items || {}),
      some: {
        ...((where.items as any)?.some || {}),
        description: { contains: filters.product, mode: "insensitive" },
      },
    };
  }
  if (filters.supplier && filters.supplier !== "all") {
    // Find preset item names or descriptions matching the supplier from InvoicePresetItem table
    const presetItemsWithSupplier = await prisma.invoicePresetItem.findMany({
      where: { supplier: { equals: filters.supplier, mode: "insensitive" } },
      select: { name: true },
    });
    const presetNames = presetItemsWithSupplier.map((p) => p.name);

    if (presetNames.length > 0) {
      where.items = {
        ...(where.items || {}),
        some: {
          ...((where.items as any)?.some || {}),
          OR: presetNames.map((name) => ({
            description: { contains: name, mode: "insensitive" },
          })),
        },
      };
    } else {
      // Fallback matching logic
      const term = filters.supplier.toLowerCase().includes("koko") ? "Beton" : "Wiremesh";
      where.items = {
        ...(where.items || {}),
        some: {
          ...((where.items as any)?.some || {}),
          description: { contains: term, mode: "insensitive" },
        },
      };
    }
  }
  if (filters.city && filters.city !== "all") {
    where.OR = [
      ...(where.OR || []),
      { client: { address: { contains: filters.city, mode: "insensitive" } } },
      { notes: { contains: filters.city, mode: "insensitive" } }
    ];
  }
  
  if (filters.search) {
    where.OR = [
      ...(where.OR || []),
      { invoice_number: { contains: filters.search, mode: "insensitive" } },
      { client: { name: { contains: filters.search, mode: "insensitive" } } },
      { client: { company: { contains: filters.search, mode: "insensitive" } } },
    ];
  }

  // Sorting
  const orderBy: any[] = [];
  if (filters.sort === "total_high") {
    orderBy.push({ total: "desc" });
  } else if (filters.sort === "total_low") {
    orderBy.push({ total: "asc" });
  } else if (filters.sort === "oldest") {
    orderBy.push({ issue_date: "asc" });
  } else {
    // Default or "newest"
    orderBy.push({ issue_date: "desc" });
    orderBy.push({ created_at: "desc" }); // fallback secondary sort
  }

  // Pagination
  const page = Math.max(1, filters.page || 1);
  const limit = Math.max(1, filters.limit || 50);
  const skip = (page - 1) * limit;

  const [total, rows] = await Promise.all([
    prisma.invoice.count({ where }),
    prisma.invoice.findMany({
      where,
      include: invoiceInclude,
      orderBy,
      skip,
      take: limit,
    })
  ]);

  return {
    data: rows.map(rowToInvoice),
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function listClients(actor: Actor): Promise<Client[]> {
  const rows = await prisma.client.findMany({
    where: clientOwnershipWhere(actor),
    orderBy: { name: "asc" },
  });
  return rows.map(rowToClient);
}

export async function findInvoiceById(
  actor: Actor,
  id: string
): Promise<Invoice | null> {
  const row = await prisma.invoice.findFirst({
    where: { id, ...ownershipWhere(actor) },
    include: invoiceInclude,
  });
  return row ? rowToInvoice(row) : null;
}

export async function createInvoice(
  actor: Actor,
  data: InvoiceInput
): Promise<Invoice> {
  if (!data.items.length) throw new Error("At least one invoice item is required");
  const now = new Date().toISOString();
  const clientId = await resolveClient(actor, data);
  const totals = calculateTotals(data);
  const row = await prisma.invoice.create({
    data: {
      user_id: actor.id,
      client_id: clientId,
      invoice_number: data.invoice_number.trim(),
      status: data.status ?? "draft",
      currency: data.currency || "IDR",
      issue_date: data.issue_date,
      due_date: data.due_date || null,
      paid_date: data.paid_date || null,
      discount: totals.discount,
      tax: totals.tax,
      shipping_fee: totals.shipping_fee,
      fee: totals.fee,
      subtotal: totals.subtotal,
      total: totals.total,
      amount_paid: normalizeMoney(data.amount_paid),
      notes: data.notes || null,
      terms: data.terms || null,
      template_id: data.template_id || null,
      created_at: now,
      updated_at: now,
      items: { create: totals.items },
    },
    include: invoiceInclude,
  });
  return rowToInvoice(row);
}

export async function updateInvoice(
  actor: Actor,
  id: string,
  updates: UpdateInvoiceInput
): Promise<Invoice | null> {
  const existing = await findInvoiceById(actor, id);
  if (!existing) return null;

  const clientId =
    updates.client_id !== undefined || updates.client !== undefined
      ? await resolveClient(actor, {
          ...existing,
          items: existing.items,
          ...updates,
        } as InvoiceInput)
      : undefined;

  const nextItems = updates.items ?? existing.items;
  const totals = calculateTotals({
    items: nextItems,
    discount: updates.discount ?? existing.discount,
    tax: updates.tax ?? existing.tax,
    fee: updates.fee ?? existing.fee,
  });

  const where: Prisma.InvoiceWhereInput = { id, ...ownershipWhere(actor) };
  if (updates.version !== undefined) where.version = updates.version;

  const result = await prisma.invoice.updateMany({
    where,
    data: {
      ...(clientId ? { client_id: clientId } : {}),
      ...(updates.invoice_number !== undefined
        ? { invoice_number: updates.invoice_number.trim() }
        : {}),
      ...(updates.status !== undefined ? { status: updates.status } : {}),
      ...(updates.currency !== undefined ? { currency: updates.currency } : {}),
      ...(updates.issue_date !== undefined ? { issue_date: updates.issue_date } : {}),
      ...(updates.due_date !== undefined ? { due_date: updates.due_date } : {}),
      ...(updates.paid_date !== undefined ? { paid_date: updates.paid_date } : {}),
      ...(updates.notes !== undefined ? { notes: updates.notes } : {}),
      ...(updates.terms !== undefined ? { terms: updates.terms } : {}),
      ...(updates.template_id !== undefined
        ? { template_id: updates.template_id }
        : {}),
      discount: totals ? totals.discount : undefined,
      tax: totals ? totals.tax : undefined,
      shipping_fee: totals ? totals.shipping_fee : undefined,
      fee: totals ? totals.fee : undefined,
      subtotal: totals ? totals.subtotal : undefined,
      total: totals.total,
      updated_at: new Date().toISOString(),
      version: { increment: 1 },
    },
  });

  if (result.count === 0) {
    const stillExists = await prisma.invoice.findFirst({
      where: { id, ...ownershipWhere(actor) },
    });
    if (stillExists) return { error: "conflict" } as unknown as Invoice;
    return null;
  }

  if (updates.items) {
    await prisma.$transaction([
      prisma.invoiceItem.deleteMany({ where: { invoice_id: id } }),
      prisma.invoiceItem.createMany({
        data: totals.items.map((item) => ({ ...item, invoice_id: id })),
      }),
    ]);
  }

  return findInvoiceById(actor, id);
}

export async function deleteInvoice(actor: Actor, id: string): Promise<boolean> {
  const result = await prisma.invoice.deleteMany({
    where: { id, ...ownershipWhere(actor) },
  });
  return result.count > 0;
}

export interface InvoiceDashboardStats {
  total: number;
  byStatus: Record<string, number>;
  totalOutstanding: number;
  totalPaid: number;
  overdueCount: number;
}

export async function getDashboardStats(
  actor: Actor
): Promise<InvoiceDashboardStats> {
  const invoices = await prisma.invoice.findMany({
    where: ownershipWhere(actor),
    select: { status: true, total: true },
  });
  const byStatus: Record<string, number> = {};
  let totalOutstanding = 0;
  let totalPaid = 0;
  for (const invoice of invoices) {
    byStatus[invoice.status] = (byStatus[invoice.status] || 0) + 1;
    if (invoice.status === "paid") totalPaid += invoice.total;
    if (invoice.status !== "paid" && invoice.status !== "void") {
      totalOutstanding += invoice.total;
    }
  }
  return {
    total: invoices.length,
    byStatus,
    totalOutstanding,
    totalPaid,
    overdueCount: byStatus.overdue || 0,
  };
}
