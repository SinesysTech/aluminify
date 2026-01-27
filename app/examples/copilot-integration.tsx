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
 * For complete UI customization, use the headless approach.
 * Note: useCopilotChat provides visibleMessages and appendMessage.
 * For full headless features (messages, sendMessage, suggestions), use
 * useCopilotChatHeadless_c which requires a free publicApiKey from cloud.copilotkit.ai
 */
import { useCopilotChat } from "@copilotkit/react-core";
import { TextMessage, MessageRole } from "@copilotkit/runtime-client-gql";

function CustomChatContent() {
  const { visibleMessages, appendMessage, isLoading } = useCopilotChat();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const input = e.currentTarget.elements.namedItem(
      "message"
    ) as HTMLInputElement;
    if (!input.value.trim()) return;

    await appendMessage(
      new TextMessage({
        role: MessageRole.User,
        content: input.value,
      })
    );
    input.value = "";
  };

  return (
    <div className="custom-chat-interface">
      <div className="messages">
        {visibleMessages.map((msg, i) => {
          // Use type guard - only TextMessage has role and content
          if (msg.isTextMessage()) {
            return (
              <div key={i} className={`message ${msg.role}`}>
                {msg.content}
              </div>
            );
          }
          return null;
        })}
      </div>
      <form onSubmit={handleSubmit}>
        <input name="message" disabled={isLoading} />
        <button type="submit" disabled={isLoading}>
          Send
        </button>
      </form>
    </div>
  );
}

export function CustomChatInterface() {
  return (
    <CopilotKit
      runtimeUrl="http://localhost:4111/chat/student"
      agent="studentAgent"
    >
      <CustomChatContent />
    </CopilotKit>
  );
}
