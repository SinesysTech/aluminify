/**
 * Mastra Tools
 *
 * Tools that can be used by Mastra agents to interact with the system.
 * Each tool receives execution context including the user information.
 */

import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { getDatabaseClient } from "@/app/shared/core/database/database";

export interface ToolContext {
  userId: string;
  empresaId: string | null;
  userRole: "aluno" | "usuario" | "superadmin";
}

/**
 * Creates all Mastra tools with the given user context
 */
export function createMastraTools(context: ToolContext) {
  const { userId, empresaId, userRole } = context;

  // Tool 1: Get server time
  const getServerTime = createTool({
    id: "getServerTime",
    description:
      "Retorna a data e hora atual do servidor. Use para saudações ou quando o usuário perguntar que horas são.",
    inputSchema: z.object({}),
    outputSchema: z.object({
      timestamp: z.string(),
      formatted: z.string(),
    }),
    execute: async () => {
      const now = new Date();
      return {
        timestamp: now.toISOString(),
        formatted: now.toLocaleString("pt-BR", {
          timeZone: "America/Sao_Paulo",
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
    },
  });

  // Tool 2: Search courses
  const searchCourses = createTool({
    id: "searchCourses",
    description:
      "Busca cursos disponíveis. Pode filtrar por nome ou listar todos os cursos da empresa.",
    inputSchema: z.object({
      searchTerm: z
        .string()
        .optional()
        .describe(
          "Termo de busca opcional para filtrar cursos pelo nome. Deixe vazio para listar todos."
        ),
      limit: z
        .number()
        .optional()
        .default(10)
        .describe("Número máximo de resultados (padrão: 10)"),
    }),
    outputSchema: z.object({
      courses: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          description: z.string().nullable(),
          modality: z.string().nullable(),
          type: z.string().nullable(),
          year: z.number().nullable(),
        })
      ),
      total: z.number(),
      searchTerm: z.string().nullable(),
    }),
    execute: async (inputData) => {
      const client = getDatabaseClient();
      const { searchTerm, limit = 10 } = inputData;

      let query = client
        .from("cursos")
        .select("id, nome, descricao, modalidade, tipo, ano_vigencia")
        .order("nome", { ascending: true })
        .limit(limit);

      // Filter by empresa for multi-tenant isolation
      if (empresaId) {
        query = query.eq("empresa_id", empresaId);
      }

      // Filter by search term if provided
      if (searchTerm && searchTerm.trim()) {
        query = query.ilike("nome", `%${searchTerm.trim()}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error("[Mastra Tool] searchCourses error:", error);
        throw new Error(`Erro ao buscar cursos: ${error.message}`);
      }

      return {
        courses:
          data?.map((course) => ({
            id: course.id,
            name: course.nome,
            description: course.descricao,
            modality: course.modalidade,
            type: course.tipo,
            year: course.ano_vigencia,
          })) ?? [],
        total: data?.length ?? 0,
        searchTerm: searchTerm || null,
      };
    },
  });

  // Tool 3: Get student progress
  const getStudentProgress = createTool({
    id: "getStudentProgress",
    description:
      "Obtém o progresso de atividades de um aluno. Mostra estatísticas de atividades concluídas, em andamento e pendentes.",
    inputSchema: z.object({
      studentId: z
        .string()
        .optional()
        .describe(
          "ID do aluno (opcional - se não fornecido, usa o usuário atual se for aluno)"
        ),
    }),
    outputSchema: z.object({
      student: z.object({
        id: z.string(),
        name: z.string(),
        email: z.string(),
      }),
      statistics: z.object({
        total: z.number(),
        pendentes: z.number(),
        emAndamento: z.number(),
        concluidas: z.number(),
        percentualConclusao: z.number(),
      }),
      message: z.string(),
    }),
    execute: async (inputData) => {
      // Determine which student to query
      let targetStudentId = inputData.studentId;

      // If no studentId provided and current user is a student, use their ID
      if (!targetStudentId && userRole === "aluno") {
        targetStudentId = userId;
      }

      // Students can only view their own progress
      if (userRole === "aluno" && targetStudentId !== userId) {
        throw new Error("Alunos só podem visualizar seu próprio progresso.");
      }

      if (!targetStudentId) {
        throw new Error("ID do aluno é necessário para buscar o progresso.");
      }

      const client = getDatabaseClient();

      // Get student info
      const { data: studentData, error: studentError } = await client
        .from("alunos")
        .select("id, nome_completo, email, empresa_id")
        .eq("id", targetStudentId)
        .maybeSingle();

      if (studentError || !studentData) {
        throw new Error("Aluno não encontrado.");
      }

      // Verify tenant access for non-superadmin
      if (
        userRole !== "superadmin" &&
        empresaId &&
        studentData.empresa_id !== empresaId
      ) {
        throw new Error("Você não tem permissão para visualizar este aluno.");
      }

      // Get progress data
      const { data: progressData, error: progressError } = await client
        .from("progresso_atividades")
        .select("id, status, data_inicio, data_conclusao, atividade_id")
        .eq("aluno_id", targetStudentId);

      if (progressError) {
        console.error(
          "[Mastra Tool] getStudentProgress error:",
          progressError
        );
        throw new Error(`Erro ao buscar progresso: ${progressError.message}`);
      }

      // Calculate statistics
      const stats = {
        total: progressData?.length ?? 0,
        pendentes: 0,
        emAndamento: 0,
        concluidas: 0,
      };

      for (const p of progressData ?? []) {
        if (p.status === "Pendente") stats.pendentes++;
        else if (p.status === "Iniciado") stats.emAndamento++;
        else if (p.status === "Concluido") stats.concluidas++;
      }

      const percentualConclusao =
        stats.total > 0
          ? Math.round((stats.concluidas / stats.total) * 100)
          : 0;

      return {
        student: {
          id: studentData.id,
          name: studentData.nome_completo,
          email: studentData.email,
        },
        statistics: {
          ...stats,
          percentualConclusao,
        },
        message:
          stats.total === 0
            ? "Nenhuma atividade registrada ainda."
            : `${stats.concluidas} de ${stats.total} atividades concluídas (${percentualConclusao}%)`,
      };
    },
  });

  // Tool 4: Search students (admin only)
  const searchStudents = createTool({
    id: "searchStudents",
    description:
      "Busca alunos pelo nome ou email. Apenas administradores e usuários da empresa podem usar esta ação.",
    inputSchema: z.object({
      searchTerm: z.string().describe("Nome ou email do aluno para buscar"),
      limit: z
        .number()
        .optional()
        .default(10)
        .describe("Número máximo de resultados (padrão: 10)"),
    }),
    outputSchema: z.object({
      students: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          email: z.string(),
          createdAt: z.string(),
        })
      ),
      total: z.number(),
      searchTerm: z.string(),
    }),
    execute: async (inputData) => {
      // Permission check: only usuarios and superadmin can search students
      if (userRole === "aluno") {
        throw new Error("Apenas administradores podem buscar alunos.");
      }

      const { searchTerm, limit = 10 } = inputData;

      if (!searchTerm || !searchTerm.trim()) {
        throw new Error("Termo de busca é obrigatório.");
      }

      const client = getDatabaseClient();
      const term = searchTerm.trim();

      let query = client
        .from("alunos")
        .select("id, nome_completo, email, created_at")
        .is("deleted_at", null)
        .or(`nome_completo.ilike.%${term}%,email.ilike.%${term}%`)
        .order("nome_completo", { ascending: true })
        .limit(limit);

      // Filter by empresa for multi-tenant isolation (unless superadmin)
      if (userRole !== "superadmin" && empresaId) {
        query = query.eq("empresa_id", empresaId);
      }

      const { data, error } = await query;

      if (error) {
        console.error("[Mastra Tool] searchStudents error:", error);
        throw new Error(`Erro ao buscar alunos: ${error.message}`);
      }

      return {
        students:
          data?.map((student) => ({
            id: student.id,
            name: student.nome_completo,
            email: student.email,
            createdAt: student.created_at,
          })) ?? [],
        total: data?.length ?? 0,
        searchTerm: term,
      };
    },
  });

  return {
    getServerTime,
    searchCourses,
    getStudentProgress,
    searchStudents,
  };
}
