/**
 * Diagnóstico completo de agendamentos para um professor.
 * Verifica: recorrências, bloqueios, configurações, vínculo com empresa.
 *
 * Uso: npx tsx scripts/agendamentos/diagnose-professor-scheduling.ts <email_professor> <empresa>
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

const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

async function main() {
  const emailProfessor = process.argv[2]?.trim();
  const empresaNome = process.argv[3]?.trim();

  if (!emailProfessor || !empresaNome) {
    console.error(
      "Uso: npx tsx scripts/agendamentos/diagnose-professor-scheduling.ts <email_professor> <empresa>",
    );
    process.exit(1);
  }

  console.log(`\n🔍 DIAGNÓSTICO COMPLETO DE AGENDAMENTOS`);
  console.log(`   Professor: ${emailProfessor}`);
  console.log(`   Empresa: ${empresaNome}`);
  console.log(`   Data atual: ${new Date().toISOString()}`);
  console.log("");

  // 1. Buscar usuário
  const { data: usuario, error: userError } = await supabase
    .from("usuarios")
    .select("id, nome_completo, email, empresa_id")
    .eq("email", emailProfessor.toLowerCase())
    .is("deleted_at", null)
    .maybeSingle();

  if (userError || !usuario) {
    console.error(`❌ Professor não encontrado: ${emailProfessor}`);
    if (userError) console.error("   Erro:", userError.message);
    process.exit(1);
  }

  console.log(`✅ Usuário encontrado:`);
  console.log(`   ID: ${usuario.id}`);
  console.log(`   Nome: ${usuario.nome_completo}`);
  console.log(`   Empresa principal: ${usuario.empresa_id}`);
  console.log("");

  // 2. Buscar empresa
  const { data: empresas, error: empError } = await supabase
    .from("empresas")
    .select("id, nome")
    .ilike("nome", `%${empresaNome}%`);

  if (empError || !empresas?.length) {
    console.error(`❌ Empresa não encontrada: ${empresaNome}`);
    process.exit(1);
  }

  const empresa = empresas[0];
  console.log(`✅ Empresa encontrada:`);
  console.log(`   ID: ${empresa.id}`);
  console.log(`   Nome: ${empresa.nome}`);
  console.log("");

  // 3. Verificar vínculo usuarios_empresas
  const { data: vinculo } = await supabase
    .from("usuarios_empresas")
    .select("id, role, ativo, created_at")
    .eq("usuario_id", usuario.id)
    .eq("empresa_id", empresa.id)
    .maybeSingle();

  if (vinculo) {
    console.log(`✅ Vínculo com empresa:`);
    console.log(`   Role: ${vinculo.role}`);
    console.log(`   Ativo: ${vinculo.ativo ? "Sim" : "Não"}`);
    console.log(`   Criado em: ${vinculo.created_at}`);
  } else {
    console.log(`⚠️ Sem vínculo direto em usuarios_empresas`);
    console.log(`   (pode usar empresa_id no perfil)`);
  }
  console.log("");

  // 4. Configurações de agendamento
  const { data: config } = await supabase
    .from("agendamento_configuracoes")
    .select("*")
    .eq("professor_id", usuario.id)
    .maybeSingle();

  console.log(`📋 Configurações de agendamento:`);
  if (config) {
    console.log(`   Auto-confirmar: ${config.auto_confirmar ? "Sim" : "Não"}`);
    console.log(`   Tempo antecedência mínimo: ${config.tempo_antecedencia_minimo} min`);
    console.log(`   Tempo lembrete: ${config.tempo_lembrete_minutos} min`);
    console.log(`   Duração slot plantão: ${config.duracao_slot_plantao_minutos} min`);
    console.log(`   Link reunião padrão: ${config.link_reuniao_padrao || "(não definido)"}`);
  } else {
    console.log(`   (usando configurações padrão)`);
  }
  console.log("");

  // 5. Recorrências
  const { data: recorrencias } = await supabase
    .from("agendamento_recorrencia")
    .select("*")
    .eq("professor_id", usuario.id)
    .eq("empresa_id", empresa.id)
    .order("dia_semana")
    .order("hora_inicio");

  console.log(`📅 Recorrências cadastradas (${recorrencias?.length || 0}):`);
  const hoje = new Date().toISOString().split("T")[0];
  
  if (recorrencias?.length) {
    for (const r of recorrencias) {
      const dia = DIAS[r.dia_semana] ?? `Dia ${r.dia_semana}`;
      const ativo = r.ativo ? "✓" : "✗";
      const vigencia = r.data_fim
        ? `${r.data_inicio} a ${r.data_fim}`
        : `a partir de ${r.data_inicio}`;
      
      // Verificar se está ativo AGORA
      const dentroVigencia = r.data_inicio <= hoje && (!r.data_fim || r.data_fim >= hoje);
      const status = !r.ativo 
        ? "🔴 INATIVO" 
        : !dentroVigencia 
          ? "🟡 FORA DA VIGÊNCIA" 
          : "🟢 ATIVO";
      
      console.log(`   ${ativo} ${dia}: ${r.hora_inicio} às ${r.hora_fim}`);
      console.log(`      Serviço: ${r.tipo_servico}, Slots: ${r.duracao_slot_minutos}min`);
      console.log(`      Vigência: ${vigencia}`);
      console.log(`      Status: ${status}`);
      if (r.data_inicio > hoje) {
        console.log(`      ⚠️ COMEÇA APENAS EM ${r.data_inicio}`);
      }
    }
  } else {
    console.log(`   (nenhuma recorrência cadastrada)`);
  }
  console.log("");

  // 6. Bloqueios ativos
  const { data: bloqueios } = await supabase
    .from("agendamento_bloqueios")
    .select("*")
    .eq("empresa_id", empresa.id)
    .or(`professor_id.is.null,professor_id.eq.${usuario.id}`)
    .gte("data_fim", new Date().toISOString())
    .order("data_inicio");

  console.log(`🚫 Bloqueios ativos (${bloqueios?.length || 0}):`);
  if (bloqueios?.length) {
    for (const b of bloqueios) {
      const escopo = b.professor_id ? "Professor" : "Empresa";
      console.log(`   ${escopo}: ${b.tipo} - ${b.motivo || "(sem motivo)"}`);
      console.log(`      De: ${b.data_inicio}`);
      console.log(`      Até: ${b.data_fim}`);
    }
  } else {
    console.log(`   (nenhum bloqueio ativo)`);
  }
  console.log("");

  // 7. Agendamentos pendentes/confirmados
  const { data: agendamentos } = await supabase
    .from("agendamentos")
    .select("id, data_inicio, data_fim, status")
    .eq("professor_id", usuario.id)
    .in("status", ["pendente", "confirmado"])
    .gte("data_inicio", new Date().toISOString())
    .order("data_inicio")
    .limit(10);

  console.log(`📆 Próximos agendamentos (${agendamentos?.length || 0}):`);
  if (agendamentos?.length) {
    for (const a of agendamentos) {
      console.log(`   ${a.status.toUpperCase()}: ${a.data_inicio} - ${a.data_fim}`);
    }
  } else {
    console.log(`   (nenhum agendamento futuro)`);
  }
  console.log("");

  // Resumo
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📊 RESUMO DO DIAGNÓSTICO:`);
  
  const recorrenciasAtivas = (recorrencias || []).filter(r => {
    return r.ativo && r.data_inicio <= hoje && (!r.data_fim || r.data_fim >= hoje);
  });

  const recorrenciasFuturas = (recorrencias || []).filter(r => {
    return r.ativo && r.data_inicio > hoje;
  });

  if (recorrenciasAtivas.length === 0 && recorrenciasFuturas.length > 0) {
    console.log(`\n⚠️ PROBLEMA IDENTIFICADO:`);
    console.log(`   As recorrências estão cadastradas para datas FUTURAS.`);
    console.log(`   Nenhum horário está disponível para hoje (${hoje}).`);
    console.log(`\n   Próximas datas com disponibilidade:`);
    const proximasDatas = [...new Set(recorrenciasFuturas.map(r => r.data_inicio))].sort();
    for (const data of proximasDatas.slice(0, 3)) {
      console.log(`   - ${data}`);
    }
  } else if (recorrenciasAtivas.length > 0) {
    console.log(`\n✅ ${recorrenciasAtivas.length} recorrência(s) ativa(s) para hoje.`);
  } else {
    console.log(`\n❌ Nenhuma recorrência cadastrada ou ativa.`);
  }
  
  console.log("");
}

main().catch((err) => {
  console.error("❌ Erro:", err instanceof Error ? err.message : String(err));
  process.exit(99);
});
