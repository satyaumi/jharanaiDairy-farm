import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import React, { useState, useEffect } from "react";
import {
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  Crown,
  Briefcase,
  UserCheck,
  RefreshCw,
  KeyRound,
} from "lucide-react";
import { CowBrandLogo, CowIcon } from "@/components/common/CowBrandLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { DEMO_CREDENTIALS } from "@/services/auth-service";
import type { Role } from "@/types/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Secure Sign In | Jharanai Farm" },
      {
        name: "description",
        content: "Secure role-based sign in and OTP verification for Jharanai Farm dairy management.",
      },
    ],
  }),
  component: LoginPage,
});

export function LoginPage() {
  const navigate = useNavigate();
  const { login, sendLoginOtp, loginWithOtp, isAuthenticated, isLoading, isRestoringSession } = useAuth();

  // Role Flow Selection (Owner, Management, Worker)
  const [selectedRole, setSelectedRole] = useState<Role>("OWNER");
  const [authMethod, setAuthMethod] = useState<"otp" | "password">("otp");

  // Identification & Credentials
  const [identifier, setIdentifier] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [otpCode, setOtpCode] = useState<string>("");

  // OTP State Machine
  const [otpStep, setOtpStep] = useState<"input_id" | "enter_otp">("input_id");
  const [dispatchedEmail, setDispatchedEmail] = useState<string>("");
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);

  // Status
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (!isRestoringSession && isAuthenticated) {
      navigate({ to: "/" });
    }
  }, [isAuthenticated, isRestoringSession, navigate]);

  // Cooldown timer effect
  useEffect(() => {
    if (cooldownSeconds > 0) {
      const timer = setTimeout(() => setCooldownSeconds((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownSeconds]);

  // Clean, non-flickering session restoration screen
  if (isRestoringSession) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
        <CowBrandLogo size="lg" />
        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground font-semibold">
          <Loader2 className="size-4 animate-spin text-emerald-600" />
          <span>Restoring farm session...</span>
        </div>
      </div>
    );
  }

  // Smooth redirect view if user is already authenticated
  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
        <CowBrandLogo size="lg" />
        <div className="mt-4 flex items-center gap-2 text-xs text-emerald-600 font-semibold">
          <ShieldCheck className="size-4" />
          <span>Authenticated! Taking you to your dashboard...</span>
        </div>
      </div>
    );
  }

  // 1. Send Login OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    const cleanId = identifier.trim();
    if (!cleanId) {
      setErrorMessage("Please enter your registered email address or mobile number.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await sendLoginOtp(cleanId, selectedRole);
      setDispatchedEmail(res.email || cleanId);
      setOtpStep("enter_otp");
      setCooldownSeconds(60);
      if (res.sandboxOtp) {
        setOtpCode(res.sandboxOtp);
        toast.info(`Verification Code: ${res.sandboxOtp}`, {
          description: "Delivered to admin email satyamlkinf@gmail.com and pre-filled for testing.",
          duration: 12000,
        });
      } else {
        toast.success("Verification Code Dispatched", {
          description: res.message || "A 6-digit code was sent to your verified contact method.",
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to dispatch verification code.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Verify OTP & Establish Authenticated Session
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanOtp = otpCode.trim();
    if (cleanOtp.length < 4) {
      setErrorMessage("Please enter the complete 6-digit verification code.");
      return;
    }

    setIsSubmitting(true);
    try {
      await loginWithOtp(identifier.trim(), cleanOtp, selectedRole);
      toast.success("Session Verified", {
        description: "Authenticated with verified role permissions.",
      });
      navigate({ to: "/" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid or expired verification code.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Password Login
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanId = identifier.trim();
    if (!cleanId) {
      setErrorMessage("Please enter your registered email or phone number.");
      return;
    }

    if (!password || password.length < 4) {
      setErrorMessage("Please enter your password.");
      return;
    }

    setIsSubmitting(true);
    try {
      await login({
        phoneOrEmail: cleanId,
        password,
      });
      toast.success("Welcome back!", {
        description: "Successfully signed in to your farm dashboard.",
      });
      navigate({ to: "/" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to sign in. Please check your credentials.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick 1-click test helper
  const handleQuickFill = (role: Role) => {
    setSelectedRole(role);
    const cred = DEMO_CREDENTIALS[role];
    setIdentifier(cred.phoneOrEmail);
    setPassword(cred.password || "password123");
    setErrorMessage(null);
    setOtpStep("input_id");
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center px-4 py-8 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Ambient Backdrop */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl dark:bg-emerald-500/5" />
        <div className="absolute -right-24 top-20 h-80 w-80 rounded-full bg-teal-500/10 blur-3xl dark:bg-teal-500/5" />
        <div className="absolute -bottom-24 left-1/3 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl dark:bg-cyan-500/5" />
      </div>

      <div className="relative mx-auto w-full max-w-md sm:max-w-lg">
        {/* Brand Header */}
        <div className="text-center mb-5">
          <div className="inline-flex justify-center mb-2">
            <CowBrandLogo size="lg" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Jharanai Farm
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Secure Role-Based Authentication & Operations Portal
          </p>
        </div>

        {/* Main Card */}
        <div className="farm-glass-strong rounded-3xl border border-border/80 p-5 sm:p-7 shadow-2xl backdrop-blur-xl">
          {/* STEP 1: PREDEFINED ROLE SELECTION */}
          <div className="space-y-2 mb-5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                Step 1: Select Your Assigned Role Flow
              </label>
              <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                Verified by Database
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {/* Owner */}
              <button
                type="button"
                onClick={() => {
                  setSelectedRole("OWNER");
                  setOtpStep("input_id");
                  setErrorMessage(null);
                }}
                className={`flex flex-col items-center justify-center rounded-2xl border p-2.5 sm:p-3 text-center transition-all ${
                  selectedRole === "OWNER"
                    ? "border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/30 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200"
                    : "border-border/70 bg-card/60 hover:bg-card text-muted-foreground"
                }`}
              >
                <Crown className={`size-5 mb-1 ${selectedRole === "OWNER" ? "text-emerald-600" : "text-muted-foreground"}`} />
                <span className="text-xs font-black">Owner</span>
                <span className="text-[9px] text-muted-foreground">Full Access</span>
              </button>

              {/* Management */}
              <button
                type="button"
                onClick={() => {
                  setSelectedRole("MANAGER");
                  setOtpStep("input_id");
                  setErrorMessage(null);
                }}
                className={`flex flex-col items-center justify-center rounded-2xl border p-2.5 sm:p-3 text-center transition-all ${
                  selectedRole === "MANAGER"
                    ? "border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/30 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200"
                    : "border-border/70 bg-card/60 hover:bg-card text-muted-foreground"
                }`}
              >
                <Briefcase className={`size-5 mb-1 ${selectedRole === "MANAGER" ? "text-emerald-600" : "text-muted-foreground"}`} />
                <span className="text-xs font-black">Management</span>
                <span className="text-[9px] text-muted-foreground">Herds & Team</span>
              </button>

              {/* Worker */}
              <button
                type="button"
                onClick={() => {
                  setSelectedRole("WORKER");
                  setOtpStep("input_id");
                  setErrorMessage(null);
                }}
                className={`flex flex-col items-center justify-center rounded-2xl border p-2.5 sm:p-3 text-center transition-all ${
                  selectedRole === "WORKER"
                    ? "border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/30 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200"
                    : "border-border/70 bg-card/60 hover:bg-card text-muted-foreground"
                }`}
              >
                <UserCheck className={`size-5 mb-1 ${selectedRole === "WORKER" ? "text-emerald-600" : "text-muted-foreground"}`} />
                <span className="text-xs font-black">Worker</span>
                <span className="text-[9px] text-muted-foreground">Daily Operations</span>
              </button>
            </div>

            <p className="text-[10px] text-muted-foreground leading-tight px-1">
              Selecting a role does not grant privileges. The backend securely checks and enforces your account's verified permissions.
            </p>
          </div>

          {/* AUTH METHOD TOGGLE: OTP vs PASSWORD */}
          <div className="grid grid-cols-2 gap-1.5 rounded-2xl bg-secondary/60 p-1 mb-4">
            <button
              type="button"
              onClick={() => {
                setAuthMethod("otp");
                setErrorMessage(null);
              }}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all ${
                authMethod === "otp"
                  ? "bg-background text-foreground shadow-xs font-black"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <KeyRound className="size-3.5" />
              <span>Email OTP (Secure)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMethod("password");
                setErrorMessage(null);
              }}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all ${
                authMethod === "password"
                  ? "bg-background text-foreground shadow-xs font-black"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Lock className="size-3.5" />
              <span>Password Login</span>
            </button>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div
              role="alert"
              className="mb-4 flex items-start gap-2.5 rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-xs font-medium text-destructive animate-fade-in"
            >
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          {/* METHOD A: SECURE OTP AUTHENTICATION */}
          {authMethod === "otp" && (
            <div>
              {otpStep === "input_id" ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-foreground">
                      Step 2: Enter Registered Email or Mobile
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input
                        type="text"
                        value={identifier}
                        onChange={(e) => {
                          setIdentifier(e.target.value);
                          setErrorMessage(null);
                        }}
                        placeholder="e.g. priya@jharanai.com or +91 98765 43210"
                        className="pl-10 h-11 rounded-2xl border-border bg-background/80 text-sm font-medium"
                        autoComplete="username"
                        required
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      A single-use verification code will be dispatched to your registered address via Resend.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-11 rounded-2xl text-xs sm:text-sm font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/30 transition-all active:scale-[0.98]"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="size-4 animate-spin mr-2" />
                        <span>Dispatching Verification Code...</span>
                      </>
                    ) : (
                      <>
                        <span>Send 6-Digit Code</span>
                        <ArrowRight className="size-4 ml-2" />
                      </>
                    )}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4 animate-fade-in">
                  <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-950/20 p-3 space-y-1 text-xs">
                    <div className="flex items-center gap-1.5 font-black text-emerald-800 dark:text-emerald-300">
                      <CheckCircle2 className="size-4" />
                      <span>Code Dispatched</span>
                    </div>
                    <p className="text-muted-foreground text-[11px]">
                      Enter the 6-digit code sent to <strong className="text-foreground">{dispatchedEmail}</strong>.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-foreground">
                      Step 3: Enter 6-Digit Verification Code
                    </label>
                    <Input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => {
                        setOtpCode(e.target.value.replace(/[^0-9]/g, ""));
                        setErrorMessage(null);
                      }}
                      placeholder="• • • • • •"
                      className="h-12 text-center tracking-[0.5em] text-lg font-black rounded-2xl border-border bg-background/80"
                      autoFocus
                      required
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => setOtpStep("input_id")}
                      className="text-muted-foreground hover:text-foreground font-semibold"
                    >
                      Change Contact
                    </button>

                    <button
                      type="button"
                      disabled={cooldownSeconds > 0 || isSubmitting}
                      onClick={() => handleSendOtp()}
                      className="text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 font-black disabled:opacity-50"
                    >
                      {cooldownSeconds > 0 ? `Resend code in ${cooldownSeconds}s` : "Resend Code"}
                    </button>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting || otpCode.length < 4}
                    className="w-full h-11 rounded-2xl text-xs sm:text-sm font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/30 transition-all active:scale-[0.98]"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="size-4 animate-spin mr-2" />
                        <span>Verifying Session...</span>
                      </>
                    ) : (
                      <>
                        <span>Verify & Enter Farm</span>
                        <ArrowRight className="size-4 ml-2" />
                      </>
                    )}
                  </Button>
                </form>
              )}
            </div>
          )}

          {/* METHOD B: PASSWORD LOGIN */}
          {authMethod === "password" && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-foreground">
                  Email Address or Mobile Number
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    type="text"
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      setErrorMessage(null);
                    }}
                    placeholder="priya@jharanai.com or +91 98765 43210"
                    className="pl-10 h-11 rounded-2xl border-border bg-background/80 text-sm font-medium"
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-foreground">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-[11px] font-bold text-emerald-700 hover:underline dark:text-emerald-400"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrorMessage(null);
                    }}
                    placeholder="Enter password"
                    className="pl-10 pr-10 h-11 rounded-2xl border-border bg-background/80 text-sm font-medium"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 rounded-2xl text-xs sm:text-sm font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/30 transition-all active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-2" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign in with Password</span>
                    <ArrowRight className="size-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
          )}

          {/* Quick-fill helper for reviewer testing */}
          <div className="mt-5 border-t border-border/60 pt-4">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground mb-2 text-center">
              Quick Test Credentials (Pre-seeded Accounts)
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickFill("OWNER")}
                className="h-8 rounded-xl text-[10px] font-bold border-border"
              >
                Priya (Owner)
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickFill("MANAGER")}
                className="h-8 rounded-xl text-[10px] font-bold border-border"
              >
                Rajesh (Manager)
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickFill("WORKER")}
                className="h-8 rounded-xl text-[10px] font-bold border-border"
              >
                Suresh (Worker)
              </Button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Need account invitation or password reset?{" "}
          <Link to="/forgot-password" className="font-bold text-emerald-700 dark:text-emerald-400 hover:underline">
            Reset access
          </Link>
        </p>
      </div>
    </div>
  );
}
