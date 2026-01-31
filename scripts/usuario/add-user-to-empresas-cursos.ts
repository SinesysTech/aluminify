/**
 * Vincula um usuário existente (por e-mail) a várias empresas e cursos.
 * Cria apenas usuarios_empresas e alunos_cursos; não altera Auth nem usuarios.
 *
 * Uso: npx tsx scripts/usuario/add-user-to-empresas-cursos.ts <email>
 *
 * Configure a lista ENTRADAS abaixo (empresa + curso por item).
 * Requer: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY ou SUPABASE_SECRET_KEY
 */

import * as dotenv from "dotenv";
import * as path from "path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (ou SUPABASE_SECRET_KEY)");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

type Entrada = { empresaNome: string; cursoNome: string };

const ENTRADAS: Entrada[] = [
  { empresaNome: "Jana Rabelo", cursoNome: "Redação 360" },
  { empresaNome: "Química Online", cursoNome: "Química Online" },
];

async function getUserIdByEmail(client: SupabaseClient, email: string): Promise<string | null> {
  const normalized = email.trim().toLowerCase();
  const { data, error } = await client
    .from("usuarios")
    .select("id")
    .eq("email", normalized)
    .maybeSingle();
  if (error || !data?.id) return null;
  return data.id as string;
}

async function findEmpresaByNameOrThrow(
  client: SupabaseClient,
  nome: string,
): Promise<{ id: string; nome: string }> {
  const { data: exact, error: exactError } = await client
    .from("empresas")
    .select("id, nome")
    .eq("nome", nome)
    .maybeSingle();
  if (exactError) throw new Error(`Falha ao buscar empresa: ${exactError.message}`);
  if (exact?.id) return { id: exact.id as string, nome: exact.nome as string };

  const { data: list, error: listError } = await client
    .from("empresas")
    .select("id, nome")
    .ilike("nome", `%${nome}%`)
    .limit(10);
  if (listError) throw new Error(`Falha ao buscar empresa (ilike): ${listError.message}`);

  const normalizedTarget = nome.trim().toLowerCase();
  const pick =
    (list ?? []).find((e) => String(e.nome ?? "").trim().toLowerCase() === normalizedTarget) ??
    (list ?? [])[0];
  if (!pick?.id) throw new Error(`Empresa não encontrada: "${nome}"`);
  return { id: pick.id as string, nome: pick.nome as string };
}

async function findCursoByEmpresaAndNameOrThrow(
  client: SupabaseClient,
  params: { empresaId: string; nome: string },
): Promise<{ id: string; nome: string }> {
  const { data: exact, error: exactError } = await client
    .from("cursos")
    .select("id, nome")
    .eq("empresa_id", params.empresaId)
    .eq("nome", params.nome)
    .maybeSingle();
  if (exactError) throw new Error(`Falha ao buscar curso: ${exactError.message}`);
  if (exact?.id) return { id: exact.id as string, nome: exact.nome as string };

  const { data: list, error: listError } = await client
    .from("cursos")
    .select("id, nome")
    .eq("empresa_id", params.empresaId)
    .ilike("nome", `%${params.nome}%`)
    .limit(10);
  if (listError) throw new Error(`Falha ao buscar curso (ilike): ${listError.message}`);
  const normalizedTarget = params.nome.trim().toLowerCase();
  const pick =
    (list ?? []).find((c) => String(c.nome ?? "").trim().toLowerCase().includes(normalizedTarget)) ??
    (list ?? [])[0];
  if (!pick?.id) throw new Error(`Curso não encontrado: "${params.nome}" (empresa: ${params.empresaId})`);
  return { id: pick.id as string, nome: pick.nome as string };
}

async function linkUserToEmpresaAndCurso(
  client: SupabaseClient,
  userId: string,
  empresaId: string,
  cursoId: string,
): Promise<void> {
  const { error: ueError } = await client.from("usuarios_empresas").upsert(
    {
      usuario_id: userId,
      empresa_id: empresaId,
      papel_base: "aluno",
      ativo: true,
    },
    { onConflict: "usuario_id,empresa_id,papel_base", ignoreDuplicates: true },
  );
  if (ueError) throw new Error(`usuarios_empresas: ${ueError.message}`);

  const { error: acError } = await client.from("alunos_cursos").upsert(
    { usuario_id: userId, curso_id: cursoId },
    { onConflict: "usuario_id,curso_id", ignoreDuplicates: true },
  );
  if (acError) throw new Error(`alunos_cursos: ${acError.message}`);
}

async function main() {
  const email = process.argv[2]?.trim()?.toLowerCase();
  if (!email) {
    console.error("Uso: npx tsx scripts/usuario/add-user-to-empresas-cursos.ts <email>");
    process.exit(1);
  }

  const userId = await getUserIdByEmail(supabase, email);
  if (!userId) {
    console.error(`❌ Usuário não encontrado: ${email}`);
    process.exit(1);
  }
  console.log(`👤 Usuário: ${email} (id: ${userId})`);
  console.log("");

  for (const { empresaNome, cursoNome } of ENTRADAS) {
    try {
      const empresa = await findEmpresaByNameOrThrow(supabase, empresaNome);
      const curso = await findCursoByEmpresaAndNameOrThrow(supabase, {
        empresaId: empresa.id,
        nome: cursoNome,
      });
      await linkUserToEmpresaAndCurso(supabase, userId, empresa.id, curso.id);
      console.log(`✅ ${empresa.nome} — ${curso.nome}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`❌ ${empresaNome} / ${cursoNome}: ${msg}`);
    }
  }
  console.log("\n✅ Concluído.");
}

main().catch((err) => {
  console.error("❌ Erro fatal:", err);
  process.exit(99);
});
