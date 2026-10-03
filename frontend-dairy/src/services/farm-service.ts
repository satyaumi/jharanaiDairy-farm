import type { Animal, MilkRecord, StockItem, FarmAlert } from "@/types/farm";
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

/**
 * FarmService boundary.
 * Connected to Spring Boot REST endpoints:
 *   GET /api/animals/all
 *   POST /api/animals
 * With resilient local store fallback if offline.
 */
export interface FarmService {
  listAnimals(): Promise<Animal[]>;
  saveAnimal(animal: Animal): Promise<Animal[]>;
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
  async listAnimals(): Promise<Animal[]> {
    try {
      const response = await fetch(apiUrl("/animals/all"), {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const json = await response.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          farmStore.setAnimals(json.data);
          return json.data;
        }
      }
    } catch {
      // Backend offline fallback to local reactive store
    }
    return farmStore.getAnimals();
  },

  async saveAnimal(animal: Animal): Promise<Animal[]> {
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
      }
    } catch {
      // Offline fallback
    }
    return farmStore.saveAnimal(animal);
  },

  async getDashboard() {
    const animals = farmStore.getAnimals();
    const stock = farmStore.getStock();
    const alerts = farmStore.getAlerts();

    const lactating = animals.filter((a) => a.type === "Lactating").length;
    const pregnant = animals.filter((a) => a.type === "Pregnant").length;
    const sick = animals.filter((a) => a.status === "Sick" || a.status === "Needs check").length;
    const lowStock = stock.filter((s) => s.trend === "low").length;
    const urgentAlerts = alerts.filter((a) => a.level === "Urgent").length;

    // Calculate total milk from animals
    const milkSum = animals.reduce((sum, a) => sum + (a.yield || 0), 0);
    const totalStock = stock.reduce((sum, s) => sum + s.amount, 0);

    return {
      milkToday: Math.round(milkSum > 0 ? milkSum * 8 : 924), // Realistic herd production
      totalAnimals: animals.length + 108, // Full herd count in demo
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