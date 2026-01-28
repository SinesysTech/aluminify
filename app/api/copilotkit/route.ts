/**
 * CopilotKit Runtime API Route
 *
 * This endpoint handles CopilotKit requests, providing:
 * - Authentication via Bearer token
 * - Backend actions with tenant context (direct-to-LLM mode)
 *
 * CopilotKit Architecture:
 * - CopilotKit is the Agentic Application Platform (UI, providers, runtime)
 * - You can choose between direct LLM calls with actions OR agent frameworks
 * - Mastra, LangGraph, CrewAI, Agno, etc. are agent framework OPTIONS within CopilotKit
 * - Integration uses AG-UI protocol to connect agent frameworks to CopilotRuntime
 *
 * Note: For Mastra agent mode, see /api/mastra endpoints.
 * Full AG-UI integration requires @ag-ui/mastra package which has installation issues.
 * TODO: Revisit AG-UI integration when package is stable.
 */

import { NextRequest } from "next/server";
import {
  CopilotRuntime,
  OpenAIAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import OpenAI from "openai";
import { getAuthUser } from "@/app/[tenant]/auth/middleware";
import { createCopilotKitActions } from "@/app/shared/lib/copilotkit/actions";

export const runtime = "nodejs";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Service adapter for direct-to-LLM with actions
const serviceAdapter = new OpenAIAdapter({
  openai,
  model: process.env.COPILOTKIT_MODEL || "gpt-4o-mini",
});

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

  // Create actions with the user context
  const actions = createCopilotKitActions({
    userId: user.id,
    empresaId: user.empresaId ?? null,
    userRole: user.role as "aluno" | "usuario" | "superadmin",
  });

  // Create runtime with context-aware actions
  const copilotRuntime = new CopilotRuntime({
    actions:
      actions as unknown as NonNullable<
        ConstructorParameters<typeof CopilotRuntime>[0]
      >["actions"],
  });

  // Handle the request
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime: copilotRuntime,
    serviceAdapter,
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
};
