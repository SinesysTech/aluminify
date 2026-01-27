import {
  CopilotRuntime,
  ExperimentalEmptyAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { NextRequest } from "next/server";

/**
 * CopilotKit Runtime API Route
 *
 * Nota:
 * A integração com agentes Mastra foi removida deste endpoint porque o pacote
 * não está presente/compatível no projeto no momento.
 */
const serviceAdapter = new ExperimentalEmptyAdapter();

export const POST = async (req: NextRequest) => {
  const runtime = new CopilotRuntime({});

  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
};

// Aumenta o timeout para streaming de respostas longas
export const maxDuration = 60;
