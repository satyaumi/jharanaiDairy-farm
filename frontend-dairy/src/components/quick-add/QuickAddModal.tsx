import React, { useState, useEffect } from "react";
import {
  Milk,
  Plus,
  Wheat,
  Stethoscope,
  ShieldCheck,
  Package,
  Sprout,
  Check,
  Search,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Calendar,
  Sun,
  Moon,
  Sparkles,
} from "lucide-react";
import { CowIcon } from "@/components/common/CowBrandLogo";
import { calculateAgeFromDob, formatDateDisplay } from "@/lib/age-calculator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { notify } from "@/lib/notify";
import { useAuth } from "@/context/AuthContext";
import { farmService } from "@/services/farm-service";
import type { Animal, MilkRecord } from "@/types/farm";
import { UnifiedGroupMilking } from "@/components/milking/UnifiedGroupMilking";
import {
  useActionStatus,
  ActionSubmitButton,
  ActionInlineFeedback,
} from "@/components/common/ActionStatus";

interface QuickAddModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  animals: Animal[];
  records?: MilkRecord[];
  onDataUpdated?: () => void;
  initialAction?: string;
  onSelectAnimal?: (animal: Animal) => void;
}

type ActionKey =
  | "menu"
  | "record-milk"
  | "add-animal"
  | "feeding"
  | "health"
  | "vaccination"
  | "stock"
  | "fodder";

export function QuickAddModal({
  open,
  onOpenChange,
  animals,
  records,
  onDataUpdated,
  initialAction = "menu",
  onSelectAnimal,
}: QuickAddModalProps) {
  const [currentAction, setCurrentAction] = useState<ActionKey>(
    (initialAction as ActionKey) || "menu",
  );

  const addAnimalStatus = useActionStatus();
  const otherActionStatus = useActionStatus();

  // --- RECORD MILK 4-STEP STATE ---
  const [milkSession, setMilkSession] = useState<"Morning" | "Evening">(
    "Morning",
  );
  const [selectedAnimalId, setSelectedAnimalId] = useState<string>(
    animals.find((a) => a.type === "Lactating")?.id || animals[0]?.id || "",
  );
  const [animalSearch, setAnimalSearch] = useState<string>("");
  const [litres, setLitres] = useState<string>("8.5");

  // --- FOCUSED BASIC REGISTRATION STATE ---
  const [tagInput, setTagInput] = useState<string>("");
  const [breedInput, setBreedInput] = useState<string>("Holstein");
  const [birthDate, setBirthDate] = useState<string>("");
  const [animalTypeSelection, setAnimalTypeSelection] = useState<"Adult" | "Calf">("Adult");
  const [genderSelection, setGenderSelection] = useState<"Female" | "Male">("Female");
  const [sireSelection, setSireSelection] = useState<string>("");
  const [manualSireTag, setManualSireTag] = useState<string>("");
  const [damSelection, setDamSelection] = useState<string>("");
  const [manualDamTag, setManualDamTag] = useState<string>("");
  const [herdStatusSelection, setHerdStatusSelection] = useState<"Active" | "Sick" | "Aged" | "Other">("Active");
  const [penInput, setPenInput] = useState<string>("");
  const [weightInput, setWeightInput] = useState<string>("");

  // Expandable History (Optional, collapsed by default)
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [previousOwner, setPreviousOwner] = useState<string>("");
  const [birthStatus, setBirthStatus] = useState<string>("Normal");
  const [previousCalvingDate, setPreviousCalvingDate] = useState<string>("");
  const [previousLactationCount, setPreviousLactationCount] = useState<string>("");
  const [historyRemarks, setHistoryRemarks] = useState<string>("");

  // Live duplicate warning state
  const duplicateMatch = tagInput.trim()
    ? animals.find((a) => (a.tag || "").toUpperCase() === tagInput.trim().toUpperCase())
    : null;

  // Sync currentAction when dialog opens or initialAction changes
  useEffect(() => {
    if (open) {
      setCurrentAction((initialAction as ActionKey) || "menu");
      addAnimalStatus.reset();
      otherActionStatus.reset();
    }
  }, [open, initialAction]);

  const handleModalBack = () => {
    if (initialAction !== "menu" && currentAction === initialAction) {
      handleOpenChange(false);
    } else {
      setCurrentAction("menu");
    }
  };

  // Reset to menu when dialog closes
  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (!isOpen) {
      setTimeout(() => setCurrentAction("menu"), 250);
    }
  };

  const { isWorker, isOwner } = useAuth();

  // Submit Record Milk (Legacy fallback)
  const handleSaveMilk = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(litres);
    if (isNaN(qty) || qty <= 0) {
      notify.error("Please enter a valid milk quantity in litres.");
      return;
    }

    const animal = animals.find((a) => a.id === selectedAnimalId);
    if (!animal) {
      notify.error("Please select an animal.");
      return;
    }

    await farmService.recordMilk({
      animalId: animal.id,
      animalName: animal.name,
      tag: animal.tag,
      session: milkSession,
      litres: qty,
      quality: "Normal",
    });

    notify.success(`Recorded ${qty} L for ${animal.name} (${animal.tag})`, {
      description: `${milkSession} milking saved to today's herd records.`,
    });

    onDataUpdated?.();
    handleOpenChange(false);
  };

  // Quick Action menu items
  const QUICK_ACTIONS = [
    {
      key: "record-milk" as ActionKey,
      title: "Record Milk",
      subtitle: "Morning or evening yield per cow",
      icon: Milk,
      color: "bg-sky-500/15 text-sky-800 dark:text-sky-300 border-sky-500/30",
      highlight: true,
    },
    {
      key: "add-animal" as ActionKey,
      title: "Add Animal",
      subtitle: "Register new cow or calf to herd",
      icon: CowIcon,
      isCustom: true,
      color:
        "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30",
    },
    {
      key: "feeding" as ActionKey,
      title: "Record Feeding",
      subtitle: "Green fodder, dry hay or concentrate",
      icon: Wheat,
      color:
        "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30",
    },
    {
      key: "health" as ActionKey,
      title: "Health Check",
      subtitle: "Log symptoms, fever or hoof check",
      icon: Stethoscope,
      color:
        "bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-500/30",
    },
    {
      key: "vaccination" as ActionKey,
      title: "Log Vaccination",
      subtitle: "Record given dose or set due date",
      icon: ShieldCheck,
      color:
        "bg-teal-500/15 text-teal-800 dark:text-teal-300 border-teal-500/30",
    },
    {
      key: "stock" as ActionKey,
      title: "Stock Entry",
      subtitle: "Feed or medicine received / used",
      icon: Package,
      color:
        "bg-cyan-500/15 text-cyan-800 dark:text-cyan-300 border-cyan-500/30",
    },
    {
      key: "fodder" as ActionKey,
      title: "Record Fodder",
      subtitle: "Field harvest or planting round",
      icon: Sprout,
      color:
        "bg-lime-500/15 text-lime-800 dark:text-lime-300 border-lime-500/30",
    },
  ];

  const filteredAnimals = animals.filter(
    (a) =>
      a.name.toLowerCase().includes(animalSearch.toLowerCase()) ||
      a.tag.toLowerCase().includes(animalSearch.toLowerCase()),
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={`max-h-[92vh] overflow-y-auto rounded-3xl border-border/80 bg-background/95 p-4 sm:p-6 transition-all duration-200 ${
          currentAction === "record-milk" ? "max-w-3xl" : "max-w-lg"
        }`}
      >
        {/* Top Header */}
        <DialogHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/60">
          <div>
            <div className="flex items-center gap-2">
              {currentAction !== "menu" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-full"
                  onClick={handleModalBack}
                  aria-label="Back"
                >
                  <ChevronLeft className="size-5" />
                </Button>
              )}
              <DialogTitle className="text-xl font-extrabold text-foreground">
                {currentAction === "menu" && "Quick Farm Actions"}
                {currentAction === "record-milk" && "Record Milk"}
                {currentAction === "add-animal" && "Add Animal"}
                {currentAction === "feeding" && "Record Feeding"}
                {currentAction === "health" && "Health Check"}
                {currentAction === "vaccination" && "Vaccination Entry"}
                {currentAction === "stock" && "Stock Entry"}
                {currentAction === "fodder" && "Fodder Record"}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground ml-1">
              {currentAction === "menu"
                ? "Tap an action to record today's work quickly"
                : "Simple for the farmer · fast 1-minute entry"}
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* 1. MAIN MENU OF ACTIONS */}
        {currentAction === "menu" && (
          <div className="grid grid-cols-1 gap-2.5 pt-2 sm:grid-cols-2">
            {QUICK_ACTIONS.filter((item) => {
              if (isOwner) return false;
              return true;
            }).map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setCurrentAction(item.key)}
                  className={`flex min-h-[72px] items-center gap-3.5 rounded-2xl border p-3.5 text-left transition-all active:scale-[0.98] ${
                    item.highlight
                      ? "border-sky-500/40 bg-gradient-to-r from-sky-500/10 via-sky-500/5 to-transparent hover:border-sky-500 shadow-sm"
                      : "border-border/70 bg-card/60 hover:bg-card hover:border-border"
                  }`}
                >
                  <div
                    className={`grid size-12 shrink-0 place-items-center rounded-xl border ${item.color}`}
                  >
                    {item.isCustom ? (
                      <CowIcon className="size-7" />
                    ) : (
                      <Icon className="size-6" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-foreground">
                      {item.title}
                    </p>
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                      {item.subtitle}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* 2. RECORD MILK (UNIFIED REUSABLE GROUP-WISE & MULTI-COW WORKFLOW) */}
        {currentAction === "record-milk" && (
          <div className="pt-1">
            <UnifiedGroupMilking
              animals={animals}
              records={records || []}
              onSaved={() => {
                onDataUpdated?.();
              }}
              onClose={() => handleOpenChange(false)}
              isModal={true}
            />
          </div>
        )}

        {/* 3. QUICK ADD ANIMAL (EXPANDABLE REAL FARM ENTRY WITH EXCEL COMPATIBILITY) */}
        {currentAction === "add-animal" && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const tag = tagInput.trim().toUpperCase();
              const breed = breedInput.trim();

              if (!tag) {
                notify.error("Cow Number / Animal Number is required.");
                return;
              }
              if (!breed) {
                notify.error("Breed is required.");
                return;
              }

              // Duplicate check
              const existingAnimal = animals.find(
                (a) => (a.tag || "").toUpperCase() === tag,
              );
              if (existingAnimal) {
                notify.error("Duplicate Animal Number", {
                  description: "Duplicate Animal Number – This cow already exists in the herd.",
                });
                return;
              }

              const todayStr = new Date().toISOString().split("T")[0]!;
              if (birthDate && birthDate > todayStr) {
                notify.error("Date of Birth cannot be in the future.");
                return;
              }

              // Resolve Sire / Father
              let finalFatherId: string | undefined = undefined;
              let finalFatherTag: string | undefined = undefined;
              let finalFatherName: string | undefined = undefined;

              if (sireSelection && sireSelection !== "manual" && sireSelection !== "none") {
                const fa = animals.find((a) => a.id === sireSelection);
                if (fa) {
                  finalFatherId = fa.id;
                  finalFatherTag = fa.tag;
                  finalFatherName = fa.name;
                }
              } else if (sireSelection === "manual" && manualSireTag.trim()) {
                finalFatherTag = manualSireTag.trim().toUpperCase();
              }

              if (finalFatherTag && finalFatherTag === tag) {
                notify.error("Sire cannot be the same animal being created.");
                return;
              }

              // Resolve Dam / Mother
              let finalMotherId: string | undefined = undefined;
              let finalMotherTag: string | undefined = undefined;
              let finalMotherName: string | undefined = undefined;

              if (damSelection && damSelection !== "manual" && damSelection !== "none") {
                const ma = animals.find((a) => a.id === damSelection);
                if (ma) {
                  finalMotherId = ma.id;
                  finalMotherTag = ma.tag;
                  finalMotherName = ma.name;
                }
              } else if (damSelection === "manual" && manualDamTag.trim()) {
                finalMotherTag = manualDamTag.trim().toUpperCase();
              }

              if (finalMotherTag && finalMotherTag === tag) {
                notify.error("Dam cannot be the same animal being created.");
                return;
              }

              const calculatedAge = calculateAgeFromDob(birthDate);
              const weightVal = weightInput.trim() ? parseFloat(weightInput.trim()) : undefined;
              const lactationCycleVal = previousLactationCount.trim() ? parseInt(previousLactationCount.trim(), 10) : undefined;

              const newAnimal: Partial<Animal> = {
                tag,
                name: tag,
                breed,
                type: animalTypeSelection === "Calf" ? "Calf" : "Lactating",
                status: herdStatusSelection === "Sick" ? "Sick" : "Healthy",
                animalStatusCategory: herdStatusSelection === "Aged" ? "Aged" : animalTypeSelection === "Calf" ? "Calf" : herdStatusSelection === "Sick" ? "Mother Sick" : "Mother Active",
                calfSex: genderSelection,
                age: calculatedAge,
                weight: weightVal,
                pen: penInput.trim() || undefined,
                birthDate: birthDate || undefined,
                fatherAnimalId: finalFatherId,
                fatherTag: finalFatherTag,
                fatherName: finalFatherName,
                motherAnimalId: finalMotherId,
                motherTag: finalMotherTag,
                motherName: finalMotherName,
                birthStatus: showHistory && birthStatus ? birthStatus : undefined,
                lastCalvingDate: showHistory && previousCalvingDate ? previousCalvingDate : undefined,
                lactationCycle: lactationCycleVal,
                remarks: showHistory
                  ? (previousOwner.trim() ? `Source: ${previousOwner.trim()}${historyRemarks.trim() ? ". " + historyRemarks.trim() : ""}` : historyRemarks.trim() || undefined)
                  : undefined,
                active: true,
                createdAt: new Date().toISOString(),
              };

              await addAnimalStatus.execute(
                async () => {
                  return await farmService.saveAnimal(newAnimal);
                },
                {
                  submittingMessage: `Registering Cow #${tag}...`,
                  successMessage: `Cow #${tag} added to herd successfully!`,
                  onSuccess: () => {
                    notify.success(`Cow #${tag} registered!`, {
                      description: "Animal saved to PostgreSQL and displayed at the top of herd inventory.",
                    });
                    setTagInput("");
                    setBirthDate("");
                    setSireSelection("");
                    setManualSireTag("");
                    setDamSelection("");
                    setManualDamTag("");
                    setPenInput("");
                    setWeightInput("");
                    setPreviousOwner("");
                    setPreviousCalvingDate("");
                    setPreviousLactationCount("");
                    setHistoryRemarks("");
                    setShowHistory(false);
                    onDataUpdated?.();
                    setTimeout(() => handleOpenChange(false), 800);
                  },
                  onError: (err: any) => {
                    const msg = err?.message || "Failed to save animal.";
                    notify.error(msg);
                  },
                }
              );
            }}
            className="space-y-4 pt-1"
          >
            {/* 1. BASIC INFORMATION (STREAMLINED 1-MINUTE WORKER ENTRY) */}
            <div className="space-y-3.5">
              {/* Cow Number & Breed */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                    <span>Cow / Animal Number *</span>
                    {duplicateMatch && (
                      <span className="text-[11px] font-bold text-destructive">Already Exists!</span>
                    )}
                  </label>
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value.toUpperCase())}
                    placeholder="e.g. 265, C-102, Ganga"
                    className={`mt-1 h-11 rounded-xl text-sm font-black uppercase ${
                      duplicateMatch ? "border-destructive ring-1 ring-destructive focus-visible:ring-destructive" : ""
                    }`}
                    required
                    autoFocus
                  />
                  {duplicateMatch && (
                    <p className="mt-1 text-[11px] font-bold text-destructive flex items-center gap-1">
                      ⚠️ Cow #{duplicateMatch.tag} already exists in herd ({duplicateMatch.breed}, {duplicateMatch.type}).
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                    Breed *
                  </label>
                  <select
                    value={breedInput}
                    onChange={(e) => setBreedInput(e.target.value)}
                    className="mt-1 h-11 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold"
                    required
                  >
                    <option value="Holstein">Holstein Friesian (HF)</option>
                    <option value="Jersey">Jersey</option>
                    <option value="Gir">Gir (Desi Dairy)</option>
                    <option value="Sahiwal">Sahiwal</option>
                    <option value="Murrah">Murrah (Buffalo)</option>
                    <option value="Brown Swiss">Brown Swiss</option>
                    <option value="Guernsey">Guernsey</option>
                    <option value="Crossbred">Crossbred</option>
                    <option value="Other">Other Breed</option>
                  </select>
                </div>
              </div>

              {/* Date of Birth & Dynamic Age Calculator */}
              <div className="rounded-2xl border border-border/80 bg-muted/20 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground">
                    Date of Birth <span className="text-muted-foreground font-normal">(Optional if unknown)</span>
                  </label>
                  <span className="text-[11px] text-muted-foreground">
                    Calculates age automatically
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Input
                    type="date"
                    value={birthDate}
                    max={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="h-10 rounded-xl text-xs font-semibold bg-background"
                  />
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-background border border-border text-xs">
                    <span className="text-muted-foreground font-semibold">Calculated Age:</span>
                    <span className="font-black text-emerald-700 dark:text-emerald-400">
                      {calculateAgeFromDob(birthDate)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Animal Type & Gender (Clean Segmented Selectors) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                    Animal Type
                  </label>
                  <div className="mt-1 grid grid-cols-2 gap-1.5 rounded-xl bg-muted/50 p-1">
                    <button
                      type="button"
                      onClick={() => setAnimalTypeSelection("Adult")}
                      className={`h-9 rounded-lg text-xs font-bold transition-all ${
                        animalTypeSelection === "Adult"
                          ? "bg-background text-foreground shadow-xs font-black"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Adult Cow
                    </button>
                    <button
                      type="button"
                      onClick={() => setAnimalTypeSelection("Calf")}
                      className={`h-9 rounded-lg text-xs font-bold transition-all ${
                        animalTypeSelection === "Calf"
                          ? "bg-background text-foreground shadow-xs font-black"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Calf (ବାଛୁରୀ)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                    Gender
                  </label>
                  <div className="mt-1 grid grid-cols-2 gap-1.5 rounded-xl bg-muted/50 p-1">
                    <button
                      type="button"
                      onClick={() => setGenderSelection("Female")}
                      className={`h-9 rounded-lg text-xs font-bold transition-all ${
                        genderSelection === "Female"
                          ? "bg-background text-foreground shadow-xs font-black"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Female (ମାଈ)
                    </button>
                    <button
                      type="button"
                      onClick={() => setGenderSelection("Male")}
                      className={`h-9 rounded-lg text-xs font-bold transition-all ${
                        genderSelection === "Male"
                          ? "bg-background text-foreground shadow-xs font-black"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Male (ଅଣ୍ଡିରା)
                    </button>
                  </div>
                </div>
              </div>

              {/* Initial Herd Status, Pen Location & Initial Weight */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                    Initial Herd Status
                  </label>
                  <select
                    value={herdStatusSelection}
                    onChange={(e) => setHerdStatusSelection(e.target.value as any)}
                    className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold"
                  >
                    <option value="Active">Active (Healthy)</option>
                    <option value="Sick">Sick (Needs Check)</option>
                    <option value="Aged">Aged / Retired</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                    Pen / Barn Location
                  </label>
                  <Input
                    value={penInput}
                    onChange={(e) => setPenInput(e.target.value)}
                    placeholder="e.g. Barn A, North barn"
                    className="mt-1 h-10 rounded-xl text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                    Initial Weight (kg)
                  </label>
                  <Input
                    type="number"
                    value={weightInput}
                    onChange={(e) => setWeightInput(e.target.value)}
                    placeholder="e.g. 450"
                    className="mt-1 h-10 rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>

              {/* Sire & Dam Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                    Sire / Father (Optional)
                  </label>
                  <select
                    value={sireSelection}
                    onChange={(e) => setSireSelection(e.target.value)}
                    className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-semibold"
                  >
                    <option value="">None / Unknown</option>
                    <option value="manual">+ Enter Manual Tag / Semen Code</option>
                    {animals.filter(a => a.calfSex === "Male" || a.type === "Bull" || (a.tag || "").startsWith("B-") || (a.tag || "").startsWith("Bull")).map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.tag} {a.name && a.name !== a.tag ? `(${a.name})` : ""} · {a.breed}
                      </option>
                    ))}
                    {animals.filter(a => !(a.calfSex === "Male" || a.type === "Bull" || (a.tag || "").startsWith("B-") || (a.tag || "").startsWith("Bull"))).map((a) => (
                      <option key={a.id} value={a.id}>
                        Cow #{a.tag}
                      </option>
                    ))}
                  </select>
                  {sireSelection === "manual" && (
                    <Input
                      value={manualSireTag}
                      onChange={(e) => setManualSireTag(e.target.value.toUpperCase())}
                      placeholder="Sire Tag / Semen Code (e.g. ABS-901)"
                      className="mt-1.5 h-9 rounded-xl text-xs uppercase font-bold"
                    />
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                    Dam / Mother (Optional)
                  </label>
                  <select
                    value={damSelection}
                    onChange={(e) => setDamSelection(e.target.value)}
                    className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-semibold"
                  >
                    <option value="">None / Unknown</option>
                    <option value="manual">+ Enter Manual Tag</option>
                    {animals.map((a) => (
                      <option key={a.id} value={a.id}>
                        Cow #{a.tag} {a.name && a.name !== a.tag ? `(${a.name})` : ""} · {a.breed}
                      </option>
                    ))}
                  </select>
                  {damSelection === "manual" && (
                    <Input
                      value={manualDamTag}
                      onChange={(e) => setManualDamTag(e.target.value.toUpperCase())}
                      placeholder="Dam Tag (e.g. 509, C-101)"
                      className="mt-1.5 h-9 rounded-xl text-xs uppercase font-bold"
                    />
                  )}
                </div>
              </div>

              {/* 2. EXPANDABLE ANIMAL HISTORY (OPTIONAL & COLLAPSIBLE) */}
              <div className="rounded-2xl border border-border/80 bg-muted/10 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowHistory((prev) => !prev)}
                  className="w-full flex items-center justify-between p-3 text-xs font-extrabold text-foreground hover:bg-muted/30 transition-colors"
                >
                  <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                    <Sparkles className="size-3.5" />
                    + Add Animal History (Optional)
                  </span>
                  {showHistory ? (
                    <ChevronUp className="size-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="size-4 text-muted-foreground" />
                  )}
                </button>

                {showHistory && (
                  <div className="p-3 pt-0 space-y-3 border-t border-border/50 animate-fade-in">
                    <p className="text-[11px] text-muted-foreground">
                      Optional background information for previously calved cows, purchased stock, or pedigree records.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-muted-foreground">
                          Previous Owner / Source
                        </label>
                        <Input
                          value={previousOwner}
                          onChange={(e) => setPreviousOwner(e.target.value)}
                          placeholder="e.g. Anand Dairy Farm, Local Market"
                          className="mt-1 h-10 rounded-xl text-xs font-medium"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-muted-foreground">
                          Birth Status / Calving Type
                        </label>
                        <select
                          value={birthStatus}
                          onChange={(e) => setBirthStatus(e.target.value)}
                          className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-medium"
                        >
                          <option value="Normal">Normal Delivery</option>
                          <option value="Twin">Twin Birth</option>
                          <option value="Assisted">Assisted Delivery</option>
                          <option value="Caesarean">Caesarean / Surgical</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-muted-foreground">
                          Previous Calving Date
                        </label>
                        <Input
                          type="date"
                          value={previousCalvingDate}
                          max={new Date().toISOString().split("T")[0]}
                          onChange={(e) => setPreviousCalvingDate(e.target.value)}
                          className="mt-1 h-10 rounded-xl text-xs font-medium"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-muted-foreground">
                          Previous Lactation Count
                        </label>
                        <Input
                          type="number"
                          min="0"
                          value={previousLactationCount}
                          onChange={(e) => setPreviousLactationCount(e.target.value)}
                          placeholder="e.g. 1 or 2 (0 if heifer)"
                          className="mt-1 h-10 rounded-xl text-xs font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-muted-foreground">
                        Historical Notes & Remarks
                      </label>
                      <Input
                        value={historyRemarks}
                        onChange={(e) => setHistoryRemarks(e.target.value)}
                        placeholder="Pedigree details, previous farm tag, health background..."
                        className="mt-1 h-10 rounded-xl text-xs font-medium"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Inline Action Feedback */}
            <ActionInlineFeedback
              status={addAnimalStatus.status}
              message={addAnimalStatus.message}
              details={addAnimalStatus.details}
            />

            <ActionSubmitButton
              type="submit"
              size="lg"
              status={addAnimalStatus.status}
              submittingText="Saving Animal to Herd..."
              successText="Animal Saved Successfully!"
              errorText="Save Failed · Tap to Retry"
              className="mt-2 h-13 w-full gap-2 rounded-2xl bg-emerald-600 text-sm font-extrabold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-700"
              icon={<Check className="size-4 stroke-[2.5]" />}
            >
              Save Animal to Herd
            </ActionSubmitButton>
          </form>
        )}

        {/* 4. OTHER QUICK ENTRIES (FEEDING, HEALTH, VACCINATION, STOCK, FODDER) */}
        {["feeding", "health", "vaccination", "stock", "fodder"].includes(
          currentAction,
        ) && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              toast.success("Farm entry saved successfully", {
                description: "Recorded in local dairy records.",
              });
              onDataUpdated?.();
              handleOpenChange(false);
            }}
            className="space-y-4 pt-1"
          >
            {currentAction === "feeding" && (
              <>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Feed Type
                  </label>
                  <select
                    name="feedType"
                    className="mt-1 h-12 w-full rounded-xl border border-input bg-background px-3 text-sm font-semibold"
                  >
                    <option>Green fodder (Napier / Maize)</option>
                    <option>Dry fodder (Hay / Straw)</option>
                    <option>Dairy Concentrate pellet</option>
                    <option>Mineral mix supplement</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Quantity Used (kg)
                  </label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    placeholder="e.g. 250"
                    defaultValue="250"
                    className="mt-1 h-12 rounded-xl text-lg font-bold"
                    required
                  />
                </div>
              </>
            )}

            {currentAction === "health" && (
              <>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Select Animal
                  </label>
                  <select
                    name="animal"
                    className="mt-1 h-12 w-full rounded-xl border border-input bg-background px-3 text-sm font-semibold"
                  >
                    {animals.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.tag}) · {a.pen}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Condition / Observation
                  </label>
                  <select
                    name="condition"
                    className="mt-1 h-12 w-full rounded-xl border border-input bg-background px-3 text-sm font-semibold"
                  >
                    <option>Hoof soreness / limping</option>
                    <option>Mild fever / loss of appetite</option>
                    <option>Mastitis / udder swelling</option>
                    <option>Routine checkup passed</option>
                  </select>
                </div>
              </>
            )}

            {currentAction === "vaccination" && (
              <>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Vaccine Administered
                  </label>
                  <select
                    name="vaccine"
                    className="mt-1 h-12 w-full rounded-xl border border-input bg-background px-3 text-sm font-semibold"
                  >
                    <option>FMD (Foot & Mouth Disease) Booster</option>
                    <option>HS & BQ Combined Vaccine</option>
                    <option>Brucellosis S19</option>
                    <option>Anthrax Spore Vaccine</option>
                    <option>Deworming Bolus</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Number of Animals Inoculated
                  </label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    defaultValue="5"
                    className="mt-1 h-12 rounded-xl text-lg font-bold"
                    required
                  />
                </div>
              </>
            )}

            {currentAction === "stock" && (
              <>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Item
                  </label>
                  <select
                    name="stockItem"
                    className="mt-1 h-12 w-full rounded-xl border border-input bg-background px-3 text-sm font-semibold"
                  >
                    <option>Dairy concentrate (50kg bags)</option>
                    <option>Dry hay bales</option>
                    <option>Mineral mixture packs</option>
                    <option>Calcium booster tonic</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Action
                    </label>
                    <select
                      name="actionType"
                      className="mt-1 h-12 w-full rounded-xl border border-input bg-background px-3 text-sm font-semibold"
                    >
                      <option>Stock In (Purchased)</option>
                      <option>Stock Out (Fed)</option>
                      <option>Damaged / Spoilage</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Amount (kg / bags)
                    </label>
                    <Input
                      type="number"
                      placeholder="e.g. 500"
                      className="mt-1 h-12 rounded-xl text-lg font-bold"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {currentAction === "fodder" && (
              <>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Field Plot
                  </label>
                  <select
                    name="field"
                    className="mt-1 h-12 w-full rounded-xl border border-input bg-background px-3 text-sm font-semibold"
                  >
                    <option>North Field 1 (Napier Grass)</option>
                    <option>West Field 2 (Lucerne / Alfalfa)</option>
                    <option>South Field 3 (Fodder Sorghum)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Harvested Quantity (tonnes)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 3.5"
                    className="mt-1 h-12 rounded-xl text-lg font-bold"
                    required
                  />
                </div>
              </>
            )}

            {/* Inline Action Feedback */}
            <ActionInlineFeedback
              status={otherActionStatus.status}
              message={otherActionStatus.message}
              details={otherActionStatus.details}
            />

            <ActionSubmitButton
              type="submit"
              size="lg"
              status={otherActionStatus.status}
              submittingText="Saving Record..."
              successText="Record Saved!"
              errorText="Failed · Tap to Retry"
              className="mt-3 h-14 w-full gap-2 rounded-2xl bg-emerald-600 text-base font-extrabold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-700"
              icon={<Check className="size-5 stroke-[2.5]" />}
            >
              Save Record
            </ActionSubmitButton>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
