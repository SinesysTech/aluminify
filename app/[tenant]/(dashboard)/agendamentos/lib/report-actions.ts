"use server";

import { createClient } from "@/app/shared/core/server";
import {
  Relatorio,
  RelatorioTipo,
  DbAgendamentoRelatorio,
  RelatorioDados,
} from "./types";

export async function gerarRelatorio(
  empresaId: string,
  dataInicio: Date,
  dataFim: Date,
  tipo: RelatorioTipo,
): Promise<Relatorio> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data, error } = await supabase.functions.invoke(
    "gerar-relatorio-agendamentos",
    {
      body: {
        empresa_id: empresaId,
        data_inicio: dataInicio.toISOString().split("T")[0],
        data_fim: dataFim.toISOString().split("T")[0],
        tipo,
      },
    },
  );

  if (error) {
    console.error("Error generating report:", error);
    throw new Error("Failed to generate report");
  }

  return data.relatorio;
}

export async function getRelatorios(
  empresaId: string,
  limit?: number,
): Promise<Relatorio[]> {
  const supabase = await createClient();

  let query = supabase
    // @ts-expect-error - Table not in types
    .from("agendamento_relatorios")
    .select("*")
    .eq("empresa_id", empresaId)
    .order("gerado_em", { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching reports:", error);
    return [];
  }

  const rows = (data || []) as unknown as DbAgendamentoRelatorio[];
  return rows.map((item) => ({
    id: item.id,
    empresa_id: item.empresa_id,
    periodo_inicio: item.periodo_inicio,
    periodo_fim: item.periodo_fim,
    tipo: item.tipo as RelatorioTipo,
    dados_json: item.dados_json as RelatorioDados,
    gerado_em: item.gerado_em,
    gerado_por: item.gerado_por,
    created_at: item.created_at ?? undefined,
    updated_at: item.updated_at ?? undefined,
  }));
}

export async function getRelatorioById(id: string): Promise<Relatorio | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    // @ts-expect-error - Table not in types
    .from("agendamento_relatorios")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching report:", error);
    return null;
  }

  if (!data) return null;

  const row = data as unknown as DbAgendamentoRelatorio;
  return {
    id: row.id,
    empresa_id: row.empresa_id,
    periodo_inicio: row.periodo_inicio,
    periodo_fim: row.periodo_fim,
    tipo: row.tipo as RelatorioTipo,
    dados_json: row.dados_json as RelatorioDados,
    gerado_em: row.gerado_em,
    gerado_por: row.gerado_por,
    created_at: row.created_at ?? undefined,
    updated_at: row.updated_at ?? undefined,
  };
}
