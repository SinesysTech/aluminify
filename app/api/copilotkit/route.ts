/**
 * CopilotKit Runtime API Route
 *
 * This endpoint handles CopilotKit requests, providing:
 * - Authentication via Bearer token
 * - Backend actions with tenant context (direct-to-LLM mode)
 * - Mastra agent integration via AG-UI protocol
 *
 * CopilotKit Architecture:
 * - CopilotKit is the Agentic Application Platform (UI, providers, runtime)
 * - You can choose between direct LLM calls with actions OR agent frameworks
 * - Mastra, LangGraph, CrewAI, Agno, etc. are agent framework OPTIONS within CopilotKit
 * - Integration uses AG-UI protocol to connect agent frameworks to CopilotRuntime
 */

import { NextRequest } from "next/server";
import {
  CopilotRuntime,
  OpenAIAdapter,
  ExperimentalEmptyAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { MastraAgent } from "@ag-ui/mastra";
import OpenAI from "openai";
import { getAuthUser } from "@/app/[tenant]/auth/middleware";
import { createCopilotKitActions } from "@/app/shared/lib/copilotkit/actions";
import { createMastraWithContext } from "@/app/shared/lib/mastra";

export const runtime = "nodejs";

// Initialize OpenAI client (used for direct-to-LLM mode)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Service adapter for direct-to-LLM with actions
const openAIAdapter = new OpenAIAdapter({
  openai,
  model: process.env.COPILOTKIT_MODEL || "gpt-4o-mini",
});

// Service adapter for Mastra agents (agent handles LLM calls)
const emptyAdapter = new ExperimentalEmptyAdapter();

export const POST = async (req: NextRequest) => {
  // Authenticate the user
  const user = await getAuthUser(req);

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Log the authenticated user context
  if (process.env.NODE_ENV === "development") {
    console.log("[CopilotKit] Authenticated user:", {
      userId: user.id,
      role: user.role,
      empresaId: user.empresaId,
    });
  }

  // Check for Mastra agent mode via query param or header
  const url = new URL(req.url);
  const useMastra =
    url.searchParams.get("agent") === "mastra" ||
    req.headers.get("X-CopilotKit-Agent") === "mastra";

  let copilotRuntime: CopilotRuntime;
  let serviceAdapter: OpenAIAdapter | ExperimentalEmptyAdapter;

  if (useMastra) {
    // Mastra Agent Mode: Use MastraAgent.getLocalAgents() via AG-UI protocol
    const mastra = createMastraWithContext(
      {
        userId: user.id,
        empresaId: user.empresaId ?? null,
        userRole: user.role as "aluno" | "usuario" | "superadmin",
      },
      {
        agentId: "study-assistant",
        agentName: "Assistente de Estudos",
      }
    );

    copilotRuntime = new CopilotRuntime({
      // Use MastraAgent.getLocalAgents to register Mastra agents with CopilotKit
      // @ts-expect-error - AG-UI integration type compatibility
      agents: MastraAgent.getLocalAgents({ mastra }),
    });

    // Use empty adapter since Mastra agent handles LLM calls
    serviceAdapter = emptyAdapter;

    if (process.env.NODE_ENV === "development") {
      console.log("[CopilotKit] Using Mastra agent mode via AG-UI protocol");
    }
  } else {
    // Direct-to-LLM Mode: Use CopilotKit actions with OpenAI adapter
    const actions = createCopilotKitActions({
      userId: user.id,
      empresaId: user.empresaId ?? null,
      userRole: user.role as "aluno" | "usuario" | "superadmin",
    });

    copilotRuntime = new CopilotRuntime({
      actions:
        actions as unknown as NonNullable<
          ConstructorParameters<typeof CopilotRuntime>[0]
        >["actions"],
    });

    serviceAdapter = openAIAdapter;

    if (process.env.NODE_ENV === "development") {
      console.log("[CopilotKit] Using direct-to-LLM mode with actions");
    }
  }

  // Handle the request
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime: copilotRuntime,
    serviceAdapter,
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
};
