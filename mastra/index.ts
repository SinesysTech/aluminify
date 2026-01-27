import { Mastra } from "@mastra/core/mastra";
import { ConsoleLogger, LogLevel } from "@mastra/core/logger";
import { registerCopilotKit } from "@ag-ui/mastra/copilotkit";

import { studentAgent, institutionAgent } from "./agents";

const LOG_LEVEL = (process.env.LOG_LEVEL as LogLevel) || "info";

/**
 * Instância principal do Mastra para Aluminify
 *
 * Agentes:
 * - studentAgent: Assistente para área do aluno
 * - institutionAgent: Assistente para área administrativa
 *
 * Modos de uso:
 * 1. CopilotKit (Next.js embedded): MastraAgent.getLocalAgents({ mastra })
 * 2. Mastra Studio (dev): npm run mastra:dev -> http://localhost:4111
 * 3. Mastra Server (prod): npm run mastra:build && npm run mastra:start
 */
export const mastra = new Mastra({
  agents: {
    studentAgent,
    institutionAgent,
  },
  logger: new ConsoleLogger({
    level: LOG_LEVEL,
  }),
  server: {
    cors: {
      origin: ["http://localhost:3000", "http://localhost:4111"],
      allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
    },
    apiRoutes: [
      registerCopilotKit({
        path: "/chat/student",
        resourceId: "studentAgent",
      }),
      registerCopilotKit({
        path: "/chat/institution",
        resourceId: "institutionAgent",
      }),
    ],
  },
  bundler: {
    externals: ["@copilotkit/runtime"],
  },
});
