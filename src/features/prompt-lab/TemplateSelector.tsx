export interface PromptTemplate {
  id: string;
  label: string;
  systemPrompt: string;
  placeholder: string;
}

export const TEMPLATES: PromptTemplate[] = [
  {
    id: "freeform",
    label: "Freeform",
    systemPrompt: "",
    placeholder: "Type anything…",
  },
  {
    id: "summarize",
    label: "Summarize",
    systemPrompt: "Summarize the following text concisely:",
    placeholder: "Paste text to summarize…",
  },
  {
    id: "rewrite",
    label: "Rewrite",
    systemPrompt: "Rewrite the following text to be more professional and clear:",
    placeholder: "Paste text to rewrite…",
  },
  {
    id: "code",
    label: "Code",
    systemPrompt: "Write code for the following task:",
    placeholder: "Describe the coding task…",
  },
  {
    id: "translate",
    label: "Translate",
    systemPrompt: "Translate the following text to English:",
    placeholder: "Paste text to translate…",
  },
  {
    id: "explain",
    label: "Explain",
    systemPrompt: "Explain the following concept in simple terms:",
    placeholder: "Enter a concept to explain…",
  },
];

interface TemplateSelectorProps {
  selected: PromptTemplate;
  onChange: (template: PromptTemplate) => void;
}

export function TemplateSelector({ selected, onChange }: TemplateSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {TEMPLATES.map((tpl) => (
        <button
          key={tpl.id}
          type="button"
          onClick={() => onChange(tpl)}
          className="h-9 px-4 rounded-full text-sm font-semibold transition-colors"
          style={
            selected.id === tpl.id
              ? { backgroundColor: "#3174F1", color: "#ffffff" }
              : { backgroundColor: "#ffffff", color: "#444746", border: "1px solid #C4C7C5" }
          }
        >
          {tpl.label}
        </button>
      ))}
    </div>
  );
}
