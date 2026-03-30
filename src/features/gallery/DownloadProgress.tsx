import type { DownloadProgress as DownloadProgressType } from "../../types";
import { formatSize } from "../../lib/catalog";

interface Props {
  progress: DownloadProgressType;
}

export function DownloadProgress({ progress }: Props) {
  const percent =
    progress.totalBytes > 0
      ? Math.round((progress.bytesDownloaded / progress.totalBytes) * 100)
      : 0;

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-[#444746] mb-1.5">
        <span>{formatSize(progress.bytesDownloaded)}</span>
        <span className="font-semibold text-[#0B57D0]">{percent}%</span>
      </div>
      <div className="w-full h-1.5 bg-[#E9EEF6] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${percent}%`,
            background: "linear-gradient(90deg, #669DF6 0%, #3174F1 100%)",
          }}
        />
      </div>
    </div>
  );
}
