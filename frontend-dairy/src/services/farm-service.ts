import type {
  Animal,
  MilkRecord,
  StockItem,
  FarmAlert,
  UpdateAnimalData,
  ChangeLifecycleStatusData,
  AnimalMilkRecordItem,
  AnimalFeedRecordItem,
  TimelineEvent,
  LifecycleStatus,
  AnimalGroup,
  FeedItem,
  StockBalance,
  StockTransaction,
  Medicine,
  MedicineTransaction,
  MilkSummary,
  BulkMilkRecordItem,
} from "@/types/farm";
import { farmStore, INITIAL_FIELDS } from "./farm-store";
import { milkWeek } from "@/lib/farm-data";
import { authService } from "./auth-service";
import { apiUrl } from "@/lib/api-config";

function getAuthHeaders(): HeadersInit {
  const token = authService.getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface FarmService {
  listAnimals(params?: {
    active?: boolean;
    lifecycleStatus?: LifecycleStatus;
    search?: string;
  }): Promise<Animal[]>;
  getAnimalById(id: string): Promise<Animal>;
  saveAnimal(animal: Partial<Animal>): Promise<Animal[]>;
  updateAnimal(id: string, data: UpdateAnimalData): Promise<Animal>;
  deleteAnimal(idOrTag: string, reason?: string): Promise<{ success: boolean; message: string }>;
  changeLifecycleStatus(id: string, data: ChangeLifecycleStatusData): Promise<Animal>;
  getAnimalMilkRecords(animalId: string): Promise<AnimalMilkRecordItem[]>;
  getAnimalFeedRecords(animalId: string): Promise<AnimalFeedRecordItem[]>;
  getAnimalHistory(animalId: string): Promise<TimelineEvent[]>;
  getDashboard(): Promise<{
    milkToday: number;
    totalAnimals: number;
    lactating: number;
    pregnant: number;
    sick: number;
    feedUsedToday: number;
    totalStockKg: number;
    lowStockCount: number;
    urgentAlertsCount: number;
  }>;
  getMilkWeek(): Promise<typeof milkWeek>;
  getMilkRecords(): Promise<MilkRecord[]>;
  recordMilk(record: Omit<MilkRecord, "id" | "recordedAt">): Promise<MilkRecord>;
  getStock(): Promise<StockItem[]>;
  getAlerts(): Promise<any[]>;
  createAlert(data: {
    title: string;
    message: string;
    category?: string;
    severity?: string;
    targetRole?: string;
    targetUserId?: string;
    cowNumber?: string;
    animalId?: string;
    dueDate?: string;
  }): Promise<any>;
  markAlertAsRead(alertId: string): Promise<boolean>;
  dismissAlert(alertId: string): Promise<boolean>;

  // Real backend modules
  listGroups(): Promise<AnimalGroup[]>;
  getAnimalGroups(): Promise<AnimalGroup[]>;
  createGroup(group: Partial<AnimalGroup>): Promise<AnimalGroup>;
  listFeedItems(): Promise<FeedItem[]>;
  createFeedItem(item: Partial<FeedItem>): Promise<FeedItem>;
  getStockBalances(): Promise<StockBalance[]>;
  getStockTransactions(feedItemId?: string): Promise<StockTransaction[]>;
  recordStockTransaction(data: {
    feedItemId: string;
    transactionType: "ADD" | "CONSUME" | "ADJUSTMENT" | "OPENING";
    quantity: number;
    unit?: string;
    notes?: string;
    referenceType?: string;
  }): Promise<StockTransaction>;
  getMedicines(): Promise<Medicine[]>;
  recordMedicineUsage(data: {
    medicineId: string;
    animalId?: string;
    quantity: number;
    reason?: string;
    notes?: string;
  }): Promise<MedicineTransaction>;
  recordMedicineReceipt(data: {
    medicineId: string;
    quantity: number;
    batchNumber?: string;
    expiryDate?: string;
    notes?: string;
  }): Promise<MedicineTransaction>;
  getMedicineTransactions(medicineId?: string): Promise<MedicineTransaction[]>;
  getMilkSummary(): Promise<MilkSummary>;
  recordBulkMilk(data: {
    shift: string;
    recordDate: string;
    groupId?: string;
    records?: { animalId?: string; cowNumber?: string; tag?: string; litres: number; notes?: string; quality?: string }[];
    entries?: { animalId?: string; cowNumber?: string; tag?: string; litres: number; notes?: string; quality?: string }[];
  }): Promise<{ count: number; totalLitres: number; message: string }>;
  recordFeeding(data: {
    feedItemId?: string;
    feedType?: string;
    groupId?: string;
    groupName?: string;
    animalId?: string;
    quantityKg: number;
    recordDate?: string;
    notes?: string;
  }): Promise<any>;
  getFeedingRecords(date?: string): Promise<any[]>;
}

export const farmService: FarmService = {
  async listAnimals(params): Promise<Animal[]> {
    try {
      const query = new URLSearchParams();
      if (params?.active !== undefined) query.set("active", String(params.active));
      if (params?.lifecycleStatus) query.set("lifecycleStatus", params.lifecycleStatus);

      const url = apiUrl(`/animals/all${query.toString() ? `?${query.toString()}` : ""}`);
      const response = await fetch(url, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const json = await response.json();
        if (json.success && Array.isArray(json.data)) {
          farmStore.setAnimals(json.data);
          return json.data;
        }
      }
    } catch {
      // Backend offline fallback to local reactive store
    }
    return farmStore.getAnimals();
  },

  async getAnimalById(id: string): Promise<Animal> {
    try {
      const response = await fetch(apiUrl(`/animals/${id}`), {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const json = await response.json();
        if (json.success && json.data) {
          return json.data;
        }
      }
    } catch {
      // Offline fallback
    }
    const found = farmStore.getAnimals().find((a) => a.id === id);
    if (!found) {
      throw new Error(`Animal ${id} not found.`);
    }
    return found;
  },

  async saveAnimal(animal: Partial<Animal>): Promise<Animal[]> {
    try {
      const response = await fetch(apiUrl("/animals"), {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: animal.name || animal.tag,
          tag: animal.tag,
          breed: animal.breed,
          type: animal.type,
          status: animal.status,
          age: animal.age,
          weight: animal.weight,
          yield: animal.yield,
          pen: animal.pen,
          lactationCycle: animal.lactationCycle,
          feedRation: animal.feedRation,
          birthDate: animal.birthDate,
          birthStatus: animal.birthStatus,
          fatherAnimalId: animal.fatherAnimalId,
          fatherTag: animal.fatherTag,
          fatherName: animal.fatherName,
          motherAnimalId: animal.motherAnimalId,
          motherTag: animal.motherTag,
          motherName: animal.motherName,
          aiDate: animal.aiDate,
          lastVaccinationDate: animal.lastVaccinationDate,
        }),
      });
      if (response.ok) {
        const res = await response.json();
        if (res.success && res.data) {
          return farmStore.saveAnimal(res.data);
        }
      } else {
        const errJson = await response.json().catch(() => null);
        throw new Error(errJson?.message || "Failed to save animal.");
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.message !== "Failed to fetch") {
        throw err;
      }
    }
    return farmStore.saveAnimal(animal as Animal);
  },

  async updateAnimal(id: string, data: UpdateAnimalData): Promise<Animal> {
    try {
      const response = await fetch(apiUrl(`/animals/${id}`), {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (response.ok) {
        const res = await response.json();
        if (res.success && res.data) {
          farmStore.saveAnimal(res.data);
          return res.data;
        }
      } else {
        const errJson = await response.json().catch(() => null);
        throw new Error(errJson?.message || "Failed to update animal.");
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.message !== "Failed to fetch") {
        throw err;
      }
    }
    const current = farmStore.getAnimals().find((a) => a.id === id);
    if (!current) throw new Error("Animal not found in local store.");
    const updated: Animal = {
      ...current,
      ...data,
      name: data.name ?? current.name,
      tag: data.tag ?? current.tag,
      breed: data.breed ?? current.breed,
      type: data.type ?? current.type,
      status: data.status ?? current.status,
    };
    farmStore.saveAnimal(updated);
    return updated;
  },

  async deleteAnimal(idOrTag: string, reason?: string): Promise<{ success: boolean; message: string }> {
    const q = reason ? `?reason=${encodeURIComponent(reason)}` : "";
    const response = await fetch(apiUrl(`/animals/${encodeURIComponent(idOrTag)}${q}`), {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (response.ok) {
      const res = await response.json();
      farmStore.removeAnimal(idOrTag);
      return { success: true, message: res.message || "Animal archived successfully" };
    } else {
      const errJson = await response.json().catch(() => null);
      throw new Error(errJson?.message || "Failed to delete/archive animal.");
    }
  },

  async changeLifecycleStatus(
    id: string,
    data: ChangeLifecycleStatusData,
  ): Promise<Animal> {
    try {
      const response = await fetch(apiUrl(`/animals/${id}/lifecycle`), {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (response.ok) {
        const res = await response.json();
        if (res.success && res.data) {
          farmStore.saveAnimal(res.data);
          return res.data;
        }
      } else {
        const errJson = await response.json().catch(() => null);
        throw new Error(errJson?.message || "Failed to change lifecycle status.");
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.message !== "Failed to fetch") {
        throw err;
      }
    }

    const current = farmStore.getAnimals().find((a) => a.id === id);
    if (!current) throw new Error("Animal not found in local store.");
    const isInactive =
      data.status === "SOLD" ||
      data.status === "DECEASED" ||
      data.status === "RETIRED" ||
      data.status === "ARCHIVED";
    const updated: Animal = {
      ...current,
      lifecycleStatus: data.status,
      lifecycleDate: data.effectiveDate || new Date().toISOString().split("T")[0],
      lifecycleReason: data.reason,
      lifecycleNotes: data.notes,
      active: !isInactive,
    };
    farmStore.saveAnimal(updated);
    return updated;
  },

  async getAnimalMilkRecords(animalId: string): Promise<AnimalMilkRecordItem[]> {
    try {
      const response = await fetch(apiUrl(`/animals/${animalId}/milk`), {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const json = await response.json();
        if (json.success && Array.isArray(json.data)) {
          return json.data;
        }
      }
    } catch {
      // Fallback
    }
    return [];
  },

  async getAnimalFeedRecords(animalId: string): Promise<AnimalFeedRecordItem[]> {
    try {
      const response = await fetch(apiUrl(`/animals/${animalId}/feed`), {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const json = await response.json();
        if (json.success && Array.isArray(json.data)) {
          return json.data;
        }
      }
    } catch {
      // Fallback
    }
    return [];
  },

  async getAnimalHistory(animalId: string): Promise<TimelineEvent[]> {
    try {
      const response = await fetch(apiUrl(`/animals/${animalId}/history`), {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const json = await response.json();
        if (json.success && Array.isArray(json.data)) {
          return json.data.map((h: any) => ({
            id: h.id,
            type:
              h.eventType === "DEATH"
                ? "death"
                : h.eventType === "SALE"
                ? "sale"
                : h.eventType === "RETIREMENT"
                ? "retirement"
                : h.eventType === "VACCINATION"
                ? "vaccination"
                : h.eventType === "HEALTH_CHECK"
                ? "health"
                : h.eventType === "AI"
                ? "pregnancy"
                : h.eventType === "BIRTH"
                ? "added"
                : "lifecycle",
            title: h.title,
            date: h.eventDate,
            detail: h.detail,
            badge: h.badge,
          }));
        }
      }
    } catch {
      // Fallback
    }
    return [];
  },

  async getDashboard() {
    let animals = farmStore.getAnimals().filter((a) => a.active !== false);
    try {
      const res = await fetch(apiUrl("/animals/all?active=true"), { headers: getAuthHeaders() });
      if (res.ok) {
        const j = await res.json();
        if (j.success && Array.isArray(j.data)) {
          animals = j.data;
        }
      }
    } catch {}

    let milkToday = 0;
    try {
      const milkRes = await fetch(apiUrl("/milk/summary"), { headers: getAuthHeaders() });
      if (milkRes.ok) {
        const j = await milkRes.json();
        if (j.success && j.data?.todayLitres !== undefined) {
          milkToday = Math.round(j.data.todayLitres);
        }
      }
    } catch {
      const milkSum = animals.reduce((sum, a) => sum + (a.yield || 0), 0);
      milkToday = Math.round(milkSum > 0 ? milkSum : 0);
    }

    let totalStockKg = 0;
    let lowStockCount = 0;
    try {
      const stockRes = await fetch(apiUrl("/stock"), { headers: getAuthHeaders() });
      if (stockRes.ok) {
        const j = await stockRes.json();
        if (j.success && Array.isArray(j.data)) {
          const balances: StockBalance[] = j.data;
          totalStockKg = balances.reduce((sum, b) => sum + (b.currentStock || 0), 0);
          lowStockCount = balances.filter((b) => b.lowStock).length;
        }
      }
    } catch {
      const stock = farmStore.getStock();
      totalStockKg = stock.reduce((sum, s) => sum + s.amount, 0);
      lowStockCount = stock.filter((s) => s.trend === "low").length;
    }

    let feedUsedToday = 0;
    try {
      const today = new Date().toISOString().split("T")[0];
      const feedRes = await fetch(apiUrl(`/feeding?date=${today}`), { headers: getAuthHeaders() });
      if (feedRes.ok) {
        const j = await feedRes.json();
        if (j.success && Array.isArray(j.data)) {
          feedUsedToday = j.data.reduce((sum: number, f: any) => sum + (f.quantityKg || 0), 0);
        }
      }
    } catch {}

    const lactating = animals.filter((a) => a.type === "Lactating").length;
    const pregnant = animals.filter((a) => a.type === "Pregnant").length;
    const sick = animals.filter((a) => a.status === "Sick" || a.status === "Needs check").length;
    const alerts = farmStore.getAlerts();
    const urgentAlerts = alerts.filter((a) => a.level === "Urgent").length;

    return {
      milkToday,
      totalAnimals: animals.length,
      lactating,
      pregnant,
      sick,
      feedUsedToday: Math.round(feedUsedToday),
      totalStockKg: Math.round(totalStockKg),
      lowStockCount,
      urgentAlertsCount: urgentAlerts,
    };
  },

  async getMilkWeek() {
    return milkWeek;
  },

  async getMilkRecords() {
    try {
      const res = await fetch(apiUrl("/milk"), { headers: getAuthHeaders() });
      if (res.ok) {
        const j = await res.json();
        if (j.success && Array.isArray(j.data)) {
          return j.data.map((r: any) => ({
            id: r.id,
            animalId: r.animalId,
            animalName: r.animalName || r.animalTag,
            tag: r.animalTag,
            session: (r.shift === "EVENING" ? "Evening" : "Morning") as "Morning" | "Evening",
            litres: r.litres,
            recordedAt: r.recordDate,
            quality: (r.quality === "CHECK_NEEDED" ? "Check needed" : "Normal") as "Normal" | "Check needed",
          }));
        }
      }
    } catch {}
    return farmStore.getMilkRecords();
  },

  async recordMilk(record: any) {
    try {
      const targetDate = record.recordDate || record.date || new Date().toISOString().split("T")[0];
      const shiftVal = record.shift || record.session || "Morning";
      const normalizedShift = String(shiftVal).toLowerCase().includes("eve") ? "Evening" : "Morning";

      const res = await fetch(apiUrl("/milk"), {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          animalId: record.animalId,
          cowNumber: record.cowNumber || record.tag,
          tag: record.tag || record.cowNumber,
          litres: record.litres,
          shift: normalizedShift,
          recordDate: targetDate,
          quality: record.quality || "Normal",
          notes: record.notes,
        }),
      });
      if (res.ok) {
        const j = await res.json();
        if (j.success && j.data) {
          const persisted: MilkRecord = {
            id: j.data.id,
            animalId: j.data.animalId,
            animalName: j.data.animalName || record.animalName,
            tag: j.data.animalTag || record.tag,
            session: normalizedShift,
            litres: j.data.litres,
            recordedAt: j.data.recordDate,
            quality: record.quality || "Normal",
          };
          farmStore.recordMilk(persisted);
          return persisted;
        }
      }
    } catch {}
    return farmStore.recordMilk(record);
  },

  async getStock() {
    return farmStore.getStock();
  },

  async getAlerts(): Promise<any[]> {
    try {
      const res = await fetch(apiUrl("/alerts"), { headers: getAuthHeaders() });
      if (res.ok) {
        const j = await res.json();
        if (j.success && Array.isArray(j.data)) return j.data;
      }
    } catch {}
    return farmStore.getAlerts();
  },

  async createAlert(data: {
    title: string;
    message: string;
    category?: string;
    severity?: string;
    targetRole?: string;
    targetUserId?: string;
    cowNumber?: string;
    animalId?: string;
    dueDate?: string;
  }): Promise<any> {
    const res = await fetch(apiUrl("/alerts"), {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const j = await res.json();
    if (!res.ok || !j.success) {
      throw new Error(j.message || "Failed to create farm alert");
    }
    return j.data;
  },

  async markAlertAsRead(alertId: string): Promise<boolean> {
    try {
      const res = await fetch(apiUrl(`/alerts/${alertId}/read`), {
        method: "PATCH",
        headers: getAuthHeaders(),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async dismissAlert(alertId: string): Promise<boolean> {
    try {
      const res = await fetch(apiUrl(`/alerts/${alertId}`), {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // -------------------------------------------------------------
  // Groups
  // -------------------------------------------------------------
  async listGroups(): Promise<AnimalGroup[]> {
    try {
      const res = await fetch(apiUrl("/groups"), { headers: getAuthHeaders() });
      if (res.ok) {
        const j = await res.json();
        if (j.success && Array.isArray(j.data)) return j.data;
      }
    } catch {}
    return [
      { id: "grp-1", name: "ଗୋଠ କ (Group A - High Lactating)", code: "GRP-A", animalCount: 18 },
      { id: "grp-2", name: "ଗୋଠ ଖ (Group B - Moderate Lactating)", code: "GRP-B", animalCount: 14 },
      { id: "grp-3", name: "ଶୁଖିଲା ଗାଈ (Dry Cows)", code: "GRP-C", animalCount: 6 },
      { id: "grp-4", name: "ବାଛୁରୀ (Calves & Young)", code: "GRP-D", animalCount: 10 },
    ];
  },

  async getAnimalGroups(): Promise<AnimalGroup[]> {
    return this.listGroups();
  },

  async createGroup(group: Partial<AnimalGroup>): Promise<AnimalGroup> {
    const res = await fetch(apiUrl("/groups"), {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(group),
    });
    const j = await res.json();
    if (!res.ok || !j.success) throw new Error(j.message || "Failed to create group");
    return j.data;
  },

  // -------------------------------------------------------------
  // Feed Items Master
  // -------------------------------------------------------------
  async listFeedItems(): Promise<FeedItem[]> {
    try {
      const res = await fetch(apiUrl("/feed-items"), { headers: getAuthHeaders() });
      if (res.ok) {
        const j = await res.json();
        if (j.success && Array.isArray(j.data)) return j.data;
      }
    } catch {}
    return [
      { id: "feed-1", englishName: "Dry Straw", localName: "ନଡ଼ା (Nada)", displayName: "ନଡ଼ା · Dry Straw (Nada)", category: "ROUGHAGE", unit: "KG" },
      { id: "feed-2", englishName: "Wheat Bran", localName: "ଚୋକଡ଼ା (Chokada)", displayName: "ଚୋକଡ଼ା · Wheat Bran (Chokada)", category: "CONCENTRATE", unit: "KG" },
      { id: "feed-3", englishName: "Green Fodder (Hybrid Napier)", localName: "ହାଇବ୍ରିଡ ନେପିୟର ଘାସ", displayName: "ନେପିୟର ଘାସ · Green Fodder", category: "GREEN_FODDER", unit: "KG" },
      { id: "feed-4", englishName: "Corn Silage", localName: "ମକା ସାଇଲେଜ୍ (Corn Silage)", displayName: "ମକା ସାଇଲେଜ୍ · Corn Silage", category: "SILAGE", unit: "KG" },
      { id: "feed-5", englishName: "Mineral Mixture", localName: "ଧାତବ ଲବଣ ମିଶ୍ରଣ", displayName: "ଖଣିଜ ଲବଣ · Mineral Mix", category: "SUPPLEMENT", unit: "KG" },
    ];
  },

  async createFeedItem(item: Partial<FeedItem>): Promise<FeedItem> {
    const res = await fetch(apiUrl("/feed-items"), {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(item),
    });
    const j = await res.json();
    if (!res.ok || !j.success) throw new Error(j.message || "Failed to create feed item");
    return j.data;
  },

  // -------------------------------------------------------------
  // Stock Balances & Ledger Transactions
  // -------------------------------------------------------------
  async getStockBalances(): Promise<StockBalance[]> {
    try {
      const res = await fetch(apiUrl("/stock"), { headers: getAuthHeaders() });
      if (res.ok) {
        const j = await res.json();
        if (j.success && Array.isArray(j.data)) return j.data;
      }
    } catch {}
    return [
      {
        feedItemId: "feed-1",
        englishName: "Dry Straw",
        localName: "ନଡ଼ା (Nada)",
        displayName: "ନଡ଼ା · Dry Straw (Nada)",
        category: "ROUGHAGE",
        unit: "KG",
        openingStock: 40,
        totalAdded: 60,
        totalConsumed: 30,
        currentStock: 70,
        minimumThreshold: 50,
        lowStock: false,
      },
      {
        feedItemId: "feed-2",
        englishName: "Wheat Bran",
        localName: "ଚୋକଡ଼ା (Chokada)",
        displayName: "ଚୋକଡ଼ା · Wheat Bran (Chokada)",
        category: "CONCENTRATE",
        unit: "KG",
        openingStock: 100,
        totalAdded: 250,
        totalConsumed: 120,
        currentStock: 230,
        minimumThreshold: 100,
        lowStock: false,
      },
    ];
  },

  async getStockTransactions(feedItemId?: string): Promise<StockTransaction[]> {
    try {
      const url = apiUrl(`/stock/transactions${feedItemId ? `?feedItemId=${feedItemId}` : ""}`);
      const res = await fetch(url, { headers: getAuthHeaders() });
      if (res.ok) {
        const j = await res.json();
        if (j.success && Array.isArray(j.data)) return j.data;
      }
    } catch {}
    return [];
  },

  async recordStockTransaction(data): Promise<StockTransaction> {
    const res = await fetch(apiUrl("/stock/transactions"), {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const j = await res.json();
    if (!res.ok || !j.success) throw new Error(j.message || "Failed to record stock movement");
    return j.data;
  },

  // -------------------------------------------------------------
  // Medicines Inventory & Usage
  // -------------------------------------------------------------
  async getMedicines(): Promise<Medicine[]> {
    try {
      const res = await fetch(apiUrl("/medicine"), { headers: getAuthHeaders() });
      if (res.ok) {
        const j = await res.json();
        if (j.success && Array.isArray(j.data)) return j.data;
      }
    } catch {}
    return [];
  },

  async recordMedicineUsage(data): Promise<MedicineTransaction> {
    const res = await fetch(apiUrl("/medicine/usage"), {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const j = await res.json();
    if (!res.ok || !j.success) throw new Error(j.message || "Failed to record medicine usage");
    return j.data;
  },

  async recordMedicineReceipt(data): Promise<MedicineTransaction> {
    const res = await fetch(apiUrl("/medicine/receipt"), {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const j = await res.json();
    if (!res.ok || !j.success) throw new Error(j.message || "Failed to record medicine receipt");
    return j.data;
  },

  async getMedicineTransactions(medicineId?: string): Promise<MedicineTransaction[]> {
    try {
      const url = apiUrl(`/medicine/transactions${medicineId ? `?medicineId=${medicineId}` : ""}`);
      const res = await fetch(url, { headers: getAuthHeaders() });
      if (res.ok) {
        const j = await res.json();
        if (j.success && Array.isArray(j.data)) return j.data;
      }
    } catch {}
    return [];
  },

  // -------------------------------------------------------------
  // Milk Operations & Bulk Group Entry
  // -------------------------------------------------------------
  async getMilkSummary(): Promise<MilkSummary> {
    try {
      const res = await fetch(apiUrl("/milk/summary"), { headers: getAuthHeaders() });
      if (res.ok) {
        const j = await res.json();
        if (j.success && j.data) return j.data;
      }
    } catch {}
    return {
      todayLitres: 0,
      morningLitres: 0,
      eveningLitres: 0,
      lactatingCowsCount: 0,
      averagePerCow: 0,
    };
  },

  async recordBulkMilk(data: {
    shift: string;
    recordDate: string;
    groupId?: string;
    records?: { animalId?: string; cowNumber?: string; tag?: string; litres: number; notes?: string; quality?: string }[];
    entries?: { animalId?: string; cowNumber?: string; tag?: string; litres: number; notes?: string; quality?: string }[];
  }): Promise<{ count: number; totalLitres: number; message: string }> {
    const list = data.entries || data.records || [];
    const normalizedShift =
      data.shift?.toUpperCase() === "EVENING" || data.shift?.toLowerCase() === "evening"
        ? "Evening"
        : "Morning";

    const payload = {
      shift: normalizedShift,
      recordDate: data.recordDate,
      groupId: data.groupId,
      entries: list.map((item) => ({
        animalId: item.animalId,
        cowNumber: item.cowNumber || item.tag,
        tag: item.tag || item.cowNumber,
        litres: item.litres,
        notes: item.notes,
        quality: item.quality || "Normal",
      })),
      records: list.map((item) => ({
        animalId: item.animalId,
        cowNumber: item.cowNumber || item.tag,
        tag: item.tag || item.cowNumber,
        litres: item.litres,
        notes: item.notes,
        quality: item.quality || "Normal",
      })),
    };

    const res = await fetch(apiUrl("/milk/bulk"), {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const j = await res.json();
    if (!res.ok || !j.success) {
      throw new Error(j.message || "Failed to save milk records");
    }

    // Sync records to reactive local store
    list.forEach((item) => {
      farmStore.recordMilk({
        animalId: item.animalId || item.cowNumber || "",
        animalName: item.cowNumber || item.tag || "",
        tag: item.tag || item.cowNumber || "",
        litres: item.litres,
        session: normalizedShift as "Morning" | "Evening",
        date: data.recordDate,
        fat: 4.1,
        snf: 8.8,
        temperature: 3.8,
      });
    });

    const count = j.recordedCount ?? j.data?.length ?? list.length;
    const totalLitres = j.totalLitres !== undefined ? Number(j.totalLitres) : list.reduce((sum, e) => sum + e.litres, 0);

    return {
      count,
      totalLitres,
      message: j.message || `Successfully recorded ${count} entries (${totalLitres.toFixed(1)} L)`,
    };
  },

  // -------------------------------------------------------------
  // Feeding Records & Stock Auto-Consumption
  // -------------------------------------------------------------
  async recordFeeding(data: {
    feedItemId?: string;
    feedType?: string;
    groupId?: string;
    groupName?: string;
    animalId?: string;
    quantityKg: number;
    recordDate?: string;
    notes?: string;
  }): Promise<any> {
    const res = await fetch(apiUrl("/feeding"), {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const j = await res.json();
    if (!res.ok || !j.success) throw new Error(j.message || "Failed to record feeding");
    return j.data;
  },

  async getFeedingRecords(date?: string): Promise<any[]> {
    try {
      const url = apiUrl(`/feeding${date ? `?date=${date}` : ""}`);
      const res = await fetch(url, { headers: getAuthHeaders() });
      if (res.ok) {
        const j = await res.json();
        if (j.success && Array.isArray(j.data)) return j.data;
      }
    } catch {}
    return [];
  },
};

export { INITIAL_FIELDS };