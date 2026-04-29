import { createBrowserRouter, RouterProvider } from "react-router";
import { Layout } from "./components/Layout";

function RouteError() {
  const handleRefresh = () => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister()));
    }
    caches.keys().then((names) => names.forEach((n) => caches.delete(n)));
    window.location.reload();
  };

  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center p-6">
        <p className="text-4xl mb-3">🔄</p>
        <p className="text-sm font-semibold mb-1" style={{ color: "var(--color-on-surface)" }}>New version available</p>
        <p className="text-xs mb-4" style={{ color: "var(--color-on-surface-variant)" }}>Refresh to load the latest version</p>
        <button onClick={handleRefresh} className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: "var(--color-primary)" }}>
          Refresh
        </button>
      </div>
    </div>
  );
}

const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <Layout />,
      errorElement: <RouteError />,
      children: [
        { index: true, lazy: () => import("./features/gallery/GalleryPage") },
        { path: "chat", lazy: () => import("./features/chat/ChatPage") },
        { path: "ask-image", lazy: () => import("./features/ask-image/AskImagePage") },
        { path: "ask-audio", lazy: () => import("./features/ask-audio/AskAudioPage") },
        { path: "benchmarks", lazy: () => import("./features/benchmarks/BenchmarksPage") },
        { path: "prompt-lab", lazy: () => import("./features/prompt-lab/PromptLabPage") },
        { path: "web-actions", lazy: () => import("./features/web-actions/WebActionsPage") },
        { path: "personas", lazy: () => import("./features/personas/PersonasPage") },
        { path: "tool-sandbox", lazy: () => import("./features/tool-sandbox/ToolSandboxPage") },
        { path: "tiny-garden", lazy: () => import("./features/tiny-garden/TinyGardenPage") },
        { path: "compare", lazy: () => import("./features/compare/ComparePage") },
        { path: "code-complete", lazy: () => import("./features/code-complete/CodeCompletePage") },
        { path: "embeddings", lazy: () => import("./features/embeddings/EmbeddingsPage") },
        { path: "how-it-works", lazy: () => import("./features/how-it-works/HowItWorksPage") },
        { path: "token-viz", lazy: () => import("./features/token-viz/TokenVizPage") },
        { path: "perf-dashboard", lazy: () => import("./features/perf-dashboard/PerfDashboardPage") },
        { path: "quant-explorer", lazy: () => import("./features/quant-explorer/QuantExplorerPage") },
        { path: "modelfile", lazy: () => import("./features/modelfile/ModelfilePage") },
        { path: "hybrid", lazy: () => import("./features/hybrid/HybridPage") },
        { path: "vision-rag", lazy: () => import("./features/vision-rag/VisionRagPage") },
        { path: "vision", lazy: () => import("./features/vision/VisionPage") },
        { path: "model-test", lazy: () => import("./features/model-test/ModelTestPage") },
        { path: "webnn-test", lazy: () => import("./features/webnn-test/WebNNTestPage") },
        { path: "webnn-notes", lazy: () => import("./features/webnn-notes/WebNNNotesPage") },
        { path: "research", lazy: () => import("./features/research") },
      ],
    },
  ],
  { basename: "/" }
);

export default function App() {
  return <RouterProvider router={router} />;
}
