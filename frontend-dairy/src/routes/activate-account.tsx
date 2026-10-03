import { createFileRoute, useNavigate } from "@tanstack/react-router";
import React, { useState, useEffect } from "react";
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Check,
  Sparkles,
} from "lucide-react";
import { CowBrandLogo } from "@/components/common/CowBrandLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { userService } from "@/services/user-service";
import type { InvitationInfo } from "@/types/team";
import { toast } from "sonner";

interface SearchParams {
  token?: string;
}

export const Route = createFileRoute("/activate-account")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    token: typeof search.token === "string" ? search.token : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Activate Account | Jharanai Farm" },
      { name: "description", content: "Activate your invited Jharanai Farm account and set your password." },
    ],
  }),
  component: ActivateAccountPage,
});

export function ActivateAccountPage() {
  const { token } = Route.useSearch();
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(true);
  const [invitation, setInvitation] = useState<InvitationInfo | null>(null);
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setInvitation({ valid: false, message: "Missing invitation token in activation link." });
      return;
    }

    userService
      .getInvitationInfo(token)
      .then((info) => {
        setInvitation(info);
      })
      .catch((err) => {
        setInvitation({
          valid: false,
          message: err instanceof Error ? err.message : "Failed to verify invitation.",
        });
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  // Password strength calculator
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: "Empty", color: "bg-muted" };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { score: 1, label: "Weak", color: "bg-destructive" };
    if (score <= 2) return { score: 2, label: "Fair", color: "bg-amber-500" };
    if (score <= 3) return { score: 3, label: "Good", color: "bg-sky-500" };
    return { score: 4, label: "Strong", color: "bg-emerald-500" };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!token) {
      setErrorMessage("No activation token found.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please verify.");
      return;
    }

    setIsSubmitting(true);
    try {
      await userService.activateAccount(token, password);
      setIsSuccess(true);
      toast.success("Account activated successfully!", {
        description: "You can now sign in with your phone or email.",
      });

      setTimeout(() => {
        navigate({ to: "/login" });
      }, 2500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to activate account.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center px-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-8 animate-spin text-emerald-600" />
          <p className="text-sm font-semibold text-muted-foreground">
            Verifying your invitation link...
          </p>
        </div>
      </div>
    );
  }

  if (!invitation?.valid) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center px-4 py-12">
        <div className="farm-glass-strong max-w-md w-full rounded-3xl border border-destructive/30 p-8 text-center shadow-2xl">
          <div className="mx-auto size-14 rounded-full bg-destructive/15 flex items-center justify-center text-destructive mb-4">
            <AlertCircle className="size-8" />
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-foreground">
            Invalid or Expired Link
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
            {invitation?.message || "This invitation link is invalid or has expired."}
          </p>
          <div className="mt-6">
            <Button
              onClick={() => navigate({ to: "/login" })}
              className="w-full h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              Back to Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center px-4 py-12">
        <div className="farm-glass-strong max-w-md w-full rounded-3xl border border-emerald-500/30 p-8 text-center shadow-2xl">
          <div className="mx-auto size-16 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-600 mb-4 animate-scale-in">
            <CheckCircle2 className="size-10" />
          </div>
          <h2 className="text-2xl font-extrabold text-foreground">
            Account Activated!
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Welcome to Jharanai Farm, <span className="font-bold text-foreground">{invitation.name}</span>. Your password has been configured securely.
          </p>
          <div className="mt-6 flex justify-center items-center gap-2 text-xs text-muted-foreground font-semibold">
            <Loader2 className="size-4 animate-spin text-emerald-600" />
            <span>Redirecting you to sign in...</span>
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
      {/* Background Glow */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -right-24 top-20 h-80 w-80 rounded-full bg-sky-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-md sm:max-w-lg">
        {/* Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex justify-center mb-3">
            <CowBrandLogo size="lg" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Activate Your Account
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Set your secure password to complete your profile setup
          </p>
        </div>

        {/* Card */}
        <div className="farm-glass-strong rounded-3xl border border-border/80 p-5 sm:p-8 shadow-2xl backdrop-blur-xl">
          {/* Member Details Summary Badge */}
          <div className="mb-5 rounded-2xl border border-emerald-500/30 bg-emerald-50/60 p-4 dark:bg-emerald-950/40">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground">Invitation for</p>
                <p className="text-base font-extrabold text-foreground">{invitation.name}</p>
                {invitation.username && (
                  <p className="text-[11px] font-medium text-muted-foreground">
                    Username: <span className="font-mono text-foreground font-semibold">{invitation.username}</span>
                  </p>
                )}
              </div>
              <span className="rounded-full bg-emerald-600 text-white px-2.5 py-1 text-[10px] font-extrabold">
                {invitation.role}
              </span>
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs font-medium text-destructive"
            >
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* New Password */}
            <div>
              <label
                htmlFor="activate-password"
                className="block text-xs font-bold text-foreground mb-1.5"
              >
                Create Password <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="activate-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 rounded-2xl bg-background/80 pl-10 pr-11 text-sm font-semibold"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 transition-colors"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>

              {/* Password Strength */}
              {password.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1 h-1.5">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`flex-1 rounded-full transition-all duration-300 ${
                          step <= strength.score ? strength.color : "bg-muted"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between text-[10px] font-semibold text-muted-foreground">
                    <span>Strength: {strength.label}</span>
                    <span>Min 6 characters</span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="activate-confirm-password"
                className="block text-xs font-bold text-foreground mb-1.5"
              >
                Confirm Password <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="activate-confirm-password"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="h-12 rounded-2xl bg-background/80 pl-10 text-sm font-semibold"
                />
              </div>
              {confirmPassword.length > 0 && confirmPassword !== password && (
                <p className="mt-1 text-[11px] font-medium text-destructive">
                  Passwords do not match
                </p>
              )}
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition-all active:scale-[0.99] gap-2 mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Activating Profile...</span>
                </>
              ) : (
                <>
                  <span>Activate & Sign In</span>
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
