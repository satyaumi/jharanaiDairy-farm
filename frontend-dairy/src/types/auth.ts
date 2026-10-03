export type Role = "OWNER" | "MANAGER" | "WORKER" | "ADMIN";

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: Role;
  farmName: string;
  avatarUrl?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  phoneOrEmail: string;
  password?: string;
  rememberMe?: boolean;
}

export interface SignupPayload {
  name: string;
  phone: string;
  email?: string;
  password: string;
  farmName: string;
  role?: Role;
}

export interface VerifyOtpPayload {
  phone: string;
  otp: string;
}

export interface ResetPasswordPayload {
  phoneOrEmail: string;
  otp: string;
  newPassword: string;
}

export interface UpdateProfilePayload {
  name?: string;
  email?: string;
  avatarUrl?: string;
}
