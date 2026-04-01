import { useState, useRef, useEffect, useCallback, type FormEvent } from "react";
import { useModel } from "../../contexts/ModelContext";
import { TemplateSelector, TEMPLATES, type PromptTemplate } from "./TemplateSelector";
import { ProfileManager, type Profile } from "./ProfileManager";
import { usePromptLab } from "./usePromptLab";

export function Component() {
  const { currentModel } = useModel();
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate>(TEMPLATES[0]);
  const [userInput, setUserInput] = useState("");
  const [systemPrompt, setSystemPrompt] = useState(TEMPLATES[0].systemPrompt);
  const [systemPromptOpen, setSystemPromptOpen] = useState(false);
  const { output, streamingOutput, isGenerating, error, run, clear, cancelGeneration } =
    usePromptLab();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const systemPromptRef = useRef<HTMLTextAreaElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  // Auto-grow user input textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 300)}px`;
  }, [userInput]);

  // Auto-grow system prompt textarea
  useEffect(() => {
    const el = systemPromptRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(el.scrollHeight, 80)}px`;
  }, [systemPrompt, systemPromptOpen]);

  // Scroll output into view when it appears
  useEffect(() => {
    if ((output || streamingOutput) && outputRef.current) {
      outputRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [output, streamingOutput]);

  const handleTemplateChange = (tpl: PromptTemplate) => {
    setSelectedTemplate(tpl);
    setSystemPrompt(tpl.systemPrompt);
    setUserInput("");
    clear();
  };

  // Stable callbacks for ProfileManager (useCallback to avoid child re-renders)
  const handleLoadProfile = useCallback((profile: Profile) => {
    setSystemPrompt(profile.systemPrompt);
    setSystemPromptOpen(true);
  }, []);

  // onSaveProfile is a no-op here — ProfileManager owns localStorage persistence.
  // The callback exists so callers can hook in additional logic if needed.
  const handleSaveProfile = useCallback((_name: string, _systemPrompt: string) => {
    // Profile already persisted by ProfileManager; nothing extra needed here.
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isGenerating) return;
    run({ ...selectedTemplate, systemPrompt }, userInput);
  };

  const handleClear = () => {
    setUserInput("");
    clear();
  };

  const displayText = streamingOutput || output;
  const hasOutput = Boolean(displayText);

  return (
    <div className="flex flex-col gap-5 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-on-surface)]">Prompt Lab</h2>
          {currentModel ? (
            <p className="text-xs text-[var(--color-on-surface-variant)] mt-0.5">
              {currentModel.name} · on-device via WebGPU
            </p>
          ) : (
            <p className="text-xs text-[var(--color-error)] mt-0.5">No model loaded — go to Gallery to load one</p>
          )}
        </div>
        {(hasOutput || userInput) && (
          <button
            type="button"
            onClick={handleClear}
            className="text-sm text-[var(--color-primary)] hover:text-[var(--color-on-primary-container)] px-3 py-1.5 rounded-xl hover:bg-[var(--color-primary-container)]/50 transition-colors font-medium"
          >
            Clear
          </button>
        )}
      </div>

      {/* Profile Manager */}
      <ProfileManager
        currentSystemPrompt={systemPrompt}
        onLoadProfile={handleLoadProfile}
        onSaveProfile={handleSaveProfile}
      />

      {/* Template Picker */}
      <div className="bg-[var(--color-surface)] rounded-2xl shadow-sm p-4 flex flex-col gap-3">
        <p className="text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wide">Template</p>
        <TemplateSelector selected={selectedTemplate} onChange={handleTemplateChange} />

        {/* Collapsible system prompt */}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setSystemPromptOpen((prev) => !prev)}
            className="flex items-center gap-1.5 w-fit text-xs font-medium text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-transform duration-200"
              style={{ transform: systemPromptOpen ? "rotate(180deg)" : "rotate(0deg)" }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
            Edit system prompt
          </button>
          {systemPromptOpen && (
            <textarea
              ref={systemPromptRef}
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Enter a system prompt (optional)…"
              rows={3}
              className="w-full resize-none rounded-lg bg-[var(--color-surface-container)] px-3 py-2.5 text-xs font-mono text-[var(--color-on-surface)] placeholder:text-[var(--color-outline)] focus:outline-none focus:ring-2 focus:ring-[#0B57D0]/40 transition"
              style={{ minHeight: "80px" }}
            />
          )}
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="bg-[var(--color-surface)] rounded-2xl shadow-sm p-4 flex flex-col gap-3">
        <textarea
          ref={textareaRef}
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder={selectedTemplate.placeholder}
          disabled={isGenerating || !currentModel}
          rows={3}
          className="w-full resize-none rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface-container)] px-4 py-3 text-sm text-[var(--color-on-surface)] placeholder:text-[var(--color-outline)] focus:outline-none focus:ring-2 focus:ring-[#0B57D0]/40 disabled:opacity-50 transition"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              if (userInput.trim() && !isGenerating && currentModel) {
                run({ ...selectedTemplate, systemPrompt }, userInput);
              }
            }
          }}
        />
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-[var(--color-outline)]">⌘ Enter to run</p>
          <div className="flex gap-2">
            {isGenerating ? (
              <button
                type="button"
                onClick={cancelGeneration}
                className="h-9 px-5 rounded-full text-sm font-semibold bg-[var(--color-error-container)] text-[var(--color-error)] hover:bg-[var(--color-error-container)] transition-colors"
              >
                Stop
              </button>
            ) : (
              <button
                type="submit"
                disabled={!userInput.trim() || !currentModel}
                className="h-9 px-5 rounded-full text-sm font-semibold text-white transition-colors disabled:opacity-40"
                style={{ backgroundColor: "#0B57D0" }}
              >
                Run
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Output */}
      {hasOutput && (
        <div ref={outputRef} className="bg-[var(--color-surface)] rounded-2xl shadow-sm p-4 flex flex-col gap-2">
          <p className="text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wide">Response</p>
          <div className="rounded-xl bg-[var(--color-surface-container)] px-4 py-3 text-sm text-[var(--color-on-surface)] leading-relaxed whitespace-pre-wrap">
            {displayText}
            {isGenerating && (
              <span className="inline-block w-1.5 h-4 ml-0.5 bg-[var(--color-primary)] rounded-sm animate-pulse align-text-bottom" />
            )}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-2xl bg-[var(--color-error-container)] border border-[var(--color-error)] px-4 py-3 text-sm text-[var(--color-error)]">
          {error}
        </div>
      )}
    </div>
  );
}
