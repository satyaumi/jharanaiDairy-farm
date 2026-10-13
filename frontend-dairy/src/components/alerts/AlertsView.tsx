import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  Bell,
  Calendar,
  HeartPulse,
  Package,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  Plus,
  Loader2,
  Send,
  Eye,
  Check,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { farmService } from "@/services/farm-service";
import { notify } from "@/lib/notify";
import type { FarmAlert } from "@/types/farm";

interface AlertsViewProps {
  alerts?: FarmAlert[];
  onNavigateModule: (moduleId: string) => void;
  onDismissAlert?: (id: string) => void;
}

export function AlertsView({
  alerts: initialAlerts = [],
  onNavigateModule,
}: AlertsViewProps) {
  const { user, isManager, isOwner, isWorker } = useAuth();
  const canCreateAlert = isManager || user?.role === "ADMIN";

  const [alertsList, setAlertsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<"ALL" | "UNREAD" | "CRITICAL">("ALL");

  // Create alert modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("GENERAL");
  const [severity, setSeverity] = useState("NORMAL");
  const [targetRole, setTargetRole] = useState("ALL");
  const [cowNumber, setCowNumber] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const data = await farmService.getAlerts();
      if (Array.isArray(data) && data.length > 0) {
        setAlertsList(data);
      } else {
        setAlertsList(initialAlerts);
      }
    } catch {
      setAlertsList(initialAlerts);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const handleMarkAsRead = async (alertId: string) => {
    try {
      const ok = await farmService.markAlertAsRead(alertId);
      if (ok) {
        setAlertsList((prev) =>
          prev.map((a) => (a.id === alertId ? { ...a, read: true } : a))
        );
        notify.success("Alert marked as read");
      }
    } catch {
      notify.error("Failed to mark alert as read");
    }
  };

  const handleCreateAlertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      notify.error("Title and message are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await farmService.createAlert({
        title: title.trim(),
        message: message.trim(),
        category,
        severity,
        targetRole,
        cowNumber: cowNumber.trim() || undefined,
        dueDate: dueDate || undefined,
      });

      notify.success("Farm Alert Created & Dispatched", {
        description: `Alert delivered to ${targetRole === "ALL" ? "All Roles" : targetRole}.`,
      });

      setTitle("");
      setMessage("");
      setCategory("GENERAL");
      setSeverity("NORMAL");
      setTargetRole("ALL");
      setCowNumber("");
      setDueDate("");
      setCreateModalOpen(false);

      await loadAlerts();
    } catch (err: any) {
      notify.error(err.message || "Failed to create alert.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter alerts
  const filteredAlerts = alertsList.filter((a) => {
    if (filterTab === "UNREAD") {
      return a.read === false || a.isRead === false;
    }
    if (filterTab === "CRITICAL") {
      return a.severity === "CRITICAL" || a.level === "Urgent";
    }
    return true;
  });

  const unreadCount = alertsList.filter((a) => a.read === false || a.isRead === false).length;
  const criticalCount = alertsList.filter((a) => a.severity === "CRITICAL" || a.level === "Urgent").length;

  return (
    <div className="space-y-4 pb-12">
      {/* Header & Create Alert Button */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-destructive/10 text-destructive">
              <Bell className="size-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-foreground">
              {isOwner ? "Executive Farm Alerts" : isWorker ? "Assigned Operational Alerts" : "Farm Alerts & Role Messaging"}
            </h1>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {isOwner
              ? "Critical business notices, low-stock flags & executive farm updates"
              : isWorker
              ? "Herd instructions, clinical checks & daily shift alerts"
              : "Role-targeted farm broadcasts, cow alerts & operational notifications"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canCreateAlert && (
            <Button
              onClick={() => setCreateModalOpen(true)}
              className="h-10 gap-2 rounded-2xl bg-destructive hover:bg-destructive/90 text-white font-black text-xs shadow-md active:scale-95"
            >
              <Plus className="size-4 stroke-[2.5]" />
              Create Farm Alert (ଆଲର୍ଟ ଜାରି)
            </Button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-border/60 pb-2">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setFilterTab("ALL")}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
              filterTab === "ALL"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            All Alerts ({alertsList.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab("UNREAD")}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
              filterTab === "UNREAD"
                ? "bg-amber-600 text-white shadow-xs"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            Unread ({unreadCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab("CRITICAL")}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
              filterTab === "CRITICAL"
                ? "bg-destructive text-white shadow-xs"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            Critical ({criticalCount})
          </button>
        </div>

        {loading && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground animate-pulse">
            <Loader2 className="size-3.5 animate-spin" />
            <span>Syncing alerts...</span>
          </div>
        )}
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center bg-card/40">
            <CheckCircle2 className="mx-auto size-8 text-emerald-600 mb-2" />
            <p className="text-sm font-bold text-foreground">No alerts in this category</p>
            <p className="text-xs text-muted-foreground mt-1">
              Your farm notifications are completely up to date.
            </p>
          </div>
        ) : (
          filteredAlerts.map((item) => {
            const isCritical = item.severity === "CRITICAL" || item.level === "Urgent";
            const isImportant = item.severity === "IMPORTANT" || item.level === "Today";
            const isRead = item.read === true || item.isRead === true;

            return (
              <div
                key={item.id}
                className={`flex flex-col gap-3 rounded-2xl border p-4 transition-all shadow-xs ${
                  isCritical
                    ? "border-destructive/40 bg-destructive/5 dark:bg-destructive/10"
                    : isImportant
                    ? "border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20"
                    : "border-border/70 bg-card hover:border-border"
                } ${!isRead ? "ring-1 ring-primary/30" : "opacity-90"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <span
                      className={`grid size-10 shrink-0 place-items-center rounded-xl mt-0.5 ${
                        isCritical
                          ? "bg-destructive/15 text-destructive"
                          : isImportant
                          ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                          : "bg-primary/10 text-primary"
                      }`}
                    >
                      {isCritical ? (
                        <AlertTriangle className="size-5" />
                      ) : (
                        <Bell className="size-5" />
                      )}
                    </span>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className={`text-sm ${!isRead ? "font-black" : "font-bold"} text-foreground`}>
                          {item.title}
                        </p>

                        {/* Severity Badge */}
                        <span
                          className={`rounded-full px-2 py-0.5 text-[9px] font-black ${
                            isCritical
                              ? "bg-destructive text-white"
                              : isImportant
                              ? "bg-amber-500/20 text-amber-800 dark:text-amber-200"
                              : "bg-secondary text-secondary-foreground"
                          }`}
                        >
                          {item.severity || item.level || "Normal"}
                        </span>

                        {/* Cow Tag Badge */}
                        {item.cowNumber && (
                          <span className="rounded-full bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 text-[9px] font-black">
                            Cow #{item.cowNumber}
                          </span>
                        )}

                        {/* Target Role Badge */}
                        {item.targetRole && item.targetRole !== "ALL" && (
                          <span className="rounded-full bg-indigo-500/15 text-indigo-800 dark:text-indigo-300 px-2 py-0.5 text-[9px] font-black">
                            For {item.targetRole}
                          </span>
                        )}

                        {!isRead && (
                          <span className="size-2 rounded-full bg-primary" title="Unread" />
                        )}
                      </div>

                      <p className="mt-1 text-xs text-foreground/80 leading-relaxed">
                        {item.message || item.subtitle}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                        {item.dueDate && (
                          <span className="flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-300">
                            <Calendar className="size-3" /> Due: {item.dueDate}
                          </span>
                        )}
                        {item.createdByName && (
                          <span>By: {item.createdByName}</span>
                        )}
                        {item.createdAt && (
                          <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {!isRead && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkAsRead(item.id)}
                        className="h-8 rounded-xl text-xs font-bold gap-1"
                        title="Mark as Read"
                      >
                        <Check className="size-3.5" />
                        <span className="hidden sm:inline">Mark Read</span>
                      </Button>
                    )}

                    {item.targetModule && (
                      <Button
                        size="sm"
                        onClick={() => onNavigateModule(item.targetModule)}
                        className="h-8 rounded-xl text-xs font-bold gap-1"
                      >
                        <span>View</span>
                        <ArrowRight className="size-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Alert Modal (Management / Admin only) */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-background p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-xl bg-destructive/15 text-destructive">
                  <AlertTriangle className="size-4" />
                </span>
                <h2 className="text-base sm:text-lg font-black text-foreground">
                  Create & Dispatch Farm Alert
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAlertSubmit} className="space-y-3.5 pt-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">
                  Alert Title (ଶୀର୍ଷକ) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cow #104 Mastitis Screening Required"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">
                  Alert Message / Instructions (ବିବରଣୀ) *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Detailed instructions for the target workers or management..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background p-3 text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1">
                    Category (ବର୍ଗ)
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs font-bold"
                  >
                    <option value="ANIMAL_HEALTH">Animal Health (ସ୍ୱାସ୍ଥ୍ୟ)</option>
                    <option value="PREGNANCY">Pregnancy (ଗର୍ଭଧାରଣ)</option>
                    <option value="CALVING">Calving (ପ୍ରସବ)</option>
                    <option value="MILK_PRODUCTION">Milk Production (ଦୁଗ୍ଧ)</option>
                    <option value="FEED_AND_STOCK">Feed & Stock (ଖାଦ୍ୟ/ଷ୍ଟକ୍)</option>
                    <option value="FARM_OPERATIONS">Farm Operations</option>
                    <option value="WORKER_NOTICE">Worker Notice (କର୍ମଚାରୀ)</option>
                    <option value="OWNER_NOTICE">Owner Notice (ମାଲିକ)</option>
                    <option value="GENERAL">General Alert</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1">
                    Severity (ଗୁରୁତ୍ୱ)
                  </label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs font-bold"
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="IMPORTANT">Important (ଗୁରୁତ୍ୱପୂର୍ଣ୍ଣ)</option>
                    <option value="CRITICAL">Critical (ଜରୁରୀ - Red)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1">
                    Target Recipient Role (ପ୍ରାପକ)
                  </label>
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs font-bold"
                  >
                    <option value="ALL">All Farm Roles (ସମସ୍ତେ)</option>
                    <option value="WORKER">Workers Only (କର୍ମଚାରୀ)</option>
                    <option value="MANAGER">Management Only (ମ୍ୟାନେଜର)</option>
                    <option value="OWNER">Owner Only (ମାଲିକ)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1">
                    Cow Number (if applicable)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 104 or COW-02"
                    value={cowNumber}
                    onChange={(e) => setCowNumber(e.target.value)}
                    className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs font-bold"
                  >
                  </input>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">
                  Due / Follow-up Date (ତାରିଖ)
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateModalOpen(false)}
                  className="flex-1 rounded-xl text-xs font-bold h-10"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 rounded-xl bg-destructive hover:bg-destructive/90 text-white font-bold text-xs h-10 gap-1.5"
                >
                  {isSubmitting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                  Dispatch Alert
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
