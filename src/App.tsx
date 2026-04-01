import { createBrowserRouter, RouterProvider } from "react-router";
import { Layout } from "./components/Layout";

const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <Layout />,
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
      ],
    },
  ],
  { basename: "/" }
);

export default function App() {
  return <RouterProvider router={router} />;
}
