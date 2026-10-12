export type AnimalStatus = "Healthy" | "Needs check" | "Sick";
export type AnimalType = "Lactating" | "Pregnant" | "Calf" | "Dry";

export type Animal = {
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
  dueDate?: string;
};

export const animals: Animal[] = [];

export const milkWeek: { day: string; liters: number }[] = [];

export const attentionItems: { name: string; issue: string; detail: string; level: string }[] = [];

export const stockItems: { name: string; category: string; amount: string; unit: string; percent: number; trend: string }[] = [];

export const recentMilking: { animal: string; tag: string; morning: number; evening: number }[] = [];

export const fieldRows: { field: string; crop: string; area: string; planted: string; harvest: string; stage: string; expected: string }[] = [];