/**
 * Mastra AI Agent Streaming API Route
 *
 * This endpoint handles streaming chat requests using Mastra agents.
 * It returns a readable stream for real-time response rendering.
 */

import { NextRequest } from "next/server";
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
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse request body
    const body = await req.json();
    const { messages, agentSlug } = body as {
      messages: ChatMessage[];
      agentSlug?: string;
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Messages array is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get agent configuration from database
    const client = getDatabaseClient();
    const agentsService = new AIAgentsService(client);
    const agentConfig = await agentsService.getChatConfig(
      user.empresaId ?? "",
      agentSlug
    );

    if (!agentConfig) {
      return new Response(
        JSON.stringify({ error: "No agent configured for this tenant" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Log in development
    if (process.env.NODE_ENV === "development") {
      console.log("[Mastra Stream] Processing request:", {
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
      systemPrompt: agentConfig.systemPrompt,
      model: agentConfig.model || "gpt-4o-mini",
      temperature: agentConfig.temperature || 0.7,
      agentName: agentConfig.name,
    });

    // Get the last user message
    const userMessages = messages.filter((m) => m.role === "user");
    const lastUserMessage = userMessages[userMessages.length - 1]?.content;

    if (!lastUserMessage) {
      return new Response(JSON.stringify({ error: "No user message found" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Generate streaming response using the agent
    const stream = await agent.stream(lastUserMessage, {
      maxSteps: 5,
    });

    // Create a readable stream from the Mastra stream
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream.textStream) {
            // Send each chunk as a Server-Sent Event format
            const data = JSON.stringify({ type: "text", content: chunk });
            controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));
          }

          // Send completion message
          const doneData = JSON.stringify({ type: "done" });
          controller.enqueue(new TextEncoder().encode(`data: ${doneData}\n\n`));
          controller.close();
        } catch (error) {
          console.error("[Mastra Stream] Stream error:", error);
          const errorData = JSON.stringify({
            type: "error",
            message: error instanceof Error ? error.message : "Stream error",
          });
          controller.enqueue(new TextEncoder().encode(`data: ${errorData}\n\n`));
          controller.close();
        }
      },
    });

    // Return the streaming response
    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("[Mastra Stream] Error processing request:", error);
    return new Response(
      JSON.stringify({
        error: "Error processing request",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
