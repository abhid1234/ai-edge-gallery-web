import { useState, useCallback, useRef, useEffect } from "react";
import { useModel } from "../../contexts/ModelContext";
import type { ChatMessage, ModelInfo } from "../../types";
import { detectRepetition } from "../../lib/repetitionDetector";

function formatPrompt(messages: ChatMessage[], newMessage: string, model: ModelInfo | null): string {
  const template = model?.chatTemplate || "gemma";

  if (template === "chatml") {
    // ChatML: Qwen, DeepSeek, SmolLM, Phi-4
    let prompt = "";
    for (const msg of messages) {
      const role = msg.role === "user" ? "user" : "assistant";
      prompt += `<|im_start|>${role}\n${msg.content}<|im_end|>\n`;
    }
    prompt += `<|im_start|>user\n${newMessage}<|im_end|>\n<|im_start|>assistant\n`;
    return prompt;
  }

  if (template === "zephyr") {
    // Zephyr: TinyLlama
    let prompt = "";
    for (const msg of messages) {
      const role = msg.role === "user" ? "user" : "assistant";
      prompt += `<|${role}|>\n${msg.content}</s>\n`;
    }
    prompt += `<|user|>\n${newMessage}</s>\n<|assistant|>\n`;
    return prompt;
  }

  // Default: Gemma template
  let prompt = "";
  for (const msg of messages) {
    const role = msg.role === "user" ? "user" : "model";
    prompt += `<start_of_turn>${role}\n${msg.content}<end_of_turn>\n`;
  }
  prompt += `<start_of_turn>user\n${newMessage}<end_of_turn>\n<start_of_turn>model\n`;
  return prompt;
}

const MAX_MESSAGES = 50;

export function useChatSession() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem("chat_messages");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [streamingContent, setStreamingContent] = useState("");
  const { generate, cancel, isGenerating, currentModel } = useModel();
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

      setMessages((prev) => {
        const updated = [...prev, userMessage];
        return updated.length > MAX_MESSAGES ? updated.slice(-MAX_MESSAGES) : updated;
      });
      setStreamingContent("");
      doneHandledRef.current = false;

      const prompt = formatPrompt(messages, content, currentModel);

      let fullResponse = "";
      const genStart = performance.now();
      let firstTokenTime = -1;
      let tokenCount = 0;
      try {
        let repetitionCancelled = false;
        await generate(prompt, (partial, done) => {
          const now = performance.now();
          if (firstTokenTime < 0) firstTokenTime = now;
          fullResponse += partial;
          tokenCount = Math.round(fullResponse.length / 4);

          // Detect repetition loops and auto-cancel
          if (!done && !repetitionCancelled && fullResponse.length > 100 && detectRepetition(fullResponse)) {
            repetitionCancelled = true;
            cancel();
            // Trim to content before the repetition started
            const words = fullResponse.trim().split(/\s+/);
            const seen = new Set<string>();
            let cutoff = words.length;
            for (let i = Math.max(0, words.length - 30); i < words.length - 2; i++) {
              const trigram = words.slice(i, i + 3).join(" ");
              if (seen.has(trigram)) { cutoff = i; break; }
              seen.add(trigram);
            }
            fullResponse = words.slice(0, cutoff).join(" ") + "\n\n⚠️ _Response was cut short — the model started repeating itself._";
            setStreamingContent(fullResponse);
            return;
          }

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
            setMessages((prev) => {
              const updated = [...prev, modelMessage];
              return updated.length > MAX_MESSAGES ? updated.slice(-MAX_MESSAGES) : updated;
            });
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
