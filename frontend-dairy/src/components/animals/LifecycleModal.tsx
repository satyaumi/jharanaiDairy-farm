import React, { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Calendar,
  FileText,
  Loader2,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { farmService } from "@/services/farm-service";
import type { Animal, LifecycleStatus } from "@/types/farm";

interface LifecycleModalProps {
  animal: Animal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChanged: (updated: Animal) => void;
}

export function LifecycleModal({
  animal,
  open,
  onOpenChange,
  onStatusChanged,
}: LifecycleModalProps) {
  const [targetStatus, setTargetStatus] = useState<LifecycleStatus>("SOLD");
  const [effectiveDate, setEffectiveDate] = useState<string>(
    new Date().toISOString().split("T")[0]!,
  );
  const [reason, setReason] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!animal) return null;

  const currentStatus = animal.lifecycleStatus || (animal.active === false ? "ARCHIVED" : "ACTIVE");

  const isTerminalOrInactive =
    targetStatus === "DECEASED" ||
    targetStatus === "SOLD" ||
    targetStatus === "RETIRED" ||
    targetStatus === "ARCHIVED";

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason.trim()) {
      toast.error("Reason is required", {
        description: "Please specify why this animal's lifecycle status is being updated.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await farmService.changeLifecycleStatus(animal.id, {
        status: targetStatus,
        effectiveDate,
        reason: reason.trim(),
        notes: notes.trim() || undefined,
      });

      toast.success("Lifecycle Status Updated", {
        description: `${updated.name} (${updated.tag}) is now recorded as ${targetStatus}.`,
      });

      onStatusChanged(updated);
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update lifecycle status.";
      toast.error("Could not update status", { description: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-md overflow-y-auto rounded-3xl border-border/80 bg-background/95 p-4 sm:p-6">
        <DialogHeader className="border-b border-border/60 pb-3">
          <div className="flex items-center gap-3">
            <div className={`grid size-11 place-items-center rounded-2xl ${
              targetStatus === "DECEASED"
                ? "bg-destructive/15 text-destructive"
                : targetStatus === "SOLD"
                ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
            }`}>
              <ShieldAlert className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-extrabold text-foreground">
                Animal Lifecycle: {animal.name}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Ear Tag: <strong className="text-foreground">{animal.tag}</strong> · Current: {currentStatus}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleConfirm} className="space-y-4 pt-2">
          {/* Status Selection */}
          <div>
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
              New Lifecycle Status *
            </label>
            <div className="mt-1.5 grid grid-cols-3 gap-2">
              {(["ACTIVE", "SICK", "SOLD", "DECEASED", "RETIRED", "ARCHIVED"] as LifecycleStatus[]).map(
                (st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setTargetStatus(st)}
                    className={`rounded-xl border p-2.5 text-center text-xs font-bold transition-all ${
                      targetStatus === st
                        ? "border-emerald-600 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-500/20"
                        : "border-border/70 bg-card/60 hover:bg-card text-muted-foreground"
                    }`}
                  >
                    {st}
                  </button>
                ),
              )}
            </div>
          </div>

          {/* Safety Notice for Inactive Animals */}
          {isTerminalOrInactive ? (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 space-y-1.5">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-extrabold text-xs">
                <AlertTriangle className="size-4 shrink-0" />
                Operational Lifecycle Change
              </div>
              <p className="text-[11px] text-amber-900/90 dark:text-amber-200/90 leading-relaxed">
                Marking as <strong>{targetStatus}</strong> will remove this animal from active daily milking rounds and feeding pickers.
                <br />
                <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                  All past milk yield, feeding, breeding, health, and pedigree records will remain permanently preserved and accessible in the farm history.
                </span>
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-800 dark:text-emerald-300">
              The animal will be available in active herd management and routine daily operations.
            </div>
          )}

          {/* Effective Date */}
          <div>
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
              Effective Date *
            </label>
            <Input
              type="date"
              value={effectiveDate}
              max={new Date().toISOString().split("T")[0]}
              onChange={(e) => setEffectiveDate(e.target.value)}
              className="mt-1 h-11 rounded-xl text-xs font-medium"
              required
            />
          </div>

          {/* Reason */}
          <div>
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
              Reason / Explanation *
            </label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                targetStatus === "DECEASED"
                  ? "e.g. Natural mortality due to old age"
                  : targetStatus === "SOLD"
                  ? "e.g. Sold to Green Meadows Dairy Farm"
                  : targetStatus === "RETIRED"
                  ? "e.g. Retired after 5 lactation cycles"
                  : "e.g. Routine herd restructuring"
              }
              className="mt-1 h-11 rounded-xl text-xs"
              required
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
              Additional Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="e.g. Sale price, post-mortem findings, buyer details..."
              className="mt-1 w-full rounded-xl border border-input bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {/* Buttons */}
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
              className={`h-11 gap-2 rounded-xl px-5 text-xs font-extrabold text-white shadow-md ${
                targetStatus === "DECEASED"
                  ? "bg-destructive hover:bg-destructive/90"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4 stroke-[2.5]" />
                  Confirm Status Change
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
