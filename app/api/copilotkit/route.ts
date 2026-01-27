/**
 * CopilotKit Runtime API Route - Proxy to Mastra Server
 *
 * This route proxies requests to the standalone Mastra server.
 * The Mastra server handles the actual agent execution and returns responses.
 *
 * Prerequisites:
 * 1. Start Mastra server: npm run mastra:dev (or mastra:start for production)
 * 2. Mastra server must be running on http://localhost:4111
 * 3. Agent routes are registered at:
 *    - /chat/student (studentAgent)
 *    - /chat/institution (institutionAgent)
 *
 * Usage in frontend:
 * <CopilotKit runtimeUrl="http://localhost:4111/chat/student" agent="studentAgent">
 *   ...
 * </CopilotKit>
 */

export const POST = async () => {
  return new Response(
    JSON.stringify({
      error: "This endpoint is deprecated. Use the Mastra server directly.",
      instructions: [
        "1. Start Mastra server: npm run mastra:dev",
        "2. Update CopilotKit runtimeUrl to: http://localhost:4111/chat/student",
        "3. Or use: http://localhost:4111/chat/institution for institution agent",
      ],
    }),
    {
      status: 410,
      headers: { "Content-Type": "application/json" },
    }
  );
};

export const maxDuration = 60;
