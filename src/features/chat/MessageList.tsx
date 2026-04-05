import { useEffect, useRef, useMemo } from "react";
import type { ChatMessage } from "../../types";
import { renderMarkdown } from "../../lib/renderMarkdown";

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

interface ThinkingResult {
  thinking: string | null;
  content: string;
  isIncomplete: boolean;
}

function extractThinking(raw: string, isStreaming = false): ThinkingResult {
  const openTag = "<think>";
  const closeTag = "</think>";
  const openIdx = raw.indexOf(openTag);

  if (openIdx === -1) {
    return { thinking: null, content: raw, isIncomplete: false };
  }

  const closeIdx = raw.indexOf(closeTag, openIdx);

  if (closeIdx === -1) {
    // Tag not yet closed — streaming in progress
    if (isStreaming) {
      const thinking = raw.slice(openIdx + openTag.length);
      return { thinking, content: "", isIncomplete: true };
    }
    // Malformed but not streaming — show everything as content
    return { thinking: null, content: raw, isIncomplete: false };
  }

  const thinking = raw.slice(openIdx + openTag.length, closeIdx).trim();
  const before = raw.slice(0, openIdx);
  const after = raw.slice(closeIdx + closeTag.length);
  const content = (before + after).trim();

  return { thinking: thinking || null, content, isIncomplete: false };
}

function ThinkingBlock({ thinking, isIncomplete }: { thinking: string; isIncomplete?: boolean }) {
  return (
    <details className="mb-2 text-xs rounded-lg overflow-hidden" style={{ border: "1px solid var(--color-outline-variant)" }}>
      <summary
        className="cursor-pointer px-3 py-2 font-medium flex items-center gap-1.5 select-none"
        style={{ backgroundColor: "var(--color-surface-container-high)", color: "var(--color-on-surface-variant)" }}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 flex-shrink-0">
          <path d="M12 2a9 9 0 1 0 0 18A9 9 0 0 0 12 2zm1 13h-2v-2h2v2zm0-4h-2V7h2v4z" />
        </svg>
        {isIncomplete ? "Thinking…" : "Reasoning trace"}
        {isIncomplete && (
          <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: "var(--color-primary)" }} />
        )}
      </summary>
      <pre
        className="px-3 py-2 whitespace-pre-wrap font-sans text-[11px] leading-relaxed"
        style={{ color: "var(--color-on-surface-variant)", backgroundColor: "var(--color-surface-container)" }}
      >
        {thinking}
      </pre>
    </details>
  );
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
      {messages.filter((msg) => msg.content.trim()).map((msg) => {
        const parsed = msg.role === "model" ? extractThinking(msg.content) : null;

        return (
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
              {parsed?.thinking && (
                <ThinkingBlock thinking={parsed.thinking} />
              )}
              {msg.role === "model" ? (
                /* Model output rendered as markdown. renderMarkdown escapes all HTML entities before formatting. */
                <div className="whitespace-pre-wrap font-sans" dangerouslySetInnerHTML={{ __html: renderMarkdown(parsed ? parsed.content : msg.content) }} />
              ) : (
                <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
              )}
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
        );
      })}

      {isGenerating && streamingContent && (() => {
        const parsed = extractThinking(streamingContent, true);
        return (
          <div className="flex justify-start">
            <div>
              <div
                className="max-w-[76%] mr-12 px-4 py-3 text-sm bubble-agent leading-relaxed"
                style={{ backgroundColor: "var(--color-chat-agent)", color: "var(--color-on-surface)" }}
              >
                {parsed.thinking && (
                  <ThinkingBlock thinking={parsed.thinking} isIncomplete={parsed.isIncomplete} />
                )}
                {parsed.content && (
                  /* Streaming model output — renderMarkdown escapes HTML */
                  <div className="whitespace-pre-wrap font-sans" dangerouslySetInnerHTML={{ __html: renderMarkdown(parsed.content) }} />
                )}
                {!parsed.isIncomplete && (
                  <span className="inline-block w-1.5 h-4 animate-pulse ml-0.5 rounded-sm" style={{ backgroundColor: "var(--color-primary)" }} />
                )}
              </div>
              <div className="mt-1 text-[10px] flex items-center gap-1.5" style={{ color: "var(--color-on-surface-variant)" }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: "#34A853" }} />
                Running on-device
              </div>
            </div>
          </div>
        );
      })()}

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
