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
 * Mapeamento de contexto para ID do agente Mastra
 */
const AGENT_IDS = {
  student: "studentAgent",
  institution: "institutionAgent",
} as const;

/**
 * Provider do CopilotKit para integração com Mastra AI
 *
 * Conecta ao endpoint /api/copilotkit que usa as instruções
 * do agente Mastra correspondente ao contexto.
 */
export function CopilotProvider({
  children,
  context = "student",
}: CopilotProviderProps) {
  // Passa o agente como query param para o backend selecionar as instruções corretas
  const runtimeUrl = `/api/copilotkit?agent=${AGENT_IDS[context]}`;

  return (
    <CopilotKit
      runtimeUrl={runtimeUrl}
      showDevConsole={process.env.NODE_ENV === "development"}
    >
      {children}
    </CopilotKit>
  );
}
