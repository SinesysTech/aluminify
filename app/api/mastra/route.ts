/**
 * Mastra AI Agent API Route
 *
 * This endpoint handles chat requests using Mastra agents.
 * It supports streaming responses for real-time chat experience.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/app/[tenant]/auth/middleware";
import { createStudyAssistantAgent } from "@/app/shared/lib/mastra";
import { AIAgentsService } from "@/app/shared/services/ai-agents";
import { getDatabaseClient } from "@/app/shared/core/database/database";

export const runtime = "nodejs";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    // Authenticate the user
    const user = await getAuthUser(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await req.json();
    const { messages, agentSlug } = body as {
      messages: ChatMessage[];
      agentSlug?: string;
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    // Get agent configuration from database
    const client = getDatabaseClient();
    const agentsService = new AIAgentsService(client);
    const agentConfig = await agentsService.getChatConfig(
      user.empresaId ?? "",
      agentSlug
    );

    if (!agentConfig) {
      return NextResponse.json(
        { error: "No agent configured for this tenant" },
        { status: 404 }
      );
    }

    // Log in development
    if (process.env.NODE_ENV === "development") {
      console.log("[Mastra] Processing request:", {
        userId: user.id,
        empresaId: user.empresaId,
        agent: agentConfig.name,
        messageCount: messages.length,
      });
    }

    // Create the Mastra agent with user context
    const agent = createStudyAssistantAgent({
      context: {
        userId: user.id,
        empresaId: user.empresaId ?? null,
        userRole: user.role as "aluno" | "usuario" | "superadmin",
      },
      systemPrompt: agentConfig.systemPrompt ?? undefined,
      model: agentConfig.model || "gpt-4o-mini",
      temperature: agentConfig.temperature || 0.7,
      agentName: agentConfig.name,
    });

    // Get the last user message
    const userMessages = messages.filter((m) => m.role === "user");
    const lastUserMessage = userMessages[userMessages.length - 1]?.content;

    if (!lastUserMessage) {
      return NextResponse.json(
        { error: "No user message found" },
        { status: 400 }
      );
    }

    // Generate response using the agent
    const result = await agent.generate(lastUserMessage, {
      maxSteps: 5,
    });

    // Return the response
    return NextResponse.json({
      success: true,
      message: result.text,
      toolCalls: result.toolCalls ?? [],
      toolResults: result.toolResults ?? [],
    });
  } catch (error) {
    console.error("[Mastra] Error processing request:", error);
    return NextResponse.json(
      {
        error: "Error processing request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
