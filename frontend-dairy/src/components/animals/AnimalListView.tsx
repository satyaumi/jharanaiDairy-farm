import React, { useState } from "react";
import {
  Search,
  Plus,
  Filter,
  ChevronRight,
  Milk,
  HeartPulse,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Edit3,
  ShieldAlert,
  Award,
  ListFilter,
} from "lucide-react";
import { CowIcon } from "@/components/common/CowBrandLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Animal, MilkRecord } from "@/types/farm";
import { CowPerformanceGroupsView } from "./CowPerformanceGroupsView";
import { useAuth } from "@/context/AuthContext";

interface AnimalListViewProps {
  animals: Animal[];
  recentMilk?: MilkRecord[];
  onSelectAnimal: (animal: Animal) => void;
  onAddNew: () => void;
  onRecordMilk: (animal: Animal) => void;
  onEditAnimal?: (animal: Animal) => void;
  onChangeStatus?: (animal: Animal) => void;
}

export function AnimalListView({
  animals,
  recentMilk = [],
  onSelectAnimal,
  onAddNew,
  onRecordMilk,
  onEditAnimal,
  onChangeStatus,
}: AnimalListViewProps) {
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState<"inventory" | "performance">("inventory");
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("Active");

  const FILTERS = [
    "Active",
    "All",
    "Lactating",
    "Pregnant",
    "Calves",
    "Sick",
    "Sold",
    "Deceased",
    "Retired",
  ];

  // Filter calculations
  const totalCount = animals.length;
  const activeAnimals = animals.filter((a) => a.active !== false);
  const activeCount = activeAnimals.length;
  const lactatingCount = animals.filter(
    (a) => a.active !== false && a.type === "Lactating",
  ).length;
  const pregnantCount = animals.filter(
    (a) => a.active !== false && a.type === "Pregnant",
  ).length;
  const calvesCount = animals.filter(
    (a) => a.active !== false && a.type === "Calf",
  ).length;
  const sickCount = animals.filter(
    (a) =>
      a.active !== false &&
      (a.status === "Sick" ||
        a.status === "Needs check" ||
        a.lifecycleStatus === "SICK"),
  ).length;
  const inactiveCount = animals.filter((a) => a.active === false).length;

  const filteredAnimals = animals.filter((animal) => {
    const matchesSearch =
      `${animal.name} ${animal.tag} ${animal.breed}`
        .toLowerCase()
        .includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (activeFilter === "All") return true;
    if (activeFilter === "Active") return animal.active !== false;
    if (activeFilter === "Lactating")
      return animal.active !== false && animal.type === "Lactating";
    if (activeFilter === "Pregnant")
      return animal.active !== false && animal.type === "Pregnant";
    if (activeFilter === "Calves")
      return animal.active !== false && animal.type === "Calf";
    if (activeFilter === "Sick")
      return (
        animal.status === "Sick" ||
        animal.status === "Needs check" ||
        animal.lifecycleStatus === "SICK"
      );
    if (activeFilter === "Sold") return animal.lifecycleStatus === "SOLD";
    if (activeFilter === "Deceased") return animal.lifecycleStatus === "DECEASED";
    if (activeFilter === "Retired") return animal.lifecycleStatus === "RETIRED";
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300">
              <CowIcon className="size-6" />
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-foreground">
              Animals & Herd Management
            </h1>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Clear records of individual dairy cows, lactation, health, and lifecycle status
          </p>
        </div>

        {role !== "OWNER" && (
          <Button
            onClick={onAddNew}
            className="h-11 gap-2 rounded-2xl bg-emerald-600 px-4 text-xs sm:text-sm font-extrabold text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-700 active:scale-95"
          >
            <Plus className="size-4.5 stroke-[2.5]" />
            Add Animal to Herd
          </Button>
        )}
      </div>

      {/* Sub-navigation Tabs: Herd Inventory vs Milk Performance Groups */}
      <div className="flex border-b border-border/80 pb-2 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("inventory")}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "inventory"
              ? "bg-emerald-600 text-white shadow-xs font-black"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
          }`}
        >
          <ListFilter className="size-3.5" />
          <span>Herd Inventory ({activeCount} Active / {totalCount} Total)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("performance")}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "performance"
              ? "bg-emerald-600 text-white shadow-xs font-black"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
          }`}
        >
          <Award className="size-3.5" />
          <span>Milk Performance Groups (A–F)</span>
        </button>
      </div>

      {activeTab === "performance" ? (
        <CowPerformanceGroupsView
          animals={animals}
          recentMilk={recentMilk}
          onSelectAnimal={onSelectAnimal}
          onRecordMilk={onRecordMilk}
        />
      ) : (
        <>
          {/* Summary KPI Cards for Quick Farm Understanding */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            <button
              type="button"
              onClick={() => setActiveFilter("Active")}
              className={`rounded-2xl border p-3 text-left transition-all ${
                activeFilter === "Active"
                  ? "border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20 dark:bg-emerald-950/40"
                  : "border-border/70 bg-card/60 hover:bg-card"
              }`}
            >
              <p className="text-[10px] font-bold uppercase text-muted-foreground">
                Active Herd
              </p>
              <p className="mt-1 text-2xl font-extrabold text-emerald-700 dark:text-emerald-400">
                {activeCount}
              </p>
              <p className="text-[10px] text-muted-foreground">In daily operations</p>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter("Lactating")}
              className={`rounded-2xl border p-3 text-left transition-all ${
                activeFilter === "Lactating"
                  ? "border-sky-600 bg-sky-50/80 ring-2 ring-sky-500/20 dark:bg-sky-950/40"
                  : "border-border/70 bg-card/60 hover:bg-card"
              }`}
            >
              <p className="text-[10px] font-bold uppercase text-muted-foreground">
                Lactating
              </p>
              <p className="mt-1 text-2xl font-extrabold text-sky-700 dark:text-sky-300">
                {lactatingCount}
              </p>
              <p className="text-[10px] text-muted-foreground">In daily milking</p>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter("Pregnant")}
              className={`rounded-2xl border p-3 text-left transition-all ${
                activeFilter === "Pregnant"
                  ? "border-amber-600 bg-amber-50/80 ring-2 ring-amber-500/20 dark:bg-amber-950/40"
                  : "border-border/70 bg-card/60 hover:bg-card"
              }`}
            >
              <p className="text-[10px] font-bold uppercase text-muted-foreground">
                Pregnant
              </p>
              <p className="mt-1 text-2xl font-extrabold text-amber-700 dark:text-amber-300">
                {pregnantCount}
              </p>
              <p className="text-[10px] text-muted-foreground">Calving ahead</p>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter("Calves")}
              className={`rounded-2xl border p-3 text-left transition-all ${
                activeFilter === "Calves"
                  ? "border-teal-600 bg-teal-50/80 ring-2 ring-teal-500/20 dark:bg-teal-950/40"
                  : "border-border/70 bg-card/60 hover:bg-card"
              }`}
            >
              <p className="text-[10px] font-bold uppercase text-muted-foreground">
                Calves
              </p>
              <p className="mt-1 text-2xl font-extrabold text-teal-700 dark:text-teal-300">
                {calvesCount}
              </p>
              <p className="text-[10px] text-muted-foreground">Young stock</p>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter("Sick")}
              className={`rounded-2xl border p-3 text-left transition-all ${
                activeFilter === "Sick"
                  ? "border-destructive bg-destructive/10 ring-2 ring-destructive/20"
                  : "border-border/70 bg-card/60 hover:bg-card"
              }`}
            >
              <p className="text-[10px] font-bold uppercase text-muted-foreground">
                Sick / Check
              </p>
              <p className="mt-1 text-2xl font-extrabold text-destructive">
                {sickCount}
              </p>
              <p className="text-[10px] text-destructive/80 font-bold">Needs care</p>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter("All")}
              className={`rounded-2xl border p-3 text-left transition-all ${
                activeFilter === "All"
                  ? "border-purple-600 bg-purple-50/80 ring-2 ring-purple-500/20 dark:bg-purple-950/40"
                  : "border-border/70 bg-card/60 hover:bg-card"
              }`}
            >
              <p className="text-[10px] font-bold uppercase text-muted-foreground">
                All Records
              </p>
              <p className="mt-1 text-2xl font-extrabold text-foreground">
                {totalCount}
              </p>
              <p className="text-[10px] text-muted-foreground">{inactiveCount} Inactive</p>
            </button>
          </div>

          {/* Search and Filters Bar */}
          <div className="farm-glass rounded-2xl p-3 sm:p-4 space-y-3">
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by animal name, tag number (e.g. C-1024), or breed..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-11 rounded-xl bg-background/80 pl-10 text-xs sm:text-sm"
                />
              </div>
              {search && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearch("")}
                  className="text-xs h-10 px-3"
                >
                  Clear Search
                </Button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {FILTERS.map((item) => (
                <Button
                  key={item}
                  size="sm"
                  variant={activeFilter === item ? "default" : "outline"}
                  onClick={() => setActiveFilter(item)}
                  className={`h-9 shrink-0 rounded-xl px-3 text-xs font-bold ${
                    activeFilter === item
                      ? "bg-emerald-600 text-white"
                      : "bg-background/60 hover:bg-background"
                  }`}
                >
                  {item}
                </Button>
              ))}
            </div>
          </div>

          {/* ANIMALS LIST: MOBILE CARDS vs DESKTOP TABLE */}
          {filteredAnimals.length === 0 ? (
            <div className="farm-glass grid min-h-60 place-content-center rounded-3xl p-8 text-center">
              <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-secondary text-secondary-foreground">
                <CowIcon className="size-8" />
              </div>
              <p className="mt-3 text-base font-bold text-foreground">
                No animals found matching "{search}"
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Try a different name, tag number, or change your filter.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setActiveFilter("Active");
                }}
                className="mt-4 mx-auto rounded-xl"
              >
                Reset Filters
              </Button>
            </div>
          ) : (
            <>
              {/* 1. MOBILE-FIRST CARDS VIEW */}
              <div className="space-y-2.5 md:hidden">
                {filteredAnimals.map((animal) => {
                  const isSick =
                    animal.status === "Sick" || animal.status === "Needs check";
                  const isInactive = animal.active === false;
                  return (
                    <div
                      key={animal.id}
                      className={`flex flex-col gap-2 rounded-2xl border p-3.5 transition-all ${
                        isInactive
                          ? "border-muted bg-muted/20 opacity-85"
                          : isSick
                          ? "border-destructive/30 bg-destructive/5"
                          : "border-border/70 bg-card/70"
                      }`}
                    >
                      {/* Top Line: Tag, Name & Health/Lifecycle Status */}
                      <div
                        onClick={() => onSelectAnimal(animal)}
                        className="flex items-center justify-between gap-2 cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-800 dark:text-emerald-300">
                            <CowIcon className="size-6" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-black text-emerald-800 dark:text-emerald-300 text-sm bg-emerald-500/15 px-2 py-0.5 rounded-lg">
                                {animal.tag}
                              </span>
                              {animal.name && animal.name !== animal.tag && (
                                <span className="font-semibold text-foreground text-xs truncate">
                                  ({animal.name})
                                </span>
                              )}
                            </div>
                            <p className="truncate text-[11px] text-muted-foreground">
                              {animal.breed} · {animal.age} · {animal.pen || "Unassigned"}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                              isInactive
                                ? "bg-muted text-muted-foreground"
                                : animal.status === "Healthy"
                                ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300"
                                : "bg-destructive/15 text-destructive"
                            }`}
                          >
                            {animal.lifecycleStatus || animal.status}
                          </span>
                        </div>
                      </div>

                      {/* Middle Line: Lactation / Breeding Info */}
                      <div
                        onClick={() => onSelectAnimal(animal)}
                        className="flex items-center justify-between rounded-xl bg-background/50 px-3 py-2 text-xs cursor-pointer"
                      >
                        <div>
                          <span className="text-[10px] font-bold uppercase text-muted-foreground">
                            Group
                          </span>
                          <p className="font-bold text-foreground">{animal.type}</p>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] font-bold uppercase text-muted-foreground">
                            Today's Yield
                          </span>
                          <p className="font-extrabold text-emerald-700 dark:text-emerald-400">
                            {animal.yield > 0 ? `${animal.yield.toFixed(1)} L` : "0 L"}
                          </p>
                        </div>
                      </div>

                      {/* Bottom Line: Quick Actions (Profile, Edit, Status) */}
                      <div className="flex items-center justify-between pt-1 border-t border-border/40">
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          {animal.dueDate ? (
                            <>
                              <Calendar className="size-3.5 text-amber-600" />
                              Due {animal.dueDate}
                            </>
                          ) : (
                            `Pen: ${animal.pen || "—"}`
                          )}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {onEditAnimal && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onEditAnimal(animal)}
                              className="h-8 px-2 text-xs font-bold text-muted-foreground hover:text-foreground"
                            >
                              <Edit3 className="size-3.5 mr-1" />
                              Edit
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onSelectAnimal(animal)}
                            className="h-8 px-2.5 text-xs font-bold text-primary"
                          >
                            Profile <ChevronRight className="size-3.5 ml-0.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 2. DESKTOP / TABLET RESPONSIVE TABLE VIEW */}
              <div className="farm-glass hidden overflow-hidden rounded-3xl md:block">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border/80 bg-muted/30 text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                        <th className="px-4 py-3.5">Animal Name & Tag</th>
                        <th className="px-4 py-3.5">Breed & Age</th>
                        <th className="px-4 py-3.5">Herd Group</th>
                        <th className="px-4 py-3.5">Status</th>
                        <th className="px-4 py-3.5">Pen Location</th>
                        <th className="px-4 py-3.5 text-right">Today's Milk</th>
                        <th className="px-4 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {filteredAnimals.map((animal) => {
                        const isInactive = animal.active === false;
                        return (
                          <tr
                            key={animal.id}
                            className={`transition-colors hover:bg-background/60 ${
                              isInactive ? "opacity-75 bg-muted/10" : ""
                            }`}
                          >
                            <td
                              onClick={() => onSelectAnimal(animal)}
                              className="px-4 py-3.5 cursor-pointer"
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-800 dark:text-emerald-300">
                                  <CowIcon className="size-6" />
                                </span>
                                <div>
                                  <p className="font-black text-emerald-800 dark:text-emerald-300 text-sm">
                                    {animal.tag}
                                  </p>
                                  {animal.name && animal.name !== animal.tag && (
                                    <p className="text-[11px] font-semibold text-muted-foreground">
                                      {animal.name}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              <p className="font-semibold text-foreground">
                                {animal.breed}
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                {animal.age || "—"}
                              </p>
                            </td>
                            <td className="px-4 py-3.5">
                              <span className="rounded-full bg-secondary/80 px-2.5 py-1 text-[11px] font-semibold text-secondary-foreground">
                                {animal.type}
                              </span>
                            </td>
                            <td className="px-4 py-3.5">
                              <span
                                className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                                  isInactive
                                    ? "bg-muted text-muted-foreground"
                                    : animal.status === "Healthy"
                                    ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300"
                                    : "bg-destructive/15 text-destructive"
                                }`}
                              >
                                {animal.lifecycleStatus || animal.status}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 font-medium text-foreground">
                              {animal.pen || "—"}
                            </td>
                            <td className="px-4 py-3.5 text-right font-extrabold text-foreground text-sm">
                              {animal.yield > 0 ? (
                                <span className="text-emerald-700 dark:text-emerald-400">
                                  {animal.yield.toFixed(1)} L
                                </span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {onEditAnimal && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onEditAnimal(animal)}
                                    className="h-8 rounded-xl px-2.5 text-xs font-bold border-border/80"
                                  >
                                    <Edit3 className="size-3 mr-1" />
                                    Edit
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onSelectAnimal(animal)}
                                  className="h-8 rounded-xl px-2.5 text-xs font-bold text-primary hover:bg-primary/10"
                                >
                                  View Profile
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
