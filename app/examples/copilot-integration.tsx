"use client";

import { CopilotKit } from "@copilotkit/react-core";
import { CopilotChat } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";

/**
 * CopilotKit Integration Examples
 *
 * Choose one of the approaches below based on your architecture:
 */

// OPTION A: Standalone Mastra Server (Recommended)
// Start Mastra server first: npm run mastra:dev
export function StudentCopilotStandalone() {
  return (
    <CopilotKit
      runtimeUrl="http://localhost:4111/chat/student"
      agent="studentAgent"
    >
      <CopilotChat
        labels={{
          title: "Student Assistant",
          initial: "Hi! I'm your student assistant. How can I help you today?",
        }}
      />
    </CopilotKit>
  );
}

export function InstitutionCopilotStandalone() {
  return (
    <CopilotKit
      runtimeUrl="http://localhost:4111/chat/institution"
      agent="institutionAgent"
    >
      <CopilotChat
        labels={{
          title: "Institution Assistant",
          initial: "Hi! I'm your institution assistant. How can I help you today?",
        }}
      />
    </CopilotKit>
  );
}

// OPTION B: Embedded Mastra (Simpler, but may have limitations)
export function StudentCopilotEmbedded() {
  return (
    <CopilotKit
      runtimeUrl="/api/copilotkit-embedded?agent=studentAgent"
      agent="studentAgent"
    >
      <CopilotChat
        labels={{
          title: "Student Assistant",
          initial: "Hi! I'm your student assistant. How can I help you today?",
        }}
      />
    </CopilotKit>
  );
}

export function InstitutionCopilotEmbedded() {
  return (
    <CopilotKit
      runtimeUrl="/api/copilotkit-embedded?agent=institutionAgent"
      agent="institutionAgent"
    >
      <CopilotChat
        labels={{
          title: "Institution Assistant",
          initial: "Hi! I'm your institution assistant. How can I help you today?",
        }}
      />
    </CopilotKit>
  );
}

/**
 * Advanced: Headless UI with useCopilotChat hook
 *
 * For complete UI customization, use the headless approach:
 */
import { useCopilotChat } from "@copilotkit/react-core";

export function CustomChatInterface() {
  const { messages, sendMessage, isLoading } = useCopilotChat();

  return (
    <CopilotKit
      runtimeUrl="http://localhost:4111/chat/student"
      agent="studentAgent"
    >
      <div className="custom-chat-interface">
        <div className="messages">
          {messages.map((msg, i) => (
            <div key={i} className={`message ${msg.role}`}>
              {msg.content}
            </div>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const input = e.currentTarget.message as HTMLInputElement;
            sendMessage(input.value);
            input.value = "";
          }}
        >
          <input name="message" disabled={isLoading} />
          <button type="submit" disabled={isLoading}>
            Send
          </button>
        </form>
      </div>
    </CopilotKit>
  );
}
