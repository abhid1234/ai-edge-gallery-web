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
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>{formatSize(progress.bytesDownloaded)}</span>
        <span>{percent}%</span>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
