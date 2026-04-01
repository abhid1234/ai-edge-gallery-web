import { useState, useRef, useEffect } from "react";
import { useModel } from "../../contexts/ModelContext";

interface ToolParam {
  name: string;
  type: string;
  description: string;
}

interface CustomTool {
  id: string;
  name: string;
  description: string;
  params: ToolParam[];
}

interface SandboxMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolCall?: { name: string; arguments: Record<string, string> };
}

const DEFAULT_TOOLS: CustomTool[] = [
  {
    id: "default-1",
    name: "get_weather",
    description: "Get current weather for a city",
    params: [{ name: "city", type: "string", description: "The city name" }],
  },
  {
    id: "default-2",
    name: "calculate",
    description: "Calculate a math expression",
    params: [{ name: "expression", type: "string", description: "The math expression" }],
  },
];

function loadTools(): CustomTool[] {
  try {
    const saved = localStorage.getItem("custom_tools");
    return saved ? JSON.parse(saved) : DEFAULT_TOOLS;
  } catch {
    return DEFAULT_TOOLS;
  }
}

function saveTools(tools: CustomTool[]) {
  localStorage.setItem("custom_tools", JSON.stringify(tools));
}

function buildSystemPrompt(tools: CustomTool[]): string {
  const toolDefs = tools
    .map((t) => {
      const paramLines = t.params
        .map((p) => `  Parameters: ${p.name} (${p.type}) - ${p.description}`)
        .join("\n");
      return `Tool: ${t.name}\nDescription: ${t.description}\n${paramLines}`;
    })
    .join("\n\n");

  return `You have access to these tools:\n\n${toolDefs}\n\nWhen the user asks something that requires a tool, respond with:\n<tool_call>{"name": "tool_name", "arguments": {"param": "value"}}</tool_call>\n\nOnly use a tool when clearly needed. Otherwise respond normally.`;
}

function parseToolCall(text: string): { name: string; arguments: Record<string, string> } | null {
  const match = text.match(/<tool_call>([\s\S]*?)<\/tool_call>/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

/** Safe math evaluator using only arithmetic tokens — no arbitrary code execution */
function safeMath(expr: string): string {
  const sanitized = expr.replace(/\s/g, "");
  if (!/^[\d+\-*/().^%]+$/.test(sanitized)) return "Invalid expression";
  try {
    // Only allow numeric literals, operators, and parentheses
    const tokens = sanitized.split(/([+\-*/()^%])/).filter(Boolean);
    const isValid = tokens.every((t) => /^[\d.]+$|^[+\-*/()^%]$/.test(t));
    if (!isValid) return "Invalid expression";
    // Use math-only parsing
    const result = mathEval(sanitized);
    return `= ${result}`;
  } catch {
    return "Could not evaluate expression";
  }
}

function mathEval(expr: string): number {
  // Recursive descent parser: handles +, -, *, /, (, )
  let pos = 0;
  const peek = () => expr[pos];
  const consume = () => expr[pos++];

  function parseExpr(): number {
    let left = parseTerm();
    while (peek() === "+" || peek() === "-") {
      const op = consume();
      const right = parseTerm();
      left = op === "+" ? left + right : left - right;
    }
    return left;
  }

  function parseTerm(): number {
    let left = parseFactor();
    while (peek() === "*" || peek() === "/") {
      const op = consume();
      const right = parseFactor();
      left = op === "*" ? left * right : left / right;
    }
    return left;
  }

  function parseFactor(): number {
    if (peek() === "(") {
      consume(); // (
      const val = parseExpr();
      consume(); // )
      return val;
    }
    if (peek() === "-") {
      consume();
      return -parseFactor();
    }
    let numStr = "";
    while (peek() !== undefined && /[\d.]/.test(peek())) {
      numStr += consume();
    }
    return parseFloat(numStr) || 0;
  }

  return parseExpr();
}

function simulateToolResult(toolName: string, args: Record<string, string>): string {
  switch (toolName) {
    case "get_weather": {
      const city = args.city || "Unknown";
      const temps = [14, 18, 22, 26, 9, 31];
      const conditions = ["Partly Cloudy", "Sunny", "Overcast", "Rainy", "Clear"];
      const temp = temps[city.length % temps.length];
      const cond = conditions[city.length % conditions.length];
      return `${cond}, ${temp}°C in ${city}`;
    }
    case "calculate": {
      return safeMath(args.expression || "");
    }
    default:
      return `Tool "${toolName}" executed with args: ${JSON.stringify(args)}`;
  }
}

function ToolEditor({
  tool,
  onUpdate,
  onDelete,
}: {
  tool: CustomTool;
  onUpdate: (updated: CustomTool) => void;
  onDelete: () => void;
}) {
  const addParam = () => {
    onUpdate({
      ...tool,
      params: [...tool.params, { name: "", type: "string", description: "" }],
    });
  };

  const updateParam = (idx: number, field: keyof ToolParam, value: string) => {
    const params = tool.params.map((p, i) => (i === idx ? { ...p, [field]: value } : p));
    onUpdate({ ...tool, params });
  };

  const removeParam = (idx: number) => {
    onUpdate({ ...tool, params: tool.params.filter((_, i) => i !== idx) });
  };

  return (
    <div
      className="p-4 rounded-xl space-y-3"
      style={{
        backgroundColor: "var(--color-surface-container)",
        border: "1px solid var(--color-outline-variant)",
      }}
    >
      <div className="flex gap-3 items-start">
        <div className="flex-1">
          <label className="block text-[10px] font-semibold mb-1" style={{ color: "var(--color-on-surface-variant)" }}>
            Function name
          </label>
          <input
            type="text"
            value={tool.name}
            onChange={(e) => onUpdate({ ...tool, name: e.target.value.replace(/\s/g, "_") })}
            placeholder="function_name"
            className="w-full px-3 py-2 rounded-lg text-xs font-mono"
            style={{
              backgroundColor: "var(--color-surface)",
              color: "var(--color-on-surface)",
              border: "1px solid var(--color-outline-variant)",
              outline: "none",
            }}
          />
        </div>
        <button
          onClick={onDelete}
          className="mt-5 p-1.5 rounded-lg transition-colors"
          style={{ color: "var(--color-error)" }}
          title="Remove tool"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
          </svg>
        </button>
      </div>
      <div>
        <label className="block text-[10px] font-semibold mb-1" style={{ color: "var(--color-on-surface-variant)" }}>
          Description
        </label>
        <input
          type="text"
          value={tool.description}
          onChange={(e) => onUpdate({ ...tool, description: e.target.value })}
          placeholder="What this tool does"
          className="w-full px-3 py-2 rounded-lg text-xs"
          style={{
            backgroundColor: "var(--color-surface)",
            color: "var(--color-on-surface)",
            border: "1px solid var(--color-outline-variant)",
            outline: "none",
          }}
        />
      </div>
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[10px] font-semibold" style={{ color: "var(--color-on-surface-variant)" }}>
            Parameters
          </label>
          <button
            onClick={addParam}
            className="text-[10px] px-2 py-0.5 rounded-md font-medium transition-colors"
            style={{
              backgroundColor: "var(--color-primary-container)",
              color: "var(--color-on-primary-container)",
            }}
          >
            + Add
          </button>
        </div>
        <div className="space-y-2">
          {tool.params.map((param, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <input
                type="text"
                value={param.name}
                onChange={(e) => updateParam(idx, "name", e.target.value)}
                placeholder="param_name"
                className="w-24 px-2 py-1.5 rounded-lg text-[11px] font-mono flex-shrink-0"
                style={{
                  backgroundColor: "var(--color-surface)",
                  color: "var(--color-on-surface)",
                  border: "1px solid var(--color-outline-variant)",
                  outline: "none",
                }}
              />
              <select
                value={param.type}
                onChange={(e) => updateParam(idx, "type", e.target.value)}
                className="w-20 px-2 py-1.5 rounded-lg text-[11px] flex-shrink-0"
                style={{
                  backgroundColor: "var(--color-surface)",
                  color: "var(--color-on-surface)",
                  border: "1px solid var(--color-outline-variant)",
                  outline: "none",
                }}
              >
                <option>string</option>
                <option>number</option>
                <option>boolean</option>
              </select>
              <input
                type="text"
                value={param.description}
                onChange={(e) => updateParam(idx, "description", e.target.value)}
                placeholder="Description"
                className="flex-1 px-2 py-1.5 rounded-lg text-[11px]"
                style={{
                  backgroundColor: "var(--color-surface)",
                  color: "var(--color-on-surface)",
                  border: "1px solid var(--color-outline-variant)",
                  outline: "none",
                }}
              />
              <button
                onClick={() => removeParam(idx)}
                className="p-1 rounded transition-colors flex-shrink-0"
                style={{ color: "var(--color-on-surface-variant)" }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ToolCallCard({
  toolCall,
  simulatedResult,
}: {
  toolCall: { name: string; arguments: Record<string, string> };
  simulatedResult: string;
}) {
  return (
    <div
      className="mt-2 rounded-xl overflow-hidden text-xs"
      style={{ border: "1px solid var(--color-tertiary-container)" }}
    >
      <div
        className="flex items-center gap-2 px-3 py-2"
        style={{
          backgroundColor: "var(--color-tertiary-container)",
          color: "var(--color-tertiary)",
        }}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 flex-shrink-0">
          <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z" />
        </svg>
        <span className="font-semibold font-mono">{toolCall.name}()</span>
      </div>
      <div
        className="px-3 py-2 space-y-1"
        style={{ backgroundColor: "var(--color-surface-container)" }}
      >
        <p className="font-semibold" style={{ color: "var(--color-on-surface-variant)" }}>
          Arguments:
        </p>
        <pre
          className="text-[11px] font-mono whitespace-pre-wrap"
          style={{ color: "var(--color-on-surface)" }}
        >
          {JSON.stringify(toolCall.arguments, null, 2)}
        </pre>
        <div
          className="mt-2 pt-2"
          style={{ borderTop: "1px solid var(--color-outline-variant)" }}
        >
          <p className="font-semibold mb-0.5" style={{ color: "var(--color-on-surface-variant)" }}>
            Simulated result:
          </p>
          <p style={{ color: "var(--color-on-surface)" }}>{simulatedResult}</p>
        </div>
      </div>
    </div>
  );
}

export function Component() {
  const { currentModel, generate, isGenerating, cancel } = useModel();
  const [tools, setTools] = useState<CustomTool[]>(loadTools);
  const [messages, setMessages] = useState<SandboxMessage[]>([]);
  const [input, setInput] = useState("");
  const [systemPromptOpen, setSystemPromptOpen] = useState(false);
  const listEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    saveTools(tools);
  }, [tools]);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGenerating]);

  const addTool = () => {
    const newTool: CustomTool = {
      id: crypto.randomUUID(),
      name: "new_tool",
      description: "Describe what this tool does",
      params: [{ name: "input", type: "string", description: "The input value" }],
    };
    setTools((prev) => [...prev, newTool]);
  };

  const updateTool = (id: string, updated: CustomTool) => {
    setTools((prev) => prev.map((t) => (t.id === id ? updated : t)));
  };

  const deleteTool = (id: string) => {
    setTools((prev) => prev.filter((t) => t.id !== id));
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || !currentModel || isGenerating) return;

    const userMsg: SandboxMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    const systemPrompt = buildSystemPrompt(tools);
    const fullPrompt = `<start_of_turn>system\n${systemPrompt}<end_of_turn>\n<start_of_turn>user\n${trimmed}<end_of_turn>\n<start_of_turn>model\n`;

    let fullResponse = "";
    try {
      await generate(fullPrompt, (partial, done) => {
        fullResponse += partial;
        if (done) {
          const toolCall = parseToolCall(fullResponse);
          const cleanContent = fullResponse
            .replace(/<tool_call>[\s\S]*?<\/tool_call>/, "")
            .trim();
          const assistantMsg: SandboxMessage = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: cleanContent,
            toolCall: toolCall || undefined,
          };
          setMessages((prev) => [...prev, assistantMsg]);
        }
      });
    } catch {
      // generation cancelled
    }
  };

  return (
    <div className="flex flex-col gap-5 h-[calc(100vh-3.5rem-3rem)] min-h-0">
      <div className="flex-shrink-0">
        <h2 className="text-xl font-bold" style={{ color: "var(--color-on-surface)" }}>
          Tool Calling Sandbox
        </h2>
        <p className="text-xs mt-0.5" style={{ color: "var(--color-on-surface-variant)" }}>
          Define custom tool schemas and test the model's function calling accuracy.
        </p>
      </div>

      <div className="flex gap-5 flex-1 min-h-0">
        {/* Left: Tool definitions */}
        <div
          className="w-80 flex-shrink-0 flex flex-col rounded-2xl overflow-hidden shadow-sm"
          style={{ backgroundColor: "var(--color-surface)" }}
        >
          <div
            className="flex items-center justify-between px-4 py-3 flex-shrink-0"
            style={{ borderBottom: "1px solid var(--color-outline-variant)" }}
          >
            <h3 className="text-sm font-bold" style={{ color: "var(--color-on-surface)" }}>
              Define Tools
            </h3>
            <button
              onClick={addTool}
              className="text-xs font-medium px-2.5 py-1 rounded-lg transition-colors"
              style={{
                backgroundColor: "var(--color-primary-container)",
                color: "var(--color-on-primary-container)",
              }}
            >
              + Add Tool
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {tools.map((tool) => (
              <ToolEditor
                key={tool.id}
                tool={tool}
                onUpdate={(updated) => updateTool(tool.id, updated)}
                onDelete={() => deleteTool(tool.id)}
              />
            ))}
            {tools.length === 0 && (
              <div
                className="text-center py-8 text-xs"
                style={{ color: "var(--color-on-surface-variant)" }}
              >
                No tools defined. Add one above.
              </div>
            )}
          </div>

          <div
            className="flex-shrink-0 px-3 pb-3"
            style={{ borderTop: "1px solid var(--color-outline-variant)", paddingTop: "12px" }}
          >
            <button
              onClick={() => setSystemPromptOpen((v) => !v)}
              className="flex items-center gap-1 text-xs font-medium mb-2"
              style={{ color: "var(--color-primary)" }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className={`w-3 h-3 transition-transform ${systemPromptOpen ? "rotate-90" : ""}`}
              >
                <path d="M10 17l5-5-5-5v10z" />
              </svg>
              {systemPromptOpen ? "Hide system prompt" : "Preview system prompt"}
            </button>
            {systemPromptOpen && (
              <pre
                className="text-[10px] font-mono p-2 rounded-lg whitespace-pre-wrap max-h-40 overflow-y-auto"
                style={{
                  backgroundColor: "var(--color-surface-container)",
                  color: "var(--color-on-surface-variant)",
                  border: "1px solid var(--color-outline-variant)",
                }}
              >
                {buildSystemPrompt(tools)}
              </pre>
            )}
          </div>
        </div>

        {/* Right: Chat */}
        <div
          className="flex-1 flex flex-col rounded-2xl overflow-hidden shadow-sm"
          style={{ backgroundColor: "var(--color-surface)" }}
        >
          <div
            className="flex items-center justify-between px-5 py-3 flex-shrink-0"
            style={{ borderBottom: "1px solid var(--color-outline-variant)" }}
          >
            <h3 className="text-sm font-bold" style={{ color: "var(--color-on-surface)" }}>
              Test Tool Calling
            </h3>
            {messages.length > 0 && (
              <button
                onClick={() => setMessages([])}
                className="text-xs font-medium px-2.5 py-1 rounded-lg transition-colors"
                style={{ color: "var(--color-on-surface-variant)" }}
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.length === 0 && !isGenerating && (
              <div
                className="flex flex-col items-center justify-center h-full gap-3 pb-8"
                style={{ color: "var(--color-on-surface-variant)" }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 opacity-30">
                  <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z" />
                </svg>
                <p className="text-sm font-medium">Try a request that needs a tool</p>
                <div className="flex flex-wrap gap-2 justify-center max-w-xs">
                  {["What's the weather in Tokyo?", "Calculate 144 * 7", "Weather in Paris"].map(
                    (ex) => (
                      <button
                        key={ex}
                        onClick={() => setInput(ex)}
                        className="text-xs px-3 py-1.5 rounded-full border transition-colors"
                        style={{
                          borderColor: "var(--color-primary-container)",
                          color: "var(--color-primary)",
                          backgroundColor: "var(--color-surface)",
                        }}
                      >
                        {ex}
                      </button>
                    )
                  )}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                    msg.role === "user" ? "rounded-br-sm" : "rounded-bl-sm"
                  }`}
                  style={{
                    backgroundColor:
                      msg.role === "user"
                        ? "var(--color-primary)"
                        : "var(--color-surface-container)",
                    color: msg.role === "user" ? "#fff" : "var(--color-on-surface)",
                  }}
                >
                  {msg.content && <p>{msg.content}</p>}
                  {msg.toolCall && (
                    <ToolCallCard
                      toolCall={msg.toolCall}
                      simulatedResult={simulateToolResult(
                        msg.toolCall.name,
                        msg.toolCall.arguments
                      )}
                    />
                  )}
                  {!msg.content && !msg.toolCall && (
                    <p className="italic opacity-60">No text response</p>
                  )}
                </div>
              </div>
            ))}

            {isGenerating && (
              <div className="flex justify-start">
                <div
                  className="rounded-2xl rounded-bl-sm px-4 py-3"
                  style={{ backgroundColor: "var(--color-surface-container)" }}
                >
                  <div className="flex gap-1 items-center">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full animate-bounce"
                        style={{
                          backgroundColor: "var(--color-on-surface-variant)",
                          animationDelay: `${i * 0.15}s`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div ref={listEndRef} />
          </div>

          <div
            className="flex items-end gap-2 px-4 py-3 flex-shrink-0"
            style={{ borderTop: "1px solid var(--color-outline-variant)" }}
          >
            <textarea
              rows={1}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void handleSend();
                }
              }}
              placeholder={
                !currentModel
                  ? "Load a model first..."
                  : isGenerating
                  ? "Processing..."
                  : "Type a request that might need a tool..."
              }
              disabled={!currentModel || isGenerating}
              className="flex-1 resize-none text-sm px-4 py-2.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#3174F1]/30 disabled:opacity-50 overflow-hidden min-h-[40px]"
              style={{
                backgroundColor: "var(--color-surface-container)",
                color: "var(--color-on-surface)",
                height: "40px",
              }}
            />
            {isGenerating ? (
              <button
                onClick={cancel}
                className="w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center transition-colors"
                style={{ backgroundColor: "var(--color-error)", color: "#fff" }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M6 6h12v12H6z" />
                </svg>
              </button>
            ) : (
              <button
                onClick={() => void handleSend()}
                disabled={!currentModel || !input.trim() || isGenerating}
                className="w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: "var(--color-primary)", color: "#fff" }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
