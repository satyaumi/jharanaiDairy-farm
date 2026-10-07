import React from "react";
import { Tractor, Sparkles, Clock, ShieldCheck, ArrowRight, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function EquipmentModuleView() {
  const [notified, setNotified] = React.useState(false);

  const handleNotify = () => {
    setNotified(true);
    toast.success("ଅପଡେଟ୍ ସୂଚନା ସେଭ୍ ହେଲା (Notification Saved)", {
      description: "You will be alerted as soon as equipment telemetry & IoT sensors go live.",
    });
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto px-2 sm:px-4">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 p-6 sm:p-10 text-white shadow-xl">
        <div className="absolute -right-12 -top-12 size-48 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300 border border-emerald-400/30">
              <Sparkles className="size-3.5" />
              <span>ବିକାଶ ଚାଲିଛି · In Active Development</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white flex flex-wrap items-center gap-2">
              <span>ସଜ୍ଜିକରଣ</span>
              <span className="text-emerald-400">· Equipment Hub</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-lg leading-relaxed">
              Automated chiller temperature tracking, milking parlor vacuum calibration, machinery maintenance schedules, and IoT sensors are coming to Jharanai Farm.
            </p>
          </div>

          <div className="grid size-20 sm:size-24 shrink-0 place-items-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-emerald-300 shadow-inner">
            <Tractor className="size-10 sm:size-12 animate-pulse" />
          </div>
        </div>
      </div>

      {/* 2. Feature Roadmap Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs space-y-2">
          <div className="grid size-10 place-items-center rounded-xl bg-teal-500/15 text-teal-700 dark:text-teal-300 font-bold">
            ❄️
          </div>
          <h3 className="font-bold text-sm text-foreground">ଶୀତଳୀକରଣ (Bulk Chiller IoT)</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Real-time chilling tank temperature monitoring (4°C alarm thresholds) with automated SMS alerts.
          </p>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs space-y-2">
          <div className="grid size-10 place-items-center rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold">
            🚜
          </div>
          <h3 className="font-bold text-sm text-foreground">ଯନ୍ତ୍ରପାତି ରକ୍ଷଣାବେକ୍ଷଣ (Machinery Care)</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Tractor engine oil logs, chaff cutter blade replacement reminders, and vehicle dispatch logs.
          </p>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs space-y-2">
          <div className="grid size-10 place-items-center rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold">
            ⚡
          </div>
          <h3 className="font-bold text-sm text-foreground">ପାର୍ଲର ସେନସର (Parlor Telemetry)</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Vacuum pressure regulation (42 kPa), automatic teat cup wash cycles, and milk flow metering.
          </p>
        </div>
      </div>

      {/* 3. Notification CTA Box */}
      <div className="rounded-2xl border border-dashed border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/20 p-6 text-center space-y-3">
        <div className="inline-flex items-center justify-center size-10 rounded-full bg-emerald-600 text-white mx-auto shadow-md">
          <BellRing className="size-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-foreground">
            ସଜ୍ଜିକରଣ ସୁବିଧା ଉପଲବ୍ଧ ହେବା ମାତ୍ରେ ସୂଚନା ପାଆନ୍ତୁ
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Be the first to test live IoT equipment monitoring when released in the next update.
          </p>
        </div>
        <Button
          onClick={handleNotify}
          disabled={notified}
          className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs h-10 px-6 shadow-sm"
        >
          {notified ? "✓ ସୂଚନା ସଂରକ୍ଷିତ (Alert Active)" : "🔔 Notify When Available"}
        </Button>
      </div>
    </div>
  );
}
