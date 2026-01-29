"use server";

import { createClient } from "@/app/shared/core/server";
import { revalidatePath } from "next/cache";
import { validateCancellation } from "./agendamento-validations";
import type { Database } from "@/app/shared/core/database.types";

import { generateMeetingLink } from "./meeting-providers";
import {
  Agendamento,
  AgendamentoComDetalhes,
  AgendamentoFilters,
  isValidUserObject,
  VAgendamentosEmpresa,
} from "../types";
import { getConfiguracoesProfessor } from "./config-actions";
import { validateAgendamento } from "./validation-actions";

export async function createAgendamento(
  data: Omit<Agendamento, "id" | "created_at" | "updated_at">,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Ensure dates are ISO strings
  const data_inicio =
    data.data_inicio instanceof Date
      ? data.data_inicio.toISOString()
      : data.data_inicio;
  const data_fim =
    data.data_fim instanceof Date ? data.data_fim.toISOString() : data.data_fim;

  // Extra validation on client-provided data
  const validation = await validateAgendamento(
    data.professor_id,
    new Date(data_inicio),
    new Date(data_fim),
  );

  if (!validation.valid) {
    throw new Error(validation.error || "Invalid appointment request");
  }

  // Fetch professor config for auto-confirmation
  const config = await getConfiguracoesProfessor(data.professor_id);
  const autoConfirmar = config?.auto_confirmar || false;

  const payload = {
    ...data,
    aluno_id: user.id, // Direct association to logged in student
    status: autoConfirmar ? "confirmado" : "pendente",
    data_inicio,
    data_fim,
    confirmado_em: autoConfirmar ? new Date().toISOString() : null,
  };

  const { data: result, error } = await supabase
    .from("agendamentos")
    .insert(payload as Database["public"]["Tables"]["agendamentos"]["Insert"])
    .select()
    .single();

  if (error) {
    console.error("Error creating appointment:", error);
    throw new Error("Failed to create appointment");
  }

  revalidatePath("/agendamentos");
  revalidatePath("/meus-agendamentos");
  revalidatePath("/agendamentos");
  return result;
}

export async function getAgendamentosProfessor(
  professorId: string,
  filters?: AgendamentoFilters,
): Promise<AgendamentoComDetalhes[]> {
  const supabase = await createClient();

  // First, fetch agendamentos without join to avoid RLS issues on alunos table
  let query = supabase
    .from("agendamentos")
    .select("*")
    .eq("professor_id", professorId);

  if (filters?.status) {
    if (Array.isArray(filters.status)) {
      query = query.in("status", filters.status);
    } else {
      query = query.eq("status", filters.status);
    }
  }

  if (filters?.dateStart) {
    query = query.gte("data_inicio", filters.dateStart.toISOString());
  }

  if (filters?.dateEnd) {
    query = query.lte("data_inicio", filters.dateEnd.toISOString());
  }

  const { data: agendamentos, error } = await query.order("data_inicio", {
    ascending: true,
  });

  if (error) {
    console.error("Error fetching professor appointments:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return [];
  }

  if (!agendamentos || agendamentos.length === 0) {
    return [];
  }

  // Fetch aluno data separately to handle RLS gracefully
  const alunoIds = [...new Set(agendamentos.map((a) => a.aluno_id))];
  const { data: alunos, error: alunosError } = await supabase
    .from("usuarios")
    .select("id, nome_completo, email")
    .in("id", alunoIds);

  if (alunosError) {
    console.error("Error fetching alunos data:", {
      message: alunosError.message,
      code: alunosError.code,
      details: alunosError.details,
      hint: alunosError.hint,
    });
    // Continue without aluno data rather than failing entirely
  }

  const alunosMap = new Map(
    (alunos || []).map((aluno) => [aluno.id, aluno]),
  );

  return agendamentos.map((item) => {
    const aluno = alunosMap.get(item.aluno_id);
    const alunoData = aluno
      ? {
          id: aluno.id,
          nome: aluno.nome_completo || "",
          email: aluno.email || "",
          avatar_url: undefined,
        }
      : undefined;

    return {
      ...item,
      status: item.status as Agendamento["status"],
      lembrete_enviado: item.lembrete_enviado ?? undefined,
      created_at: item.created_at ?? undefined,
      updated_at: item.updated_at ?? undefined,
      aluno: alunoData,
      professor: undefined,
    };
  });
}

export async function getAgendamentosAluno(
  alunoId: string,
): Promise<AgendamentoComDetalhes[]> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error("Authentication error in getAgendamentosAluno:", authError);
    return [];
  }

  if (user.id !== alunoId) {
    console.error(
      "User mismatch: authenticated user is not the same as requested aluno_id",
    );
    return [];
  }

  const { data: agendamentos, error } = await supabase
    .from("agendamentos")
    .select("*")
    .eq("aluno_id", alunoId)
    .order("data_inicio", { ascending: false });

  if (error) {
    console.error("Error fetching student appointments:", error);
    return [];
  }

  if (!agendamentos || agendamentos.length === 0) {
    return [];
  }

  const professorIds = [...new Set(agendamentos.map((a) => a.professor_id))];
  const { data: professores, error: professoresError } = await supabase
    .from("usuarios")
    .select("id, nome_completo, email, foto_url")
    .in("id", professorIds);

  if (professoresError) {
    console.error("Error fetching professores data:", professoresError);
  }

  const professoresMap = new Map(
    (professores || []).map((professor) => [professor.id, professor]),
  );

  return agendamentos.map((item) => {
    const professor = professoresMap.get(item.professor_id);
    const professorData = professor
      ? {
          id: professor.id,
          nome: professor.nome_completo || "",
          email: professor.email || "",
          avatar_url: professor.foto_url || undefined,
        }
      : undefined;

    return {
      ...item,
      status: item.status as Agendamento["status"],
      lembrete_enviado: item.lembrete_enviado ?? undefined,
      created_at: item.created_at ?? undefined,
      updated_at: item.updated_at ?? undefined,
      aluno: undefined,
      professor: professorData,
    };
  });
}

export async function getAgendamentoById(
  id: string,
): Promise<AgendamentoComDetalhes | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("agendamentos")
    .select(
      `
      *,
      aluno:usuarios!agendamentos_aluno_id_fkey(
        id,
        nome_completo,
        email
      ),
      professor:usuarios!agendamentos_professor_id_fkey(
        id,
        nome_completo,
        email,
        foto_url
      )
    `,
    )
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching appointment:", error);
    return null;
  }

  if (!data) return null;

  const aluno = isValidUserObject(data.aluno) ? data.aluno : undefined;
  const professor = isValidUserObject(data.professor)
    ? data.professor
    : undefined;

  return {
    ...data,
    status: data.status as Agendamento["status"],
    lembrete_enviado: data.lembrete_enviado ?? undefined,
    created_at: data.created_at ?? undefined,
    updated_at: data.updated_at ?? undefined,
    aluno,
    professor,
  };
}

export async function confirmarAgendamento(id: string, linkReuniao?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data: agendamento, error: fetchError } = await supabase
    .from("agendamentos")
    .select("id, professor_id, data_inicio, data_fim, aluno_id")
    .eq("id", id)
    .single();

  if (fetchError || !agendamento) {
    console.error("Error fetching appointment for confirmation:", fetchError);
    throw new Error(`Agendamento não encontrado: ${id}`);
  }

  if (agendamento.professor_id !== user.id) {
    throw new Error("Apenas o professor pode confirmar este agendamento");
  }

  let linkToUse = linkReuniao;

  if (!linkToUse) {
    try {
      const config = await getConfiguracoesProfessor(user.id);

      const { data: aluno } = await supabase
        .from("usuarios")
        .select("nome_completo, email")
        .eq("id", agendamento.aluno_id)
        .single();

      const { data: integration } = await supabase
        // @ts-expect-error - Table not in types
        .from("professor_integracoes")
        .select("*")
        .eq("professor_id", user.id)
        .single();

      const validIntegration =
        integration && !("code" in integration)
          ? (integration as unknown as {
              provider: string;
              access_token: string;
            })
          : null;

      if (
        validIntegration &&
        validIntegration.provider !== "default" &&
        validIntegration.access_token
      ) {
        const meetingLink = await generateMeetingLink(
          validIntegration.provider as "google" | "zoom" | "default",
          {
            title: `Mentoria com ${aluno?.nome_completo || "Aluno"}`,
            startTime: new Date(agendamento.data_inicio),
            endTime: new Date(agendamento.data_fim),
            description: "Sessão de mentoria agendada via Aluminify",
            attendees: aluno?.email ? [aluno.email] : [],
          },
          {
            accessToken: validIntegration.access_token,
            defaultLink: config?.link_reuniao_padrao || undefined,
          },
        );

        if (meetingLink) {
          linkToUse = meetingLink.url;
        }
      }

      if (!linkToUse && config?.link_reuniao_padrao) {
        linkToUse = config.link_reuniao_padrao;
      }
    } catch (err) {
      console.error("Error generating/fetching meeting link details:", err);
    }
  }

  const updateData: Record<string, unknown> = {
    status: "confirmado",
    confirmado_em: new Date().toISOString(),
  };

  if (linkToUse) {
    updateData.link_reuniao = linkToUse;
  }

  const { data, error } = await supabase
    .from("agendamentos")
    .update(updateData)
    .eq("id", id)
    .eq("professor_id", user.id)
    .select()
    .single();

  if (error) {
    console.error("Error confirming appointment:", error);
    throw new Error("Failed to confirm appointment");
  }

  revalidatePath("/agendamentos");
  revalidatePath("/meus-agendamentos");
  return data;
}

export async function rejeitarAgendamento(id: string, motivo: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data: agendamento, error: fetchError } = await supabase
    .from("agendamentos")
    .select("professor_id")
    .eq("id", id)
    .single();

  if (fetchError || !agendamento) {
    console.error("Error fetching appointment for rejection:", fetchError);
    throw new Error("Agendamento não encontrado");
  }

  if (agendamento.professor_id !== user.id) {
    throw new Error("Apenas o professor pode rejeitar este agendamento");
  }

  const { data, error } = await supabase
    .from("agendamentos")
    .update({
      status: "cancelado",
      motivo_cancelamento: motivo,
      cancelado_por: user.id,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error rejecting appointment:", error);
    throw new Error("Falha ao rejeitar agendamento");
  }

  revalidatePath("/agendamentos");
  revalidatePath("/meus-agendamentos");
  return data;
}

export async function cancelAgendamentoWithReason(id: string, motivo?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data: agendamento, error: fetchError } = await supabase
    .from("agendamentos")
    .select("professor_id, aluno_id, data_inicio, status")
    .eq("id", id)
    .single();

  if (fetchError || !agendamento) {
    console.error("Error fetching appointment for cancellation:", fetchError);
    throw new Error("Agendamento não encontrado");
  }

  const isOwner =
    agendamento.aluno_id === user.id || agendamento.professor_id === user.id;
  if (!isOwner) {
    throw new Error("Você não tem permissão para cancelar este agendamento");
  }

  const validationResult = validateCancellation(
    new Date(agendamento.data_inicio),
    2,
  );
  if (!validationResult.valid) {
    throw new Error(
      validationResult.error || "Não é possível cancelar este agendamento",
    );
  }

  const { error } = await supabase
    .from("agendamentos")
    .update({
      status: "cancelado",
      motivo_cancelamento: motivo || null,
      cancelado_por: user.id,
    })
    .eq("id", id);

  if (error) {
    console.error("Error cancelling appointment:", error);
    throw new Error("Falha ao cancelar agendamento");
  }

  revalidatePath("/agendamentos");
  revalidatePath("/meus-agendamentos");
  revalidatePath("/agendamentos");
  return { success: true };
}

export async function updateAgendamento(
  id: string,
  data: Partial<Agendamento>,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const {
    id: _id,
    created_at: _created_at,
    updated_at: _updated_at,
    ...restData
  } = data;

  const updateData: Record<string, unknown> = { ...restData };
  if (updateData.data_inicio instanceof Date) {
    updateData.data_inicio = updateData.data_inicio.toISOString();
  }
  if (updateData.data_fim instanceof Date) {
    updateData.data_fim = updateData.data_fim.toISOString();
  }

  const { data: result, error } = await supabase
    .from("agendamentos")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating appointment:", error);
    throw new Error("Failed to update appointment");
  }

  revalidatePath("/agendamentos");
  revalidatePath("/meus-agendamentos");
  return result;
}

export async function getAgendamentosEmpresa(
  empresaId: string,
  dateStart: Date,
  dateEnd: Date,
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    // @ts-expect-error - Table not in types
    .from("v_agendamentos_empresa")
    .select("*")
    .eq("empresa_id", empresaId)
    .gte("data_inicio", dateStart.toISOString())
    .lte("data_fim", dateEnd.toISOString())
    .order("data_inicio", { ascending: true });

  if (error) {
    console.error("Error fetching company appointments:", error);
    return [];
  }

  return ((data || []) as unknown as VAgendamentosEmpresa[]).map((item) => ({
    id: item.id,
    professor_id: item.professor_id,
    professor_nome: item.professor_nome,
    professor_foto: item.professor_foto as string | undefined,
    aluno_nome: item.aluno_nome,
    aluno_email: item.aluno_email as string | undefined,
    data_inicio: item.data_inicio,
    data_fim: item.data_fim,
    status: item.status as Agendamento["status"],
    link_reuniao: item.link_reuniao,
    observacoes: item.observacoes,
    created_at: item.created_at,
    updated_at: item.updated_at,
  }));
}

export async function getAgendamentoStats(professorId: string) {
  const supabase = await createClient();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const { data, error } = await supabase
    .from("agendamentos")
    .select("status, data_inicio")
    .eq("professor_id", professorId)
    .gte("data_inicio", startOfMonth.toISOString())
    .lte("data_inicio", endOfMonth.toISOString());

  if (error) {
    console.error("Error fetching stats:", error);
    return {
      total: 0,
      pendentes: 0,
      confirmados: 0,
      cancelados: 0,
      concluidos: 0,
    };
  }

  const stats = {
    total: data?.length || 0,
    pendentes: data?.filter((a) => a.status === "pendente").length || 0,
    confirmados: data?.filter((a) => a.status === "confirmado").length || 0,
    cancelados: data?.filter((a) => a.status === "cancelado").length || 0,
    concluidos: data?.filter((a) => a.status === "concluido").length || 0,
  };

  return stats;
}
