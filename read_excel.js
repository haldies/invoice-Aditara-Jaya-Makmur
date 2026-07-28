const xlsx = require('xlsx');

const workbook = xlsx.readFile('data_client/REPORT APRIL 2026.xlsx');
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
console.log(JSON.stringify(data.slice(0, 10), null, 2));
