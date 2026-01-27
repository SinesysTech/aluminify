import {
  CopilotRuntime,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { getLocalAgent } from "@ag-ui/mastra";
import { NextRequest } from "next/server";
import { mastra } from "@/mastra";

/**
 * CopilotKit Runtime API Route - Embedded Mastra
 *
 * This route runs Mastra agents directly within Next.js API routes.
 *
 * Usage in frontend:
 * <CopilotKit runtimeUrl="/api/copilotkit-embedded?agent=studentAgent">
 *   <CopilotChat />
 * </CopilotKit>
 *
 * Available agents:
 * - studentAgent: Assistente para área do aluno
 * - institutionAgent: Assistente para área administrativa
 */

export const POST = async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const agentName = searchParams.get("agent") || "studentAgent";

  // Create AG-UI compatible agent from Mastra
  const aguiAgent = getLocalAgent({
    mastra,
    agentId: agentName,
  });

  const runtime = new CopilotRuntime({
    agents: {
      [agentName]: aguiAgent,
    },
  });

  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    endpoint: `/api/copilotkit-embedded?agent=${agentName}`,
  });

  return handleRequest(req);
};

export const maxDuration = 60;
