const xlsx = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

async function importData() {
  console.log("Reading Excel...");
  const workbook = xlsx.readFile('data_client/REPORT APRIL 2026.xlsx');
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  
  // Skip the first 2 rows (header)
  const rows = data.slice(2).filter(row => row[3] && row[4] && row[7]);
  
  console.log(`Found ${rows.length} rows to import.`);
  
  console.log("Clearing existing invoices and clients...");
  await prisma.invoiceItem.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.client.deleteMany({});
  
  // Map sales names to User IDs
  const users = await prisma.appUser.findMany();
  const getUserId = (salesName) => {
    const s = salesName.toLowerCase();
    const match = users.find(u => 
      (u.name && u.name.toLowerCase().includes(s)) ||
      (u.email && u.email.toLowerCase().includes(s))
    );
    if (match) return match.id;
    // fallback to first user
    return users[0]?.id;
  };

  const padNum = (num) => num.toString().padStart(4, '0');
  
  console.log("Importing...");
  let invCount = 1;

  for (const row of rows) {
    // 3: Sales Name, 4: Customer, 5: Proyek, 6: Vol, 7: Mutu, 10: Deal Price, 14: AJM Price, 16: Buy In Price
    const salesName = row[3];
    const customerName = row[4];
    const notes = row[5] || "";
    const qty = Number(row[6] || 0);
    const description = row[7] || "Produk";
    const dealPrice = Number(row[10] || 0); // HARGA + PPN
    const ajmPrice = Number(row[14] || 0);  // HARGA + PPN
    const buyInPrice = Number(row[16] || 0); // DPP

    const userId = getUserId(salesName);

    // Create client
    const client = await prisma.client.create({
      data: {
        user_id: userId,
        name: customerName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    });

    // Create Invoice (Status: Selesai so it appears in the final dashboard)
    const subtotal = qty * dealPrice;
    
    const invoice = await prisma.invoice.create({
      data: {
        user_id: userId,
        client_id: client.id,
        invoice_number: `INV-2604-${padNum(invCount++)}`,
        status: 'selesai',
        issue_date: new Date('2026-04-15').toISOString(),
        subtotal: subtotal,
        total: subtotal, // PPN is included in total
        tax: 0,
        notes: notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    });

    // Create Item
    await prisma.invoiceItem.create({
      data: {
        invoice_id: invoice.id,
        description: description,
        quantity: qty,
        actual_quantity: qty,
        unit_price: dealPrice,
        ajm_price: ajmPrice,
        buy_in_price: buyInPrice,
        line_total: subtotal,
        sort_order: 0,
      }
    });
  }

  console.log("Import complete!");
  await prisma.$disconnect();
}

importData().catch(console.error);
