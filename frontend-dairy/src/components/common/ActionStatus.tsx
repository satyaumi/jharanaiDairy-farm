import React from "react";
import { Loader2, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";

export type ActionStatusType = "idle" | "submitting" | "pending" | "success" | "error";

export interface ActionStatusState {
  status: ActionStatusType;
  message?: string;
  details?: string;
}

export function useActionStatus(initialStatus: ActionStatusType = "idle") {
  const [state, setState] = React.useState<ActionStatusState>({
    status: initialStatus,
  });

  const setIdle = React.useCallback(() => {
    setState({ status: "idle" });
  }, []);

  const setSubmitting = React.useCallback((message: string = "Submitting...") => {
    setState({ status: "submitting", message });
  }, []);

  const setPending = React.useCallback((message: string = "Processing operation...") => {
    setState({ status: "pending", message });
  }, []);

  const setSuccess = React.useCallback((message: string = "Operation completed successfully", autoResetMs?: number) => {
    setState({ status: "success", message });
    if (autoResetMs && autoResetMs > 0) {
      setTimeout(() => {
        setState((curr) => (curr.status === "success" ? { status: "idle" } : curr));
      }, autoResetMs);
    }
  }, []);

  const setError = React.useCallback((message: string = "Operation failed", details?: string) => {
    setState({ status: "error", message, details });
  }, []);

  const execute = React.useCallback(
    async <T,>(
      actionFn: () => Promise<T>,
      options?: {
        submittingMessage?: string;
        successMessage?: string | ((result: T) => string);
        errorMessage?: string | ((err: unknown) => string);
        autoResetMs?: number;
        onSuccess?: (result: T) => void;
        onError?: (err: unknown) => void;
      }
    ): Promise<T | null> => {
      setState({
        status: "submitting",
        message: options?.submittingMessage || "Saving...",
      });
      try {
        const result = await actionFn();
        const successMsg =
          typeof options?.successMessage === "function"
            ? options.successMessage(result)
            : options?.successMessage || "Changes saved successfully";

        setState({
          status: "success",
          message: successMsg,
        });

        if (options?.onSuccess) {
          options.onSuccess(result);
        }

        if (options?.autoResetMs && options.autoResetMs > 0) {
          setTimeout(() => {
            setState((curr) => (curr.status === "success" ? { status: "idle" } : curr));
          }, options.autoResetMs);
        }

        return result;
      } catch (err: unknown) {
        const defaultMsg =
          err instanceof Error
            ? err.message
            : typeof err === "object" && err && "message" in err
            ? String((err as { message: unknown }).message)
            : "An unexpected error occurred. Please try again.";

        const errorMsg =
          typeof options?.errorMessage === "function"
            ? options.errorMessage(err)
            : options?.errorMessage || defaultMsg;

        setState({
          status: "error",
          message: errorMsg,
          details: err instanceof Error ? err.stack : undefined,
        });

        if (options?.onError) {
          options.onError(err);
        }

        return null;
      }
    },
    []
  );

  return {
    ...state,
    isIdle: state.status === "idle",
    isSubmitting: state.status === "submitting",
    isPending: state.status === "pending",
    isSuccess: state.status === "success",
    isError: state.status === "error",
    setIdle,
    setSubmitting,
    setPending,
    setSuccess,
    setError,
    execute,
    reset: setIdle,
  };
}

export interface ActionSubmitButtonProps extends ButtonProps {
  status: ActionStatusType;
  submittingText?: string;
  pendingText?: string;
  successText?: string;
  errorText?: string;
  idleText?: React.ReactNode;
  icon?: React.ReactNode;
}

export const ActionSubmitButton: React.FC<ActionSubmitButtonProps> = ({
  status,
  submittingText = "Saving...",
  pendingText = "Processing...",
  successText = "Saved Successfully",
  errorText = "Failed · Tap to Retry",
  idleText,
  icon,
  children,
  className = "",
  disabled,
  ...props
}) => {
  const isBusy = status === "submitting" || status === "pending";

  let statusBgAndTextColor = "";
  let content: React.ReactNode = null;

  switch (status) {
    case "submitting":
      statusBgAndTextColor = "bg-amber-600 hover:bg-amber-600 text-white cursor-wait";
      content = (
        <span className="flex items-center justify-center gap-2">
          <Loader2 className="size-4 animate-spin shrink-0" />
          <span>{submittingText}</span>
        </span>
      );
      break;
    case "pending":
      statusBgAndTextColor = "bg-amber-500 hover:bg-amber-600 text-white";
      content = (
        <span className="flex items-center justify-center gap-2">
          <Clock className="size-4 animate-pulse shrink-0" />
          <span>{pendingText}</span>
        </span>
      );
      break;
    case "success":
      statusBgAndTextColor = "bg-emerald-600 hover:bg-emerald-700 text-white";
      content = (
        <span className="flex items-center justify-center gap-2">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>{successText}</span>
        </span>
      );
      break;
    case "error":
      statusBgAndTextColor = "bg-rose-600 hover:bg-rose-700 text-white";
      content = (
        <span className="flex items-center justify-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          <span>{errorText}</span>
        </span>
      );
      break;
    case "idle":
    default:
      content = (
        <span className="flex items-center justify-center gap-2">
          {icon}
          <span>{children || idleText}</span>
        </span>
      );
      break;
  }

  return (
    <Button
      disabled={disabled || isBusy}
      className={`transition-all duration-200 font-bold active:scale-[0.98] ${statusBgAndTextColor} ${className}`}
      {...props}
    >
      {content}
    </Button>
  );
};

export interface ActionInlineFeedbackProps {
  status: ActionStatusType;
  message?: string;
  details?: string;
  className?: string;
}

export const ActionInlineFeedback: React.FC<ActionInlineFeedbackProps> = ({
  status,
  message,
  details,
  className = "",
}) => {
  if (status === "idle" || (!message && !details)) {
    return null;
  }

  let colorClasses = "";
  let IconComponent = Loader2;
  let defaultMsg = "";

  switch (status) {
    case "submitting":
      colorClasses = "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200";
      IconComponent = Loader2;
      defaultMsg = "Saving changes to database...";
      break;
    case "pending":
      colorClasses = "border-amber-500/50 bg-amber-500/15 text-amber-900 dark:text-amber-200";
      IconComponent = Clock;
      defaultMsg = "Operation submitted and processing...";
      break;
    case "success":
      colorClasses = "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200";
      IconComponent = CheckCircle2;
      defaultMsg = "Operation completed successfully.";
      break;
    case "error":
      colorClasses = "border-rose-500/40 bg-rose-500/10 text-rose-800 dark:text-rose-200";
      IconComponent = AlertCircle;
      defaultMsg = "Operation failed. Please review fields and retry.";
      break;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-start gap-2.5 rounded-xl border p-3 text-xs transition-all duration-200 ${colorClasses} ${className}`}
    >
      <IconComponent
        className={`size-4 shrink-0 mt-0.5 ${status === "submitting" ? "animate-spin" : ""}`}
      />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{message || defaultMsg}</p>
        {details && <p className="mt-1 text-[11px] opacity-80 break-words">{details}</p>}
      </div>
    </div>
  );
};
