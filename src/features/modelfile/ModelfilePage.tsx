import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router";

// Known valid parameter keys
const KNOWN_PARAMS = new Set(["temperature", "top_k", "top_p", "num_predict", "repeat_penalty", "seed"]);

// Known model IDs in catalog
const CATALOG_MODEL_IDS = new Set(["gemma-3-1b", "gemma-3n-e2b", "gemma-3n-e4b", "qwen-1.5b", "deepseek-r1"]);

const TEMPLATES: Record<string, string> = {
  "Code Assistant": `FROM gemma-3-1b
SYSTEM You are a helpful coding assistant. Write clean, efficient code.
PARAMETER temperature 0.3
PARAMETER top_k 20`,
  "Creative Writer": `FROM gemma-3-1b
SYSTEM You are a creative storyteller. Write vivid, imaginative prose.
PARAMETER temperature 0.9
PARAMETER top_k 50
PARAMETER top_p 0.95`,
  "Translator": `FROM gemma-3-1b
SYSTEM You are a professional translator. Translate text accurately while preserving tone and meaning.
PARAMETER temperature 0.2
PARAMETER top_k 10`,
};

const DEFAULT_MODELFILE = TEMPLATES["Code Assistant"];

interface ParsedModelfile {
  from: string | null;
  system: string | null;
  parameters: { key: string; value: string }[];
  messages: { role: "user" | "assistant"; text: string }[];
}

interface ValidationError {
  line: number;
  message: string;
}

function parseModelfile(text: string): { parsed: ParsedModelfile; errors: ValidationError[] } {
  const lines = text.split("\n");
  const parsed: ParsedModelfile = { from: null, system: null, parameters: [], messages: [] };
  const errors: ValidationError[] = [];
  let hasFrom = false;

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) return;
    const lineNum = idx + 1;

    if (line.toUpperCase().startsWith("FROM ")) {
      const modelName = line.slice(5).trim();
      if (!modelName) {
        errors.push({ line: lineNum, message: "FROM requires a model name" });
      } else {
        parsed.from = modelName;
        hasFrom = true;
      }
    } else if (line.toUpperCase().startsWith("SYSTEM ")) {
      const systemText = line.slice(7).trim();
      if (!systemText) {
        errors.push({ line: lineNum, message: "SYSTEM must be followed by text" });
      } else {
        parsed.system = systemText;
      }
    } else if (line.toUpperCase().startsWith("PARAMETER ")) {
      const rest = line.slice(10).trim();
      const spaceIdx = rest.indexOf(" ");
      if (spaceIdx === -1) {
        errors.push({ line: lineNum, message: "PARAMETER must be 'key value' format" });
      } else {
        const key = rest.slice(0, spaceIdx).toLowerCase();
        const value = rest.slice(spaceIdx + 1).trim();
        if (!KNOWN_PARAMS.has(key)) {
          errors.push({ line: lineNum, message: `Unknown parameter key: '${key}'` });
        }
        parsed.parameters.push({ key, value });
      }
    } else if (line.toUpperCase().startsWith("MESSAGE ")) {
      const rest = line.slice(8).trim();
      const spaceIdx = rest.indexOf(" ");
      if (spaceIdx === -1) {
        errors.push({ line: lineNum, message: "MESSAGE must be 'user|assistant <text>'" });
      } else {
        const role = rest.slice(0, spaceIdx).toLowerCase();
        const text = rest.slice(spaceIdx + 1).trim();
        if (role !== "user" && role !== "assistant") {
          errors.push({ line: lineNum, message: `MESSAGE role must be 'user' or 'assistant', got '${role}'` });
        } else {
          parsed.messages.push({ role: role as "user" | "assistant", text });
        }
      }
    } else {
      errors.push({ line: lineNum, message: `Unknown directive: '${line.split(" ")[0]}'` });
    }
  });

  // FROM must be present and first non-comment line
  const firstMeaningfulLine = lines.findIndex((l) => {
    const t = l.trim();
    return t && !t.startsWith("#");
  });
  if (firstMeaningfulLine !== -1) {
    const firstLine = lines[firstMeaningfulLine].trim().toUpperCase();
    if (!firstLine.startsWith("FROM ")) {
      errors.unshift({ line: firstMeaningfulLine + 1, message: "Modelfile must start with FROM <model-name>" });
    }
  } else if (!hasFrom) {
    errors.unshift({ line: 1, message: "Modelfile must start with FROM <model-name>" });
  }

  return { parsed, errors };
}

export function Component() {
  const navigate = useNavigate();
  const [text, setText] = useState(DEFAULT_MODELFILE);
  const [copyToast, setCopyToast] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const templateRef = useRef<HTMLDivElement>(null);

  const { parsed, errors } = parseModelfile(text);

  useEffect(() => {
    if (!templateOpen) return;
    const handler = (e: MouseEvent) => {
      if (templateRef.current && !templateRef.current.contains(e.target as Node)) {
        setTemplateOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [templateOpen]);

  const handleExport = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopyToast(true);
      setTimeout(() => setCopyToast(false), 2000);
    });
  }, [text]);

  const handleLoadIntoChat = useCallback(() => {
    // Store modelfile config in sessionStorage for chat to pick up
    sessionStorage.setItem("modelfile_config", JSON.stringify(parsed));
    navigate("/chat");
  }, [parsed, navigate]);

  const handleLoadTemplate = useCallback((name: string) => {
    setText(TEMPLATES[name]);
    setTemplateOpen(false);
  }, []);

  const modelInCatalog = parsed.from ? CATALOG_MODEL_IDS.has(parsed.from) : null;

  // Syntax-highlight-style: color-code lines by directive
  const highlightedLines = text.split("\n").map((rawLine, i) => {
    const line = rawLine.trim();
    const lineNum = i + 1;
    const hasError = errors.some((e) => e.line === lineNum);

    let color = "var(--color-on-surface-variant)";
    if (line.toUpperCase().startsWith("FROM ")) color = "#c792ea";
    else if (line.toUpperCase().startsWith("SYSTEM ")) color = "#82aaff";
    else if (line.toUpperCase().startsWith("PARAMETER ")) color = "#f78c6c";
    else if (line.toUpperCase().startsWith("MESSAGE ")) color = "#c3e88d";
    else if (line.startsWith("#")) color = "#546e7a";

    return { raw: rawLine, color, hasError, lineNum };
  });

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-5 pb-4 flex-shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-[var(--color-on-surface)]">Modelfile Editor</h2>
          <p className="text-sm text-[var(--color-on-surface-variant)] mt-1">
            Configure your model like a Dockerfile — FROM, SYSTEM, PARAMETER, MESSAGE
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Load Template dropdown */}
          <div ref={templateRef} className="relative">
            <button
              onClick={() => setTemplateOpen((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border transition-colors"
              style={{
                borderColor: "var(--color-outline-variant)",
                color: "var(--color-on-surface-variant)",
                backgroundColor: templateOpen ? "var(--color-surface-container)" : "transparent",
              }}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13z" />
              </svg>
              Load Template
              <svg viewBox="0 0 24 24" fill="currentColor" className={`w-3 h-3 transition-transform ${templateOpen ? "rotate-180" : ""}`}>
                <path d="M7 10l5 5 5-5z" />
              </svg>
            </button>
            {templateOpen && (
              <div
                className="absolute right-0 top-full mt-1 z-20 rounded-xl shadow-lg min-w-[180px] overflow-hidden"
                style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-outline-variant)" }}
              >
                {Object.keys(TEMPLATES).map((name) => (
                  <button
                    key={name}
                    onClick={() => handleLoadTemplate(name)}
                    className="w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-[var(--color-surface-container)]"
                    style={{ color: "var(--color-on-surface)" }}
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border transition-colors"
            style={{
              borderColor: "var(--color-outline-variant)",
              color: "var(--color-on-surface-variant)",
            }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
            </svg>
            {copyToast ? "Copied!" : "Export"}
          </button>

          <button
            onClick={handleLoadIntoChat}
            disabled={errors.length > 0 || !parsed.from}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            style={{ backgroundColor: "var(--color-primary)", color: "#fff" }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
            </svg>
            Load into Chat
          </button>
        </div>
      </div>

      {/* Split panel */}
      <div className="flex flex-1 gap-4 px-6 pb-6 overflow-hidden">
        {/* Left panel: editor */}
        <div className="flex flex-col flex-[3] overflow-hidden rounded-xl border" style={{ borderColor: "var(--color-outline-variant)", backgroundColor: "#1e1e2e" }}>
          {/* Editor header */}
          <div className="flex items-center gap-2 px-4 py-2 border-b" style={{ borderColor: "#313244" }}>
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
              <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
              <div className="w-3 h-3 rounded-full bg-[#28c840]" />
            </div>
            <span className="text-xs font-mono ml-2" style={{ color: "#6c7086" }}>Modelfile</span>
            {errors.length > 0 && (
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#45253a", color: "#f38ba8" }}>
                {errors.length} error{errors.length > 1 ? "s" : ""}
              </span>
            )}
            {errors.length === 0 && parsed.from && (
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#1e3a2e", color: "#a6e3a1" }}>
                Valid
              </span>
            )}
          </div>

          {/* Editor body: overlay textarea on top of highlighted display */}
          <div className="relative flex-1 overflow-hidden">
            {/* Highlighted background */}
            <div
              className="absolute inset-0 overflow-auto p-4 font-mono text-sm leading-6 pointer-events-none select-none"
              aria-hidden="true"
            >
              {highlightedLines.map(({ raw, color, hasError }, i) => (
                <div
                  key={i}
                  className="flex"
                  style={{ backgroundColor: hasError ? "rgba(243,139,168,0.08)" : "transparent" }}
                >
                  <span className="w-8 flex-shrink-0 text-right pr-3 select-none text-xs" style={{ color: "#4a4e69", lineHeight: "1.5rem" }}>
                    {i + 1}
                  </span>
                  <span style={{ color, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{raw || " "}</span>
                </div>
              ))}
            </div>

            {/* Actual textarea (transparent, positioned on top) */}
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              spellCheck={false}
              className="absolute inset-0 w-full h-full resize-none font-mono text-sm leading-6 pl-12 pr-4 pt-4 pb-4 bg-transparent outline-none"
              style={{ color: "transparent", caretColor: "#cdd6f4" }}
            />
          </div>
        </div>

        {/* Right panel: preview */}
        <div
          className="flex flex-col flex-[2] overflow-y-auto rounded-xl border p-5 gap-4"
          style={{ borderColor: "var(--color-outline-variant)", backgroundColor: "var(--color-surface)" }}
        >
          <h3 className="text-sm font-semibold" style={{ color: "var(--color-on-surface)" }}>Live Preview</h3>

          {/* Model name */}
          <section>
            <p className="text-xs font-medium mb-1.5" style={{ color: "var(--color-on-surface-variant)" }}>Base Model</p>
            {parsed.from ? (
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono font-semibold" style={{ color: "var(--color-on-surface)" }}>{parsed.from}</span>
                {modelInCatalog ? (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: "#1e3a2e", color: "#a6e3a1" }}>
                    In catalog
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: "#3a2a1e", color: "#fab387" }}>
                    Not in catalog
                  </span>
                )}
              </div>
            ) : (
              <span className="text-sm" style={{ color: "var(--color-on-surface-variant)" }}>—</span>
            )}
          </section>

          {/* System prompt */}
          <section>
            <p className="text-xs font-medium mb-1.5" style={{ color: "var(--color-on-surface-variant)" }}>System Prompt</p>
            {parsed.system ? (
              <div
                className="text-sm p-3 rounded-lg leading-relaxed"
                style={{ backgroundColor: "var(--color-surface-container)", color: "var(--color-on-surface)" }}
              >
                {parsed.system}
              </div>
            ) : (
              <span className="text-sm" style={{ color: "var(--color-on-surface-variant)" }}>None</span>
            )}
          </section>

          {/* Parameters */}
          {parsed.parameters.length > 0 && (
            <section>
              <p className="text-xs font-medium mb-1.5" style={{ color: "var(--color-on-surface-variant)" }}>Parameters</p>
              <table className="w-full text-sm">
                <tbody>
                  {parsed.parameters.map(({ key, value }, i) => (
                    <tr key={i} className="border-b last:border-0" style={{ borderColor: "var(--color-outline-variant)" }}>
                      <td className="py-1.5 pr-4 font-mono font-medium" style={{ color: "var(--color-primary)" }}>{key}</td>
                      <td className="py-1.5 font-mono" style={{ color: "var(--color-on-surface)" }}>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {/* Few-shot messages */}
          {parsed.messages.length > 0 && (
            <section>
              <p className="text-xs font-medium mb-1.5" style={{ color: "var(--color-on-surface-variant)" }}>
                Few-shot Examples ({Math.floor(parsed.messages.length / 2)} pair{Math.floor(parsed.messages.length / 2) !== 1 ? "s" : ""}, {parsed.messages.length} message{parsed.messages.length !== 1 ? "s" : ""})
              </p>
              <div className="space-y-2">
                {parsed.messages.map(({ role, text }, i) => (
                  <div
                    key={i}
                    className="text-xs p-2.5 rounded-lg"
                    style={{
                      backgroundColor: role === "user" ? "var(--color-primary-container)" : "var(--color-surface-container)",
                      color: role === "user" ? "var(--color-on-primary-container)" : "var(--color-on-surface)",
                    }}
                  >
                    <span className="font-semibold capitalize mr-2">{role}:</span>
                    {text}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Validation errors */}
          {errors.length > 0 && (
            <section>
              <p className="text-xs font-medium mb-1.5" style={{ color: "#f38ba8" }}>Validation Errors</p>
              <div className="space-y-1.5">
                {errors.map((e, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs p-2.5 rounded-lg" style={{ backgroundColor: "rgba(243,139,168,0.12)", color: "#f38ba8" }}>
                    <span className="font-mono flex-shrink-0">L{e.line}</span>
                    <span>{e.message}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {errors.length === 0 && parsed.from && (
            <div className="mt-auto pt-2">
              <div className="text-xs p-3 rounded-lg" style={{ backgroundColor: "#1e3a2e", color: "#a6e3a1" }}>
                Modelfile is valid. Click "Load into Chat" to apply these settings.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
