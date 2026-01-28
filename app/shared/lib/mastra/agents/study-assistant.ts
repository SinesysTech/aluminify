/**
 * Study Assistant Agent
 *
 * A Mastra agent that helps students with their studies.
 * This agent can search courses, check progress, and provide guidance.
 */

import { Agent } from "@mastra/core/agent";
import { createMastraTools, ToolContext } from "../tools";

/**
 * Default system prompt for the study assistant
 */
const DEFAULT_SYSTEM_PROMPT = `Você é um assistente de estudos inteligente e amigável.

Seu papel é:
- Ajudar alunos a encontrar cursos e materiais de estudo
- Mostrar o progresso de atividades quando solicitado
- Responder perguntas sobre os cursos disponíveis
- Fornecer orientação e motivação para os estudos

Diretrizes:
- Seja sempre educado e encorajador
- Use linguagem clara e acessível
- Quando não souber algo, admita e sugira alternativas
- Mantenha as respostas concisas, mas completas
- Responda sempre em português brasileiro`;

export interface CreateStudyAssistantOptions {
  context: ToolContext;
  systemPrompt?: string;
  model?: string;
  temperature?: number;
  agentName?: string;
  agentId?: string;
}

/**
 * Creates a study assistant agent with the given context and configuration
 */
export function createStudyAssistantAgent(options: CreateStudyAssistantOptions) {
  const {
    context,
    systemPrompt = DEFAULT_SYSTEM_PROMPT,
    model = "gpt-4o-mini",
    temperature: _temperature = 0.7,
    agentName = "Assistente de Estudos",
    agentId = "study-assistant", // Default stable ID
  } = options;

  // Create tools with user context
  const tools = createMastraTools(context);

  // Create the agent
  // Note: Using type assertion due to AI SDK v5 returning LanguageModelV3
  // while Mastra currently expects LanguageModelV2. This is a known compatibility issue.
  const agent = new Agent({
    id: agentId,
    name: agentName,
    instructions: systemPrompt,
    // Prefer Mastra's model config shape (avoids AI SDK v3 type mismatch)
    model: {
      id: `openai/${model}`,
      apiKey: process.env.OPENAI_API_KEY,
    },
    tools,
  });

  return agent;
}
