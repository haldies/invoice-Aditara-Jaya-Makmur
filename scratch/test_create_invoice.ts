import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import * as invoiceRepo from "../src/lib/repositories/invoiceRepo";

const prisma = new PrismaClient();

async function main() {
  console.log("Fetching first user...");
  const user = await prisma.appUser.findFirst({});
  if (!user) {
    console.log("No user found in database!");
    return;
  }
  console.log(`Using user: ${user.email} (id: ${user.id})`);

  // Define actor
  const actor = { id: user.id, role: user.role as any };

  // Attempt to create invoice using repo
  try {
    console.log("Creating dummy invoice payload...");
    const invoicePayload = {
      invoice_number: `INV-${Date.now()}`,
      status: "penawaran" as any,
      currency: "IDR",
      issue_date: "2026-06-28",
      due_date: "2026-07-28",
      paid_date: null,
      discount: 0,
      tax: 0,
      notes: "Test Project Location",
      terms: "BCA...",
      template_id: null,
      client_id: null, // manual client
      client: {
        name: "Test Client Co",
        email: "test@client.com",
        company: "Test Client Co",
        phone: "08123456",
        address: "Test Address",
      },
      items: [
        {
          description: "Test Beton Cor K-225",
          quantity: 120,
          actual_quantity: null,
          unit_price: 835000,
          buy_in_price: 760000,
          commission_rate: 5000,
          sort_order: 0,
        },
      ],
    };

    console.log("Calling createInvoice...");
    const result = await invoiceRepo.createInvoice(actor, invoicePayload);
    console.log("Success! Created invoice with ID:", result.id);
  } catch (error: any) {
    console.error("Error creating invoice via repository:");
    console.error(error);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
