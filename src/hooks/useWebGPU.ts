import { useState, useEffect } from "react";
import type { WebGPUInfo } from "../types";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Navigator {
    gpu?: any;
  }
}

const DEFAULT_INFO: WebGPUInfo = {
  supported: false,
  adapterName: "",
  vendor: "",
  maxBufferSize: 0,
};

export function useWebGPU() {
  const [info, setInfo] = useState<WebGPUInfo>(DEFAULT_INFO);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function detect() {
      if (!navigator.gpu) {
        setInfo(DEFAULT_INFO);
        setLoading(false);
        return;
      }

      try {
        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) {
          setInfo(DEFAULT_INFO);
          setLoading(false);
          return;
        }

        const adapterInfo = await adapter.info;
        setInfo({
          supported: true,
          adapterName: adapterInfo.device || "Unknown GPU",
          vendor: adapterInfo.vendor || "Unknown",
          maxBufferSize: adapter.limits.maxBufferSize,
        });
      } catch {
        setInfo(DEFAULT_INFO);
      } finally {
        setLoading(false);
      }
    }
    detect();
  }, []);

  return { info, loading };
}
