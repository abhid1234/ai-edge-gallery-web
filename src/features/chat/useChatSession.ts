import { useState, useCallback } from "react";
import { useModel } from "../../contexts/ModelContext";
import type { ChatMessage } from "../../types";

function formatGemmaPrompt(messages: ChatMessage[], newMessage: string): string {
  let prompt = "";
  for (const msg of messages) {
    const role = msg.role === "user" ? "user" : "model";
    prompt += `<start_of_turn>${role}\n${msg.content}<end_of_turn>\n`;
  }
  prompt += `<start_of_turn>user\n${newMessage}<end_of_turn>\n<start_of_turn>model\n`;
  return prompt;
}

export function useChatSession() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingContent, setStreamingContent] = useState("");
  const { generate, cancel, isGenerating } = useModel();

  const sendMessage = useCallback(
    async (content: string) => {
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setStreamingContent("");

      const prompt = formatGemmaPrompt(messages, content);

      let fullResponse = "";
      await generate(prompt, (partial, done) => {
        fullResponse += partial;
        setStreamingContent(fullResponse);
        if (done) {
          const modelMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: "model",
            content: fullResponse,
            timestamp: Date.now(),
          };
          setMessages((prev) => [...prev, modelMessage]);
          setStreamingContent("");
        }
      });
    },
    [messages, generate]
  );

  const resetSession = useCallback(() => {
    setMessages([]);
    setStreamingContent("");
  }, []);

  return {
    messages,
    streamingContent,
    isGenerating,
    sendMessage,
    resetSession,
    cancelGeneration: cancel,
  };
}
