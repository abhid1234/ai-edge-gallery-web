/**
 * Lightweight markdown-to-HTML converter for LLM output.
 * Supports: **bold**, *italic*, `inline code`, ```code blocks```, headers, lists.
 * No external dependencies.
 */
export function renderMarkdown(text: string): string {
  // Escape HTML entities first
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Fenced code blocks: ```lang\n...\n```
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_match, _lang, code) => {
    return `<pre style="background:var(--color-surface-container-high);padding:12px;border-radius:8px;overflow-x:auto;font-size:13px;line-height:1.5"><code>${code.trimEnd()}</code></pre>`;
  });

  // Process line by line for block elements
  const lines = html.split("\n");
  const result: string[] = [];
  let inList = false;

  for (const line of lines) {
    // Headers
    if (line.startsWith("### ")) {
      if (inList) { result.push("</ul>"); inList = false; }
      result.push(`<h4 style="font-weight:700;font-size:14px;margin:12px 0 4px">${line.slice(4)}</h4>`);
      continue;
    }
    if (line.startsWith("## ")) {
      if (inList) { result.push("</ul>"); inList = false; }
      result.push(`<h3 style="font-weight:700;font-size:15px;margin:12px 0 4px">${line.slice(3)}</h3>`);
      continue;
    }
    if (line.startsWith("# ")) {
      if (inList) { result.push("</ul>"); inList = false; }
      result.push(`<h2 style="font-weight:700;font-size:16px;margin:12px 0 4px">${line.slice(2)}</h2>`);
      continue;
    }

    // Unordered list items
    const listMatch = line.match(/^(\s*)[*\-]\s+(.*)/);
    if (listMatch) {
      if (!inList) { result.push("<ul style=\"margin:4px 0;padding-left:20px\">"); inList = true; }
      result.push(`<li>${inlineFormat(listMatch[2])}</li>`);
      continue;
    }

    // Numbered list items
    const numMatch = line.match(/^(\s*)\d+\.\s+(.*)/);
    if (numMatch) {
      if (!inList) { result.push("<ol style=\"margin:4px 0;padding-left:20px\">"); inList = true; }
      result.push(`<li>${inlineFormat(numMatch[2])}</li>`);
      continue;
    }

    if (inList) { result.push("</ul>"); inList = false; }

    // Regular line
    result.push(inlineFormat(line));
  }

  if (inList) result.push("</ul>");

  return result.join("\n");
}

/** Apply inline formatting: bold, italic, inline code */
function inlineFormat(text: string): string {
  // Inline code: `code`
  text = text.replace(/`([^`]+)`/g, '<code style="background:var(--color-surface-container-high);padding:1px 4px;border-radius:3px;font-size:13px">$1</code>');
  // Bold: **text**
  text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  // Italic: *text*
  text = text.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  return text;
}
