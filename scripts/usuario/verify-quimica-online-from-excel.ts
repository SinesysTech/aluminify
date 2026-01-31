/**
 * Verifica se todos os alunos da planilha "Alunos - Química Online.xlsx"
 * estão cadastrados e matriculados no curso Química Online (empresa Química Online).
 *
 * Uso:
 *   npx tsx scripts/usuario/verify-quimica-online-from-excel.ts
 *   npx tsx scripts/usuario/verify-quimica-online-from-excel.ts "c:\path\to\Alunos - Química Online.xlsx"
 *
 * Requisitos: .env.local com NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY (ou SUPABASE_SERVICE_ROLE_KEY)
 */

import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";
import { createClient } from "@supabase/supabase-js";
import ExcelJS from "exceljs";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config();

const COLUNAS_EMAIL = ["email", "e-mail", "E-mail", "Email"];
const COLUNAS_NOME = ["nome completo", "nome", "Nome", "Nome Completo"];

function normalize(s: string) {
  return (s ?? "").trim().toLowerCase();
}

function findColumnValue(row: Record<string, string>, possibleHeaders: string[]): string {
  const headers = Object.keys(row);
  for (const h of headers) {
    const n = normalize(h).replace(/\s+/g, " ");
    for (const p of possibleHeaders) {
      if (normalize(p).replace(/\s+/g, " ") === n) return String(row[h] ?? "").trim();
    }
  }
  return "";
}

async function readEmailsFromExcel(filePath: string): Promise<{ email: string; nome: string; linha: number }[]> {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Arquivo não encontrado: ${filePath}`);
  }
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const sheet = workbook.worksheets[0];
  if (!sheet) throw new Error("Nenhuma planilha no arquivo.");

  const result: { email: string; nome: string; linha: number }[] = [];
  const headerRow = sheet.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell({ includeEmpty: false }, (c) => headers.push(String(c.value ?? "").trim()));

  function cellToString(val: unknown): string {
    if (val == null) return "";
    if (typeof val === "string") return val.trim();
    if (typeof val === "number" || typeof val === "boolean") return String(val);
    if (val instanceof Date) return val.toISOString().split("T")[0] ?? "";
    return "";
  }

  for (let rowNum = 2; rowNum <= (sheet.rowCount ?? 1); rowNum++) {
    const row = sheet.getRow(rowNum);
    const rowData: Record<string, string> = {};
    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const header = headers[colNumber - 1];
      if (header) rowData[header] = cellToString(cell.value);
    });
    const emailRaw =
      findColumnValue(rowData, COLUNAS_EMAIL) ||
      rowData["Email"] ||
      rowData["E-mail"] ||
      rowData["email"] ||
      "";
    const email = emailRaw.includes("@") ? emailRaw.toLowerCase() : "";
    const nome = findColumnValue(rowData, COLUNAS_NOME) || rowData["Nome"] || rowData["Nome Completo"] || "";
    if (!email && !nome) continue;
    if (!email) {
      result.push({ email: "", nome, linha: rowNum });
      continue;
    }
    result.push({ email, nome, linha: rowNum });
  }
  return result;
}

async function main() {
  const excelPath =
    process.argv[2] ||
    path.join("c:", "Cronogramas - 2026 - CDF", "Química Online", "Alunos - Química Online.xlsx");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !key) {
    console.error("Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (ou SUPABASE_SECRET_KEY) em .env.local");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log("=== Verificação: Alunos da planilha vs curso Química Online ===\n");
  console.log("Planilha:", excelPath);

  const planilha = await readEmailsFromExcel(excelPath);
  const emailsPlanilha = planilha.map((p) => p.email).filter(Boolean);
  const emailsUnicos = [...new Set(emailsPlanilha)];

  const semEmail = planilha.filter((p) => !p.email);
  if (semEmail.length) {
    console.log("\n⚠️  Linhas na planilha sem e-mail (serão ignoradas na verificação de matrícula):", semEmail.length);
    semEmail.slice(0, 5).forEach((s) => console.log(`   Linha ${s.linha}: ${s.nome || "(vazio)"}`));
    if (semEmail.length > 5) console.log(`   ... e mais ${semEmail.length - 5}`);
  }

  console.log("\nTotal de linhas com e-mail na planilha:", planilha.filter((p) => p.email).length);
  console.log("E-mails únicos na planilha:", emailsUnicos.length);

  const { data: empresa, error: errEmpresa } = await supabase
    .from("empresas")
    .select("id, nome")
    .eq("nome", "Química Online")
    .maybeSingle();
  if (errEmpresa || !empresa?.id) {
    console.error("\n❌ Empresa 'Química Online' não encontrada no banco.");
    process.exit(1);
  }

  const { data: curso, error: errCurso } = await supabase
    .from("cursos")
    .select("id, nome")
    .eq("empresa_id", empresa.id)
    .eq("nome", "Química Online")
    .maybeSingle();
  if (errCurso || !curso?.id) {
    console.error("\n❌ Curso 'Química Online' não encontrado na empresa.");
    process.exit(1);
  }

  const { data: matriculas, error: errAc } = await supabase
    .from("alunos_cursos")
    .select("usuario_id")
    .eq("curso_id", curso.id);
  if (errAc) {
    console.error("\n❌ Erro ao ler matrículas:", errAc.message);
    process.exit(1);
  }
  const userIdsMatriculados = [...new Set((matriculas ?? []).map((m) => m.usuario_id))];

  let usuariosByEmail: { id: string; email: string | null; nome_completo: string | null }[] = [];
  if (emailsUnicos.length > 0) {
    const { data: usuarios, error: errU } = await supabase
      .from("usuarios")
      .select("id, email, nome_completo")
      .in("email", emailsUnicos)
      .is("deleted_at", null);
    if (errU) {
      console.error("\n❌ Erro ao ler usuarios:", errU.message);
      process.exit(1);
    }
    usuariosByEmail = usuarios ?? [];
  }

  const usuarioById = new Map(usuariosByEmail.map((u) => [u.id, u]));
  const emailToUsuario = new Map(usuariosByEmail.map((u) => [u.email?.toLowerCase() ?? "", u]));
  const matriculadosSet = new Set(userIdsMatriculados);

  const cadastradosEMatriculados: string[] = [];
  const cadastradosNaoMatriculados: string[] = [];
  const naoCadastrados: string[] = [];

  for (const email of emailsUnicos) {
    const u = emailToUsuario.get(email);
    if (!u) {
      naoCadastrados.push(email);
      continue;
    }
    if (matriculadosSet.has(u.id)) {
      cadastradosEMatriculados.push(email);
    } else {
      cadastradosNaoMatriculados.push(email);
    }
  }

  console.log("\n--- Resultado ---");
  console.log("Empresa:", empresa.nome);
  console.log("Curso:", curso.nome);
  console.log("Total de matrículas no curso (banco):", userIdsMatriculados.length);
  console.log("");
  console.log("Da planilha (e-mails únicos):");
  console.log("  ✅ Cadastrados e matriculados no curso:", cadastradosEMatriculados.length);
  console.log("  ⚠️  Cadastrados mas NÃO matriculados no curso:", cadastradosNaoMatriculados.length);
  console.log("  ❌ Não cadastrados (usuário não existe):", naoCadastrados.length);

  if (cadastradosNaoMatriculados.length) {
    console.log("\n  Lista (cadastrados mas não matriculados):");
    cadastradosNaoMatriculados.forEach((e) => console.log("   -", e));
  }
  if (naoCadastrados.length) {
    console.log("\n  Lista (não cadastrados):");
    naoCadastrados.forEach((e) => console.log("   -", e));
  }

  const todosOk = naoCadastrados.length === 0 && cadastradosNaoMatriculados.length === 0;
  console.log("\n=== Conclusão ===");
  if (todosOk) {
    console.log("Todos os alunos da planilha estão cadastrados e matriculados no curso Química Online.");
  } else {
    console.log("Há divergências:");
    if (naoCadastrados.length) console.log(`  - ${naoCadastrados.length} e-mail(s) da planilha não possuem usuário cadastrado.`);
    if (cadastradosNaoMatriculados.length) console.log(`  - ${cadastradosNaoMatriculados.length} usuário(s) cadastrado(s) mas não matriculados no curso Química Online.`);
  }
  console.log("");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
