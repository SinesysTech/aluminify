/**
 * CopilotKit Backend Actions
 *
 * These actions are executed server-side and have access to
 * the authenticated user context (userId, empresaId, userRole).
 *
 * All actions that query data must filter by empresaId for multi-tenant isolation.
 * Sensitive actions should check userRole for proper authorization.
 */

import { getDatabaseClient } from "@/app/shared/core/database/database";

export interface ActionContext {
  userId: string;
  empresaId: string | null;
  userRole: "aluno" | "usuario" | "superadmin";
}

/**
 * Creates the CopilotKit actions array with the given user context
 */
export function createCopilotKitActions(context: ActionContext) {
  const { userId, empresaId, userRole } = context;

  return [
    // Action 1: Get server time (simple test action)
    {
      name: "getServerTime",
      description:
        "Retorna a data e hora atual do servidor. Use para saudações ou quando o usuário perguntar que horas são.",
      parameters: [],
      handler: async () => {
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
    },

    // Action 2: Search courses
    {
      name: "searchCourses",
      description:
        "Busca cursos disponíveis. Pode filtrar por nome ou listar todos os cursos da empresa.",
      parameters: [
        {
          name: "searchTerm",
          type: "string",
          description:
            "Termo de busca opcional para filtrar cursos pelo nome. Deixe vazio para listar todos.",
          required: false,
        },
        {
          name: "limit",
          type: "number",
          description: "Número máximo de resultados (padrão: 10)",
          required: false,
        },
      ],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      handler: async ({ searchTerm, limit = 10 }: any) => {
        const client = getDatabaseClient();

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
          console.error("[CopilotKit Action] searchCourses error:", error);
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
    },

    // Action 3: Get student progress
    {
      name: "getStudentProgress",
      description:
        "Obtém o progresso de atividades de um aluno. Mostra estatísticas de atividades concluídas, em andamento e pendentes.",
      parameters: [
        {
          name: "studentId",
          type: "string",
          description:
            "ID do aluno (opcional - se não fornecido, usa o usuário atual se for aluno)",
          required: false,
        },
      ],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      handler: async ({ studentId }: any) => {
        // Determine which student to query
        let targetStudentId = studentId;

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
            "[CopilotKit Action] getStudentProgress error:",
            progressError,
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
    },

    // Action 4: Search students (admin only)
    {
      name: "searchStudents",
      description:
        "Busca alunos pelo nome ou email. Apenas administradores e usuários da empresa podem usar esta ação.",
      parameters: [
        {
          name: "searchTerm",
          type: "string",
          description: "Nome ou email do aluno para buscar",
          required: true,
        },
        {
          name: "limit",
          type: "number",
          description: "Número máximo de resultados (padrão: 10)",
          required: false,
        },
      ],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      handler: async ({ searchTerm, limit = 10 }: any) => {
        // Permission check: only usuarios and superadmin can search students
        if (userRole === "aluno") {
          throw new Error("Apenas administradores podem buscar alunos.");
        }

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
          console.error("[CopilotKit Action] searchStudents error:", error);
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
    },
  ];
}
