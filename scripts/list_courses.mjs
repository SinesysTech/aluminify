import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://wtqgfmtucqmpheghcvxo.supabase.co";
const SUPABASE_KEY = "sb_secret_AoIsjynbBWgLf9gEo9hKaw_5rO0Kz9u";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const EMPRESA_ID = "c64a0fcc-5990-4b87-9de5-c4dbc6cb8da7";

async function main() {
  const { data: courses, error } = await supabase
    .from("cursos")
    .select("id, nome")
    .eq("empresa_id", EMPRESA_ID)
    .order("nome");

  if (error) {
    console.error("Error fetching courses:", error);
    return;
  }

  console.log("Courses in jana-rabelo tenant:\n");
  courses.forEach((c, idx) => {
    console.log(`${idx + 1}. ${c.nome} - ID: ${c.id}`);
  });
  console.log(`\nTotal courses: ${courses.length}`);
}

main();
