import { toast, type ExternalToast } from "sonner";

interface NotifyOptions extends ExternalToast {
  /** Optional custom deduplication key or timeout */
  dedupKey?: string;
  dedupMs?: number;
}

// Track recently displayed messages to prevent duplicate spam or rapid-fire overrides
const recentNotifications = new Map<string, number>();
const DEFAULT_DEDUP_WINDOW_MS = 1500;

function shouldDeduplicate(key: string, windowMs = DEFAULT_DEDUP_WINDOW_MS): boolean {
  const now = Date.now();
  const lastTime = recentNotifications.get(key);
  if (lastTime && now - lastTime < windowMs) {
    return true;
  }
  recentNotifications.set(key, now);
  // Clean up old keys periodically
  if (recentNotifications.size > 100) {
    for (const [k, time] of recentNotifications.entries()) {
      if (now - time > 10000) {
        recentNotifications.delete(k);
      }
    }
  }
  return false;
}

export const notify = {
  success: (message: string, options?: NotifyOptions) => {
    const key = options?.dedupKey || `success:${message}:${options?.description || ""}`;
    if (shouldDeduplicate(key, options?.dedupMs)) {
      return;
    }
    return toast.success(message, {
      duration: 3500,
      ...options,
    });
  },

  error: (message: string, options?: NotifyOptions) => {
    const key = options?.dedupKey || `error:${message}:${options?.description || ""}`;
    if (shouldDeduplicate(key, options?.dedupMs ?? 2000)) {
      return;
    }
    return toast.error(message, {
      duration: 5500, // Longer duration for errors to ensure readability
      ...options,
    });
  },

  warning: (message: string, options?: NotifyOptions) => {
    const key = options?.dedupKey || `warning:${message}:${options?.description || ""}`;
    if (shouldDeduplicate(key, options?.dedupMs)) {
      return;
    }
    return toast.warning(message, {
      duration: 4500,
      ...options,
    });
  },

  info: (message: string, options?: NotifyOptions) => {
    const key = options?.dedupKey || `info:${message}:${options?.description || ""}`;
    if (shouldDeduplicate(key, options?.dedupMs)) {
      return;
    }
    return toast.info(message, {
      duration: 4000,
      ...options,
    });
  },

  dismiss: (toastId?: string | number) => {
    if (toastId !== undefined) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  },

  clear: () => {
    toast.dismiss();
    recentNotifications.clear();
  },

  promise: <T>(
    promise: Promise<T>,
    data: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: unknown) => string);
    }
  ) => {
    return toast.promise(promise, data);
  },
};

export default notify;
