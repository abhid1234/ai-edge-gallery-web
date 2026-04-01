import { useState, useMemo } from "react";
import { useModel } from "../../contexts/ModelContext";
import { useChatSession } from "./useChatSession";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { GenerationSettings, type GenerationConfig } from "../../components/GenerationSettings";

type OutputMode = "text" | "json" | "schema";

const DEFAULT_CONFIG: GenerationConfig = {
  temperature: 0.8,
  topK: 40,
  topP: 0.95,
  minP: 0.0,
  maxTokens: 1024,
  repeatPenalty: 1.1,
  seed: -1,
};

const TOKEN_LIMIT = 2048;

function wrapPromptForMode(prompt: string, mode: OutputMode, schema: string): string {
  if (mode === "json") {
    return `${prompt}\n\nRespond with valid JSON only. No markdown, no explanation — just the raw JSON object.`;
  }
  if (mode === "schema") {
    const schemaText = schema.trim() || '{ "type": "object" }';
    return `${prompt}\n\nRespond with a JSON object that strictly conforms to this JSON Schema:\n${schemaText}\n\nOutput raw JSON only — no markdown, no explanation.`;
  }
  return prompt;
}

export function Component() {
  const { currentModel } = useModel();
  const { messages, streamingContent, isGenerating, sendMessage, resetSession, cancelGeneration } =
    useChatSession();
  const [genConfig, setGenConfig] = useState<GenerationConfig>(DEFAULT_CONFIG);
  const [outputMode, setOutputMode] = useState<OutputMode>("text");
  const [schema, setSchema] = useState("");
  const [schemaOpen, setSchemaOpen] = useState(false);

  // Estimate token count from all messages + streaming
  const tokenEstimate = useMemo(() => {
    const allText = messages.map((m) => m.content).join(" ") + streamingContent;
    return Math.round(allText.length / 4);
  }, [messages, streamingContent]);

  const tokenPercent = Math.min((tokenEstimate / TOKEN_LIMIT) * 100, 100);
  const tokenColor =
    tokenPercent > 80 ? "#EA4335" : tokenPercent > 60 ? "#FBBC04" : "#34A853";

  const handleSend = (prompt: string) => {
    const wrapped = wrapPromptForMode(prompt, outputMode, schema);
    sendMessage(wrapped);
  };

  const OUTPUT_MODES: { mode: OutputMode; label: string }[] = [
    { mode: "text",   label: "Text"   },
    { mode: "json",   label: "JSON"   },
    { mode: "schema", label: "Schema" },
  ];

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

      {/* Output mode pills + token counter */}
      <div className="px-4 mb-3 flex-shrink-0 flex items-center justify-between gap-3 flex-wrap">
        {/* Output mode toggle */}
        <div className="flex items-center gap-1 p-0.5 rounded-lg" style={{ backgroundColor: "var(--color-surface-container-high)" }}>
          {OUTPUT_MODES.map(({ mode, label }) => (
            <button
              key={mode}
              onClick={() => {
                setOutputMode(mode);
                if (mode === "schema") setSchemaOpen(true);
              }}
              className="text-xs font-medium px-3 py-1 rounded-md transition-colors"
              style={
                outputMode === mode
                  ? { backgroundColor: "var(--color-primary)", color: "#fff" }
                  : { color: "var(--color-on-surface-variant)", backgroundColor: "transparent" }
              }
            >
              {label}
            </button>
          ))}
        </div>

        {/* Token counter */}
        <div className="flex items-center gap-2 min-w-[140px]">
          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--color-outline-variant)" }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${tokenPercent}%`, backgroundColor: tokenColor }}
            />
          </div>
          <span className="text-[10px] font-mono flex-shrink-0" style={{ color: "var(--color-on-surface-variant)" }}>
            ~{tokenEstimate.toLocaleString()} tkns
          </span>
        </div>
      </div>

      {/* Schema textarea (collapsible) */}
      {outputMode === "schema" && (
        <div className="px-4 mb-2 flex-shrink-0">
          <button
            onClick={() => setSchemaOpen((v) => !v)}
            className="text-xs font-medium flex items-center gap-1 mb-1"
            style={{ color: "var(--color-primary)" }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className={`w-3 h-3 transition-transform ${schemaOpen ? "rotate-90" : ""}`}>
              <path d="M10 17l5-5-5-5v10z" />
            </svg>
            {schemaOpen ? "Hide schema" : "Edit schema"}
          </button>
          {schemaOpen && (
            <textarea
              value={schema}
              onChange={(e) => setSchema(e.target.value)}
              placeholder={'{\n  "type": "object",\n  "properties": {\n    "answer": { "type": "string" }\n  }\n}'}
              rows={6}
              className="w-full text-xs font-mono p-3 rounded-lg resize-y"
              style={{
                backgroundColor: "var(--color-surface-container-high)",
                color: "var(--color-on-surface)",
                border: "1px solid var(--color-outline-variant)",
                outline: "none",
              }}
            />
          )}
        </div>
      )}

      {/* Chat area */}
      <div className="flex-1 flex flex-col mx-4 mb-4 bg-[var(--color-surface)] rounded-2xl overflow-hidden shadow-sm">
        <MessageList
          messages={messages}
          streamingContent={streamingContent}
          isGenerating={isGenerating}
          onSendPrompt={handleSend}
        />
        <ChatInput
          onSend={handleSend}
          onCancel={cancelGeneration}
          disabled={!currentModel}
          isGenerating={isGenerating}
        />
      </div>
    </div>
  );
}
