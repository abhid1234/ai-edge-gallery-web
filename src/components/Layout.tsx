import { Outlet, NavLink } from "react-router";
import { ModelIndicator } from "./ModelIndicator";
import { WebGPUWarning } from "./WebGPUWarning";
import { useWebGPU } from "../hooks/useWebGPU";

const navLinks = [
  { to: "/", label: "Gallery", end: true },
  { to: "/chat", label: "Chat" },
  { to: "/ask-image", label: "Ask Image" },
  { to: "/benchmarks", label: "Benchmarks" },
];

export function Layout() {
  const { info } = useWebGPU();

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <header className="bg-white border-b border-surface-dark px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <h1 className="text-lg font-semibold text-gray-900">
            AI Edge Gallery
            <span className="text-xs ml-2 text-gray-500 font-normal">Web</span>
          </h1>
          <nav className="flex gap-1">
            {navLinks.map(({ to, label, ...rest }) => (
              <NavLink
                key={to}
                to={to}
                end={"end" in rest}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
        <ModelIndicator />
      </header>

      {!info.supported && <WebGPUWarning />}

      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
