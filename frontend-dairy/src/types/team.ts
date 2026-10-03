import type { Role } from "./auth";

export type UserStatus = "ACTIVE" | "PENDING_ACTIVATION" | "INVITED" | "INACTIVE" | "SUSPENDED";

export interface TeamMember {
  id: string;
  farmId: string;
  farmName: string;
  fullName: string;
  username: string;
  email: string | null;
  mobileNumber: string;
  role: Role;
  employeeId: string;
  department: string;
  jobPosition: string;
  assignedArea: string;
  shift: string;
  employmentStatus: string;
  status: UserStatus;
  active: boolean;
  verified: boolean;
  joiningDate: string | null;
  emergencyContact: string | null;
  responsibilities: string | null;
  avatarUrl: string | null;
  invitationSentAt: string | null;
  invitationPending: boolean;
  invitationToken: string | null;
  createdAt: string;
}

export interface TeamSummary {
  totalMembers: number;
  managementCount: number;
  workerCount: number;
  activeCount: number;
  pendingCount: number;
}

export interface CreateWorkerPayload {
  fullName: string;
  mobileNumber: string;
  email?: string;
  department?: string;
  jobPosition?: string;
  assignedArea?: string;
  shift?: string;
  employmentStatus?: string;
  joiningDate?: string;
  emergencyContact?: string;
  sendInvitation?: boolean;
}

export interface CreateManagementPayload {
  fullName: string;
  email: string;
  mobileNumber: string;
  department?: string;
  jobPosition?: string;
  responsibilities?: string;
  employmentStatus?: string;
  joiningDate?: string;
  sendInvitation?: boolean;
}

export interface UpdateUserPayload {
  fullName?: string;
  email?: string;
  mobileNumber?: string;
  department?: string;
  jobPosition?: string;
  assignedArea?: string;
  shift?: string;
  employmentStatus?: string;
  joiningDate?: string;
  emergencyContact?: string;
  responsibilities?: string;
}

export interface InvitationInfo {
  valid: boolean;
  name?: string;
  username?: string;
  role?: Role;
  farmName?: string;
  message?: string;
}
