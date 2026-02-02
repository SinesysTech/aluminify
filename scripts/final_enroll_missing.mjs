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
  console.log(`Querying auth.users for ${TARGET_EMAIL}...`);

  // Use rpc or raw SQL via the client
  // Since we have service role key, we can query auth schema
  const { data, error } = await supabase.rpc("exec_sql", {
    query: `SELECT id, email FROM auth.users WHERE LOWER(email) = '${TARGET_EMAIL.toLowerCase()}'`,
  });

  if (error) {
    console.error(
      "RPC not available, trying direct Postgres client approach...",
    );
    // Alternative: use the Supabase connection string and pg library
    // But we don't have that set up. Let's try a different approach.

    // Since the admin API said "email_exists", we know the user is there.
    // Let's check public.usuarios to see if the user profile exists
    const { data: publicUser, error: pubErr } = await supabase
      .from("usuarios")
      .select("id, email")
      .eq("email", TARGET_EMAIL)
      .maybeSingle();

    if (pubErr) {
      console.error("Error checking public usuarios:", pubErr);
      return;
    }

    if (publicUser) {
      console.log("Found user in public.usuarios:", publicUser.id);
      // Now try to enroll
      const { error: enrollError } = await supabase.from("matriculas").insert({
        empresa_id: EMPRESA_ID,
        usuario_id: publicUser.id,
        curso_id: CURSO_ID,
        data_matricula: new Date(),
        data_inicio_acesso: new Date(),
        data_fim_acesso: "2026-12-31",
        ativo: true,
      });

      if (enrollError) {
        console.error("Enrollment failed:", enrollError);
      } else {
        console.log("✓ Successfully enrolled user!");
      }
    } else {
      console.log(
        "User not found in public.usuarios either. This means the import script never created the profile.",
      );
      console.log(
        "The issue is that listUsers pagination failed, so the script couldn't find the auth user to get the ID.",
      );
      console.log(
        "Manual intervention needed or we need to check import logs more carefully.",
      );
    }
    return;
  }

  console.log("Query result:", data);
}

main();
