import { useState } from "react";
import { useModel } from "../../contexts/ModelContext";
import { useChatSession } from "./useChatSession";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { GenerationSettings, type GenerationConfig } from "../../components/GenerationSettings";

export function Component() {
  const { currentModel } = useModel();
  const { messages, streamingContent, isGenerating, sendMessage, resetSession, cancelGeneration } =
    useChatSession();
  const [genConfig, setGenConfig] = useState<GenerationConfig>({ temperature: 0.8, topK: 40, topP: 0.95 });

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] bg-[var(--color-surface-container)] max-w-3xl mx-auto w-full">
      {/* Subtle header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-on-surface)]">Chat</h2>
          {currentModel && (
            <p className="text-xs text-[var(--color-on-surface-variant)] mt-0.5">
              {currentModel.name} · on-device via WebGPU
            </p>
          )}
        </div>
        {messages.length > 0 && (
          <button
            onClick={resetSession}
            className="text-sm text-[var(--color-primary)] hover:text-[var(--color-on-primary-container)] px-3 py-1.5 rounded-xl hover:bg-[var(--color-primary-container)]/50 transition-colors font-medium"
          >
            New chat
          </button>
        )}
      </div>

      {/* Generation settings */}
      <div className="px-4 flex-shrink-0">
        <GenerationSettings config={genConfig} onChange={setGenConfig} />
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col mx-4 mb-4 bg-[var(--color-surface)] rounded-2xl overflow-hidden shadow-sm">
        <MessageList
          messages={messages}
          streamingContent={streamingContent}
          isGenerating={isGenerating}
          onSendPrompt={sendMessage}
        />
        <ChatInput
          onSend={sendMessage}
          onCancel={cancelGeneration}
          disabled={!currentModel}
          isGenerating={isGenerating}
        />
      </div>
    </div>
  );
}
