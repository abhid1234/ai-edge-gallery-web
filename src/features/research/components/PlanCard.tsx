import { useState } from "react";
import type { Plan } from "../types";

interface PlanCardProps {
  plan: Plan;
  onApprove: () => void;
  onEdit: (updated: Plan) => void;
  autoApprove?: boolean;
}

export function PlanCard({ plan, onApprove, onEdit, autoApprove }: PlanCardProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Plan>(plan);

  const handleSave = () => {
    onEdit(draft);
    setEditing(false);
  };

  return (
    <div
      className="rounded-2xl overflow-hidden shadow-sm"
      style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-outline-variant)" }}
    >
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ backgroundColor: "var(--color-primary-container)", borderBottom: "1px solid var(--color-outline-variant)" }}
      >
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" style={{ color: "var(--color-primary)" }}>
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
          </svg>
          <span className="text-sm font-semibold" style={{ color: "var(--color-on-primary-container)" }}>
            Research plan
          </span>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-xs px-2 py-1 rounded-lg transition-colors"
            style={{ color: "var(--color-on-primary-container)" }}
          >
            Edit
          </button>
        )}
      </div>

      <div className="px-4 py-3 space-y-3">
        {editing ? (
          <div className="space-y-2">
            {draft.subqueries.map((q, i) => (
              <input
                key={i}
                value={q}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    subqueries: prev.subqueries.map((sq, idx) => (idx === i ? e.target.value : sq)),
                  }))
                }
                className="w-full px-3 py-2 rounded-lg text-xs"
                style={{
                  backgroundColor: "var(--color-surface-container)",
                  color: "var(--color-on-surface)",
                  border: "1px solid var(--color-outline-variant)",
                  outline: "none",
                }}
              />
            ))}
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleSave}
                className="px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{ backgroundColor: "var(--color-primary)", color: "#fff" }}
              >
                Save
              </button>
              <button
                onClick={() => { setDraft(plan); setEditing(false); }}
                className="px-3 py-1.5 rounded-lg text-xs"
                style={{ color: "var(--color-on-surface-variant)" }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <ol className="space-y-1.5">
            {plan.subqueries.map((q, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span
                  className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5"
                  style={{ backgroundColor: "var(--color-primary-container)", color: "var(--color-primary)" }}
                >
                  {i + 1}
                </span>
                <span className="text-sm leading-snug" style={{ color: "var(--color-on-surface)" }}>{q}</span>
              </li>
            ))}
          </ol>
        )}

        <p className="text-xs italic" style={{ color: "var(--color-on-surface-variant)" }}>
          Approach: {plan.synthesis_approach}
        </p>

        {!autoApprove && !editing && (
          <button
            onClick={onApprove}
            className="w-full py-2 rounded-xl text-sm font-semibold transition-colors mt-1"
            style={{ backgroundColor: "var(--color-primary)", color: "#fff" }}
          >
            Approve &amp; retrieve
          </button>
        )}
      </div>
    </div>
  );
}
