import { useState, useRef, useCallback, useEffect } from "react";

const MAX_RECORDING_SECONDS = 30;

interface Props {
  onAudioReady: (audioUrl: string) => void;
}

export function AudioRecorder({ onAudioReady }: Props) {
  const [mode, setMode] = useState<"record" | "upload">("record");
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioUrlRef = useRef<string | null>(null);

  // Keep ref in sync so cleanup always has the latest URL
  useEffect(() => {
    audioUrlRef.current = audioUrl;
  }, [audioUrl]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsRecording(false);
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    // Revoke any existing blob URL before starting a new recording
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    setAudioUrl(null);
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        onAudioReady(url);
      };

      recorder.start(100);
      setIsRecording(true);
      setElapsed(0);

      timerRef.current = setInterval(() => {
        setElapsed((prev) => {
          if (prev + 1 >= MAX_RECORDING_SECONDS) {
            stopRecording();
            return MAX_RECORDING_SECONDS;
          }
          return prev + 1;
        });
      }, 1000);
    } catch {
      setError("Microphone access denied. Please allow microphone access and try again.");
    }
  }, [onAudioReady, stopRecording]);

  const handleFile = useCallback(
    (file: File) => {
      const allowed = ["audio/wav", "audio/mpeg", "audio/mp3", "audio/webm", "audio/ogg"];
      if (!allowed.includes(file.type) && !file.type.startsWith("audio/")) {
        setError("Unsupported file type. Please upload a WAV, MP3, WebM, or OGG file.");
        return;
      }
      // Revoke previous blob URL before creating a new one
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      onAudioReady(url);
      setError(null);
    },
    [onAudioReady]
  );

  const clearAudio = () => {
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    setAudioUrl(null);
    setElapsed(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => { setMode("record"); clearAudio(); }}
          className="px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
          style={
            mode === "record"
              ? { backgroundColor: "var(--color-primary)", color: "#fff" }
              : { backgroundColor: "var(--color-surface-container)", color: "var(--color-on-surface-variant)" }
          }
        >
          Record
        </button>
        <button
          onClick={() => { setMode("upload"); clearAudio(); }}
          className="px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
          style={
            mode === "upload"
              ? { backgroundColor: "var(--color-primary)", color: "#fff" }
              : { backgroundColor: "var(--color-surface-container)", color: "var(--color-on-surface-variant)" }
          }
        >
          Upload
        </button>
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* Record mode */}
      {mode === "record" && (
        <div className="flex flex-col items-center gap-4 py-4">
          {!isRecording && !audioUrl && (
            <button
              onClick={startRecording}
              className="w-14 h-14 rounded-full flex items-center justify-center shadow-md transition-transform hover:scale-105 active:scale-95"
              style={{ backgroundColor: "#EE675C" }}
              aria-label="Start recording"
            >
              {/* Mic icon */}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
            </button>
          )}

          {isRecording && (
            <>
              {/* Pulsing indicator + timer */}
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full animate-pulse"
                  style={{ backgroundColor: "#EE675C" }}
                />
                <span className="text-sm font-mono font-medium" style={{ color: "#EE675C" }}>
                  {formatTime(elapsed)} / {formatTime(MAX_RECORDING_SECONDS)}
                </span>
              </div>
              {/* Stop button */}
              <button
                onClick={stopRecording}
                className="w-14 h-14 rounded-full flex items-center justify-center shadow-md transition-transform hover:scale-105 active:scale-95"
                style={{ backgroundColor: "#EE675C" }}
                aria-label="Stop recording"
              >
                {/* Stop square icon */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <rect x="4" y="4" width="16" height="16" rx="2" />
                </svg>
              </button>
            </>
          )}

          {audioUrl && !isRecording && (
            <div className="w-full space-y-2">
              <audio src={audioUrl} controls className="w-full rounded-lg" />
              <button
                onClick={clearAudio}
                className="text-xs text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] underline"
              >
                Clear recording
              </button>
            </div>
          )}
        </div>
      )}

      {/* Upload mode */}
      {mode === "upload" && (
        <div>
          {audioUrl ? (
            <div className="space-y-2">
              <audio src={audioUrl} controls className="w-full rounded-lg" />
              <button
                onClick={clearAudio}
                className="text-xs text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] underline"
              >
                Clear file
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors border-[var(--color-outline-variant)] hover:border-gray-400"
            >
              <p className="text-sm text-[var(--color-on-surface-variant)]">Click to upload an audio file</p>
              <p className="text-xs text-[var(--color-outline)] mt-1">Supports WAV, MP3, WebM, OGG</p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/wav,audio/mpeg,audio/mp3,audio/webm,audio/ogg"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
}
