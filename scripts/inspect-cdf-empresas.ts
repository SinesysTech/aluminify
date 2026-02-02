/**
 * Inspeciona empresas por slug e mostra admins/owners vinculados.
 *
 * Execute com:
 *   npx tsx scripts/inspect-cdf-empresas.ts
 *
 * Requer variáveis de ambiente:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY (ou SUPABASE_SECRET_KEY)
 */

import * as dotenv from "dotenv";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Variáveis de ambiente não configuradas");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

type EmpresaRow = {
  id: string;
  nome: string;
  slug: string;
  ativo?: boolean | null;
  created_at?: string | null;
  email_contato?: string | null;
  cnpj?: string | null;
};

type EmpresaAdminRow = {
  empresa_id: string;
  user_id: string;
  is_owner: boolean;
  created_at?: string | null;
};

type UsuarioRow = {
  id: string;
  email: string;
  nome_completo?: string | null;
  empresa_id?: string | null;
  ativo?: boolean | null;
};

function safe(v: unknown): string {
  if (v == null) return "—";
  if (typeof v === "boolean") return v ? "sim" : "não";
  return String(v);
}

async function main() {
  const slugs = ["cdf", "cdf-curso-de-fsica"] as const;
  const professorEmail = "brenomeira@salinhadobreno.com.br";

  const { data: empresas, error: empresasError } = await supabase
    .from("empresas")
    .select("id, nome, slug, ativo, created_at, email_contato, cnpj")
    .in("slug", slugs as unknown as string[]);

  if (empresasError) throw new Error(`Falha ao buscar empresas: ${empresasError.message}`);

  const bySlug = new Map<string, EmpresaRow>();
  for (const e of (empresas ?? []) as EmpresaRow[]) bySlug.set(e.slug, e);

  console.log("🔎 Inspeção de empresas (CDF)");
  console.log("=".repeat(80));

  for (const slug of slugs) {
    const e = bySlug.get(slug);
    if (!e) {
      console.log(`- ${slug}: (não encontrada)`);
      continue;
    }
    console.log(
      `- ${e.nome} (slug: ${e.slug}, id: ${e.id}, ativo: ${safe(e.ativo)}, created_at: ${safe(
        e.created_at,
      )})`,
    );
  }

  const empresaIds = Array.from(bySlug.values()).map((e) => e.id);
  if (!empresaIds.length) {
    console.log("\nNenhuma empresa encontrada para os slugs informados.");
    return;
  }

  const { data: admins, error: adminsError } = await supabase
    .from("empresa_admins")
    .select("empresa_id, user_id, is_owner, created_at")
    .in("empresa_id", empresaIds);
  if (adminsError) throw new Error(`Falha ao buscar empresa_admins: ${adminsError.message}`);

  const adminUserIds = Array.from(new Set(((admins ?? []) as EmpresaAdminRow[]).map((a) => a.user_id)));

  const { data: usuariosAdmins, error: usuariosError } = await supabase
    .from("usuarios")
    .select("id, email, nome_completo, empresa_id, ativo")
    .in("id", adminUserIds);
  if (usuariosError) throw new Error(`Falha ao buscar usuarios(admins): ${usuariosError.message}`);

  const usuariosById = new Map<string, UsuarioRow>();
  for (const p of (usuariosAdmins ?? []) as UsuarioRow[]) usuariosById.set(p.id, p);

  console.log("\n👤 Admins/owners vinculados (empresa_admins)");
  console.log("-".repeat(80));
  for (const a of (admins ?? []) as EmpresaAdminRow[]) {
    const empresa = Array.from(bySlug.values()).find((e) => e.id === a.empresa_id);
    const usuario = usuariosById.get(a.user_id);
    console.log(
      `- empresa: ${empresa?.slug ?? a.empresa_id} | user_id: ${a.user_id} | email: ${
        usuario?.email ?? "—"
      } | owner: ${safe(a.is_owner)} | ativo: ${safe(usuario?.ativo)}`,
    );
  }

  console.log("\n🧾 Usuário informado");
  console.log("-".repeat(80));
  const { data: usuario, error: usuarioError2 } = await supabase
    .from("usuarios")
    .select("id, email, nome_completo, empresa_id, ativo")
    .eq("email", professorEmail)
    .maybeSingle();
  if (usuarioError2) throw new Error(`Falha ao buscar usuario por email: ${usuarioError2.message}`);

  if (!usuario) {
    console.log(`- ${professorEmail}: (não encontrado em usuarios)`);
  } else {
    const p = usuario as UsuarioRow;
    const empresa = p.empresa_id ? Array.from(bySlug.values()).find((e) => e.id === p.empresa_id) : null;
    console.log(
      `- ${p.email} (id: ${p.id}, nome: ${safe(p.nome_completo)}, empresa_id: ${safe(
        p.empresa_id,
      )}${empresa ? `, empresa_slug: ${empresa.slug}` : ""}, ativo: ${safe(p.ativo)})`,
    );
  }

  console.log("\n✅ Fim.");
}

main().catch((err) => {
  console.error("❌ Erro:", err instanceof Error ? err.message : String(err));
  process.exit(99);
});

