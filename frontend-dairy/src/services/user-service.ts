import type {
  TeamMember,
  TeamSummary,
  CreateWorkerPayload,
  CreateManagementPayload,
  UpdateUserPayload,
  UserStatus,
  InvitationInfo,
} from "@/types/team";
import { authService, TOKEN_KEY } from "@/services/auth-service";

import { getApiBase } from "@/lib/api-config";

const API_BASE = getApiBase();

class UserService {
  private getAuthHeaders(): HeadersInit {
    const token =
      authService.getToken() ||
      (typeof window !== "undefined"
        ? localStorage.getItem(TOKEN_KEY) || localStorage.getItem("dairyfarm_auth_token")
        : null);

    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  async getFarmUsers(params?: {
    search?: string;
    role?: string;
    status?: string;
    department?: string;
  }): Promise<TeamMember[]> {
    const query = new URLSearchParams();
    if (params?.search) query.append("search", params.search);
    if (params?.role) query.append("role", params.role);
    if (params?.status) query.append("status", params.status);
    if (params?.department) query.append("department", params.department);

    const url = `${API_BASE}/users${query.toString() ? `?${query.toString()}` : ""}`;
    const res = await fetch(url, {
      method: "GET",
      headers: this.getAuthHeaders(),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || "Failed to fetch team members.");
    }

    const json = await res.json();
    return json.data || [];
  }

  async getTeamSummary(): Promise<TeamSummary> {
    const res = await fetch(`${API_BASE}/users/summary`, {
      method: "GET",
      headers: this.getAuthHeaders(),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || "Failed to fetch team summary.");
    }

    const json = await res.json();
    return json.data || {
      totalMembers: 0,
      managementCount: 0,
      workerCount: 0,
      activeCount: 0,
      pendingCount: 0,
    };
  }

  async getUserById(id: string): Promise<TeamMember> {
    const res = await fetch(`${API_BASE}/users/${id}`, {
      method: "GET",
      headers: this.getAuthHeaders(),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || "Failed to fetch user profile.");
    }

    const json = await res.json();
    return json.data;
  }

  async createWorker(payload: CreateWorkerPayload): Promise<TeamMember> {
    const res = await fetch(`${API_BASE}/users/workers`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    const json = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(json?.message || "Failed to create worker profile.");
    }

    return json.data;
  }

  async createManagement(payload: CreateManagementPayload): Promise<TeamMember> {
    const res = await fetch(`${API_BASE}/users/management`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    const json = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(json?.message || "Failed to add management member.");
    }

    return json.data;
  }

  async updateUser(id: string, payload: UpdateUserPayload): Promise<TeamMember> {
    const res = await fetch(`${API_BASE}/users/${id}`, {
      method: "PUT",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    const json = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(json?.message || "Failed to update member profile.");
    }

    return json.data;
  }

  async updateStatus(id: string, status: UserStatus): Promise<TeamMember> {
    const res = await fetch(`${API_BASE}/users/${id}/status`, {
      method: "PATCH",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ status }),
    });

    const json = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(json?.message || "Failed to change user status.");
    }

    return json.data;
  }

  async resendInvitation(id: string): Promise<TeamMember> {
    const res = await fetch(`${API_BASE}/users/${id}/resend-invitation`, {
      method: "POST",
      headers: this.getAuthHeaders(),
    });

    const json = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(json?.message || "Failed to resend invitation.");
    }

    return json.data;
  }

  async getInvitationInfo(token: string): Promise<InvitationInfo> {
    const res = await fetch(`${API_BASE}/auth/invitation-info?token=${encodeURIComponent(token)}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      return { valid: false, message: "Invalid or expired invitation link." };
    }

    return await res.json();
  }

  async activateAccount(token: string, password: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/auth/activate-account`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    const json = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(json?.message || "Failed to activate account.");
    }

    return json;
  }
}

export const userService = new UserService();
