import { useModel } from "../contexts/ModelContext";

export function InferenceProgressBar() {
  const { isLoading, isGenerating } = useModel();
  const active = isLoading || isGenerating;

  if (!active) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-1 overflow-hidden" style={{ backgroundColor: "var(--color-primary-container)" }}>
      <div
        className="h-full animate-[progress_1.5s_ease-in-out_infinite]"
        style={{
          backgroundColor: "var(--color-primary)",
          width: "30%",
        }}
      />
      <style>{`
        @keyframes progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(430%); }
        }
      `}</style>
    </div>
  );
}
