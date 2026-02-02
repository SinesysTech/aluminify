import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://wtqgfmtucqmpheghcvxo.supabase.co";
const SUPABASE_KEY = "sb_secret_AoIsjynbBWgLf9gEo9hKaw_5rO0Kz9u";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const EMPRESA_ID = "c64a0fcc-5990-4b87-9de5-c4dbc6cb8da7";
const CURSO_ID = "9d26f2d0-9bfb-4e99-aaab-bf88bb347504";

async function main() {
  console.log("Verifying final import results...\n");

  // Count total enrollments for this course
  const { count: enrollCount, error: enrollErr } = await supabase
    .from("matriculas")
    .select("*", { count: "exact", head: true })
    .eq("curso_id", CURSO_ID)
    .eq("empresa_id", EMPRESA_ID);

  if (enrollErr) {
    console.error("Error counting enrollments:", enrollErr);
  } else {
    console.log(`✓ Total enrollments in course: ${enrollCount}`);
  }

  // Count users from import
  const { count: userCount, error: userErr } = await supabase
    .from("usuarios")
    .select("*", { count: "exact", head: true })
    .in("origem_cadastro", [
      "excel_import_2026",
      "manual_debug",
      "manual_debug_pager",
    ])
    .eq("empresa_id", EMPRESA_ID);

  if (userErr) {
    console.error("Error counting users:", userErr);
  } else {
    console.log(`✓ Total users from import: ${userCount}`);
  }

  console.log("\nExpected: 28 rows from Excel");
  console.log(
    "Status: " + (enrollCount === 28 ? "✓ COMPLETE" : "⚠ INCOMPLETE"),
  );
}

main();
