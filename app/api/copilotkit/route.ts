import {
  CopilotRuntime,
  ExperimentalEmptyAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { MastraAgent } from "@ag-ui/mastra";
import { NextRequest } from "next/server";
import { mastra } from "@/mastra";

/**
 * Service adapter para CopilotKit
 * ExperimentalEmptyAdapter é usado quando não há necessidade de
 * um modelo LLM direto no runtime (os agentes Mastra têm seus próprios modelos)
 */
const serviceAdapter = new ExperimentalEmptyAdapter();

/**
 * API Route para CopilotKit
 *
 * Integra os agentes Mastra locais com o CopilotKit runtime.
 * Os agentes são carregados usando MastraAgent.getLocalAgents()
 * para funcionamento completo de features como shared state.
 */
export const POST = async (req: NextRequest) => {
  const runtime = new CopilotRuntime({
    // @ts-expect-error - typing issue between packages
    agents: MastraAgent.getLocalAgents({ mastra }),
  });

  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
};
