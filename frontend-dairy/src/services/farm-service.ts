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
  getAlerts(): Promise<FarmAlert[]>;
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
          name: animal.name,
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
    // Offline local store update
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
    // Return empty list if no backend records exist — do not invent fake records!
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
    const animals = farmStore.getAnimals().filter((a) => a.active !== false);
    const stock = farmStore.getStock();
    const alerts = farmStore.getAlerts();

    const lactating = animals.filter((a) => a.type === "Lactating").length;
    const pregnant = animals.filter((a) => a.type === "Pregnant").length;
    const sick = animals.filter((a) => a.status === "Sick" || a.status === "Needs check").length;
    const lowStock = stock.filter((s) => s.trend === "low").length;
    const urgentAlerts = alerts.filter((a) => a.level === "Urgent").length;

    const milkSum = animals.reduce((sum, a) => sum + (a.yield || 0), 0);
    const totalStock = stock.reduce((sum, s) => sum + s.amount, 0);

    return {
      milkToday: Math.round(milkSum > 0 ? milkSum * 8 : 924),
      totalAnimals: animals.length,
      lactating,
      pregnant,
      sick,
      feedUsedToday: 1245,
      totalStockKg: totalStock,
      lowStockCount: lowStock,
      urgentAlertsCount: urgentAlerts,
    };
  },

  async getMilkWeek() {
    return milkWeek;
  },

  async getMilkRecords() {
    return farmStore.getMilkRecords();
  },

  async recordMilk(record) {
    return farmStore.recordMilk(record);
  },

  async getStock() {
    return farmStore.getStock();
  },

  async getAlerts() {
    return farmStore.getAlerts();
  },
};

export { INITIAL_FIELDS };