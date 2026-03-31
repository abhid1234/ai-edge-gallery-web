import { useState } from "react";
import { useModel } from "../../contexts/ModelContext";
import { AudioRecorder } from "./AudioRecorder";
import { useAudioInference } from "./useAudioInference";

export function Component() {
  const { currentModel } = useModel();
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const { response, isProcessing, askAboutAudio, cancel } = useAudioInference();

  const needsAudio = currentModel && !currentModel.capabilities.includes("audio");

  const handleAsk = () => {
    if (!audioUrl || !question.trim()) return;
    askAboutAudio(audioUrl, question.trim());
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Ask Audio</h2>
        <p className="text-sm text-gray-500 mt-1">
          Record or upload audio and ask questions — powered by Gemma 3n E2B multimodal
        </p>
      </div>

      {needsAudio && (
        <div
          className="rounded-lg p-4 mb-4 text-sm border"
          style={{
            backgroundColor: "#FEF7E0",
            borderColor: "#F9E080",
            color: "#5F4B00",
          }}
        >
          Current model ({currentModel.name}) doesn't support audio. Load{" "}
          <strong>Gemma 3n E2B</strong> from the Gallery for audio support.
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <AudioRecorder onAudioReady={setAudioUrl} />

        {audioUrl && (
          <div className="flex gap-3">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAsk()}
              placeholder="Ask a question about this audio..."
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {isProcessing ? (
              <button
                onClick={cancel}
                className="px-4 py-2.5 rounded-lg text-sm font-medium text-white"
                style={{ backgroundColor: "#EE675C" }}
              >
                Stop
              </button>
            ) : (
              <button
                onClick={handleAsk}
                disabled={!currentModel || !!needsAudio || !question.trim()}
                className="px-4 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-50"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                Ask
              </button>
            )}
          </div>
        )}

        {response && (
          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-900 leading-relaxed">
            <pre className="whitespace-pre-wrap font-sans">{response}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
