/**
 * Matricula no curso Terra Negra 2026 os e-mails que estavam faltando
 * (não cadastrados ou cadastrados mas não matriculados) e define senha TN@2026!
 *
 * Uso:
 *   npx tsx scripts/usuario/enroll-terra-negra-2026-missing.ts
 *   npx tsx scripts/usuario/enroll-terra-negra-2026-missing.ts "c:\path\to\alunos.xlsx"
 *
 * Requer: .env.local com NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (ou SUPABASE_SECRET_KEY)
 */

import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import ExcelJS from "exceljs";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config();

const PASSWORD = "TN@2026!";

const EMAILS_TO_ENROLL = [
  "juliaaborges1301@gmail.com",
  "franciscorodrigues12090704@gmail.com",
  "bosejagabriel@gmail.com",
  "mariafernandafm16@gmail.com",
  "alccardoso75@gmail.com",
  "belladinizmendesr@gmail.com",
  "pauladeoliveiraleite@gmail.com",
  "mdudazaramela@gmail.com",
  "santos.raissa.f@hotmail.com",
  "kathlyn9cheng@gmail.com",
  "mdudno@gmail.com",
  "bcoimbranaves@gmail.com",
  "ingrydsmendizabal@gmail.com",
  "cgocotta@gmail.com",
].map((e) => e.trim().toLowerCase());

type RowData = { email: string; nome: string; cpf: string; telefone: string };

const COLUNAS_EMAIL = ["email", "e-mail", "E-mail", "Email", "E-mail *", "Email *"];
const COLUNAS_NOME = ["nome completo", "nome", "Nome", "Nome Completo", "Nome Completo *"];
const COLUNAS_CPF = ["cpf", "CPF", "CPF *"];
const COLUNAS_TELEFONE = ["telefone", "Telefone", "Telefone *"];

function normalize(s: string) {
  return (s ?? "").trim().toLowerCase().replace(/\s*\*\s*$/, "").replace(/\s+/g, " ");
}

function findCol(row: Record<string, string>, possible: string[]): string {
  for (const h of Object.keys(row)) {
    const n = normalize(h);
    for (const p of possible) {
      if (normalize(p) === n) return String(row[h] ?? "").trim();
    }
  }
  return "";
}

async function readExcelRows(
  filePath: string,
  filterEmails: Set<string>,
): Promise<Map<string, RowData>> {
  if (!fs.existsSync(filePath)) throw new Error(`Arquivo não encontrado: ${filePath}`);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const sheet = workbook.worksheets[0];
  if (!sheet) throw new Error("Nenhuma planilha no arquivo.");

  const headerRow = sheet.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell({ includeEmpty: false }, (c) =>
    headers.push(String(c.value ?? "").trim()),
  );

  function cellToString(val: unknown): string {
    if (val == null) return "";
    if (typeof val === "string") return val.trim();
    if (typeof val === "number" || typeof val === "boolean") return String(val);
    if (val instanceof Date) return val.toISOString().split("T")[0] ?? "";
    return "";
  }

  const map = new Map<string, RowData>();
  for (let rowNum = 2; rowNum <= (sheet.rowCount ?? 1); rowNum++) {
    const row = sheet.getRow(rowNum);
    const rowData: Record<string, string> = {};
    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const header = headers[colNumber - 1];
      if (header) rowData[header] = cellToString(cell.value);
    });
    const emailRaw =
      findCol(rowData, COLUNAS_EMAIL) ||
      rowData["E-mail *"] ||
      rowData["Email"] ||
      "";
    const email = emailRaw.includes("@") ? emailRaw.toLowerCase() : "";
    if (!email || !filterEmails.has(email)) continue;
    const nome = findCol(rowData, COLUNAS_NOME) || rowData["Nome Completo *"] || "";
    const cpf = findCol(rowData, COLUNAS_CPF) || rowData["CPF *"] || "";
    const telefone = findCol(rowData, COLUNAS_TELEFONE) || rowData["Telefone *"] || "";
    map.set(email, { email, nome, cpf, telefone });
  }
  return map;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizePhone(phone: string) {
  return (phone ?? "").replace(/\D/g, "");
}

function normalizeCpf(cpf: string) {
  let cleaned = (cpf ?? "").replace(/\D/g, "");
  if (cleaned.length >= 8 && cleaned.length <= 10) cleaned = cleaned.padStart(11, "0");
  return cleaned;
}

/** Obtém userId apenas pela tabela usuarios (evita listUsers do Auth). */
async function getUserIdFromUsuariosOnly(
  client: SupabaseClient,
  email: string,
): Promise<string | null> {
  const normalized = normalizeEmail(email);
  const { data, error } = await client
    .from("usuarios")
    .select("id")
    .eq("email", normalized)
    .is("deleted_at", null)
    .maybeSingle();
  if (!error && data?.id) return data.id as string;
  return null;
}

async function getAuthUserIdByEmail(
  client: SupabaseClient,
  email: string,
): Promise<string | null> {
  const fromUsuarios = await getUserIdFromUsuariosOnly(client, email);
  if (fromUsuarios) return fromUsuarios;
  const normalized = normalizeEmail(email);
  try {
    const { data, error } = await client.rpc("get_auth_user_id_by_email", {
      email: normalized,
    });
    if (!error && data) return (data as string) || null;
  } catch {
    /* ignore */
  }
  let page: number | null = 1;
  const perPage = 1000;
  while (page) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(`Falha ao listar usuários do Auth: ${error.message}`);
    const users = data?.users ?? [];
    const match = users.find((u) => (u.email ?? "").toLowerCase() === normalized);
    if (match?.id) return match.id;
    page = data?.nextPage ?? null;
    if (!users.length) break;
  }
  return null;
}

async function findEmpresaByNameOrThrow(nome: string): Promise<{ id: string; nome: string }> {
  const { data: exact, error: exactError } = await supabase
    .from("empresas")
    .select("id, nome")
    .eq("nome", nome)
    .maybeSingle();
  if (exactError) throw new Error(`Falha ao buscar empresa: ${exactError.message}`);
  if (exact?.id) return { id: exact.id as string, nome: exact.nome as string };

  const { data: list, error: listError } = await supabase
    .from("empresas")
    .select("id, nome")
    .ilike("nome", `%${nome}%`)
    .limit(10);
  if (listError) throw new Error(`Falha ao buscar empresa: ${listError.message}`);
  const normalizedTarget = nome.trim().toLowerCase();
  const pick =
    (list ?? []).find((e) => String(e.nome ?? "").trim().toLowerCase() === normalizedTarget) ??
    (list ?? [])[0];
  if (!pick?.id) throw new Error(`Empresa não encontrada: "${nome}"`);
  return { id: pick.id as string, nome: pick.nome as string };
}

async function findCursoByEmpresaAndNameOrThrow(params: {
  empresaId: string;
  nome: string;
}): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from("cursos")
    .select("id")
    .eq("empresa_id", params.empresaId)
    .eq("nome", params.nome)
    .maybeSingle();
  if (error) throw new Error(`Falha ao buscar curso: ${error.message}`);
  if (!data?.id) throw new Error(`Curso não encontrado: "${params.nome}"`);
  return { id: data.id as string };
}

async function createUserAndEnroll(params: {
  empresaId: string;
  cursoId: string;
  row: RowData;
}): Promise<{ userId: string }> {
  const email = normalizeEmail(params.row.email);
  const fullName = (params.row.nome || email).trim();
  const phone = normalizePhone(params.row.telefone);
  const cpf = normalizeCpf(params.row.cpf);

  let userId: string | null = null;
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: {
      role: "aluno",
      full_name: fullName,
      must_change_password: true,
      empresa_id: params.empresaId,
    },
  });

  if (createError) {
    const m = (createError.message ?? "").toLowerCase();
    const isConflict =
      m.includes("already be registered") ||
      m.includes("already registered") ||
      m.includes("already exists") ||
      createError.status === 422;
    if (!isConflict) {
      throw new Error(`Erro ao criar usuário no Auth (${email}): ${createError.message}`);
    }
    userId = await getAuthUserIdByEmail(supabase, email);
    if (!userId) throw new Error(`Conflito no Auth para ${email}, userId não encontrado.`);
    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      password: PASSWORD,
      user_metadata: {
        role: "aluno",
        full_name: fullName,
        must_change_password: true,
        empresa_id: params.empresaId,
      },
    });
    if (updateError) throw new Error(`Erro ao atualizar usuário (${email}): ${updateError.message}`);
  } else {
    userId = created?.user?.id ?? null;
  }

  if (!userId) throw new Error(`userId vazio para ${email}`);

  const { error: usuarioUpsertError } = await supabase.from("usuarios").upsert(
    {
      id: userId,
      empresa_id: params.empresaId,
      nome_completo: fullName,
      email,
      cpf: cpf || null,
      telefone: phone || null,
      must_change_password: true,
      senha_temporaria: PASSWORD,
    },
    { onConflict: "id" },
  );
  if (usuarioUpsertError) {
    throw new Error(`Erro ao upsert em usuarios (${email}): ${usuarioUpsertError.message}`);
  }

  const { error: ueError } = await supabase
    .from("usuarios_empresas")
    .upsert(
      {
        usuario_id: userId,
        empresa_id: params.empresaId,
        papel_base: "aluno",
        ativo: true,
      },
      { onConflict: "usuario_id,empresa_id,papel_base", ignoreDuplicates: true },
    );
  if (ueError) throw new Error(`Erro usuarios_empresas (${email}): ${ueError.message}`);

  const { error: linkError } = await supabase
    .from("alunos_cursos")
    .upsert(
      { usuario_id: userId, curso_id: params.cursoId },
      { onConflict: "usuario_id,curso_id", ignoreDuplicates: true },
    );
  if (linkError) throw new Error(`Erro alunos_cursos (${email}): ${linkError.message}`);

  return { userId };
}

async function enrollExistingUser(params: {
  userId: string;
  empresaId: string;
  cursoId: string;
  email: string;
}): Promise<void> {
  const { userId, empresaId, cursoId, email } = params;

  const { error: pwdError } = await supabase.auth.admin.updateUserById(userId, {
    password: PASSWORD,
  });
  if (pwdError) throw new Error(`Erro ao definir senha (${email}): ${pwdError.message}`);

  const { error: ueError } = await supabase
    .from("usuarios_empresas")
    .upsert(
      {
        usuario_id: userId,
        empresa_id: empresaId,
        papel_base: "aluno",
        ativo: true,
      },
      { onConflict: "usuario_id,empresa_id,papel_base", ignoreDuplicates: true },
    );
  if (ueError) throw new Error(`Erro usuarios_empresas (${email}): ${ueError.message}`);

  const { error: linkError } = await supabase
    .from("alunos_cursos")
    .upsert(
      { usuario_id: userId, curso_id: cursoId },
      { onConflict: "usuario_id,curso_id", ignoreDuplicates: true },
    );
  if (linkError) throw new Error(`Erro alunos_cursos (${email}): ${linkError.message}`);
}

async function main() {
  const excelPath =
    process.argv[2] ||
    path.join("c:", "Cronogramas - 2026 - CDF", "Terra Negra", "alunos.xlsx");

  console.log("🚀 Matriculando faltantes no Terra Negra 2026 e definindo senha TN@2026!\n");
  console.log("Planilha (para obter nome/CPF/telefone do novo):", excelPath);

  const filterEmails = new Set(EMAILS_TO_ENROLL);
  const rowByEmail = await readExcelRows(excelPath, filterEmails);

  const empresa = await findEmpresaByNameOrThrow("Terra Negra");
  const curso = await findCursoByEmpresaAndNameOrThrow({
    empresaId: empresa.id,
    nome: "Terra Negra 2026",
  });

  console.log(`\n🏢 Empresa: ${empresa.nome}`);
  console.log(`📚 Curso: Terra Negra 2026 (id: ${curso.id})\n`);

  const results: Array<{ email: string; ok: boolean; error?: string }> = [];

  for (const email of EMAILS_TO_ENROLL) {
    try {
      const userId = await getUserIdFromUsuariosOnly(supabase, email);
      const row = rowByEmail.get(email) ?? {
        email,
        nome: email.split("@")[0],
        cpf: "",
        telefone: "",
      };

      if (!userId) {
        const { userId: newId } = await createUserAndEnroll({
          empresaId: empresa.id,
          cursoId: curso.id,
          row,
        });
        console.log(`✅ ${email} — criado e matriculado (user_id: ${newId})`);
      } else {
        await enrollExistingUser({
          userId,
          empresaId: empresa.id,
          cursoId: curso.id,
          email,
        });
        console.log(`✅ ${email} — senha atualizada e matriculado`);
      }
      results.push({ email, ok: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`❌ ${email}: ${message}`);
      results.push({ email, ok: false, error: message });
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("📋 Resumo");
  const ok = results.filter((r) => r.ok).length;
  const fail = results.filter((r) => !r.ok).length;
  console.log(`✅ Sucesso: ${ok}`);
  if (fail > 0) {
    console.log(`❌ Falha: ${fail}`);
    results.filter((r) => !r.ok).forEach((r) => console.log(`   - ${r.email}: ${r.error}`));
  }
  console.log("=".repeat(60));
}

main().catch((err) => {
  console.error("❌ Erro fatal:", err);
  process.exit(99);
});
