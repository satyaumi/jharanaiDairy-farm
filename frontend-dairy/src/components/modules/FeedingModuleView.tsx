import React, { useState, useEffect } from "react";
import {
  Wheat,
  Plus,
  Leaf,
  Package,
  Activity,
  CheckCircle2,
  Users,
  Save,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FeedItem, AnimalGroup } from "@/types/farm";
import { farmService } from "@/services/farm-service";
import { toast } from "sonner";

interface FeedingModuleViewProps {
  onOpenQuickFeeding: () => void;
}

export function FeedingModuleView({ onOpenQuickFeeding }: FeedingModuleViewProps) {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [groups, setGroups] = useState<AnimalGroup[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Feeding record form modal
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [selectedFeedItemId, setSelectedFeedItemId] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [quantityKg, setQuantityKg] = useState("");
  const [feedingNotes, setFeedingNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const [itemsRes, grpsRes, recsRes] = await Promise.all([
        farmService.listFeedItems(),
        farmService.listGroups(),
        farmService.getFeedingRecords(today),
      ]);
      setFeedItems(itemsRes);
      setGroups(grpsRes);
      setRecords(recsRes);
      if (itemsRes.length > 0) setSelectedFeedItemId(itemsRes[0].id);
      if (grpsRes.length > 0) setSelectedGroupId(grpsRes[0].id);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalFedToday = records.reduce((sum, r) => sum + (r.quantityKg || 0), 0);

  const handleRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(quantityKg);
    if (!selectedFeedItemId || isNaN(qty) || qty <= 0) {
      toast.error("Please select a feed item and enter a valid quantity.");
      return;
    }

    const selectedFeed = feedItems.find((f) => f.id === selectedFeedItemId);
    const selectedGroup = groups.find((g) => g.id === selectedGroupId);

    setIsSubmitting(true);
    try {
      await farmService.recordFeeding({
        feedItemId: selectedFeedItemId,
        feedType: selectedFeed?.englishName || "Feed Ration",
        groupId: selectedGroupId || undefined,
        groupName: selectedGroup?.name || undefined,
        quantityKg: qty,
        recordDate: new Date().toISOString().split("T")[0],
        notes: feedingNotes,
      });

      toast.success("Feeding Recorded & Stock Deducted", {
        description: `Logged ${qty} KG for ${selectedGroup?.name || "Herd"}. Stock ledger automatically updated.`,
      });
      setQuantityKg("");
      setFeedingNotes("");
      setRecordModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to record feeding.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Title & Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-amber-500/15 text-amber-800 dark:text-amber-300">
              <Wheat className="size-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-foreground">
              ଖାଦ୍ୟ ଓ ରାସନ୍ ପରିଚାଳନା · Feeding & Ration
            </h1>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Bilingual feed master, herd group feeding & automatic stock ledger deduction
          </p>
        </div>

        <Button
          onClick={() => setRecordModalOpen(true)}
          className="h-10 gap-2 rounded-2xl bg-amber-600 hover:bg-amber-700 px-4 text-xs font-black text-white shadow-md active:scale-95"
        >
          <Plus className="size-4 stroke-[2.5]" />
          Record Feeding Round (ଖାଦ୍ୟ ଏଣ୍ଟ୍ରି)
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <div className="farm-glass rounded-2xl p-3.5">
          <p className="text-[11px] font-bold uppercase text-muted-foreground">
            Feed Fed Today (ଆଜିର ଖାଦ୍ୟ)
          </p>
          <p className="mt-1 text-2xl font-black text-foreground">
            {totalFedToday > 0 ? `${totalFedToday.toLocaleString()} KG` : "0 KG"}
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground font-semibold">
            {records.length} feeding logs recorded
          </p>
        </div>

        <div className="farm-glass rounded-2xl p-3.5">
          <p className="text-[11px] font-bold uppercase text-muted-foreground">
            Bilingual Feed Items
          </p>
          <p className="mt-1 text-2xl font-black text-emerald-700 dark:text-emerald-400">
            {feedItems.length} Types
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">Odia & English Master Items</p>
        </div>

        <div className="farm-glass rounded-2xl p-3.5">
          <p className="text-[11px] font-bold uppercase text-muted-foreground">
            Feeding Groups
          </p>
          <p className="mt-1 text-2xl font-black text-amber-700 dark:text-amber-300">
            {groups.length} Groups
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">Targeted pen rations</p>
        </div>

        <div className="farm-glass rounded-2xl p-3.5">
          <p className="text-[11px] font-bold uppercase text-muted-foreground">
            Stock Automation
          </p>
          <p className="mt-1 text-2xl font-black text-sky-700 dark:text-sky-300">
            Active
          </p>
          <p className="mt-1 text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
            ✓ Auto-consumed from ledger
          </p>
        </div>
      </div>

      {/* Main Grid: Feed Master List & Today's Logs */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.8fr)]">
        {/* Bilingual Feed Master Catalog */}
        <div className="farm-glass rounded-3xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div>
              <h2 className="text-base font-black text-foreground">
                ଖାଦ୍ୟ ତାଲିକା · Feed Item Catalog
              </h2>
              <p className="text-xs text-muted-foreground">
                Configured feed items available for rationing and stock tracking
              </p>
            </div>
            <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
              {feedItems.length} Available
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {feedItems.map((feed) => (
              <div
                key={feed.id}
                className="flex items-center justify-between rounded-2xl border border-border/70 bg-card/60 p-3.5 shadow-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-500/15 text-amber-800 dark:text-amber-300 font-bold">
                    🌾
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs sm:text-sm font-black text-foreground">
                      {feed.localName}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {feed.englishName} · {feed.category}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="rounded-lg bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                    Unit: {feed.unit}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Today's Feeding Logs */}
        <div className="space-y-4">
          <div className="farm-glass rounded-3xl p-4 sm:p-5 space-y-3">
            <h2 className="text-sm font-black text-foreground">
              ଆଜିର ଖାଦ୍ୟ ରେକର୍ଡ · Today's Feeding Logs
            </h2>
            <p className="text-xs text-muted-foreground">
              Directly deducted from inventory stock
            </p>

            <div className="space-y-2 pt-1">
              {records.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  No feed recorded today. Click "Record Feeding Round" above.
                </div>
              ) : (
                records.map((r, i) => (
                  <div
                    key={r.id || i}
                    className="flex items-center justify-between rounded-xl bg-background/50 p-2.5 text-xs border border-border/50"
                  >
                    <div>
                      <p className="font-bold text-foreground">
                        {r.feedType || "Ration"}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {r.groupName || "Whole Herd"} · {r.recordDate}
                      </p>
                    </div>
                    <span className="font-black text-amber-700 dark:text-amber-400">
                      {r.quantityKg} KG
                    </span>
                  </div>
                ))
              )}
            </div>

            <p className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 pt-2 border-t border-border/50">
              <CheckCircle2 className="size-4" /> All feed rounds auto-sync with stock ledger
            </p>
          </div>
        </div>
      </div>

      {/* MODAL: Record Feeding Form */}
      {recordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <h2 className="text-base font-black text-foreground">
                Record Feeding Round (ଖାଦ୍ୟ ଏଣ୍ଟ୍ରି)
              </h2>
              <button
                type="button"
                onClick={() => setRecordModalOpen(false)}
                className="text-xs font-bold text-muted-foreground hover:text-foreground"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleRecordSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">
                  Feed Item (ଖାଦ୍ୟ ପ୍ରକାର)
                </label>
                <select
                  value={selectedFeedItemId}
                  onChange={(e) => setSelectedFeedItemId(e.target.value)}
                  className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs font-bold"
                >
                  {feedItems.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.localName} ({f.englishName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">
                  Target Group (ଗୋଠ)
                </label>
                <select
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs font-bold"
                >
                  <option value="">Whole Herd / Entire Farm</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">
                  Quantity in KG (ପରିମାଣ)
                </label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  required
                  placeholder="e.g. 50"
                  value={quantityKg}
                  onChange={(e) => setQuantityKg(e.target.value)}
                  className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">
                  Notes (ଟିପ୍ପଣୀ)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Morning round ration"
                  value={feedingNotes}
                  onChange={(e) => setFeedingNotes(e.target.value)}
                  className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs"
                />
              </div>

              {/* Informative Note */}
              <div className="rounded-xl bg-amber-500/10 p-2.5 text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-2">
                <ShieldCheck className="size-4 shrink-0" />
                <span>
                  Recording will automatically decrease the Current Stock balance in the stock ledger.
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRecordModalOpen(false)}
                  className="flex-1 rounded-xl text-xs font-bold h-10"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs h-10 gap-1.5"
                >
                  {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  Save Feeding Round
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
