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

export const animals: Animal[] = [
  { id: "a1", name: "Bessie", tag: "C-1024", breed: "Holstein", type: "Lactating", status: "Healthy", age: "4 yr", weight: 628, yield: 8.2, pen: "North barn" },
  { id: "a2", name: "Clover", tag: "C-1018", breed: "Jersey", type: "Lactating", status: "Needs check", age: "5 yr", weight: 492, yield: 7.4, pen: "North barn" },
  { id: "a3", name: "Willow", tag: "C-1041", breed: "Holstein", type: "Pregnant", status: "Healthy", age: "3 yr", weight: 584, yield: 0, pen: "Calving pen", dueDate: "Jun 18" },
  { id: "a4", name: "Daisy", tag: "C-0982", breed: "Brown Swiss", type: "Lactating", status: "Healthy", age: "6 yr", weight: 672, yield: 9.1, pen: "South barn" },
  { id: "a5", name: "Poppy", tag: "C-1056", breed: "Jersey", type: "Calf", status: "Healthy", age: "8 mo", weight: 196, yield: 0, pen: "Young stock" },
  { id: "a6", name: "Fern", tag: "C-1007", breed: "Holstein", type: "Lactating", status: "Sick", age: "5 yr", weight: 614, yield: 5.2, pen: "Recovery pen" },
  { id: "a7", name: "Mabel", tag: "C-1033", breed: "Guernsey", type: "Lactating", status: "Healthy", age: "4 yr", weight: 522, yield: 6.8, pen: "South barn" },
  { id: "a8", name: "Hazel", tag: "C-0973", breed: "Holstein", type: "Dry", status: "Healthy", age: "7 yr", weight: 694, yield: 0, pen: "Dry lot" },
  { id: "a9", name: "Juniper", tag: "C-1062", breed: "Jersey", type: "Lactating", status: "Healthy", age: "3 yr", weight: 478, yield: 7.9, pen: "North barn" },
  { id: "a10", name: "Rosie", tag: "C-0954", breed: "Brown Swiss", type: "Pregnant", status: "Needs check", age: "6 yr", weight: 648, yield: 0, pen: "Calving pen", dueDate: "Jun 21" },
  { id: "a11", name: "Maple", tag: "C-1071", breed: "Holstein", type: "Lactating", status: "Healthy", age: "2 yr", weight: 556, yield: 8.8, pen: "South barn" },
  { id: "a12", name: "Misty", tag: "C-0998", breed: "Jersey", type: "Lactating", status: "Healthy", age: "5 yr", weight: 506, yield: 7.1, pen: "North barn" },
  { id: "a13", name: "Olive", tag: "C-1083", breed: "Holstein", type: "Calf", status: "Healthy", age: "5 mo", weight: 148, yield: 0, pen: "Young stock" },
  { id: "a14", name: "Pearl", tag: "C-0968", breed: "Guernsey", type: "Dry", status: "Healthy", age: "6 yr", weight: 538, yield: 0, pen: "Dry lot" },
  { id: "a15", name: "Luna", tag: "C-1092", breed: "Holstein", type: "Lactating", status: "Healthy", age: "3 yr", weight: 602, yield: 9.4, pen: "South barn" },
  { id: "a16", name: "Bluebell", tag: "C-0911", breed: "Brown Swiss", type: "Pregnant", status: "Healthy", age: "8 yr", weight: 662, yield: 0, pen: "Calving pen", dueDate: "Jul 02" },
  { id: "a17", name: "Maisie", tag: "C-1101", breed: "Jersey", type: "Lactating", status: "Sick", age: "2 yr", weight: 468, yield: 4.8, pen: "Recovery pen" },
  { id: "a18", name: "Wren", tag: "C-1110", breed: "Holstein", type: "Calf", status: "Healthy", age: "3 mo", weight: 102, yield: 0, pen: "Young stock" },
  { id: "a19", name: "Sage", tag: "C-0934", breed: "Guernsey", type: "Lactating", status: "Healthy", age: "7 yr", weight: 514, yield: 6.2, pen: "North barn" },
  { id: "a20", name: "Petal", tag: "C-1128", breed: "Holstein", type: "Lactating", status: "Healthy", age: "2 yr", weight: 574, yield: 8.6, pen: "South barn" },
];

export const milkWeek = [
  { day: "Mon", liters: 812 }, { day: "Tue", liters: 846 }, { day: "Wed", liters: 824 },
  { day: "Thu", liters: 880 }, { day: "Fri", liters: 862 }, { day: "Sat", liters: 902 }, { day: "Today", liters: 924 },
];

export const attentionItems = [
  { name: "Fern · C-1007", issue: "Low yield at morning milking", detail: "5.2 L today · check again this afternoon", level: "Urgent" },
  { name: "Clover · C-1018", issue: "Hoof check due", detail: "Last checked 12 days ago", level: "Today" },
  { name: "Vaccinations", issue: "5 animals due this week", detail: "First dose due tomorrow", level: "Upcoming" },
];

export const stockItems = [
  { name: "Green fodder", category: "Fodder", amount: "2,480", unit: "kg", percent: 76, trend: "steady" },
  { name: "Dry hay", category: "Fodder", amount: "1,860", unit: "kg", percent: 54, trend: "steady" },
  { name: "Dairy concentrate", category: "Feed", amount: "940", unit: "kg", percent: 38, trend: "low" },
  { name: "Mineral mix", category: "Feed", amount: "186", unit: "kg", percent: 62, trend: "steady" },
  { name: "Calf starter", category: "Feed", amount: "320", unit: "kg", percent: 48, trend: "steady" },
  { name: "Vitamin supplement", category: "Medicine", amount: "24", unit: "bottles", percent: 28, trend: "low" },
];

export const recentMilking = [
  { animal: "Bessie", tag: "C-1024", morning: 8.2, evening: 7.8 },
  { animal: "Clover", tag: "C-1018", morning: 7.4, evening: 7.1 },
  { animal: "Daisy", tag: "C-0982", morning: 9.1, evening: 8.6 },
  { animal: "Mabel", tag: "C-1033", morning: 6.8, evening: 6.4 },
  { animal: "Fern", tag: "C-1007", morning: 5.2, evening: 0 },
];

export const fieldRows = [
  { field: "North 1", crop: "Ryegrass", area: "4.2 ac", planted: "Mar 12", harvest: "Jun 28", stage: "Growing", expected: "6.4 t" },
  { field: "West 2", crop: "Alfalfa", area: "3.8 ac", planted: "Feb 22", harvest: "Jun 12", stage: "Ready soon", expected: "5.2 t" },
  { field: "South 3", crop: "Clover mix", area: "2.6 ac", planted: "Apr 03", harvest: "Jul 15", stage: "Growing", expected: "3.8 t" },
];