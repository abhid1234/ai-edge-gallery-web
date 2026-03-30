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
      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
        Send a message to start chatting
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto space-y-4 p-4">
      {messages.map((msg) => (
        <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
          <div className={`max-w-[75%] rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
            msg.role === "user" ? "bg-primary text-white" : "bg-gray-100 text-gray-900"
          }`}>
            <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
          </div>
        </div>
      ))}

      {isGenerating && streamingContent && (
        <div className="flex justify-start">
          <div className="max-w-[75%] rounded-xl px-4 py-2.5 text-sm bg-gray-100 text-gray-900 leading-relaxed">
            <pre className="whitespace-pre-wrap font-sans">{streamingContent}</pre>
            <span className="inline-block w-1.5 h-4 bg-gray-400 animate-pulse ml-0.5" />
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
