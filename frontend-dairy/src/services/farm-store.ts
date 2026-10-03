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

export const INITIAL_ANIMALS: Animal[] = [
  {
    id: "a1",
    name: "Bessie",
    tag: "C-1024",
    breed: "Holstein",
    type: "Lactating",
    status: "Healthy",
    age: "4 yr",
    weight: 628,
    yield: 16.0,
    pen: "North barn",
    lactationCycle: 2,
    feedRation: "18 kg Green + 4 kg Concentrate",
    birthDate: "2022-03-12",
    birthStatus: "Normal Calving",
    fatherTag: "C-050",
    fatherName: "Sultan (HF Bull)",
    motherTag: "C-087",
    motherName: "Ganga",
    aiDate: "2026-01-15",
    lastVaccinationDate: "2026-08-10",
    vaccinations: [
      { name: "FMD Booster", date: "Jan 15", status: "Done" },
      { name: "Clostridial 8-way", date: "Apr 20", status: "Done" },
      { name: "Anthrax Preventive", date: "Nov 10", status: "Due" },
    ],
    timeline: DEFAULT_TIMELINE("Bessie", "C-1024"),
  },
  {
    id: "a2",
    name: "Clover",
    tag: "C-1018",
    breed: "Jersey",
    type: "Lactating",
    status: "Needs check",
    age: "5 yr",
    weight: 492,
    yield: 14.5,
    pen: "North barn",
    lactationCycle: 3,
    feedRation: "15 kg Green + 3.5 kg Concentrate",
    birthDate: "2021-04-18",
    birthStatus: "Normal Calving",
    fatherTag: "C-042",
    fatherName: "Jersey Pride",
    motherTag: "C-076",
    motherName: "Moti",
    aiDate: "2026-02-20",
    lastVaccinationDate: "2026-07-15",
    vaccinations: [
      { name: "Brucellosis", date: "Feb 10", status: "Done" },
      { name: "Hoof Care Treatment", date: "Today", status: "Due" },
    ],
    timeline: [
      {
        id: "tl-clover-1",
        type: "health",
        title: "Hoof Soreness Detected",
        date: "Yesterday",
        detail:
          "Mild limp noticed after morning round. Scheduled for vet check today.",
        badge: "Urgent",
      },
      ...DEFAULT_TIMELINE("Clover", "C-1018"),
    ],
  },
  {
    id: "a3",
    name: "Willow",
    tag: "C-1041",
    breed: "Holstein",
    type: "Pregnant",
    status: "Healthy",
    age: "3 yr",
    weight: 584,
    yield: 0,
    pen: "Calving pen",
    dueDate: "Oct 12",
    lactationCycle: 1,
    feedRation: "Special Dry Cow Ration + Minerals",
    birthDate: "2023-05-10",
    birthStatus: "Assisted",
    fatherTag: "C-050",
    fatherName: "Sultan (HF Bull)",
    motherTag: "C-091",
    motherName: "Yamuna",
    aiDate: "2026-01-05",
    lastVaccinationDate: "2026-09-15",
    vaccinations: [
      { name: "Scour Vaccine (Pre-calving)", date: "Sep 15", status: "Done" },
    ],
    timeline: [
      {
        id: "tl-willow-1",
        type: "pregnancy",
        title: "Calving Window Approaching",
        date: "Oct 12 (in 10 days)",
        detail:
          "Transferred to soft straw calving pen. Monitored for labor signs.",
        badge: "Expected Oct 12",
      },
      ...DEFAULT_TIMELINE("Willow", "C-1041"),
    ],
  },
  {
    id: "a4",
    name: "Daisy",
    tag: "C-0982",
    breed: "Brown Swiss",
    type: "Lactating",
    status: "Healthy",
    age: "6 yr",
    weight: 672,
    yield: 17.7,
    pen: "South barn",
    lactationCycle: 4,
    feedRation: "20 kg Green + 5 kg Concentrate",
    birthDate: "2020-02-14",
    birthStatus: "Twin Calving",
    fatherTag: "C-033",
    fatherName: "Swiss Star",
    motherTag: "C-065",
    motherName: "Laxmi",
    aiDate: "2025-11-20",
    lastVaccinationDate: "2026-03-18",
    vaccinations: [{ name: "HS Booster", date: "Mar 18", status: "Done" }],
    timeline: DEFAULT_TIMELINE("Daisy", "C-0982"),
  },
  {
    id: "a5",
    name: "Poppy",
    tag: "C-1056",
    breed: "Jersey",
    type: "Calf",
    status: "Healthy",
    age: "8 mo",
    weight: 196,
    yield: 0,
    pen: "Young stock",
    feedRation: "Calf Starter Pellet + Lucerne Hay",
    vaccinations: [
      { name: "Calfhood Brucella", date: "May 20", status: "Done" },
    ],
    timeline: [
      {
        id: "tl-poppy-1",
        type: "calving",
        title: "Calf Birth",
        date: "8 months ago",
        detail: "Born healthy. Received colostrum within 2 hours.",
        badge: "Healthy calf",
      },
    ],
  },
  {
    id: "a6",
    name: "Fern",
    tag: "C-1007",
    breed: "Holstein",
    type: "Lactating",
    status: "Sick",
    age: "5 yr",
    weight: 614,
    yield: 5.2,
    pen: "Recovery pen",
    lactationCycle: 3,
    feedRation: "Recovery Mash & Electrolite water",
    vaccinations: [
      { name: "Antibiotic course", date: "Ongoing", status: "Due" },
    ],
    timeline: [
      {
        id: "tl-fern-1",
        type: "health",
        title: "Mastitis & Appetite Drop",
        date: "Today · 6:00 am",
        detail:
          "Low yield 5.2 L. Right rear quarter swollen. Isolated to recovery pen.",
        badge: "Critical",
      },
      ...DEFAULT_TIMELINE("Fern", "C-1007"),
    ],
  },
  {
    id: "a7",
    name: "Mabel",
    tag: "C-1033",
    breed: "Guernsey",
    type: "Lactating",
    status: "Healthy",
    age: "4 yr",
    weight: 522,
    yield: 13.2,
    pen: "South barn",
    lactationCycle: 2,
    timeline: DEFAULT_TIMELINE("Mabel", "C-1033"),
  },
  {
    id: "a8",
    name: "Hazel",
    tag: "C-0973",
    breed: "Holstein",
    type: "Dry",
    status: "Healthy",
    age: "7 yr",
    weight: 694,
    yield: 0,
    pen: "Dry lot",
    timeline: DEFAULT_TIMELINE("Hazel", "C-0973"),
  },
  {
    id: "a9",
    name: "Juniper",
    tag: "C-1062",
    breed: "Jersey",
    type: "Lactating",
    status: "Healthy",
    age: "3 yr",
    weight: 478,
    yield: 15.8,
    pen: "North barn",
    lactationCycle: 1,
    timeline: DEFAULT_TIMELINE("Juniper", "C-1062"),
  },
  {
    id: "a10",
    name: "Rosie",
    tag: "C-0954",
    breed: "Brown Swiss",
    type: "Pregnant",
    status: "Needs check",
    age: "6 yr",
    weight: 648,
    yield: 0,
    pen: "Calving pen",
    dueDate: "Oct 18",
    timeline: DEFAULT_TIMELINE("Rosie", "C-0954"),
  },
  {
    id: "a11",
    name: "Maple",
    tag: "C-1071",
    breed: "Holstein",
    type: "Lactating",
    status: "Healthy",
    age: "2 yr",
    weight: 556,
    yield: 17.6,
    pen: "South barn",
    lactationCycle: 1,
    timeline: DEFAULT_TIMELINE("Maple", "C-1071"),
  },
  {
    id: "a12",
    name: "Luna",
    tag: "C-1092",
    breed: "Holstein",
    type: "Lactating",
    status: "Healthy",
    age: "3 yr",
    weight: 602,
    yield: 18.8,
    pen: "South barn",
    lactationCycle: 2,
    timeline: DEFAULT_TIMELINE("Luna", "C-1092"),
  },
];

export const INITIAL_STOCK: StockItem[] = [
  {
    id: "s1",
    name: "Green fodder (Napier & Maize)",
    category: "Fodder",
    amount: 2480,
    unit: "kg",
    percent: 76,
    trend: "steady",
    minThreshold: 1000,
  },
  {
    id: "s2",
    name: "Dry hay (Lucerne & Rhodes)",
    category: "Fodder",
    amount: 1860,
    unit: "kg",
    percent: 54,
    trend: "steady",
    minThreshold: 800,
  },
  {
    id: "s3",
    name: "Dairy concentrate (20% CP)",
    category: "Feed",
    amount: 940,
    unit: "kg",
    percent: 38,
    trend: "low",
    minThreshold: 1200,
  },
  {
    id: "s4",
    name: "Chelated Mineral mix",
    category: "Feed",
    amount: 186,
    unit: "kg",
    percent: 62,
    trend: "steady",
    minThreshold: 100,
  },
  {
    id: "s5",
    name: "Calf starter pellet",
    category: "Feed",
    amount: 320,
    unit: "kg",
    percent: 48,
    trend: "steady",
    minThreshold: 200,
  },
  {
    id: "s6",
    name: "Vitamin A, D3, E Oral",
    category: "Medicine",
    amount: 24,
    unit: "bottles",
    percent: 28,
    trend: "low",
    minThreshold: 50,
  },
];

export const INITIAL_FIELDS: FodderField[] = [
  {
    id: "f1",
    field: "North Field 1",
    crop: "Hybrid Napier",
    area: "4.2 acres",
    planted: "Mar 12",
    harvest: "Every 45 days",
    stage: "Growing",
    expectedYield: "6.4 tonnes",
  },
  {
    id: "f2",
    field: "West Field 2",
    crop: "Alfalfa / Lucerne",
    area: "3.8 acres",
    planted: "Feb 22",
    harvest: "Within 6 days",
    stage: "Ready soon",
    expectedYield: "5.2 tonnes",
  },
  {
    id: "f3",
    field: "South Field 3",
    crop: "Fodder Sorghum & Cowpea",
    area: "2.6 acres",
    planted: "Apr 03",
    harvest: "Jul 15",
    stage: "Growing",
    expectedYield: "3.8 tonnes",
  },
];

export const INITIAL_ALERTS: FarmAlert[] = [
  {
    id: "alt-1",
    category: "health",
    title: "Fern (C-1007) · Low Yield & Fever",
    subtitle:
      "5.2 L today (drop of 45%). Isolated to recovery pen. Check again before evening.",
    level: "Urgent",
    targetModule: "health",
    date: "Today · 6:45 am",
  },
  {
    id: "alt-2",
    category: "breeding",
    title: "Willow (C-1041) · Calving Window in 10 Days",
    subtitle: "Expected Oct 12. Move to clean straw bedding calving pen.",
    level: "Today",
    targetModule: "animals",
    date: "Today · Morning",
  },
  {
    id: "alt-3",
    category: "health",
    title: "Clover (C-1018) · Hoof Inspection Due",
    subtitle: "Left hind leg soreness noticed during milking.",
    level: "Today",
    targetModule: "health",
    date: "Today · Morning",
  },
  {
    id: "alt-4",
    category: "vaccination",
    title: "5 Animals Due for Clostridial Booster",
    subtitle: "Veterinarian visit scheduled for tomorrow morning.",
    level: "Upcoming",
    targetModule: "health",
    date: "Tomorrow · 9:00 am",
  },
  {
    id: "alt-5",
    category: "stock",
    title: "Dairy Concentrate Low (38% remaining)",
    subtitle: "940 kg left. Below 5-day buffer threshold. Order restock batch.",
    level: "Today",
    targetModule: "stock",
    date: "Today · Morning",
  },
];

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
    const existingIndex = list.findIndex((a) => a.id === animal.id);
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
    return this.getStorage<MilkRecord[]>(STORAGE_KEY_MILK, [
      {
        id: "m-1",
        animalId: "a1",
        animalName: "Bessie",
        tag: "C-1024",
        session: "Morning",
        litres: 8.2,
        recordedAt: "6:15 am",
      },
      {
        id: "m-2",
        animalId: "a2",
        animalName: "Clover",
        tag: "C-1018",
        session: "Morning",
        litres: 7.4,
        recordedAt: "6:20 am",
      },
      {
        id: "m-3",
        animalId: "a4",
        animalName: "Daisy",
        tag: "C-0982",
        session: "Morning",
        litres: 9.1,
        recordedAt: "6:30 am",
      },
      {
        id: "m-4",
        animalId: "a7",
        animalName: "Mabel",
        tag: "C-1033",
        session: "Morning",
        litres: 6.8,
        recordedAt: "6:40 am",
      },
      {
        id: "m-5",
        animalId: "a12",
        animalName: "Luna",
        tag: "C-1092",
        session: "Morning",
        litres: 9.4,
        recordedAt: "6:50 am",
      },
    ]);
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
