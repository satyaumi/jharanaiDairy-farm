import React, { useState, useEffect } from "react";
import { Cloud, CloudOff, RefreshCw, CheckCircle2, Loader2 } from "lucide-react";
import { apiUrl } from "@/lib/api-config";

export function CloudHealthStatus() {
  const [status, setStatus] = useState<"checking" | "online" | "waking" | "offline">("checking");
  const [retryCount, setRetryCount] = useState(0);

  const checkHealth = async () => {
    try {
      setStatus("checking");
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        // If > 4s, backend is likely waking from Render sleep
        setStatus("waking");
      }, 3500);

      const res = await fetch(apiUrl("/health"), {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        setStatus("online");
      } else {
        setStatus("offline");
      }
    } catch (err: any) {
      if (err.name === "AbortError" || status === "waking") {
        setStatus("waking");
      } else {
        setStatus("offline");
      }
    }
  };

  useEffect(() => {
    void checkHealth();
    const interval = setInterval(checkHealth, 45000);
    return () => clearInterval(interval);
  }, [retryCount]);

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all">
      {status === "online" && (
        <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-300">
          <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Cloud Sync OK</span>
        </span>
      )}

      {status === "waking" && (
        <span className="flex items-center gap-1 text-amber-700 dark:text-amber-300">
          <Loader2 className="size-3 animate-spin text-amber-500" />
          <span>Connecting Cloud...</span>
        </span>
      )}

      {status === "checking" && (
        <span className="flex items-center gap-1 text-muted-foreground">
          <Loader2 className="size-2.5 animate-spin" />
          <span>Verifying...</span>
        </span>
      )}

      {status === "offline" && (
        <button
          type="button"
          onClick={() => {
            setRetryCount((c) => c + 1);
            void checkHealth();
          }}
          className="flex items-center gap-1 text-rose-700 hover:text-rose-800 dark:text-rose-300"
        >
          <CloudOff className="size-3 text-rose-500" />
          <span>Sync Offline · Click to Retry</span>
          <RefreshCw className="size-2.5 ml-0.5" />
        </button>
      )}
    </div>
  );
}
