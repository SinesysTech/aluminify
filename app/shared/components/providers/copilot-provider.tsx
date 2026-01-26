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
 * Mapeamento de contexto para ID do agente
 * Os IDs devem corresponder aos nomes dos agentes no Mastra
 */
const AGENT_IDS = {
  student: "studentAgent",
  institution: "institutionAgent",
} as const;

/**
 * Provider do CopilotKit para integração com Mastra AI
 *
 * Conecta ao endpoint local /api/copilotkit que usa
 * MastraAgent.getLocalAgents() para funcionamento completo
 * de features como shared state e generative UI.
 */
export function CopilotProvider({
  children,
  context = "student",
}: CopilotProviderProps) {
  return (
    <CopilotKit
      runtimeUrl="/api/copilotkit"
      agent={AGENT_IDS[context]}
      showDevConsole={process.env.NODE_ENV === "development"}
    >
      {children}
    </CopilotKit>
  );
}
