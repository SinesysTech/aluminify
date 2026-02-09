import * as XLSX from "xlsx";

const workbook = XLSX.readFile("Alunos sem acesso à Aluminify.xlsx");
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as string[][];

console.log("Planilha:", sheetName);
console.log("Total de linhas:", data.length);
console.log("");
console.log("Header:", JSON.stringify(data[0]));
console.log("");
console.log("Primeiras 10 linhas de dados:");
data.slice(1, 11).forEach((row, i) => {
  console.log(`${i + 1}: ${JSON.stringify(row)}`);
});
console.log("");
console.log("Últimas 3 linhas:");
data.slice(-3).forEach((row, i) => {
  console.log(`${data.length - 3 + i}: ${JSON.stringify(row)}`);
});
