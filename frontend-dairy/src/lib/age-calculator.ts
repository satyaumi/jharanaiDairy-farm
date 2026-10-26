/**
 * Utility functions for calculating and formatting animal age from Date of Birth.
 * Farm-consistent date-only calculation preventing UTC drift.
 */

export function calculateAgeFromDob(birthDate?: string | null, fallbackAge?: string | null): string {
  if (!birthDate || birthDate.trim() === "") {
    return fallbackAge && fallbackAge.trim() !== "" ? fallbackAge.trim() : "Unknown";
  }

  // Parse date-only string (YYYY-MM-DD) safely to avoid timezone day-shift
  const parts = birthDate.split("-");
  let dob: Date;
  if (parts.length === 3) {
    const year = parseInt(parts[0]!, 10);
    const month = parseInt(parts[1]!, 10) - 1; // 0-indexed
    const day = parseInt(parts[2]!, 10);
    dob = new Date(year, month, day);
  } else {
    dob = new Date(birthDate);
  }

  if (isNaN(dob.getTime())) {
    return fallbackAge && fallbackAge.trim() !== "" ? fallbackAge.trim() : "Unknown";
  }

  const now = new Date();
  // Strip time for exact date comparison
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (dob > today) {
    return "Invalid (Future Date)";
  }

  let years = today.getFullYear() - dob.getFullYear();
  let months = today.getMonth() - dob.getMonth();
  let days = today.getDate() - dob.getDate();

  if (days < 0) {
    months -= 1;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  if (years > 0 && months > 0) {
    return `${years} ${years === 1 ? "year" : "years"}, ${months} ${months === 1 ? "month" : "months"}`;
  }
  if (years > 0) {
    return `${years} ${years === 1 ? "year" : "years"}`;
  }
  if (months > 0) {
    return `${months} ${months === 1 ? "month" : "months"}`;
  }

  return "Under 1 month";
}

export function formatDateDisplay(dateStr?: string | null): string {
  if (!dateStr || dateStr.trim() === "") return "Unknown";
  try {
    const parts = dateStr.split("-");
    let d: Date;
    if (parts.length === 3) {
      d = new Date(parseInt(parts[0]!, 10), parseInt(parts[1]!, 10) - 1, parseInt(parts[2]!, 10));
    } else {
      d = new Date(dateStr);
    }
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
}

export function isDateInFuture(dateStr?: string | null): boolean {
  if (!dateStr) return false;
  const parts = dateStr.split("-");
  let d: Date;
  if (parts.length === 3) {
    d = new Date(parseInt(parts[0]!, 10), parseInt(parts[1]!, 10) - 1, parseInt(parts[2]!, 10));
  } else {
    d = new Date(dateStr);
  }
  if (isNaN(d.getTime())) return false;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return d > today;
}
