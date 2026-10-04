import React, { useState } from "react";
import {
  Tractor,
  CheckCircle2,
  Wrench,
  AlertTriangle,
  Clock,
  Plus,
  ShieldCheck,
  Search,
  Filter,
  ArrowRight,
  FileText,
  Calendar,
  Thermometer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface EquipmentItem {
  id: string;
  name: string;
  category: "Milking" | "Machinery" | "Cooling" | "Transport";
  model: string;
  status: "Operational" | "Maintenance Due" | "Under Repair";
  lastServiced: string;
  nextService: string;
  location: string;
  operatingHours: string;
  conditionNotes: string;
}

export function EquipmentModuleView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [logModalOpen, setLogModalOpen] = useState(false);

  const [equipmentList, setEquipmentList] = useState<EquipmentItem[]>([
    {
      id: "EQ-101",
      name: "Automated Milking Parlor Unit (24-point)",
      category: "Milking",
      model: "DeLaval VMS 300 Series",
      status: "Operational",
      lastServiced: "18 Sep 2026",
      nextService: "18 Oct 2026",
      location: "Main Milking Shed A",
      operatingHours: "3,480 hrs",
      conditionNotes: "Vacuum pressure calibrated to 42 kPa. Teat cups sanitized.",
    },
    {
      id: "EQ-102",
      name: "Bulk Milk Chiller (5,000 Litres)",
      category: "Cooling",
      model: "Mueller Direct Expansion Tank",
      status: "Operational",
      lastServiced: "02 Sep 2026",
      nextService: "02 Nov 2026",
      location: "Dairy Processing Room",
      operatingHours: "Continuous (4.0°C)",
      conditionNotes: "Compressor coolant levels nominal. Temperature sensor accurate.",
    },
    {
      id: "EQ-103",
      name: "John Deere 5050D Utility Tractor",
      category: "Machinery",
      model: "JD 5050D 4WD (50 HP)",
      status: "Operational",
      lastServiced: "10 Aug 2026",
      nextService: "10 Nov 2026",
      location: "Barn 2 Silage Yard",
      operatingHours: "1,240 hrs",
      conditionNotes: "Hydraulics responsive. Diesel filter replaced last round.",
    },
    {
      id: "EQ-104",
      name: "Refrigerated Milk Dispatch Van",
      category: "Transport",
      model: "Mahindra Bolero Maxi Truck (Insulated)",
      status: "Maintenance Due",
      lastServiced: "15 Jul 2026",
      nextService: "05 Oct 2026",
      location: "Transport Bay #1",
      operatingHours: "48,200 km",
      conditionNotes: "Brake pad inspection & condenser fan servicing required.",
    },
    {
      id: "EQ-105",
      name: "High-Pressure Fodder Chopper & Silo Loader",
      category: "Machinery",
      model: "KisanKraft KK-FC-4000",
      status: "Operational",
      lastServiced: "28 Aug 2026",
      nextService: "28 Oct 2026",
      location: "Fodder Processing Shed",
      operatingHours: "820 hrs",
      conditionNotes: "High-carbon blades sharp. Motor grease levels verified.",
    },
    {
      id: "EQ-106",
      name: "Automatic Water Drinking Bowls & Circulation",
      category: "Milking",
      model: "Constant-Level Float System",
      status: "Operational",
      lastServiced: "12 Sep 2026",
      nextService: "12 Oct 2026",
      location: "North & South Pens",
      operatingHours: "24/7 Supply",
      conditionNotes: "Algae prevention tablets added. No line leaks detected.",
    },
  ]);

  const filteredItems = equipmentList.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === "ALL" || item.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const operationalCount = equipmentList.filter((e) => e.status === "Operational").length;
  const maintenanceCount = equipmentList.filter((e) => e.status === "Maintenance Due").length;

  const handleMarkServiced = (id: string) => {
    setEquipmentList((prev) =>
      prev.map((e) =>
        e.id === id
          ? {
              ...e,
              status: "Operational",
              lastServiced: "Today (04 Oct 2026)",
              nextService: "04 Nov 2026",
            }
          : e
      )
    );
    toast.success("Equipment Status Updated", {
      description: `Equipment ${id} marked operational and scheduled for next monthly cycle.`,
    });
  };

  return (
    <div className="space-y-4 pb-8 max-w-full overflow-hidden">
      {/* 1. Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-teal-500/15 text-teal-800 dark:text-teal-300">
              <Tractor className="size-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-foreground">
              Equipment & Machinery Registry
            </h1>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Dairy machinery, chilling facilities, vehicles, and maintenance schedules
          </p>
        </div>

        <Button
          onClick={() => {
            toast.info("Maintenance Request Opened", {
              description: "Select an equipment item to log maintenance notes.",
            });
          }}
          className="h-10 gap-1.5 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-black text-xs shadow-md active:scale-95"
        >
          <Plus className="size-4" />
          <span>Log Service Note</span>
        </Button>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-100 bg-white p-3 shadow-xs dark:border-border dark:bg-card">
          <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
            Total Machinery
          </p>
          <p className="mt-1 text-xl sm:text-2xl font-black text-foreground">
            {equipmentList.length} Units
          </p>
          <p className="text-[10px] text-muted-foreground font-semibold">Registered farm assets</p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-3 shadow-xs dark:border-border dark:bg-card">
          <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
            Operational
          </p>
          <p className="mt-1 text-xl sm:text-2xl font-black text-emerald-600">
            {operationalCount} Ready
          </p>
          <p className="text-[10px] text-emerald-700 font-bold">100% Milking capacity</p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-3 shadow-xs dark:border-border dark:bg-card">
          <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
            Service Required
          </p>
          <p className="mt-1 text-xl sm:text-2xl font-black text-amber-600">
            {maintenanceCount} Unit
          </p>
          <p className="text-[10px] text-amber-700 font-bold">Dispatch vehicle scheduled</p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-3 shadow-xs dark:border-border dark:bg-card">
          <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
            Bulk Chiller Temp
          </p>
          <p className="mt-1 text-xl sm:text-2xl font-black text-teal-600">
            3.8°C
          </p>
          <p className="text-[10px] text-teal-700 font-bold">Optimal storage range</p>
        </div>
      </div>

      {/* 3. Search and Category Filter */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between rounded-2xl bg-card border border-border/80 p-2 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search equipment by name, code, or location..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-background rounded-xl border border-border focus:outline-none"
          />
        </div>

        <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0">
          {(["ALL", "Milking", "Cooling", "Machinery", "Transport"] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap ${
                categoryFilter === cat
                  ? "bg-teal-700 text-white shadow-xs"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Equipment Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="flex flex-col justify-between rounded-2xl sm:rounded-3xl border border-slate-100 bg-white p-4 shadow-xs dark:border-border/70 dark:bg-card space-y-3"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="grid size-10 place-items-center rounded-xl bg-slate-100 dark:bg-muted text-[#1e4d7b] font-black text-xs">
                    {item.category === "Transport" ? "VAN" : item.category === "Cooling" ? "COOL" : "EQ"}
                  </span>
                  <div>
                    <h3 className="text-sm font-black text-foreground">{item.name}</h3>
                    <p className="text-[11px] text-muted-foreground">
                      {item.id} · {item.model}
                    </p>
                  </div>
                </div>

                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-black shrink-0 ${
                    item.status === "Operational"
                      ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300"
                      : "bg-amber-500/15 text-amber-800 dark:text-amber-300"
                  }`}
                >
                  {item.status}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground bg-slate-50/70 dark:bg-muted/30 p-2.5 rounded-xl">
                <div>
                  <span className="text-[10px] uppercase font-bold block text-muted-foreground">Location</span>
                  <span className="font-semibold text-foreground">{item.location}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold block text-muted-foreground">Operating</span>
                  <span className="font-semibold text-foreground">{item.operatingHours}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold block text-muted-foreground">Last Serviced</span>
                  <span className="font-semibold text-foreground">{item.lastServiced}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold block text-muted-foreground">Next Service</span>
                  <span className="font-semibold text-teal-700 dark:text-teal-400 font-bold">
                    {item.nextService}
                  </span>
                </div>
              </div>

              <p className="mt-2 text-[11px] text-muted-foreground line-clamp-1 italic">
                "{item.conditionNotes}"
              </p>
            </div>

            <div className="flex items-center justify-between border-t border-border/50 pt-2 text-xs">
              <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                <ShieldCheck className="size-3 text-emerald-600" /> Maintenance Verified
              </span>

              {item.status === "Maintenance Due" ? (
                <Button
                  size="sm"
                  onClick={() => handleMarkServiced(item.id)}
                  className="h-8 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3"
                >
                  <Wrench className="size-3 mr-1" /> Mark Serviced
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    toast.success("Schedule Updated", {
                      description: `Inspection reminder for ${item.name} set.`,
                    });
                  }}
                  className="h-8 rounded-xl text-xs font-bold text-teal-700 hover:text-teal-800"
                >
                  Schedule Check <ArrowRight className="size-3 ml-1" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
