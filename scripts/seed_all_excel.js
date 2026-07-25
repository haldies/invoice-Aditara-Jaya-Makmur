const { PrismaClient } = require('@prisma/client');
const xlsx = require('xlsx');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

async function main() {
  console.log('Reading Excel file...');
  const wb = xlsx.readFile('C:/Workspace/01_Company/Agency/Clients/data_client/REPORT APRIL 2026.xlsx');
  
  // 1. First pass: Collect all unique sales names
  const salesNames = new Set();
  const allRows = [];
  
  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(ws, { header: 1 });
    
    let idx = data.findIndex(r => r && r.includes('TOTAL MARGIN'));
    if (idx === -1) continue;
    
    const sIdx = data[idx].indexOf('SALES');
    const cIdx = data[idx].indexOf('CUSTOMER');
    const mIdx = data[idx].indexOf('MUTU');
    const vIdx = data[idx].indexOf('VOL');
    const dIdx = data[idx].indexOf('DEAL');
    const aIdx = data[idx].indexOf('AJM');
    const bIdx = data[idx].indexOf('BUY IN');
    const fIdx = data[idx].indexOf('FEE');
    
    for (let i = idx + 1; i < data.length; i++) {
      if (!data[i] || !data[i][vIdx]) continue; // skip empty or no vol
      
      let salesName = (data[i][sIdx] || '').toString().trim();
      if (!salesName || salesName.toLowerCase() === 'sales') salesName = 'UNKNOWN SALES';
      
      salesNames.add(salesName);
      
      allRows.push({
        plant: sheetName,
        sales: salesName,
        customer: (data[i][cIdx] || 'Unknown Customer').toString().trim(),
        mutu: (data[i][mIdx] || 'Produk').toString().trim(),
        vol: Number(data[i][vIdx]) || 0,
        deal: Number(data[i][dIdx]) || 0,
        ajm: Number(data[i][aIdx]) || 0,
        buyIn: Number(data[i][bIdx]) || 0,
        fee: Number(data[i][fIdx]) || 0,
      });
    }
  }

  console.log(`Found ${allRows.length} valid rows across ${wb.SheetNames.length} sheets.`);
  console.log(`Unique Sales Reps: ${Array.from(salesNames).join(', ')}`);

  // 2. Create Sales Accounts
  const salesMap = {}; // name -> AppUser
  for (const name of salesNames) {
    const email = `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}@demo.com`;
    let user = await prisma.appUser.findUnique({ where: { email } });
    if (!user) {
      const { salt, hash } = await hashPassword('password123');
      user = await prisma.appUser.create({
        data: {
          id: uuidv4(),
          email,
          password_hash: hash,
          password_salt: salt,
          role: 'sales',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      });
      console.log(`Created sales account: ${email} (password: password123)`);
    }
    salesMap[name] = user;
  }

  // Also get the admin user for fallback or global clients? Let's just assign clients to the respective sales.
  
  console.log('Clearing old DEMO invoices...');
  await prisma.invoice.deleteMany({
    where: { invoice_number: { startsWith: 'DEMO-' } }
  });

  // 3. Insert Data
  const createdInvoices = [];
  const clientMap = {}; // customer_name + user_id -> client.id
  
  for (let i = 0; i < allRows.length; i++) {
    const row = allRows[i];
    const user = salesMap[row.sales];
    const clientKey = `${row.customer}_${user.id}`;
    
    // Find or create client
    if (!clientMap[clientKey]) {
      let client = await prisma.client.findFirst({
        where: { name: row.customer, user_id: user.id }
      });
      if (!client) {
        client = await prisma.client.create({
          data: {
            user_id: user.id,
            name: row.customer,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        });
      }
      clientMap[clientKey] = client.id;
    }

    const clientId = clientMap[clientKey];

    // Create Invoice
    const subtotal = row.vol * row.deal;
    const inv = await prisma.invoice.create({
      data: {
        user_id: user.id,
        client_id: clientId,
        invoice_number: `DEMO-${row.plant.substring(0,3).toUpperCase()}-${String(i+1).padStart(4, '0')}`,
        status: 'selesai',
        issue_date: new Date().toISOString().split('T')[0],
        subtotal: subtotal,
        total: subtotal, 
        fee: 0, // Using global fee 0, we rely on eksternal fee
        notes: `Plant: ${row.plant}`,
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
    if (i > 0 && i % 20 === 0) console.log(`Inserted ${i} invoices...`);
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
