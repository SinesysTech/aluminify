/**
 * CopilotKit Runtime API Route
 *
 * This endpoint handles CopilotKit requests, providing:
 * - Authentication via Bearer token
 * - Backend actions with tenant context
 * - OpenAI integration
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

// Create the service adapter with OpenAI
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
    // Tipagem do pacote @copilotkit/runtime varia por versão; mantemos compatibilidade em runtime.
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
