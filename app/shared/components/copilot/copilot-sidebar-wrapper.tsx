"use client";

import { CopilotSidebar } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";
import { ReactNode } from "react";

interface CopilotSidebarWrapperProps {
  children: ReactNode;
  /**
   * Contexto do usuário para personalizar o assistente
   * - "student": Área do aluno
   * - "institution": Área da instituição
   */
  context?: "student" | "institution";
  /**
   * Se o sidebar deve iniciar aberto
   */
  defaultOpen?: boolean;
}

const SIDEBAR_CONFIG = {
  student: {
    title: "Assistente do Aluno",
    initial:
      "Olá! Sou seu assistente na plataforma Aluminify. Como posso ajudar você hoje?",
    instructions: `Você está ajudando um aluno da plataforma Aluminify.
Seja amigável e encorajador. Ajude com navegação, cursos, agendamentos e materiais de estudo.`,
  },
  institution: {
    title: "Assistente Administrativo",
    initial:
      "Olá! Sou o assistente administrativo da Aluminify. Como posso ajudar na gestão da sua instituição?",
    instructions: `Você está ajudando um administrador/gestor da plataforma Aluminify.
Seja profissional e objetivo. Auxilie com gestão de cursos, usuários, relatórios e configurações.`,
  },
};

/**
 * Wrapper do CopilotSidebar com configurações pré-definidas
 *
 * Fornece uma interface de chat lateral que se adapta ao contexto do usuário.
 */
export function CopilotSidebarWrapper({
  children,
  context = "student",
  defaultOpen = false,
}: CopilotSidebarWrapperProps) {
  const config = SIDEBAR_CONFIG[context];

  return (
    <CopilotSidebar
      defaultOpen={defaultOpen}
      clickOutsideToClose={true}
      instructions={config.instructions}
      labels={{
        title: config.title,
        initial: config.initial,
        placeholder: "Digite sua mensagem...",
      }}
    >
      {children}
    </CopilotSidebar>
  );
}
