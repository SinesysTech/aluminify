import ExcelJS from "exceljs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Hardcoded creds as before
const SUPABASE_URL = "https://wtqgfmtucqmpheghcvxo.supabase.co";
const SUPABASE_KEY = "sb_secret_AoIsjynbBWgLf9gEo9hKaw_5rO0Kz9u";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const filePath = path.join(
  __dirname,
  "../sales_history_ salinha presencial 2026.xls",
);
const EMPRESA_ID = "c64a0fcc-5990-4b87-9de5-c4dbc6cb8da7";
const CURSO_ID = "9d26f2d0-9bfb-4e99-aaab-bf88bb347504";

async function main() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.getWorksheet(1);

  const excelEmails = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const values = row.values;
    const emailObj = values[22];
    const email = emailObj && emailObj.text ? emailObj.text : emailObj;
    if (email) {
      excelEmails.push(email.toString().trim().toLowerCase());
    }
  });

  console.log(`Checking ${excelEmails.length} emails against DB...`);

  // Get all enrolled user IDs for this course/company
  const { data: enrollments, error } = await supabase
    .from("matriculas")
    .select("usuario_id, usuarios(email)")
    .eq("curso_id", CURSO_ID)
    .eq("empresa_id", EMPRESA_ID);

  if (error) {
    console.error("Error fetching enrollments:", error);
    return;
  }

  const enrolledEmails = new Set();
  enrollments.forEach((e) => {
    if (e.usuarios && e.usuarios.email) {
      enrolledEmails.add(e.usuarios.email.toLowerCase());
    }
  });

  const missing = excelEmails.filter((e) => !enrolledEmails.has(e));

  console.log(`Enrolled count in DB: ${enrolledEmails.size}`);
  console.log(`Missing count: ${missing.length}`);
  if (missing.length > 0) {
    console.log("Emails in Excel but NOT enrolled:", missing);
  } else {
    console.log(
      "All emails are enrolled. Discrepancy might be elsewhere (e.g. manual enrollments not in Excel?)",
    );
  }
}

main();
