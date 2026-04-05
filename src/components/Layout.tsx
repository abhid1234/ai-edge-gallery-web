import { useState, useEffect } from "react";
import { Outlet } from "react-router";
import { ModelIndicator } from "./ModelIndicator";
import { WebGPUWarning } from "./WebGPUWarning";
import { OfflineToggle } from "./OfflineToggle";
import { HeaderMemoryPill } from "./HeaderMemoryPill";
import { Sidebar } from "./Sidebar";
import { CommandBar } from "./CommandBar";
import { useWebGPU } from "../hooks/useWebGPU";

export function Layout() {
  const { info } = useWebGPU();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem("sidebar_collapsed") === "true";
  });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [commandBarOpen, setCommandBarOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandBarOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const toggleSidebar = () => {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    localStorage.setItem("sidebar_collapsed", String(next));
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "var(--color-surface-container)" }}>
      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileSidebarOpen(false)} />
          <div className="relative z-50 h-full w-60">
            <Sidebar collapsed={false} onToggle={() => setMobileSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Desktop/tablet sidebar */}
      <div className="hidden md:block">
        <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
      </div>

      {/* Main content column */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Slim header */}
        <header
          className="h-20 flex-shrink-0 flex items-center justify-between px-4 lg:px-6"
          style={{
            backgroundColor: "var(--color-surface)",
            borderBottom: "1px solid var(--color-outline-variant)",
          }}
        >
          <div className="flex items-center gap-4">
            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-lg"
              onClick={() => setMobileSidebarOpen(true)}
              style={{ color: "var(--color-on-surface)" }}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
              </svg>
            </button>

            {/* Title visible on mobile only (sidebar has it on desktop) */}
            <h1
              className="text-base font-bold md:hidden"
              style={{ fontFamily: "var(--font-sans)", color: "var(--color-on-surface)" }}
            >
              <span style={{
                background: "linear-gradient(90deg, var(--color-title-gradient-start), var(--color-title-gradient-end))",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              }}>AI</span> Edge Gallery
            </h1>

            {/* Badges */}
            <span
              className="text-xs font-semibold px-3 py-1.5 rounded-full hidden sm:inline"
              style={{
                backgroundColor: "var(--color-primary-container)",
                color: "var(--color-on-primary-container)",
              }}
            >
              Web
            </span>
            <span
              className="text-xs px-3 py-1.5 rounded-full items-center gap-1.5 hidden sm:inline-flex"
              style={{
                backgroundColor: "var(--color-tertiary-container)",
                color: "var(--color-tertiary)",
              }}
              title="All inference runs on your device. No data is sent to any server."
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
              </svg>
              On-Device
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Cmd+K trigger button */}
            <button
              onClick={() => setCommandBarOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors"
              style={{
                backgroundColor: "var(--color-surface-container)",
                color: "var(--color-on-surface-variant)",
                border: "1px solid var(--color-outline-variant)",
              }}
              title="Open command bar (Cmd+K)"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
              </svg>
              <span>Search</span>
              <kbd
                className="px-1 py-0.5 text-[10px] rounded font-mono"
                style={{
                  backgroundColor: "var(--color-surface-container-high)",
                  border: "1px solid var(--color-outline-variant)",
                }}
              >
                ⌘K
              </kbd>
            </button>
            <OfflineToggle />
            <HeaderMemoryPill />
            <ModelIndicator />
          </div>
        </header>

        {/* WebGPU Warning */}
        {!info.supported && (
          <div className="px-6 pt-4">
            <WebGPUWarning />
          </div>
        )}

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>

      <CommandBar
        open={commandBarOpen}
        onClose={() => setCommandBarOpen(false)}
      />
    </div>
  );
}
