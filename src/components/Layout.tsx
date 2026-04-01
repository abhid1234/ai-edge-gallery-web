import { useState } from "react";
import { Outlet } from "react-router";
import { ModelIndicator } from "./ModelIndicator";
import { WebGPUWarning } from "./WebGPUWarning";
import { OfflineToggle } from "./OfflineToggle";
import { Sidebar } from "./Sidebar";
import { useWebGPU } from "../hooks/useWebGPU";

export function Layout() {
  const { info } = useWebGPU();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem("sidebar_collapsed") === "true";
  });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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
          className="h-14 flex-shrink-0 flex items-center justify-between px-4 lg:px-6"
          style={{
            backgroundColor: "var(--color-surface)",
            borderBottom: "1px solid var(--color-outline-variant)",
          }}
        >
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-lg"
              onClick={() => setMobileSidebarOpen(true)}
              style={{ color: "var(--color-on-surface)" }}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
              </svg>
            </button>

            {/* Title + badges */}
            <h1
              className="text-base font-bold hidden sm:block"
              style={{ fontFamily: "var(--font-sans)" }}
            >
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
              <span style={{ color: "var(--color-on-surface)" }}> Edge Gallery</span>
            </h1>
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full hidden sm:inline"
              style={{
                backgroundColor: "var(--color-primary-container)",
                color: "var(--color-on-primary-container)",
              }}
            >
              Web
            </span>
            <span
              className="text-[10px] px-2 py-0.5 rounded-full items-center gap-1 hidden lg:inline-flex"
              style={{
                backgroundColor: "var(--color-tertiary-container)",
                color: "var(--color-tertiary)",
              }}
              title="All inference runs on your device. No data is sent to any server."
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
              </svg>
              On-Device
            </span>
          </div>

          <div className="flex items-center gap-2">
            <OfflineToggle />
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
    </div>
  );
}
