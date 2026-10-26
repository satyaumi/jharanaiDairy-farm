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

  // --- ADD ANIMAL & EXPANDED REAL FARM STATE ---
  const [animalSection, setAnimalSection] = useState<"basic" | "production" | "breeding" | "health">("basic");
  const [fatherSelection, setFatherSelection] = useState<string>("");
  const [motherSelection, setMotherSelection] = useState<string>("");
  const [birthDate, setBirthDate] = useState<string>("");
  const [animalStatusCategory, setAnimalStatusCategory] = useState<string>("Mother Active");
  const [milkingStatus, setMilkingStatus] = useState<string>("Milking");
  const [milkingGroup, setMilkingGroup] = useState<string>("A");
  const [aiDate, setAiDate] = useState<string>("");
  const [lastVaccinationDate, setLastVaccinationDate] = useState<string>("");

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
              const form = new FormData(e.currentTarget);
              const tag = String(form.get("tag") || "")
                .trim()
                .toUpperCase();
              const breed = String(form.get("breed") || "Holstein");

              if (!tag) {
                notify.error("Please enter a valid Cow Number.");
                return;
              }

              // Duplicate check
              const isDuplicate = animals.some(
                (a) => (a.tag || "").toUpperCase() === tag,
              );
              if (isDuplicate) {
                notify.error("Duplicate Cow Number", {
                  description: `Cow Number '${tag}' already exists in herd. Please use a unique number.`,
                });
                return;
              }

              const name = tag;
              const todayStr = new Date().toISOString().split("T")[0]!;

              // Resolve Father
              let finalFatherId: string | undefined = undefined;
              let finalFatherTag: string | undefined = undefined;
              let finalFatherName: string | undefined = undefined;

              if (
                fatherSelection &&
                fatherSelection !== "none" &&
                fatherSelection !== "manual" &&
                fatherSelection !== "unknown"
              ) {
                const fa = animals.find((a) => a.id === fatherSelection);
                if (fa) {
                  finalFatherId = fa.id;
                  finalFatherTag = fa.tag;
                  finalFatherName = fa.name;
                }
              } else if (
                fatherSelection === "manual" ||
                fatherSelection === "unknown"
              ) {
                finalFatherTag =
                  String(form.get("manualFatherTag") || "")
                    .trim()
                    .toUpperCase() || undefined;
                finalFatherName =
                  String(form.get("manualFatherName") || "").trim() ||
                  undefined;
              }

              // Resolve Mother
              let finalMotherId: string | undefined = undefined;
              let finalMotherTag: string | undefined = undefined;
              let finalMotherName: string | undefined = undefined;

              if (
                motherSelection &&
                motherSelection !== "none" &&
                motherSelection !== "manual" &&
                motherSelection !== "unknown"
              ) {
                const ma = animals.find((a) => a.id === motherSelection);
                if (ma) {
                  finalMotherId = ma.id;
                  finalMotherTag = ma.tag;
                  finalMotherName = ma.name;
                }
              } else if (
                motherSelection === "manual" ||
                motherSelection === "unknown"
              ) {
                finalMotherTag =
                  String(form.get("manualMotherTag") || "")
                    .trim()
                    .toUpperCase() || undefined;
                finalMotherName =
                  String(form.get("manualMotherName") || "").trim() ||
                  undefined;
              }

              // --- SENSITIVITY & DATE VALIDATION ---
              if (birthDate && birthDate > todayStr) {
                notify.error("Birth Date cannot be in the future.");
                return;
              }

              if (birthDate && aiDate && aiDate < birthDate) {
                notify.error("AI Date cannot be earlier than birth date.");
                return;
              }

              if (aiDate && aiDate > todayStr) {
                notify.error("AI Date cannot be in the future.");
                return;
              }

              if (birthDate && lastVaccinationDate && lastVaccinationDate < birthDate) {
                notify.error("Last Vaccination Date cannot be before birth date.");
                return;
              }

              if (lastVaccinationDate && lastVaccinationDate > todayStr) {
                notify.error("Last Vaccination Date cannot be in the future.");
                return;
              }

              if (finalFatherTag && finalFatherTag === tag) {
                notify.error("Father cannot be the same animal being created.");
                return;
              }

              if (finalMotherTag && finalMotherTag === tag) {
                notify.error("Mother cannot be the same animal being created.");
                return;
              }

              // Dynamic calculated age from DOB
              const calculatedAge = calculateAgeFromDob(birthDate);

              // Additional parsed fields
              const weightVal = parseFloat(String(form.get("weight") || "560")) || 560;
              const yieldVal = parseFloat(String(form.get("yield") || "0")) || 0;
              const bestYieldVal = parseFloat(String(form.get("bestYield") || "0")) || undefined;
              const lactationCycleVal = parseInt(String(form.get("lactationCycle") || "1"), 10) || 1;
              const aiAttemptsCountVal = parseInt(String(form.get("aiAttemptsCount") || "0"), 10) || undefined;
              const penVal = String(form.get("pen") || "North barn");
              const photoUrlVal = String(form.get("photoUrl") || "").trim() || undefined;

              const lastCalvingDateVal = String(form.get("lastCalvingDate") || "").trim() || undefined;
              const heatDateVal = String(form.get("heatDate") || "").trim() || undefined;
              const bullUsedVal = String(form.get("bullUsed") || "").trim() || undefined;
              const dryingDateVal = String(form.get("dryingDate") || "").trim() || undefined;
              const expectedDueDateVal = String(form.get("expectedDueDate") || "").trim() || undefined;
              const calfDobVal = String(form.get("calfDob") || "").trim() || undefined;
              const calfSexVal = String(form.get("calfSex") || "").trim() || undefined;

              const vaccinationStatusVal = String(form.get("vaccinationStatus") || "").trim() || undefined;
              const lastVaccineNameVal = String(form.get("lastVaccineName") || "").trim() || undefined;
              const medicineUsedVal = String(form.get("medicineUsed") || "").trim() || undefined;
              const medicineDoseVal = String(form.get("medicineDose") || "").trim() || undefined;
              const remarksVal = String(form.get("remarks") || "").trim() || undefined;

              const aiSuccessStr = String(form.get("aiSuccess") || "");
              const aiSuccessVal = aiSuccessStr === "Yes" ? true : aiSuccessStr === "No" ? false : undefined;

              // Build initial chronological timeline
              const initialTimeline = [];
              if (birthDate) {
                initialTimeline.push({
                  id: `tl-birth-${Date.now()}`,
                  type: "added" as const,
                  title: "Birth Recorded",
                  date: birthDate,
                  detail: `Born on farm${finalMotherTag ? `. Dam: ${finalMotherTag}` : ""}`,
                  badge: "Birth",
                });
              }
              initialTimeline.push({
                id: `tl-reg-${Date.now()}`,
                type: "added" as const,
                title: "Animal Added to Herd",
                date: "Today",
                detail: `${name} (${tag}) registered into the dairy herd. Status: ${animalStatusCategory}`,
                badge: "Registered",
              });
              if (lastVaccinationDate) {
                initialTimeline.push({
                  id: `tl-vac-${Date.now()}`,
                  type: "vaccination" as const,
                  title: "Vaccination Verified",
                  date: lastVaccinationDate,
                  detail: `Vaccine: ${lastVaccineNameVal || "Scheduled dose"} verified.`,
                  badge: "Vaccinated",
                });
              }
              if (aiDate) {
                initialTimeline.push({
                  id: `tl-ai-${Date.now()}`,
                  type: "pregnancy" as const,
                  title: "Artificial Insemination (AI)",
                  date: aiDate,
                  detail: `Insemination recorded on ${aiDate}${bullUsedVal ? ` with Bull: ${bullUsedVal}` : ""}.`,
                  badge: "AI Done",
                });
              }

              const newAnimal: Animal = {
                id: `a-${Date.now()}`,
                name,
                tag,
                breed,
                type: animalStatusCategory === "Calf" ? "Calf" : milkingStatus.startsWith("Dry") ? "Dry" : "Lactating",
                status: animalStatusCategory.includes("Sick") ? "Sick" : "Healthy",
                animalStatusCategory,
                milkingStatus,
                milkingGroup,
                age: calculatedAge,
                weight: weightVal,
                yield: yieldVal,
                bestYield: bestYieldVal,
                pen: penVal,
                lactationCycle: lactationCycleVal,
                feedRation: "18 kg Green + 4 kg Concentrate",
                birthDate: birthDate || undefined,
                fatherAnimalId: finalFatherId,
                fatherTag: finalFatherTag,
                fatherName: finalFatherName,
                motherAnimalId: finalMotherId,
                motherTag: finalMotherTag,
                motherName: finalMotherName,
                aiDate: aiDate || undefined,
                lastVaccinationDate: lastVaccinationDate || undefined,
                lastCalvingDate: lastCalvingDateVal,
                heatDate: heatDateVal,
                aiAttemptsCount: aiAttemptsCountVal,
                aiSuccess: aiSuccessVal,
                bullUsed: bullUsedVal,
                dryingDate: dryingDateVal,
                expectedDueDate: expectedDueDateVal,
                calfDob: calfDobVal,
                calfSex: calfSexVal,
                vaccinationStatus: vaccinationStatusVal,
                lastVaccineName: lastVaccineNameVal,
                medicineUsed: medicineUsedVal,
                medicineDose: medicineDoseVal,
                remarks: remarksVal,
                photoUrl: photoUrlVal,
                timeline: initialTimeline,
              };

              await addAnimalStatus.execute(
                async () => {
                  return await farmService.saveAnimal(newAnimal);
                },
                {
                  submittingMessage: `Saving ${tag} to herd...`,
                  successMessage: `${name} (${tag}) added to herd successfully!`,
                  onSuccess: () => {
                    notify.success(`${name} (${tag}) added to herd!`, {
                      description: "Animal profile and all farm records saved.",
                    });
                    setBirthDate("");
                    setAiDate("");
                    setLastVaccinationDate("");
                    setFatherSelection("");
                    setMotherSelection("");
                    onDataUpdated?.();
                    setTimeout(() => handleOpenChange(false), 900);
                  },
                  onError: (err: any) => {
                    notify.error(err?.message || "Failed to save animal. Form inputs preserved.");
                  },
                }
              );
            }}
            className="space-y-3.5 pt-1"
          >
            {/* SECTION SELECTOR TABS */}
            <div className="grid grid-cols-4 gap-1 rounded-xl bg-muted/60 p-1 text-xs">
              <button
                type="button"
                onClick={() => setAnimalSection("basic")}
                className={`py-1.5 px-2 rounded-lg font-bold transition-all text-center ${
                  animalSection === "basic"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                1. Basic Info
              </button>
              <button
                type="button"
                onClick={() => setAnimalSection("production")}
                className={`py-1.5 px-2 rounded-lg font-bold transition-all text-center ${
                  animalSection === "production"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                2. Production
              </button>
              <button
                type="button"
                onClick={() => setAnimalSection("breeding")}
                className={`py-1.5 px-2 rounded-lg font-bold transition-all text-center ${
                  animalSection === "breeding"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                3. Breeding
              </button>
              <button
                type="button"
                onClick={() => setAnimalSection("health")}
                className={`py-1.5 px-2 rounded-lg font-bold transition-all text-center ${
                  animalSection === "health"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                4. Health
              </button>
            </div>

            {/* SECTION 1: BASIC INFORMATION */}
            {animalSection === "basic" && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Cow / Animal Number *
                    </label>
                    <Input
                      name="tag"
                      placeholder="e.g. 243, A-18, C-2026"
                      className="mt-1 h-11 rounded-xl text-sm font-bold uppercase"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Breed
                    </label>
                    <select
                      name="breed"
                      className="mt-1 h-11 w-full rounded-xl border border-input bg-background px-3 text-xs font-semibold"
                    >
                      <option value="Holstein">Holstein Friesian (HF)</option>
                      <option value="Jersey">Jersey</option>
                      <option value="Gir">Gir (Desi Dairy)</option>
                      <option value="Sahiwal">Sahiwal</option>
                      <option value="Murrah">Murrah (Buffalo)</option>
                      <option value="Brown Swiss">Brown Swiss</option>
                      <option value="Guernsey">Guernsey</option>
                      <option value="Crossbred">Crossbred</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Date of Birth & Live Dynamic Age Display */}
                <div className="rounded-xl border border-border/80 bg-muted/20 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground">
                      Date of Birth
                    </label>
                    <span className="text-[11px] text-muted-foreground">
                      Recalculates age automatically
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Input
                      type="date"
                      name="birthDate"
                      value={birthDate}
                      max={new Date().toISOString().split("T")[0]}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="h-10 rounded-xl text-xs font-medium"
                    />
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-background border border-border text-xs">
                      <span className="text-muted-foreground font-semibold">Calculated Age:</span>
                      <span className="font-black text-emerald-800 dark:text-emerald-300">
                        {calculateAgeFromDob(birthDate)}
                      </span>
                    </div>
                  </div>
                  {birthDate && (
                    <p className="text-[11px] text-muted-foreground">
                      <strong>Date of Birth:</strong> {formatDateDisplay(birthDate)} · <strong>Age:</strong> {calculateAgeFromDob(birthDate)}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground">
                      Animal Status
                    </label>
                    <select
                      value={animalStatusCategory}
                      onChange={(e) => setAnimalStatusCategory(e.target.value)}
                      className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-semibold"
                    >
                      <option value="Mother Active">Mother Active</option>
                      <option value="Calf">Calf</option>
                      <option value="Herd">Herd</option>
                      <option value="Mother Sick">Mother Sick</option>
                      <option value="Calf Sick">Calf Sick</option>
                      <option value="Aged">Aged</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-muted-foreground">
                      Weight (kg)
                    </label>
                    <Input
                      type="number"
                      name="weight"
                      defaultValue="560"
                      className="mt-1 h-10 rounded-xl text-xs font-semibold"
                    />
                  </div>
                </div>

                {/* Sire & Dam Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground">
                      Sire (Father)
                    </label>
                    <select
                      value={fatherSelection}
                      onChange={(e) => setFatherSelection(e.target.value)}
                      className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-medium"
                    >
                      <option value="">Select Existing (Optional)</option>
                      <option value="manual">+ Enter Manual Tag</option>
                      {animals.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.tag} · {a.name}
                        </option>
                      ))}
                    </select>
                    {fatherSelection === "manual" && (
                      <Input
                        name="manualFatherTag"
                        placeholder="Sire Tag / Semen Code"
                        className="mt-1 h-9 rounded-lg text-xs uppercase"
                      />
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground">
                      Dam (Mother)
                    </label>
                    <select
                      value={motherSelection}
                      onChange={(e) => setMotherSelection(e.target.value)}
                      className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-medium"
                    >
                      <option value="">Select Existing (Optional)</option>
                      <option value="manual">+ Enter Manual Tag</option>
                      {animals.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.tag} · {a.name}
                        </option>
                      ))}
                    </select>
                    {motherSelection === "manual" && (
                      <Input
                        name="manualMotherTag"
                        placeholder="Dam Tag (e.g. 509)"
                        className="mt-1 h-9 rounded-lg text-xs uppercase"
                      />
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground">
                    Photo URL (Optional)
                  </label>
                  <Input
                    name="photoUrl"
                    placeholder="https://... / photo link"
                    className="mt-1 h-10 rounded-xl text-xs"
                  />
                </div>
              </div>
            )}

            {/* SECTION 2: PRODUCTION & GROUPING */}
            {animalSection === "production" && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground">
                      Milking Status
                    </label>
                    <select
                      value={milkingStatus}
                      onChange={(e) => setMilkingStatus(e.target.value)}
                      className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-semibold"
                    >
                      <option value="Milking">Milking</option>
                      <option value="Dry NP">Dry NP (Non-Pregnant)</option>
                      <option value="Milking NP">Milking NP (Non-Pregnant)</option>
                      <option value="Dry P">Dry P (Pregnant)</option>
                      <option value="Milking P">Milking P (Pregnant)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-muted-foreground">
                      Milking Group (A–F)
                    </label>
                    <select
                      value={milkingGroup}
                      onChange={(e) => setMilkingGroup(e.target.value)}
                      className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-semibold"
                    >
                      <option value="A">Group A (High Yielders)</option>
                      <option value="B">Group B (Mid Yielders)</option>
                      <option value="C">Group C (Low Yielders)</option>
                      <option value="D">Group D (Fresh Calved)</option>
                      <option value="E">Group E (Dry Cows)</option>
                      <option value="F">Group F (Heifers / Calves)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground">
                      Lactation Count
                    </label>
                    <Input
                      type="number"
                      name="lactationCycle"
                      defaultValue="1"
                      min="0"
                      className="mt-1 h-10 rounded-xl text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-muted-foreground">
                      Avg Daily Milk (L)
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      name="yield"
                      defaultValue="15.0"
                      className="mt-1 h-10 rounded-xl text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-muted-foreground">
                      Best Yield (L)
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      name="bestYield"
                      placeholder="e.g. 28.5"
                      className="mt-1 h-10 rounded-xl text-xs font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground">
                    Pen / Barn Location
                  </label>
                  <Input
                    name="pen"
                    defaultValue="North barn"
                    className="mt-1 h-10 rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>
            )}

            {/* SECTION 3: BREEDING & REPRODUCTION */}
            {animalSection === "breeding" && (
              <div className="space-y-3">
                {animalStatusCategory === "Calf" && (
                  <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-2.5 text-xs text-blue-900 dark:text-blue-200">
                    ℹ️ <strong>Calf Selected:</strong> Reproduction & AI fields are optional and generally not required for calves.
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground">
                      Last Calving Date
                    </label>
                    <Input
                      type="date"
                      name="lastCalvingDate"
                      max={new Date().toISOString().split("T")[0]}
                      className="mt-1 h-10 rounded-xl text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-muted-foreground">
                      Heat Date
                    </label>
                    <Input
                      type="date"
                      name="heatDate"
                      max={new Date().toISOString().split("T")[0]}
                      className="mt-1 h-10 rounded-xl text-xs font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground">
                      AI Attempts Count
                    </label>
                    <Input
                      type="number"
                      name="aiAttemptsCount"
                      defaultValue="1"
                      min="0"
                      className="mt-1 h-10 rounded-xl text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-muted-foreground">
                      Last AI Date
                    </label>
                    <Input
                      type="date"
                      name="aiDate"
                      value={aiDate}
                      onChange={(e) => setAiDate(e.target.value)}
                      max={new Date().toISOString().split("T")[0]}
                      className="mt-1 h-10 rounded-xl text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-muted-foreground">
                      AI Success
                    </label>
                    <select
                      name="aiSuccess"
                      className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-semibold"
                    >
                      <option value="">Pending / Unknown</option>
                      <option value="Yes">Yes (Pregnant)</option>
                      <option value="No">No (Not Pregnant)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground">
                      Bull Used / Semen
                    </label>
                    <Input
                      name="bullUsed"
                      placeholder="e.g. ABS-901"
                      className="mt-1 h-10 rounded-xl text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-muted-foreground">
                      Drying Date
                    </label>
                    <Input
                      type="date"
                      name="dryingDate"
                      className="mt-1 h-10 rounded-xl text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-muted-foreground">
                      Expected Due Date
                    </label>
                    <Input
                      type="date"
                      name="expectedDueDate"
                      className="mt-1 h-10 rounded-xl text-xs font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 border-t border-border/60 pt-2.5">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground">
                      Calf Date of Birth
                    </label>
                    <Input
                      type="date"
                      name="calfDob"
                      max={new Date().toISOString().split("T")[0]}
                      className="mt-1 h-10 rounded-xl text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-muted-foreground">
                      Calf Sex
                    </label>
                    <select
                      name="calfSex"
                      className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-semibold"
                    >
                      <option value="">Select Calf Sex</option>
                      <option value="Female">Female (Heifer)</option>
                      <option value="Male">Male (Bull Calf)</option>
                      <option value="Unknown">Unknown</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 4: HEALTH & VACCINATION */}
            {animalSection === "health" && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground">
                      Vaccination Status
                    </label>
                    <select
                      name="vaccinationStatus"
                      className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-semibold"
                    >
                      <option value="All Completed">All Completed</option>
                      <option value="Part Completed">Part Completed</option>
                      <option value="None">None</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-muted-foreground">
                      Last Vaccine Name
                    </label>
                    <Input
                      name="lastVaccineName"
                      placeholder="e.g. FMD + HS"
                      defaultValue="FMD"
                      className="mt-1 h-10 rounded-xl text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-muted-foreground">
                      Vaccination Date
                    </label>
                    <Input
                      type="date"
                      name="lastVaccinationDate"
                      value={lastVaccinationDate}
                      onChange={(e) => setLastVaccinationDate(e.target.value)}
                      max={new Date().toISOString().split("T")[0]}
                      className="mt-1 h-10 rounded-xl text-xs font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground">
                      Medicine Used
                    </label>
                    <Input
                      name="medicineUsed"
                      placeholder="e.g. Oxytetracycline"
                      className="mt-1 h-10 rounded-xl text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-muted-foreground">
                      Dose (ml / mg)
                    </label>
                    <Input
                      name="medicineDose"
                      placeholder="e.g. 20 ml"
                      className="mt-1 h-10 rounded-xl text-xs font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground">
                    Health Notes & Remarks
                  </label>
                  <Input
                    name="remarks"
                    placeholder="Enter any additional treatment, growth or farm notes..."
                    className="mt-1 h-10 rounded-xl text-xs font-medium"
                  />
                </div>
              </div>
            )}

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
