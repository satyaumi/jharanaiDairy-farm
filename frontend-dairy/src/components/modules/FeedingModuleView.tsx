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
  Truck,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FeedItem, AnimalGroup, StockBalance } from "@/types/farm";
import { farmService } from "@/services/farm-service";
import { useAuth } from "@/context/AuthContext";
import { notify } from "@/lib/notify";

import { useActionStatus, ActionSubmitButton, ActionInlineFeedback } from "@/components/common/ActionStatus";

interface FeedingModuleViewProps {
  onOpenQuickFeeding?: () => void;
}

export function FeedingModuleView({}: FeedingModuleViewProps) {
  const { isOwner, isWorker } = useAuth();
  const feedRoundAction = useActionStatus();
  const supplyAction = useActionStatus();

  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [groups, setGroups] = useState<AnimalGroup[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [balances, setBalances] = useState<StockBalance[]>([]);
  const [loading, setLoading] = useState(true);

  // Feeding record form modal (Save Feed Round)
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [selectedFeedItemId, setSelectedFeedItemId] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [quantityKg, setQuantityKg] = useState("");
  const [feedingNotes, setFeedingNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Supply Feed modal
  const [supplyModalOpen, setSupplyModalOpen] = useState(false);
  const [supplyFeedItemId, setSupplyFeedItemId] = useState("");
  const [supplyQty, setSupplyQty] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [supplyDate, setSupplyDate] = useState(new Date().toISOString().split("T")[0]);
  const [supplyNotes, setSupplyNotes] = useState("");
  const [isSubmittingSupply, setIsSubmittingSupply] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const [itemsRes, grpsRes, recsRes, balRes] = await Promise.all([
        farmService.listFeedItems(),
        farmService.listGroups(),
        farmService.getFeedingRecords(today),
        farmService.getStockBalances(),
      ]);
      setFeedItems(itemsRes);
      setGroups(grpsRes);
      setRecords(recsRes);
      setBalances(balRes);
      if (itemsRes.length > 0) {
        if (!selectedFeedItemId) setSelectedFeedItemId(itemsRes[0].id);
        if (!supplyFeedItemId) setSupplyFeedItemId(itemsRes[0].id);
      }
      if (grpsRes.length > 0 && !selectedGroupId) {
        setSelectedGroupId(grpsRes[0].id);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalFedToday = records.reduce((sum, r) => sum + (r.quantityKg || 0), 0);
  const totalAvailableStockKg = balances.reduce((sum, b) => sum + (b.currentStock || 0), 0);

  // Selected feed item available stock
  const selectedBalance = balances.find((b) => b.feedItemId === selectedFeedItemId);
  const availableStockForSelected = selectedBalance ? selectedBalance.currentStock : 0;

  // Handle Save Feed Round submit
  const handleRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(quantityKg);
    if (!selectedFeedItemId || isNaN(qty) || qty <= 0) {
      feedRoundAction.setError("Please select a feed item and enter a valid positive quantity in KG.");
      return;
    }

    if (qty > availableStockForSelected) {
      feedRoundAction.setError(
        `Insufficient stock! Only ${availableStockForSelected.toFixed(1)} KG available for ${
          selectedBalance?.feedItemName || "this feed"
        }. Please record feed supply first.`
      );
      return;
    }

    const selectedFeed = feedItems.find((f) => f.id === selectedFeedItemId);
    const selectedGroup = groups.find((g) => g.id === selectedGroupId);

    feedRoundAction.startSubmitting("Saving feed round & deducting stock...");
    try {
      await farmService.recordFeeding({
        feedItemId: selectedFeedItemId,
        feedType: selectedFeed?.englishName || selectedBalance?.feedItemName || "Feed Ration",
        groupId: selectedGroupId || undefined,
        groupName: selectedGroup?.name || undefined,
        quantityKg: qty,
        recordDate: new Date().toISOString().split("T")[0],
        notes: feedingNotes,
      });

      const remaining = Math.max(0, availableStockForSelected - qty);
      feedRoundAction.setSuccess(`Saved! Deducted ${qty} KG (${remaining.toFixed(1)} KG left)`);
      notify.success("Feeding Round Saved & Stock Deducted", {
        description: `Logged ${qty} KG. Remaining balance: ${remaining.toFixed(1)} KG.`,
      });

      setTimeout(async () => {
        setQuantityKg("");
        setFeedingNotes("");
        setRecordModalOpen(false);
        feedRoundAction.reset();
        await loadData();
      }, 1000);
    } catch (err: any) {
      feedRoundAction.setError(err.message || "Failed to record feeding round.");
    }
  };

  // Handle Supply Feed submit
  const handleSupplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(supplyQty);
    if (!supplyFeedItemId || isNaN(qty) || qty <= 0) {
      supplyAction.setError("Please select a feed item and enter a valid received quantity in KG.");
      return;
    }

    supplyAction.startSubmitting("Crediting feed supply to inventory...");
    try {
      const fullNotes = [
        supplierName ? `Supplier: ${supplierName}` : "",
        supplyDate ? `Date: ${supplyDate}` : "",
        supplyNotes ? `Notes: ${supplyNotes}` : "",
      ]
        .filter(Boolean)
        .join(" | ");

      const targetFeed = feedItems.find((f) => f.id === supplyFeedItemId);

      await farmService.recordStockTransaction({
        feedItemId: supplyFeedItemId,
        itemName: targetFeed?.englishName || targetFeed?.displayName || "Dry Straw (Nada)",
        transactionType: "RECEIVED" as any,
        quantity: qty,
        unit: targetFeed?.unit || "KG",
        transactionDate: supplyDate || new Date().toISOString().split("T")[0],
        notes: fullNotes || "Incoming feed supply",
      });

      supplyAction.setSuccess(`Stock credited with ${qty} KG!`);
      notify.success("Feed Supply Received & Stock Added", {
        description: `Successfully credited ${qty} KG of ${targetFeed?.englishName || "Feed"}. Stock balance updated.`,
      });

      setTimeout(async () => {
        setSupplyQty("");
        setSupplierName("");
        setSupplyNotes("");
        setSupplyModalOpen(false);
        supplyAction.reset();
        await loadData();
      }, 1000);
    } catch (err: any) {
      supplyAction.setError(err.message || "Failed to record feed supply.");
    }
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Title & Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-amber-500/15 text-amber-800 dark:text-amber-300">
              <Wheat className="size-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-foreground">
              ଖାଦ୍ୟ ଓ ରାସନ୍ ପରିଚାଳନା · Feed & Rations
            </h1>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Bilingual feed master, feed supply, consumption ledger & real-time stock deduction
          </p>
        </div>

        {/* Operational buttons hidden for Owner (business oversight only) */}
        {!isOwner && (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => setSupplyModalOpen(true)}
              className="h-10 gap-2 rounded-2xl bg-emerald-700 hover:bg-emerald-800 px-4 text-xs font-black text-white shadow-md active:scale-95"
            >
              <Truck className="size-4 stroke-[2.2]" />
              Supply Feed (ଖାଦ୍ୟ ଯୋଗାଣ / ଆମଦାନୀ)
            </Button>

            <Button
              onClick={() => setRecordModalOpen(true)}
              className="h-10 gap-2 rounded-2xl bg-amber-600 hover:bg-amber-700 px-4 text-xs font-black text-white shadow-md active:scale-95"
            >
              <Plus className="size-4 stroke-[2.5]" />
              Save Feed Round (ଖାଦ୍ୟ ବଣ୍ଟନ)
            </Button>
          </div>
        )}
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
            {records.length} feeding rounds recorded
          </p>
        </div>

        <div className="farm-glass rounded-2xl p-3.5">
          <p className="text-[11px] font-bold uppercase text-muted-foreground">
            Total Available Stock
          </p>
          <p className="mt-1 text-2xl font-black text-emerald-700 dark:text-emerald-400">
            {totalAvailableStockKg.toLocaleString()} KG
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">
            Confirmed ledger balance
          </p>
        </div>

        <div className="farm-glass rounded-2xl p-3.5">
          <p className="text-[11px] font-bold uppercase text-muted-foreground">
            Configured Feeds
          </p>
          <p className="mt-1 text-2xl font-black text-amber-700 dark:text-amber-300">
            {feedItems.length} Feeds
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">Odia & English master items</p>
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

      {/* Main Grid: Feed Master List with Live Stock & Today's Logs */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.8fr)]">
        {/* Bilingual Feed Master Catalog with Current Stock */}
        <div className="farm-glass rounded-3xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div>
              <h2 className="text-base font-black text-foreground">
                ଖାଦ୍ୟ ତାଲିକା ଓ ବର୍ତ୍ତମାନର ଷ୍ଟକ୍ · Feed Items & Balances
              </h2>
              <p className="text-xs text-muted-foreground">
                Opening + Incoming Supply − Consumed = Current Available Stock
              </p>
            </div>
            <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
              {feedItems.length} Feeds
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {feedItems.map((feed) => {
              const bal = balances.find((b) => b.feedItemId === feed.id);
              const currentStock = bal ? bal.currentStock : 0;
              const isLow = bal?.lowStock || currentStock < 20;

              return (
                <div
                  key={feed.id}
                  className="flex flex-col justify-between rounded-2xl border border-border/70 bg-card/60 p-3.5 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-500/15 text-amber-800 dark:text-amber-300 font-bold text-base">
                        🌾
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-xs sm:text-sm font-black text-foreground">
                          {feed.localName}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {feed.englishName} · {feed.category}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                        isLow
                          ? "bg-rose-500/15 text-rose-700"
                          : "bg-emerald-500/15 text-emerald-700"
                      }`}
                    >
                      {isLow ? "Low Stock" : "In Stock"}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-2 text-xs">
                    <span className="text-muted-foreground font-semibold">Available Stock:</span>
                    <span className="font-black text-foreground">
                      {currentStock.toFixed(1)} {feed.unit}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Today's Feeding Logs */}
        <div className="space-y-4">
          <div className="farm-glass rounded-3xl p-4 sm:p-5 space-y-3">
            <h2 className="text-sm font-black text-foreground">
              ଆଜିର ଖାଦ୍ୟ ରେକର୍ଡ · Today's Feeding Rounds
            </h2>
            <p className="text-xs text-muted-foreground">
              Confirmed consumption deducted from available inventory
            </p>

            <div className="space-y-2 pt-1">
              {records.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  No feed rounds recorded today. {!isOwner && "Click 'Save Feed Round' above."}
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
          </div>
        </div>
      </div>

      {/* Save Feed Round Modal */}
      {recordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-border bg-background p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-xl bg-amber-500/15 text-amber-700">
                  <Wheat className="size-4" />
                </span>
                <h2 className="text-base font-black text-foreground">
                  Save Feed Round (ଖାଦ୍ୟ ବଣ୍ଟନ)
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setRecordModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordSubmit} className="space-y-3.5 pt-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">
                  Feed Item (ଖାଦ୍ୟ ପ୍ରକାର) *
                </label>
                <select
                  value={selectedFeedItemId}
                  onChange={(e) => setSelectedFeedItemId(e.target.value)}
                  className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs font-bold focus:outline-none"
                >
                  {feedItems.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.localName} ({f.englishName})
                    </option>
                  ))}
                </select>
              </div>

              {/* Real-time Available Stock Badge */}
              <div className="flex items-center justify-between rounded-xl bg-muted/60 p-2.5 text-xs">
                <span className="text-muted-foreground font-semibold">Available in Inventory:</span>
                <span
                  className={`font-black ${
                    availableStockForSelected <= 0
                      ? "text-destructive"
                      : "text-emerald-700 dark:text-emerald-400"
                  }`}
                >
                  {availableStockForSelected.toFixed(1)} KG
                </span>
              </div>

              {availableStockForSelected <= 0 && (
                <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-2.5 text-[11px] font-semibold text-destructive">
                  <AlertTriangle className="size-4 shrink-0" />
                  <span>Available stock is 0.0 KG. Please record incoming feed supply before saving.</span>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">
                  Target Cow Group (ଗୋଠ)
                </label>
                <select
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs font-bold focus:outline-none"
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
                  Quantity in KG (ପରିମାଣ) *
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  required
                  placeholder="e.g. 30"
                  value={quantityKg}
                  onChange={(e) => setQuantityKg(e.target.value)}
                  className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs font-bold focus:outline-none"
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
                  className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs focus:outline-none"
                />
              </div>

              <ActionInlineFeedback
                status={feedRoundAction.status}
                message={feedRoundAction.message}
                onDismiss={feedRoundAction.reset}
                className="mt-2"
              />

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    feedRoundAction.reset();
                    setRecordModalOpen(false);
                  }}
                  className="flex-1 rounded-xl text-xs font-bold h-10"
                >
                  Cancel
                </Button>
                <ActionSubmitButton
                  status={feedRoundAction.status}
                  disabled={availableStockForSelected <= 0}
                  idleText="Save Feed Round"
                  submittingText="Saving Feed Round..."
                  successText="Saved!"
                  variant="warning"
                  icon={<Save className="size-4" />}
                  className="flex-1 rounded-xl font-bold text-xs h-10"
                />
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supply Feed Modal */}
      {supplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-border bg-background p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-xl bg-emerald-500/15 text-emerald-700">
                  <Truck className="size-4" />
                </span>
                <h2 className="text-base font-black text-foreground">
                  Record Feed Supply (ଖାଦ୍ୟ ଯୋଗାଣ)
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSupplyModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSupplySubmit} className="space-y-3.5 pt-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">
                  Feed Item Received (ଖାଦ୍ୟ ପ୍ରକାର) *
                </label>
                <select
                  value={supplyFeedItemId}
                  onChange={(e) => setSupplyFeedItemId(e.target.value)}
                  className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs font-bold focus:outline-none"
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
                  Quantity Received in KG (ପରିମାଣ) *
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  required
                  placeholder="e.g. 50"
                  value={supplyQty}
                  onChange={(e) => setSupplyQty(e.target.value)}
                  className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">
                  Supplier / Source (ଯୋଗାଣକାରୀ)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Local Mandi / Cooperative"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">
                  Date Received (ତାରିଖ)
                </label>
                <input
                  type="date"
                  value={supplyDate}
                  onChange={(e) => setSupplyDate(e.target.value)}
                  className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">
                  Reference / Invoice / Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Invoice #8841 / Bag count: 2"
                  value={supplyNotes}
                  onChange={(e) => setSupplyNotes(e.target.value)}
                  className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs focus:outline-none"
                />
              </div>

              <ActionInlineFeedback
                status={supplyAction.status}
                message={supplyAction.message}
                onDismiss={supplyAction.reset}
                className="mt-2"
              />

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    supplyAction.reset();
                    setSupplyModalOpen(false);
                  }}
                  className="flex-1 rounded-xl text-xs font-bold h-10"
                >
                  Cancel
                </Button>
                <ActionSubmitButton
                  status={supplyAction.status}
                  idleText="Save Feed Supply"
                  submittingText="Recording Feed Supply..."
                  successText="Saved!"
                  variant="primary"
                  icon={<Save className="size-4" />}
                  className="flex-1 rounded-xl font-bold text-xs h-10"
                />
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
