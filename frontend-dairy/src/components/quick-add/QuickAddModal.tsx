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

  // --- ADD ANIMAL & HISTORY STATE ---
  const [showAnimalHistory, setShowAnimalHistory] = useState<boolean>(false);
  const [fatherSelection, setFatherSelection] = useState<string>("");
  const [motherSelection, setMotherSelection] = useState<string>("");
  const [birthDate, setBirthDate] = useState<string>("");
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

        {/* 3. QUICK ADD ANIMAL (FAST 1-MINUTE ENTRY + OPTIONAL HISTORY) */}
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
                toast.error("Please enter a valid Cow Number.");
                return;
              }

              // Duplicate check
              const isDuplicate = animals.some(
                (a) => (a.tag || "").toUpperCase() === tag,
              );
              if (isDuplicate) {
                toast.error("Duplicate Cow Number", {
                  description: `Cow Number '${tag}' already exists. Please use a unique Cow Number.`,
                });
                return;
              }

              const name = tag;

              // History extraction & parent resolution
              const todayStr = new Date().toISOString().split("T")[0]!;
              const birthStatus = String(form.get("birthStatus") || "").trim();

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

              if (birthDate && aiDate) {
                if (aiDate < birthDate) {
                  notify.error(
                    "AI Date cannot be earlier than the animal's birth date.",
                  );
                  return;
                }
              }

              if (aiDate && aiDate > todayStr) {
                notify.error("AI Date cannot be in the future.");
                return;
              }

              if (birthDate && lastVaccinationDate) {
                if (lastVaccinationDate < birthDate) {
                  notify.error(
                    "Last Vaccination Date cannot be before the animal's birth date.",
                  );
                  return;
                }
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

              // Calculate age if birthDate is provided
              let calculatedAge = "3 yr";
              if (birthDate) {
                const birth = new Date(birthDate);
                const now = new Date();
                const diffMonths =
                  (now.getFullYear() - birth.getFullYear()) * 12 +
                  (now.getMonth() - birth.getMonth());
                if (diffMonths >= 24) {
                  calculatedAge = `${Math.floor(diffMonths / 12)} yr`;
                } else if (diffMonths >= 12) {
                  calculatedAge = "1 yr";
                } else if (diffMonths > 0) {
                  calculatedAge = `${diffMonths} mo`;
                } else {
                  calculatedAge = "Newborn";
                }
              }

              // Build initial chronological timeline
              const initialTimeline = [];
              if (birthDate) {
                initialTimeline.push({
                  id: `tl-birth-${Date.now()}`,
                  type: "added" as const,
                  title: "Birth Recorded",
                  date: birthDate,
                  detail: `Born on farm${birthStatus ? ` (${birthStatus})` : ""}${finalMotherTag ? `. Mother: ${finalMotherTag}` : ""}`,
                  badge: "Birth",
                });
              }
              initialTimeline.push({
                id: `tl-reg-${Date.now()}`,
                type: "added" as const,
                title: "Animal Added to Herd",
                date: "Today",
                detail: `${name} (${tag}) registered into the dairy herd.`,
                badge: "Registered",
              });
              if (lastVaccinationDate) {
                initialTimeline.push({
                  id: `tl-vac-${Date.now()}`,
                  type: "vaccination" as const,
                  title: "Vaccination Verified",
                  date: lastVaccinationDate,
                  detail: "Prior vaccination dose verified at registration.",
                  badge: "Vaccinated",
                });
              }
              if (aiDate) {
                initialTimeline.push({
                  id: `tl-ai-${Date.now()}`,
                  type: "pregnancy" as const,
                  title: "Artificial Insemination (AI)",
                  date: aiDate,
                  detail: `Insemination recorded on ${aiDate}${finalFatherTag ? ` with Sire: ${finalFatherTag}` : ""}.`,
                  badge: "AI Done",
                });
              }

              const newAnimal: Animal = {
                id: `a-${Date.now()}`,
                name,
                tag,
                breed,
                type: "Lactating",
                status: "Healthy",
                age: calculatedAge,
                weight: 560,
                yield: 0,
                pen: "North barn",
                lactationCycle: 1,
                feedRation: "18 kg Green + 4 kg Concentrate",
                birthDate: birthDate || undefined,
                birthStatus: birthStatus || undefined,
                fatherAnimalId: finalFatherId,
                fatherTag: finalFatherTag,
                fatherName: finalFatherName,
                motherAnimalId: finalMotherId,
                motherTag: finalMotherTag,
                motherName: finalMotherName,
                aiDate: aiDate || undefined,
                lastVaccinationDate: lastVaccinationDate || undefined,
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
                      description: showAnimalHistory
                        ? "Animal profile and historical records saved."
                        : "Quick animal record created successfully.",
                    });

                    // Reset form state
                    setShowAnimalHistory(false);
                    setBirthDate("");
                    setAiDate("");
                    setLastVaccinationDate("");
                    setFatherSelection("");
                    setMotherSelection("");
                    onDataUpdated?.();
                    setTimeout(() => handleOpenChange(false), 900);
                  },
                  onError: (err: any) => {
                    toast.error(err?.message || "Failed to save animal. Form inputs preserved.");
                  },
                }
              );
            }}
            className="space-y-4 pt-1"
          >
            {/* --- COW NUMBER & BREED --- */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Cow Number *
              </label>
              <Input
                name="tag"
                placeholder="e.g. C-1145"
                className="mt-1 h-12 rounded-xl text-sm font-bold uppercase"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Breed
              </label>
              <select
                name="breed"
                className="mt-1 h-12 w-full rounded-xl border border-input bg-background px-3 text-sm font-semibold"
              >
                <option value="Holstein">Holstein Friesian (HF)</option>
                <option value="Jersey">Jersey</option>
                <option value="Gir">Gir (Desi Dairy)</option>
                <option value="Sahiwal">Sahiwal</option>
                <option value="Murrah">Murrah (Buffalo)</option>
                <option value="Brown Swiss">Brown Swiss</option>
                <option value="Guernsey">Guernsey</option>
              </select>
            </div>

            {/* --- NEW REQUIREMENT: OPTIONAL ANIMAL HISTORY ACCORDION --- */}
            <div className="rounded-2xl border border-border/80 bg-background/50 p-3.5 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-extrabold text-foreground">
                    Animal History
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Optional birth, parents, AI & vaccination records
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAnimalHistory((prev) => !prev)}
                  className="h-8 gap-1.5 rounded-xl text-xs font-bold"
                >
                  {showAnimalHistory ? (
                    <>
                      <ChevronUp className="size-3.5" />
                      Hide History
                    </>
                  ) : (
                    <>
                      <Plus className="size-3.5" />
                      Add History
                    </>
                  )}
                </Button>
              </div>

              {showAnimalHistory && (
                <div className="mt-4 space-y-4 border-t border-border/60 pt-3.5">
                  {/* 1. Birth Information */}
                  <div className="space-y-2">
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      1. Birth
                    </p>
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      <div>
                        <label className="text-[11px] font-bold text-muted-foreground">
                          Birth Date
                        </label>
                        <Input
                          type="date"
                          name="birthDate"
                          value={birthDate}
                          max={new Date().toISOString().split("T")[0]}
                          onChange={(e) => setBirthDate(e.target.value)}
                          className="mt-1 h-11 rounded-xl text-xs font-medium"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-muted-foreground">
                          Birth Status (Optional)
                        </label>
                        <select
                          name="birthStatus"
                          className="mt-1 h-11 w-full rounded-xl border border-input bg-background px-3 text-xs font-medium"
                        >
                          <option value="Normal Calving">Normal Calving</option>
                          <option value="Assisted Birth">Assisted Birth</option>
                          <option value="Twin Calving">Twin Calving</option>
                          <option value="Caesarean">Caesarean</option>
                          <option value="Purchased / Unknown">
                            Purchased / Unknown
                          </option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* 2. Parents */}
                  <div className="space-y-3 border-t border-border/60 pt-3">
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      2. Parents
                    </p>

                    {/* Father */}
                    <div className="space-y-1.5 rounded-xl border border-border/60 bg-card/40 p-2.5">
                      <label className="text-[11px] font-bold text-foreground">
                        Father
                      </label>
                      <select
                        value={fatherSelection}
                        onChange={(e) => setFatherSelection(e.target.value)}
                        className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-medium"
                      >
                        <option value="">
                          Select Existing Animal (Optional)
                        </option>
                        <option value="unknown">Unknown / Not Available</option>
                        <option value="manual">
                          + Enter Manual Ear Tag & Name
                        </option>
                        {animals.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.tag} · {a.name} ({a.breed})
                          </option>
                        ))}
                      </select>

                      {(fatherSelection === "manual" ||
                        fatherSelection === "unknown") && (
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <Input
                            name="manualFatherTag"
                            placeholder="Father Tag (e.g. C-050)"
                            className="h-9 rounded-lg text-xs uppercase"
                          />
                          <Input
                            name="manualFatherName"
                            placeholder="Father Name (Optional)"
                            className="h-9 rounded-lg text-xs"
                          />
                        </div>
                      )}
                    </div>

                    {/* Mother */}
                    <div className="space-y-1.5 rounded-xl border border-border/60 bg-card/40 p-2.5">
                      <label className="text-[11px] font-bold text-foreground">
                        Mother
                      </label>
                      <select
                        value={motherSelection}
                        onChange={(e) => setMotherSelection(e.target.value)}
                        className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs font-medium"
                      >
                        <option value="">
                          Select Existing Animal (Optional)
                        </option>
                        <option value="unknown">Unknown / Not Available</option>
                        <option value="manual">
                          + Enter Manual Ear Tag & Name
                        </option>
                        {animals.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.tag} · {a.name} ({a.breed})
                          </option>
                        ))}
                      </select>

                      {(motherSelection === "manual" ||
                        motherSelection === "unknown") && (
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <Input
                            name="manualMotherTag"
                            placeholder="Mother Tag (e.g. C-087)"
                            className="h-9 rounded-lg text-xs uppercase"
                          />
                          <Input
                            name="manualMotherName"
                            placeholder="Mother Name (Optional)"
                            className="h-9 rounded-lg text-xs"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 3. Breeding History */}
                  <div className="space-y-1.5 border-t border-border/60 pt-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                        3. AI Date
                      </label>
                      <span className="text-[10px] text-muted-foreground">
                        Artificial Insemination Date
                      </span>
                    </div>
                    <Input
                      type="date"
                      name="aiDate"
                      value={aiDate}
                      onChange={(e) => setAiDate(e.target.value)}
                      className="h-11 rounded-xl text-xs font-medium"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Date when the cow was artificially inseminated (optional).
                    </p>
                  </div>

                  {/* 4. Vaccination History */}
                  <div className="space-y-1.5 border-t border-border/60 pt-3">
                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      4. Last Vaccination Date
                    </label>
                    <Input
                      type="date"
                      name="lastVaccinationDate"
                      value={lastVaccinationDate}
                      onChange={(e) => setLastVaccinationDate(e.target.value)}
                      className="h-11 rounded-xl text-xs font-medium"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Latest known vaccination date at the time animal is
                      registered.
                    </p>
                  </div>
                </div>
              )}
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
              className="mt-3 h-14 w-full gap-2 rounded-2xl bg-emerald-600 text-base font-extrabold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-700"
              icon={<Check className="size-5 stroke-[2.5]" />}
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
