import { useState, type FormEvent } from "react";

interface Props {
  onSend: (message: string) => void;
  onCancel: () => void;
  disabled: boolean;
  isGenerating: boolean;
}

export function ChatInput({ onSend, onCancel, disabled, isGenerating }: Props) {
  const [input, setInput] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setInput("");
    // Blur input to dismiss mobile keyboard
    ((e.target as HTMLFormElement).querySelector('textarea,input') as HTMLElement | null)?.blur();
  };

  const canSend = !disabled && !!input.trim() && !isGenerating;

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-end gap-2 px-4 py-3 border-t border-[var(--color-surface-container-high)] bg-[var(--color-surface)]"
    >
      <textarea
        rows={1}
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          // auto-grow: reset height then set to scrollHeight
          e.target.style.height = "auto";
          e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e as unknown as FormEvent);
          }
        }}
        placeholder={disabled ? "Load a model first…" : "Message"}
        disabled={disabled || isGenerating}
        className="flex-1 resize-none bg-[var(--color-surface-container)] text-[var(--color-on-surface)] placeholder-[#747775] text-sm px-4 py-2.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#3174F1]/30 disabled:opacity-50 leading-relaxed overflow-hidden min-h-[40px]"
        style={{ height: "40px" }}
      />

      {isGenerating ? (
        <button
          type="button"
          onClick={onCancel}
          className="w-10 h-10 flex-shrink-0 rounded-full bg-[#D93025] text-white flex items-center justify-center hover:bg-[#B3261E] transition-colors"
          title="Stop generating"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M6 6h12v12H6z" />
          </svg>
        </button>
      ) : (
        <button
          type="submit"
          disabled={!canSend}
          className="w-10 h-10 flex-shrink-0 rounded-full bg-[#0B57D0] text-white flex items-center justify-center hover:bg-[#0842A0] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title="Send message"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      )}
    </form>
  );
}
