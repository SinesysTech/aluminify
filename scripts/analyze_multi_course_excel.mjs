import ExcelJS from "exceljs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, "../sales_history_23-11 a 02-02-26.xls");

async function main() {
  console.log("Analyzing Excel structure...\n");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  console.log(`Number of worksheets: ${workbook.worksheets.length}`);

  workbook.worksheets.forEach((sheet, idx) => {
    console.log(`\nWorksheet ${idx + 1}: "${sheet.name}"`);
    console.log(`Rows: ${sheet.rowCount}`);
  });

  const worksheet = workbook.getWorksheet(1);
  console.log("\n=== First worksheet analysis ===");
  console.log("First 3 rows (raw values):\n");

  for (let i = 1; i <= Math.min(3, worksheet.rowCount); i++) {
    const row = worksheet.getRow(i);
    const values = row.values;
    console.log(`Row ${i}:`, values);
  }

  // Check for product/course column
  console.log("\n=== Checking data rows ===");
  let rowsChecked = 0;
  const products = new Set();
  const statuses = new Set();

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Skip header
    if (rowsChecked >= 10) return; // Check first 10 data rows

    const values = row.values;
    // Based on previous pattern, let's check various columns
    // Column 6 might be product name
    // Column 19 might be status

    if (values[6]) products.add(values[6]);
    if (values[19]) statuses.add(values[19]);

    rowsChecked++;
  });

  console.log("\nUnique products found (first 10 rows):", Array.from(products));
  console.log("Unique statuses found (first 10 rows):", Array.from(statuses));

  // Count total data rows
  let totalRows = 0;
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) totalRows++;
  });
  console.log(`\nTotal data rows: ${totalRows}`);
}

main();
