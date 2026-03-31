import { Outlet, NavLink } from "react-router";
import { ModelIndicator } from "./ModelIndicator";
import { WebGPUWarning } from "./WebGPUWarning";
import { useWebGPU } from "../hooks/useWebGPU";

const navLinks = [
  { to: "/", label: "Gallery", end: true },
  { to: "/chat", label: "Chat" },
  { to: "/ask-image", label: "Ask Image" },
  { to: "/ask-audio", label: "Ask Audio" },
  { to: "/benchmarks", label: "Benchmarks" },
  { to: "/prompt-lab", label: "Prompt Lab" },
];

export function Layout() {
  const { info } = useWebGPU();

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--color-surface-container)" }}>
      {/* Top App Bar */}
      <header className="bg-white shadow-sm px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        {/* Title */}
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-extrabold leading-none" style={{ fontFamily: "var(--font-sans)" }}>
            <span
              style={{
                background: "linear-gradient(90deg, var(--color-title-gradient-start), var(--color-title-gradient-end))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Google AI
            </span>
            <span className="text-on-surface ml-1" style={{ color: "var(--color-on-surface)" }}>
              Edge Gallery
            </span>
          </h1>
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: "var(--color-primary-container)",
              color: "var(--color-on-primary-container)",
              fontSize: "11px",
            }}
          >
            Web
          </span>
        </div>

        {/* Model Indicator */}
        <ModelIndicator />
      </header>

      {/* Pill Tab Navigation */}
      <div className="bg-white border-b px-6 py-2 flex gap-2 overflow-x-auto" style={{ borderColor: "var(--color-outline-variant)" }}>
        {navLinks.map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex-shrink-0 h-10 px-5 rounded-full text-sm font-semibold transition-colors flex items-center ${
                isActive
                  ? "text-white"
                  : "hover:opacity-80"
              }`
            }
            style={({ isActive }) =>
              isActive
                ? { backgroundColor: "var(--color-tab-selected)", color: "#ffffff" }
                : { backgroundColor: "transparent", color: "var(--color-on-surface-variant)" }
            }
          >
            {label}
          </NavLink>
        ))}
      </div>

      {/* WebGPU Warning */}
      {!info.supported && (
        <div className="px-6 pt-4">
          <WebGPUWarning />
        </div>
      )}

      {/* Content Area */}
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
