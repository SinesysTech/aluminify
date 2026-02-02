import ExcelJS from "exceljs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = "https://wtqgfmtucqmpheghcvxo.supabase.co";
const SUPABASE_KEY = "sb_secret_AoIsjynbBWgLf9gEo9hKaw_5rO0Kz9u";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const filePath = path.join(__dirname, "../sales_history_23-11 a 02-02-26.xls");
const EMPRESA_ID = "c64a0fcc-5990-4b87-9de5-c4dbc6cb8da7";

// Product name to Course ID mapping
const PRODUCT_TO_COURSE = {
  "Quero 02 atendimentos mensais - Plantões":
    "45705647-96d0-4685-ae55-e871958b0d32",
  "Quero 04 atendimentos mensais - Plantões":
    "aeefb318-d120-44c5-9407-2afc4b585f45",
  "Quero mais correções": "cf44d7c7-57be-41dd-b7cd-f689467a310b",
  "Redação 360º VIP + Linguagens": "b7c510fd-e067-45a1-9f5b-6e44584736ac",
  "Redação 360º VIP [extensivo 2026]": "de3308e1-7f4e-4c27-989f-e820f846ced3",
  "Redação 360º [extensivo 2026]": "7f045f35-37df-424c-b9cb-86df02f11151",
  "Salinha ao vivo + Linguagens": "2c8a5974-6e3b-4eac-b680-618bd1a84dae",
  "Salinha de redação | Ao vivo [Extensivo 2026]":
    "ec64a5d5-ca2f-4d8a-845f-1bf0f693b0a0",
};

async function main() {
  console.log("Reading Excel file...");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.getWorksheet(1);

  const students = [];
  const stats = {
    total: 0,
    successful: 0,
    failed: 0,
    byProduct: {},
  };

  // Parse Excel
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Skip header

    const values = row.values;
    const productName = values[1]?.toString().trim();
    const name = values[7];
    const document = values[8];
    const emailObj = values[9];
    const email = emailObj && emailObj.text ? emailObj.text : emailObj;
    const ddd = values[10];
    const phone = values[11];
    const fullPhone = ddd && phone ? `${ddd}${phone}` : phone;

    if (!productName || !PRODUCT_TO_COURSE[productName]) {
      console.warn(`Row ${rowNumber}: Unknown product "${productName}"`);
      return;
    }

    students.push({
      rowNumber,
      productName,
      courseId: PRODUCT_TO_COURSE[productName],
      nome_completo: name,
      email: email ? email.toString().trim().toLowerCase() : "",
      cpf: document ? document.toString().replace(/\D/g, "") : "",
      telefone: fullPhone ? fullPhone.toString().replace(/\D/g, "") : "",
      cep: values[12] ? values[12].toString() : "",
      cidade: values[13],
      estado: values[14],
      bairro: values[15],
      pais: values[16],
      endereco: values[17],
      numero_endereco: values[18] ? values[18].toString() : "",
      complemento: values[19] ? values[19].toString() : "",
    });
  });

  console.log(`Parsed ${students.length} students from Excel.\n`);

  // Process each student
  for (const student of students) {
    stats.total++;

    if (!student.email) {
      console.log(`Row ${student.rowNumber}: Skipping - no email`);
      stats.failed++;
      continue;
    }

    console.log(
      `[${stats.total}/${students.length}] Processing ${student.email} for ${student.productName}...`,
    );

    let userId = null;

    try {
      // Create or find auth user
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
          // Try to find in public.usuarios
          const { data: publicUser } = await supabase
            .from("usuarios")
            .select("id")
            .eq("email", student.email)
            .maybeSingle();

          if (publicUser) {
            userId = publicUser.id;
            console.log(`  User exists: ${userId}`);
          } else {
            console.error(
              `  Could not find existing user for ${student.email}`,
            );
            stats.failed++;
            continue;
          }
        } else {
          console.error(`  Auth error:`, createError.message);
          stats.failed++;
          continue;
        }
      } else {
        userId = newUser.user.id;
        console.log(`  Created new user: ${userId}`);
      }

      // Upsert public.usuarios
      const { error: upsertError } = await supabase.from("usuarios").upsert(
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
          origem_cadastro: "excel_import_multi_2026",
          ativo: true,
        },
        { onConflict: "id" },
      );

      if (upsertError) {
        console.error(`  Upsert error:`, upsertError.message);
        stats.failed++;
        continue;
      }

      // Check existing enrollment
      const { data: existingEnrollment } = await supabase
        .from("matriculas")
        .select("id")
        .eq("usuario_id", userId)
        .eq("curso_id", student.courseId)
        .eq("empresa_id", EMPRESA_ID)
        .maybeSingle();

      if (!existingEnrollment) {
        const { error: enrollError } = await supabase
          .from("matriculas")
          .insert({
            empresa_id: EMPRESA_ID,
            usuario_id: userId,
            curso_id: student.courseId,
            data_matricula: new Date(),
            data_inicio_acesso: new Date(),
            data_fim_acesso: "2026-12-31",
            ativo: true,
          });

        if (enrollError) {
          console.error(`  Enrollment error:`, enrollError.message);
          stats.failed++;
          continue;
        }
        console.log(`  ✓ Enrolled`);
      } else {
        console.log(`  Already enrolled`);
      }

      stats.successful++;
      stats.byProduct[student.productName] =
        (stats.byProduct[student.productName] || 0) + 1;
    } catch (err) {
      console.error(`  Unexpected error:`, err.message);
      stats.failed++;
    }
  }

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("IMPORT SUMMARY");
  console.log("=".repeat(60));
  console.log(`Total rows: ${stats.total}`);
  console.log(`Successful: ${stats.successful}`);
  console.log(`Failed: ${stats.failed}`);
  console.log("\nBy Product:");
  Object.entries(stats.byProduct).forEach(([product, count]) => {
    console.log(`  - ${product}: ${count}`);
  });
  console.log("=".repeat(60));
}

main();
