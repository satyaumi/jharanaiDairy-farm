import { toast as sonnerToast, type ExternalToast } from "sonner";
import { soundService, type SoundType } from "./sound-service";

export interface NotifyOptions extends ExternalToast {
  /** Custom deduplication key. Defaults to message + description */
  dedupKey?: string;
  /** Explicit sound override or "none" to mute */
  sound?: SoundType;
}

/**
 * Tracks currently active (visible) toasts on screen.
 * Prevents identical messages from stacking or spawning duplicate toasts.
 * Once a notification is dismissed or auto-closes, it is removed,
 * allowing subsequent user clicks to trigger the notification again.
 */
interface ActiveToastEntry {
  id: string | number;
  timer: NodeJS.Timeout | null;
  expiresAt: number;
}

const activeToasts = new Map<string, ActiveToastEntry>();

function registerActiveToast(
  key: string,
  toastId: string | number,
  durationMs: number,
  onUserDismiss?: () => void,
  onUserAutoClose?: () => void
): { onDismiss: () => void; onAutoClose: () => void } {
  const existing = activeToasts.get(key);
  if (existing?.timer) {
    clearTimeout(existing.timer);
  }

  const cleanup = () => {
    const entry = activeToasts.get(key);
    if (entry && entry.id === toastId) {
      if (entry.timer) clearTimeout(entry.timer);
      activeToasts.delete(key);
    }
  };

  const timer = setTimeout(cleanup, durationMs + 200);

  activeToasts.set(key, {
    id: toastId,
    timer,
    expiresAt: Date.now() + durationMs,
  });

  return {
    onDismiss: () => {
      cleanup();
      onUserDismiss?.();
    },
    onAutoClose: () => {
      cleanup();
      onUserAutoClose?.();
    },
  };
}

export const notify = {
  success: (message: string, options?: NotifyOptions) => {
    const key = options?.dedupKey || `success:${message}:${options?.description || ""}`;
    const active = activeToasts.get(key);
    if (active && Date.now() < active.expiresAt) {
      return active.id;
    }

    const duration = typeof options?.duration === "number" ? options.duration : 3800;
    const soundType: SoundType = options?.sound ?? (message.toLowerCase().includes("record") ? "confirm" : "success");
    soundService.play(soundType);

    const callbacks = registerActiveToast(
      key,
      key,
      duration,
      options?.onDismiss ? () => options.onDismiss?.(key as any) : undefined,
      options?.onAutoClose ? () => options.onAutoClose?.(key as any) : undefined
    );

    return sonnerToast.success(message, {
      id: key,
      duration,
      ...options,
      onDismiss: callbacks.onDismiss,
      onAutoClose: callbacks.onAutoClose,
    });
  },

  error: (message: string, options?: NotifyOptions) => {
    const key = options?.dedupKey || `error:${message}:${options?.description || ""}`;
    const active = activeToasts.get(key);
    if (active && Date.now() < active.expiresAt) {
      return active.id;
    }

    const duration = typeof options?.duration === "number" ? options.duration : 5000;
    const soundType: SoundType = options?.sound ?? "error";
    soundService.play(soundType);

    const callbacks = registerActiveToast(
      key,
      key,
      duration,
      options?.onDismiss ? () => options.onDismiss?.(key as any) : undefined,
      options?.onAutoClose ? () => options.onAutoClose?.(key as any) : undefined
    );

    return sonnerToast.error(message, {
      id: key,
      duration,
      ...options,
      onDismiss: callbacks.onDismiss,
      onAutoClose: callbacks.onAutoClose,
    });
  },

  warning: (message: string, options?: NotifyOptions) => {
    const key = options?.dedupKey || `warning:${message}:${options?.description || ""}`;
    const active = activeToasts.get(key);
    if (active && Date.now() < active.expiresAt) {
      return active.id;
    }

    const duration = typeof options?.duration === "number" ? options.duration : 4500;
    const soundType: SoundType = options?.sound ?? "warning";
    soundService.play(soundType);

    const callbacks = registerActiveToast(
      key,
      key,
      duration,
      options?.onDismiss ? () => options.onDismiss?.(key as any) : undefined,
      options?.onAutoClose ? () => options.onAutoClose?.(key as any) : undefined
    );

    return sonnerToast.warning(message, {
      id: key,
      duration,
      ...options,
      onDismiss: callbacks.onDismiss,
      onAutoClose: callbacks.onAutoClose,
    });
  },

  info: (message: string, options?: NotifyOptions) => {
    const key = options?.dedupKey || `info:${message}:${options?.description || ""}`;
    const active = activeToasts.get(key);
    if (active && Date.now() < active.expiresAt) {
      return active.id;
    }

    const duration = typeof options?.duration === "number" ? options.duration : 3500;
    const soundType: SoundType = options?.sound ?? "info";
    soundService.play(soundType);

    const callbacks = registerActiveToast(
      key,
      key,
      duration,
      options?.onDismiss ? () => options.onDismiss?.(key as any) : undefined,
      options?.onAutoClose ? () => options.onAutoClose?.(key as any) : undefined
    );

    return sonnerToast.info(message, {
      id: key,
      duration,
      ...options,
      onDismiss: callbacks.onDismiss,
      onAutoClose: callbacks.onAutoClose,
    });
  },

  alert: (message: string, options?: NotifyOptions) => {
    const key = options?.dedupKey || `alert:${message}:${options?.description || ""}`;
    const active = activeToasts.get(key);
    if (active && Date.now() < active.expiresAt) {
      return active.id;
    }

    const duration = typeof options?.duration === "number" ? options.duration : 6000;
    soundService.play("alert");

    const callbacks = registerActiveToast(
      key,
      key,
      duration,
      options?.onDismiss ? () => options.onDismiss?.(key as any) : undefined,
      options?.onAutoClose ? () => options.onAutoClose?.(key as any) : undefined
    );

    return sonnerToast.error(message, {
      id: key,
      duration,
      ...options,
      onDismiss: callbacks.onDismiss,
      onAutoClose: callbacks.onAutoClose,
    });
  },

  dismiss: (toastId?: string | number) => {
    if (toastId !== undefined) {
      sonnerToast.dismiss(toastId);
      for (const [k, v] of activeToasts.entries()) {
        if (v.id === toastId) {
          if (v.timer) clearTimeout(v.timer);
          activeToasts.delete(k);
        }
      }
    } else {
      sonnerToast.dismiss();
      for (const entry of activeToasts.values()) {
        if (entry.timer) clearTimeout(entry.timer);
      }
      activeToasts.clear();
    }
  },

  clear: () => {
    sonnerToast.dismiss();
    for (const entry of activeToasts.values()) {
      if (entry.timer) clearTimeout(entry.timer);
    }
    activeToasts.clear();
  },

  promise: <T>(
    promise: Promise<T>,
    data: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: unknown) => string);
    }
  ) => {
    return sonnerToast.promise(promise, {
      ...data,
      success: (val) => {
        soundService.play("success");
        return typeof data.success === "function" ? data.success(val) : data.success;
      },
      error: (err) => {
        soundService.play("error");
        return typeof data.error === "function" ? data.error(err) : data.error;
      },
    });
  },

  /** Dismisses transient notifications on page navigation to prevent stale popups */
  onNavigate: () => {
    // Dismiss transient notifications, but keep critical error dialogs if any
    sonnerToast.dismiss();
    for (const entry of activeToasts.values()) {
      if (entry.timer) clearTimeout(entry.timer);
    }
    activeToasts.clear();
  },
};

export const toast = notify;
export default notify;
