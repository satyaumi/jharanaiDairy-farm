import React, { useState, useEffect } from "react";
import {
  Package,
  Plus,
  AlertTriangle,
  ClipboardList,
  CheckCircle2,
  TrendingDown,
  ArrowDownRight,
  ArrowUpRight,
  Pill,
  History,
  ShieldAlert,
  Calendar,
  Save,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  StockItem,
  StockBalance,
  StockTransaction,
  Medicine,
  MedicineTransaction,
  Animal,
  FeedItem,
} from "@/types/farm";
import { farmService } from "@/services/farm-service";
import { useAuth } from "@/context/AuthContext";
import { notify } from "@/lib/notify";

interface StockModuleViewProps {
  stockItems: StockItem[];
  animals?: Animal[];
  onOpenQuickStock: () => void;
}

export function StockModuleView({
  stockItems,
  animals = [],
  onOpenQuickStock,
}: StockModuleViewProps) {
  const { isOwner } = useAuth();
  const [activeTab, setActiveTab] = useState<"FEED" | "MEDICINE" | "LEDGER">("FEED");

  // Real backend balances
  const [balances, setBalances] = useState<StockBalance[]>([]);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [medTransactions, setMedTransactions] = useState<MedicineTransaction[]>([]);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  // New stock entry modal state
  const [addStockOpen, setAddStockOpen] = useState(false);
  const [selectedFeedItemId, setSelectedFeedItemId] = useState("");
  const [transType, setTransType] = useState<"ADD" | "CONSUME" | "OPENING" | "ADJUSTMENT">("ADD");
  const [transQty, setTransQty] = useState("");
  const [transNotes, setTransNotes] = useState("");
  const [isSubmittingTrans, setIsSubmittingTrans] = useState(false);

  // Medicine usage modal state
  const [medUsageOpen, setMedUsageOpen] = useState(false);
  const [selectedMedId, setSelectedMedId] = useState("");
  const [selectedAnimalId, setSelectedAnimalId] = useState("");
  const [medUsageQty, setMedUsageQty] = useState("");
  const [medUsageReason, setMedUsageReason] = useState("");
  const [isSubmittingMed, setIsSubmittingMed] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [balRes, txRes, medRes, medTxRes, feedsRes] = await Promise.all([
        farmService.getStockBalances(),
        farmService.getStockTransactions(),
        farmService.getMedicines(),
        farmService.getMedicineTransactions(),
        farmService.listFeedItems(),
      ]);
      setBalances(balRes);
      setTransactions(txRes);
      setMedicines(medRes);
      setMedTransactions(medTxRes);
      setFeedItems(feedsRes);
      if (feedsRes.length > 0) setSelectedFeedItemId(feedsRes[0].id);
      if (medRes.length > 0) setSelectedMedId(medRes[0].id);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalCurrentStockKg = balances.reduce((sum, b) => sum + b.currentStock, 0);
  const lowStockBalances = balances.filter((b) => b.lowStock);
  const lowStockMeds = medicines.filter((m) => m.lowStock || m.currentStock <= m.minimumThreshold);

  // Submit stock transaction
  const handleStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(transQty);
    if (!selectedFeedItemId || isNaN(qty) || qty <= 0) {
      notify.error("Please select a feed item and enter a valid quantity.");
      return;
    }

    setIsSubmittingTrans(true);
    try {
      const targetFeed = feedItems.find((f) => f.id === selectedFeedItemId);
      await farmService.recordStockTransaction({
        feedItemId: selectedFeedItemId,
        itemName: targetFeed?.englishName || targetFeed?.displayName || "Dry Straw (Nada)",
        transactionType: transType,
        quantity: qty,
        unit: targetFeed?.unit || "KG",
        notes: transNotes,
      });
      notify.success("Stock Movement Logged", {
        description: `Successfully recorded ${qty} KG (${transType}). Stock balance updated.`,
      });
      setTransQty("");
      setTransNotes("");
      setAddStockOpen(false);
      loadData();
    } catch (err: any) {
      notify.error(err.message || "Failed to record stock movement");
    } finally {
      setIsSubmittingTrans(false);
    }
  };

  // Submit medicine usage
  const handleMedUsageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(medUsageQty);
    if (!selectedMedId || isNaN(qty) || qty <= 0) {
      notify.error("Please select medicine and enter a valid quantity.");
      return;
    }

    setIsSubmittingMed(true);
    try {
      await farmService.recordMedicineUsage({
        medicineId: selectedMedId,
        animalId: selectedAnimalId || undefined,
        quantity: qty,
        reason: medUsageReason,
      });
      notify.success("Medicine Usage Recorded", {
        description: `Administered ${qty} doses. Medicine inventory decremented.`,
      });
      setMedUsageQty("");
      setMedUsageReason("");
      setMedUsageOpen(false);
      loadData();
    } catch (err: any) {
      notify.error(err.message || "Failed to record medicine usage");
    } finally {
      setIsSubmittingMed(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Title & Action Buttons */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-cyan-500/15 text-cyan-800 dark:text-cyan-300">
              <Package className="size-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-foreground">
              ଷ୍ଟକ୍ ଓ ଲେଜର୍ · Inventory & Stock Ledger
            </h1>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {isOwner
              ? "Executive feed expenditure, inventory reserves & audit ledger"
              : "Strict ledger formula: Opening + Added − Consumed = Current Stock"}
          </p>
        </div>

        {!isOwner && (
          <div className="flex flex-wrap items-center gap-2">
            {activeTab === "MEDICINE" ? (
              <Button
                onClick={() => setMedUsageOpen(true)}
                className="h-10 gap-2 rounded-2xl bg-rose-700 hover:bg-rose-800 text-white font-black text-xs shadow-md"
              >
                <Pill className="size-4" /> Record Medicine Usage (ଔଷଧ ବ୍ୟବହାର)
              </Button>
            ) : (
              <Button
                onClick={() => setAddStockOpen(true)}
                className="h-10 gap-2 rounded-2xl bg-cyan-700 hover:bg-cyan-800 text-white font-black text-xs shadow-md"
              >
                <Plus className="size-4 stroke-[2.5]" />
                Record Stock Movement (ଷ୍ଟକ୍ ଏଣ୍ଟ୍ରି)
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex rounded-2xl border border-border bg-card p-1 max-w-md">
        <button
          type="button"
          onClick={() => setActiveTab("FEED")}
          className={`flex-1 rounded-xl py-2 text-xs font-bold transition-all ${
            activeTab === "FEED"
              ? "bg-cyan-700 text-white shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          ଫିଡ୍ ଷ୍ଟକ୍ (Feed Ledger)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("MEDICINE")}
          className={`flex-1 rounded-xl py-2 text-xs font-bold transition-all ${
            activeTab === "MEDICINE"
              ? "bg-rose-700 text-white shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          ଔଷଧ ଷ୍ଟକ୍ (Medicine Stock)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("LEDGER")}
          className={`flex-1 rounded-xl py-2 text-xs font-bold transition-all ${
            activeTab === "LEDGER"
              ? "bg-slate-800 text-white shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          ଲେଜର୍ ଇତିହାସ (Audit Log)
        </button>
      </div>

      {/* Top Summary KPI Cards */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <div className="farm-glass rounded-2xl p-3.5">
          <p className="text-[11px] font-bold uppercase text-muted-foreground">
            Current Feed Stock
          </p>
          <p className="mt-1 text-2xl font-black text-foreground">
            {totalCurrentStockKg.toLocaleString()} KG
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground font-semibold">
            Opening + Added − Consumed
          </p>
        </div>

        <div className="farm-glass rounded-2xl p-3.5">
          <p className="text-[11px] font-bold uppercase text-muted-foreground">
            Feed Items Monitored
          </p>
          <p className="mt-1 text-2xl font-black text-cyan-700 dark:text-cyan-300">
            {balances.length} Masters
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">Odia & English Feed Items</p>
        </div>

        <div className="farm-glass rounded-2xl p-3.5">
          <p className="text-[11px] font-bold uppercase text-muted-foreground">
            Medicine Inventory
          </p>
          <p className="mt-1 text-2xl font-black text-rose-700 dark:text-rose-300">
            {medicines.length} Medicines
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">
            {lowStockMeds.length > 0 ? `${lowStockMeds.length} need reorder` : "All buffers healthy"}
          </p>
        </div>

        <div className="farm-glass rounded-2xl p-3.5">
          <p className="text-[11px] font-bold uppercase text-muted-foreground">
            Stock Health Status
          </p>
          <p className="mt-1 text-2xl font-black text-emerald-700 dark:text-emerald-400">
            {lowStockBalances.length === 0 ? "Good" : `${lowStockBalances.length} Low`}
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">
            {lowStockBalances.length === 0 ? "All above buffer threshold" : "Attention needed"}
          </p>
        </div>
      </div>

      {/* TAB 1: CONSOLIDATED FEED STOCK SECTION */}
      {activeTab === "FEED" && (
        <div className="farm-glass rounded-3xl border border-border/80 bg-card/60 p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
            <div>
              <h2 className="text-sm sm:text-base font-black text-foreground flex items-center gap-2">
                <Package className="size-4 text-emerald-600" />
                <span>ଖାଦ୍ୟ ଷ୍ଟକ୍ ତାଲିକା · Consolidated Feed Stock Inventory</span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Live ledger balances: Opening + Supplied − Consumed = Remaining Stock
              </p>
            </div>
            {!isOwner && (
              <Button
                size="sm"
                onClick={() => {
                  setTransType("ADD");
                  setAddStockOpen(true);
                }}
                className="h-8 gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs"
              >
                <Plus className="size-3.5" />
                Supply Feed
              </Button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border/80 text-[11px] font-bold uppercase text-muted-foreground">
                  <th className="py-2.5 px-3">Feed Name (ନାମ)</th>
                  <th className="py-2.5 px-3">Opening</th>
                  <th className="py-2.5 px-3 text-emerald-600 dark:text-emerald-400">Supplied (+)</th>
                  <th className="py-2.5 px-3 text-rose-600 dark:text-rose-400">Consumed (−)</th>
                  <th className="py-2.5 px-3 font-extrabold text-foreground">Remaining Stock</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 font-medium">
                {balances.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-muted-foreground">
                      No feed stock balances found. Click Supply Feed to add stock.
                    </td>
                  </tr>
                ) : (
                  balances.map((item) => (
                    <tr key={item.feedItemId} className="hover:bg-muted/40 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-foreground">
                          {item.displayName || item.localName}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {item.englishName} · {item.category}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-muted-foreground">
                        {item.openingStock} {item.unit}
                      </td>
                      <td className="py-3 px-3 font-bold text-emerald-700 dark:text-emerald-400">
                        +{item.totalAdded} {item.unit}
                      </td>
                      <td className="py-3 px-3 font-bold text-rose-700 dark:text-rose-400">
                        −{item.totalConsumed} {item.unit}
                      </td>
                      <td className="py-3 px-3 font-black text-sm text-foreground">
                        {item.currentStock} {item.unit}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-black ${
                            item.lowStock
                              ? "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                              : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                          }`}
                        >
                          {item.lowStock ? "Low Stock" : "Buffer OK"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: CONSOLIDATED MEDICINE INVENTORY LIST */}
      {activeTab === "MEDICINE" && (
        <div className="farm-glass rounded-3xl border border-border/80 bg-card/60 p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
            <div>
              <h2 className="text-sm sm:text-base font-black text-foreground flex items-center gap-2">
                <Pill className="size-4 text-rose-600" />
                <span>ଔଷଧ ଷ୍ଟକ୍ ତାଲିକା · Medicine & Vaccine Inventory</span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Veterinary medicines, buffer thresholds & usage logs
              </p>
            </div>
            {!isOwner && (
              <Button
                size="sm"
                onClick={() => setMedUsageOpen(true)}
                className="h-8 gap-1.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs"
              >
                <Plus className="size-3.5" />
                Log Medicine Usage
              </Button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border/80 text-[11px] font-bold uppercase text-muted-foreground">
                  <th className="py-2.5 px-3">Medicine Name</th>
                  <th className="py-2.5 px-3">Category / Generic</th>
                  <th className="py-2.5 px-3">Buffer Level</th>
                  <th className="py-2.5 px-3 font-extrabold text-foreground">Available Stock</th>
                  <th className="py-2.5 px-3">Expiry Date</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 font-medium">
                {medicines.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-muted-foreground">
                      No medicines recorded in veterinary inventory.
                    </td>
                  </tr>
                ) : (
                  medicines.map((med) => (
                    <tr key={med.id} className="hover:bg-muted/40 transition-colors">
                      <td className="py-3 px-3 font-bold text-foreground">
                        {med.name}
                      </td>
                      <td className="py-3 px-3 text-muted-foreground text-[11px]">
                        {med.genericName || med.category || "General Veterinary"}
                      </td>
                      <td className="py-3 px-3 text-muted-foreground">
                        Min {med.minimumThreshold} {med.unit}
                      </td>
                      <td className="py-3 px-3 font-black text-sm text-foreground">
                        {med.currentStock} {med.unit}
                      </td>
                      <td className="py-3 px-3 text-muted-foreground text-[11px]">
                        {med.expiryDate || "—"}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-black ${
                            med.lowStock
                              ? "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                              : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                          }`}
                        >
                          {med.lowStock ? "Low Stock" : "Available"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: LEDGER AUDIT LOG */}
      {activeTab === "LEDGER" && (
        <div className="farm-glass rounded-3xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-foreground">
              ଷ୍ଟକ୍ ଲେଜର୍ ଇତିହାସ · Stock Movement Ledger
            </h2>
            <ClipboardList className="size-4 text-muted-foreground" />
          </div>

          <div className="space-y-2">
            {transactions.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">
                No recent stock movements recorded.
              </p>
            ) : (
              transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between rounded-2xl border border-border/60 bg-card/40 p-3 text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-foreground truncate">{tx.feedItemName}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Type: <strong>{tx.transactionType}</strong> · {tx.transactionDate}
                      {tx.notes ? ` · "${tx.notes}"` : ""}
                    </p>
                  </div>

                  <span
                    className={`font-black text-sm shrink-0 flex items-center gap-1 ${
                      tx.transactionType === "ADD" || tx.transactionType === "OPENING"
                        ? "text-emerald-700 dark:text-emerald-400"
                        : "text-rose-700 dark:text-rose-400"
                    }`}
                  >
                    {tx.transactionType === "ADD" || tx.transactionType === "OPENING" ? (
                      <ArrowUpRight className="size-3.5" />
                    ) : (
                      <ArrowDownRight className="size-3.5" />
                    )}
                    {tx.transactionType === "CONSUME" ? `−${tx.quantity}` : `+${tx.quantity}`}{" "}
                    {tx.unit}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MODAL: Record Stock Transaction */}
      {addStockOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <h2 className="text-base font-black text-foreground">
                Record Stock Movement (ଷ୍ଟକ୍ ଏଣ୍ଟ୍ରି)
              </h2>
              <button
                type="button"
                onClick={() => setAddStockOpen(false)}
                className="text-xs font-bold text-muted-foreground hover:text-foreground"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleStockSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">
                  Feed Item (ଖାଦ୍ୟ ସାମଗ୍ରୀ)
                </label>
                <select
                  value={selectedFeedItemId}
                  onChange={(e) => setSelectedFeedItemId(e.target.value)}
                  className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs font-bold"
                >
                  {feedItems.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.displayName || f.localName} ({f.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">
                  Movement Type (ପ୍ରକାର)
                </label>
                <select
                  value={transType}
                  onChange={(e) => setTransType(e.target.value as any)}
                  className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs font-bold"
                >
                  <option value="ADD">Stock Added (ଆସିଲା · Purchase / Delivery)</option>
                  <option value="CONSUME">Stock Consumed (ଖାଇଲେ · Usage)</option>
                  <option value="OPENING">Opening Balance (ପ୍ରାରମ୍ଭିକ ଷ୍ଟକ୍)</option>
                  <option value="ADJUSTMENT">Adjustment (ସଂଶୋଧନ)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">
                  Quantity in KG (ପରିମାଣ)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.1"
                  required
                  placeholder="e.g. 50"
                  value={transQty}
                  onChange={(e) => setTransQty(e.target.value)}
                  className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">
                  Notes / Source (ଟିପ୍ପଣୀ)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Supplier delivery invoice #42"
                  value={transNotes}
                  onChange={(e) => setTransNotes(e.target.value)}
                  className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAddStockOpen(false)}
                  className="flex-1 rounded-xl text-xs font-bold h-10"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingTrans}
                  className="flex-1 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white font-bold text-xs h-10 gap-1.5"
                >
                  {isSubmittingTrans ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  Save Movement
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Record Medicine Usage */}
      {medUsageOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <h2 className="text-base font-black text-foreground">
                Record Medicine Usage (ଔଷଧ ପ୍ରୟୋଗ)
              </h2>
              <button
                type="button"
                onClick={() => setMedUsageOpen(false)}
                className="text-xs font-bold text-muted-foreground hover:text-foreground"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleMedUsageSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">
                  Medicine (ଔଷଧ)
                </label>
                <select
                  value={selectedMedId}
                  onChange={(e) => setSelectedMedId(e.target.value)}
                  className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs font-bold"
                >
                  {medicines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.currentStock} {m.unit} in stock)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">
                  Cow Tag (ଗାଈ ଚିହ୍ନଟ - Tag First)
                </label>
                <select
                  value={selectedAnimalId}
                  onChange={(e) => setSelectedAnimalId(e.target.value)}
                  className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs font-bold"
                >
                  <option value="">General Herd (No specific cow)</option>
                  {animals.map((a) => (
                    <option key={a.id} value={a.id}>
                      Tag: {a.tag} {a.name && a.name !== a.tag ? `(${a.name})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">
                  Dose / Quantity (ମାତ୍ରା)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.1"
                  required
                  placeholder="e.g. 1"
                  value={medUsageQty}
                  onChange={(e) => setMedUsageQty(e.target.value)}
                  className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">
                  Reason / Symptoms (କାରଣ)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mild fever, post-calving calcium dose"
                  value={medUsageReason}
                  onChange={(e) => setMedUsageReason(e.target.value)}
                  className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setMedUsageOpen(false)}
                  className="flex-1 rounded-xl text-xs font-bold h-10"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingMed}
                  className="flex-1 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs h-10 gap-1.5"
                >
                  {isSubmittingMed ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  Record Usage
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
