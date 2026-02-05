/**
 * Diagnóstico de permissões para criar bloqueios de agendamento.
 * Verifica: tabela professores, usuarios, get_user_empresa_id, is_admin.
 *
 * Uso: npx tsx scripts/agendamentos/diagnose-bloqueio-permissions.ts <email> <empresa>
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
  console.error(
    "❌ Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (ou SUPABASE_SECRET_KEY)",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const email = process.argv[2]?.trim();
  const empresaNome = process.argv[3]?.trim();

  if (!email || !empresaNome) {
    console.error(
      "Uso: npx tsx scripts/agendamentos/diagnose-bloqueio-permissions.ts <email> <empresa>",
    );
    process.exit(1);
  }

  console.log(`\n🔍 DIAGNÓSTICO DE PERMISSÕES PARA BLOQUEIOS`);
  console.log(`   Email: ${email}`);
  console.log(`   Empresa: ${empresaNome}`);
  console.log("");

  // 1. Buscar usuário na tabela usuarios
  const { data: usuario, error: userError } = await supabase
    .from("usuarios")
    .select("id, nome_completo, email, empresa_id, deleted_at")
    .eq("email", email.toLowerCase())
    .maybeSingle();

  console.log(`📋 Tabela USUARIOS:`);
  if (userError) {
    console.log(`   ❌ Erro: ${userError.message}`);
  } else if (!usuario) {
    console.log(`   ❌ Usuário NÃO encontrado`);
  } else {
    console.log(`   ✅ Encontrado:`);
    console.log(`      ID: ${usuario.id}`);
    console.log(`      Nome: ${usuario.nome_completo}`);
    console.log(`      empresa_id: ${usuario.empresa_id || "(NULL)"}`);
    console.log(`      deleted_at: ${usuario.deleted_at || "(NULL - ativo)"}`);
  }
  console.log("");

  if (!usuario) {
    console.error("❌ Não é possível continuar sem o usuário.");
    process.exit(1);
  }

  // 2. Buscar empresa
  const { data: empresas } = await supabase
    .from("empresas")
    .select("id, nome")
    .ilike("nome", `%${empresaNome}%`);

  const empresa = empresas?.[0];
  if (!empresa) {
    console.error(`❌ Empresa não encontrada: ${empresaNome}`);
    process.exit(1);
  }

  console.log(`🏢 Empresa:`);
  console.log(`   ID: ${empresa.id}`);
  console.log(`   Nome: ${empresa.nome}`);
  console.log("");

  // 3. Buscar na tabela professores
  const { data: professor, error: profError } = await supabase
    .from("professores")
    .select("id, nome, email, empresa_id, is_admin, ativo")
    .eq("id", usuario.id)
    .maybeSingle();

  console.log(`👨‍🏫 Tabela PROFESSORES:`);
  if (profError) {
    console.log(`   ❌ Erro: ${profError.message}`);
  } else if (!professor) {
    console.log(`   ⚠️ Usuário NÃO está na tabela professores`);
    console.log(`   ℹ️ Isso pode impedir a criação de bloqueios!`);
  } else {
    console.log(`   ✅ Encontrado:`);
    console.log(`      ID: ${professor.id}`);
    console.log(`      Nome: ${professor.nome}`);
    console.log(`      empresa_id: ${professor.empresa_id || "(NULL)"}`);
    console.log(`      is_admin: ${professor.is_admin ? "SIM ✓" : "NÃO"}`);
    console.log(`      ativo: ${professor.ativo ? "SIM" : "NÃO"}`);
  }
  console.log("");

  // 4. Verificar usuarios_empresas
  const { data: vinculo } = await supabase
    .from("usuarios_empresas")
    .select("id, papel_base, ativo")
    .eq("usuario_id", usuario.id)
    .eq("empresa_id", empresa.id)
    .maybeSingle();

  console.log(`🔗 Tabela USUARIOS_EMPRESAS:`);
  if (!vinculo) {
    console.log(`   ⚠️ Sem vínculo direto com a empresa`);
  } else {
    console.log(`   ✅ Vínculo encontrado:`);
    console.log(`      papel_base: ${vinculo.papel_base}`);
    console.log(`      ativo: ${vinculo.ativo ? "SIM" : "NÃO"}`);
  }
  console.log("");

  // 5. Verificar bloqueios existentes
  const { data: bloqueios, error: bloqError } = await supabase
    .from("agendamento_bloqueios")
    .select("id, tipo, data_inicio, data_fim, professor_id, motivo")
    .eq("empresa_id", empresa.id)
    .or(`professor_id.is.null,professor_id.eq.${usuario.id}`)
    .order("data_inicio", { ascending: false })
    .limit(5);

  console.log(`🚫 Bloqueios existentes (últimos 5):`);
  if (bloqError) {
    console.log(`   ❌ Erro: ${bloqError.message}`);
  } else if (!bloqueios?.length) {
    console.log(`   (nenhum bloqueio encontrado)`);
  } else {
    for (const b of bloqueios) {
      const escopo = b.professor_id ? "Pessoal" : "Empresa";
      console.log(`   - [${escopo}] ${b.tipo}: ${b.data_inicio} a ${b.data_fim}`);
      if (b.motivo) console.log(`     Motivo: ${b.motivo}`);
    }
  }
  console.log("");

  // 6. Simular get_user_empresa_id
  console.log(`🔧 Simulação de get_user_empresa_id():`);
  
  // Primeiro tenta professores
  let empresaIdResult: string | null = null;
  if (professor?.empresa_id) {
    empresaIdResult = professor.empresa_id;
    console.log(`   Fonte: tabela professores`);
  } else if (usuario?.empresa_id && !usuario.deleted_at) {
    empresaIdResult = usuario.empresa_id;
    console.log(`   Fonte: tabela usuarios`);
  }
  
  if (empresaIdResult) {
    console.log(`   Resultado: ${empresaIdResult}`);
    if (empresaIdResult === empresa.id) {
      console.log(`   ✅ Corresponde à empresa ${empresa.nome}`);
    } else {
      console.log(`   ⚠️ NÃO corresponde à empresa ${empresa.nome} (${empresa.id})`);
    }
  } else {
    console.log(`   ❌ Resultado: NULL`);
    console.log(`   ⚠️ PROBLEMA: get_user_empresa_id() retornará NULL!`);
    console.log(`   ⚠️ Isso IMPEDE a criação de bloqueios via RLS!`);
  }
  console.log("");

  // 7. Resumo
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📊 RESUMO DE PERMISSÕES:`);
  console.log("");

  const problemas: string[] = [];

  // Verificar se está em professores
  if (!professor) {
    problemas.push("Usuário não está na tabela 'professores'");
  } else if (!professor.empresa_id) {
    problemas.push("Campo empresa_id está NULL na tabela 'professores'");
  } else if (professor.empresa_id !== empresa.id) {
    problemas.push(`empresa_id em 'professores' (${professor.empresa_id}) não corresponde à empresa ${empresa.nome}`);
  }

  // Verificar usuarios
  if (usuario.deleted_at) {
    problemas.push("Usuário está marcado como deletado (deleted_at não é NULL)");
  }

  // Verificar empresa_id em usuarios
  if (!usuario.empresa_id) {
    problemas.push("Campo empresa_id está NULL na tabela 'usuarios'");
  } else if (usuario.empresa_id !== empresa.id) {
    problemas.push(`empresa_id em 'usuarios' (${usuario.empresa_id}) não corresponde à empresa ${empresa.nome}`);
  }

  // Verificar is_admin para bloqueios de empresa
  if (professor && !professor.is_admin) {
    console.log(`ℹ️ Usuário NÃO é admin. Só pode criar bloqueios pessoais.`);
  } else if (professor?.is_admin) {
    console.log(`✅ Usuário é ADMIN. Pode criar bloqueios pessoais e da empresa.`);
  }

  if (problemas.length === 0) {
    console.log(`\n✅ Nenhum problema de permissão identificado.`);
    console.log(`   Se ainda não consegue criar bloqueios, verifique:`);
    console.log(`   1. Se está logado com este e-mail`);
    console.log(`   2. Se o tenant da URL corresponde à empresa`);
    console.log(`   3. Se há erros no console do navegador`);
  } else {
    console.log(`\n⚠️ PROBLEMAS IDENTIFICADOS:`);
    for (const p of problemas) {
      console.log(`   - ${p}`);
    }
  }
  console.log("");
}

main().catch((err) => {
  console.error("❌ Erro:", err instanceof Error ? err.message : String(err));
  process.exit(99);
});
