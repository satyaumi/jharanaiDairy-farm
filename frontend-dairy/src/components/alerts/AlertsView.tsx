import React from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FarmAlert } from "@/types/farm";

interface AlertsViewProps {
  alerts: FarmAlert[];
  onNavigateModule: (moduleId: string) => void;
  onDismissAlert?: (id: string) => void;
}

export function AlertsView({
  alerts,
  onNavigateModule,
  onDismissAlert,
}: AlertsViewProps) {
  const urgentAlerts = alerts.filter((a) => a.level === "Urgent");
  const todayAlerts = alerts.filter((a) => a.level === "Today");
  const upcomingAlerts = alerts.filter((a) => a.level === "Upcoming");

  const getAlertIcon = (category: FarmAlert["category"]) => {
    switch (category) {
      case "health":
        return HeartPulse;
      case "breeding":
        return Calendar;
      case "vaccination":
        return ShieldCheck;
      case "stock":
        return Package;
      default:
        return AlertTriangle;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-destructive/10 text-destructive">
              <Bell className="size-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-foreground">
              Farm Alerts & Daily Follow-ups
            </h1>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Critical health notices, calving dates & vaccination schedules
          </p>
        </div>

        <span className="rounded-full bg-destructive/10 px-3 py-1 text-xs font-extrabold text-destructive">
          {urgentAlerts.length} Urgent Action
        </span>
      </div>

      {/* 1. Urgent Items Banner (Needs immediate attention) */}
      {urgentAlerts.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-destructive flex items-center gap-1.5">
            <AlertTriangle className="size-3.5" /> Immediate Farm Follow-up
          </p>
          <div className="space-y-2">
            {urgentAlerts.map((item) => {
              const Icon = getAlertIcon(item.category);
              return (
                <div
                  key={item.id}
                  className="flex flex-col gap-2 rounded-2xl border border-destructive/40 bg-destructive/5 p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-destructive/15 text-destructive mt-0.5">
                        <Icon className="size-5" />
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-extrabold text-foreground">
                            {item.title}
                          </p>
                          <span className="rounded-full bg-destructive px-2 py-0.2 text-[9px] font-extrabold text-white">
                            Urgent
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-foreground/80 leading-relaxed">
                          {item.subtitle}
                        </p>
                        <p className="mt-1 text-[11px] font-semibold text-muted-foreground">
                          {item.date}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-destructive/20">
                    <Button
                      size="sm"
                      onClick={() => onNavigateModule(item.targetModule)}
                      className="h-9 gap-1.5 rounded-xl bg-destructive text-white hover:bg-destructive/90 text-xs font-bold"
                    >
                      Open {item.targetModule} record <ArrowRight className="size-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Today's Reminders (Calving, low stock, health inspects) */}
      <div className="space-y-2 pt-2">
        <p className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
          Today's Scheduled Tasks
        </p>
        <div className="space-y-2">
          {todayAlerts.map((item) => {
            const Icon = getAlertIcon(item.category);
            return (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card/60 p-3.5 hover:bg-card transition-all"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-500/15 text-amber-800 dark:text-amber-300 mt-0.5">
                    <Icon className="size-4.5" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs sm:text-sm font-bold text-foreground truncate">
                        {item.title}
                      </p>
                      <span className="rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 px-2 py-0.2 text-[9px] font-extrabold">
                        Today
                      </span>
                    </div>
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                      {item.subtitle}
                    </p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigateModule(item.targetModule)}
                  className="h-9 shrink-0 rounded-xl text-xs font-bold"
                >
                  View
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Upcoming Schedule (Vaccinations, vet visits) */}
      <div className="space-y-2 pt-2">
        <p className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
          Upcoming Schedule (Next 7 Days)
        </p>
        <div className="space-y-2">
          {upcomingAlerts.map((item) => {
            const Icon = getAlertIcon(item.category);
            return (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card/40 p-3.5"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-teal-500/15 text-teal-800 dark:text-teal-300 mt-0.5">
                    <Icon className="size-4.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-foreground">
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {item.subtitle}
                    </p>
                    <p className="mt-1 text-[11px] font-semibold text-muted-foreground/80">
                      {item.date}
                    </p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigateModule(item.targetModule)}
                  className="h-9 shrink-0 rounded-xl text-xs font-bold text-primary"
                >
                  Details <ChevronRight className="size-4" />
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
