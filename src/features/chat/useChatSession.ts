import { useState, useCallback, useRef, useEffect } from "react";
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
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem("chat_messages");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [streamingContent, setStreamingContent] = useState("");
  const { generate, cancel, isGenerating } = useModel();
  const doneHandledRef = useRef(false);

  useEffect(() => {
    localStorage.setItem("chat_messages", JSON.stringify(messages));
  }, [messages]);

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
      doneHandledRef.current = false;

      const prompt = formatGemmaPrompt(messages, content);

      let fullResponse = "";
      const genStart = performance.now();
      let firstTokenTime = -1;
      let tokenCount = 0;
      try {
        await generate(prompt, (partial, done) => {
          const now = performance.now();
          if (firstTokenTime < 0) firstTokenTime = now;
          fullResponse += partial;
          tokenCount = Math.round(fullResponse.length / 4);
          setStreamingContent(fullResponse);

          if (done && !doneHandledRef.current) {
            doneHandledRef.current = true;
            const totalMs = now - genStart;
            const ttft = firstTokenTime >= 0 ? firstTokenTime - genStart : 0;
            const tokensPerSec = totalMs > 0 ? (tokenCount / totalMs) * 1000 : 0;
            try {
              const existing = JSON.parse(localStorage.getItem("session_perf_stats") || "[]");
              existing.push({
                prompt: content.slice(0, 50),
                tokenCount,
                ttft: Math.round(ttft),
                tokensPerSec: parseFloat(tokensPerSec.toFixed(2)),
                totalMs: Math.round(totalMs),
                timestamp: Date.now(),
              });
              localStorage.setItem("session_perf_stats", JSON.stringify(existing.slice(-50)));
            } catch { /* storage quota or parse error — ignore */ }

            const modelMessage: ChatMessage = {
              id: crypto.randomUUID(),
              role: "model",
              content: fullResponse.trim(),
              timestamp: Date.now(),
            };
            setMessages((prev) => [...prev, modelMessage]);
            setStreamingContent("");
          }
        });

        // Fallback: if callback never fired done=true, use the return value
        if (!doneHandledRef.current && fullResponse.trim()) {
          doneHandledRef.current = true;
          const totalMs = performance.now() - genStart;
          const ttft = firstTokenTime >= 0 ? firstTokenTime - genStart : 0;
          const tokensPerSec = totalMs > 0 ? (tokenCount / totalMs) * 1000 : 0;
          try {
            const existing = JSON.parse(localStorage.getItem("session_perf_stats") || "[]");
            existing.push({
              prompt: content.slice(0, 50),
              tokenCount,
              ttft: Math.round(ttft),
              tokensPerSec: parseFloat(tokensPerSec.toFixed(2)),
              totalMs: Math.round(totalMs),
              timestamp: Date.now(),
            });
            localStorage.setItem("session_perf_stats", JSON.stringify(existing.slice(-50)));
          } catch { /* ignore */ }

          const modelMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: "model",
            content: fullResponse.trim(),
            timestamp: Date.now(),
          };
          setMessages((prev) => [...prev, modelMessage]);
          setStreamingContent("");
        }
      } catch (e) {
        // If generation fails, still add whatever we got
        if (fullResponse.trim() && !doneHandledRef.current) {
          doneHandledRef.current = true;
          const modelMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: "model",
            content: fullResponse.trim(),
            timestamp: Date.now(),
          };
          setMessages((prev) => [...prev, modelMessage]);
        }
        setStreamingContent("");
      }
    },
    [messages, generate]
  );

  const resetSession = useCallback(() => {
    setMessages([]);
    setStreamingContent("");
    localStorage.removeItem("chat_messages");
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
