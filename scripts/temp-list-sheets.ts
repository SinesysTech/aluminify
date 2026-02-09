import * as XLSX from "xlsx";

const workbook = XLSX.readFile("Alunos sem acesso à Aluminify.xlsx");

console.log("=".repeat(70));
console.log("Planilhas (abas) no arquivo:");
console.log("=".repeat(70));

for (const sheetName of workbook.SheetNames) {
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];
  const rowCount = data.length - 1; // minus header

  console.log(`\n📋 "${sheetName}" - ${rowCount} aluno(s)`);

  // Show header
  if (data[0]) {
    console.log(`   Colunas: ${JSON.stringify(data[0])}`);
  }

  // Show first row of data
  if (data[1]) {
    console.log(`   Exemplo: ${JSON.stringify(data[1])}`);
  }
}

console.log("\n" + "=".repeat(70));
