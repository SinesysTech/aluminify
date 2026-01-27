/**
 * Mastra AI Framework Integration
 *
 * This module provides the Mastra instance and agent factory
 * for AI-powered features in the application.
 */

import { Mastra } from "@mastra/core";
import {
  createStudyAssistantAgent,
  CreateStudyAssistantOptions,
} from "./agents/study-assistant";
import { createMastraTools, ToolContext } from "./tools";

// Export types
export type { ToolContext } from "./tools";
export type { CreateStudyAssistantOptions } from "./agents/study-assistant";

// Export agent factory
export { createStudyAssistantAgent } from "./agents/study-assistant";

// Export tools factory
export { createMastraTools } from "./tools";

/**
 * Creates a configured Mastra instance with the study assistant agent
 */
export function createMastraInstance(options: CreateStudyAssistantOptions) {
  const agent = createStudyAssistantAgent(options);

  const mastra = new Mastra({
    agents: { studyAssistant: agent },
  });

  return mastra;
}

/**
 * Gets the study assistant agent from a Mastra instance
 */
export function getStudyAssistant(mastra: Mastra) {
  return mastra.getAgent("studyAssistant");
}
