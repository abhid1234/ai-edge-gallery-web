import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { DownloadProvider } from "./contexts/DownloadContext";
import { ModelProvider } from "./contexts/ModelContext";
import { NetworkCounter } from "./components/NetworkCounter";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <DownloadProvider>
      <ModelProvider>
        <App />
        <NetworkCounter />
      </ModelProvider>
    </DownloadProvider>
  </StrictMode>
);
