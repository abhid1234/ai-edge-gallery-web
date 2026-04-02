interface Props {
  search: string;
  onSearchChange: (value: string) => void;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
}

const FILTERS = [
  { key: "all", label: "All" },
  { key: "text", label: "Text" },
  { key: "multimodal", label: "Multimodal" },
  { key: "reasoning", label: "Reasoning" },
  { key: "code", label: "Code" },
  { key: "vision", label: "Vision" },
  { key: "tiny", label: "Tiny (<500MB)" },
];

const SORTS = [
  { key: "default", label: "Default" },
  { key: "smallest", label: "Smallest" },
  { key: "largest", label: "Largest" },
];

export function ModelFilters({
  search,
  onSearchChange,
  activeFilter,
  onFilterChange,
  sortBy,
  onSortChange,
}: Props) {
  return (
    <div className="mb-4 space-y-3">
      {/* Search input */}
      <div className="relative">
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
          style={{ color: "var(--color-on-surface-variant)" }}
        >
          <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search models..."
          className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#0B57D0]/30"
          style={{
            backgroundColor: "var(--color-surface)",
            borderColor: "var(--color-outline-variant)",
            color: "var(--color-on-surface)",
          }}
        />
        {search && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center rounded-full"
            style={{ color: "var(--color-on-surface-variant)" }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        )}
      </div>

      {/* Filter pills + sort dropdown */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => onFilterChange(f.key)}
              className="px-3 py-1 rounded-full text-xs font-semibold transition-colors"
              style={
                activeFilter === f.key
                  ? {
                      backgroundColor: "var(--color-primary)",
                      color: "var(--color-on-primary)",
                    }
                  : {
                      backgroundColor: "var(--color-surface-container-high)",
                      color: "var(--color-on-surface-variant)",
                    }
              }
            >
              {f.label}
            </button>
          ))}
        </div>

        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="text-xs px-3 py-1.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#0B57D0]/30"
          style={{
            backgroundColor: "var(--color-surface)",
            borderColor: "var(--color-outline-variant)",
            color: "var(--color-on-surface-variant)",
          }}
        >
          {SORTS.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
