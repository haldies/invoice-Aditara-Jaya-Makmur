const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function parseArgs(argv) {
  const args = new Set(argv.slice(2));
  const shouldCleanAll = args.has("--clean-all");
  const resetInvoiceIdIndex = argv.indexOf("--invoice-id");
  const invoiceId = resetInvoiceIdIndex >= 0 ? argv[resetInvoiceIdIndex + 1] : null;
  const limitIndex = argv.indexOf("--limit");
  const limit = limitIndex >= 0 ? Number(argv[limitIndex + 1]) : 20;
  return { shouldCleanAll, invoiceId, limit: Number.isFinite(limit) ? limit : 20 };
}

function normalizePaymentHistory(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map((entry, index) => ({
    id: entry?.id || `legacy-${index}-${entry?.paid_at || entry?.created_at || "unknown"}`,
    amount: Number(entry?.amount || 0),
    paid_at: entry?.paid_at || entry?.created_at || null,
    created_at: entry?.created_at || entry?.paid_at || null,
    updated_at: entry?.updated_at ?? null,
    deleted_at: entry?.deleted_at ?? null,
    deleted_reason: entry?.deleted_reason ?? null,
    edited_from_amount: entry?.edited_from_amount ?? null,
  }));
}

async function inspect(limit) {
  const rows = await prisma.invoice.findMany({
    where: {
      payment_history: {
        not: null,
      },
    },
    select: {
      id: true,
      invoice_number: true,
      amount_paid: true,
      total: true,
      payment_history: true,
    },
    orderBy: { updated_at: "desc" },
    take: limit,
  });

  const report = rows.map((row) => {
    const history = normalizePaymentHistory(row.payment_history);
    const active = history.filter((entry) => !entry.deleted_at);
    const activeTotal = active.reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
    return {
      id: row.id,
      invoice_number: row.invoice_number,
      total: row.total,
      amount_paid: row.amount_paid,
      history_count: history.length,
      active_count: active.length,
      active_total: activeTotal,
      raw_history: history,
    };
  });

  console.log(JSON.stringify(report, null, 2));
}

async function cleanOne(invoiceId) {
  const row = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: { id: true, invoice_number: true, payment_history: true, amount_paid: true, total: true },
  });

  if (!row) {
    console.log(`Invoice not found: ${invoiceId}`);
    return;
  }

  const history = normalizePaymentHistory(row.payment_history);
  const active = history.filter((entry) => !entry.deleted_at);
  const activeTotal = active.reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
  const cleanedHistory = active.map((entry) => ({
    ...entry,
    amount: Number(entry.amount || 0),
  }));

  console.log("BEFORE", JSON.stringify({
    id: row.id,
    invoice_number: row.invoice_number,
    amount_paid: row.amount_paid,
    total: row.total,
    history,
  }, null, 2));

  const updated = await prisma.invoice.update({
    where: { id: row.id },
    data: {
      payment_history: cleanedHistory,
      amount_paid: activeTotal,
      updated_at: new Date().toISOString(),
      version: { increment: 1 },
    },
    select: {
      id: true,
      invoice_number: true,
      amount_paid: true,
      total: true,
      payment_history: true,
    },
  });

  console.log("AFTER", JSON.stringify(updated, null, 2));
}

async function cleanAll() {
  const rows = await prisma.invoice.findMany({
    where: {
      payment_history: {
        not: null,
      },
    },
    select: { id: true, invoice_number: true, payment_history: true },
  });

  for (const row of rows) {
    const history = normalizePaymentHistory(row.payment_history);
    const active = history.filter((entry) => !entry.deleted_at);
    const cleanedHistory = active.map((entry) => ({
      ...entry,
      amount: Number(entry.amount || 0),
    }));

    await prisma.invoice.update({
      where: { id: row.id },
      data: {
        payment_history: cleanedHistory,
        amount_paid: active.reduce((sum, entry) => sum + Number(entry.amount || 0), 0),
        updated_at: new Date().toISOString(),
        version: { increment: 1 },
      },
    });
    console.log(`Cleaned ${row.invoice_number} (${row.id})`);
  }
}

async function main() {
  const { shouldCleanAll, invoiceId, limit } = parseArgs(process.argv);

  if (shouldCleanAll) {
    await cleanAll();
    return;
  }

  if (invoiceId) {
    await cleanOne(invoiceId);
    return;
  }

  await inspect(limit);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
