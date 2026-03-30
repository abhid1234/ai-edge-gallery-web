import { useModel } from "../../contexts/ModelContext";
import { useChatSession } from "./useChatSession";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";

export function Component() {
  const { currentModel } = useModel();
  const { messages, streamingContent, isGenerating, sendMessage, resetSession, cancelGeneration } = useChatSession();

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">AI Chat</h2>
          <p className="text-sm text-gray-500">Multi-turn conversation — fully on-device via WebGPU</p>
        </div>
        {messages.length > 0 && (
          <button onClick={resetSession} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 border border-gray-200 rounded-lg">
            New conversation
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden">
        <MessageList messages={messages} streamingContent={streamingContent} isGenerating={isGenerating} />
        <ChatInput onSend={sendMessage} onCancel={cancelGeneration} disabled={!currentModel} isGenerating={isGenerating} />
      </div>
    </div>
  );
}
