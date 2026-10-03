export type AnimalStatus = "Healthy" | "Needs check" | "Sick";
export type AnimalType = "Lactating" | "Pregnant" | "Calf" | "Dry";

export interface TimelineEvent {
  id: string;
  type:
    | "added"
    | "weight"
    | "vaccination"
    | "health"
    | "pregnancy"
    | "calving"
    | "lactation"
    | "milk";
  title: string;
  date: string;
  detail: string;
  badge?: string;
}

export interface Animal {
  id: string;
  name: string;
  tag: string;
  breed: string;
  type: AnimalType;
  status: AnimalStatus;
  age: string;
  weight: number;
  yield: number;
  pen: string;
  dueDate?: string | undefined;
  lactationCycle?: number | undefined;
  lastMilkingDate?: string | undefined;
  lastHealthCheck?: string | undefined;
  feedRation?: string | undefined;
  // Animal History Details
  birthDate?: string | undefined;
  birthStatus?: string | undefined;
  fatherAnimalId?: string | undefined;
  fatherTag?: string | undefined;
  fatherName?: string | undefined;
  motherAnimalId?: string | undefined;
  motherTag?: string | undefined;
  motherName?: string | undefined;
  aiDate?: string | undefined;
  lastVaccinationDate?: string | undefined;
  vaccinations?:
    { name: string; date: string; status: "Done" | "Due" }[] | undefined;
  timeline?: TimelineEvent[] | undefined;
}

export interface MilkRecord {
  id: string;
  animalId: string;
  animalName: string;
  tag: string;
  session: "Morning" | "Evening";
  litres: number;
  recordedAt: string;
  quality?: "Normal" | "Check needed";
}

export interface FeedingRecord {
  id: string;
  feedType:
    | "Green fodder"
    | "Dry fodder"
    | "Dairy concentrate"
    | "Mineral mix"
    | "Calf starter";
  group: "Milking herd" | "Dry cows" | "Young stock" | "Whole farm";
  quantityKg: number;
  time: string;
  recordedBy?: string;
}

export interface HealthCheckRecord {
  id: string;
  animalId: string;
  animalName: string;
  tag: string;
  status: AnimalStatus;
  temperature?: number;
  symptoms?: string;
  treatment?: string;
  checkDate: string;
  followUpRequired?: boolean;
}

export interface VaccinationRecord {
  id: string;
  animalTag: string;
  animalName: string;
  vaccineName: string;
  administeredDate: string;
  nextDueDate: string;
  notes?: string;
}

export interface StockItem {
  id: string;
  name: string;
  category: "Fodder" | "Feed" | "Medicine";
  amount: number;
  unit: string;
  percent: number;
  trend: "low" | "steady" | "good";
  minThreshold: number;
}

export interface FodderField {
  id: string;
  field: string;
  crop: string;
  area: string;
  planted: string;
  harvest: string;
  stage: "Land" | "Planting" | "Growing" | "Ready soon" | "Harvested";
  expectedYield: string;
}

export interface SupplyDispatch {
  id: string;
  session: "Morning" | "Evening";
  litres: number;
  time: string;
  status: "Ready" | "Collected" | "Dispatched";
  qualityCheck: "Passed" | "Review needed";
  pickupVehicle?: string;
}

export interface FarmAlert {
  id: string;
  category: "health" | "milking" | "breeding" | "vaccination" | "stock";
  title: string;
  subtitle: string;
  level: "Urgent" | "Today" | "Upcoming";
  targetModule: string;
  date: string;
}
