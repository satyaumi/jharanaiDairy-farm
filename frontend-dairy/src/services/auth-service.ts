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

// Support production VITE_API_BASE_URL / VITE_API_URL or local Vite proxy fallback
const AUTH_URL = `${getApiBase()}/auth`;

// Pre-seeded team users from DB migration V5 for team directory reference
export const DEMO_USERS: Record<Role, User> = {
  OWNER: {
    id: "b0000000-0000-0000-0000-000000000001",
    name: "Priya Mehta",
    phone: "+91 98765 43210",
    email: "priya@jharanai.com",
    role: "OWNER",
    farmName: "Jharanai Farm",
  },
  MANAGER: {
    id: "b0000000-0000-0000-0000-000000000002",
    name: "Rajesh Kumar",
    phone: "+91 98765 12345",
    email: "rajesh@jharanai.com",
    role: "MANAGER",
    farmName: "Jharanai Farm",
  },
  WORKER: {
    id: "b0000000-0000-0000-0000-000000000003",
    name: "Suresh Patil",
    phone: "+91 98765 67890",
    email: "suresh@jharanai.com",
    role: "WORKER",
    farmName: "Jharanai Farm",
  },
  ADMIN: {
    id: "b0000000-0000-0000-0000-000000000004",
    name: "Farm Administrator",
    phone: "+91 98765 00000",
    email: "admin@dairyplatform.com",
    role: "ADMIN",
    farmName: "Jharanai Farm",
  },
};

// Demo credentials for easy testing across roles (mapped to seeded DB users)
export const DEMO_CREDENTIALS: Record<Role, { phoneOrEmail: string; password?: string; label: string; roleName: string }> = {
  OWNER: {
    phoneOrEmail: "+91 98765 43210",
    password: "password123",
    label: "Priya Mehta",
    roleName: "Farm Owner",
  },
  MANAGER: {
    phoneOrEmail: "+91 98765 12345",
    password: "password123",
    label: "Rajesh Kumar",
    roleName: "Farm Manager",
  },
  WORKER: {
    phoneOrEmail: "+91 98765 67890",
    password: "password123",
    label: "Suresh Patil",
    roleName: "Dairy Worker",
  },
  ADMIN: {
    phoneOrEmail: "admin@dairyplatform.com",
    password: "password123",
    label: "Administrator",
    roleName: "Platform Admin",
  },
};

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
      const response = await fetch(`${this.baseUrl}/login`, {
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
   * Register a new Farm Owner account and tenant farm
   */
  async signup(payload: SignupPayload): Promise<{ token: string; user: User }> {
    try {
      const response = await fetch(`${this.baseUrl}/signup`, {
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
      const response = await fetch(`${this.baseUrl}/me`, {
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
    const response = await fetch(`${this.baseUrl}/profile`, {
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
      const response = await fetch(`${this.baseUrl}/forgot-password`, {
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
    const response = await fetch(`${this.baseUrl}/reset-password`, {
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
    const response = await fetch(`${this.baseUrl}/verify-otp`, {
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

  /**
   * Terminate user session
   */
  async logout(): Promise<void> {
    try {
      const token = this.getToken();
      if (token) {
        await fetch(`${this.baseUrl}/logout`, {
          method: "POST",
          headers: this.getAuthHeaders(),
        });
      }
    } catch {
      // Ignore network errors on logout
    } finally {
      this.clearSession();
    }
  }
}

export const authService = new AuthService();
