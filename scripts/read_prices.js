const XLSX = require("xlsx");
const path = require("path");

const filePath = path.join(__dirname, "../data_client/REPORT APRIL 2026.xlsx");
const wb = XLSX.readFile(filePath);

// Kolom: 0=No, 1=DATE, 2=PLANT, 3=SALES, 4=CUSTOMER, 5=PROYEK,
//         6=VOL, 7=MUTU, 8=DEAL, 9=PPN(deal), 10=HARGA+PPN, 11=TOTAL_DEAL,
//         12=AJM, 13=PPN(ajm), 14=HARGA+PPN, 15=TOTAL_AJM,
//         16=BUY_IN, 17=PPN(buyin), 18=HARGA+PPN, 19=TOTAL_BUYIN,
//         20=FEE, 21=MARGIN/m3, 22=TOTAL_MARGIN

const priceMap = {}; // { mutu: { deals:[], ajms:[], buyIns:[], margins:[] } }

for (const sheetName of wb.SheetNames) {
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

  for (const row of rows.slice(2)) { // skip header rows
    const mutu = String(row[7] || "").trim();
    const vol  = Number(row[6] || 0);
    const deal = Number(row[8] || 0);
    const ajm  = Number(row[12] || 0);
    const buyin = Number(row[16] || 0);
    const margin = Number(row[21] || 0);

    if (!mutu || mutu === "MUTU" || vol <= 0 || deal <= 0) continue;

    if (!priceMap[mutu]) {
      priceMap[mutu] = { deals: [], ajms: [], buyIns: [], margins: [], count: 0 };
    }
    priceMap[mutu].deals.push(deal);
    priceMap[mutu].ajms.push(ajm);
    priceMap[mutu].buyIns.push(buyin);
    priceMap[mutu].margins.push(margin);
    priceMap[mutu].count += vol;
  }
}

function avg(arr) {
  const valid = arr.filter(v => v > 0);
  return valid.length ? Math.round(valid.reduce((a, b) => a + b, 0) / valid.length) : 0;
}
function minVal(arr) {
  const valid = arr.filter(v => v > 0);
  return valid.length ? Math.min(...valid) : 0;
}
function maxVal(arr) {
  const valid = arr.filter(v => v > 0);
  return valid.length ? Math.max(...valid) : 0;
}

console.log("\n=== ANALISIS HARGA AKTUAL DARI EXCEL APRIL 2026 ===\n");
console.log("MUTU\t\t| N\t| VOL m³\t| DEAL avg\t| AJM avg\t| BUY IN avg\t| MARGIN avg\t| Min Deal\t| Max Deal");
console.log("".padEnd(130, "-"));

const sorted = Object.entries(priceMap).sort((a, b) => avg(a[1].buyIns) - avg(b[1].buyIns));
for (const [mutu, d] of sorted) {
  const n = d.deals.length;
  const dealAvg = avg(d.deals);
  const ajmAvg  = avg(d.ajms);
  const buyAvg  = avg(d.buyIns);
  const margAvg = avg(d.margins);
  const minD    = minVal(d.deals);
  const maxD    = maxVal(d.deals);
  console.log(
    `${mutu.padEnd(15)}| ${String(n).padEnd(7)}| ${String(Math.round(d.count)).padEnd(10)}` +
    `| ${dealAvg.toLocaleString("id-ID").padEnd(14)}` +
    `| ${ajmAvg.toLocaleString("id-ID").padEnd(14)}` +
    `| ${buyAvg.toLocaleString("id-ID").padEnd(14)}` +
    `| ${margAvg.toLocaleString("id-ID").padEnd(14)}` +
    `| ${minD.toLocaleString("id-ID").padEnd(14)}` +
    `| ${maxD.toLocaleString("id-ID")}`
  );
}
