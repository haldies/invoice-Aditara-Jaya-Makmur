const { PrismaClient } = require('@prisma/client');
const xlsx = require('xlsx');

const prisma = new PrismaClient();

async function main() {
  console.log('Reading Excel file...');
  const wb = xlsx.readFile('C:/Workspace/01_Company/Agency/Clients/data_client/REPORT APRIL 2026.xlsx');
  const ws = wb.Sheets['PLANT LAIN-LAIN'];
  const data = xlsx.utils.sheet_to_json(ws, { header: 1 });

  let idx = data.findIndex(r => r && r.includes('TOTAL MARGIN'));
  if (idx === -1) {
    console.error('Could not find header row');
    return;
  }

  const dIdx = data[idx].indexOf('DEAL');
  const ajmIdx = data[idx].indexOf('AJM');
  const buyInIdx = data[idx].indexOf('BUY IN');
  const feeIdx = data[idx].indexOf('FEE');
  const volIdx = data[idx].indexOf('VOL');
  const mutuIdx = data[idx].indexOf('MUTU');
  const customerIdx = data[idx].indexOf('CUSTOMER');

  let rows = [];
  for (let i = idx + 1; i < data.length; i++) {
    if (!data[i] || !data[i][volIdx]) continue;
    rows.push({
      customer: data[i][customerIdx] || 'Unknown Customer',
      mutu: data[i][mutuIdx] || 'Produk',
      vol: Number(data[i][volIdx]) || 0,
      deal: Number(data[i][dIdx]) || 0,
      ajm: Number(data[i][ajmIdx]) || 0,
      buyIn: Number(data[i][buyInIdx]) || 0,
    });
  }

  console.log(`Found ${rows.length} valid rows to import.`);

  // Get first user (to own the data)
  const user = await prisma.appUser.findFirst();
  if (!user) {
    console.error('No users found in database. Cannot seed.');
    return;
  }
  const userId = user.id;

  const createdInvoices = [];
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    
    // Find or create client
    let client = await prisma.client.findFirst({
      where: { name: row.customer, user_id: userId }
    });
    
    if (!client) {
      client = await prisma.client.create({
        data: {
          user_id: userId,
          name: row.customer,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      });
    }

    // Create Invoice
    const subtotal = row.vol * row.deal;
    const inv = await prisma.invoice.create({
      data: {
        user_id: userId,
        client_id: client.id,
        invoice_number: `DEMO-APR26-${String(i+1).padStart(3, '0')}`,
        status: 'selesai',
        issue_date: new Date().toISOString().split('T')[0],
        subtotal: subtotal,
        total: subtotal, 
        fee: 0, 
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        items: {
          create: [{
            description: row.mutu,
            quantity: row.vol,
            actual_quantity: row.vol,
            unit_price: row.deal,
            ajm_price: row.ajm,
            buy_in_price: row.buyIn,
            line_total: subtotal,
            sort_order: 0
          }]
        }
      }
    });
    
    createdInvoices.push(inv);
  }

  console.log(`Successfully created ${createdInvoices.length} invoices for demo!`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
