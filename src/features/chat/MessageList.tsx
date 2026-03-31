import { useEffect, useRef } from "react";
import type { ChatMessage } from "../../types";

const EXAMPLE_PROMPTS = [
  "Explain on-device ML in simple terms",
  "Write a Python fizzbuzz",
  "Tell me a creative short story",
  "What are the benefits of WebGPU?",
];

interface Props {
  messages: ChatMessage[];
  streamingContent: string;
  isGenerating: boolean;
  onSendPrompt?: (prompt: string) => void;
}

export function MessageList({ messages, streamingContent, isGenerating, onSendPrompt }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  if (messages.length === 0 && !isGenerating) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3" style={{ color: "var(--color-on-surface-variant)" }}>
        {/* Decorative icon */}
        <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: "var(--color-surface-container-high)" }}>
          <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" style={{ color: "var(--color-primary)" }}>
            <path
              d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"
              fill="currentColor"
            />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold" style={{ color: "var(--color-on-surface)" }}>Start a conversation</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-outline)" }}>
            Type a message below to chat with your on-device model
          </p>
        </div>
        {onSendPrompt && (
          <div className="flex flex-wrap gap-2 mt-4 max-w-md justify-center">
            {EXAMPLE_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => onSendPrompt(prompt)}
                className="text-xs px-3 py-1.5 rounded-full border transition-colors"
                style={{
                  borderColor: "var(--color-outline-variant)",
                  color: "var(--color-primary)",
                  backgroundColor: "var(--color-surface-container)",
                }}
              >
                {prompt}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
      {messages.filter((msg) => msg.content.trim()).map((msg) => (
        <div
          key={msg.id}
          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-[76%] px-4 py-3 text-sm leading-relaxed relative group ${
              msg.role === "user" ? "bubble-user ml-12" : "bubble-agent mr-12"
            }`}
            style={
              msg.role === "user"
                ? { backgroundColor: "var(--color-chat-user)", color: "#ffffff" }
                : { backgroundColor: "var(--color-chat-agent)", color: "var(--color-on-surface)" }
            }
          >
            <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
            {msg.role === "model" && (
              <button
                onClick={() => navigator.clipboard.writeText(msg.content)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded"
                style={{ backgroundColor: "var(--color-surface-container)" }}
                title="Copy response"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5" style={{ color: "var(--color-on-surface-variant)" }}>
                  <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                </svg>
              </button>
            )}
          </div>
        </div>
      ))}

      {isGenerating && streamingContent && (
        <div className="flex justify-start">
          <div
            className="max-w-[76%] mr-12 px-4 py-3 text-sm bubble-agent leading-relaxed"
            style={{ backgroundColor: "var(--color-chat-agent)", color: "var(--color-on-surface)" }}
          >
            <pre className="whitespace-pre-wrap font-sans">{streamingContent}</pre>
            <span className="inline-block w-1.5 h-4 animate-pulse ml-0.5 rounded-sm align-middle" style={{ backgroundColor: "var(--color-primary)" }} />
          </div>
        </div>
      )}

      {isGenerating && !streamingContent && (
        <div className="flex justify-start">
          <div className="px-4 py-3 bubble-agent" style={{ backgroundColor: "var(--color-chat-agent)" }}>
            <div className="flex gap-1 items-center h-4">
              <span className="w-2 h-2 rounded-full animate-bounce [animation-delay:0ms]" style={{ backgroundColor: "var(--color-primary)" }} />
              <span className="w-2 h-2 rounded-full animate-bounce [animation-delay:150ms]" style={{ backgroundColor: "var(--color-primary)" }} />
              <span className="w-2 h-2 rounded-full animate-bounce [animation-delay:300ms]" style={{ backgroundColor: "var(--color-primary)" }} />
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
