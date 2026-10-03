import React from "react";
import {
  House,
  Milk,
  BarChart3,
  HeartPulse,
  Wheat,
  Package,
  Sprout,
  Truck,
  FileText,
  Settings2,
  Bell,
  Users2,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { CowBrandLogo, CowIcon } from "@/components/common/CowBrandLogo";
import { useAuth } from "@/context/AuthContext";

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onOpenProfile: () => void;
  alertCount?: number;
}

const PRIMARY_NAV = [
  { id: "home", label: "Dashboard", icon: House },
  { id: "animals", label: "Animals", icon: CowIcon, isCustom: true, badge: "128" },
  { id: "milking", label: "Milking", icon: Milk, badge: "924 L" },
  { id: "production", label: "Production", icon: BarChart3 },
  { id: "health", label: "Health", icon: HeartPulse, badge: "3 check", isDestructiveBadge: true },
  { id: "feeding", label: "Feeding", icon: Wheat },
  { id: "stock", label: "Stock", icon: Package, badge: "2 low", isWarningBadge: true },
  { id: "fodder", label: "Fodder", icon: Sprout },
  { id: "supply", label: "Supply", icon: Truck },
];

const SECONDARY_NAV = [
  { id: "alerts", label: "Farm Alerts", icon: Bell },
  { id: "reports", label: "Reports & Audits", icon: FileText },
  { id: "users", label: "Team & Roles", icon: Users2 },
  { id: "settings", label: "Farm Settings", icon: Settings2 },
];

export function Sidebar({
  currentPage,
  onNavigate,
  onOpenProfile,
  alertCount = 3,
}: SidebarProps) {
  const { user } = useAuth();

  const isWorker = user?.role === "WORKER";
  const isManager = user?.role === "MANAGER";

  // Filter secondary nav based on RBAC
  const visibleSecondaryNav = SECONDARY_NAV.filter((item) => {
    if (isWorker) {
      return item.id === "alerts";
    }
    if (isManager) {
      return item.id !== "settings";
    }
    return true; // OWNER & ADMIN have access to all
  });

  return (
    <aside className="farm-glass-strong sticky top-4 hidden h-[calc(100vh-2rem)] w-[260px] shrink-0 flex-col rounded-3xl border border-border/80 p-4 shadow-xl lg:flex">
      {/* Brand Header with Dairy Cow Identity */}
      <div className="pb-4 border-b border-border/60">
        <CowBrandLogo size="md" subtitle="Farm Management Platform" />
      </div>

      {/* Main Farm Operations */}
      <div className="mt-4 flex-1 overflow-y-auto pr-1">
        <p className="px-3 pb-2 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
          Core Operations
        </p>
        <nav className="space-y-1" aria-label="Main Farm Navigation">
          {PRIMARY_NAV.map((item) => {
            const active = currentPage === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`group flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-semibold transition-all active:scale-[0.98] ${
                  active
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                    : "text-foreground/80 hover:bg-background/80 hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {item.isCustom ? (
                    <CowIcon className={`size-4.5 ${active ? "fill-white" : ""}`} />
                  ) : (
                    <Icon className="size-4.5" strokeWidth={active ? 2.4 : 1.8} />
                  )}
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      active
                        ? "bg-white/20 text-white"
                        : item.isDestructiveBadge
                        ? "bg-destructive/10 text-destructive"
                        : item.isWarningBadge
                        ? "bg-amber-500/15 text-amber-800 dark:text-amber-300"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Management & System Navigation */}
        <div className="mt-5">
          <p className="px-3 pb-2 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
            Farm Management
          </p>
          <nav className="space-y-1" aria-label="Secondary Navigation">
            {visibleSecondaryNav.map((item) => {
              const active = currentPage === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-xs font-medium transition-colors ${
                    active
                      ? "bg-emerald-600 text-white font-semibold shadow-md shadow-emerald-600/30"
                      : "text-foreground/75 hover:bg-background/80 hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className="size-4" strokeWidth={active ? 2.2 : 1.8} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.id === "alerts" && alertCount > 0 && (
                    <span className="rounded-full bg-destructive text-white px-1.5 py-0.2 text-[9px] font-extrabold">
                      {alertCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* User Footer Profile & Role Switcher */}
      <div className="mt-auto border-t border-border/60 pt-3">
        <button
          type="button"
          onClick={onOpenProfile}
          className="flex w-full items-center gap-3 rounded-2xl border border-border/60 bg-background/50 p-2.5 text-left transition-colors hover:bg-background/90"
          aria-label="User Profile and Role"
        >
          <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-600/15 font-extrabold text-emerald-800 dark:text-emerald-300 text-xs">
            {user?.name
              ? user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
              : "PM"}
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-xs font-bold text-foreground">
              {user?.name || "Farmer"}
            </p>
            <p className="truncate text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
              Role: {user?.role || "OWNER"}
            </p>
          </div>
          <ChevronRight className="size-4 text-muted-foreground" />
        </button>
      </div>
    </aside>
  );
}
