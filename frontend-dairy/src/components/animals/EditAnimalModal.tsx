import React, { useState, useEffect } from "react";
import {
  Edit3,
  Check,
  Calendar,
  AlertTriangle,
  Loader2,
  Users,
  Sparkles,
  ShieldCheck,
  Info,
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
import { farmService } from "@/services/farm-service";
import type { Animal, AnimalType, AnimalStatus, UpdateAnimalData } from "@/types/farm";
import { calculateAgeFromDob, formatDateDisplay } from "@/lib/age-calculator";

interface EditAnimalModalProps {
  animal: Animal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableAnimals: Animal[];
  onAnimalUpdated: (updated: Animal) => void;
}

export function EditAnimalModal({
  animal,
  open,
  onOpenChange,
  availableAnimals,
  onAnimalUpdated,
}: EditAnimalModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvancedHistory, setShowAdvancedHistory] = useState(false);
  const [activeTab, setActiveTab] = useState<"basic" | "production" | "breeding" | "health">("basic");

  // Form Fields State
  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [breed, setBreed] = useState("Holstein");
  const [animalType, setAnimalType] = useState<AnimalType>("Lactating");
  const [status, setStatus] = useState<AnimalStatus>("Healthy");
  const [animalStatusCategory, setAnimalStatusCategory] = useState("Mother Active");
  const [milkingStatus, setMilkingStatus] = useState("Milking");
  const [milkingGroup, setMilkingGroup] = useState("A");
  const [weight, setWeight] = useState<string>("");
  const [pen, setPen] = useState("");
  const [lactationCycle, setLactationCycle] = useState<number>(1);
  const [bestYield, setBestYield] = useState<string>("");
  const [feedRation, setFeedRation] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthStatus, setBirthStatus] = useState("");
  const [fatherSelection, setFatherSelection] = useState("");
  const [manualFatherTag, setManualFatherTag] = useState("");
  const [manualFatherName, setManualFatherName] = useState("");
  const [motherSelection, setMotherSelection] = useState("");
  const [manualMotherTag, setManualMotherTag] = useState("");
  const [manualMotherName, setManualMotherName] = useState("");
  const [aiDate, setAiDate] = useState("");
  const [lastCalvingDate, setLastCalvingDate] = useState("");
  const [heatDate, setHeatDate] = useState("");
  const [aiAttemptsCount, setAiAttemptsCount] = useState<string>("1");
  const [aiSuccess, setAiSuccess] = useState<string>("");
  const [bullUsed, setBullUsed] = useState("");
  const [dryingDate, setDryingDate] = useState("");
  const [calfDob, setCalfDob] = useState("");
  const [calfSex, setCalfSex] = useState("");
  const [vaccinationStatus, setVaccinationStatus] = useState("All Completed");
  const [lastVaccineName, setLastVaccineName] = useState("FMD");
  const [lastVaccinationDate, setLastVaccinationDate] = useState("");
  const [medicineUsed, setMedicineUsed] = useState("");
  const [medicineDose, setMedicineDose] = useState("");
  const [remarks, setRemarks] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [lastHealthCheck, setLastHealthCheck] = useState("");

  // Sync state when animal prop changes
  useEffect(() => {
    if (animal) {
      setName(animal.name || "");
      setTag(animal.tag || "");
      setBreed(animal.breed || "Holstein");
      setAnimalType(animal.type || "Lactating");
      setStatus(animal.status || "Healthy");
      setWeight(animal.weight ? String(animal.weight) : "");
      setPen(animal.pen || "");
      setLactationCycle(animal.lactationCycle || 1);
      setFeedRation(animal.feedRation || "");
      setDueDate(animal.dueDate || "");
      setBirthDate(animal.birthDate || "");
      setBirthStatus(animal.birthStatus || "");
      setAiDate(animal.aiDate || "");
      setLastVaccinationDate(animal.lastVaccinationDate || "");
      setLastHealthCheck(animal.lastHealthCheck || "");

      setAnimalStatusCategory(animal.animalStatusCategory || (animal.type === "Calf" ? "Calf" : "Mother Active"));
      setMilkingStatus(animal.milkingStatus || (animal.type === "Dry" ? "Dry NP" : "Milking"));
      setMilkingGroup(animal.milkingGroup || "A");
      setBestYield(animal.bestYield !== undefined ? String(animal.bestYield) : "");
      setLastCalvingDate(animal.lastCalvingDate || "");
      setHeatDate(animal.heatDate || "");
      setAiAttemptsCount(animal.aiAttemptsCount !== undefined ? String(animal.aiAttemptsCount) : "1");
      setAiSuccess(animal.aiSuccess === true ? "Yes" : animal.aiSuccess === false ? "No" : "");
      setBullUsed(animal.bullUsed || "");
      setDryingDate(animal.dryingDate || "");
      setCalfDob(animal.calfDob || "");
      setCalfSex(animal.calfSex || "");
      setVaccinationStatus(animal.vaccinationStatus || "All Completed");
      setLastVaccineName(animal.lastVaccineName || "FMD");
      setMedicineUsed(animal.medicineUsed || "");
      setMedicineDose(animal.medicineDose || "");
      setRemarks(animal.remarks || "");
      setPhotoUrl(animal.photoUrl || "");

      // Father init
      if (animal.fatherAnimalId) {
        setFatherSelection(animal.fatherAnimalId);
        setManualFatherTag("");
        setManualFatherName("");
      } else if (animal.fatherTag) {
        setFatherSelection("manual");
        setManualFatherTag(animal.fatherTag);
        setManualFatherName(animal.fatherName || "");
      } else {
        setFatherSelection("");
        setManualFatherTag("");
        setManualFatherName("");
      }

      // Mother init
      if (animal.motherAnimalId) {
        setMotherSelection(animal.motherAnimalId);
        setManualMotherTag("");
        setManualMotherName("");
      } else if (animal.motherTag) {
        setMotherSelection("manual");
        setManualMotherTag(animal.motherTag);
        setManualMotherName(animal.motherName || "");
      } else {
        setMotherSelection("");
        setManualMotherTag("");
        setManualMotherName("");
      }

      setShowAdvancedHistory(
        Boolean(
          animal.birthDate ||
            animal.fatherTag ||
            animal.motherTag ||
            animal.aiDate ||
            animal.lastVaccinationDate,
        ),
      );
    }
  }, [animal]);

  if (!animal) return null;

  const todayStr = new Date().toISOString().split("T")[0]!;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedTag = tag.trim().toUpperCase();

    if (!trimmedTag) {
      toast.error("Validation Error", { description: "Cow Number is required." });
      return;
    }

    // Client-side Cow Number duplicate check (excluding self)
    const isDuplicate = availableAnimals.some(
      (a) => a.id !== animal.id && (a.tag || "").toUpperCase() === trimmedTag,
    );
    if (isDuplicate) {
      toast.error("Duplicate Cow Number", {
        description: `Cow Number '${trimmedTag}' already exists. Please choose a unique number.`,
      });
      return;
    }

    // Date validations
    if (birthDate && birthDate > todayStr) {
      toast.error("Validation Error", { description: "Birth date cannot be in the future." });
      return;
    }
    if (aiDate && aiDate > todayStr) {
      toast.error("Validation Error", { description: "AI date cannot be in the future." });
      return;
    }
    if (birthDate && aiDate && aiDate < birthDate) {
      toast.error("Validation Error", { description: "AI date cannot be earlier than birth date." });
      return;
    }
    if (lastVaccinationDate && lastVaccinationDate > todayStr) {
      toast.error("Validation Error", { description: "Vaccination date cannot be in the future." });
      return;
    }
    if (birthDate && lastVaccinationDate && lastVaccinationDate < birthDate) {
      toast.error("Validation Error", { description: "Vaccination date cannot be earlier than birth date." });
      return;
    }

    // Resolve Parents
    let finalFatherId: string | undefined = undefined;
    let finalFatherTag: string | undefined = undefined;
    let finalFatherName: string | undefined = undefined;

    if (fatherSelection && fatherSelection !== "manual" && fatherSelection !== "none") {
      const p = availableAnimals.find((a) => a.id === fatherSelection);
      if (p) {
        finalFatherId = p.id;
        finalFatherTag = p.tag;
        finalFatherName = p.name;
      }
    } else if (fatherSelection === "manual") {
      finalFatherTag = manualFatherTag.trim().toUpperCase() || undefined;
      finalFatherName = manualFatherName.trim() || undefined;
    }

    let finalMotherId: string | undefined = undefined;
    let finalMotherTag: string | undefined = undefined;
    let finalMotherName: string | undefined = undefined;

    if (motherSelection && motherSelection !== "manual" && motherSelection !== "none") {
      const m = availableAnimals.find((a) => a.id === motherSelection);
      if (m) {
        finalMotherId = m.id;
        finalMotherTag = m.tag;
        finalMotherName = m.name;
      }
    } else if (motherSelection === "manual") {
      finalMotherTag = manualMotherTag.trim().toUpperCase() || undefined;
      finalMotherName = manualMotherName.trim() || undefined;
    }

    if (finalFatherTag && finalFatherTag === trimmedTag) {
      notify.error("Validation Error", { description: "An animal cannot be its own father." });
      return;
    }
    if (finalMotherTag && finalMotherTag === trimmedTag) {
      notify.error("Validation Error", { description: "An animal cannot be its own mother." });
      return;
    }

    const payload: UpdateAnimalData = {
      name: trimmedTag,
      tag: trimmedTag,
      breed: breed.trim(),
      type: animalType,
      status: status,
      animalStatusCategory,
      milkingStatus,
      milkingGroup,
      age: calculateAgeFromDob(birthDate, animal.age),
      weight: weight ? parseFloat(weight) : undefined,
      bestYield: bestYield ? parseFloat(bestYield) : undefined,
      pen: pen.trim() || undefined,
      lactationCycle: lactationCycle || 1,
      feedRation: feedRation.trim() || undefined,
      dueDate: dueDate || undefined,
      birthDate: birthDate || undefined,
      birthStatus: birthStatus || undefined,
      fatherAnimalId: finalFatherId,
      fatherTag: finalFatherTag,
      fatherName: finalFatherName,
      motherAnimalId: finalMotherId,
      motherTag: finalMotherTag,
      motherName: finalMotherName,
      aiDate: aiDate || undefined,
      lastCalvingDate: lastCalvingDate || undefined,
      heatDate: heatDate || undefined,
      aiAttemptsCount: aiAttemptsCount ? parseInt(aiAttemptsCount, 10) : undefined,
      aiSuccess: aiSuccess === "Yes" ? true : aiSuccess === "No" ? false : undefined,
      bullUsed: bullUsed.trim() || undefined,
      dryingDate: dryingDate || undefined,
      calfDob: calfDob || undefined,
      calfSex: calfSex || undefined,
      vaccinationStatus: vaccinationStatus || undefined,
      lastVaccineName: lastVaccineName.trim() || undefined,
      lastVaccinationDate: lastVaccinationDate || undefined,
      medicineUsed: medicineUsed.trim() || undefined,
      medicineDose: medicineDose.trim() || undefined,
      remarks: remarks.trim() || undefined,
      photoUrl: photoUrl.trim() || undefined,
      lastHealthCheck: lastHealthCheck || undefined,
    };

    setIsSubmitting(true);
    try {
      const updated = await farmService.updateAnimal(animal.id, payload);
      notify.success("Animal Record Saved", {
        description: `Successfully updated Cow #${updated.tag}.`,
      });
      onAnimalUpdated(updated);
      onOpenChange(false);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to update animal.";
      notify.error("Could not save animal", {
        description: errorMsg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-xl overflow-y-auto rounded-3xl border-border/80 bg-background/95 p-4 sm:p-6">
        <DialogHeader className="border-b border-border/60 pb-3">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-800 dark:text-emerald-300">
              <Edit3 className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg sm:text-xl font-extrabold text-foreground">
                Edit Animal: Cow #{tag || animal.tag}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Update Cow Number, status, parentage, health, and dairy production details.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* SECTION 1: ESSENTIAL COW NUMBER */}
          <div>
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
              Cow Number *
            </label>
            <Input
              value={tag}
              onChange={(e) => setTag(e.target.value.toUpperCase())}
              placeholder="e.g. C-1024"
              className="mt-1 h-11 rounded-xl text-sm font-black uppercase text-emerald-800 dark:text-emerald-300"
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                Breed
              </label>
              <select
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
                className="mt-1 h-11 w-full rounded-xl border border-input bg-background px-3 text-xs font-semibold"
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

            <div>
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                Herd Group / Type
              </label>
              <select
                value={animalType}
                onChange={(e) => setAnimalType(e.target.value as AnimalType)}
                className="mt-1 h-11 w-full rounded-xl border border-input bg-background px-3 text-xs font-semibold"
              >
                <option value="Lactating">Lactating</option>
                <option value="Pregnant">Pregnant</option>
                <option value="Calf">Calf</option>
                <option value="Dry">Dry Cow</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                Health Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as AnimalStatus)}
                className="mt-1 h-11 w-full rounded-xl border border-input bg-background px-3 text-xs font-semibold"
              >
                <option value="Healthy">Healthy</option>
                <option value="Needs check">Needs check</option>
                <option value="Sick">Sick (Recovery Pen)</option>
              </select>
            </div>
          </div>

          {/* SECTION 2: PRODUCTION & LOCATION DETAILS */}
          <div className="rounded-2xl border border-border/70 bg-card/40 p-3.5 space-y-3">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Barn Location & Production
            </p>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <label className="text-[10px] font-bold text-muted-foreground">
                  Pen / Stall
                </label>
                <Input
                  value={pen}
                  onChange={(e) => setPen(e.target.value)}
                  placeholder="e.g. North Barn"
                  className="mt-1 h-10 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted-foreground">
                  Weight (kg)
                </label>
                <Input
                  type="number"
                  step="0.5"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="560"
                  className="mt-1 h-10 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted-foreground">
                  Lactation Cycle
                </label>
                <Input
                  type="number"
                  min="1"
                  max="15"
                  value={lactationCycle}
                  onChange={(e) => setLactationCycle(parseInt(e.target.value) || 1)}
                  className="mt-1 h-10 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted-foreground">
                  Calving Due Date
                </label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="mt-1 h-10 rounded-xl text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-muted-foreground">
                Prescribed Daily Feed Ration
              </label>
              <Input
                value={feedRation}
                onChange={(e) => setFeedRation(e.target.value)}
                placeholder="e.g. 18 kg Green + 4 kg Dairy Concentrate"
                className="mt-1 h-10 rounded-xl text-xs"
              />
            </div>
          </div>

          {/* SECTION 3: EXPANDABLE PEDIGREE & HISTORY */}
          <div className="rounded-2xl border border-border/70 bg-card/40 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-extrabold text-foreground">
                  Pedigree & Lifespan Records
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Birth date, sire, dam, and insemination details
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAdvancedHistory((prev) => !prev)}
                className="h-8 rounded-xl text-xs font-bold"
              >
                {showAdvancedHistory ? "Collapse" : "Expand"}
              </Button>
            </div>

            {showAdvancedHistory && (
              <div className="mt-3 space-y-3 border-t border-border/60 pt-3">
                {/* Birth & Live Dynamic Age */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground">
                      Birth Date
                    </label>
                    <Input
                      type="date"
                      value={birthDate}
                      max={todayStr}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="mt-1 h-10 rounded-xl text-xs"
                    />
                    {birthDate && (
                      <div className="mt-1 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px]">
                        <span className="text-muted-foreground font-semibold">Calculated Age:</span>
                        <span className="font-extrabold text-emerald-800 dark:text-emerald-300">
                          {calculateAgeFromDob(birthDate, animal.age)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground">
                      Animal Status Category
                    </label>
                    <select
                      value={animalStatusCategory}
                      onChange={(e) => setAnimalStatusCategory(e.target.value)}
                      className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-xs"
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
                </div>

                {/* Milking Status & Milking Group */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground">
                      Milking Status
                    </label>
                    <select
                      value={milkingStatus}
                      onChange={(e) => setMilkingStatus(e.target.value)}
                      className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-xs"
                    >
                      <option value="Milking">Milking</option>
                      <option value="Dry NP">Dry NP (Non-Pregnant)</option>
                      <option value="Milking NP">Milking NP (Non-Pregnant)</option>
                      <option value="Dry P">Dry P (Pregnant)</option>
                      <option value="Milking P">Milking P (Pregnant)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground">
                      Milking Group
                    </label>
                    <select
                      value={milkingGroup}
                      onChange={(e) => setMilkingGroup(e.target.value)}
                      className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-xs"
                    >
                      <option value="A">Group A (High)</option>
                      <option value="B">Group B (Mid)</option>
                      <option value="C">Group C (Low)</option>
                      <option value="D">Group D (Fresh)</option>
                      <option value="E">Group E (Dry)</option>
                      <option value="F">Group F (Heifer/Calf)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground">
                      Best Yield (L)
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      value={bestYield}
                      onChange={(e) => setBestYield(e.target.value)}
                      placeholder="e.g. 26.5"
                      className="mt-1 h-10 rounded-xl text-xs font-bold"
                    />
                  </div>
                </div>

                {/* Parents */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {/* Father */}
                  <div className="rounded-xl border border-border/60 p-2.5">
                    <label className="text-[11px] font-bold text-foreground">
                      Father (Sire)
                    </label>
                    <select
                      value={fatherSelection}
                      onChange={(e) => setFatherSelection(e.target.value)}
                      className="mt-1 h-9 w-full rounded-lg border border-input bg-background px-2 text-xs"
                    >
                      <option value="">None / Unknown</option>
                      <option value="manual">+ Enter Tag / Name Manually</option>
                      {availableAnimals
                        .filter((a) => a.id !== animal.id)
                        .map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.tag} · {a.name} ({a.breed})
                          </option>
                        ))}
                    </select>
                    {fatherSelection === "manual" && (
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <Input
                          value={manualFatherTag}
                          onChange={(e) => setManualFatherTag(e.target.value.toUpperCase())}
                          placeholder="Tag (e.g. C-050)"
                          className="h-8 text-xs font-bold uppercase"
                        />
                        <Input
                          value={manualFatherName}
                          onChange={(e) => setManualFatherName(e.target.value)}
                          placeholder="Name (Optional)"
                          className="h-8 text-xs"
                        />
                      </div>
                    )}
                  </div>

                  {/* Mother */}
                  <div className="rounded-xl border border-border/60 p-2.5">
                    <label className="text-[11px] font-bold text-foreground">
                      Mother (Dam)
                    </label>
                    <select
                      value={motherSelection}
                      onChange={(e) => setMotherSelection(e.target.value)}
                      className="mt-1 h-9 w-full rounded-lg border border-input bg-background px-2 text-xs"
                    >
                      <option value="">None / Unknown</option>
                      <option value="manual">+ Enter Tag / Name Manually</option>
                      {availableAnimals
                        .filter((a) => a.id !== animal.id)
                        .map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.tag} · {a.name} ({a.breed})
                          </option>
                        ))}
                    </select>
                    {motherSelection === "manual" && (
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <Input
                          value={manualMotherTag}
                          onChange={(e) => setManualMotherTag(e.target.value.toUpperCase())}
                          placeholder="Tag (e.g. C-087)"
                          className="h-8 text-xs font-bold uppercase"
                        />
                        <Input
                          value={manualMotherName}
                          onChange={(e) => setManualMotherName(e.target.value)}
                          placeholder="Name (Optional)"
                          className="h-8 text-xs"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Reproduction details */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground">
                      Last Calving Date
                    </label>
                    <Input
                      type="date"
                      value={lastCalvingDate}
                      max={todayStr}
                      onChange={(e) => setLastCalvingDate(e.target.value)}
                      className="mt-1 h-10 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground">
                      Heat Date
                    </label>
                    <Input
                      type="date"
                      value={heatDate}
                      max={todayStr}
                      onChange={(e) => setHeatDate(e.target.value)}
                      className="mt-1 h-10 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground">
                      AI Date (Insemination)
                    </label>
                    <Input
                      type="date"
                      value={aiDate}
                      max={todayStr}
                      onChange={(e) => setAiDate(e.target.value)}
                      className="mt-1 h-10 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground">
                      AI Attempts
                    </label>
                    <Input
                      type="number"
                      value={aiAttemptsCount}
                      min="0"
                      onChange={(e) => setAiAttemptsCount(e.target.value)}
                      className="mt-1 h-10 rounded-xl text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground">
                      AI Success
                    </label>
                    <select
                      value={aiSuccess}
                      onChange={(e) => setAiSuccess(e.target.value)}
                      className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-xs"
                    >
                      <option value="">Pending / Unknown</option>
                      <option value="Yes">Yes (Pregnant)</option>
                      <option value="No">No (Not Pregnant)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground">
                      Bull Used / Semen
                    </label>
                    <Input
                      value={bullUsed}
                      onChange={(e) => setBullUsed(e.target.value)}
                      placeholder="e.g. ABS-901"
                      className="mt-1 h-10 rounded-xl text-xs"
                    />
                  </div>
                </div>

                {/* Health & Treatment */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground">
                      Vaccination Status
                    </label>
                    <select
                      value={vaccinationStatus}
                      onChange={(e) => setVaccinationStatus(e.target.value)}
                      className="mt-1 h-10 w-full rounded-xl border border-input bg-background px-3 text-xs"
                    >
                      <option value="All Completed">All Completed</option>
                      <option value="Part Completed">Part Completed</option>
                      <option value="None">None</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground">
                      Last Vaccine Name
                    </label>
                    <Input
                      value={lastVaccineName}
                      onChange={(e) => setLastVaccineName(e.target.value)}
                      placeholder="e.g. FMD"
                      className="mt-1 h-10 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground">
                      Last Vaccination Date
                    </label>
                    <Input
                      type="date"
                      value={lastVaccinationDate}
                      max={todayStr}
                      onChange={(e) => setLastVaccinationDate(e.target.value)}
                      className="mt-1 h-10 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground">
                      Medicine Used
                    </label>
                    <Input
                      value={medicineUsed}
                      onChange={(e) => setMedicineUsed(e.target.value)}
                      placeholder="e.g. Oxytetracycline"
                      className="mt-1 h-10 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground">
                      Dose
                    </label>
                    <Input
                      value={medicineDose}
                      onChange={(e) => setMedicineDose(e.target.value)}
                      placeholder="e.g. 20 ml"
                      className="mt-1 h-10 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground">
                    Remarks & Notes
                  </label>
                  <Input
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="General health, weight history or management notes..."
                    className="mt-1 h-10 rounded-xl text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
              className="h-11 rounded-xl text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-11 gap-2 rounded-xl bg-emerald-600 px-5 text-xs font-extrabold text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving to Database...
                </>
              ) : (
                <>
                  <Check className="size-4 stroke-[2.5]" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
