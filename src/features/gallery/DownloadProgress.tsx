import { useRef, useEffect, useState } from "react";
import type { DownloadProgress as DownloadProgressType } from "../../types";
import { formatSize } from "../../lib/catalog";

interface Props {
  progress: DownloadProgressType;
}

export function DownloadProgress({ progress }: Props) {
  const [speed, setSpeed] = useState(0);
  const lastRef = useRef({ bytes: 0, time: Date.now() });

  useEffect(() => {
    const now = Date.now();
    const elapsed = (now - lastRef.current.time) / 1000;
    if (elapsed > 0.5) {
      const byteDiff = progress.bytesDownloaded - lastRef.current.bytes;
      setSpeed(byteDiff / elapsed);
      lastRef.current = { bytes: progress.bytesDownloaded, time: now };
    }
  }, [progress.bytesDownloaded]);

  const percent =
    progress.totalBytes > 0
      ? Math.round((progress.bytesDownloaded / progress.totalBytes) * 100)
      : 0;

  const remaining = progress.totalBytes - progress.bytesDownloaded;
  const etaSeconds = speed > 0 ? Math.round(remaining / speed) : 0;
  const etaStr = etaSeconds > 60
    ? `${Math.round(etaSeconds / 60)}m ${etaSeconds % 60}s`
    : `${etaSeconds}s`;

  return (
    <div className="w-full">
      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--color-outline-variant)" }}>
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${percent}%`,
            background: "linear-gradient(90deg, #669DF6, #3174F1)",
          }}
        />
      </div>
      <div className="flex justify-between text-[11px] mt-1.5" style={{ color: "var(--color-on-surface-variant)" }}>
        <span>{formatSize(progress.bytesDownloaded)} / {formatSize(progress.totalBytes)}</span>
        <span>
          {speed > 0 && `${formatSize(speed)}/s · `}
          {speed > 0 && etaSeconds > 0 ? `~${etaStr} left · ` : ""}
          {percent}%
        </span>
      </div>
    </div>
  );
}
