import { useState, useRef, useEffect, type FormEvent } from "react";
import { useModel } from "../../contexts/ModelContext";
import { TemplateSelector, TEMPLATES, type PromptTemplate } from "./TemplateSelector";
import { usePromptLab } from "./usePromptLab";

export function Component() {
  const { currentModel } = useModel();
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate>(TEMPLATES[0]);
  const [userInput, setUserInput] = useState("");
  const { output, streamingOutput, isGenerating, error, run, clear, cancelGeneration } =
    usePromptLab();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  // Auto-grow textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 300)}px`;
  }, [userInput]);

  // Scroll output into view when it appears
  useEffect(() => {
    if ((output || streamingOutput) && outputRef.current) {
      outputRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [output, streamingOutput]);

  const handleTemplateChange = (tpl: PromptTemplate) => {
    setSelectedTemplate(tpl);
    setUserInput("");
    clear();
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isGenerating) return;
    run(selectedTemplate, userInput);
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
          <h2 className="text-xl font-bold text-[#1F1F1F]">Prompt Lab</h2>
          {currentModel ? (
            <p className="text-xs text-[#444746] mt-0.5">
              {currentModel.name} · on-device via WebGPU
            </p>
          ) : (
            <p className="text-xs text-[#C01C1C] mt-0.5">No model loaded — go to Gallery to load one</p>
          )}
        </div>
        {(hasOutput || userInput) && (
          <button
            type="button"
            onClick={handleClear}
            className="text-sm text-[#0B57D0] hover:text-[#0842A0] px-3 py-1.5 rounded-xl hover:bg-[#D3E3FD]/50 transition-colors font-medium"
          >
            Clear
          </button>
        )}
      </div>

      {/* Template Picker */}
      <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-col gap-3">
        <p className="text-xs font-semibold text-[#444746] uppercase tracking-wide">Template</p>
        <TemplateSelector selected={selectedTemplate} onChange={handleTemplateChange} />
        {selectedTemplate.systemPrompt && (
          <p className="text-xs text-[#5F6368] bg-[#F0F4F9] rounded-xl px-3 py-2 leading-relaxed">
            <span className="font-medium text-[#444746]">System: </span>
            {selectedTemplate.systemPrompt}
          </p>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-4 flex flex-col gap-3">
        <textarea
          ref={textareaRef}
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder={selectedTemplate.placeholder}
          disabled={isGenerating || !currentModel}
          rows={3}
          className="w-full resize-none rounded-xl border border-[#C4C7C5] bg-[#F0F4F9] px-4 py-3 text-sm text-[#1F1F1F] placeholder:text-[#9AA0A6] focus:outline-none focus:ring-2 focus:ring-[#0B57D0]/40 disabled:opacity-50 transition"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              if (userInput.trim() && !isGenerating && currentModel) {
                run(selectedTemplate, userInput);
              }
            }
          }}
        />
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-[#9AA0A6]">⌘ Enter to run</p>
          <div className="flex gap-2">
            {isGenerating ? (
              <button
                type="button"
                onClick={cancelGeneration}
                className="h-9 px-5 rounded-full text-sm font-semibold bg-[#FDECEA] text-[#C01C1C] hover:bg-[#F9BFBF] transition-colors"
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
        <div ref={outputRef} className="bg-white rounded-2xl shadow-sm p-4 flex flex-col gap-2">
          <p className="text-xs font-semibold text-[#444746] uppercase tracking-wide">Response</p>
          <div className="rounded-xl bg-[#F0F4F9] px-4 py-3 text-sm text-[#1F1F1F] leading-relaxed whitespace-pre-wrap">
            {displayText}
            {isGenerating && (
              <span className="inline-block w-1.5 h-4 ml-0.5 bg-[#0B57D0] rounded-sm animate-pulse align-text-bottom" />
            )}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-2xl bg-[#FDECEA] border border-[#F9BFBF] px-4 py-3 text-sm text-[#C01C1C]">
          {error}
        </div>
      )}
    </div>
  );
}
