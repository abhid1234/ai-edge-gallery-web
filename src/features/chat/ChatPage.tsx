import { useState, useMemo, useEffect, useRef } from "react";
import { useModel } from "../../contexts/ModelContext";
import { useChatSession } from "./useChatSession";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { GenerationSettings, type GenerationConfig } from "../../components/GenerationSettings";
import type { ChatMessage } from "../../types";

type OutputMode = "text" | "json" | "schema";

function formatAsMarkdown(messages: ChatMessage[], modelName: string): string {
  const date = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const lines = [
    "## Chat Export",
    `**Model:** ${modelName} | **Date:** ${date}`,
    "",
  ];
  for (const msg of messages) {
    const role = msg.role === "user" ? "User" : "Assistant";
    lines.push(`**${role}:** ${msg.content}`, "");
  }
  return lines.join("\n");
}

function formatAsJSON(messages: ChatMessage[], modelName: string): string {
  const date = new Date().toISOString().split("T")[0];
  return JSON.stringify({ model: modelName, date, messages }, null, 2);
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

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
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [exportToast, setExportToast] = useState("");
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!exportMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [exportMenuOpen]);

  useEffect(() => {
    if (exportToast) {
      const t = setTimeout(() => setExportToast(""), 2000);
      return () => clearTimeout(t);
    }
  }, [exportToast]);

  const modelName = currentModel?.name ?? "Unknown Model";

  const handleCopyMarkdown = () => {
    const md = formatAsMarkdown(messages, modelName);
    navigator.clipboard.writeText(md).then(() => {
      setExportToast("Copied to clipboard");
      setExportMenuOpen(false);
    });
  };

  const handleDownloadMarkdown = () => {
    downloadFile(formatAsMarkdown(messages, modelName), "chat-export.md", "text/markdown");
    setExportMenuOpen(false);
  };

  const handleDownloadJSON = () => {
    downloadFile(formatAsJSON(messages, modelName), "chat-export.json", "application/json");
    setExportMenuOpen(false);
  };

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
      {/* Export toast */}
      {exportToast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl text-sm font-medium shadow-lg"
          style={{ backgroundColor: "var(--color-primary)", color: "#fff" }}
        >
          {exportToast}
        </div>
      )}

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
        <div className="flex items-center gap-2">
          {/* Export button + dropdown */}
          {messages.length > 0 && (
            <div ref={exportRef} className="relative">
              <button
                onClick={() => setExportMenuOpen((v) => !v)}
                className="text-sm px-3 py-1.5 rounded-xl transition-colors font-medium flex items-center gap-1.5"
                style={{
                  color: "var(--color-on-surface-variant)",
                  backgroundColor: exportMenuOpen
                    ? "var(--color-surface-container-high)"
                    : "transparent",
                }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                </svg>
                Export
              </button>
              {exportMenuOpen && (
                <div
                  className="absolute right-0 top-full mt-1 z-20 rounded-xl shadow-lg overflow-hidden min-w-[200px]"
                  style={{
                    backgroundColor: "var(--color-surface)",
                    border: "1px solid var(--color-outline-variant)",
                  }}
                >
                  <button
                    onClick={handleCopyMarkdown}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left transition-colors hover:bg-[var(--color-surface-container)]"
                    style={{ color: "var(--color-on-surface)" }}
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 flex-shrink-0">
                      <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
                    </svg>
                    Copy as Markdown
                  </button>
                  <div style={{ borderTop: "1px solid var(--color-outline-variant)" }} />
                  <button
                    onClick={handleDownloadMarkdown}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left transition-colors hover:bg-[var(--color-surface-container)]"
                    style={{ color: "var(--color-on-surface)" }}
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 flex-shrink-0">
                      <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13z" />
                    </svg>
                    Download as Markdown
                  </button>
                  <button
                    onClick={handleDownloadJSON}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left transition-colors hover:bg-[var(--color-surface-container)]"
                    style={{ color: "var(--color-on-surface)" }}
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 flex-shrink-0">
                      <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13z" />
                    </svg>
                    Download as JSON
                  </button>
                </div>
              )}
            </div>
          )}
          {messages.length > 0 && (
            <button
              onClick={resetSession}
              className="text-sm text-[var(--color-primary)] hover:text-[var(--color-on-primary-container)] px-3 py-1.5 rounded-xl hover:bg-[var(--color-primary-container)]/50 transition-colors font-medium"
            >
              New chat
            </button>
          )}
        </div>
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
