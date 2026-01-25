"use server";

import { createClient } from "@/app/shared/core/server";
import { revalidatePath } from "next/cache";
import { Recorrencia, DbAgendamentoRecorrencia, Bloqueio } from "./types";
import type { Database } from "@/app/shared/core/database.types";

export async function getRecorrencias(
  professorId: string,
): Promise<Recorrencia[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.id !== professorId) {
    throw new Error("Unauthorized");
  }

  const { data, error } = await supabase
    .from("agendamento_recorrencia")
    .select("*")
    .eq("professor_id", professorId)
    .order("dia_semana", { ascending: true })
    .order("hora_inicio", { ascending: true });

  if (error) {
    console.error("Error fetching recorrencias:", error);
    throw new Error("Failed to fetch recorrencias");
  }

  return ((data || []) as unknown as DbAgendamentoRecorrencia[]).map(
    (item) => ({
      id: item.id,
      professor_id: item.professor_id,
      empresa_id: item.empresa_id,
      tipo_servico: item.tipo_servico as "plantao" | "mentoria",
      data_inicio: item.data_inicio,
      data_fim: item.data_fim,
      dia_semana: item.dia_semana,
      hora_inicio: item.hora_inicio,
      hora_fim: item.hora_fim,
      duracao_slot_minutos: item.duracao_slot_minutos as number,
      ativo: item.ativo,
      created_at: item.created_at ?? undefined,
      updated_at: item.updated_at ?? undefined,
    }),
  );
}

export async function createRecorrencia(
  data: Omit<Recorrencia, "id" | "created_at" | "updated_at">,
): Promise<Recorrencia> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.id !== data.professor_id) {
    throw new Error("Unauthorized");
  }

  const payload = {
    professor_id: data.professor_id,
    empresa_id: data.empresa_id,
    tipo_servico: data.tipo_servico,
    data_inicio: data.data_inicio,
    data_fim: data.data_fim || null,
    dia_semana: data.dia_semana,
    hora_inicio: data.hora_inicio,
    hora_fim: data.hora_fim,
    duracao_slot_minutos: data.duracao_slot_minutos,
    ativo: data.ativo ?? true,
  };

  const { data: result, error } = await supabase
    .from("agendamento_recorrencia")
    .insert(
      payload as Database["public"]["Tables"]["agendamento_recorrencia"]["Insert"],
    )
    .select()
    .single();

  if (error) {
    console.error("Error creating recorrencia:", error);
    throw new Error("Failed to create recorrencia");
  }

  revalidatePath("/professor/disponibilidade");
  revalidatePath("/agendamentos");

  const typedResult = result as unknown as DbAgendamentoRecorrencia;
  return {
    id: typedResult.id,
    professor_id: typedResult.professor_id,
    empresa_id: typedResult.empresa_id,
    tipo_servico: typedResult.tipo_servico as "plantao" | "mentoria",
    data_inicio: typedResult.data_inicio,
    data_fim: typedResult.data_fim,
    dia_semana: typedResult.dia_semana,
    hora_inicio: typedResult.hora_inicio,
    hora_fim: typedResult.hora_fim,
    duracao_slot_minutos: typedResult.duracao_slot_minutos as number,
    ativo: typedResult.ativo,
    created_at: typedResult.created_at ?? undefined,
    updated_at: typedResult.updated_at ?? undefined,
  };
}

export async function updateRecorrencia(
  id: string,
  data: Partial<
    Omit<
      Recorrencia,
      "id" | "professor_id" | "empresa_id" | "created_at" | "updated_at"
    >
  >,
): Promise<Recorrencia> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data: existing } = await supabase
    .from("agendamento_recorrencia")
    .select("professor_id")
    .eq("id", id)
    .single();

  if (!existing || existing.professor_id !== user.id) {
    throw new Error("Unauthorized");
  }

  const updateData: Record<string, unknown> = {};
  if (data.tipo_servico !== undefined)
    updateData.tipo_servico = data.tipo_servico;
  if (data.data_inicio !== undefined) updateData.data_inicio = data.data_inicio;
  if (data.data_fim !== undefined) updateData.data_fim = data.data_fim;
  if (data.dia_semana !== undefined) updateData.dia_semana = data.dia_semana;
  if (data.hora_inicio !== undefined) updateData.hora_inicio = data.hora_inicio;
  if (data.hora_fim !== undefined) updateData.hora_fim = data.hora_fim;
  if (data.duracao_slot_minutos !== undefined)
    updateData.duracao_slot_minutos = data.duracao_slot_minutos;
  if (data.ativo !== undefined) updateData.ativo = data.ativo;

  const { data: result, error } = await supabase
    .from("agendamento_recorrencia")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating recorrencia:", error);
    throw new Error("Failed to update recorrencia");
  }

  revalidatePath("/professor/disponibilidade");
  revalidatePath("/agendamentos");

  const typedResult = result as unknown as DbAgendamentoRecorrencia;
  return {
    id: typedResult.id,
    professor_id: typedResult.professor_id,
    empresa_id: typedResult.empresa_id,
    tipo_servico: typedResult.tipo_servico,
    data_inicio: typedResult.data_inicio,
    data_fim: typedResult.data_fim,
    dia_semana: typedResult.dia_semana,
    hora_inicio: typedResult.hora_inicio,
    hora_fim: typedResult.hora_fim,
    duracao_slot_minutos: typedResult.duracao_slot_minutos as number,
    ativo: typedResult.ativo,
    created_at: typedResult.created_at ?? undefined,
    updated_at: typedResult.updated_at ?? undefined,
  };
}

export async function deleteRecorrencia(
  id: string,
): Promise<{ success: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data: existing } = await supabase
    .from("agendamento_recorrencia")
    .select("professor_id")
    .eq("id", id)
    .single();

  if (!existing || existing.professor_id !== user.id) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase
    .from("agendamento_recorrencia")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting recorrencia:", error);
    throw new Error("Failed to delete recorrencia");
  }

  revalidatePath("/professor/disponibilidade");
  revalidatePath("/agendamentos");
  return { success: true };
}

export async function getBloqueios(
  professorId?: string,
  empresaId?: string,
): Promise<Bloqueio[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  let query = supabase
    .from("agendamento_bloqueios")
    .select("*")
    .order("data_inicio", { ascending: true });

  if (empresaId) {
    query = query.eq("empresa_id", empresaId);
  }

  if (professorId) {
    query = query.or(`professor_id.is.null,professor_id.eq.${professorId}`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching bloqueios:", error);
    throw new Error("Failed to fetch bloqueios");
  }

  return (data || []).map((item) => ({
    id: item.id,
    professor_id: item.professor_id,
    empresa_id: item.empresa_id,
    tipo: item.tipo as "feriado" | "recesso" | "imprevisto" | "outro",
    data_inicio: item.data_inicio,
    data_fim: item.data_fim,
    motivo: item.motivo,
    criado_por: item.criado_por,
    created_at: item.created_at,
    updated_at: item.updated_at,
  }));
}

export async function createBloqueio(
  data: Omit<Bloqueio, "id" | "created_at" | "updated_at">,
): Promise<Bloqueio> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  if (data.professor_id && data.professor_id !== user.id) {
    throw new Error("Unauthorized");
  }

  const dataInicio =
    typeof data.data_inicio === "string"
      ? data.data_inicio
      : data.data_inicio.toISOString();
  const dataFim =
    typeof data.data_fim === "string"
      ? data.data_fim
      : data.data_fim.toISOString();

  const payload = {
    professor_id: data.professor_id || null,
    empresa_id: data.empresa_id,
    tipo: data.tipo,
    data_inicio: dataInicio,
    data_fim: dataFim,
    motivo: data.motivo || null,
    criado_por: user.id,
  };

  const { data: result, error } = await supabase
    .from("agendamento_bloqueios")
    .insert(
      payload as Database["public"]["Tables"]["agendamento_bloqueios"]["Insert"],
    )
    .select()
    .single();

  if (error) {
    console.error("Error creating bloqueio:", error);
    throw new Error("Failed to create bloqueio");
  }

  if (result.professor_id) {
    await supabase
      .from("agendamentos")
      .update({
        status: "cancelado",
        motivo_cancelamento: `Bloqueio de agenda: ${data.motivo || "Sem motivo especificado"}`,
      })
      .eq("professor_id", result.professor_id)
      .in("status", ["pendente", "confirmado"])
      .lt("data_inicio", dataFim)
      .gt("data_fim", dataInicio);
  } else {
    const { data: professores } = await supabase
      .from("professores")
      .select("id")
      .eq("empresa_id", data.empresa_id);

    if (professores && professores.length > 0) {
      const professorIds = professores.map((p) => p.id);
      await supabase
        .from("agendamentos")
        .update({
          status: "cancelado",
          motivo_cancelamento: `Bloqueio de agenda: ${data.motivo || "Sem motivo especificado"}`,
        })
        .in("professor_id", professorIds)
        .in("status", ["pendente", "confirmado"])
        .lt("data_inicio", dataFim)
        .gt("data_fim", dataInicio);
    }
  }

  revalidatePath("/professor/agendamentos");
  revalidatePath("/agendamentos");

  return {
    id: result.id,
    professor_id: result.professor_id,
    empresa_id: result.empresa_id,
    tipo: result.tipo as "feriado" | "recesso" | "imprevisto" | "outro",
    data_inicio: result.data_inicio,
    data_fim: result.data_fim,
    motivo: result.motivo,
    criado_por: result.criado_por,
    created_at: result.created_at,
    updated_at: result.updated_at,
  };
}

export async function updateBloqueio(
  id: string,
  data: Partial<
    Omit<
      Bloqueio,
      "id" | "empresa_id" | "criado_por" | "created_at" | "updated_at"
    >
  >,
): Promise<Bloqueio> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data: existing } = await supabase
    .from("agendamento_bloqueios")
    .select("professor_id, empresa_id")
    .eq("id", id)
    .single();

  if (!existing) {
    throw new Error("Bloqueio not found");
  }

  if (existing.professor_id && existing.professor_id !== user.id) {
    throw new Error("Unauthorized");
  }

  const updateData: Record<string, unknown> = {};
  if (data.professor_id !== undefined)
    updateData.professor_id = data.professor_id || null;
  if (data.tipo !== undefined) updateData.tipo = data.tipo;
  if (data.data_inicio !== undefined) {
    updateData.data_inicio =
      typeof data.data_inicio === "string"
        ? data.data_inicio
        : data.data_inicio.toISOString();
  }
  if (data.data_fim !== undefined) {
    updateData.data_fim =
      typeof data.data_fim === "string"
        ? data.data_fim
        : data.data_fim.toISOString();
  }
  if (data.motivo !== undefined) updateData.motivo = data.motivo || null;

  const { data: result, error } = await supabase
    .from("agendamento_bloqueios")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating bloqueio:", error);
    throw new Error("Failed to update bloqueio");
  }

  revalidatePath("/professor/agendamentos");
  revalidatePath("/agendamentos");

  return {
    id: result.id,
    professor_id: result.professor_id,
    empresa_id: result.empresa_id,
    tipo: result.tipo as "feriado" | "recesso" | "imprevisto" | "outro",
    data_inicio: result.data_inicio,
    data_fim: result.data_fim,
    motivo: result.motivo,
    criado_por: result.criado_por,
    created_at: result.created_at,
    updated_at: result.updated_at,
  };
}

export async function deleteBloqueio(
  id: string,
): Promise<{ success: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data: existing } = await supabase
    .from("agendamento_bloqueios")
    .select("professor_id")
    .eq("id", id)
    .single();

  if (!existing) {
    throw new Error("Bloqueio not found");
  }

  if (existing.professor_id && existing.professor_id !== user.id) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase
    .from("agendamento_bloqueios")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting bloqueio:", error);
    throw new Error("Failed to delete bloqueio");
  }

  revalidatePath("/professor/agendamentos");
  revalidatePath("/agendamentos");
  return { success: true };
}
