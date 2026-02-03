/**
 * Inspeciona estrutura de um Excel (abas, cabeçalhos, primeiras linhas).
 * Uso: npx tsx scripts/usuario/inspect-excel.ts "caminho/arquivo.xlsx"
 */
import * as fs from "fs";
import ExcelJS from "exceljs";

async function main() {
  const filePath = process.argv[2];
  if (!filePath || !fs.existsSync(filePath)) {
    console.error("Uso: npx tsx scripts/usuario/inspect-excel.ts <caminho.xlsx>");
    process.exit(1);
  }
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  console.log("Abas:", workbook.worksheets.map((s) => s.name));
  const sheet = workbook.worksheets[0];
  if (!sheet) {
    console.log("Nenhuma planilha.");
    return;
  }
  console.log("Linhas (rowCount):", sheet.rowCount);
  console.log("Colunas (columnCount):", sheet.columnCount);
  for (let r = 1; r <= Math.min(5, sheet.rowCount ?? 5); r++) {
    const row = sheet.getRow(r);
    const cells: string[] = [];
    row.eachCell({ includeEmpty: true }, (c, colNumber) => {
      const v = c.value;
      const str =
        v == null
          ? ""
          : typeof v === "string"
            ? v
            : typeof v === "number" || typeof v === "boolean"
              ? String(v)
              : v instanceof Date
                ? v.toISOString()
                : String(v);
      cells[colNumber - 1] = str.trim().slice(0, 50);
    });
    console.log(`Linha ${r}:`, JSON.stringify(cells));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
