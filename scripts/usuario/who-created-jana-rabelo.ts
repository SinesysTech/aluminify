/**
 * Descobre qual usuário (email) criou a instância da empresa Jana Rabelo.
 * A tabela empresas não tem created_by; consulta empresa_admins (owner) e
 * usuarios_empresas (primeiro staff vinculado) como aproximação.
 *
 * Uso: npx tsx scripts/usuario/who-created-jana-rabelo.ts
 *
 * Requisitos: .env.local com NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY (ou SUPABASE_SERVICE_ROLE_KEY)
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config();

const EMPRESA_NOME = "Jana Rabelo";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !secretKey) {
    console.error("Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY (ou SUPABASE_SERVICE_ROLE_KEY) em .env.local");
    process.exit(1);
  }

  const supabase = createClient(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1) Empresa Jana Rabelo
  const { data: empresa, error: errEmpresa } = await supabase
    .from("empresas")
    .select("id, nome, created_at")
    .ilike("nome", EMPRESA_NOME)
    .maybeSingle();

  if (errEmpresa || !empresa?.id) {
    console.error("Empresa não encontrada:", EMPRESA_NOME, errEmpresa?.message ?? "");
    process.exit(1);
  }

  console.log("--- Quem criou a empresa Jana Rabelo? ---\n");
  console.log("Empresa:", empresa.nome);
  console.log("ID:", empresa.id);
  console.log("Criada em (empresas.created_at):", empresa.created_at ?? "(não disponível)\n");

  // 2) Owner em empresa_admins (quem criou geralmente é o owner)
  const { data: admins, error: errAdmins } = await supabase
    .from("empresa_admins")
    .select("user_id, is_owner, created_at")
    .eq("empresa_id", empresa.id)
    .order("created_at", { ascending: true });

  if (!errAdmins && admins?.length) {
    const owners = admins.filter((a) => a.is_owner);
    const ownerIds = owners.map((o) => o.user_id);
    if (ownerIds.length) {
      const { data: usuarios } = await supabase
        .from("usuarios")
        .select("id, email, nome_completo, created_at")
        .in("id", ownerIds);

      if (usuarios?.length) {
        console.log("Owner(s) em empresa_admins (provável criador):");
        usuarios.forEach((u) => {
          const adm = admins.find((a) => a.user_id === u.id);
          console.log("  -", u.email, "|", u.nome_completo ?? "-", "| vinculado em", adm?.created_at ?? "-");
        });
        console.log("");
      }
    }

    // Se não há owner, mostrar o primeiro admin vinculado
    if (owners.length === 0 && admins.length > 0) {
      const first = admins[0];
      const { data: u } = await supabase
        .from("usuarios")
        .select("id, email, nome_completo")
        .eq("id", first.user_id)
        .maybeSingle();
      if (u) {
        console.log("Primeiro admin vinculado (empresa_admins, sem owner):");
        console.log("  -", u.email, "| vinculado em", first.created_at, "\n");
      }
    }
  } else {
    console.log("Nenhum registro em empresa_admins para esta empresa.\n");
  }

  // 3) Primeiro staff em usuarios_empresas (alternativa)
  const { data: ueStaff, error: errUe } = await supabase
    .from("usuarios_empresas")
    .select("usuario_id, created_at")
    .eq("empresa_id", empresa.id)
    .in("papel_base", ["professor", "usuario"])
    .eq("ativo", true)
    .is("deleted_at", null)
    .order("created_at", { ascending: true })
    .limit(5);

  if (!errUe && ueStaff?.length) {
    const ids = ueStaff.map((r) => r.usuario_id);
    const { data: us } = await supabase
      .from("usuarios")
      .select("id, email, nome_completo")
      .in("id", ids);

    if (us?.length) {
      console.log("Primeiros staff vinculados (usuarios_empresas, por created_at):");
      ueStaff.forEach((ue) => {
        const u = us.find((x) => x.id === ue.usuario_id);
        if (u) {
          console.log("  -", u.email, "| vinculado em", ue.created_at ?? "-");
        }
      });
    }
  }
}

main().catch(console.error);
