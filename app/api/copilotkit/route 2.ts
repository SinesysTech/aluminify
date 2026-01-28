import {
  CopilotRuntime,
  copilotRuntimeNextJSAppRouterEndpoint,
  GoogleGenerativeAIAdapter,
  OpenAIAdapter,
} from "@copilotkit/runtime";
import { NextRequest } from "next/server";

/**
 * CopilotKit Runtime API Route - Fallback
 *
 * NOTA: A integração principal usa o servidor Mastra standalone (porta 4111).
 * Esta rota é um fallback simples caso o servidor Mastra não esteja disponível.
 *
 * Para integração completa com agentes Mastra, use:
 * - npm run dev:all (inicia Next.js + Mastra)
 * - CopilotProvider aponta para http://localhost:4111/chat/student
 */

const MODEL_PROVIDER = process.env.AI_MODEL_PROVIDER || "google";

export const POST = async (req: NextRequest) => {
  const serviceAdapter =
    MODEL_PROVIDER === "openai"
      ? new OpenAIAdapter({ model: "gpt-4o" })
      : new GoogleGenerativeAIAdapter({ model: "gemini-2.0-flash" });

  const runtime = new CopilotRuntime();

  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
};

export const maxDuration = 60;
