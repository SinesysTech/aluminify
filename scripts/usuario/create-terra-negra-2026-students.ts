/**
 * Cria (ou atualiza) alunos e vincula à empresa "Terra Negra" e ao curso "Terra Negra 2026".
 *
 * Execute com:
 *   npx tsx scripts/usuario/create-terra-negra-2026-students.ts
 *
 * Requer variáveis de ambiente:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY (ou SUPABASE_SECRET_KEY)
 *
 * Observações:
 * - Script idempotente: pode ser executado mais de uma vez com segurança.
 * - Usa modelo unificado: usuarios + usuarios_empresas + alunos_cursos (usuario_id).
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
  console.error("❌ Variáveis de ambiente não configuradas");
  console.error(
    "   Certifique-se de ter NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (ou SUPABASE_SECRET_KEY)",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEFAULT_PASSWORD = "Terr@negra2026!";

type StudentInput = {
  fullName: string;
  email: string;
  cpf: string;
  phone: string;
};

const students: StudentInput[] = [
  {
    fullName: "Miguel Marques Serafim da Silva",
    email: "miguelmedvest@gmail.com",
    cpf: "072.396.945-00",
    phone: "5571986478552",
  },
  {
    fullName: "Marlene Araújo Nascimento",
    email: "am0r405052006@gmail.com",
    cpf: "05680314150",
    phone: "5562985338626",
  },
  {
    fullName: "Ana Clara de Paula Carvalho",
    email: "anaclara.depaulacarvalho2909@gmail.com",
    cpf: "16982522909",
    phone: "43664710860",
  },
  {
    fullName: "Sarah Gabriele Silva de Novais",
    email: "sarahgabriele025@gmail.com",
    cpf: "13401601458",
    phone: "82999192233",
  },
  {
    fullName: "Bernardo Antônio Rogério Pessoa",
    email: "bepessoa20@gmail.com",
    cpf: "113.572.136-03",
    phone: "31992824677",
  },
  {
    fullName: "Gabriela Tavares",
    email: "gabrielatavaresjf410@gmail.com",
    cpf: "020.653.356-02",
    phone: "32999678415",
  },
  {
    fullName: "IGOR CARLOS DE BARROS",
    email: "igorcontapessoal@outlook.com",
    cpf: "44074639882",
    phone: "16991703993",
  },
];

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizePhone(phone: string): string {
  return (phone ?? "").replace(/\D/g, "");
}

function normalizeCpf(cpf: string): string {
  let cleaned = (cpf ?? "").replace(/\D/g, "");
  // Regra do projeto: se vier com 8, 9 ou 10 dígitos, completa com 0 à esquerda até 11.
  if (cleaned.length >= 8 && cleaned.length <= 10) {
    cleaned = cleaned.padStart(11, "0");
  }
  return cleaned;
}

async function getAuthUserIdByEmail(
  client: SupabaseClient,
  email: string,
): Promise<string | null> {
  const normalized = normalizeEmail(email);

  // Modelo unificado: usuarios (id = auth.users.id)
  for (const table of ["usuarios", "professores"] as const) {
    try {
      const { data, error } = await client
        .from(table)
        .select("id")
        .eq("email", normalized)
        .maybeSingle();
      if (!error && data?.id) {
        return data.id as string;
      }
    } catch {
      // ignorar e seguir
    }
  }

  // Preferencial: RPC (O(1)) se existir no banco.
  try {
    const { data, error } = await client.rpc("get_auth_user_id_by_email", {
      email: normalized,
    });
    if (!error) {
      return (data as string) || null;
    }
  } catch {
    // ignorar e seguir fallback
  }

  // Fallback: varrer auth users por paginação.
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
  // Tentar match exato primeiro
  const { data: exact, error: exactError } = await supabase
    .from("empresas")
    .select("id, nome")
    .eq("nome", nome)
    .maybeSingle();

  if (exactError) {
    throw new Error(`Falha ao buscar empresa (exato): ${exactError.message}`);
  }
  if (exact?.id) {
    return { id: exact.id as string, nome: exact.nome as string };
  }

  // Fallback: busca aproximada
  const { data: list, error: listError } = await supabase
    .from("empresas")
    .select("id, nome")
    .ilike("nome", `%${nome}%`)
    .limit(10);

  if (listError) {
    throw new Error(`Falha ao buscar empresa (ilike): ${listError.message}`);
  }

  const normalizedTarget = nome.trim().toLowerCase();
  const pick =
    (list ?? []).find((e) => String(e.nome ?? "").trim().toLowerCase() === normalizedTarget) ??
    (list ?? [])[0];

  if (!pick?.id) {
    throw new Error(`Empresa não encontrada: "${nome}"`);
  }

  return { id: pick.id as string, nome: pick.nome as string };
}

async function findCursoByEmpresaAndNameOrThrow(params: {
  empresaId: string;
  nome: string;
}): Promise<{
  id: string;
  nome: string;
  empresa_id: string;
  data_termino: string | null;
  meses_acesso: number | null;
  ano_vigencia: number;
}> {
  const { data, error } = await supabase
    .from("cursos")
    .select("id, nome, empresa_id, data_termino, meses_acesso, ano_vigencia")
    .eq("empresa_id", params.empresaId)
    .eq("nome", params.nome)
    .maybeSingle();

  if (error) {
    throw new Error(`Falha ao buscar curso: ${error.message}`);
  }
  if (!data?.id) {
    throw new Error(
      `Curso não encontrado: "${params.nome}" (empresa_id: ${params.empresaId})`,
    );
  }
  return data as {
    id: string;
    nome: string;
    empresa_id: string;
    data_termino: string | null;
    meses_acesso: number | null;
    ano_vigencia: number;
  };
}

async function ensureStudentAuthAndProfile(params: {
  empresaId: string;
  cursoId: string;
  student: StudentInput;
}): Promise<{ userId: string }> {
  const email = normalizeEmail(params.student.email);
  const phone = normalizePhone(params.student.phone);
  const cpf = normalizeCpf(params.student.cpf);
  const fullName = params.student.fullName.trim();

  // 1) Criar ou atualizar Auth user
  let userId: string | null = null;
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password: DEFAULT_PASSWORD,
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
    if (!userId) {
      throw new Error(
        `Conflito no Auth para ${email}, mas não foi possível recuperar o user_id.`,
      );
    }

    // Atualiza senha + metadata para garantir o estado esperado
    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      password: DEFAULT_PASSWORD,
      user_metadata: {
        role: "aluno",
        full_name: fullName,
        must_change_password: true,
        empresa_id: params.empresaId,
      },
    });
    if (updateError) {
      throw new Error(
        `Erro ao atualizar usuário no Auth (${email}): ${updateError.message}`,
      );
    }
  } else {
    userId = created?.user?.id ?? null;
  }

  if (!userId) {
    throw new Error(`Falha inesperada: userId vazio para ${email}`);
  }

  // 2) Upsert em usuarios (modelo unificado)
  const { error: usuarioUpsertError } = await supabase.from("usuarios").upsert(
    {
      id: userId,
      empresa_id: params.empresaId,
      nome_completo: fullName,
      email,
      cpf: cpf || null,
      telefone: phone || null,
      must_change_password: true,
      senha_temporaria: DEFAULT_PASSWORD,
    },
    { onConflict: "id" },
  );

  if (usuarioUpsertError) {
    throw new Error(`Erro ao upsert em usuarios (${email}): ${usuarioUpsertError.message}`);
  }

  // 3) Garantir vínculo usuarios_empresas (papel aluno)
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

  if (ueError) {
    throw new Error(
      `Erro ao vincular usuarios_empresas (${email}): ${ueError.message}`,
    );
  }

  // 4) Garantir vínculo em alunos_cursos (usuario_id)
  const { error: linkError } = await supabase
    .from("alunos_cursos")
    .upsert(
      { usuario_id: userId, curso_id: params.cursoId },
      { onConflict: "usuario_id,curso_id", ignoreDuplicates: true },
    );

  if (linkError) {
    throw new Error(`Erro ao vincular aluno_curso (${email}): ${linkError.message}`);
  }

  return { userId };
}

async function main() {
  console.log("🚀 Criando alunos da Terra Negra 2026");
  console.log("=".repeat(70));

  const empresa = await findEmpresaByNameOrThrow("Terra Negra");
  console.log(`🏢 Empresa: ${empresa.nome} (id: ${empresa.id})`);

  const curso = await findCursoByEmpresaAndNameOrThrow({
    empresaId: empresa.id,
    nome: "Terra Negra 2026",
  });
  console.log(`📚 Curso: ${curso.nome} (id: ${curso.id})`);

  const results: Array<{ email: string; userId?: string; ok: boolean; error?: string }> =
    [];

  for (const student of students) {
    const email = normalizeEmail(student.email);
    try {
      const { userId } = await ensureStudentAuthAndProfile({
        empresaId: empresa.id,
        cursoId: curso.id,
        student,
      });
      console.log(`✅ ${email} (user_id: ${userId})`);
      results.push({ email, userId, ok: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`❌ ${email}: ${message}`);
      results.push({ email, ok: false, error: message });
    }
  }

  console.log("\n" + "=".repeat(70));
  console.log("📋 Resumo");
  for (const r of results) {
    console.log(r.ok ? `✅ ${r.email}` : `❌ ${r.email} — ${r.error}`);
  }
  console.log("=".repeat(70));
}

main().catch((err) => {
  console.error("❌ Erro fatal:", err);
  process.exit(99);
});

