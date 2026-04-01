import { useState, useEffect } from "react";
import { useNavigate } from "react-router";

interface Persona {
  id: string;
  name: string;
  emoji: string;
  systemPrompt: string;
  temperature: number;
  bestFor: string;
}

const EMOJI_OPTIONS = ["🤖", "🧑‍💻", "📚", "🎨", "🔬", "💼", "🎯", "🌍", "🧮", "✍️", "🎭", "🧪"];

const DEFAULT_PERSONAS: Persona[] = [
  {
    id: "default-1",
    name: "Code Assistant",
    emoji: "🤖",
    systemPrompt: "You are an expert programmer. Write clean, efficient code with comments.",
    temperature: 0.7,
    bestFor: "Code reviews and debugging",
  },
  {
    id: "default-2",
    name: "Study Tutor",
    emoji: "📚",
    systemPrompt: "You are a patient tutor. Explain concepts step by step with examples.",
    temperature: 0.8,
    bestFor: "Learning and studying",
  },
  {
    id: "default-3",
    name: "Creative Writer",
    emoji: "✍️",
    systemPrompt: "You are a creative fiction writer. Write vivid, engaging prose.",
    temperature: 1.2,
    bestFor: "Stories and creative content",
  },
];

const EMPTY_PERSONA: Omit<Persona, "id"> = {
  name: "",
  emoji: "🤖",
  systemPrompt: "",
  temperature: 0.8,
  bestFor: "",
};

function loadPersonas(): Persona[] {
  try {
    const saved = localStorage.getItem("saved_personas");
    return saved ? JSON.parse(saved) : DEFAULT_PERSONAS;
  } catch {
    return DEFAULT_PERSONAS;
  }
}

function savePersonas(personas: Persona[]) {
  localStorage.setItem("saved_personas", JSON.stringify(personas));
}

export function Component() {
  const navigate = useNavigate();
  const [personas, setPersonas] = useState<Persona[]>(loadPersonas);
  const [selected, setSelected] = useState<Persona | null>(null);
  const [form, setForm] = useState<Omit<Persona, "id">>(EMPTY_PERSONA);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 2000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const showToast = (msg: string) => setToast(msg);

  const handleSelect = (persona: Persona) => {
    setSelected(persona);
    setForm({
      name: persona.name,
      emoji: persona.emoji,
      systemPrompt: persona.systemPrompt,
      temperature: persona.temperature,
      bestFor: persona.bestFor,
    });
    setEmojiPickerOpen(false);
  };

  const handleNew = () => {
    setSelected(null);
    setForm(EMPTY_PERSONA);
    setEmojiPickerOpen(false);
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      showToast("Name is required");
      return;
    }
    if (selected) {
      const updated = personas.map((p) =>
        p.id === selected.id ? { ...form, id: selected.id } : p
      );
      setPersonas(updated);
      savePersonas(updated);
      setSelected({ ...form, id: selected.id });
      showToast("Persona updated");
    } else {
      const newPersona: Persona = { ...form, id: crypto.randomUUID() };
      const updated = [...personas, newPersona];
      setPersonas(updated);
      savePersonas(updated);
      setSelected(newPersona);
      showToast("Persona saved");
    }
  };

  const handleDelete = (id: string) => {
    const updated = personas.filter((p) => p.id !== id);
    setPersonas(updated);
    savePersonas(updated);
    if (selected?.id === id) {
      setSelected(null);
      setForm(EMPTY_PERSONA);
    }
  };

  const handleTryIt = () => {
    if (!form.systemPrompt.trim()) return;
    localStorage.setItem("persona_system_prompt", form.systemPrompt);
    localStorage.setItem("persona_temperature", String(form.temperature));
    navigate("/chat");
  };

  return (
    <div className="flex gap-5 h-[calc(100vh-3.5rem-3rem)] min-h-0">
      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl text-sm font-medium shadow-lg"
          style={{
            backgroundColor: "var(--color-primary)",
            color: "#fff",
          }}
        >
          {toast}
        </div>
      )}

      {/* Left panel — persona list */}
      <div
        className="w-72 flex-shrink-0 flex flex-col rounded-2xl overflow-hidden shadow-sm"
        style={{ backgroundColor: "var(--color-surface)" }}
      >
        <div
          className="flex items-center justify-between px-4 py-3 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--color-outline-variant)" }}
        >
          <h2 className="text-sm font-bold" style={{ color: "var(--color-on-surface)" }}>
            Personas
          </h2>
          <button
            onClick={handleNew}
            className="text-xs font-medium px-2.5 py-1 rounded-lg transition-colors"
            style={{
              backgroundColor: "var(--color-primary-container)",
              color: "var(--color-on-primary-container)",
            }}
          >
            + New
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {personas.map((persona) => (
            <div
              key={persona.id}
              onClick={() => handleSelect(persona)}
              className="group relative flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors"
              style={{
                backgroundColor:
                  selected?.id === persona.id
                    ? "var(--color-primary-container)"
                    : "var(--color-surface-container)",
                border: selected?.id === persona.id
                  ? "1px solid var(--color-primary)"
                  : "1px solid transparent",
              }}
            >
              <span className="text-2xl flex-shrink-0 leading-none mt-0.5">{persona.emoji}</span>
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-semibold truncate"
                  style={{
                    color: selected?.id === persona.id
                      ? "var(--color-on-primary-container)"
                      : "var(--color-on-surface)",
                  }}
                >
                  {persona.name}
                </p>
                <p
                  className="text-xs truncate mt-0.5"
                  style={{ color: "var(--color-on-surface-variant)" }}
                >
                  {persona.bestFor || "No description"}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(persona.id);
                }}
                className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-1 rounded-md transition-all"
                style={{ color: "var(--color-error)" }}
                title="Delete persona"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                </svg>
              </button>
            </div>
          ))}

          {personas.length === 0 && (
            <div className="flex flex-col items-center justify-center h-32 gap-2">
              <p className="text-xs" style={{ color: "var(--color-on-surface-variant)" }}>
                No personas yet
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right panel — editor */}
      <div
        className="flex-1 flex flex-col rounded-2xl overflow-hidden shadow-sm"
        style={{ backgroundColor: "var(--color-surface)" }}
      >
        {/* Editor header */}
        <div
          className="flex items-center justify-between px-5 py-3 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--color-outline-variant)" }}
        >
          <div>
            <h2 className="text-base font-bold" style={{ color: "var(--color-on-surface)" }}>
              {selected ? `Edit: ${selected.name}` : "New Persona"}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-on-surface-variant)" }}>
              Combine a name, avatar, system prompt, and generation config into a reusable character.
            </p>
          </div>
        </div>

        {/* Form body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Name + Emoji row */}
          <div className="flex gap-3 items-start">
            {/* Emoji picker */}
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setEmojiPickerOpen((v) => !v)}
                className="w-14 h-14 text-3xl rounded-xl flex items-center justify-center transition-colors"
                style={{
                  backgroundColor: "var(--color-surface-container)",
                  border: "1px solid var(--color-outline-variant)",
                }}
                title="Pick avatar emoji"
              >
                {form.emoji}
              </button>
              {emojiPickerOpen && (
                <div
                  className="absolute top-16 left-0 z-10 p-2 rounded-xl shadow-lg grid grid-cols-4 gap-1"
                  style={{
                    backgroundColor: "var(--color-surface)",
                    border: "1px solid var(--color-outline-variant)",
                  }}
                >
                  {EMOJI_OPTIONS.map((em) => (
                    <button
                      key={em}
                      onClick={() => {
                        setForm((f) => ({ ...f, emoji: em }));
                        setEmojiPickerOpen(false);
                      }}
                      className="w-9 h-9 text-xl rounded-lg hover:bg-[var(--color-surface-container)] transition-colors flex items-center justify-center"
                    >
                      {em}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Name */}
            <div className="flex-1">
              <label
                className="block text-xs font-semibold mb-1"
                style={{ color: "var(--color-on-surface-variant)" }}
              >
                Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Code Assistant"
                className="w-full px-3 py-2.5 rounded-xl text-sm"
                style={{
                  backgroundColor: "var(--color-surface-container)",
                  color: "var(--color-on-surface)",
                  border: "1px solid var(--color-outline-variant)",
                  outline: "none",
                }}
              />
            </div>
          </div>

          {/* Best for */}
          <div>
            <label
              className="block text-xs font-semibold mb-1"
              style={{ color: "var(--color-on-surface-variant)" }}
            >
              Best For
            </label>
            <input
              type="text"
              value={form.bestFor}
              onChange={(e) => setForm((f) => ({ ...f, bestFor: e.target.value }))}
              placeholder="e.g. Code reviews and debugging"
              className="w-full px-3 py-2.5 rounded-xl text-sm"
              style={{
                backgroundColor: "var(--color-surface-container)",
                color: "var(--color-on-surface)",
                border: "1px solid var(--color-outline-variant)",
                outline: "none",
              }}
            />
          </div>

          {/* System prompt */}
          <div>
            <label
              className="block text-xs font-semibold mb-1"
              style={{ color: "var(--color-on-surface-variant)" }}
            >
              System Prompt
            </label>
            <textarea
              value={form.systemPrompt}
              onChange={(e) => setForm((f) => ({ ...f, systemPrompt: e.target.value }))}
              placeholder="You are an expert..."
              rows={6}
              className="w-full px-3 py-2.5 rounded-xl text-sm font-mono resize-y"
              style={{
                backgroundColor: "var(--color-surface-container)",
                color: "var(--color-on-surface)",
                border: "1px solid var(--color-outline-variant)",
                outline: "none",
              }}
            />
          </div>

          {/* Temperature slider */}
          <div>
            <label
              className="block text-xs font-semibold mb-2"
              style={{ color: "var(--color-on-surface-variant)" }}
            >
              Temperature —{" "}
              <span style={{ color: "var(--color-primary)" }}>{form.temperature.toFixed(1)}</span>
            </label>
            <input
              type="range"
              min={0}
              max={2}
              step={0.1}
              value={form.temperature}
              onChange={(e) =>
                setForm((f) => ({ ...f, temperature: parseFloat(e.target.value) }))
              }
              className="w-full accent-[var(--color-primary)]"
            />
            <div
              className="flex justify-between text-[10px] mt-1"
              style={{ color: "var(--color-on-surface-variant)" }}
            >
              <span>Precise (0)</span>
              <span>Balanced (1)</span>
              <span>Creative (2)</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div
          className="flex items-center gap-3 px-5 py-3 flex-shrink-0"
          style={{ borderTop: "1px solid var(--color-outline-variant)" }}
        >
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl text-sm font-semibold transition-colors"
            style={{
              backgroundColor: "var(--color-primary)",
              color: "#fff",
            }}
          >
            Save Persona
          </button>
          <button
            onClick={handleTryIt}
            disabled={!form.systemPrompt.trim()}
            className="px-5 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              backgroundColor: "var(--color-secondary-container)",
              color: "var(--color-on-secondary-container)",
            }}
          >
            Try It →
          </button>
          {selected && (
            <button
              onClick={handleNew}
              className="ml-auto text-xs px-3 py-1.5 rounded-lg transition-colors"
              style={{ color: "var(--color-on-surface-variant)" }}
            >
              + New
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
