/**
 * Unified API Configuration for Jharanai Farm Management Platform.
 *
 * Supports both VITE_API_BASE_URL and VITE_API_URL environment variables.
 * In local development (empty), defaults to relative "/api" (proxied by Vite).
 * In production (e.g. Vercel -> Render), routes all calls directly to the Render Web Service URL.
 */

export function getApiBase(): string {
  const envUrl = (
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    ""
  ).trim().replace(/\/+$/, "");

  if (!envUrl) {
    return "/api";
  }

  if (envUrl.endsWith("/api")) {
    return envUrl;
  }

  return `${envUrl}/api`;
}

export function apiUrl(path: string): string {
  const base = getApiBase();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  if (cleanPath.startsWith("/api/")) {
    return `${base}${cleanPath.substring(4)}`;
  }
  return `${base}${cleanPath}`;
}
