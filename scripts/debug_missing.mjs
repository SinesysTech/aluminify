import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://wtqgfmtucqmpheghcvxo.supabase.co";
const SUPABASE_KEY = "sb_secret_AoIsjynbBWgLf9gEo9hKaw_5rO0Kz9u";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const EMPRESA_ID = "c64a0fcc-5990-4b87-9de5-c4dbc6cb8da7";
const CURSO_ID = "9d26f2d0-9bfb-4e99-aaab-bf88bb347504";

const missingStudents = [
  { name: "Bernardo Coelho", email: "bernardosrcoelho@hotmail.com" }, // Name approximated, just for debug
  { name: "Patricia", email: "patiab30@gmail.com" }, // Name approximated
];

async function main() {
  for (const student of missingStudents) {
    console.log(`DEBUG Processing ${student.email}...`);

    try {
      // 1. Check Auth User
      const { data: usersPage } = await supabase.auth.admin.listUsers({
        perPage: 1000,
      });
      let authUser = usersPage.users.find((u) => u.email === student.email);

      if (!authUser) {
        console.log("User not found in Auth. Creating...");
        const { data, error } = await supabase.auth.admin.createUser({
          email: student.email,
          email_confirm: true,
          password: "TempPassword123!",
          user_metadata: {
            full_name: student.name,
            empresa_id: EMPRESA_ID,
            role: "aluno",
          },
        });
        if (error) {
          console.error("Auth Create Error:", error);
          continue;
        }
        authUser = data.user;
      } else {
        console.log("User found in Auth:", authUser.id);
        // Check metadata
        console.log("Metadata:", authUser.user_metadata);
      }

      // 2. Upsert Public User
      console.log("Upserting public.usuarios...");
      const { error: upsertError } = await supabase.from("usuarios").upsert(
        {
          id: authUser.id,
          empresa_id: EMPRESA_ID,
          nome_completo: student.name, // Using dummy name if we didn't read from Excel, but we assume script failed earlier on auth or something
          email: student.email,
          origem_cadastro: "manual_debug",
          ativo: true,
        },
        { onConflict: "id" },
      );

      if (upsertError) {
        console.error("Public Upsert Error:", upsertError);
        // If error is FK, maybe ID doesn't exist? (Impossible if we just found/created it)
      } else {
        console.log("Public User Upserted.");
      }

      // 3. Encode Enrollment
      const { error: enrollError } = await supabase.from("matriculas").insert({
        empresa_id: EMPRESA_ID,
        usuario_id: authUser.id,
        curso_id: CURSO_ID,
        data_matricula: new Date(),
        data_inicio_acesso: new Date(),
        data_fim_acesso: "2026-12-31",
        ativo: true,
      });

      if (enrollError) {
        console.error("Enrollment Error:", enrollError);
      } else {
        console.log("Enrollment Success.");
      }
    } catch (e) {
      console.error("Unexpected Error:", e);
    }
    console.log("--------------------------------");
  }
}

main();
