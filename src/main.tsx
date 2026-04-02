import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { DownloadProvider } from "./contexts/DownloadContext";
import { ModelProvider } from "./contexts/ModelContext";
import { NetworkCounter } from "./components/NetworkCounter";
import { InferenceProgressBar } from "./components/InferenceProgressBar";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <DownloadProvider>
        <ModelProvider>
          <InferenceProgressBar />
          <App />
          <NetworkCounter />
        </ModelProvider>
      </DownloadProvider>
    </ErrorBoundary>
  </StrictMode>
);
