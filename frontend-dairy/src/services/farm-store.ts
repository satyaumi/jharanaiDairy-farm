import type {
  Animal,
  MilkRecord,
  FeedingRecord,
  HealthCheckRecord,
  VaccinationRecord,
  StockItem,
  FodderField,
  SupplyDispatch,
  FarmAlert,
  TimelineEvent,
} from "@/types/farm";

const STORAGE_KEY_ANIMALS = "dairy_store_animals";
const STORAGE_KEY_MILK = "dairy_store_milk_records";
const STORAGE_KEY_FEEDING = "dairy_store_feeding_records";
const STORAGE_KEY_STOCK = "dairy_store_stock_items";
const STORAGE_KEY_ALERTS = "dairy_store_alerts";

const DEFAULT_TIMELINE = (animalName: string, tag: string): TimelineEvent[] => [
  {
    id: `tl-1-${tag}`,
    type: "added",
    title: "Animal Added to Herd",
    date: "14 months ago",
    detail: `${animalName} (${tag}) was registered into the North Barn herd.`,
    badge: "Registration",
  },
  {
    id: `tl-2-${tag}`,
    type: "weight",
    title: "Weight Recorded",
    date: "10 months ago",
    detail: "Routine weight check recorded at 580 kg. Good growth trajectory.",
    badge: "580 kg",
  },
  {
    id: `tl-3-${tag}`,
    type: "vaccination",
    title: "FMD & Blackquarter Vaccination",
    date: "6 months ago",
    detail: "Administered annual booster dose. No adverse reactions observed.",
    badge: "Booster",
  },
  {
    id: `tl-4-${tag}`,
    type: "health",
    title: "Routine Vet Health Check",
    date: "4 months ago",
    detail: "Hoof condition clean, rumen sound, temperature 38.6°C normal.",
    badge: "Healthy",
  },
  {
    id: `tl-5-${tag}`,
    type: "pregnancy",
    title: "Artificial Insemination & Confirmed Pregnancy",
    date: "3 months ago",
    detail: "Ultrasound confirmed viable pregnancy. Expected calving recorded.",
    badge: "Confirmed",
  },
  {
    id: `tl-6-${tag}`,
    type: "calving",
    title: "Successful Calving",
    date: "1 month ago",
    detail:
      "Delivered a healthy female calf (tag C-1110 Wren). Mother recovered smoothly.",
    badge: "Calved",
  },
  {
    id: `tl-7-${tag}`,
    type: "lactation",
    title: "Lactation Peak Phase Initiated",
    date: "2 weeks ago",
    detail:
      "Lactation cycle 2 in progress with steady morning & evening yield.",
    badge: "Cycle 2",
  },
  {
    id: `tl-8-${tag}`,
    type: "milk",
    title: "Daily Milking Active",
    date: "Today",
    detail: "Morning round recorded: 8.2 L. High fat content and clean draw.",
    badge: "Active",
  },
];

export const INITIAL_ANIMALS: Animal[] = [];

export const INITIAL_STOCK: StockItem[] = [];

export const INITIAL_FIELDS: FodderField[] = [];

export const INITIAL_ALERTS: FarmAlert[] = [];

class FarmStore {
  private getStorage<T>(key: string, defaultValue: T): T {
    if (typeof window === "undefined") return defaultValue;
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private setStorage<T>(key: string, value: T) {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage full or quota exceeded
    }
  }

  getAnimals(): Animal[] {
    return this.getStorage<Animal[]>(STORAGE_KEY_ANIMALS, INITIAL_ANIMALS);
  }

  setAnimals(animals: Animal[]) {
    this.setStorage(STORAGE_KEY_ANIMALS, animals);
  }

  saveAnimal(animal: Animal): Animal[] {
    const list = this.getAnimals();
    const existingIndex = list.findIndex(
      (a) => a.id === animal.id || (a.tag && animal.tag && a.tag.toUpperCase() === animal.tag.toUpperCase()),
    );
    let updated: Animal[];
    if (existingIndex >= 0) {
      updated = [...list];
      updated[existingIndex] = animal;
    } else {
      updated = [animal, ...list];
    }
    this.setStorage(STORAGE_KEY_ANIMALS, updated);
    return updated;
  }

  removeAnimal(idOrTag: string): void {
    const list = this.getAnimals();
    const updated = list.filter(
      (a) => a.id !== idOrTag && a.tag?.toUpperCase() !== idOrTag.toUpperCase()
    );
    this.setStorage(STORAGE_KEY_ANIMALS, updated);
  }

  recordMilk(record: Omit<MilkRecord, "id" | "recordedAt">): MilkRecord {
    const newRecord: MilkRecord = {
      ...record,
      id: `milk-${Date.now()}`,
      recordedAt: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    const existing = this.getStorage<MilkRecord[]>(STORAGE_KEY_MILK, []);
    this.setStorage(STORAGE_KEY_MILK, [newRecord, ...existing]);

    // Also update animal's today yield & timeline
    const animals = this.getAnimals();
    const target = animals.find(
      (a) => a.id === record.animalId || a.tag === record.tag,
    );
    if (target) {
      const updatedAnimal: Animal = {
        ...target,
        yield: Number((target.yield + record.litres).toFixed(1)),
        timeline: [
          {
            id: `tl-milk-${Date.now()}`,
            type: "milk",
            title: `${record.session} Milking Recorded`,
            date: "Just now",
            detail: `${record.litres.toFixed(1)} L recorded (${record.session} session).`,
            badge: `${record.litres.toFixed(1)} L`,
          },
          ...(target.timeline || []),
        ],
      };
      this.saveAnimal(updatedAnimal);
    }

    return newRecord;
  }

  getMilkRecords(): MilkRecord[] {
    return this.getStorage<MilkRecord[]>(STORAGE_KEY_MILK, []);
  }

  getStock(): StockItem[] {
    return this.getStorage<StockItem[]>(STORAGE_KEY_STOCK, INITIAL_STOCK);
  }

  getAlerts(): FarmAlert[] {
    return this.getStorage<FarmAlert[]>(STORAGE_KEY_ALERTS, INITIAL_ALERTS);
  }

  dismissAlert(id: string): FarmAlert[] {
    const list = this.getAlerts().filter((a) => a.id !== id);
    this.setStorage(STORAGE_KEY_ALERTS, list);
    return list;
  }
}

export const farmStore = new FarmStore();
