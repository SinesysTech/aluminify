import { Mastra } from "@mastra/core/mastra";
import { ConsoleLogger, LogLevel } from "@mastra/core/logger";

import { studentAgent, institutionAgent } from "./agents";

const LOG_LEVEL = (process.env.LOG_LEVEL as LogLevel) || "info";

/**
 * Instância principal do Mastra para Aluminify
 *
 * Agentes:
 * - studentAgent: Assistente para área do aluno
 * - institutionAgent: Assistente para área administrativa
 *
 * Integração CopilotKit via MastraAgent.getLocalAgents({ mastra })
 */
export const mastra = new Mastra({
  agents: {
    studentAgent,
    institutionAgent,
  },
  logger: new ConsoleLogger({
    level: LOG_LEVEL,
  }),
});
