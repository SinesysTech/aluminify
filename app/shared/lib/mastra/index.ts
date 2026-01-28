/**
 * Mastra AI Framework Integration
 *
 * This module provides the Mastra instance and agent factory
 * for AI-powered features in the application.
 *
 * CopilotKit + Mastra Integration:
 * - CopilotKit is the Agentic Application Platform (UI, providers, runtime)
 * - Mastra is the agent framework choice WITHIN CopilotKit
 * - Integration uses @ag-ui/mastra to connect Mastra agents to CopilotRuntime
 */

import { Mastra } from "@mastra/core";
import {
  createStudyAssistantAgent,
  type CreateStudyAssistantOptions,
} from "./agents/study-assistant";
import type { ToolContext } from "./tools";

// Export types
export type { ToolContext } from "./tools";
export type { CreateStudyAssistantOptions } from "./agents/study-assistant";

// Export agent factory
export { createStudyAssistantAgent } from "./agents/study-assistant";

// Export tools factory
export { createMastraTools } from "./tools";

/**
 * Creates a configured Mastra instance with agents that have user context.
 *
 * Note: This creates a new Mastra instance per request to inject user context.
 * For the official CopilotKit + Mastra integration via AG-UI protocol,
 * use MastraAgent.getLocalAgents({ mastra }) with CopilotRuntime.
 */
export function createMastraInstance(options: CreateStudyAssistantOptions) {
  const agent = createStudyAssistantAgent(options);

  const mastra = new Mastra({
    agents: { studyAssistant: agent },
  });

  return mastra;
}

/**
 * Creates a Mastra instance with context injected from the request.
 * This is the recommended way to create a Mastra instance for CopilotKit integration.
 */
export function createMastraWithContext(context: ToolContext, agentConfig?: {
  systemPrompt?: string;
  model?: string;
  temperature?: number;
  agentName?: string;
  agentId?: string;
}) {
  return createMastraInstance({
    context,
    systemPrompt: agentConfig?.systemPrompt,
    model: agentConfig?.model,
    temperature: agentConfig?.temperature,
    agentName: agentConfig?.agentName,
    agentId: agentConfig?.agentId,
  });
}

/**
 * Gets the study assistant agent from a Mastra instance
 */
export function getStudyAssistant(mastra: Mastra) {
  return mastra.getAgent("studyAssistant");
}
