"use server";

import { createClient } from "@/app/shared/core/server";
import { revalidatePath } from "next/cache";
import {
  ConfiguracoesProfessor,
  ProfessorIntegracao,
  DbProfessorIntegracao,
} from "../types";
import type { Database } from "@/app/shared/core/database.types";

export async function getConfiguracoesProfessor(
  professorId: string,
): Promise<ConfiguracoesProfessor | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("agendamento_configuracoes")
    .select("*")
    .eq("professor_id", professorId)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching professor config:", error);
    return null;
  }

  // Return defaults if no config exists
  if (!data) {
    return {
      professor_id: professorId,
      auto_confirmar: false,
      tempo_antecedencia_minimo: 60,
      tempo_lembrete_minutos: 1440,
      link_reuniao_padrao: null,
      mensagem_confirmacao: null,
    };
  }

  // Map database data to ensure non-nullable fields have defaults
  return {
    id: data.id,
    professor_id: data.professor_id,
    auto_confirmar: data.auto_confirmar ?? false,
    tempo_antecedencia_minimo: data.tempo_antecedencia_minimo ?? 60,
    tempo_lembrete_minutos: data.tempo_lembrete_minutos ?? 1440,
    link_reuniao_padrao: data.link_reuniao_padrao,
    mensagem_confirmacao: data.mensagem_confirmacao,
    created_at: data.created_at ?? undefined,
    updated_at: data.updated_at ?? undefined,
  };
}

export async function updateConfiguracoesProfessor(
  professorId: string,
  config: Partial<ConfiguracoesProfessor>,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.id !== professorId) {
    throw new Error("Unauthorized");
  }

  const {
    id: _id,
    created_at: _created_at,
    updated_at: _updated_at,
    ...configData
  } = config;
  void _id;
  void _created_at;
  void _updated_at;

  const { data, error } = await supabase
    .from("agendamento_configuracoes")
    .upsert({
      ...configData,
      professor_id: professorId,
    } as Database["public"]["Tables"]["agendamento_configuracoes"]["Insert"])
    .select()
    .single();

  if (error) {
    console.error("Error updating professor config:", error);
    throw new Error("Failed to update configuration");
  }

  revalidatePath("/professor/configuracoes");
  return data;
}

export async function getIntegracaoProfessor(
  professorId: string,
): Promise<ProfessorIntegracao | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    // @ts-expect-error - Table not in types - Table not in types
    .from("professor_integracoes")
    .select("*")
    .eq("professor_id", professorId)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching professor integration:", error);
    return null;
  }

  // Return defaults if no integration exists
  if (!data) {
    return {
      id: "",
      professor_id: professorId,
      provider: "default",
      access_token: null,
      refresh_token: null,
      token_expiry: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  // Map database data to ProfessorIntegracao type
  const row = data as unknown as DbProfessorIntegracao;
  return {
    id: row.id,
    professor_id: row.professor_id,
    provider: row.provider,
    access_token: row.access_token,
    refresh_token: row.refresh_token,
    token_expiry: row.token_expiry,
    created_at: row.created_at ?? undefined,
    updated_at: row.updated_at ?? undefined,
  };
}

export async function updateIntegracaoProfessor(
  professorId: string,
  integration: Partial<ProfessorIntegracao>,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.id !== professorId) {
    throw new Error("Unauthorized");
  }

  const {
    id: _id,
    created_at: _created_at,
    updated_at: _updated_at,
    ...integrationData
  } = integration;
  void _id;
  void _created_at;
  void _updated_at;

  const { data, error } = await supabase
    // @ts-expect-error - Table not in types
    .from("professor_integracoes")
    // @ts-expect-error - Table not in types
    .upsert({
      ...integrationData,
      professor_id: professorId,
      provider: integrationData.provider || "default",
    } as Record<string, unknown>)
    .select()
    .single();

  if (error) {
    console.error("Error updating professor integration:", error);
    throw new Error("Failed to update integration");
  }

  revalidatePath("/professor/configuracoes");
  return data;
}
