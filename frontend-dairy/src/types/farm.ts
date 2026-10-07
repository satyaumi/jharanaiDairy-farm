export type AnimalStatus = "Healthy" | "Needs check" | "Sick";
export type AnimalType = "Lactating" | "Pregnant" | "Calf" | "Dry";

export type LifecycleStatus =
  | "ACTIVE"
  | "SICK"
  | "SOLD"
  | "DECEASED"
  | "RETIRED"
  | "ARCHIVED";

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
    | "milk"
    | "death"
    | "sale"
    | "retirement"
    | "lifecycle";
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
  lifecycleStatus?: LifecycleStatus | undefined;
  lifecycleDate?: string | undefined;
  lifecycleReason?: string | undefined;
  lifecycleNotes?: string | undefined;
  active?: boolean | undefined;
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

export interface UpdateAnimalData {
  name?: string | undefined;
  tag?: string | undefined;
  breed?: string | undefined;
  type?: AnimalType | undefined;
  status?: AnimalStatus | undefined;
  lifecycleStatus?: LifecycleStatus | undefined;
  age?: string | undefined;
  weight?: number | undefined;
  yield?: number | undefined;
  pen?: string | undefined;
  lactationCycle?: number | undefined;
  feedRation?: string | undefined;
  dueDate?: string | undefined;
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
  lastHealthCheck?: string | undefined;
  active?: boolean | undefined;
}

export interface ChangeLifecycleStatusData {
  status: LifecycleStatus;
  effectiveDate?: string | undefined;
  reason?: string | undefined;
  notes?: string | undefined;
}

export interface AnimalMilkRecordItem {
  id: string;
  recordDate: string;
  shift: string;
  litres: number;
  quality?: string;
  fatPercentage?: number;
  snfPercentage?: number;
  notes?: string;
}

export interface AnimalFeedRecordItem {
  id: string;
  recordDate: string;
  feedType: string;
  groupName: string;
  quantityKg: number;
  recordedBy?: string;
  notes?: string;
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

export interface AnimalGroup {
  id: string;
  farmId?: string;
  name: string;
  code?: string;
  description?: string;
  animalCount?: number;
  active?: boolean;
}

export interface FeedItem {
  id: string;
  farmId?: string;
  englishName: string;
  localName: string;
  displayName?: string;
  category: string;
  unit: string;
  defaultDailyKg?: number;
  active?: boolean;
}

export interface StockBalance {
  feedItemId: string;
  englishName: string;
  localName: string;
  displayName: string;
  category: string;
  unit: string;
  openingStock: number;
  totalAdded: number;
  totalConsumed: number;
  currentStock: number;
  minimumThreshold?: number;
  lowStock?: boolean;
}

export interface StockTransaction {
  id: string;
  feedItemId: string;
  feedItemName: string;
  transactionType: "OPENING" | "ADD" | "CONSUME" | "ADJUSTMENT";
  quantity: number;
  unit: string;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
  transactionDate: string;
  createdAt?: string;
}

export interface Medicine {
  id: string;
  name: string;
  genericName?: string;
  category?: string;
  unit: string;
  currentStock: number;
  minimumThreshold: number;
  batchNumber?: string;
  expiryDate?: string;
  lowStock?: boolean;
  expired?: boolean;
}

export interface MedicineTransaction {
  id: string;
  medicineId: string;
  medicineName: string;
  transactionType: "RECEIPT" | "USAGE" | "DISCARD";
  quantity: number;
  unit: string;
  animalId?: string;
  animalTag?: string;
  reason?: string;
  notes?: string;
  transactionDate: string;
}

export interface MilkSummary {
  todayLitres: number;
  morningLitres: number;
  eveningLitres: number;
  lactatingCowsCount: number;
  averagePerCow: number;
}

export interface BulkMilkRecordItem {
  animalId: string;
  animalTag: string;
  litres: number;
}

