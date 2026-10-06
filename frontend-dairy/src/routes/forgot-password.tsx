import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import React, { useState } from "react";
import {
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  ShieldCheck,
} from "lucide-react";
import { CowBrandLogo } from "@/components/common/CowBrandLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset Password | Jharanai Farm" },
      { name: "description", content: "Reset your Jharanai Farm account password." },
    ],
  }),
  component: ForgotPasswordPage,
});

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { sendResetOtp, resetPassword } = useAuth();

  const [step, setStep] = useState<"request" | "reset">("request");
  const [identifier, setIdentifier] = useState<string>("");
  const [otp, setOtp] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isResending, setIsResending] = useState<boolean>(false);
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // Cooldown timer effect
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCooldownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const clean = identifier.trim();
    if (!clean || clean.length < 4) {
      setErrorMessage("Please enter your registered phone number or email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await sendResetOtp(clean);
      setStep("reset");
      setCooldownSeconds(60);
      toast.success("Verification code dispatched!", {
        description: res.message || "A secure 6-digit code was sent to your registered email.",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to dispatch code. Please try again.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (cooldownSeconds > 0 || isResending) return;
    setIsResending(true);
    setErrorMessage(null);

    try {
      const res = await sendResetOtp(identifier.trim());
      setCooldownSeconds(60);
      toast.success("New verification code sent!", {
        description: res.message || "A fresh 6-digit code has been delivered to your email.",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to resend code.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsResending(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!otp.trim()) {
      setErrorMessage("Please enter the verification code.");
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please re-enter.");
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword({
        phoneOrEmail: identifier.trim(),
        otp: otp.trim(),
        newPassword,
      });

      setIsSuccess(true);
      toast.success("Password reset successfully!", {
        description: "You can now sign in with your new password.",
      });

      setTimeout(() => {
        navigate({ to: "/login" });
      }, 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to reset password. Please check your verification code.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center px-4 py-12">
        <div className="farm-glass-strong max-w-md w-full rounded-3xl border border-emerald-500/30 p-8 text-center shadow-2xl">
          <div className="mx-auto size-16 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-600 mb-4 animate-scale-in">
            <CheckCircle2 className="size-10" />
          </div>
          <h2 className="text-2xl font-extrabold text-foreground">
            Password Updated!
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your password has been changed securely. You are being redirected to sign in.
          </p>
          <div className="mt-6 flex justify-center items-center gap-2 text-xs text-muted-foreground font-semibold">
            <Loader2 className="size-4 animate-spin text-emerald-600" />
            <span>Redirecting to Sign In...</span>
          </div>
          <div className="mt-4">
            <Button
              onClick={() => navigate({ to: "/login" })}
              className="w-full h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              Sign In Now
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center px-4 py-8 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Soft Ambient Background */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl dark:bg-emerald-500/5" />
        <div className="absolute -right-24 top-20 h-80 w-80 rounded-full bg-sky-500/10 blur-3xl dark:bg-sky-500/5" />
        <div className="absolute -bottom-24 left-1/3 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl dark:bg-amber-500/5" />
      </div>

      <div className="relative mx-auto w-full max-w-md">
        {/* Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex justify-center mb-3">
            <CowBrandLogo size="lg" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {step === "request" ? "Forgot Password" : "Set New Password"}
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground">
            {step === "request"
              ? "Enter your mobile phone or email to receive a recovery code"
              : `Enter the code sent to ${identifier} and choose your new password`}
          </p>
        </div>

        {/* Card */}
        <div className="farm-glass-strong rounded-3xl border border-border/80 p-5 sm:p-8 shadow-2xl backdrop-blur-xl">
          {/* Error Banner */}
          {errorMessage && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs font-medium text-destructive animate-fade-in"
            >
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          {step === "request" ? (
            <form onSubmit={handleRequestOtp} className="space-y-4" noValidate>
              <div>
                <label
                  htmlFor="reset-identifier"
                  className="block text-xs font-bold text-foreground mb-1.5"
                >
                  Phone Number or Email Address <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="reset-identifier"
                    name="identifier"
                    type="text"
                    placeholder="e.g. +91 98765 43210 or email"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    className="h-12 rounded-2xl bg-background/80 pl-10 text-sm font-semibold"
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  We'll send a 4-digit verification code to verify your identity.
                </p>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition-all active:scale-[0.99] gap-2 mt-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Sending Code...</span>
                  </>
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4" noValidate>
              {/* Verification Code */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="reset-otp"
                    className="block text-xs font-bold text-foreground"
                  >
                    6-Digit Verification Code <span className="text-destructive">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={cooldownSeconds > 0 || isResending}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors"
                  >
                    {isResending ? (
                      <span className="flex items-center gap-1">
                        <Loader2 className="size-3 animate-spin" /> Sending...
                      </span>
                    ) : cooldownSeconds > 0 ? (
                      `Resend in ${cooldownSeconds}s`
                    ) : (
                      "Resend Code"
                    )}
                  </button>
                </div>
                <Input
                  id="reset-otp"
                  name="otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Enter 6-digit code (e.g. 582914)"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                  required
                  className="h-12 rounded-2xl bg-background/80 text-center text-lg font-bold tracking-widest"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Check your inbox for the verification code dispatched via Resend.
                </p>
              </div>

              {/* New Password */}
              <div>
                <label
                  htmlFor="new-reset-password"
                  className="block text-xs font-bold text-foreground mb-1.5"
                >
                  New Password <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="new-reset-password"
                    name="newPassword"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="h-12 rounded-2xl bg-background/80 pl-10 pr-11 text-sm font-semibold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="confirm-reset-password"
                  className="block text-xs font-bold text-foreground mb-1.5"
                >
                  Confirm New Password <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="confirm-reset-password"
                    name="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="h-12 rounded-2xl bg-background/80 pl-10 text-sm font-semibold"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep("request")}
                  className="flex-1 h-12 rounded-2xl border-border"
                >
                  <ArrowLeft className="size-4 mr-1" />
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-[2] h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/25"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin mr-1" />
                      Resetting Password...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* Footer: Back to Login */}
        <div className="text-center mt-6">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 hover:underline"
          >
            <ArrowLeft className="size-3.5" />
            <span>Return to Sign In</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
