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
        { path: "benchmarks", lazy: () => import("./features/benchmarks/BenchmarksPage") },
      ],
    },
  ],
  { basename: "/" }
);

export default function App() {
  return <RouterProvider router={router} />;
}
