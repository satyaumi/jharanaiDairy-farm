import React, { useState, useEffect } from "react";
import {
  User as UserIcon,
  Shield,
  Phone,
  Mail,
  Home,
  LogOut,
  Globe,
  CheckCircle2,
  Lock,
  Edit2,
  Save,
  Loader2,
  Sparkles,
} from "lucide-react";
import { CowIcon } from "@/components/common/CowBrandLogo";
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
import { useNavigate } from "@tanstack/react-router";

interface ProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileModal({ open, onOpenChange }: ProfileModalProps) {
  const navigate = useNavigate();
  const { user, updateProfile, logout } = useAuth();

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("English");

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name cannot be empty.");
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile({
        name: name.trim(),
        email: email.trim() || undefined,
      });
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      onOpenChange(false);
      toast.info("Logged out from farm session");
      navigate({ to: "/login" });
    } catch {
      navigate({ to: "/login" });
    }
  };

  const ROLE_DETAILS = {
    OWNER: {
      label: "Farm Owner",
      color: "border-emerald-600 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
      description: "Full administrative ownership, farm financial metrics, team & herd management.",
    },
    MANAGER: {
      label: "Farm Manager",
      color: "border-sky-600 bg-sky-500/10 text-sky-800 dark:text-sky-300",
      description: "Daily herd operations, milk production audits, health inspections & rations.",
    },
    WORKER: {
      label: "Farm Worker",
      color: "border-amber-600 bg-amber-500/10 text-amber-800 dark:text-amber-300",
      description: "Daily milking log entry, animal health checklists, feeding records.",
    },
    ADMIN: {
      label: "System Administrator",
      color: "border-purple-600 bg-purple-500/10 text-purple-800 dark:text-purple-300",
      description: "System administration & backend configuration.",
    },
  };

  const currentRoleInfo = ROLE_DETAILS[user?.role || "OWNER"];

  const LANGUAGES = [
    { code: "en", name: "English (Default)" },
    { code: "hi", name: "हिन्दी (Hindi)" },
    { code: "mr", name: "मराठी (Marathi)" },
    { code: "pa", name: "ਪੰਜਾਬੀ (Punjabi)" },
    { code: "gu", name: "ગુજરાતી (Gujarati)" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-lg overflow-y-auto rounded-3xl border-border/80 bg-background/95 p-4 sm:p-6 shadow-2xl">
        <DialogHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid size-12 place-items-center rounded-2xl bg-emerald-600/15 text-emerald-800 dark:text-emerald-300 font-extrabold text-base border border-emerald-600/20">
                {user?.name
                  ? user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                  : "PM"}
              </div>
              <div>
                <DialogTitle className="text-xl font-extrabold text-foreground">
                  {user?.name || "Farmer Profile"}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {user?.farmName || "Jharanai Farm"}
                </DialogDescription>
              </div>
            </div>

            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="h-9 rounded-xl border-border text-xs font-bold gap-1.5"
              >
                <Edit2 className="size-3.5" />
                <span>Edit</span>
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {isEditing ? (
            <form onSubmit={handleSaveProfile} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Full Name
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Your Full Name"
                  className="h-11 rounded-xl bg-background text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Email Address
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@dairyfarm.com"
                  className="h-11 rounded-xl bg-background text-sm font-semibold"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 h-10 rounded-xl text-xs font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="size-3.5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-2xl border border-border/60 bg-card/60 p-3">
                <span className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                  <Phone className="size-3 text-muted-foreground" /> Phone Number
                </span>
                <p className="mt-1 font-bold text-foreground truncate">
                  {user?.phone || "Not set"}
                </p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-card/60 p-3">
                <span className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                  <Mail className="size-3 text-muted-foreground" /> Email
                </span>
                <p className="mt-1 font-bold text-foreground truncate">
                  {user?.email || "None added"}
                </p>
              </div>
            </div>
          )}

          {/* Role Status (Verified by Backend) */}
          <div className="rounded-2xl border border-border/70 bg-card/40 p-3.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Shield className="size-3.5 text-emerald-600" /> Verified Role
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase border ${currentRoleInfo.color}`}
              >
                {currentRoleInfo.label}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {currentRoleInfo.description}
            </p>
            <p className="text-[10px] text-muted-foreground/75 mt-2 italic">
              * Role assignments are managed securely by farm administration and cannot be altered locally.
            </p>
          </div>

          {/* Regional Language Support */}
          <div className="border-t border-border/60 pt-3">
            <div className="flex items-center gap-1.5 pb-2">
              <Globe className="size-4 text-muted-foreground" />
              <p className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                Display Language
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    setSelectedLanguage(lang.name);
                    toast.success(`Language set to ${lang.name}`);
                  }}
                  className={`rounded-xl border p-2 text-xs font-semibold transition-all ${
                    selectedLanguage === lang.name
                      ? "border-emerald-600 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 font-bold"
                      : "border-border/60 bg-background/60 hover:bg-background text-foreground/80"
                  }`}
                >
                  {lang.name}
                </button>
              ))}
            </div>
          </div>

          {/* Logout Button */}
          <div className="pt-2">
            <Button
              variant="outline"
              onClick={handleLogout}
              className="h-12 w-full gap-2 rounded-2xl border-destructive/30 text-destructive hover:bg-destructive/10 text-xs font-bold"
            >
              <LogOut className="size-4" />
              <span>Log Out of Farm Session</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
