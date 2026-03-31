import { useEffect, useRef } from "react";
import type { ChatMessage } from "../../types";

interface Props {
  messages: ChatMessage[];
  streamingContent: string;
  isGenerating: boolean;
}

export function MessageList({ messages, streamingContent, isGenerating }: Props) {
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
            className={`max-w-[76%] px-4 py-3 text-sm leading-relaxed ${
              msg.role === "user" ? "bubble-user ml-12" : "bubble-agent mr-12"
            }`}
            style={
              msg.role === "user"
                ? { backgroundColor: "var(--color-chat-user)", color: "#ffffff" }
                : { backgroundColor: "var(--color-chat-agent)", color: "var(--color-on-surface)" }
            }
          >
            <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
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
