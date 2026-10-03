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
  Milk,
  HeartPulse,
  Sparkles,
} from "lucide-react";
import { CowBrandLogo, CowIcon } from "@/components/common/CowBrandLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { DEMO_CREDENTIALS } from "@/services/auth-service";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign In | Jharanai Farm" },
      { name: "description", content: "Sign in to your Jharanai Farm dairy management account." },
    ],
  }),
  component: LoginPage,
});

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading } = useAuth();

  const [authMode, setAuthMode] = useState<"phone" | "email">("phone");
  const [countryCode, setCountryCode] = useState<string>("+91");
  const [phoneDigits, setPhoneDigits] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate({ to: "/" });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    let identifier = "";
    if (authMode === "phone") {
      const cleanDigits = phoneDigits.replace(/[^0-9]/g, "");
      if (cleanDigits.length < 8) {
        setErrorMessage("Please enter a valid phone number (at least 8 digits).");
        return;
      }
      identifier = `${countryCode} ${cleanDigits}`;
    } else {
      if (!email || !email.includes("@")) {
        setErrorMessage("Please enter a valid email address.");
        return;
      }
      identifier = email.trim();
    }

    if (!password || password.length < 4) {
      setErrorMessage("Please enter your password.");
      return;
    }

    setIsSubmitting(true);
    try {
      await login({
        phoneOrEmail: identifier,
        password,
        rememberMe,
      });
      toast.success("Welcome back!", {
        description: "Successfully signed in to your farm dashboard.",
      });
      navigate({ to: "/" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to sign in. Please verify your credentials.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick 1-click credential filler for fast review & role testing
  const handleQuickFill = (role: "OWNER" | "MANAGER" | "WORKER") => {
    const cred = DEMO_CREDENTIALS[role];
    if (cred.phoneOrEmail.startsWith("+")) {
      setAuthMode("phone");
      const parts = cred.phoneOrEmail.split(" ");
      setCountryCode(parts[0] || "+91");
      setPhoneDigits(parts.slice(1).join(""));
    } else {
      setAuthMode("email");
      setEmail(cred.phoneOrEmail);
    }
    setPassword(cred.password || "password123");
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center px-4 py-8 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Soft Ambient Farm Background Elements */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl dark:bg-emerald-500/5" />
        <div className="absolute -right-24 top-20 h-80 w-80 rounded-full bg-sky-500/10 blur-3xl dark:bg-sky-500/5" />
        <div className="absolute -bottom-24 left-1/3 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl dark:bg-amber-500/5" />
      </div>

      <div className="relative mx-auto w-full max-w-md sm:max-w-lg">
        {/* Farm Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex justify-center mb-3">
            <CowBrandLogo size="lg" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Welcome to Jharanai Farm
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground">
            Sign in to manage your dairy herd, daily milk & farm operations
          </p>
        </div>

        {/* Main Card */}
        <div className="farm-glass-strong rounded-3xl border border-border/80 p-5 sm:p-8 shadow-2xl backdrop-blur-xl">
          {/* Auth Mode Toggle (Phone / Email) */}
          <div className="grid grid-cols-2 gap-1.5 rounded-2xl bg-secondary/60 p-1 mb-5">
            <button
              type="button"
              onClick={() => {
                setAuthMode("phone");
                setErrorMessage(null);
              }}
              className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all ${
                authMode === "phone"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Phone className="size-3.5" />
              <span>Login with Phone</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode("email");
                setErrorMessage(null);
              }}
              className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all ${
                authMode === "email"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Mail className="size-3.5" />
              <span>Login with Email</span>
            </button>
          </div>

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

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {authMode === "phone" ? (
              <div>
                <label
                  htmlFor="phone-input"
                  className="block text-xs font-bold text-foreground mb-1.5"
                >
                  Mobile Number <span className="text-destructive">*</span>
                </label>
                <div className="flex gap-2">
                  {/* Country Code Picker */}
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    aria-label="Country calling code"
                    className="h-12 rounded-2xl border border-input bg-background/80 px-2.5 text-xs font-bold text-foreground focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                  >
                    <option value="+91">🇮🇳 +91</option>
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+44">🇬🇧 +44</option>
                    <option value="+61">🇦🇺 +61</option>
                    <option value="+971">🇦🇪 +971</option>
                    <option value="+254">🇰🇪 +254</option>
                  </select>

                  <div className="relative flex-1">
                    <Phone className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="phone-input"
                      name="tel"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel-national"
                      placeholder="98765 43210"
                      value={phoneDigits}
                      onChange={(e) => setPhoneDigits(e.target.value)}
                      required
                      className="h-12 rounded-2xl bg-background/80 pl-10 text-sm font-semibold tracking-wide"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <label
                  htmlFor="email-input"
                  className="block text-xs font-bold text-foreground mb-1.5"
                >
                  Email Address <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email-input"
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="username"
                    placeholder="farmer@jharanai.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 rounded-2xl bg-background/80 pl-10 text-sm font-semibold"
                  />
                </div>
              </div>
            )}

            {/* Password Field with Show/Hide Toggle */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="current-password"
                  className="block text-xs font-bold text-foreground"
                >
                  Password <span className="text-destructive">*</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="current-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
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
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-2 pt-1">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="size-4 rounded border-border accent-emerald-600 focus:ring-emerald-500"
              />
              <label
                htmlFor="remember-me"
                className="text-xs font-semibold text-muted-foreground select-none cursor-pointer"
              >
                Keep me signed in on this device
              </label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition-all active:scale-[0.99] gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </form>

          {/* Quick Demo Role Selector for pair programming & testing */}
          <div className="mt-6 pt-5 border-t border-border/60">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground text-center mb-2.5">
              Quick Test Credentials (Pre-seeded DB)
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill("OWNER")}
                className="group flex flex-col items-center justify-center p-2 rounded-xl bg-secondary/50 hover:bg-emerald-500/10 hover:border-emerald-500/30 border border-transparent transition-all text-center"
              >
                <span className="text-[11px] font-extrabold text-foreground group-hover:text-emerald-600">
                  Farm Owner
                </span>
                <span className="text-[10px] text-muted-foreground truncate w-full">Priya (Owner)</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill("MANAGER")}
                className="group flex flex-col items-center justify-center p-2 rounded-xl bg-secondary/50 hover:bg-sky-500/10 hover:border-sky-500/30 border border-transparent transition-all text-center"
              >
                <span className="text-[11px] font-extrabold text-foreground group-hover:text-sky-600">
                  Manager
                </span>
                <span className="text-[10px] text-muted-foreground truncate w-full">Rajesh</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill("WORKER")}
                className="group flex flex-col items-center justify-center p-2 rounded-xl bg-secondary/50 hover:bg-amber-500/10 hover:border-amber-500/30 border border-transparent transition-all text-center"
              >
                <span className="text-[11px] font-extrabold text-foreground group-hover:text-amber-600">
                  Worker
                </span>
                <span className="text-[10px] text-muted-foreground truncate w-full">Suresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer: Signup Link */}
        <div className="text-center mt-6">
          <p className="text-xs text-muted-foreground font-medium">
            New team member or staff?{" "}
            <Link
              to="/signup"
              className="font-extrabold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 hover:underline"
            >
              Join Jharanai Farm Staff
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
