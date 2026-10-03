import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import React, { useState, useEffect } from "react";
import {
  User as UserIcon,
  Phone,
  Mail,
  Building2,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Check,
} from "lucide-react";
import { CowBrandLogo } from "@/components/common/CowBrandLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import type { Role } from "@/types/auth";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Join Jharanai Farm | Registration" },
      { name: "description", content: "Register an account to access Jharanai Farm dairy operations." },
    ],
  }),
  component: SignupPage,
});

export function SignupPage() {
  const navigate = useNavigate();
  const { signup, isAuthenticated, isLoading } = useAuth();

  const [fullName, setFullName] = useState<string>("");
  const [countryCode, setCountryCode] = useState<string>("+91");
  const [phoneDigits, setPhoneDigits] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [farmName] = useState<string>("Jharanai Farm");
  const [role, setRole] = useState<Role>("WORKER");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate({ to: "/" });
    }
  }, [isAuthenticated, isLoading, navigate]);

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

    if (!fullName.trim() || fullName.trim().length < 2) {
      setErrorMessage("Please enter your full legal name.");
      return;
    }

    const cleanDigits = phoneDigits.replace(/[^0-9]/g, "");
    if (cleanDigits.length < 8) {
      setErrorMessage("Please enter a valid phone number (at least 8 digits).");
      return;
    }
    const fullPhone = `${countryCode} ${cleanDigits}`;

    if (email && (!email.includes("@") || !email.includes("."))) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (!farmName.trim()) {
      setErrorMessage("Please enter your dairy farm name.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please re-enter.");
      return;
    }

    setIsSubmitting(true);
    try {
      await signup({
        name: fullName.trim(),
        phone: fullPhone,
        email: email.trim() || undefined,
        farmName: farmName.trim(),
        password,
        role,
      });

      setIsSuccess(true);
      toast.success("Account created successfully!", {
        description: "Your dairy farm has been registered. Please sign in.",
      });

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate({ to: "/login" });
      }, 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create account. Please try again.";
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
            Account Created!
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Welcome to Jharanai Farm, <span className="font-bold text-foreground">{fullName}</span>. Your account is ready.
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
      {/* Soft Ambient Farm Background Elements */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl dark:bg-emerald-500/5" />
        <div className="absolute -right-24 top-20 h-80 w-80 rounded-full bg-sky-500/10 blur-3xl dark:bg-sky-500/5" />
        <div className="absolute -bottom-24 left-1/3 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl dark:bg-amber-500/5" />
      </div>

      <div className="relative mx-auto w-full max-w-md sm:max-w-lg">
        {/* Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex justify-center mb-3">
            <CowBrandLogo size="lg" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Join Jharanai Farm
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground">
            Create an account to digitize your cows, milking & stock
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

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Full Name */}
            <div>
              <label
                htmlFor="signup-name"
                className="block text-xs font-bold text-foreground mb-1.5"
              >
                Full Name <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="signup-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="e.g. Ramesh Patel"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="h-12 rounded-2xl bg-background/80 pl-10 text-sm font-semibold"
                />
              </div>
            </div>

            {/* Mobile Phone */}
            <div>
              <label
                htmlFor="signup-phone"
                className="block text-xs font-bold text-foreground mb-1.5"
              >
                Mobile Phone <span className="text-destructive">*</span>
              </label>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  aria-label="Country Code"
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
                    id="signup-phone"
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

            {/* Email (Optional) */}
            <div>
              <label
                htmlFor="signup-email"
                className="block text-xs font-bold text-foreground mb-1.5"
              >
                Email Address <span className="text-muted-foreground text-[10px] font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="signup-email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="ramesh@greenpastures.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 rounded-2xl bg-background/80 pl-10 text-sm font-semibold"
                />
              </div>
            </div>

            {/* Dairy Farm Organization (Single-farm architecture) */}
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                Dairy Farm Assignment
              </label>
              <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-50/50 p-3 dark:bg-emerald-950/30">
                <div className="grid size-9 place-items-center rounded-xl bg-emerald-600 text-white font-extrabold text-xs shadow-sm">
                  JHF
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-extrabold text-foreground truncate">
                      Jharanai Farm
                    </p>
                    <span className="rounded-full bg-emerald-600 text-white px-2 py-0.5 text-[9px] font-bold">
                      Official
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Connected Production Dairy
                  </p>
                </div>
              </div>
            </div>

            {/* Account Role Notice */}
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                Account Access
              </label>
              <div className="rounded-2xl border border-emerald-600/30 bg-background/60 p-3 text-foreground">
                <div className="flex items-center justify-between text-xs font-extrabold text-emerald-800 dark:text-emerald-300">
                  <span>Farm Worker Profile</span>
                  <Check className="size-3.5 text-emerald-600" />
                </div>
                <p className="text-[10px] mt-1 text-muted-foreground">
                  Grants operational access for daily milking, herd entries & feeding records.
                </p>
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">
                * Note: Farm Owner & Management Team roles are provisioned by invitation.
              </p>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="new-password"
                className="block text-xs font-bold text-foreground mb-1.5"
              >
                Password <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="new-password"
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

              {/* Password Strength Indicator */}
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
                htmlFor="confirm-password"
                className="block text-xs font-bold text-foreground mb-1.5"
              >
                Confirm Password <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="confirm-password"
                  name="confirm-password"
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

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition-all active:scale-[0.99] gap-2 mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Registering Farm...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Footer: Signin Link */}
        <div className="text-center mt-6">
          <p className="text-xs text-muted-foreground font-medium">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-extrabold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 hover:underline"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
