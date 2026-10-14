import type {
  User,
  Role,
  LoginCredentials,
  SignupPayload,
  VerifyOtpPayload,
  ResetPasswordPayload,
  UpdateProfilePayload,
} from "@/types/auth";

export const TOKEN_KEY = "dairy_farm_auth_token";
export const USER_KEY = "dairy_farm_auth_user";

import { getApiBase } from "@/lib/api-config";

// API base URL configuration
const AUTH_URL = `${getApiBase()}/auth`;

const AUTH_TIMEOUT_MS = 45000;

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = AUTH_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("Request timed out. The server may be starting up, please try again.");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

class AuthService {
  private baseUrl: string = AUTH_URL;

  getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
  }

  getStoredUser(): User | null {
    if (typeof window === "undefined") return null;
    const userJson = localStorage.getItem(USER_KEY);
    if (!userJson) return null;
    try {
      return JSON.parse(userJson);
    } catch {
      return null;
    }
  }

  isTokenExpired(token: string | null): boolean {
    if (!token) return true;
    try {
      const parts = token.split(".");
      if (parts.length < 2) return true;
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      const parsed = JSON.parse(jsonPayload);
      if (!parsed.exp) return false;
      return Date.now() >= parsed.exp * 1000;
    } catch {
      return false;
    }
  }

  setSession(token: string, user: User) {
    if (typeof window === "undefined") return;
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  clearSession() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  private getAuthHeaders(): HeadersInit {
    const token = this.getToken();
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  /**
   * Authenticate user with Email/Phone + password against Spring Boot backend
   */
  async login(credentials: LoginCredentials): Promise<{ token: string; user: User }> {
    try {
      const response = await fetchWithTimeout(`${this.baseUrl}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneOrEmail: credentials.phoneOrEmail.trim(),
          password: credentials.password,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 401 || response.status === 400) {
          throw new Error(data?.message || "Invalid mobile/email or password.");
        }
        if (response.status === 403) {
          throw new Error("Your account is disabled. Please contact the administrator.");
        }
        throw new Error(data?.message || "Login failed. Please try again.");
      }

      const payload = data?.data || data;
      if (!payload?.token || !payload?.user) {
        throw new Error("Invalid response format received from server.");
      }

      const user: User = {
        id: payload.user.id,
        name: payload.user.name,
        phone: payload.user.phone || payload.user.mobileNumber || "",
        email: payload.user.email,
        role: payload.user.role,
        farmName: payload.user.farmName || "Jharanai Farm",
        avatarUrl: payload.user.avatarUrl,
      };

      this.setSession(payload.token, user);
      return { token: payload.token, user };
    } catch (err: unknown) {
      if (err instanceof Error) throw err;
      throw new Error("Unable to connect to the server. Please check your internet connection.");
    }
  }

  /**
   * Request OTP for role-based account login
   */
  async sendLoginOtp(phoneOrEmail: string, requestedRole?: Role): Promise<{ success: boolean; message: string; email?: string; role?: string; sandboxOtp?: string }> {
    try {
      const response = await fetchWithTimeout(`${this.baseUrl}/send-login-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneOrEmail: phoneOrEmail.trim(),
          requestedRole,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Failed to dispatch verification code.");
      }

      return data;
    } catch (err: unknown) {
      if (err instanceof Error) throw err;
      throw new Error("Unable to dispatch verification code. Please check your connection.");
    }
  }

  /**
   * Authenticate and establish session using verified OTP and backend assigned role
   */
  async loginWithOtp(phoneOrEmail: string, otp: string, requestedRole?: Role): Promise<{ token: string; user: User }> {
    try {
      const response = await fetchWithTimeout(`${this.baseUrl}/login-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneOrEmail: phoneOrEmail.trim(),
          otp: otp.trim(),
          requestedRole,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Invalid verification code.");
      }

      const payload = data?.data || data;
      if (!payload?.token || !payload?.user) {
        throw new Error("Invalid response format received from server.");
      }

      const user: User = {
        id: payload.user.id,
        name: payload.user.name,
        phone: payload.user.phone || payload.user.mobileNumber || "",
        email: payload.user.email,
        role: payload.user.role,
        farmName: payload.user.farmName || "Jharanai Farm",
        avatarUrl: payload.user.avatarUrl,
      };

      this.setSession(payload.token, user);
      return { token: payload.token, user };
    } catch (err: unknown) {
      if (err instanceof Error) throw err;
      throw new Error("Unable to verify OTP. Please try again.");
    }
  }

  /**
   * Register a new Farm Owner account and tenant farm
   */
  async signup(payload: SignupPayload): Promise<{ token: string; user: User }> {
    try {
      const response = await fetchWithTimeout(`${this.baseUrl}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: payload.name.trim(),
          phone: payload.phone.trim(),
          email: payload.email?.trim() || null,
          password: payload.password,
          farmName: payload.farmName.trim(),
          role: payload.role || "OWNER",
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error(data?.message || "An account with this phone number or email already exists.");
        }
        if (response.status === 400) {
          const detailMsg = Array.isArray(data?.details) ? data.details.join(", ") : data?.message;
          throw new Error(detailMsg || "Please verify your input fields.");
        }
        throw new Error(data?.message || "Failed to create account. Please try again.");
      }

      const resData = data?.data || data;
      const user: User = {
        id: resData.user.id,
        name: resData.user.name,
        phone: resData.user.phone,
        email: resData.user.email,
        role: resData.user.role,
        farmName: resData.user.farmName || payload.farmName,
      };

      if (resData.token) {
        this.setSession(resData.token, user);
      }

      return { token: resData.token, user };
    } catch (err: unknown) {
      if (err instanceof Error) throw err;
      throw new Error("Unable to complete registration. Please check server connectivity.");
    }
  }

  /**
   * Fetch currently authenticated user profile from backend
   */
  async getCurrentUser(): Promise<User> {
    const token = this.getToken();
    if (!token || this.isTokenExpired(token)) {
      this.clearSession();
      throw new Error("Session expired. Please log in again.");
    }

    try {
      const response = await fetchWithTimeout(`${this.baseUrl}/me`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          this.clearSession();
          throw new Error("Session expired or unauthorized.");
        }
        // If server 5xx or offline, use stored session if available
        const stored = this.getStoredUser();
        if (stored) return stored;
        throw new Error("Server temporarily unavailable.");
      }

      const json = await response.json();
      const payload = json?.data || json;

      const user: User = {
        id: payload.id,
        name: payload.name,
        phone: payload.phone || payload.mobileNumber || "",
        email: payload.email,
        role: payload.role,
        farmName: payload.farmName || "Jharanai Farm",
        avatarUrl: payload.avatarUrl,
      };

      localStorage.setItem(USER_KEY, JSON.stringify(user));
      return user;
    } catch (err: unknown) {
      const stored = this.getStoredUser();
      if (stored && !this.isTokenExpired(token)) {
        return stored;
      }
      if (err instanceof Error && err.message.includes("Session expired")) {
        throw err;
      }
      throw new Error("Unable to reach server. Please check your connection.");
    }
  }

  /**
   * Update permitted profile fields
   */
  async updateProfile(payload: UpdateProfilePayload): Promise<User> {
    const response = await fetchWithTimeout(`${this.baseUrl}/profile`, {
      method: "PUT",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.message || "Failed to update profile.");
    }

    const updated = data?.data || data;
    const currentUser = this.getStoredUser();
    const user: User = {
      ...currentUser,
      id: updated.id,
      name: updated.name,
      phone: updated.phone,
      email: updated.email,
      role: updated.role,
      farmName: updated.farmName || currentUser?.farmName || "Jharanai Farm",
      avatarUrl: updated.avatarUrl,
    };

    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  }

  /**
   * Request password reset code via Resend Email / SMS
   */
  async sendResetOtp(phoneOrEmail: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetchWithTimeout(`${this.baseUrl}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneOrEmail: phoneOrEmail.trim() }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Failed to dispatch verification code.");
      }

      return {
        success: true,
        message: data?.message || "Verification code dispatched successfully to your registered email.",
      };
    } catch (err: unknown) {
      if (err instanceof Error) throw err;
      throw new Error("Unable to connect to server. Please try again.");
    }
  }

  /**
   * Reset password with verification code
   */
  async resetPassword(payload: ResetPasswordPayload): Promise<boolean> {
    const response = await fetchWithTimeout(`${this.baseUrl}/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.message || "Failed to reset password. Please check your verification code.");
    }

    return true;
  }

  /**
   * Verify OTP
   */
  async verifyOtp(payload: VerifyOtpPayload): Promise<{ token: string; user: User }> {
    const response = await fetchWithTimeout(`${this.baseUrl}/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(data?.message || "Invalid verification code.");
    }

    const resData = data?.data || data;
    const user: User = {
      id: resData.user.id,
      name: resData.user.name,
      phone: resData.user.phone,
      email: resData.user.email,
      role: resData.user.role,
      farmName: resData.user.farmName || "Jharanai Farm",
    };

    this.setSession(resData.token, user);
    return { token: resData.token, user };
  }

  async getSetupStatus(): Promise<{ managementSetupAvailable: boolean; systemInitialized: boolean; message: string }> {
    try {
      const res = await fetchWithTimeout(`${this.baseUrl}/setup-status`);
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    return { managementSetupAvailable: false, systemInitialized: true, message: "" };
  }

  async setupInitialManager(payload: {
    fullName: string;
    email: string;
    mobile: string;
    password: string;
    setupToken?: string;
  }): Promise<{ token: string; user: User }> {
    const res = await fetchWithTimeout(`${this.baseUrl}/setup-initial-manager`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const j = await res.json();
    if (!res.ok) {
      throw new Error(j.message || "Failed to set up initial management account");
    }
    const user: User = {
      id: j.user.id,
      name: j.user.name,
      email: j.user.email,
      phone: j.user.phone || payload.mobile,
      role: j.user.role,
      farmId: j.user.farmId,
      farmName: j.user.farmName || "Jharanai Farm",
      avatar: j.user.avatar,
    };
    this.setSession(j.token, user);
    return { token: j.token, user };
  }

  /**
   * Terminate user session
   */
  async logout(): Promise<void> {
    try {
      const token = this.getToken();
      if (token) {
        await fetchWithTimeout(`${this.baseUrl}/logout`, {
          method: "POST",
          headers: this.getAuthHeaders(),
        }, 5000);
      }
    } catch {
      // Ignore network errors on logout
    } finally {
      this.clearSession();
    }
  }
}

export const authService = new AuthService();
