import React from "react";
import { Truck, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SupplyModuleView() {
  return (
    <div className="space-y-6 pb-12 max-w-3xl mx-auto px-2 sm:px-4">
      {/* 1. Header Banner */}
      <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-10 shadow-sm text-center space-y-4">
        <div className="grid size-16 mx-auto place-items-center rounded-2xl bg-blue-500/10 text-blue-700 dark:text-blue-300">
          <Truck className="size-8" />
        </div>

        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">
            <Clock className="size-3.5" />
            <span>Planned Feature</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground">
            Supply & Route Deliveries — Coming Soon
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            Milk tanker dispatch route scheduling, buyer collections, and distribution logistics are scheduled for a future operational release.
          </p>
        </div>

        <div className="pt-2 text-xs text-muted-foreground max-w-lg mx-auto border-t border-border/60">
          Daily milking logs and bulk cooling facilities remain active and operational.
        </div>
      </div>
    </div>
  );
}
