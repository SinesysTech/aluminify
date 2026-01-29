/**
 * CopilotKit Runtime API Route
 *
 * This endpoint handles CopilotKit requests, providing:
 * - Authentication via Bearer token
 * - Backend actions with tenant context (direct-to-LLM mode)
 * - Mastra agent integration via AG-UI protocol
 * - Dynamic agent configuration from database (ai_agents table)
 *
 * CopilotKit Architecture:
 * - CopilotKit is the Agentic Application Platform (UI, providers, runtime)
 * - You can choose between direct LLM calls with actions OR agent frameworks
 * - Mastra, LangGraph, CrewAI, Agno, etc. are agent framework OPTIONS within CopilotKit
 * - Integration uses AG-UI protocol to connect agent frameworks to CopilotRuntime
 *
 * Agent Configuration:
 * - Agents are stored in the ai_agents table (per empresa/tenant)
 * - The agent slug can be passed via X-CopilotKit-Agent-Slug header
 * - If no slug is provided, the default agent for the empresa is used
 * - The integration_type field determines which mode to use (copilotkit or mastra)
 */

import { NextRequest } from "next/server";
import {
  CopilotRuntime,
  OpenAIAdapter,
  ExperimentalEmptyAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import type { Parameter } from "@copilotkit/shared";
import { MastraAgent } from "@ag-ui/mastra";
import OpenAI from "openai";
import { getAuthUser } from "@/app/[tenant]/auth/middleware";
import { createCopilotKitActions } from "@/app/shared/lib/copilotkit/actions";
import { createMastraWithContext } from "@/app/shared/lib/mastra";
import { getDatabaseClient } from "@/app/shared/core/database/database";
import { AIAgentsRepositoryImpl } from "@/app/shared/services/ai-agents/ai-agents.repository";
import type { AIAgentChatConfig } from "@/app/shared/services/ai-agents/ai-agents.types";

export const runtime = "nodejs";

// Initialize OpenAI client (used for direct-to-LLM mode)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Note: OpenAIAdapter is created per-request with model from database config

// Service adapter for Mastra agents (agent handles LLM calls)
const emptyAdapter = new ExperimentalEmptyAdapter();

// Default agent configuration (fallback when no database config exists)
const DEFAULT_AGENT_CONFIG: AIAgentChatConfig = {
  id: "default",
  slug: "study-assistant",
  name: "Assistente de Estudos",
  avatarUrl: null,
  greetingMessage: "Olá! Como posso ajudá-lo hoje?",
  placeholderText: "Digite sua mensagem...",
  systemPrompt: null,
  model: "gpt-4o-mini",
  temperature: 0.7,
  integrationType: "copilotkit",
  integrationConfig: {},
  supportsAttachments: false,
};

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

  // Get agent slug from header or query param
  const url = new URL(req.url);
  const agentSlug =
    req.headers.get("X-CopilotKit-Agent-Slug") ||
    url.searchParams.get("agentSlug") ||
    undefined;

  // Fetch agent configuration from database
  let agentConfig: AIAgentChatConfig | null = null;

  if (user.empresaId) {
    try {
      const db = getDatabaseClient();
      const repository = new AIAgentsRepositoryImpl(db);
      agentConfig = await repository.getChatConfig(user.empresaId, agentSlug);

      if (process.env.NODE_ENV === "development") {
        console.log("[CopilotKit] Agent config from database:", {
          slug: agentConfig?.slug,
          name: agentConfig?.name,
          integrationType: agentConfig?.integrationType,
          model: agentConfig?.model,
        });
      }
    } catch (error) {
      console.error("[CopilotKit] Failed to fetch agent config:", error);
      // Continue with default config
    }
  }

  // Use database config or fallback to default
  const config = agentConfig || DEFAULT_AGENT_CONFIG;

  // Determine mode based on integration type
  const useMastra = config.integrationType === "mastra";

  let copilotRuntime: CopilotRuntime<[] | Parameter[]>;
  let serviceAdapter: OpenAIAdapter | InstanceType<typeof ExperimentalEmptyAdapter>;

  if (useMastra) {
    // Mastra Agent Mode: Use MastraAgent.getLocalAgents() via AG-UI protocol
    const mastra = createMastraWithContext(
      {
        userId: user.id,
        empresaId: user.empresaId ?? null,
        userRole: user.role as "aluno" | "usuario",
      },
      {
        agentId: config.slug,
        agentName: config.name,
        systemPrompt: config.systemPrompt ?? undefined,
        model: config.model,
        temperature: config.temperature,
      }
    );

    // Get Mastra agents and register with CopilotKit
    // Type assertion needed because CopilotKit expects NonEmptyRecord but @ag-ui/mastra returns Record
    const mastraAgents = MastraAgent.getLocalAgents({ mastra });

    copilotRuntime = new CopilotRuntime({
      // Use MastraAgent.getLocalAgents to register Mastra agents with CopilotKit
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- duplicate @ag-ui/client packages cause nominal type mismatch
      agents: mastraAgents as any,
    });

    // Use empty adapter since Mastra agent handles LLM calls
    serviceAdapter = emptyAdapter;

    if (process.env.NODE_ENV === "development") {
      console.log("[CopilotKit] Using Mastra agent mode via AG-UI protocol", {
        agent: config.slug,
        model: config.model,
      });
    }
  } else {
    // Direct-to-LLM Mode: Use CopilotKit actions with OpenAI adapter
    const actions = createCopilotKitActions({
      userId: user.id,
      empresaId: user.empresaId ?? null,
      userRole: user.role as "aluno" | "usuario",
    });

    // Create adapter with model from config
    const configuredOpenAIAdapter = new OpenAIAdapter({
      openai,
      model: config.model || "gpt-4o-mini",
    });

    copilotRuntime = new CopilotRuntime({
      actions:
        actions as unknown as NonNullable<
          ConstructorParameters<typeof CopilotRuntime>[0]
        >["actions"],
    });

    serviceAdapter = configuredOpenAIAdapter;

    if (process.env.NODE_ENV === "development") {
      console.log("[CopilotKit] Using direct-to-LLM mode with actions", {
        agent: config.slug,
        model: config.model,
      });
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
