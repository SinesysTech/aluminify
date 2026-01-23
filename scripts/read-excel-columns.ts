/**
 * Script para ler as colunas do arquivo Excel da Hotmart
 */
import * as XLSX from "xlsx";
import * as path from "path";

const filePath = path.join(__dirname, "..", "sales_history_ 23-11 a 20-01 (1).xls");

const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Converter para JSON
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

// Mostrar cabeçalhos (primeira linha)
console.log("=== COLUNAS DO EXCEL ===");
const headers = data[0] as string[];
headers.forEach((col, idx) => {
  console.log(`${idx}: ${col}`);
});

// Mostrar uma amostra de dados (primeira linha de dados)
console.log("\n=== PRIMEIRA LINHA DE DADOS ===");
const firstRow = data[1] as unknown[];
headers.forEach((col, idx) => {
  console.log(`${col}: ${firstRow[idx]}`);
});

console.log(`\n=== TOTAL DE LINHAS: ${data.length - 1} ===`);
