"use client";

import { CopilotKit } from "@copilotkit/react-core";
import { ReactNode } from "react";

interface CopilotProviderProps {
  children: ReactNode;
  /**
   * Contexto do usuário para selecionar o agente correto
   * - "student": Para área do aluno (studentAgent)
   * - "institution": Para área da instituição (institutionAgent)
   */
  context?: "student" | "institution";
}

/**
 * Mapeamento de contexto para rotas do servidor Mastra
 * As rotas são registradas em mastra/index.ts com registerCopilotKit()
 */
const AGENT_ROUTES = {
  student: "/chat/student",
  institution: "/chat/institution",
} as const;

const AGENT_IDS = {
  student: "studentAgent",
  institution: "institutionAgent",
} as const;

/**
 * URL base do servidor Mastra
 * Em produção, configure via variável de ambiente NEXT_PUBLIC_MASTRA_URL
 */
const MASTRA_BASE_URL =
  process.env.NEXT_PUBLIC_MASTRA_URL || "http://localhost:4111";

/**
 * Provider do CopilotKit para integração com Mastra AI
 *
 * Conecta ao servidor Mastra standalone (porta 4111) que deve estar
 * rodando em paralelo. Use `npm run dev:all` para iniciar ambos.
 *
 * Rotas disponíveis:
 * - http://localhost:4111/chat/student (studentAgent)
 * - http://localhost:4111/chat/institution (institutionAgent)
 */
export function CopilotProvider({
  children,
  context = "student",
}: CopilotProviderProps) {
  const runtimeUrl = `${MASTRA_BASE_URL}${AGENT_ROUTES[context]}`;

  return (
    <CopilotKit
      runtimeUrl={runtimeUrl}
      agent={AGENT_IDS[context]}
      showDevConsole={process.env.NODE_ENV === "development"}
    >
      {children}
    </CopilotKit>
  );
}
