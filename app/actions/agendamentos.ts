"use server";

import { createClient } from "@/lib/server";
import type { Database } from "@/lib/database.types";
import { revalidatePath } from "next/cache";
import {
  validateCancellation,
  validateAppointment,
  generateAvailableSlots,
} from "@/lib/agendamento-validations";
import { generateMeetingLink } from "@/lib/meeting-providers";

// =============================================
// Type Aliases from Generated Database Types
// =============================================

// Tables that exist in the schema - use these for type inference
type DbAgendamentoRecorrencia =
  Database["public"]["Tables"]["agendamento_recorrencia"]["Row"];
type DbAgendamentoBloqueio =
  Database["public"]["Tables"]["agendamento_bloqueios"]["Row"];
type DbAgendamento = Database["public"]["Tables"]["agendamentos"]["Row"];
type DbAgendamentoConfiguracoes =
  Database["public"]["Tables"]["agendamento_configuracoes"]["Row"];

// Enums from schema
type TipoBloqueioEnum = Database["public"]["Enums"]["enum_tipo_bloqueio"];
type TipoServicoEnum =
  Database["public"]["Enums"]["enum_tipo_servico_agendamento"];

// Suppress unused variable warnings - these types document the schema
void (0 as unknown as DbAgendamento);
void (0 as unknown as DbAgendamentoConfiguracoes);
void (0 as unknown as TipoBloqueioEnum);
void (0 as unknown as TipoServicoEnum);

// =============================================
// Types for tables NOT in generated schema
// These require 'as any' casts when used with Supabase client
// TODO: Apply migrations and regenerate types to remove these
// =============================================

/**
 * View for company-wide appointments - not in generated schema
 * Migration: needs to be created or schema regenerated
 */
type VAgendamentosEmpresa = {
  id: string;
  professor_id: string;
  aluno_id: string;
  data_inicio: string;
  data_fim: string;
  status: string;
  empresa_id: string;
  professor_nome?: string;
  professor_foto?: string;
  aluno_nome?: string;
  aluno_email?: string;
  link_reuniao?: string | null;
  observacoes?: string | null;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
};

/**
 * Professor integrations table - not in generated schema
 * Migration: 20260117_create_professor_integracoes.sql needs to be applied
 */
type DbProfessorIntegracao = {
  id: string;
  professor_id: string;
  provider: "google" | "zoom" | "default";
  access_token: string | null;
  refresh_token: string | null;
  token_expiry: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * Reports table - not in generated schema
 * Migration: 20260117_create_agendamento_relatorios.sql needs to be applied
 */
type DbAgendamentoRelatorio = {
  id: string;
  empresa_id: string;
  periodo_inicio: string;
  periodo_fim: string;
  tipo: "mensal" | "semanal" | "customizado";
  dados_json: unknown; // Cast to RelatorioDados when using
  gerado_em: string;
  gerado_por: string;
  created_at?: string;
  updated_at?: string;
};

export type Disponibilidade = {
  id?: string;
  professor_id?: string;
  dia_semana: number; // 0-6
  hora_inicio: string; // HH:MM
  hora_fim: string; // HH:MM
  ativo: boolean;
};

export type Agendamento = {
  id?: string;
  professor_id: string;
  aluno_id: string;
  data_inicio: string | Date;
  data_fim: string | Date;
  status: "pendente" | "confirmado" | "cancelado" | "concluido";
  link_reuniao?: string | null;
  observacoes?: string | null;
  motivo_cancelamento?: string | null;
  cancelado_por?: string | null;
  confirmado_em?: string | null;
  lembrete_enviado?: boolean;
  lembrete_enviado_em?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type AgendamentoComDetalhes = Agendamento & {
  aluno?: {
    id: string;
    nome: string;
    email: string;
    avatar_url?: string | null;
  };
  professor?: {
    id: string;
    nome: string;
    email: string;
    avatar_url?: string | null;
  };
};

export type ConfiguracoesProfessor = {
  id?: string;
  professor_id?: string;
  auto_confirmar: boolean;
  tempo_antecedencia_minimo: number; // minutes
  tempo_lembrete_minutos: number; // minutes
  link_reuniao_padrao?: string | null;
  mensagem_confirmacao?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type AgendamentoFilters = {
  status?: string | string[];
  dateStart?: Date;
  dateEnd?: Date;
};

export type AgendamentoNotificacao = {
  id?: string;
  agendamento_id: string;
  tipo:
    | "criacao"
    | "confirmacao"
    | "cancelamento"
    | "lembrete"
    | "alteracao"
    | "rejeicao";
  destinatario_id: string;
  enviado: boolean;
  enviado_em?: string | null;
  erro?: string | null;
  created_at?: string;
};

export type Recorrencia = {
  id?: string;
  professor_id: string;
  empresa_id: string;
  tipo_servico: "plantao" | "mentoria";
  data_inicio: string; // YYYY-MM-DD
  data_fim?: string | null; // YYYY-MM-DD, null = indefinida
  dia_semana: number; // 0-6
  hora_inicio: string; // HH:MM
  hora_fim: string; // HH:MM
  duracao_slot_minutos: number; // 15, 30, 45, or 60
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
};

export type Bloqueio = {
  id?: string;
  professor_id?: string | null; // null = bloqueio para toda empresa
  empresa_id: string;
  tipo: "feriado" | "recesso" | "imprevisto" | "outro";
  data_inicio: string | Date;
  data_fim: string | Date;
  motivo?: string | null;
  criado_por: string;
  created_at?: string;
  updated_at?: string;
};

export async function getDisponibilidade(professorId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("agendamento_disponibilidade")
    .select("*")
    .eq("professor_id", professorId)
    .eq("ativo", true);

  if (error) {
    console.error("Error fetching availability:", error);
    return [];
  }

  return data;
}

export async function upsertDisponibilidade(data: Disponibilidade) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Fetch professor's empresa_id
  const { data: professor } = await supabase
    .from("professores")
    .select("empresa_id")
    .eq("id", user.id)
    .single();

  const empresaId = professor?.empresa_id;

  if (!empresaId) {
    throw new Error("Professor company not found");
  }

  const payload: Database["public"]["Tables"]["agendamento_disponibilidade"]["Insert"] =
    {
      ...data,
      professor_id: user.id,
      empresa_id: empresaId,
      ativo: data.ativo,
    };

  const { error } = await supabase
    .from("agendamento_disponibilidade")
    .upsert(payload)
    .select();

  if (error) {
    console.error("Error upserting availability:", error);
    throw new Error("Failed to update availability");
  }

  revalidatePath("/agendamentos");
  return { success: true };
}

export async function getAgendamentos(
  professorId: string,
  start: Date,
  end: Date,
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("agendamentos")
    .select("*")
    .eq("professor_id", professorId)
    .gte("data_inicio", start.toISOString())
    .lte("data_fim", end.toISOString())
    .neq("status", "cancelado"); // Usually want to see occupied slots

  if (error) {
    console.error("Error fetching appointments:", error);
    return [];
  }

  return data;
}

export async function createAgendamento(
  data: Omit<Agendamento, "id" | "created_at" | "updated_at" | "status">,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Load professor configuration
  const config = await getConfiguracoesProfessor(data.professor_id);
  const minAdvanceMinutes = config?.tempo_antecedencia_minimo || 60;

  // Validate appointment using the validation library
  const dataInicio = new Date(data.data_inicio);
  const dataFim = new Date(data.data_fim);
  const dateOnly = dataInicio.toISOString().split("T")[0]; // YYYY-MM-DD format
  const dayOfWeek = dataInicio.getUTCDay();

  // Get availability rules from agendamento_recorrencia for validation
  // Note: agendamento_recorrencia não está no schema atual, usando tipo genérico
  type RecorrenciaRule = {
    dia_semana: number;
    hora_inicio: string;
    hora_fim: string;
    ativo: boolean;
    data_inicio: string;
    data_fim: string | null;
    professor_id: string;
  };

  const { data: rulesData } = await supabase
    .from("agendamento_recorrencia")
    .select("*")
    .eq("professor_id", data.professor_id)
    .eq("dia_semana", dayOfWeek)
    .eq("ativo", true)
    .lte("data_inicio", dateOnly)
    .or(`data_fim.is.null,data_fim.gte.${dateOnly}`);

  // Filter and map rules to ensure ativo is boolean
  const rules = ((rulesData || []) as RecorrenciaRule[])
    .filter((r) => r.ativo === true)
    .map((r) => ({
      dia_semana: r.dia_semana,
      hora_inicio: r.hora_inicio,
      hora_fim: r.hora_fim,
      ativo: r.ativo,
    }));

  // Get existing bookings for conflict check
  const { data: bookings } = await supabase
    .from("agendamentos")
    .select("data_inicio, data_fim")
    .eq("professor_id", data.professor_id)
    .neq("status", "cancelado");

  const existingSlots = (bookings || []).map((b) => ({
    start: new Date(b.data_inicio),
    end: new Date(b.data_fim),
  }));

  // Get bloqueios for this professor and date
  const { data: professor } = await supabase
    .from("professores")
    .select("empresa_id")
    .eq("id", data.professor_id)
    .single();

  type ProfessorRow = {
    empresa_id: string | null;
  };
  const empresaId = (professor as ProfessorRow)?.empresa_id;

  if (empresaId) {
    type BloqueioRow = {
      data_inicio: string;
      data_fim: string;
    };
    const { data: bloqueios } = await supabase
      .from("agendamento_bloqueios")
      .select("data_inicio, data_fim")
      .eq("empresa_id", empresaId)
      .or(`professor_id.is.null,professor_id.eq.${data.professor_id}`)
      .lte("data_inicio", dataFim.toISOString())
      .gte("data_fim", dataInicio.toISOString());

    // Add bloqueios to existing slots to exclude them
    const blockedSlots = ((bloqueios || []) as BloqueioRow[]).map((b) => ({
      start: new Date(b.data_inicio),
      end: new Date(b.data_fim),
    }));

    existingSlots.push(...blockedSlots);
  }

  // Validate appointment - filter and map rules to ensure ativo is boolean
  const validRules = rules.filter((r) => r.ativo === true);

  const validationResult = validateAppointment(
    { start: dataInicio, end: dataFim },
    {
      rules: validRules,
      existingSlots,
      minAdvanceMinutes,
    },
  );

  if (!validationResult.valid) {
    throw new Error(validationResult.error || "Invalid appointment");
  }

  // Determine initial status based on auto_confirmar setting
  const initialStatus = config?.auto_confirmar ? "confirmado" : "pendente";
  const confirmadoEm = config?.auto_confirmar ? new Date().toISOString() : null;

  // Garantir que as datas sejam strings ISO para o banco
  const payload: Database["public"]["Tables"]["agendamentos"]["Insert"] = {
    ...data,
    professor_id: data.professor_id,
    aluno_id: user.id,
    data_inicio:
      typeof data.data_inicio === "string"
        ? data.data_inicio
        : dataInicio.toISOString(),
    data_fim:
      typeof data.data_fim === "string" ? data.data_fim : dataFim.toISOString(),
    status: initialStatus,
    confirmado_em: confirmadoEm,
    observacoes: data.observacoes || null,
    link_reuniao: data.link_reuniao || null,
    empresa_id: empresaId || "",
  };

  const { data: result, error } = await supabase
    .from("agendamentos")
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error("Error creating appointment:", error);
    throw new Error(error.message || "Falha ao criar agendamento");
  }

  revalidatePath("/agendamentos");
  return result;
}

export async function cancelAgendamento(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Verify ownership - user must be either aluno or professor of the appointment
  const { data: agendamento } = await supabase
    .from("agendamentos")
    .select("professor_id, aluno_id")
    .eq("id", id)
    .single();

  if (!agendamento) {
    throw new Error("Agendamento nao encontrado");
  }

  const isOwner =
    agendamento.aluno_id === user.id || agendamento.professor_id === user.id;
  if (!isOwner) {
    throw new Error("Voce nao tem permissao para cancelar este agendamento");
  }

  const { error } = await supabase
    .from("agendamentos")
    .update({
      status: "cancelado",
      cancelado_por: user.id,
    })
    .eq("id", id);

  if (error) {
    console.error("Error cancelling appointment:", error);
    throw new Error("Falha ao cancelar agendamento");
  }

  revalidatePath("/agendamentos");
  revalidatePath("/meus-agendamentos");
  revalidatePath("/professor/agendamentos");
  return { success: true };
}

export async function getAvailableSlots(professorId: string, dateStr: string) {
  const supabase = await createClient();

  const date = new Date(dateStr);
  const dayOfWeek = date.getUTCDay(); // 0-6
  const dateOnly = dateStr.split("T")[0]; // YYYY-MM-DD format

  // Get professor configuration for minimum advance time
  const config = await getConfiguracoesProfessor(professorId);
  const minAdvanceMinutes = config?.tempo_antecedencia_minimo || 60;

  // Get availability rules from agendamento_recorrencia
  // Filtrar por data_inicio <= dateStr <= data_fim (ou data_fim IS NULL)
  const { data: rulesData } = await supabase
    .from("agendamento_recorrencia")
    .select("*")
    .eq("professor_id", professorId)
    .eq("dia_semana", dayOfWeek)
    .eq("ativo", true)
    .lte("data_inicio", dateOnly)
    .or(`data_fim.is.null,data_fim.gte.${dateOnly}`);

  // Filter and map rules to ensure ativo is boolean
  const rules = ((rulesData || []) as DbAgendamentoRecorrencia[])
    .filter((r) => r.ativo === true)
    .map((r) => ({
      dia_semana: r.dia_semana,
      hora_inicio: r.hora_inicio,
      hora_fim: r.hora_fim,
      ativo: r.ativo,
      duracao_slot_minutos: r.duracao_slot_minutos || 30,
    }));

  if (!rules || rules.length === 0) {
    return [];
  }

  // Get existing bookings
  const startOfDay = new Date(dateStr);
  startOfDay.setUTCHours(0, 0, 0, 0);
  const endOfDay = new Date(dateStr);
  endOfDay.setUTCHours(23, 59, 59, 999);

  const { data: bookings } = await supabase
    .from("agendamentos")
    .select("*")
    .eq("professor_id", professorId)
    .gte("data_inicio", startOfDay.toISOString())
    .lte("data_fim", endOfDay.toISOString())
    .neq("status", "cancelado");

  const existingSlots = (bookings || []).map((b) => ({
    start: new Date(b.data_inicio),
    end: new Date(b.data_fim),
  }));

  // Get bloqueios for this professor and date
  const { data: professor } = await supabase
    .from("professores")
    .select("empresa_id")
    .eq("id", professorId)
    .single();

  type ProfessorRow = {
    empresa_id: string | null;
  };
  const empresaId = (professor as ProfessorRow)?.empresa_id;

  let bloqueios: Array<{ data_inicio: string; data_fim: string }> = [];
  if (empresaId) {
    const { data: bloqueiosData } = await supabase
      .from("agendamento_bloqueios")
      .select("data_inicio, data_fim")
      .eq("empresa_id", empresaId)
      .or(`professor_id.is.null,professor_id.eq.${professorId}`)
      .lte("data_inicio", endOfDay.toISOString())
      .gte("data_fim", startOfDay.toISOString());

    bloqueios = (bloqueiosData as DbAgendamentoBloqueio[]) || [];
  }

  // Add bloqueios to existing slots to exclude them
  const blockedSlots = bloqueios.map((b) => ({
    start: new Date(b.data_inicio),
    end: new Date(b.data_fim),
  }));

  const allBlockedSlots = [...existingSlots, ...blockedSlots];

  // Use the validation library to generate available slots
  // Filter rules to ensure ativo is boolean
  const validRules = rules.filter((r) => r.ativo === true);

  // Use the first rule's slot duration (or default to 30)
  const slotDuration = validRules[0]?.duracao_slot_minutos || 30;

  const slots = generateAvailableSlots(
    date,
    validRules,
    allBlockedSlots,
    slotDuration,
    minAdvanceMinutes,
  );

  return {
    slots: slots.map((slot) => slot.toISOString()),
    slotDurationMinutes: slotDuration,
  };
}

// Legacy function for backwards compatibility - returns only slot strings
export async function getAvailableSlotsLegacy(
  professorId: string,
  dateStr: string,
): Promise<string[]> {
  const result = await getAvailableSlots(professorId, dateStr);

  // Type guard para garantir que result tem a estrutura esperada
  if (
    result &&
    typeof result === "object" &&
    "slots" in result &&
    Array.isArray(result.slots)
  ) {
    return result.slots as string[];
  }

  return [];
}

// Get availability summary for a month (which days have available slots)
export async function getAvailabilityForMonth(
  professorId: string,
  year: number,
  month: number, // 1-12
): Promise<{ [date: string]: { hasSlots: boolean; slotCount: number } }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {};
  }

  // Get professor's empresa_id
  const { data: professor } = await supabase
    .from("professores")
    .select("empresa_id")
    .eq("id", professorId)
    .single();

  if (!professor?.empresa_id) {
    return {};
  }

  // Get recorrencias for this professor
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0);

  const { data: recorrencias } = await supabase
    .from("agendamento_recorrencia")
    .select("*")
    .eq("professor_id", professorId)
    .eq("ativo", true)
    .or(
      `data_fim.is.null,data_fim.gte.${monthStart.toISOString().split("T")[0]}`,
    )
    .lte("data_inicio", monthEnd.toISOString().split("T")[0]);

  if (!recorrencias || recorrencias.length === 0) {
    return {};
  }

  // Create a map of day of week -> recorrencias
  const dayRecorrencias: { [dayOfWeek: number]: boolean } = {};
  for (const rec of recorrencias) {
    dayRecorrencias[rec.dia_semana] = true;
  }

  // Get existing appointments for the month
  const { data: appointments } = await supabase
    .from("agendamentos")
    .select("data_inicio")
    .eq("professor_id", professorId)
    .in("status", ["pendente", "confirmado"])
    .gte("data_inicio", monthStart.toISOString())
    .lte("data_inicio", monthEnd.toISOString());

  // Count appointments per date
  const appointmentCounts: { [date: string]: number } = {};
  for (const apt of appointments || []) {
    const dateKey = new Date(apt.data_inicio).toISOString().split("T")[0];
    appointmentCounts[dateKey] = (appointmentCounts[dateKey] || 0) + 1;
  }

  // Build availability map for each day of the month
  const availability: {
    [date: string]: { hasSlots: boolean; slotCount: number };
  } = {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let day = 1; day <= monthEnd.getDate(); day++) {
    const date = new Date(year, month - 1, day);
    const dateKey = date.toISOString().split("T")[0];
    const dayOfWeek = date.getUTCDay();

    // Skip past dates
    if (date < today) {
      continue;
    }

    // Check if this day has recorrencias
    if (dayRecorrencias[dayOfWeek]) {
      // Estimate slot count (simplified - actual count would need full slot generation)
      const existingCount = appointmentCounts[dateKey] || 0;
      // Assume about 8-16 slots per day on average, minus existing appointments
      const estimatedSlots = Math.max(0, 10 - existingCount);
      availability[dateKey] = {
        hasSlots: estimatedSlots > 0,
        slotCount: estimatedSlots,
      };
    }
  }

  return availability;
}

// =============================================
// Professor Dashboard Functions
// =============================================

// Helper function to check if a value is a valid aluno/professor object
function isValidUserObject(obj: unknown): obj is {
  id: string;
  nome: string;
  email: string;
  avatar_url?: string | null;
} {
  return (
    typeof obj === "object" &&
    obj !== null &&
    !("code" in obj) &&
    "id" in obj &&
    "nome" in obj &&
    "email" in obj
  );
}

export async function getAgendamentosProfessor(
  professorId: string,
  filters?: AgendamentoFilters,
): Promise<AgendamentoComDetalhes[]> {
  const supabase = await createClient();

  // Primeiro, buscar os agendamentos
  let query = supabase
    .from("agendamentos")
    .select("*")
    .eq("professor_id", professorId)
    .order("data_inicio", { ascending: true });

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

  const { data: agendamentos, error } = await query;

  if (error) {
    console.error("Error fetching professor appointments:", error);
    return [];
  }

  if (!agendamentos || agendamentos.length === 0) {
    return [];
  }

  // Buscar dados dos alunos em lote
  const alunoIds = [...new Set(agendamentos.map((a) => a.aluno_id))];
  const { data: alunos, error: alunosError } = await supabase
    .from("alunos")
    .select("id, nome_completo, email")
    .in("id", alunoIds);

  if (alunosError) {
    console.error("Error fetching alunos data:", alunosError);
  }

  // Criar um mapa de alunos por ID
  const alunosMap = new Map((alunos || []).map((aluno) => [aluno.id, aluno]));

  // Combinar agendamentos com dados dos alunos
  return agendamentos.map((item) => {
    const aluno = alunosMap.get(item.aluno_id);
    const alunoData = aluno
      ? {
          id: aluno.id,
          nome: aluno.nome_completo || "",
          email: aluno.email || "",
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

  // Verificar autenticação do usuário
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error("Authentication error in getAgendamentosAluno:", authError);
    return [];
  }

  // Verificar se o usuário autenticado é o mesmo que está buscando os agendamentos
  if (user.id !== alunoId) {
    console.error(
      "User mismatch: authenticated user is not the same as requested aluno_id",
    );
    return [];
  }

  // Buscar agendamentos primeiro
  const { data: agendamentos, error } = await supabase
    .from("agendamentos")
    .select("*")
    .eq("aluno_id", alunoId)
    .order("data_inicio", { ascending: false });

  if (error) {
    console.error("Error fetching student appointments:", {
      message: error.message || "No message",
      details: error.details || "No details",
      hint: error.hint || "No hint",
      code: error.code || "No code",
      alunoId,
      userId: user.id,
      errorObject: JSON.stringify(error),
    });
    return [];
  }

  if (!agendamentos || agendamentos.length === 0) {
    return [];
  }

  // Buscar dados dos professores em lote
  const professorIds = [...new Set(agendamentos.map((a) => a.professor_id))];
  const { data: professores, error: professoresError } = await supabase
    .from("professores")
    .select("id, nome_completo, email, foto_url")
    .in("id", professorIds);

  if (professoresError) {
    console.error("Error fetching professores data:", professoresError);
  }

  // Criar um mapa de professores por ID
  const professoresMap = new Map(
    (professores || []).map((professor) => [professor.id, professor]),
  );

  // Combinar agendamentos com dados dos professores
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
      aluno:alunos!agendamentos_aluno_id_fkey(
        id, 
        nome_completo,
        email
      ),
      professor:professores!agendamentos_professor_id_fkey(
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

// =============================================
// Appointment Status Management
// =============================================

export async function confirmarAgendamento(id: string, linkReuniao?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Get agendamento details for meeting link generation
  const { data: agendamento } = await supabase
    .from("agendamentos")
    .select(
      `
      id,
      data_inicio,
      data_fim,
      professor_id,
      aluno_id,
      aluno:alunos!agendamentos_aluno_id_fkey(nome, email)
    `,
    )
    .eq("id", id)
    .single();

  if (!agendamento) {
    throw new Error("Agendamento nao encontrado");
  }

  // Verify that user is the professor of this appointment
  if (agendamento.professor_id !== user.id) {
    throw new Error("Apenas o professor pode confirmar este agendamento");
  }

  let linkToUse = linkReuniao;

  // If no explicit link provided, try to generate one or use default
  if (!linkToUse) {
    // Load professor configuration for default link
    const config = await getConfiguracoesProfessor(user.id);

    // Load professor integration settings
    const { data: integration } = await supabase
      // Next build estava falhando porque os tipos do Supabase não incluem essa tabela
      // (provavelmente o `Database` gerado está desatualizado). Em runtime a tabela existe.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from("professor_integracoes" as any)
      .select("*")
      .eq("professor_id", user.id)
      .single();

    // Try to generate meeting link if provider is configured
    const validIntegration =
      integration && !("code" in integration)
        ? (integration as unknown as { provider: string; access_token: string })
        : null;
    if (
      validIntegration &&
      validIntegration.provider !== "default" &&
      validIntegration.access_token
    ) {
      try {
        type AlunoData = {
          nome: string;
          email: string;
        } | null;
        // A tipagem do Supabase pode retornar SelectQueryError quando a relation não está no `Database` gerado.
        // Em runtime, quando vem corretamente, é um objeto com { nome, email }.
        const alunoRaw = agendamento.aluno as unknown;
        const alunoData: AlunoData =
          alunoRaw &&
          typeof alunoRaw === "object" &&
          !("code" in (alunoRaw as Record<string, unknown>))
            ? (alunoRaw as AlunoData)
            : null;
        const meetingLink = await generateMeetingLink(
          validIntegration.provider as "google" | "zoom" | "default",
          {
            title: `Mentoria com ${alunoData?.nome || "Aluno"}`,
            startTime: new Date(agendamento.data_inicio),
            endTime: new Date(agendamento.data_fim),
            description: "Sessão de mentoria agendada via Aluminify",
            attendees: alunoData?.email ? [alunoData.email] : [],
          },
          {
            accessToken: validIntegration.access_token,
            defaultLink: config?.link_reuniao_padrao || undefined,
          },
        );

        if (meetingLink) {
          linkToUse = meetingLink.url;
        }
      } catch (error) {
        console.error("Error generating meeting link:", error);
        // Fall back to default link if generation fails
      }
    }

    // Use default link if no link was generated
    if (!linkToUse && config?.link_reuniao_padrao) {
      linkToUse = config.link_reuniao_padrao;
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

  // Notification is created by database trigger notify_agendamento_change()
  // No need to create manually here to avoid duplicates

  revalidatePath("/professor/agendamentos");
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

  // Verify ownership first for better error message
  const { data: agendamento } = await supabase
    .from("agendamentos")
    .select("professor_id")
    .eq("id", id)
    .single();

  if (!agendamento) {
    throw new Error("Agendamento nao encontrado");
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

  // Notification is created by database trigger notify_agendamento_change()
  // No need to create manually here to avoid duplicates

  revalidatePath("/professor/agendamentos");
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

  // First get the agendamento to validate cancellation and ownership
  const { data: agendamento } = await supabase
    .from("agendamentos")
    .select("professor_id, aluno_id, data_inicio, status")
    .eq("id", id)
    .single();

  if (!agendamento) {
    throw new Error("Agendamento nao encontrado");
  }

  // Verify ownership - user must be either aluno or professor of the appointment
  const isOwner =
    agendamento.aluno_id === user.id || agendamento.professor_id === user.id;
  if (!isOwner) {
    throw new Error("Voce nao tem permissao para cancelar este agendamento");
  }

  // Validate cancellation timing (2 hours minimum)
  const validationResult = validateCancellation(
    new Date(agendamento.data_inicio),
    2,
  );
  if (!validationResult.valid) {
    throw new Error(
      validationResult.error || "Nao e possivel cancelar este agendamento",
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

  // Notification is created by database trigger notify_agendamento_change()
  // No need to create manually here to avoid duplicates

  revalidatePath("/professor/agendamentos");
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

  // Remove fields that shouldn't be updated directly and convert dates to strings
  const {
    id: _id,
    created_at: _created_at,
    updated_at: _updated_at,
    ...restData
  } = data;
  void _id;
  void _created_at;
  void _updated_at;

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

  revalidatePath("/professor/agendamentos");
  revalidatePath("/meus-agendamentos");
  return result;
}

// =============================================
// Professor Configuration Functions
// =============================================

export type ProfessorIntegracao = {
  id?: string;
  professor_id?: string;
  provider: "google" | "zoom" | "default";
  access_token?: string | null;
  refresh_token?: string | null;
  token_expiry?: string | null;
  created_at?: string;
  updated_at?: string;
};

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
    // Tipos do Supabase podem estar desatualizados e não conter essa tabela
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from("professor_integracoes" as any)
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
      professor_id: professorId,
      provider: "default",
      access_token: null,
      refresh_token: null,
      token_expiry: null,
    };
  }

  // Map database data to ProfessorIntegracao type
  // Table not in generated schema, using local type definition
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
    // Tipos do Supabase podem estar desatualizados e não conter essa tabela
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from("professor_integracoes" as any)
    .upsert({
      ...integrationData,
      professor_id: professorId,
      provider: integrationData.provider || "default",
    })
    .select()
    .single();

  if (error) {
    console.error("Error updating professor integration:", error);
    throw new Error("Failed to update integration");
  }

  revalidatePath("/professor/configuracoes");
  return data;
}

// =============================================
// Shared Calendar Functions
// =============================================

export async function getProfessoresDisponibilidade(
  empresaId: string,
  date: Date,
) {
  const supabase = await createClient();
  const dateStr = date.toISOString().split("T")[0];
  const dayOfWeek = date.getUTCDay();

  // Get all professors from the company
  const { data: professores } = await supabase
    .from("professores")
    .select("id, nome_completo, foto_url")
    .eq("empresa_id", empresaId);

  if (!professores || professores.length === 0) {
    return [];
  }

  const professorIds = professores.map((p) => p.id);

  // Get availability patterns for all professors
  const { data: recorrencias } = await supabase
    .from("agendamento_recorrencia")
    .select("*")
    .in("professor_id", professorIds)
    .eq("dia_semana", dayOfWeek)
    .eq("ativo", true)
    .lte("data_inicio", dateStr)
    .or(`data_fim.is.null,data_fim.gte.${dateStr}`);

  // Get bloqueios for all professors
  const startOfDay = new Date(date);
  startOfDay.setUTCHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setUTCHours(23, 59, 59, 999);

  const { data: bloqueios } = await supabase
    .from("agendamento_bloqueios")
    .select("professor_id, data_inicio, data_fim")
    .eq("empresa_id", empresaId)
    .or(`professor_id.is.null,professor_id.in.(${professorIds.join(",")})`)
    .lte("data_inicio", endOfDay.toISOString())
    .gte("data_fim", startOfDay.toISOString());

  // Get existing appointments (reuse startOfDay and endOfDay from above)

  const { data: agendamentos } = await supabase
    .from("agendamentos")
    .select("professor_id, data_inicio, data_fim")
    .in("professor_id", professorIds)
    .gte("data_inicio", startOfDay.toISOString())
    .lte("data_fim", endOfDay.toISOString())
    .neq("status", "cancelado");

  // Build result for each professor
  const result = professores.map((professor) => {
    const profRecorrencias = (
      (recorrencias || []) as DbAgendamentoRecorrencia[]
    ).filter((r) => r.professor_id === professor.id);
    const profBloqueios = ((bloqueios || []) as DbAgendamentoBloqueio[]).filter(
      (b) => !b.professor_id || b.professor_id === professor.id,
    );
    type AgendamentoRow = {
      professor_id: string;
      data_inicio: string;
      data_fim: string;
    };
    const profAgendamentos = ((agendamentos || []) as AgendamentoRow[]).filter(
      (a) => a.professor_id === professor.id,
    );

    // Generate available slots for this professor
    const rules = profRecorrencias.map((r) => ({
      dia_semana: r.dia_semana,
      hora_inicio: r.hora_inicio,
      hora_fim: r.hora_fim,
      ativo: r.ativo,
    }));

    const existingSlots = profAgendamentos.map((a) => ({
      start: new Date(a.data_inicio),
      end: new Date(a.data_fim),
    }));

    const blockedSlots = profBloqueios.map((b) => ({
      start: new Date(b.data_inicio),
      end: new Date(b.data_fim),
    }));

    const allBlockedSlots = [...existingSlots, ...blockedSlots];

    const slotDuration = profRecorrencias[0]?.duracao_slot_minutos || 30;

    const slots = generateAvailableSlots(
      date,
      rules,
      allBlockedSlots,
      slotDuration,
      60, // min advance
    );

    return {
      professor_id: professor.id,
      nome: professor.nome_completo,
      foto: professor.foto_url,
      slots_disponiveis: slots.map((s) => s.toISOString()),
    };
  });

  return result;
}

export async function getAgendamentosEmpresa(
  empresaId: string,
  dateStart: Date,
  dateEnd: Date,
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    // View pode não estar presente no `Database` gerado
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from("v_agendamentos_empresa" as any)
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

// =============================================
// Availability Management
// =============================================

export async function deleteDisponibilidade(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase
    .from("agendamento_disponibilidade")
    .delete()
    .eq("id", id)
    .eq("professor_id", user.id);

  if (error) {
    console.error("Error deleting availability:", error);
    throw new Error("Failed to delete availability");
  }

  revalidatePath("/professor/disponibilidade");
  revalidatePath("/agendamentos");
  return { success: true };
}

export async function bulkUpsertDisponibilidade(items: Disponibilidade[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const payload = items.map((item) => ({
    ...item,
    professor_id: user.id,
  }));

  const { error } = await supabase
    .from("agendamento_disponibilidade")
    .upsert(
      payload as Database["public"]["Tables"]["agendamento_disponibilidade"]["Insert"][],
    );

  if (error) {
    console.error("Error bulk upserting availability:", error);
    throw new Error("Failed to update availability");
  }

  revalidatePath("/professor/disponibilidade");
  revalidatePath("/agendamentos");
  return { success: true };
}

// =============================================
// Recorrência Management
// =============================================

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

  type RecorrenciaRow = DbAgendamentoRecorrencia & {
    empresa_id: string;
    tipo_servico: "plantao" | "mentoria";
    created_at?: string | null;
    updated_at?: string | null;
  };
  return ((data || []) as unknown as RecorrenciaRow[]).map((item) => ({
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
  }));
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

  type RecorrenciaRow = DbAgendamentoRecorrencia & {
    empresa_id: string;
    tipo_servico: "plantao" | "mentoria";
    created_at?: string | null;
    updated_at?: string | null;
  };
  const typedResult = result as unknown as RecorrenciaRow;
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

  // Verify ownership
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

  type RecorrenciaRow = DbAgendamentoRecorrencia & {
    empresa_id: string;
    tipo_servico: "plantao" | "mentoria";
    created_at?: string | null;
    updated_at?: string | null;
  };
  const typedResult = result as unknown as RecorrenciaRow;
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

  // Verify ownership
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

// =============================================
// Bloqueios Management
// =============================================

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

  // Verify user has permission (professor_id must be null or match user.id)
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

  // If blocking affects existing appointments, cancel them
  // Proper range overlap check: appointment starts before bloqueio ends AND appointment ends after bloqueio starts
  // This catches all overlap cases: partial start, partial end, full containment, exact match
  if (result.professor_id) {
    const { error: cancelError } = await supabase
      .from("agendamentos")
      .update({
        status: "cancelado",
        motivo_cancelamento: `Bloqueio de agenda: ${data.motivo || "Sem motivo especificado"}`,
      })
      .eq("professor_id", result.professor_id)
      .in("status", ["pendente", "confirmado"])
      .lt("data_inicio", dataFim) // Appointment starts before bloqueio ends
      .gt("data_fim", dataInicio); // Appointment ends after bloqueio starts

    if (cancelError) {
      console.error("Error cancelling affected appointments:", cancelError);
    }
  } else {
    // Company-wide bloqueio - cancel all affected appointments
    const { data: professores } = await supabase
      .from("professores")
      .select("id")
      .eq("empresa_id", data.empresa_id);

    if (professores && professores.length > 0) {
      const professorIds = professores.map((p) => p.id);
      const { error: cancelError } = await supabase
        .from("agendamentos")
        .update({
          status: "cancelado",
          motivo_cancelamento: `Bloqueio de agenda: ${data.motivo || "Sem motivo especificado"}`,
        })
        .in("professor_id", professorIds)
        .in("status", ["pendente", "confirmado"])
        .lt("data_inicio", dataFim) // Appointment starts before bloqueio ends
        .gt("data_fim", dataInicio); // Appointment ends after bloqueio starts

      if (cancelError) {
        console.error("Error cancelling affected appointments:", cancelError);
      }
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

  // Verify ownership
  const { data: existing } = await supabase
    .from("agendamento_bloqueios")
    .select("professor_id, empresa_id")
    .eq("id", id)
    .single();

  if (!existing) {
    throw new Error("Bloqueio not found");
  }

  // User must own the bloqueio (professor_id matches) or be admin updating company bloqueio
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

  // Verify ownership
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

// =============================================
// Conflict Detection & Validation
// =============================================

export async function checkConflitos(
  professorId: string,
  dataInicio: Date,
  dataFim: Date,
): Promise<boolean> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("agendamentos")
    .select("id")
    .eq("professor_id", professorId)
    .neq("status", "cancelado")
    .or(
      `and(data_inicio.lt.${dataFim.toISOString()},data_fim.gt.${dataInicio.toISOString()})`,
    )
    .limit(1);

  if (error) {
    console.error("Error checking conflicts:", error);
    return false;
  }

  return (data?.length || 0) > 0;
}

export async function validateAgendamento(
  professorId: string,
  dataInicio: Date,
  dataFim: Date,
): Promise<{ valid: boolean; error?: string }> {
  const supabase = await createClient();

  // Check minimum advance time
  const config = await getConfiguracoesProfessor(professorId);
  const minAdvanceMinutes = config?.tempo_antecedencia_minimo || 60;
  const now = new Date();
  const minAllowedTime = new Date(
    now.getTime() + minAdvanceMinutes * 60 * 1000,
  );

  if (dataInicio < minAllowedTime) {
    return {
      valid: false,
      error: `O agendamento deve ser feito com pelo menos ${minAdvanceMinutes} minutos de antecedência.`,
    };
  }

  // Check for conflicts
  const hasConflict = await checkConflitos(professorId, dataInicio, dataFim);
  if (hasConflict) {
    return {
      valid: false,
      error: "Já existe um agendamento neste horário.",
    };
  }

  // Check if within availability (using agendamento_recorrencia table)
  const dayOfWeek = dataInicio.getUTCDay();
  const dateStr = dataInicio.toISOString().split("T")[0];

  const { data: recorrencias } = await supabase
    .from("agendamento_recorrencia")
    .select("*")
    .eq("professor_id", professorId)
    .eq("dia_semana", dayOfWeek)
    .eq("ativo", true)
    .lte("data_inicio", dateStr)
    .or(`data_fim.is.null,data_fim.gte.${dateStr}`);

  if (!recorrencias || recorrencias.length === 0) {
    return {
      valid: false,
      error: "O professor nao tem disponibilidade neste dia.",
    };
  }

  const timeToMinutes = (timeStr: string) => {
    const [h, m] = timeStr.split(":").map(Number);
    return h * 60 + m;
  };

  const startMinutes =
    dataInicio.getUTCHours() * 60 + dataInicio.getUTCMinutes();
  const endMinutes = dataFim.getUTCHours() * 60 + dataFim.getUTCMinutes();

  const isWithinAvailability = recorrencias.some((rec) => {
    const ruleStart = timeToMinutes(rec.hora_inicio);
    const ruleEnd = timeToMinutes(rec.hora_fim);
    return startMinutes >= ruleStart && endMinutes <= ruleEnd;
  });

  if (!isWithinAvailability) {
    return {
      valid: false,
      error: "O horario selecionado esta fora da disponibilidade do professor.",
    };
  }

  // Check for bloqueios
  const { data: bloqueios } = await supabase
    .from("agendamento_bloqueios")
    .select("id")
    .or(`professor_id.is.null,professor_id.eq.${professorId}`)
    .lt("data_inicio", dataFim.toISOString())
    .gt("data_fim", dataInicio.toISOString())
    .limit(1);

  if (bloqueios && bloqueios.length > 0) {
    return {
      valid: false,
      error: "O horario selecionado esta bloqueado pelo professor.",
    };
  }

  return { valid: true };
}

// Note: Notifications are now handled by database trigger notify_agendamento_change()
// The manual _createNotificacao function was removed to avoid duplicates

// =============================================
// Reports Functions
// =============================================

export type RelatorioTipo = "mensal" | "semanal" | "customizado";

export type RelatorioDados = {
  total_agendamentos: number;
  por_status: {
    confirmado: number;
    cancelado: number;
    concluido: number;
    pendente: number;
  };
  por_professor: Array<{
    professor_id: string;
    nome: string;
    total: number;
    taxa_comparecimento: number;
  }>;
  taxa_ocupacao: number;
  horarios_pico: string[];
  taxa_nao_comparecimento: number;
};

export type Relatorio = {
  id: string;
  empresa_id: string;
  periodo_inicio: string;
  periodo_fim: string;
  tipo: RelatorioTipo;
  dados_json: RelatorioDados;
  gerado_em: string;
  gerado_por: string;
  created_at?: string;
  updated_at?: string;
};

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

  // Call Edge Function to generate report
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
    // Tipos do Supabase podem estar desatualizados e não conter essa tabela
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from("agendamento_relatorios" as any)
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

  // Table not in generated schema, using local type definition
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
    // Tipos do Supabase podem estar desatualizados e não conter essa tabela
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from("agendamento_relatorios" as any)
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching report:", error);
    return null;
  }

  if (!data) return null;

  // Table not in generated schema, using local type definition
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

// =============================================
// Statistics
// =============================================

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

// =============================================
// Professor Selection Functions
// =============================================

export type ProfessorDisponivel = {
  id: string;
  nome: string;
  email: string;
  foto_url?: string | null;
  especialidade?: string | null;
  bio?: string | null;
  empresa_id: string;
  proximos_slots: string[]; // ISO strings of next available slots
  tem_disponibilidade: boolean;
};

export async function getProfessoresDisponiveis(
  empresaId?: string,
): Promise<ProfessorDisponivel[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // If no empresaId provided, try to get from aluno's enrolled courses
  let targetEmpresaId = empresaId;
  if (!targetEmpresaId) {
    const { data: alunoData } = await supabase
      .from("alunos")
      .select("empresa_id")
      .eq("id", user.id)
      .single();

    if (alunoData?.empresa_id) {
      targetEmpresaId = alunoData.empresa_id;
    } else {
      // Try to get empresa from enrolled courses
      const { data: cursosData } = await supabase
        .from("alunos_cursos")
        .select("cursos(empresa_id)")
        .eq("aluno_id", user.id)
        .limit(1)
        .single();

      type CursoWithEmpresa = { cursos: { empresa_id: string } | null };
      const cursoData = cursosData as unknown as CursoWithEmpresa;
      if (cursoData?.cursos?.empresa_id) {
        targetEmpresaId = cursoData.cursos.empresa_id;
      }
    }
  }

  if (!targetEmpresaId) {
    console.warn("No empresa_id found for user");
    return [];
  }

  // Get all professors from the company
  const { data: professores, error } = await supabase
    .from("professores")
    .select(
      "id, nome_completo, email, foto_url, especialidade, biografia, empresa_id",
    )
    .eq("empresa_id", targetEmpresaId)
    .order("nome_completo", { ascending: true });

  if (error) {
    console.error("Error fetching professors:", error);
    return [];
  }

  if (!professores || professores.length === 0) {
    return [];
  }

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextWeekStr = nextWeek.toISOString().split("T")[0];

  // Get recorrencias for all professors
  const professorIds = professores.map((p) => p.id);
  const { data: recorrencias } = await supabase
    .from("agendamento_recorrencia")
    .select(
      "professor_id, dia_semana, hora_inicio, hora_fim, duracao_slot_minutos, data_inicio, data_fim",
    )
    .in("professor_id", professorIds)
    .eq("ativo", true)
    .lte("data_inicio", nextWeekStr)
    .or(`data_fim.is.null,data_fim.gte.${todayStr}`);

  // Get existing appointments for next week
  const { data: agendamentos } = await supabase
    .from("agendamentos")
    .select("professor_id, data_inicio, data_fim")
    .in("professor_id", professorIds)
    .gte("data_inicio", today.toISOString())
    .lte("data_inicio", nextWeek.toISOString())
    .neq("status", "cancelado");

  // Get bloqueios for next week
  const { data: bloqueios } = await supabase
    .from("agendamento_bloqueios")
    .select("professor_id, data_inicio, data_fim")
    .eq("empresa_id", targetEmpresaId)
    .lte("data_inicio", nextWeek.toISOString())
    .gte("data_fim", today.toISOString());

  // Build result for each professor
  const result: ProfessorDisponivel[] = professores.map((professor) => {
    const profRecorrencias = (
      (recorrencias || []) as DbAgendamentoRecorrencia[]
    ).filter((r) => r.professor_id === professor.id);

    const profAgendamentos = (agendamentos || [])
      .filter((a) => a.professor_id === professor.id)
      .map((a) => ({
        start: new Date(a.data_inicio),
        end: new Date(a.data_fim),
      }));

    const profBloqueios = ((bloqueios || []) as DbAgendamentoBloqueio[])
      .filter((b) => !b.professor_id || b.professor_id === professor.id)
      .map((b) => ({
        start: new Date(b.data_inicio),
        end: new Date(b.data_fim),
      }));

    const allBlockedSlots = [...profAgendamentos, ...profBloqueios];

    // Find next available slots (up to 3)
    const proximosSlots: string[] = [];
    const checkDate = new Date(today);
    let daysChecked = 0;

    while (proximosSlots.length < 3 && daysChecked < 14) {
      const dayOfWeek = checkDate.getUTCDay();
      const dateStr = checkDate.toISOString().split("T")[0];

      const dayRules = profRecorrencias.filter(
        (r) =>
          r.dia_semana === dayOfWeek &&
          r.data_inicio <= dateStr &&
          (!r.data_fim || r.data_fim >= dateStr),
      );

      if (dayRules.length > 0) {
        const rules = dayRules.map((r) => ({
          dia_semana: r.dia_semana,
          hora_inicio: r.hora_inicio,
          hora_fim: r.hora_fim,
          ativo: true,
        }));

        const slotDuration = dayRules[0]?.duracao_slot_minutos || 30;
        const slots = generateAvailableSlots(
          checkDate,
          rules,
          allBlockedSlots,
          slotDuration,
          60, // min advance
        );

        for (const slot of slots) {
          if (proximosSlots.length < 3) {
            proximosSlots.push(slot.toISOString());
          }
        }
      }

      checkDate.setDate(checkDate.getDate() + 1);
      daysChecked++;
    }

    return {
      id: professor.id,
      nome: professor.nome_completo || "",
      email: professor.email || "",
      foto_url: professor.foto_url,
      especialidade: professor.especialidade,
      bio: professor.biografia,
      empresa_id: professor.empresa_id,
      proximos_slots: proximosSlots,
      tem_disponibilidade: profRecorrencias.length > 0,
    };
  });

  // Sort: professors with availability first, then by name
  return result.sort((a, b) => {
    if (a.tem_disponibilidade && !b.tem_disponibilidade) return -1;
    if (!a.tem_disponibilidade && b.tem_disponibilidade) return 1;
    if (a.proximos_slots.length > 0 && b.proximos_slots.length === 0) return -1;
    if (a.proximos_slots.length === 0 && b.proximos_slots.length > 0) return 1;
    return a.nome.localeCompare(b.nome);
  });
}

export async function getProfessorById(
  professorId: string,
): Promise<ProfessorDisponivel | null> {
  const supabase = await createClient();

  const { data: professor, error } = await supabase
    .from("professores")
    .select(
      "id, nome_completo, email, foto_url, especialidade, biografia, empresa_id",
    )
    .eq("id", professorId)
    .single();

  if (error || !professor) {
    console.error("Error fetching professor:", error);
    return null;
  }

  // Check if professor has any active recorrencias
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  const { data: recorrencias } = await supabase
    .from("agendamento_recorrencia")
    .select("id")
    .eq("professor_id", professorId)
    .eq("ativo", true)
    .lte("data_inicio", todayStr)
    .or(`data_fim.is.null,data_fim.gte.${todayStr}`)
    .limit(1);

  return {
    id: professor.id,
    nome: professor.nome_completo || "",
    email: professor.email || "",
    foto_url: professor.foto_url,
    especialidade: professor.especialidade,
    bio: professor.biografia,
    empresa_id: professor.empresa_id,
    proximos_slots: [],
    tem_disponibilidade: (recorrencias?.length || 0) > 0,
  };
}
