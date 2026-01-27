"use client";

import { CopilotPopup } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";

interface CopilotChatButtonProps {
  /**
   * Contexto do usuário para personalizar o assistente
   * - "student": Área do aluno
   * - "institution": Área da instituição
   */
  context?: "student" | "institution";
}

const POPUP_CONFIG = {
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
      "Olá! Sou o assistente administrativo. Como posso ajudar na gestão?",
    instructions: `Você está ajudando um administrador/gestor da plataforma Aluminify.
Seja profissional e objetivo. Auxilie com gestão de cursos, usuários, relatórios e configurações.`,
  },
};

/**
 * Botão flutuante de chat com o assistente AI
 *
 * Renderiza um popup de chat no canto inferior direito da tela.
 * O conteúdo se adapta ao contexto do usuário (aluno vs instituição).
 */
export function CopilotChatButton({
  context = "student",
}: CopilotChatButtonProps) {
  const config = POPUP_CONFIG[context];

  return (
    <CopilotPopup
      instructions={config.instructions}
      labels={{
        title: config.title,
        initial: config.initial,
        placeholder: "Digite sua mensagem...",
      }}
    />
  );
}
