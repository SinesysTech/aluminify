# CopilotKit + Mastra Integration Guide

This document explains how CopilotKit is integrated with Mastra agents in Aluminify.

## Architecture

We have **two integration options**:

### Option A: Standalone Mastra Server (Recommended)

```
┌─────────────────┐         ┌──────────────────┐
│   Next.js App   │         │  Mastra Server   │
│  (Port 3000)    │ ───────>│  (Port 4111)     │
│                 │   HTTP  │                  │
│  CopilotKit UI  │         │  studentAgent    │
│                 │         │  institutionAgent│
└─────────────────┘         └──────────────────┘
```

**Advantages:**
- Better separation of concerns
- Can scale Mastra server independently
- Production-ready architecture
- Better for long-running agent operations

**Setup:**
1. Start Mastra server: `npm run mastra:dev`
2. In your frontend, use: `runtimeUrl="http://localhost:4111/chat/student"`

### Option B: Embedded Mastra (Development)

```
┌─────────────────────────────────────┐
│          Next.js App                │
│          (Port 3000)                │
│                                     │
│  ┌──────────────┐  ┌────────────┐  │
│  │ CopilotKit   │  │   Mastra   │  │
│  │     UI       │──│   Agents   │  │
│  └──────────────┘  └────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

**Advantages:**
- Simpler setup for development
- No separate server to manage
- All in one Next.js process

**Setup:**
1. Just start Next.js: `npm run dev`
2. In your frontend, use: `runtimeUrl="/api/copilotkit-embedded?agent=studentAgent"`

## Configuration Files

### 1. Mastra Configuration (`/mastra/index.ts`)

Registers CopilotKit routes for both agents:

```typescript
import { registerCopilotKit } from "@ag-ui/mastra/copilotkit";

export const mastra = new Mastra({
  agents: {
    studentAgent,
    institutionAgent,
  },
  server: {
    apiRoutes: [
      registerCopilotKit({
        path: "/chat/student",
        resourceId: "studentAgent",
      }),
      registerCopilotKit({
        path: "/chat/institution",
        resourceId: "institutionAgent",
      }),
    ],
  },
  bundler: {
    // Required for deployment - prevents bundling issues
    externals: ["@copilotkit/runtime"],
  },
});
```

### 2. Embedded Route (`/app/api/copilotkit-embedded/route.ts`)

Runs Mastra directly in Next.js API routes:

```typescript
import { MastraAgentAdapter } from "@ag-ui/mastra/copilotkit";
import { mastra } from "@/mastra";

export const POST = async (req: NextRequest) => {
  const agentName = searchParams.get("agent") || "studentAgent";
  const agent = mastra.getAgent(agentName);

  const serviceAdapter = new MastraAgentAdapter({ agent });
  // ... rest of setup
};
```

## Usage in Frontend

### Using CopilotChat Component

```tsx
import { CopilotKit } from "@copilotkit/react-core";
import { CopilotChat } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";

export function StudentAssistant() {
  return (
    <CopilotKit
      runtimeUrl="http://localhost:4111/chat/student"
      agent="studentAgent"
    >
      <CopilotChat
        labels={{
          title: "Student Assistant",
          initial: "How can I help you today?",
        }}
      />
    </CopilotKit>
  );
}
```

### Using CopilotSidebar

```tsx
import { CopilotSidebar } from "@copilotkit/react-ui";

export function Layout({ children }) {
  return (
    <CopilotKit runtimeUrl="http://localhost:4111/chat/student">
      <CopilotSidebar>
        {children}
      </CopilotSidebar>
    </CopilotKit>
  );
}
```

### Using CopilotPopup

```tsx
import { CopilotPopup } from "@copilotkit/react-ui";

export function App({ children }) {
  return (
    <CopilotKit runtimeUrl="http://localhost:4111/chat/student">
      {children}
      <CopilotPopup
        labels={{
          title: "Need Help?",
          initial: "Ask me anything!",
        }}
      />
    </CopilotKit>
  );
}
```

### Headless UI (Custom Interface)

```tsx
import { useCopilotChat } from "@copilotkit/react-core";

export function CustomChat() {
  const { messages, sendMessage, isLoading } = useCopilotChat();

  return (
    <CopilotKit runtimeUrl="http://localhost:4111/chat/student">
      <div className="custom-chat">
        {messages.map((msg) => (
          <div key={msg.id}>{msg.content}</div>
        ))}
        <button onClick={() => sendMessage("Hello")}>
          Send
        </button>
      </div>
    </CopilotKit>
  );
}
```

## Environment Variables

Add to your `.env.local`:

```bash
# Mastra Server URL (for standalone mode)
NEXT_PUBLIC_MASTRA_URL=http://localhost:4111

# LLM Provider (already configured)
OPENAI_API_KEY=your_key_here
# or
GOOGLE_GENERATIVE_AI_API_KEY=your_key_here
```

## Available Agents

### 1. Student Agent (`studentAgent`)
- **Endpoint:** `http://localhost:4111/chat/student`
- **Purpose:** Assists students with course-related queries
- **Tools:** Student-specific tools and actions

### 2. Institution Agent (`institutionAgent`)
- **Endpoint:** `http://localhost:4111/chat/institution`
- **Purpose:** Assists institution administrators
- **Tools:** Administrative tools and actions

## Testing

### 1. Test Standalone Mode

```bash
# Terminal 1: Start Mastra server
npm run mastra:dev

# Terminal 2: Start Next.js
npm run dev

# Visit: http://localhost:3000/examples/copilot-integration
```

### 2. Test Embedded Mode

```bash
# Just start Next.js
npm run dev

# Visit: http://localhost:3000/examples/copilot-integration
```

### 3. Test with curl

```bash
# Test student agent endpoint
curl -X POST http://localhost:4111/chat/student \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Hello"}]}'
```

## Deployment Considerations

### Production Setup (Standalone Server)

1. **Build Mastra server:**
   ```bash
   npm run mastra:build
   ```

2. **Deploy separately:**
   - Mastra server on dedicated infrastructure
   - Next.js app on Vercel/similar platform

3. **Update environment variables:**
   ```bash
   NEXT_PUBLIC_MASTRA_URL=https://your-mastra-server.com
   ```

4. **Update CORS in `mastra/index.ts`:**
   ```typescript
   server: {
     cors: {
       origin: ["https://your-frontend-domain.com"],
       allowMethods: ["GET", "POST"],
       allowHeaders: ["Content-Type", "Authorization"],
     },
   }
   ```

### Important: Bundle Configuration

The `bundler.externals` configuration is **critical** for deployment:

```typescript
bundler: {
  externals: ["@copilotkit/runtime"],
}
```

Without this, you'll get 500 errors when running `mastra build` because `@copilotkit/runtime` contains dependencies that cannot be bundled.

## Troubleshooting

### Error: "No default agent provided"

**Cause:** Using `ExperimentalEmptyAdapter` without proper Mastra integration.

**Solution:** Use `MastraAgentAdapter` from `@ag-ui/mastra/copilotkit`:

```typescript
const serviceAdapter = new MastraAgentAdapter({
  agent: mastra.getAgent("studentAgent"),
});
```

### Error: "Agent not found"

**Cause:** Agent name mismatch or agent not registered.

**Solution:** Check that:
1. Agent is exported in `/mastra/agents/index.ts`
2. Agent is registered in `/mastra/index.ts`
3. Agent name matches exactly (case-sensitive)

### Error: 500 on mastra build

**Cause:** `@copilotkit/runtime` being bundled.

**Solution:** Add to externals:
```typescript
bundler: {
  externals: ["@copilotkit/runtime"],
}
```

### CORS Errors

**Cause:** Next.js app and Mastra server on different origins.

**Solution:** Update CORS in `/mastra/index.ts`:
```typescript
server: {
  cors: {
    origin: ["http://localhost:3000"],
    allowMethods: ["GET", "POST"],
    allowHeaders: ["Content-Type", "Authorization"],
  },
}
```

### Connection Refused

**Cause:** Mastra server not running.

**Solution:** Start Mastra server:
```bash
npm run mastra:dev
```

## Next Steps

1. Review `/app/examples/copilot-integration.tsx` for usage examples
2. Customize agent behaviors in `/mastra/agents/`
3. Add tools to agents in `/mastra/tools/`
4. Implement custom UI using CopilotKit components

## Resources

- [CopilotKit Documentation](https://docs.copilotkit.ai/)
- [Mastra Documentation](https://mastra.ai/docs)
- [CopilotKit + Mastra Integration](https://docs.copilotkit.ai/mastra/quickstart)
- [Mastra UI Dojo Examples](https://ui-dojo.mastra.ai/)
