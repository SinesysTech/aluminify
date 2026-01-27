# CopilotKit Quick Start

## TL;DR - Get Started in 3 Steps

### Option 1: Standalone Server (Recommended)

```bash
# 1. Start Mastra server
npm run mastra:dev

# 2. In your React component
import { CopilotKit } from "@copilotkit/react-core";
import { CopilotChat } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";

<CopilotKit runtimeUrl="http://localhost:4111/chat/student" agent="studentAgent">
  <CopilotChat />
</CopilotKit>

# 3. Done! Your agent is ready to chat
```

### Option 2: Embedded (Simpler)

```bash
# 1. Just start Next.js
npm run dev

# 2. In your React component
<CopilotKit runtimeUrl="/api/copilotkit-embedded?agent=studentAgent" agent="studentAgent">
  <CopilotChat />
</CopilotKit>

# 3. Done!
```

## Available Endpoints

| Agent | Standalone URL | Embedded URL |
|-------|---------------|--------------|
| Student | `http://localhost:4111/chat/student` | `/api/copilotkit-embedded?agent=studentAgent` |
| Institution | `http://localhost:4111/chat/institution` | `/api/copilotkit-embedded?agent=institutionAgent` |

## What Changed?

### 1. New Dependencies
- `@ag-ui/mastra` - Bridges CopilotKit with Mastra
- Plus peer dependencies (`@ag-ui/core`, `@ag-ui/client`, etc.)

### 2. Updated Files
- `/mastra/index.ts` - Added CopilotKit routes
- `/app/api/copilotkit/route.ts` - Now points to standalone server
- `/app/api/copilotkit-embedded/route.ts` - NEW: Embedded option

### 3. New Files
- `/app/examples/copilot-integration.tsx` - Usage examples
- `/docs/COPILOTKIT_SETUP.md` - Full documentation
- This file - Quick reference

## Complete Example

```tsx
// app/page.tsx
"use client";

import { CopilotKit } from "@copilotkit/react-core";
import { CopilotChat } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";

export default function Home() {
  return (
    <div className="h-screen">
      <CopilotKit
        runtimeUrl="http://localhost:4111/chat/student"
        agent="studentAgent"
      >
        <CopilotChat
          labels={{
            title: "Student Assistant",
            initial: "Hi! How can I help you today?",
          }}
        />
      </CopilotKit>
    </div>
  );
}
```

## Troubleshooting

**"No default agent provided"**
- Fixed! Use the endpoints above.

**"Connection refused"**
- Start Mastra server: `npm run mastra:dev`

**CORS errors**
- Already configured for localhost:3000
- For production, update `/mastra/index.ts`

## Next Steps

1. See `/docs/COPILOTKIT_SETUP.md` for full documentation
2. Check `/app/examples/copilot-integration.tsx` for more examples
3. Customize agents in `/mastra/agents/`

## Production Deployment

```typescript
// Update CORS in /mastra/index.ts
server: {
  cors: {
    origin: ["https://your-production-domain.com"],
  },
}

// Build and deploy Mastra server separately
npm run mastra:build
npm run mastra:start
```

Then update `NEXT_PUBLIC_MASTRA_URL` to point to your production Mastra server.
