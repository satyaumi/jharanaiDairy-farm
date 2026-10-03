import React, { useState } from "react";
import {
  Phone,
  Lock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { CowBrandLogo, CowIcon } from "@/components/common/CowBrandLogo";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginModal({ open, onOpenChange }: LoginModalProps) {
  const { login, verifyOtp } = useAuth();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState<string>("+91 98765 43210");
  const [otp, setOtp] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      toast.error("Please enter a valid phone number.");
      return;
    }
    setIsSubmitting(true);
    try {
      await login({ phoneOrEmail: phone });
      setStep("otp");
      toast.success(`OTP sent to ${phone}`, {
        description: "For demo, use default code: 1234",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 4) {
      toast.error("Please enter the 4-digit OTP.");
      return;
    }
    setIsSubmitting(true);
    try {
      await verifyOtp({ phone, otp });
      toast.success("Welcome back to Jharanai Farm!");
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-md overflow-y-auto rounded-3xl border-border/80 bg-background/95 p-5 sm:p-7">
        <DialogHeader className="flex flex-col items-center text-center pb-2">
          <div className="mx-auto mb-2">
            <CowBrandLogo size="lg" showText={false} />
          </div>
          <DialogTitle className="text-2xl font-extrabold text-foreground">
            {step === "phone" ? "Welcome, Farmer" : "Verify Phone OTP"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground max-w-xs mx-auto">
            {step === "phone"
              ? "Sign in to manage your dairy herd, milking records & farm stock"
              : `Enter the 4-digit code sent to ${phone}`}
          </DialogDescription>
        </DialogHeader>

        {step === "phone" ? (
          <form onSubmit={handleSendOtp} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                Mobile Number
              </label>
              <div className="relative mt-1.5">
                <Phone className="absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="h-13 rounded-2xl bg-background pl-11 text-base font-bold"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-13 w-full gap-2 rounded-2xl bg-emerald-600 text-base font-extrabold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 active:scale-95"
            >
              Send OTP Code <ArrowRight className="size-4" />
            </Button>

            <p className="text-center text-[11px] text-muted-foreground">
              Prepared for Spring Boot authentication · demo mode active
            </p>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                Enter 4-Digit OTP
              </label>
              <Input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="1 2 3 4"
                className="mt-1.5 h-14 rounded-2xl bg-background text-center text-2xl font-extrabold tracking-widest"
                required
                autoFocus
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-13 w-full gap-2 rounded-2xl bg-emerald-600 text-base font-extrabold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 active:scale-95"
            >
              Verify & Enter Farm <ShieldCheck className="size-5" />
            </Button>

            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => setStep("phone")}
                className="text-muted-foreground hover:text-foreground font-semibold"
              >
                Change Phone
              </button>
              <button
                type="button"
                onClick={() => toast.info("New OTP code: 1234")}
                className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline"
              >
                Resend Code
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
