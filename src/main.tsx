import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { DownloadProvider } from "./contexts/DownloadContext";
import { ModelProvider } from "./contexts/ModelContext";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <DownloadProvider>
      <ModelProvider>
        <App />
      </ModelProvider>
    </DownloadProvider>
  </StrictMode>
);
