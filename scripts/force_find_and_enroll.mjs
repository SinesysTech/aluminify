import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://wtqgfmtucqmpheghcvxo.supabase.co";
const SUPABASE_KEY = "sb_secret_AoIsjynbBWgLf9gEo9hKaw_5rO0Kz9u";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const EMPRESA_ID = "c64a0fcc-5990-4b87-9de5-c4dbc6cb8da7";
const CURSO_ID = "9d26f2d0-9bfb-4e99-aaab-bf88bb347504";
const TARGET_EMAIL = "patiab30@gmail.com";

async function main() {
  console.log(`Searching for ${TARGET_EMAIL}...`);

  let page = 1;
  let foundUser = null;
  const perPage = 1000;

  while (true) {
    console.log(`Checking page ${page}...`);
    const {
      data: { users },
      error,
    } = await supabase.auth.admin.listUsers({
      page: page,
      perPage: perPage,
    });

    if (error) {
      console.error("List Error:", error);
      break;
    }

    if (!users || users.length === 0) break;

    const match = users.find(
      (u) => u.email.toLowerCase() === TARGET_EMAIL.toLowerCase(),
    );
    if (match) {
      foundUser = match;
      break;
    }

    if (users.length < perPage) break; // End of list
    page++;
  }

  if (foundUser) {
    console.log(`Found user ID: ${foundUser.id}`);
    // Upsert public
    const { error: upsertError } = await supabase.from("usuarios").upsert(
      {
        id: foundUser.id,
        empresa_id: EMPRESA_ID,
        nome_completo: "Patricia (Restored)", // We don't have name easily here unless we look at Excel again, but 'Patricia' is fine for now or we can assume it's set
        email: foundUser.email,
        origem_cadastro: "manual_debug_pager",
        ativo: true,
      },
      { onConflict: "id" },
    );

    if (upsertError) console.error("Upsert Fail", upsertError);
    else console.log("Upsert Success");

    // Enroll
    const { error: enrollError } = await supabase.from("matriculas").insert({
      empresa_id: EMPRESA_ID,
      usuario_id: foundUser.id,
      curso_id: CURSO_ID,
      data_matricula: new Date(),
      data_inicio_acesso: new Date(),
      data_fim_acesso: "2026-12-31",
      ativo: true,
    });
    if (enrollError) console.error("Enroll Fail", enrollError);
    else console.log("Enroll Success");
  } else {
    console.error("User NOT found even after paging!");
  }
}

main();
