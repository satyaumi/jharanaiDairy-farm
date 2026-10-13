/**
 * Centralized Role-Based Access Control (RBAC) Module Configuration for Jharanai Farm.
 * Roles: OWNER, MANAGER, WORKER (and ADMIN as system superuser).
 */

export type FarmRole = "OWNER" | "MANAGER" | "WORKER" | "ADMIN";

export interface NavItemConfig {
  id: string;
  label: string;
  badge?: string;
  iconName: string;
  isCustom?: boolean;
}

/**
 * Checks if a user's role is allowed to access a specific route/page.
 */
export function isPageAllowedForRole(page: string, role?: string | null): boolean {
  const normRole = (role || "").toUpperCase();

  switch (page) {
    // Owner-restricted modules (Owner must NOT do routine operations or team admin)
    case "users":
      return normRole === "MANAGER" || normRole === "ADMIN";

    // Worker-restricted modules (Worker must NOT see business analytics, certified reports, or team admin)
    case "analytics":
      return normRole === "OWNER" || normRole === "MANAGER" || normRole === "ADMIN";

    case "reports":
      return normRole === "OWNER" || normRole === "MANAGER" || normRole === "ADMIN";

    // Common pages allowed to authorized roles
    case "home":
    case "performance":
    case "animals":
    case "milking":
    case "feeding":
    case "stock":
    case "health":
    case "fodder":
    case "equipment":
    case "production":
    case "alerts":
    case "more":
    case "settings":
      return true;

    case "supply":
      return normRole === "MANAGER" || normRole === "ADMIN" || normRole === "OWNER";

    default:
      return true;
  }
}

/**
 * Checks if a user's role is allowed to perform a specific action (e.g. QuickAdd modal buttons)
 */
export function isActionAllowedForRole(actionKey: string, role?: string | null): boolean {
  const normRole = (role || "").toUpperCase();

  switch (actionKey) {
    // Owner is business oversight only - NO routine animal/milking/feeding forms
    case "add-animal":
    case "record-milk":
    case "feeding":
    case "save-feed-round":
    case "health":
    case "fodder":
      return normRole === "MANAGER" || normRole === "WORKER" || normRole === "ADMIN";

    case "supply-feed":
    case "stock":
      return normRole === "MANAGER" || normRole === "WORKER" || normRole === "ADMIN";

    case "create-alert":
      return normRole === "MANAGER" || normRole === "ADMIN";

    case "team-admin":
      return normRole === "MANAGER" || normRole === "ADMIN";

    default:
      return true;
  }
}
