import React from "react";
import {
  House,
  BarChart3,
  Milk,
  Tractor,
  Wheat,
  Layers,
  FileText,
  Settings2,
  Bell,
  Users2,
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

export function Sidebar({
  currentPage,
  onNavigate,
  onOpenProfile,
  alertCount = 3,
}: SidebarProps) {
  const { user, isWorker, isManager, isOwner } = useAuth();

  // Primary 4 Modules + Dashboard & Analytics
  const PRIMARY_NAV = [
    { id: "home", label: "Dashboard", icon: House },
    { id: "analytics", label: "Farm Analytics", icon: BarChart3, badge: "Charts" },
    { id: "animals", label: "Herd Management", icon: CowIcon, isCustom: true, badge: "128 Head" },
    { id: "milking", label: "Milk Harvest", icon: Milk, badge: "924 L" },
    { id: "equipment", label: "Equipment Status", icon: Tractor, badge: "6 Assets" },
    { id: "feeding", label: "Feed & Rations", icon: Wheat, badge: "Silage" },
    { id: "more", label: "More Modules", icon: Layers, badge: "Secondary" },
  ];

  // Secondary Governance & Management
  const SECONDARY_NAV = [
    { id: "alerts", label: "Farm Alerts", icon: Bell },
    { id: "reports", label: "Certified Reports", icon: FileText },
    { id: "users", label: "Team & Management", icon: Users2, requiresManagement: true },
    { id: "settings", label: "Profile & Settings", icon: Settings2 },
  ];

  const visibleSecondaryNav = SECONDARY_NAV.filter((item) => {
    if (isWorker && item.requiresManagement) {
      return false; // Workers do not see Team & Management
    }
    return true;
  });

  return (
    <aside className="farm-glass-strong sticky top-4 hidden h-[calc(100vh-2rem)] w-[265px] shrink-0 flex-col rounded-3xl border border-border/80 p-4 shadow-xl lg:flex">
      {/* Brand Header with Dairy Cow Identity */}
      <div className="pb-3 border-b border-border/60">
        <CowBrandLogo size="md" subtitle="Dairy Operations & Herd Platform" />
      </div>

      {/* Main Farm Operations */}
      <div className="mt-3 flex-1 overflow-y-auto pr-1 space-y-4">
        <div>
          <p className="px-3 pb-1.5 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
            Primary Operations
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
                  className={`group flex w-full items-center justify-between gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-bold transition-all active:scale-[0.98] ${
                    active
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30 font-black"
                      : "text-foreground/80 hover:bg-background/80 hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {item.isCustom ? (
                      <CowIcon className={`size-4.5 ${active ? "fill-white" : ""}`} />
                    ) : (
                      <Icon className="size-4.5" strokeWidth={active ? 2.5 : 1.8} />
                    )}
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        active ? "bg-white/20 text-white" : "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Management & Governance */}
        <div>
          <p className="px-3 pb-1.5 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
            Management & System
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
                  className={`flex w-full items-center justify-between gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold transition-colors ${
                    active
                      ? "bg-emerald-600 text-white font-black shadow-md shadow-emerald-600/30"
                      : "text-foreground/75 hover:bg-background/80 hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className="size-4" strokeWidth={active ? 2.2 : 1.8} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.id === "alerts" && alertCount > 0 && (
                    <span className="rounded-full bg-destructive text-white px-1.5 py-0.2 text-[9px] font-black">
                      {alertCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* User Profile & Account Footer */}
      <div className="mt-auto border-t border-border/60 pt-3">
        <button
          type="button"
          onClick={() => onNavigate("settings")}
          className="flex w-full items-center gap-2.5 rounded-2xl border border-border/60 bg-background/50 p-2.5 text-left transition-colors hover:bg-background/90"
          aria-label="User Profile and Account Settings"
        >
          <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-600/15 font-black text-emerald-800 dark:text-emerald-300 text-xs">
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
              {user?.role || "OWNER"} · Settings
            </p>
          </div>
          <ChevronRight className="size-4 text-muted-foreground" />
        </button>
      </div>
    </aside>
  );
}
