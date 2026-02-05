/**
 * Testa a criação de um bloqueio de agendamento para um professor.
 * Simula o que o frontend faz para identificar o problema.
 *
 * Uso: npx tsx scripts/agendamentos/test-create-bloqueio.ts <email> <empresa>
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
      "Uso: npx tsx scripts/agendamentos/test-create-bloqueio.ts <email> <empresa>",
    );
    process.exit(1);
  }

  console.log(`\n🧪 TESTE DE CRIAÇÃO DE BLOQUEIO`);
  console.log(`   Email: ${email}`);
  console.log(`   Empresa: ${empresaNome}`);
  console.log("");

  // 1. Buscar usuário
  const { data: usuario, error: userError } = await supabase
    .from("usuarios")
    .select("id, nome_completo, email, empresa_id")
    .eq("email", email.toLowerCase())
    .is("deleted_at", null)
    .maybeSingle();

  if (userError || !usuario) {
    console.error(`❌ Usuário não encontrado: ${email}`);
    process.exit(1);
  }

  console.log(`✅ Usuário: ${usuario.nome_completo} (${usuario.id})`);

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

  console.log(`✅ Empresa: ${empresa.nome} (${empresa.id})`);
  console.log("");

  // 3. Verificar papel do usuário
  const { data: vinculo } = await supabase
    .from("usuarios_empresas")
    .select("papel_base, ativo")
    .eq("usuario_id", usuario.id)
    .eq("empresa_id", empresa.id)
    .maybeSingle();

  console.log(`📋 Vínculo em usuarios_empresas:`);
  if (vinculo) {
    console.log(`   papel_base: ${vinculo.papel_base}`);
    console.log(`   ativo: ${vinculo.ativo}`);
  } else {
    console.log(`   ⚠️ Sem vínculo direto`);
  }
  console.log("");

  // 4. Testar criação de bloqueio com service role (bypassa RLS)
  const dataInicio = new Date();
  dataInicio.setDate(dataInicio.getDate() + 1);
  dataInicio.setHours(9, 0, 0, 0);
  
  const dataFim = new Date(dataInicio);
  dataFim.setHours(10, 0, 0, 0);

  const payload = {
    professor_id: usuario.id, // Bloqueio pessoal
    empresa_id: empresa.id,
    tipo: 'imprevisto' as const,
    data_inicio: dataInicio.toISOString(),
    data_fim: dataFim.toISOString(),
    motivo: '[TESTE] Bloqueio de teste - será deletado',
    criado_por: usuario.id,
  };

  console.log(`🔧 Tentando criar bloqueio de teste:`);
  console.log(`   professor_id: ${payload.professor_id}`);
  console.log(`   empresa_id: ${payload.empresa_id}`);
  console.log(`   criado_por: ${payload.criado_por}`);
  console.log(`   tipo: ${payload.tipo}`);
  console.log(`   período: ${payload.data_inicio} a ${payload.data_fim}`);
  console.log("");

  // 5. Testar inserção com service role (bypassa RLS)
  console.log(`📝 Teste 1: Insert com service role (bypassa RLS)...`);
  const { data: inserted, error: insertError } = await supabase
    .from("agendamento_bloqueios")
    .insert(payload)
    .select()
    .single();

  if (insertError) {
    console.log(`   ❌ Erro: ${insertError.message}`);
    console.log(`   Code: ${insertError.code}`);
    console.log(`   Details: ${insertError.details}`);
    console.log(`   Hint: ${insertError.hint}`);
  } else {
    console.log(`   ✅ Sucesso! ID: ${inserted.id}`);
    
    // Deletar o bloqueio de teste
    console.log(`   🗑️ Deletando bloqueio de teste...`);
    await supabase.from("agendamento_bloqueios").delete().eq("id", inserted.id);
    console.log(`   ✅ Bloqueio de teste deletado.`);
  }
  console.log("");

  // 6. Simular o que get_user_empresa_id retornaria
  console.log(`🔍 Verificando get_user_empresa_id():`);
  const { data: empresaIdResult, error: funcError } = await supabase.rpc(
    "get_user_empresa_id"
  );

  if (funcError) {
    console.log(`   ⚠️ Erro ao chamar função: ${funcError.message}`);
    console.log(`   (Nota: Sem autenticação, a função pode falhar)`);
  } else {
    console.log(`   Resultado: ${empresaIdResult || "(NULL)"}`);
  }
  console.log("");

  // 7. Listar políticas RLS ativas
  console.log(`📜 Políticas RLS em agendamento_bloqueios:`);
  const { data: policies, error: policyError } = await supabase.rpc(
    "get_policies_for_table",
    { table_name: "agendamento_bloqueios" }
  ).catch(() => ({ data: null, error: { message: "Função não existe" } as { message: string } }));

  if (policyError || !policies) {
    console.log(`   (Não foi possível listar políticas: ${(policyError as { message: string } | null)?.message ?? 'erro'})`);
  } else {
    for (const p of policies as Array<{ policyname: string; cmd: string }>) {
      console.log(`   - ${p.policyname} (${p.cmd})`);
    }
  }
  console.log("");

  // 8. Resumo
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📊 RESUMO:`);
  console.log("");
  
  if (insertError) {
    console.log(`❌ A inserção com service role FALHOU.`);
    console.log(`   Isso indica um problema na estrutura da tabela/constraint.`);
    console.log(`   Erro: ${insertError.message}`);
  } else {
    console.log(`✅ A inserção com service role FUNCIONOU.`);
    console.log(`   O problema está nas políticas RLS ou na autenticação do usuário.`);
    console.log("");
    console.log(`🔍 Possíveis causas:`);
    console.log(`   1. get_user_empresa_id() retorna NULL para este usuário`);
    console.log(`   2. O usuário não está autenticado corretamente`);
    console.log(`   3. O empresa_id passado não corresponde ao get_user_empresa_id()`);
    console.log(`   4. O criado_por não corresponde ao auth.uid()`);
  }
  console.log("");
}

main().catch((err) => {
  console.error("❌ Erro:", err instanceof Error ? err.message : String(err));
  process.exit(99);
});
