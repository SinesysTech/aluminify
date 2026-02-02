import ExcelJS from "exceljs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, "../sales_history_23-11 a 02-02-26.xls");

async function main() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.getWorksheet(1);

  const products = new Set();

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Skip header
    const values = row.values;
    const productName = values[1]; // Column 1 is "Nome do Produto"
    if (productName) {
      products.add(productName.toString().trim());
    }
  });

  console.log("Unique products in Excel:\n");
  Array.from(products)
    .sort()
    .forEach((p, idx) => {
      console.log(`${idx + 1}. ${p}`);
    });
  console.log(`\nTotal unique products: ${products.size}`);
}

main();
