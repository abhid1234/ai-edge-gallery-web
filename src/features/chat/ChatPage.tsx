import { useModel } from "../../contexts/ModelContext";
import { useChatSession } from "./useChatSession";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";

export function Component() {
  const { currentModel } = useModel();
  const { messages, streamingContent, isGenerating, sendMessage, resetSession, cancelGeneration } =
    useChatSession();

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-[#F0F4F9]">
      {/* Subtle header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
        <div>
          <h2 className="text-xl font-bold text-[#1F1F1F]">Chat</h2>
          {currentModel && (
            <p className="text-xs text-[#444746] mt-0.5">
              {currentModel.name} · on-device via WebGPU
            </p>
          )}
        </div>
        {messages.length > 0 && (
          <button
            onClick={resetSession}
            className="text-sm text-[#0B57D0] hover:text-[#0842A0] px-3 py-1.5 rounded-xl hover:bg-[#D3E3FD]/50 transition-colors font-medium"
          >
            New chat
          </button>
        )}
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col mx-4 mb-4 bg-white rounded-2xl overflow-hidden shadow-sm">
        <MessageList
          messages={messages}
          streamingContent={streamingContent}
          isGenerating={isGenerating}
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
