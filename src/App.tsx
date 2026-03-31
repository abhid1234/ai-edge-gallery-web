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
        { path: "tiny-garden", lazy: () => import("./features/tiny-garden/TinyGardenPage") },
      ],
    },
  ],
  { basename: "/" }
);

export default function App() {
  return <RouterProvider router={router} />;
}
