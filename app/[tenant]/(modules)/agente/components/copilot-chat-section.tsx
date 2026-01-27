'use client'

import { CopilotChat } from '@copilotkit/react-ui'
import '@copilotkit/react-ui/styles.css'

interface CopilotChatSectionProps {
  className?: string
}

/**
 * CopilotChat Section Component
 *
 * Wrapper for CopilotChat with Portuguese labels and
 * integration with the existing theme.
 */
export function CopilotChatSection({ className }: CopilotChatSectionProps) {
  return (
    <CopilotChat
      className={className}
      labels={{
        title: 'TobIAs',
        initial: 'Olá! Eu sou o TobIAs, seu assistente de estudos. Como posso ajudá-lo hoje?',
        placeholder: 'Digite sua mensagem...',
        stopGenerating: 'Parar',
        regenerateResponse: 'Regenerar resposta',
      }}
      instructions={`Você é o TobIAs, um assistente de estudos do Aluminify.
Seu objetivo é ajudar alunos com dúvidas sobre seus cursos, progresso e atividades.
Seja sempre prestativo, educado e responda em português brasileiro.
Use as ferramentas disponíveis para buscar informações sobre cursos, progresso e alunos quando necessário.`}
    />
  )
}
