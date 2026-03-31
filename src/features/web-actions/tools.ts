export interface Tool {
  name: string;
  description: string;
  parameters: { name: string; type: string; description: string }[];
  execute: (args: Record<string, string>) => Promise<string> | string;
}

// Safe recursive-descent math parser — no eval, no Function constructor
type Token = { type: "num"; val: number } | { type: "op"; val: string } | { type: "lparen" | "rparen" };

function tokenize(expr: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < expr.length) {
    const ch = expr[i];
    if (ch === " ") { i++; continue; }
    if (/[0-9.]/.test(ch)) {
      let num = "";
      while (i < expr.length && /[0-9.]/.test(expr[i])) num += expr[i++];
      tokens.push({ type: "num", val: parseFloat(num) });
    } else if ("+-*/^%".includes(ch)) {
      tokens.push({ type: "op", val: ch }); i++;
    } else if (ch === "(") {
      tokens.push({ type: "lparen" }); i++;
    } else if (ch === ")") {
      tokens.push({ type: "rparen" }); i++;
    } else {
      throw new Error(`Unexpected character: ${ch}`);
    }
  }
  return tokens;
}

// Pratt-style precedence parser
function parseMath(tokens: Token[]): number {
  let pos = 0;

  function peek(): Token | undefined { return tokens[pos]; }
  function consume(): Token { return tokens[pos++]; }

  function parseExpr(minPrec = 0): number {
    let left = parseUnary();
    while (true) {
      const tok = peek();
      if (!tok || tok.type !== "op") break;
      const prec = precedence(tok.val);
      if (prec <= minPrec) break;
      consume();
      const right = parseExpr(prec);
      left = applyOp(tok.val, left, right);
    }
    return left;
  }

  function parseUnary(): number {
    const tok = peek();
    if (tok && tok.type === "op" && tok.val === "-") { consume(); return -parseAtom(); }
    if (tok && tok.type === "op" && tok.val === "+") { consume(); return parseAtom(); }
    return parseAtom();
  }

  function parseAtom(): number {
    const tok = peek();
    if (!tok) throw new Error("Unexpected end of expression");
    if (tok.type === "lparen") {
      consume();
      const val = parseExpr(0);
      const closing = consume();
      if (!closing || closing.type !== "rparen") throw new Error("Missing closing parenthesis");
      return val;
    }
    if (tok.type === "num") { consume(); return tok.val; }
    throw new Error(`Unexpected token: ${JSON.stringify(tok)}`);
  }

  function precedence(op: string): number {
    if (op === "+" || op === "-") return 1;
    if (op === "*" || op === "/" || op === "%") return 2;
    if (op === "^") return 3;
    return 0;
  }

  function applyOp(op: string, a: number, b: number): number {
    switch (op) {
      case "+": return a + b;
      case "-": return a - b;
      case "*": return a * b;
      case "/":
        if (b === 0) throw new Error("Division by zero");
        return a / b;
      case "%": return a % b;
      case "^": return Math.pow(a, b);
      default: throw new Error(`Unknown operator: ${op}`);
    }
  }

  const result = parseExpr(0);
  if (pos !== tokens.length) throw new Error("Unexpected token after expression");
  if (!isFinite(result)) throw new Error("Result is not finite");
  return result;
}

function safeMath(expression: string): string {
  const tokens = tokenize(expression);
  const result = parseMath(tokens);
  // Format: if integer, show without decimals
  return Number.isInteger(result) ? String(result) : String(parseFloat(result.toFixed(10)));
}

export const tools: Tool[] = [
  {
    name: "openUrl",
    description: "Open a URL in a new browser tab",
    parameters: [
      { name: "url", type: "string", description: "The full URL to open (must start with http:// or https://)" },
    ],
    execute({ url }) {
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        return `Error: URL must start with http:// or https://`;
      }
      window.open(url, "_blank", "noopener,noreferrer");
      return `Opened ${url} in a new tab.`;
    },
  },
  {
    name: "searchGoogle",
    description: "Search Google for a query",
    parameters: [
      { name: "query", type: "string", description: "The search query" },
    ],
    execute({ query }) {
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
      window.open(searchUrl, "_blank", "noopener,noreferrer");
      return `Searched Google for: "${query}"`;
    },
  },
  {
    name: "getCurrentTime",
    description: "Get the current date and time",
    parameters: [],
    execute() {
      return new Date().toLocaleString();
    },
  },
  {
    name: "copyToClipboard",
    description: "Copy text to the clipboard",
    parameters: [
      { name: "text", type: "string", description: "The text to copy" },
    ],
    async execute({ text }) {
      await navigator.clipboard.writeText(text);
      return `Copied to clipboard: "${text.slice(0, 60)}${text.length > 60 ? "…" : ""}"`;
    },
  },
  {
    name: "toggleDarkMode",
    description: "Toggle dark mode on the page",
    parameters: [],
    execute() {
      const isDark = document.documentElement.classList.toggle("dark");
      return isDark ? "Dark mode enabled." : "Dark mode disabled.";
    },
  },
  {
    name: "setTimer",
    description: "Set a timer for N seconds that shows an alert when done",
    parameters: [
      { name: "seconds", type: "string", description: "Number of seconds for the timer" },
    ],
    execute({ seconds }) {
      const secs = parseInt(seconds, 10);
      if (isNaN(secs) || secs <= 0 || secs > 3600) {
        return "Error: seconds must be a positive number up to 3600.";
      }
      setTimeout(() => {
        alert(`Timer done! ${secs} second${secs === 1 ? "" : "s"} elapsed.`);
      }, secs * 1000);
      return `Timer set for ${secs} second${secs === 1 ? "" : "s"}.`;
    },
  },
  {
    name: "calculateMath",
    description: "Calculate a math expression (supports +, -, *, /, %, ^ and parentheses)",
    parameters: [
      { name: "expression", type: "string", description: "A math expression, e.g. 2 + 2 or (10 * 3) / 4" },
    ],
    execute({ expression }) {
      try {
        const result = safeMath(expression);
        return `${expression} = ${result}`;
      } catch (e) {
        return `Error: ${e instanceof Error ? e.message : "Invalid expression"}`;
      }
    },
  },
];

export const toolsByName: Record<string, Tool> = Object.fromEntries(
  tools.map((t) => [t.name, t])
);

export function buildSystemPrompt(): string {
  const now = new Date().toLocaleString();
  const toolDefs = tools
    .map((t) => {
      const params =
        t.parameters.length === 0
          ? "none"
          : t.parameters.map((p) => `${p.name} (${p.type}): ${p.description}`).join(", ");
      return `- ${t.name}: ${t.description}\n  Parameters: ${params}`;
    })
    .join("\n");

  return `You are a web action assistant. The current date/time is ${now}.

When the user asks you to perform an action, respond ONLY with a tool call in this exact format:
<tool_call>
{"name": "tool_name", "arguments": {"param1": "value1"}}
</tool_call>

Available tools:
${toolDefs}

If no tool matches, respond with a plain text explanation of why you cannot help.
Do not include any explanation outside the tool_call tags when calling a tool.`;
}

export interface ParsedToolCall {
  name: string;
  arguments: Record<string, string>;
}

export function parseToolCall(output: string): ParsedToolCall | null {
  const match = output.match(/<tool_call>\s*([\s\S]*?)\s*<\/tool_call>/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[1]);
    if (typeof parsed.name === "string" && typeof parsed.arguments === "object") {
      return parsed as ParsedToolCall;
    }
    return null;
  } catch {
    return null;
  }
}
