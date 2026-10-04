import React, { useState } from "react";
import {
  HeartPulse,
  Package,
  Sprout,
  TrendingUp,
  Truck,
  Users2,
  Factory,
  Search,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  Grid,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

interface MoreModulesViewProps {
  onNavigate: (moduleId: string) => void;
  urgentAlertCount?: number;
}

export function MoreModulesView({
  onNavigate,
  urgentAlertCount = 0,
}: MoreModulesViewProps) {
  const { isWorker, isManager, isOwner } = useAuth();
  const [search, setSearch] = useState("");

  const MODULE_CATEGORIES = [
    {
      heading: "Veterinary, Herd Care & Field Operations",
      description: "Clinical checkups, pasture crops, and livestock feed supply",
      items: [
        {
          id: "health",
          name: "Health & Veterinary",
          icon: HeartPulse,
          desc: "Vaccination logs, treatments, mastitis screening & recovery pen",
          badge: urgentAlertCount > 0 ? `${urgentAlertCount} Alerts` : "Healthy",
          badgeColor: urgentAlertCount > 0 ? "bg-rose-500/15 text-rose-700" : "bg-emerald-500/15 text-emerald-800",
          color: "text-rose-600 bg-rose-50 dark:bg-rose-950/30",
        },
        {
          id: "fodder",
          name: "Fodder Fields",
          icon: Sprout,
          desc: "Pasture land plots, harvest cycles, alfalfa & green crops",
          badge: "12 Plots",
          badgeColor: "bg-lime-500/15 text-lime-800",
          color: "text-lime-700 bg-lime-50 dark:bg-lime-950/30",
        },
        {
          id: "stock",
          name: "Stock Inventory",
          icon: Package,
          desc: "Supplements, medicine, silage reserves & restock warnings",
          badge: "Storage OK",
          badgeColor: "bg-cyan-500/15 text-cyan-800",
          color: "text-cyan-700 bg-cyan-50 dark:bg-cyan-950/30",
        },
      ],
    },
    {
      heading: "Dairy Processing & Distribution",
      description: "Commercial bulk cooling, tanker pickups, and retail routes",
      items: [
        {
          id: "production",
          name: "Dairy Processing Facilities",
          icon: Factory,
          desc: "Bulk tank chilling (4°C), pasteurization, bottling & storage",
          badge: "Chilling Active",
          badgeColor: "bg-indigo-500/15 text-indigo-800",
          color: "text-indigo-700 bg-indigo-50 dark:bg-indigo-950/30",
        },
        {
          id: "supply",
          name: "Supply & Route Deliveries",
          icon: Truck,
          desc: "Milk tanker dispatch routes, wholesale buyers & retail billing",
          badge: "Dispatch Ready",
          badgeColor: "bg-blue-500/15 text-blue-800",
          color: "text-blue-700 bg-blue-50 dark:bg-blue-950/30",
        },
      ],
    },
    {
      heading: "Governance, Certified Reports & Team Administration",
      description: "Audited ledger sheets, member management, and farm authorization",
      items: [
        {
          id: "reports",
          name: "Certified Farm Reports",
          icon: TrendingUp,
          desc: "Official CSV, XLSX, and PDF exports for audits & dairy logs",
          badge: "CSV / Excel / PDF",
          badgeColor: "bg-teal-500/15 text-teal-800",
          color: "text-teal-700 bg-teal-50 dark:bg-teal-950/30",
          requiresManagement: false,
        },
        {
          id: "users",
          name: "Team & Role Management",
          icon: Users2,
          desc: "Worker permissions, invitations, shift assignments & audit log",
          badge: isWorker ? "Restricted" : "Active Staff",
          badgeColor: isWorker ? "bg-muted text-muted-foreground" : "bg-purple-500/15 text-purple-800",
          color: "text-purple-700 bg-purple-50 dark:bg-purple-950/30",
          requiresManagement: true,
        },
      ],
    },
  ];

  return (
    <div className="space-y-5 pb-12 max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-emerald-500/15 text-emerald-800 dark:text-emerald-300">
              <Grid className="size-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-foreground">
              All Farm Modules & Specialized Tools
            </h1>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Complete directory of Jharanai Farm veterinary, field, supply, and compliance tools
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search farm modules..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-border bg-background focus:outline-none"
          />
        </div>
      </div>

      {/* Grouped Modules */}
      <div className="space-y-6">
        {MODULE_CATEGORIES.map((cat) => {
          const visibleItems = cat.items.filter((item) => {
            if (isWorker && item.requiresManagement) return false;
            if (search.trim()) {
              return (
                item.name.toLowerCase().includes(search.toLowerCase()) ||
                item.desc.toLowerCase().includes(search.toLowerCase())
              );
            }
            return true;
          });

          if (visibleItems.length === 0) return null;

          return (
            <div key={cat.heading} className="space-y-2.5">
              <div className="border-b border-border/60 pb-1.5 px-1">
                <h2 className="text-xs sm:text-sm font-black text-foreground">
                  {cat.heading}
                </h2>
                <p className="text-[11px] text-muted-foreground">{cat.description}</p>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onNavigate(item.id)}
                      className="group flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-4 text-left shadow-xs transition-all hover:scale-[1.01] hover:shadow-md hover:border-emerald-500/30 active:scale-[0.98] dark:border-border/70 dark:bg-card"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className={`grid size-11 place-items-center rounded-2xl ${item.color}`}>
                          <Icon className="size-5 stroke-[2.2]" />
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                      </div>

                      <div className="mt-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-black text-foreground group-hover:text-emerald-700 transition-colors">
                            {item.name}
                          </h3>
                          <ChevronRight className="size-4 text-muted-foreground group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all" />
                        </div>
                        <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-2">
                          {item.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
