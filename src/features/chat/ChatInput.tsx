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
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-gray-200 p-4 flex gap-3">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={disabled ? "Load a model first..." : "Type a message..."}
        disabled={disabled}
        className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:bg-gray-50 disabled:text-gray-400"
      />
      {isGenerating ? (
        <button type="button" onClick={onCancel} className="px-4 py-2.5 bg-danger text-white rounded-lg text-sm font-medium hover:bg-danger/90">
          Stop
        </button>
      ) : (
        <button type="submit" disabled={disabled || !input.trim()} className="px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-50 transition-colors">
          Send
        </button>
      )}
    </form>
  );
}
