import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import React, { useState, useEffect } from "react";
import {
  User as UserIcon,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
} from "lucide-react";
import { CowBrandLogo } from "@/components/common/CowBrandLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { authService } from "@/services/auth-service";
import { notify } from "@/lib/notify";

export const Route = createFileRoute("/setup-manager")({
  head: () => ({
    meta: [
      { title: "Initial Management Setup | Jharanaai Farm" },
      { name: "description", content: "One-time bootstrap for first Management account." },
    ],
  }),
  component: SetupManagerPage,
});

export function SetupManagerPage() {
  const navigate = useNavigate();
  const { setupInitialManager, isAuthenticated } = useAuth();

  const [loadingStatus, setLoadingStatus] = useState<boolean>(true);
  const [setupAvailable, setSetupAvailable] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>("");

  const [fullName, setFullName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [mobile, setMobile] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [setupToken, setSetupToken] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: "/" });
      return;
    }

    async function checkStatus() {
      try {
        const res = await authService.getSetupStatus();
        setSetupAvailable(res.managementSetupAvailable);
        setStatusMessage(res.message);
      } catch {
        setSetupAvailable(false);
        setStatusMessage("Failed to connect to setup service.");
      } finally {
        setLoadingStatus(false);
      }
    }

    checkStatus();
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim() || !email.trim() || !mobile.trim()) {
      setErrorMessage("Please fill in all required fields.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      await setupInitialManager({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        mobile: mobile.trim(),
        password,
        setupToken: setupToken.trim() || undefined,
      });

      notify.success("Management Initialized", {
        description: `Welcome ${fullName}! Your management account has been created.`,
      });
      navigate({ to: "/" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to set up initial management account.";
      setErrorMessage(msg);
      notify.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingStatus) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="size-8 animate-spin text-emerald-600" />
          <p className="text-xs font-bold text-muted-foreground">Checking setup status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex justify-center mb-2">
            <CowBrandLogo size="lg" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            Jharanaai Farm
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Initial Management Account Setup
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm">
          {!setupAvailable ? (
            <div className="text-center space-y-4 py-4">
              <div className="grid size-12 place-items-center rounded-2xl bg-amber-500/15 text-amber-600 mx-auto">
                <ShieldCheck className="size-6" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-foreground">
                  Setup Already Initialized
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {statusMessage || "A Management account has already been registered for this farm. To prevent unauthorized access, the initial setup flow is now disabled."}
                </p>
              </div>
              <div className="pt-2">
                <Link to="/login">
                  <Button className="w-full h-11 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs gap-2">
                    <span>Go to Farm Login</span>
                    <ArrowRight className="size-4" />
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/30 p-3 text-xs text-emerald-800 dark:text-emerald-300">
                <div className="flex items-center gap-1.5 font-bold mb-0.5">
                  <ShieldCheck className="size-4" />
                  <span>One-Time Management Bootstrap</span>
                </div>
                <p className="text-[11px] opacity-90">
                  Create the first Management user. Once saved, this setup option will lock permanently.
                </p>
              </div>

              {errorMessage && (
                <div className="rounded-2xl border border-rose-500/30 bg-rose-50/60 dark:bg-rose-950/40 p-3 text-xs text-rose-700 dark:text-rose-300 font-semibold">
                  {errorMessage}
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">
                  Manager Full Name *
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    required
                    placeholder="e.g. Priyabrata Mohapatra"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-9 h-11 rounded-2xl border-border bg-background text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">
                  Manager Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    type="email"
                    required
                    placeholder="manager@jharanaai.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 h-11 rounded-2xl border-border bg-background text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">
                  Mobile Number *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="pl-9 h-11 rounded-2xl border-border bg-background text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">
                  Password (min 6 characters) *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Create secure password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-9 h-11 rounded-2xl border-border bg-background text-xs font-semibold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-9 h-11 rounded-2xl border-border bg-background text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">
                  Deployment Setup Secret (Optional)
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="If configured in INITIAL_SETUP_TOKEN"
                    value={setupToken}
                    onChange={(e) => setSetupToken(e.target.value)}
                    className="pl-9 h-11 rounded-2xl border-border bg-background text-xs font-semibold"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs shadow-md shadow-emerald-700/20 gap-2 mt-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Creating Management Account...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-4" />
                    <span>Initialize Management Account</span>
                  </>
                )}
              </Button>
            </form>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-bold text-emerald-700 dark:text-emerald-400 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
