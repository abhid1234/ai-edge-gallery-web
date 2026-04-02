import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  handleRefresh = () => {
    // Clear all caches and service workers, then reload
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((r) => r.unregister());
      });
    }
    caches.keys().then((names) => {
      names.forEach((name) => caches.delete(name));
    });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isChunkError =
        this.state.error?.message?.includes("dynamically imported module") ||
        this.state.error?.message?.includes("Failed to fetch") ||
        this.state.error?.message?.includes("Loading chunk");

      return (
        <div
          className="flex items-center justify-center h-screen"
          style={{ backgroundColor: "var(--color-surface-container)" }}
        >
          <div
            className="text-center p-8 rounded-2xl max-w-md mx-4"
            style={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-outline-variant)",
            }}
          >
            <div className="text-4xl mb-4">{isChunkError ? "🔄" : "⚠️"}</div>
            <h2
              className="text-lg font-bold mb-2"
              style={{ color: "var(--color-on-surface)" }}
            >
              {isChunkError ? "New version available" : "Something went wrong"}
            </h2>
            <p
              className="text-sm mb-6"
              style={{ color: "var(--color-on-surface-variant)" }}
            >
              {isChunkError
                ? "The app has been updated. Please refresh to load the latest version."
                : "An unexpected error occurred. Refreshing usually fixes this."}
            </p>
            <button
              onClick={this.handleRefresh}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              Refresh App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
