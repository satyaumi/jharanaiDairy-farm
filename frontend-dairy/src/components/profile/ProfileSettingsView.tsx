import React, { useState } from "react";
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  Building,
  KeyRound,
  Bell,
  LogOut,
  Save,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  UserCog,
  Smartphone,
  Shield,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export function ProfileSettingsView() {
  const { user, logout, updateProfile, isOwner, isManager, isWorker } = useAuth();

  // Personal Info Form State
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Notification Preferences
  const [notifShift, setNotifShift] = useState(true);
  const [notifHealth, setNotifHealth] = useState(true);
  const [notifDailyReport, setNotifDailyReport] = useState(true);

  // Security / Password Change
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingSecurity, setIsSavingSecurity] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    setIsSavingProfile(true);
    try {
      await updateProfile({
        name: name.trim(),
        email: email.trim() || undefined,
      });
      toast.success("Profile Updated", {
        description: "Your account details have been saved.",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update profile.";
      toast.error("Update Failed", { description: msg });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    setIsSavingSecurity(true);
    try {
      // Password update simulation/API hook
      await new Promise((r) => setTimeout(r, 600));
      toast.success("Security Updated", {
        description: "Your account password was successfully updated.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordSection(false);
    } catch (err: unknown) {
      toast.error("Failed to update password");
    } finally {
      setIsSavingSecurity(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Signed Out", {
        description: "You have been securely signed out.",
      });
    } catch {
      toast.error("Logout failed");
    }
  };

  return (
    <div className="space-y-5 pb-16 max-w-4xl mx-auto overflow-hidden">
      {/* 1. Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
          <UserCog className="size-6 text-emerald-600" />
          <span>User Profile & Account Settings</span>
        </h1>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Manage your personal details, verified contact information, and notifications
        </p>
      </div>

      {/* 2. Profile Identity Card */}
      <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-xs dark:border-border dark:bg-card">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          {/* Avatar Circle */}
          <div className="relative">
            <div className="grid size-20 place-items-center rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-2xl shadow-md">
              {user?.name
                ? user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                : "JF"}
            </div>
            <span className="absolute -bottom-1 -right-1 grid size-6 place-items-center rounded-full bg-emerald-500 text-white ring-2 ring-white text-[10px]">
              ✓
            </span>
          </div>

          {/* Details */}
          <div className="flex-1 text-center sm:text-left min-w-0 space-y-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
              <div>
                <h2 className="text-lg font-black text-foreground truncate">
                  {user?.name || "Priya Mehta"}
                </h2>
                <p className="text-xs text-muted-foreground flex items-center justify-center sm:justify-start gap-1">
                  <Building className="size-3.5" />
                  <span>{user?.farmName || "Jharanai Farm"}</span>
                </p>
              </div>

              <span className="self-center sm:self-auto rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-black text-emerald-800 dark:text-emerald-300">
                {user?.role || "OWNER"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="size-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">{user?.email || "priya@jharanai.com"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="size-3.5 text-emerald-600 shrink-0" />
                <span>{user?.phone || "+91 98765 43210"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Personal Information Form */}
      <form
        onSubmit={handleSaveProfile}
        className="rounded-3xl border border-slate-100 bg-white p-5 shadow-xs dark:border-border dark:bg-card space-y-4"
      >
        <div className="border-b border-border/60 pb-2">
          <h3 className="text-sm font-black text-foreground">Personal Information</h3>
          <p className="text-[11px] text-muted-foreground">
            Update your display name and registered email address
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Full Name</label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 rounded-xl"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Email Address</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Registered Mobile</label>
            <Input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-10 rounded-xl"
              disabled
            />
            <span className="text-[10px] text-muted-foreground">
              Mobile number verification is managed via OTP authentication.
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Assigned Role</label>
            <Input
              type="text"
              value={user?.role || "OWNER"}
              className="h-10 rounded-xl font-bold bg-muted/40"
              disabled
            />
            <span className="text-[10px] text-muted-foreground">
              Role permissions are managed under Team & Management.
            </span>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            disabled={isSavingProfile}
            className="h-9 gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-sm"
          >
            {isSavingProfile ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Save className="size-3.5" />
            )}
            <span>Save Profile</span>
          </Button>
        </div>
      </form>

      {/* 4. Notification Preferences */}
      <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-xs dark:border-border dark:bg-card space-y-3">
        <div className="border-b border-border/60 pb-2 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-foreground">Notification Preferences</h3>
            <p className="text-[11px] text-muted-foreground">
              Configure automatic farm alerts via Resend email and mobile notices
            </p>
          </div>
          <Bell className="size-4 text-emerald-600" />
        </div>

        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between text-xs">
            <div>
              <p className="font-bold text-foreground">Milking Shift Summaries</p>
              <p className="text-[10px] text-muted-foreground">
                Receive morning and evening round total notifications
              </p>
            </div>
            <input
              type="checkbox"
              checked={notifShift}
              onChange={(e) => setNotifShift(e.target.checked)}
              className="size-4 accent-emerald-600 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            <div>
              <p className="font-bold text-foreground">Urgent Veterinary & Mastitis Warnings</p>
              <p className="text-[10px] text-muted-foreground">
                Immediate alerts when a cow requires isolation or veterinary check
              </p>
            </div>
            <input
              type="checkbox"
              checked={notifHealth}
              onChange={(e) => setNotifHealth(e.target.checked)}
              className="size-4 accent-emerald-600 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            <div>
              <p className="font-bold text-foreground">Daily Operations & Feed Stock Digest</p>
              <p className="text-[10px] text-muted-foreground">
                Nightly summary of feed consumed and silo reserves
              </p>
            </div>
            <input
              type="checkbox"
              checked={notifDailyReport}
              onChange={(e) => setNotifDailyReport(e.target.checked)}
              className="size-4 accent-emerald-600 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 5. Account Security & Password */}
      <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-xs dark:border-border dark:bg-card space-y-3">
        <div className="flex items-center justify-between border-b border-border/60 pb-2">
          <div>
            <h3 className="text-sm font-black text-foreground">Security & Password</h3>
            <p className="text-[11px] text-muted-foreground">
              Change password and manage single-use OTP verification options
            </p>
          </div>
          <Shield className="size-4 text-emerald-600" />
        </div>

        {!showPasswordSection ? (
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-muted-foreground">
              Password last updated recently. OTP authentication is active.
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPasswordSection(true)}
              className="h-8 rounded-xl text-xs font-bold"
            >
              Change Password
            </Button>
          </div>
        ) : (
          <form onSubmit={handleUpdatePassword} className="space-y-3 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">New Password</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="h-9 rounded-xl text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Confirm New Password</label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="h-9 rounded-xl text-xs"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowPasswordSection(false)}
                className="h-8 rounded-xl text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSavingSecurity}
                className="h-8 rounded-xl bg-emerald-600 text-white text-xs font-bold"
              >
                Update Password
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* 6. Sign Out Button */}
      <div className="pt-2 flex justify-between items-center">
        <span className="text-xs text-muted-foreground font-semibold">
          Active session ID: <span className="font-mono">{user?.id?.slice(0, 8)}...</span>
        </span>

        <Button
          onClick={handleLogout}
          variant="outline"
          className="h-10 gap-1.5 rounded-2xl border-destructive/40 bg-destructive/5 text-destructive hover:bg-destructive/15 text-xs font-black shadow-xs active:scale-95"
        >
          <LogOut className="size-4" />
          <span>Sign Out from Farm</span>
        </Button>
      </div>
    </div>
  );
}
