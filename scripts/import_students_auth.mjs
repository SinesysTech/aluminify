import ExcelJS from "exceljs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = "https://wtqgfmtucqmpheghcvxo.supabase.co";
const SUPABASE_KEY = "sb_secret_AoIsjynbBWgLf9gEo9hKaw_5rO0Kz9u";

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing Supabase URL or Key");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const filePath = path.join(
  __dirname,
  "../sales_history_ salinha presencial 2026.xls",
);
const EMPRESA_ID = "c64a0fcc-5990-4b87-9de5-c4dbc6cb8da7";
const CURSO_ID = "9d26f2d0-9bfb-4e99-aaab-bf88bb347504";

async function main() {
  console.log("Reading Excel...");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.getWorksheet(1);
  const students = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const values = row.values;
    // const status = values[19];
    // if (status !== 'Aprovado') return; // REMOVED FILTER

    const name = values[20];
    const document = values[21];
    const emailObj = values[22];
    const email = emailObj && emailObj.text ? emailObj.text : emailObj;
    const ddd = values[23];
    const phone = values[24];
    const fullPhone = ddd && phone ? `${ddd}${phone}` : phone;

    students.push({
      nome_completo: name,
      email: email ? email.toString().trim().toLowerCase() : "",
      cpf: document ? document.toString().replace(/\D/g, "") : "",
      telefone: fullPhone ? fullPhone.toString().replace(/\D/g, "") : "",
      endereco: values[30],
      numero_endereco: values[31] ? values[31].toString() : "",
      complemento: values[32] ? values[32].toString() : "",
      bairro: values[28],
      cidade: values[26],
      estado: values[27],
      cep: values[25] ? values[25].toString() : "",
      pais: values[29],
    });
  });

  console.log(`Found ${students.length} students (all statuses).`);

  for (const student of students) {
    if (!student.email) continue;
    console.log(`Processing ${student.email}...`);

    let userId = null;

    try {
      const { data: newUser, error: createError } =
        await supabase.auth.admin.createUser({
          email: student.email,
          email_confirm: true,
          password: "TempPassword123!",
          user_metadata: {
            full_name: student.nome_completo,
            empresa_id: EMPRESA_ID,
            role: "aluno",
          },
        });

      if (createError) {
        if (
          createError.message?.includes("already registered") ||
          createError.status === 400 ||
          createError.status === 422
        ) {
          const { data: usersPage } = await supabase.auth.admin.listUsers({
            perPage: 1000,
          });
          const found = usersPage.users.find((u) => u.email === student.email);
          if (found) {
            userId = found.id;
            console.log(`User exists: ${userId}`);
          } else {
            console.error(
              "Could not find existing user ID even though create failed:",
              createError,
            );
            continue;
          }
        } else {
          console.error("Failed to create user:", createError);
          continue;
        }
      } else {
        userId = newUser.user.id;
        console.log(`Created new user: ${userId}`);
      }
    } catch (err) {
      console.error("Auth op failed:", err);
      continue;
    }

    if (!userId) continue;

    const { error: upsertUserError } = await supabase.from("usuarios").upsert(
      {
        id: userId,
        empresa_id: EMPRESA_ID,
        nome_completo: student.nome_completo,
        email: student.email,
        cpf: student.cpf,
        telefone: student.telefone,
        endereco: student.endereco,
        numero_endereco: student.numero_endereco,
        complemento: student.complemento,
        bairro: student.bairro,
        cidade: student.cidade,
        estado: student.estado,
        cep: student.cep,
        pais: student.pais,
        origem_cadastro: "excel_import_2026",
        ativo: true,
      },
      { onConflict: "id" },
    );

    if (upsertUserError) {
      console.error("Failed to upsert usuario:", upsertUserError);
    } else {
      console.log("Upserted usuario.");
    }

    const { data: existingEnrollment } = await supabase
      .from("matriculas")
      .select("id")
      .eq("usuario_id", userId)
      .eq("curso_id", CURSO_ID)
      .eq("empresa_id", EMPRESA_ID)
      .maybeSingle();

    if (!existingEnrollment) {
      const { error: enrollError } = await supabase.from("matriculas").insert({
        empresa_id: EMPRESA_ID,
        usuario_id: userId,
        curso_id: CURSO_ID,
        data_matricula: new Date(),
        data_inicio_acesso: new Date(),
        data_fim_acesso: "2026-12-31",
        ativo: true,
      });
      if (enrollError) console.error("Enrollment failed:", enrollError);
      else console.log("Enrolled user.");
    } else {
      console.log("User already enrolled.");
    }
  }
}

main();
