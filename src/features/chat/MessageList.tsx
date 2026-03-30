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
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-[#444746]">
        {/* Decorative icon */}
        <div className="w-14 h-14 rounded-full bg-[#F0F4F9] flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7 text-[#3174F1]">
            <path
              d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"
              fill="currentColor"
            />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-[#1F1F1F]">Start a conversation</p>
          <p className="text-xs text-[#747775] mt-0.5">
            Type a message below to chat with your on-device model
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-[76%] px-4 py-3 text-sm leading-relaxed ${
              msg.role === "user"
                ? "bubble-user bg-[#32628D] text-white ml-12"
                : "bubble-agent bg-[#E9EEF6] text-[#1F1F1F] mr-12"
            }`}
          >
            <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
          </div>
        </div>
      ))}

      {isGenerating && streamingContent && (
        <div className="flex justify-start">
          <div className="max-w-[76%] mr-12 px-4 py-3 text-sm bubble-agent bg-[#E9EEF6] text-[#1F1F1F] leading-relaxed">
            <pre className="whitespace-pre-wrap font-sans">{streamingContent}</pre>
            <span className="inline-block w-1.5 h-4 bg-[#3174F1] animate-pulse ml-0.5 rounded-sm align-middle" />
          </div>
        </div>
      )}

      {isGenerating && !streamingContent && (
        <div className="flex justify-start">
          <div className="px-4 py-3 bubble-agent bg-[#E9EEF6]">
            <div className="flex gap-1 items-center h-4">
              <span className="w-2 h-2 rounded-full bg-[#3174F1] animate-bounce [animation-delay:0ms]" />
              <span className="w-2 h-2 rounded-full bg-[#3174F1] animate-bounce [animation-delay:150ms]" />
              <span className="w-2 h-2 rounded-full bg-[#3174F1] animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
