import React from "react";
import { Wrench, Clock, ShieldCheck } from "lucide-react";

export function EquipmentModuleView() {
  return (
    <div className="space-y-6 pb-12 max-w-3xl mx-auto px-2 sm:px-4">
      {/* 1. Header Banner */}
      <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-10 shadow-sm text-center space-y-4">
        <div className="grid size-16 mx-auto place-items-center rounded-2xl bg-teal-500/10 text-teal-700 dark:text-teal-300">
          <Wrench className="size-8" />
        </div>

        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">
            <Clock className="size-3.5" />
            <span>Planned Feature</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground">
            Equipment Monitoring — Coming Soon
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            The equipment tracking module is currently in development. It will provide machinery maintenance logging and farm asset tracking in an upcoming release.
          </p>
        </div>

        <div className="pt-2 text-xs text-muted-foreground max-w-lg mx-auto border-t border-border/60">
          Active operational features like herd management, milk recording, feed distribution, and stock inventory remain fully functional.
        </div>
      </div>
    </div>
  );
}
