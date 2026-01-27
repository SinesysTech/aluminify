import {
  CopilotRuntime,
  copilotRuntimeNextJSAppRouterEndpoint,
  GoogleGenerativeAIAdapter,
  OpenAIAdapter,
} from "@copilotkit/runtime";
import { NextRequest } from "next/server";
import { mastra } from "@/mastra";

/**
 * CopilotKit Runtime API Route - Integrado com Mastra
 *
 * Este endpoint conecta CopilotKit aos agentes Mastra.
 *
 * Uso no frontend:
 * <CopilotKit runtimeUrl="/api/copilotkit" agent="studentAgent">
 *   <CopilotChat />
 * </CopilotKit>
 *
 * Agentes disponíveis:
 * - studentAgent: Assistente para área do aluno
 * - institutionAgent: Assistente para área administrativa
 */

// Seleciona o adapter baseado no provedor configurado
const MODEL_PROVIDER = process.env.AI_MODEL_PROVIDER || "google";

function getServiceAdapter() {
  if (MODEL_PROVIDER === "openai") {
    return new OpenAIAdapter({
      model: "gpt-4o",
    });
  }
  return new GoogleGenerativeAIAdapter({
    model: "gemini-2.0-flash",
  });
}

// Tipos de agentes disponíveis no Mastra
type AgentId = "studentAgent" | "institutionAgent";

const VALID_AGENTS: AgentId[] = ["studentAgent", "institutionAgent"];

function isValidAgent(name: string): name is AgentId {
  return VALID_AGENTS.includes(name as AgentId);
}

export const POST = async (req: NextRequest) => {
  const serviceAdapter = getServiceAdapter();

  // Get the agent name from query params or default to studentAgent
  const url = new URL(req.url);
  const agentParam = url.searchParams.get("agent") || "studentAgent";
  const agentName: AgentId = isValidAgent(agentParam) ? agentParam : "studentAgent";

  // Get the Mastra agent to use its instructions
  const agent = mastra.getAgent(agentName);
  const instructions = agent
    ? await agent.getInstructions()
    : "Você é um assistente útil.";

  const runtime = new CopilotRuntime({
    instructions: typeof instructions === "string" ? instructions : undefined,
  });

  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
};

// Aumenta o timeout para streaming de respostas longas
export const maxDuration = 60;
