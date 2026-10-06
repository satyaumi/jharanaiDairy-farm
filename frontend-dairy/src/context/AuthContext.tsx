import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import type {
  User,
  Role,
  AuthState,
  LoginCredentials,
  SignupPayload,
  ResetPasswordPayload,
  UpdateProfilePayload,
  VerifyOtpPayload,
} from "@/types/auth";
import { authService } from "@/services/auth-service";

interface AuthContextValue extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  sendLoginOtp: (phoneOrEmail: string, role?: Role) => Promise<{ success: boolean; message: string; email?: string; role?: string }>;
  loginWithOtp: (phoneOrEmail: string, otp: string, role?: Role) => Promise<void>;
  signup: (payload: SignupPayload) => Promise<void>;
  verifyOtp: (payload: VerifyOtpPayload) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<void>;
  resetPassword: (payload: ResetPasswordPayload) => Promise<boolean>;
  sendResetOtp: (phoneOrEmail: string) => Promise<{ success: boolean; message: string }>;
  isOwner: boolean;
  isManager: boolean;
  isWorker: boolean;
  isAdmin: boolean;
  canViewReports: boolean;
  canEditSettings: boolean;
  canManageTeam: boolean;
  canManageHerd: boolean;
  canLogOperations: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isRestoringSession, setIsRestoringSession] = useState<boolean>(true);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);

  const isLoading = isRestoringSession || isActionLoading;

  // Initialize and validate session on mount
  useEffect(() => {
    async function initAuth() {
      try {
        const storedToken = authService.getToken();
        const storedUser = authService.getStoredUser();

        if (storedToken && !authService.isTokenExpired(storedToken)) {
          // Pre-populate with stored user for instant UI rendering
          if (storedUser) {
            setUser(storedUser);
            setToken(storedToken);
          }

          // Verify with backend
          try {
            const freshUser = await authService.getCurrentUser();
            setUser(freshUser);
            setToken(storedToken);
          } catch {
            if (authService.isTokenExpired(storedToken)) {
              authService.clearSession();
              setUser(null);
              setToken(null);
            } else if (storedUser) {
              setUser(storedUser);
              setToken(storedToken);
            }
          }
        } else {
          authService.clearSession();
          setUser(null);
          setToken(null);
        }
      } catch {
        authService.clearSession();
        setUser(null);
        setToken(null);
      } finally {
        setIsRestoringSession(false);
      }
    }

    void initAuth();
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsActionLoading(true);
    try {
      const res = await authService.login(credentials);
      setUser(res.user);
      setToken(res.token);
    } finally {
      setIsActionLoading(false);
    }
  }, []);

  const sendLoginOtp = useCallback(async (phoneOrEmail: string, role?: Role) => {
    return await authService.sendLoginOtp(phoneOrEmail, role);
  }, []);

  const loginWithOtp = useCallback(async (phoneOrEmail: string, otp: string, role?: Role) => {
    setIsActionLoading(true);
    try {
      const res = await authService.loginWithOtp(phoneOrEmail, otp, role);
      setUser(res.user);
      setToken(res.token);
    } finally {
      setIsActionLoading(false);
    }
  }, []);

  const signup = useCallback(async (payload: SignupPayload) => {
    setIsActionLoading(true);
    try {
      const res = await authService.signup(payload);
      if (res.token) {
        setUser(res.user);
        setToken(res.token);
      }
    } finally {
      setIsActionLoading(false);
    }
  }, []);

  const verifyOtp = useCallback(async (payload: VerifyOtpPayload) => {
    setIsActionLoading(true);
    try {
      const res = await authService.verifyOtp(payload);
      setUser(res.user);
      setToken(res.token);
    } finally {
      setIsActionLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsActionLoading(true);
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setToken(null);
      setIsActionLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (payload: UpdateProfilePayload) => {
    const updated = await authService.updateProfile(payload);
    setUser(updated);
  }, []);

  const resetPassword = useCallback(async (payload: ResetPasswordPayload) => {
    return await authService.resetPassword(payload);
  }, []);

  const sendResetOtp = useCallback(async (phoneOrEmail: string) => {
    return await authService.sendResetOtp(phoneOrEmail);
  }, []);

  const role: Role | undefined = user?.role;
  const isOwner = role === "OWNER";
  const isManager = role === "MANAGER";
  const isWorker = role === "WORKER";
  const isAdmin = role === "ADMIN";

  const canViewReports = isOwner || isManager || isAdmin;
  const canEditSettings = isOwner || isAdmin;
  const canManageTeam = isOwner || isManager || isAdmin;
  const canManageHerd = isOwner || isManager || isAdmin;
  const canLogOperations = isOwner || isManager || isWorker || isAdmin;

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user && token),
      isLoading,
      isRestoringSession,
      login,
      sendLoginOtp,
      loginWithOtp,
      signup,
      verifyOtp,
      logout,
      updateProfile,
      resetPassword,
      sendResetOtp,
      isOwner,
      isManager,
      isWorker,
      isAdmin,
      canViewReports,
      canEditSettings,
      canManageTeam,
      canManageHerd,
      canLogOperations,
    }),
    [
      user,
      token,
      isLoading,
      isRestoringSession,
      login,
      sendLoginOtp,
      loginWithOtp,
      signup,
      verifyOtp,
      logout,
      updateProfile,
      resetPassword,
      sendResetOtp,
      isOwner,
      isManager,
      isWorker,
      isAdmin,
      canViewReports,
      canEditSettings,
      canManageTeam,
      canManageHerd,
      canLogOperations,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
