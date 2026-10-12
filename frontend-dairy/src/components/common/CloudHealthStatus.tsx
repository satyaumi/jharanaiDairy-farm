import React, { useState, useEffect, useCallback } from "react";
import { Cloud, CloudOff, RefreshCw, CheckCircle2, Loader2 } from "lucide-react";
import { apiUrl } from "@/lib/api-config";

export function CloudHealthStatus() {
  const [status, setStatus] = useState<"checking" | "synced" | "waking" | "offline">("checking");
  const [lastSyncedTime, setLastSyncedTime] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const checkHealth = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        setStatus("waking");
      }, 3500);

      const res = await fetch(apiUrl("/health"), {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        setStatus("synced");
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        setLastSyncedTime(timeStr);
      } else {
        setStatus("offline");
      }
    } catch (err: any) {
      if (err.name === "AbortError" || status === "waking") {
        setStatus("waking");
      } else {
        setStatus("offline");
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [status]);

  useEffect(() => {
    void checkHealth();
    // Poll every 60s to ensure real connectivity status
    const interval = setInterval(checkHealth, 60000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  return (
    <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all">
      {status === "synced" && (
        <button
          type="button"
          onClick={() => void checkHealth()}
          title="Server connected and synchronized. Click to re-verify."
          className="flex items-center gap-1.5 text-emerald-700 hover:text-emerald-800 dark:text-emerald-300 transition-colors"
        >
          <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Synced {lastSyncedTime ? `(${lastSyncedTime})` : ""}</span>
          {isRefreshing && <RefreshCw className="size-2.5 animate-spin ml-0.5 text-emerald-600" />}
        </button>
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
          <span>Verifying Sync...</span>
        </span>
      )}

      {status === "offline" && (
        <button
          type="button"
          onClick={() => void checkHealth()}
          className="flex items-center gap-1 text-rose-700 hover:text-rose-800 dark:text-rose-300 font-bold"
        >
          <CloudOff className="size-3 text-rose-500" />
          <span>Sync Offline · Retry</span>
          <RefreshCw className={`size-2.5 ml-0.5 ${isRefreshing ? "animate-spin" : ""}`} />
        </button>
      )}
    </div>
  );
}
