import { useState } from "react";
import { useModel } from "../../contexts/ModelContext";
import { ImageUpload } from "./ImageUpload";
import { useMultimodal } from "./useMultimodal";

export function Component() {
  const { currentModel } = useModel();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const { response, isProcessing, askAboutImage, cancel } = useMultimodal();

  const needsMultimodal = currentModel && !currentModel.capabilities.includes("image");

  const handleAsk = () => {
    if (!imageUrl || !question.trim()) return;
    askAboutImage(imageUrl, question.trim());
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Ask Image</h2>
        <p className="text-sm text-gray-500 mt-1">Upload an image and ask questions — powered by Gemma 3n E2B multimodal</p>
      </div>

      {needsMultimodal && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 text-sm text-yellow-800">
          Current model ({currentModel.name}) doesn't support images. Load <strong>Gemma 3n E2B</strong> from the Gallery for multimodal support.
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <ImageUpload onImageSelected={setImageUrl} />

        {imageUrl && (
          <div className="flex gap-3">
            <input type="text" value={question} onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAsk()}
              placeholder="Ask a question about this image..."
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            {isProcessing ? (
              <button onClick={cancel} className="px-4 py-2.5 bg-danger text-white rounded-lg text-sm font-medium">Stop</button>
            ) : (
              <button onClick={handleAsk} disabled={!currentModel || !!needsMultimodal || !question.trim()}
                className="px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-50">Ask</button>
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
