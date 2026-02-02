import ExcelJS from "exceljs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(
  __dirname,
  "../sales_history_ salinha presencial 2026.xls",
);

async function main() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.getWorksheet(1);

  let totalRows = 0;
  let approvedCount = 0;
  const statusCounts = {};

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    totalRows++;
    const values = row.values;
    // Status is at index 19 based on previous scripts
    const status = values[19];

    if (status === "Aprovado") {
      approvedCount++;
    }

    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });

  console.log("Total data rows:", totalRows);
  console.log("Approved count:", approvedCount);
  console.log("Status distribution:", statusCounts);
}

main();
