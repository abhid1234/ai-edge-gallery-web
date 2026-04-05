import { NavLink } from "react-router";
import { DarkModeToggle } from "./DarkModeToggle";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

interface NavItem {
  to: string;
  label: string;
  end?: boolean;
  icon: React.ReactNode;
}

const SECTION_COLORS: Record<string, { text: string; bg: string }> = {
  Main: { text: "#1A73E8", bg: "#E8F0FE" },
  Multimodal: { text: "#E37400", bg: "#FEF3E0" },
  Tools: { text: "#0D652D", bg: "#E6F4EA" },
  Analytics: { text: "#7B1FA2", bg: "#F3E8FD" },
  Experiments: { text: "#C62828", bg: "#FDECEA" },
  Advanced: { text: "#00695C", bg: "#E0F2F1" },
  Developer: { text: "#4E342E", bg: "#EFEBE9" },
};

const NAV_GROUPS: { title?: string; items: NavItem[] }[] = [
  {
    title: "Main",
    items: [
      {
        to: "/",
        label: "Gallery",
        end: true,
        icon: (
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
          </svg>
        ),
      },
      {
        to: "/chat",
        label: "Chat",
        icon: (
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
          </svg>
        ),
      },
      {
        to: "/how-it-works",
        label: "How It Works",
        icon: (
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z" />
          </svg>
        ),
      },
    ],
  },
  {
    title: "Multimodal",
    items: [
      {
        to: "/ask-image",
        label: "Ask Image",
        icon: (
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
          </svg>
        ),
      },
      {
        to: "/ask-audio",
        label: "Ask Audio",
        icon: (
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z" />
          </svg>
        ),
      },
      {
        to: "/vision",
        label: "Vision Classifier",
        icon: (
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
          </svg>
        ),
      },
    ],
  },
  {
    title: "Tools",
    items: [
      {
        to: "/benchmarks",
        label: "Benchmarks",
        icon: (
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M5 9.2h3V19H5V9.2zM10.6 5h2.8v14h-2.8V5zm5.6 8H19v6h-2.8v-6z" />
          </svg>
        ),
      },
      {
        to: "/compare",
        label: "Compare",
        icon: (
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M10 18h5V5h-5v13zm-6 0h5V9H4v9zM16 5v13h5V5h-5z" />
          </svg>
        ),
      },
      {
        to: "/code-complete",
        label: "Code Complete",
        icon: (
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z" />
          </svg>
        ),
      },
      {
        to: "/embeddings",
        label: "Embeddings",
        icon: (
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M22 11V3h-7v3H9V3H2v8h7V8h2v10h4v3h7v-8h-7v3h-2V8h2v3h7zM7 9H4V5h3v4zm10 6h3v4h-3v-4zm0-10h3v4h-3V5z" />
          </svg>
        ),
      },
    ],
  },
  {
    title: "Analytics",
    items: [
      {
        to: "/token-viz",
        label: "Token Viz",
        icon: (
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
          </svg>
        ),
      },
      {
        to: "/perf-dashboard",
        label: "Perf Dashboard",
        icon: (
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l7.59-7.59L21 8l-9 9z" />
          </svg>
        ),
      },
    ],
  },
  {
    title: "Experiments",
    items: [
      {
        to: "/web-actions",
        label: "Web Actions",
        icon: (
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z" />
          </svg>
        ),
      },
      {
        to: "/personas",
        label: "Personas",
        icon: (
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
          </svg>
        ),
      },
    ],
  },
  {
    title: "Advanced",
    items: [
      {
        to: "/quant-explorer",
        label: "Quant Explorer",
        icon: (
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M11.5 2C6.81 2 3 5.81 3 10.5S6.81 19 11.5 19h.5v3c4.86-2.34 8-7 8-11.5C20 5.81 16.19 2 11.5 2zm1 14.5h-2v-2h2v2zm0-4h-2c0-3.25 3-3 3-5 0-1.1-.9-2-2-2s-2 .9-2 2h-2c0-2.21 1.79-4 4-4s4 1.79 4 4c0 2.5-3 2.75-3 5z" />
          </svg>
        ),
      },
      {
        to: "/model-test",
        label: "Model Test",
        icon: (
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.488.488 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.44.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
          </svg>
        ),
      },
      {
        to: "/hybrid",
        label: "Hybrid Local+Cloud",
        icon: (
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.94 6 12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11C20.43 12.17 22 13.56 22 15.2c0 1.65-1.35 2.8-3 2.8z" />
          </svg>
        ),
      },
    ],
  },
  {
    title: "Developer",
    items: [
      {
        to: "/modelfile",
        label: "Modelfile Editor",
        icon: (
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13zm-2 8H7v-2h4v2zm2-4H7v-2h6v2z" />
          </svg>
        ),
      },
      {
        to: "/vision-rag",
        label: "Vision RAG",
        icon: (
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z" />
          </svg>
        ),
      },
    ],
  },
];

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  return (
    <div
      className={`${collapsed ? "w-16" : "w-60"} h-screen flex flex-col sticky top-0 transition-all duration-200`}
      style={{
        backgroundColor: "var(--color-surface)",
        borderRight: "1px solid var(--color-outline-variant)",
      }}
    >
      {/* Logo */}
      <div className="h-20 flex items-center px-4 flex-shrink-0">
        {collapsed ? (
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-extrabold text-white flex-shrink-0 shadow-md"
            style={{ background: "linear-gradient(135deg, var(--color-title-gradient-start), var(--color-title-gradient-end))" }}
          >
            AI
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-extrabold text-white flex-shrink-0 shadow-md"
              style={{ background: "linear-gradient(135deg, var(--color-title-gradient-start), var(--color-title-gradient-end))" }}
            >
              AI
            </div>
            <div className="leading-tight">
              <p className="text-sm font-bold" style={{ color: "var(--color-on-surface)" }}>
                <span style={{
                  background: "linear-gradient(90deg, var(--color-title-gradient-start), var(--color-title-gradient-end))",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                }}>AI</span>
                {" "}Edge Gallery
              </p>
              <p className="text-[10px]" style={{ color: "var(--color-on-surface-variant)" }}>On-Device ML Platform</p>
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-1">
        {NAV_GROUPS.map((group, gi) => (
          <div key={gi}>
            {gi > 0 && (
              <div
                className="mx-2 mt-3 mb-1 border-t"
                style={{ borderColor: "var(--color-outline-variant)" }}
              />
            )}
            {group.title && !collapsed && (
              <div
                className="mx-3 mt-1 mb-0.5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded"
                style={{
                  color: SECTION_COLORS[group.title]?.text ?? "var(--color-outline)",
                  backgroundColor: SECTION_COLORS[group.title]?.bg ?? "transparent",
                }}
              >
                {group.title}
              </div>
            )}
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors mb-0.5 ${
                    isActive
                      ? "border-l-3 border-[var(--color-primary)] bg-[var(--color-primary-container)]"
                      : "hover:bg-[var(--color-surface-container)] border-l-3 border-transparent"
                  }`
                }
                style={({ isActive }) => ({
                  color: isActive
                    ? "var(--color-on-primary-container)"
                    : "var(--color-on-surface-variant)",
                })}
              >
                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                  {item.icon}
                </span>
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Bottom controls */}
      <div className="flex-shrink-0 px-2 py-3 space-y-2" style={{ borderTop: "1px solid var(--color-outline-variant)" }}>
        <div className={`flex items-center ${collapsed ? "justify-center" : "px-2"}`}>
          <DarkModeToggle />
        </div>
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-[var(--color-surface-container)]"
          style={{ color: "var(--color-on-surface-variant)" }}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className={`w-5 h-5 transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`}
          >
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
          </svg>
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </div>
  );
}
