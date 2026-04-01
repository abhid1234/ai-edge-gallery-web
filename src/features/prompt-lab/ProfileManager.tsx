import { useState } from "react";

export interface Profile {
  name: string;
  systemPrompt: string;
  temperature: number;
  topK: number;
  topP: number;
}

const STORAGE_KEY = "model_profiles";

function loadProfiles(): Profile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Profile[];
  } catch {
    return [];
  }
}

function saveProfiles(profiles: Profile[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
}

interface ProfileManagerProps {
  currentSystemPrompt: string;
  onLoadProfile: (profile: Profile) => void;
  onSaveProfile: (name: string, systemPrompt: string) => void;
}

export function ProfileManager({
  currentSystemPrompt,
  onLoadProfile,
  onSaveProfile,
}: ProfileManagerProps) {
  // Lazy initializer avoids reading localStorage on every render
  const [profiles, setProfiles] = useState<Profile[]>(loadProfiles);
  const [selectedName, setSelectedName] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [newName, setNewName] = useState("");

  const handleSelect = (name: string) => {
    setSelectedName(name);
    if (!name) return;
    const profile = profiles.find((p) => p.name === name);
    if (profile) {
      onLoadProfile(profile);
    }
  };

  const handleSaveClick = () => {
    setIsSaving(true);
    setNewName("");
  };

  const handleSaveConfirm = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;

    const updated = profiles.filter((p) => p.name !== trimmed);
    const newProfile: Profile = {
      name: trimmed,
      systemPrompt: currentSystemPrompt,
      temperature: 1.0,
      topK: 40,
      topP: 0.95,
    };
    const next = [...updated, newProfile];
    setProfiles(next);
    saveProfiles(next);
    onSaveProfile(trimmed, currentSystemPrompt);

    setSelectedName(trimmed);
    setIsSaving(false);
    setNewName("");
  };

  const handleSaveCancel = () => {
    setIsSaving(false);
    setNewName("");
  };

  const handleDelete = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = profiles.filter((p) => p.name !== name);
    setProfiles(next);
    saveProfiles(next);
    if (selectedName === name) {
      setSelectedName("");
    }
  };

  return (
    <div
      className="flex items-center gap-2 flex-wrap"
      style={{
        padding: "8px 12px",
        borderRadius: "12px",
        backgroundColor: "var(--color-surface-container)",
        border: "1px solid var(--color-outline-variant)",
      }}
    >
      {/* Label */}
      <span
        style={{
          fontSize: "11px",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: "var(--color-on-surface-variant)",
          whiteSpace: "nowrap",
        }}
      >
        Profiles
      </span>

      {/* Dropdown */}
      <div style={{ position: "relative", flex: "1 1 160px", minWidth: "120px" }}>
        <select
          value={selectedName}
          onChange={(e) => handleSelect(e.target.value)}
          style={{
            width: "100%",
            height: "32px",
            paddingLeft: "10px",
            paddingRight: "28px",
            fontSize: "13px",
            borderRadius: "8px",
            border: "1px solid var(--color-outline-variant)",
            backgroundColor: "var(--color-surface)",
            color: "var(--color-on-surface)",
            appearance: "none",
            cursor: "pointer",
            outline: "none",
          }}
        >
          <option value="">— Default —</option>
          {profiles.map((p) => (
            <option key={p.name} value={p.name}>
              {p.name}
            </option>
          ))}
        </select>
        {/* chevron icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            position: "absolute",
            right: "8px",
            top: "50%",
            transform: "translateY(-50%)",
            pointerEvents: "none",
            color: "var(--color-on-surface-variant)",
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>

      {/* Delete button — shown when a profile is selected */}
      {selectedName && (
        <button
          type="button"
          onClick={(e) => handleDelete(selectedName, e)}
          title={`Delete "${selectedName}"`}
          style={{
            height: "32px",
            width: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "8px",
            border: "1px solid var(--color-outline-variant)",
            backgroundColor: "var(--color-surface)",
            color: "var(--color-error)",
            cursor: "pointer",
            flexShrink: 0,
          }}
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
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}

      {/* Save inline flow */}
      {isSaving ? (
        <>
          <input
            autoFocus
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveConfirm();
              if (e.key === "Escape") handleSaveCancel();
            }}
            placeholder="Profile name…"
            style={{
              height: "32px",
              flex: "1 1 140px",
              minWidth: "100px",
              paddingLeft: "10px",
              paddingRight: "10px",
              fontSize: "13px",
              borderRadius: "8px",
              border: "1px solid var(--color-outline)",
              backgroundColor: "var(--color-surface)",
              color: "var(--color-on-surface)",
              outline: "none",
            }}
          />
          <button
            type="button"
            onClick={handleSaveConfirm}
            disabled={!newName.trim()}
            style={{
              height: "32px",
              padding: "0 12px",
              fontSize: "12px",
              fontWeight: 600,
              borderRadius: "8px",
              border: "none",
              backgroundColor: "#0B57D0",
              color: "#ffffff",
              cursor: newName.trim() ? "pointer" : "not-allowed",
              opacity: newName.trim() ? 1 : 0.45,
              flexShrink: 0,
            }}
          >
            Save
          </button>
          <button
            type="button"
            onClick={handleSaveCancel}
            style={{
              height: "32px",
              padding: "0 10px",
              fontSize: "12px",
              fontWeight: 600,
              borderRadius: "8px",
              border: "1px solid var(--color-outline-variant)",
              backgroundColor: "var(--color-surface)",
              color: "var(--color-on-surface-variant)",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            Cancel
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={handleSaveClick}
          style={{
            height: "32px",
            padding: "0 12px",
            fontSize: "12px",
            fontWeight: 600,
            borderRadius: "8px",
            border: "1px solid var(--color-outline-variant)",
            backgroundColor: "var(--color-surface)",
            color: "var(--color-on-surface-variant)",
            cursor: "pointer",
            flexShrink: 0,
            whiteSpace: "nowrap",
          }}
        >
          + Save Profile
        </button>
      )}
    </div>
  );
}
