import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Users2,
  Shield,
  Plus,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  Filter,
  MoreVertical,
  UserCheck,
  UserX,
  Send,
  Copy,
  Check,
  Edit2,
  Eye,
  Briefcase,
  MapPin,
  Calendar,
  Sparkles,
  Loader2,
  RefreshCw,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { userService } from "@/services/user-service";
import type {
  TeamMember,
  TeamSummary,
  CreateWorkerPayload,
  CreateManagementPayload,
  UpdateUserPayload,
  UserStatus,
} from "@/types/team";
import { toast } from "sonner";

export function TeamView() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const isOwner = user?.role === "OWNER" || user?.role === "ADMIN";
  const isManager = user?.role === "MANAGER";
  const isWorker = user?.role === "WORKER";
  const canAddWorker = isOwner || isManager;
  const canAddManagement = isOwner;

  // Data State
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [summary, setSummary] = useState<TeamSummary>({
    totalMembers: 0,
    managementCount: 0,
    workerCount: 0,
    activeCount: 0,
    pendingCount: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [deptFilter, setDeptFilter] = useState<string>("ALL");
  const [activeTab, setActiveTab] = useState<"ALL" | "MANAGEMENT" | "WORKERS">("ALL");

  // Modal States
  const [addWorkerOpen, setAddWorkerOpen] = useState<boolean>(false);
  const [addMgmtOpen, setAddMgmtOpen] = useState<boolean>(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState<boolean>(false);
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [inviteModalOpen, setInviteModalOpen] = useState<boolean>(false);
  const [lastGeneratedInvite, setLastGeneratedInvite] = useState<{
    name: string;
    token: string;
    username: string;
    role: string;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Form States
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Worker Form State
  const [workerName, setWorkerName] = useState("");
  const [workerPhoneCode, setWorkerPhoneCode] = useState("+91");
  const [workerPhone, setWorkerPhone] = useState("");
  const [workerEmail, setWorkerEmail] = useState("");
  const [workerDept, setWorkerDept] = useState("Milking");
  const [workerPosition, setWorkerPosition] = useState("Milking Specialist");
  const [workerArea, setWorkerArea] = useState("Milking Parlor");
  const [workerShift, setWorkerShift] = useState("Morning");
  const [workerSendInvite, setWorkerSendInvite] = useState(true);

  // Management Form State
  const [mgmtName, setMgmtName] = useState("");
  const [mgmtEmail, setMgmtEmail] = useState("");
  const [mgmtPhoneCode, setMgmtPhoneCode] = useState("+91");
  const [mgmtPhone, setMgmtPhone] = useState("");
  const [mgmtDept, setMgmtDept] = useState("Farm Operations");
  const [mgmtPosition, setMgmtPosition] = useState("Operations Manager");
  const [mgmtResponsibilities, setMgmtResponsibilities] = useState("");
  const [mgmtSendInvite, setMgmtSendInvite] = useState(true);

  // Edit Form State
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editDept, setEditDept] = useState("");
  const [editPosition, setEditPosition] = useState("");
  const [editArea, setEditArea] = useState("");
  const [editShift, setEditShift] = useState("");
  const [editResponsibilities, setEditResponsibilities] = useState("");

  // Fetch Team and Summary
  const loadTeamData = useCallback(async (isSilent = false) => {
    if (!isAuthenticated || isWorker) {
      setLoading(false);
      return;
    }

    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const [membersData, summaryData] = await Promise.all([
        userService.getFarmUsers(),
        userService.getTeamSummary(),
      ]);
      setMembers(membersData);
      setSummary(summaryData);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load team data";
      toast.error(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated, isWorker]);

  useEffect(() => {
    if (!authLoading && isAuthenticated && !isWorker) {
      void loadTeamData();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [authLoading, isAuthenticated, isWorker, loadTeamData]);

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      // Tab filter
      if (activeTab === "MANAGEMENT" && m.role !== "MANAGER") return false;
      if (activeTab === "WORKERS" && m.role !== "WORKER") return false;

      // Role filter
      if (roleFilter !== "ALL" && m.role !== roleFilter) return false;

      // Status filter
      if (statusFilter !== "ALL") {
        if (statusFilter === "ACTIVE" && m.status !== "ACTIVE") return false;
        if (statusFilter === "PENDING" && m.status !== "PENDING_ACTIVATION" && m.status !== "INVITED") return false;
        if (statusFilter === "INACTIVE" && m.status !== "INACTIVE") return false;
      }

      // Department filter
      if (deptFilter !== "ALL" && m.department !== deptFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = m.fullName.toLowerCase().includes(q);
        const matchUser = m.username.toLowerCase().includes(q);
        const matchPhone = m.mobileNumber.toLowerCase().includes(q);
        const matchEmpId = (m.employeeId || "").toLowerCase().includes(q);
        const matchDept = (m.department || "").toLowerCase().includes(q);
        return matchName || matchUser || matchPhone || matchEmpId || matchDept;
      }

      return true;
    });
  }, [members, activeTab, roleFilter, statusFilter, deptFilter, searchQuery]);

  // Split into Management and Workers
  const managementMembers = useMemo(
    () => filteredMembers.filter((m) => m.role === "MANAGER" || m.role === "OWNER" || m.role === "ADMIN"),
    [filteredMembers]
  );

  const workerMembers = useMemo(
    () => filteredMembers.filter((m) => m.role === "WORKER"),
    [filteredMembers]
  );

  // Departments list for filter
  const departments = useMemo(() => {
    const set = new Set<string>();
    members.forEach((m) => {
      if (m.department) set.add(m.department);
    });
    return Array.from(set);
  }, [members]);

  // Handle Add Worker Submit
  const handleAddWorkerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workerName.trim()) {
      toast.error("Please enter worker's full name");
      return;
    }
    const cleanDigits = workerPhone.replace(/[^0-9]/g, "");
    if (cleanDigits.length < 8) {
      toast.error("Please enter a valid phone number");
      return;
    }

    setIsSubmitting(true);
    try {
      const fullPhone = `${workerPhoneCode} ${cleanDigits}`;
      const payload: CreateWorkerPayload = {
        fullName: workerName.trim(),
        mobileNumber: fullPhone,
        email: workerEmail.trim() || undefined,
        department: workerDept,
        jobPosition: workerPosition,
        assignedArea: workerArea,
        shift: workerShift,
        sendInvitation: workerSendInvite,
      };

      const created = await userService.createWorker(payload);
      toast.success(`Worker ${created.fullName} added successfully!`, {
        description: `Employee ID: ${created.employeeId} · Username: ${created.username}`,
      });

      setAddWorkerOpen(false);
      resetWorkerForm();

      if (created.invitationToken) {
        setLastGeneratedInvite({
          name: created.fullName,
          token: created.invitationToken,
          username: created.username,
          role: "WORKER",
        });
        setInviteModalOpen(true);
      }

      void loadTeamData(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create worker account");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetWorkerForm = () => {
    setWorkerName("");
    setWorkerPhone("");
    setWorkerEmail("");
    setWorkerDept("Milking");
    setWorkerPosition("Milking Specialist");
    setWorkerArea("Milking Parlor");
    setWorkerShift("Morning");
    setWorkerSendInvite(true);
  };

  // Handle Add Management Submit
  const handleAddMgmtSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mgmtName.trim()) {
      toast.error("Please enter full name");
      return;
    }
    if (!mgmtEmail.trim() || !mgmtEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    const cleanDigits = mgmtPhone.replace(/[^0-9]/g, "");
    if (cleanDigits.length < 8) {
      toast.error("Please enter a valid mobile number");
      return;
    }

    setIsSubmitting(true);
    try {
      const fullPhone = `${mgmtPhoneCode} ${cleanDigits}`;
      const payload: CreateManagementPayload = {
        fullName: mgmtName.trim(),
        email: mgmtEmail.trim().toLowerCase(),
        mobileNumber: fullPhone,
        department: mgmtDept,
        jobPosition: mgmtPosition,
        responsibilities: mgmtResponsibilities.trim() || undefined,
        sendInvitation: mgmtSendInvite,
      };

      const created = await userService.createManagement(payload);
      toast.success(`Management member ${created.fullName} added!`, {
        description: `Staff ID: ${created.employeeId} · Username: ${created.username}`,
      });

      setAddMgmtOpen(false);
      resetMgmtForm();

      if (created.invitationToken) {
        setLastGeneratedInvite({
          name: created.fullName,
          token: created.invitationToken,
          username: created.username,
          role: "MANAGEMENT",
        });
        setInviteModalOpen(true);
      }

      void loadTeamData(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create management account");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetMgmtForm = () => {
    setMgmtName("");
    setMgmtEmail("");
    setMgmtPhone("");
    setMgmtDept("Farm Operations");
    setMgmtPosition("Operations Manager");
    setMgmtResponsibilities("");
    setMgmtSendInvite(true);
  };

  // Open Edit Modal
  const openEditModal = (member: TeamMember) => {
    setSelectedMember(member);
    setEditName(member.fullName);
    setEditPhone(member.mobileNumber);
    setEditEmail(member.email || "");
    setEditDept(member.department || "");
    setEditPosition(member.jobPosition || "");
    setEditArea(member.assignedArea || "");
    setEditShift(member.shift || "");
    setEditResponsibilities(member.responsibilities || "");
    setEditModalOpen(true);
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;

    setIsSubmitting(true);
    try {
      const payload: UpdateUserPayload = {
        fullName: editName.trim(),
        mobileNumber: editPhone.trim(),
        email: editEmail.trim() || undefined,
        department: editDept.trim() || undefined,
        jobPosition: editPosition.trim() || undefined,
        assignedArea: editArea.trim() || undefined,
        shift: editShift.trim() || undefined,
        responsibilities: editResponsibilities.trim() || undefined,
      };

      await userService.updateUser(selectedMember.id, payload);
      toast.success(`Updated ${editName}'s profile successfully`);
      setEditModalOpen(false);
      void loadTeamData(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update member profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Toggle Status (Active / Inactive)
  const handleToggleStatus = async (member: TeamMember) => {
    const isCurrentlyActive = member.status === "ACTIVE";
    const newStatus: UserStatus = isCurrentlyActive ? "INACTIVE" : "ACTIVE";

    try {
      await userService.updateStatus(member.id, newStatus);
      toast.success(
        `${member.fullName} is now ${isCurrentlyActive ? "deactivated" : "activated"}`
      );
      void loadTeamData(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update user status");
    }
  };

  // Handle Resend Invitation
  const handleResendInvitation = async (member: TeamMember) => {
    try {
      const res = await userService.resendInvitation(member.id);
      toast.success(`Invitation resent for ${member.fullName}`);
      if (res.invitationToken) {
        setLastGeneratedInvite({
          name: member.fullName,
          token: res.invitationToken,
          username: member.username,
          role: member.role,
        });
        setInviteModalOpen(true);
      }
      void loadTeamData(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to resend invitation");
    }
  };

  // Copy Activation Link
  const copyActivationLink = (token: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const link = `${origin}/activate-account?token=${token}`;
    void navigator.clipboard.writeText(link);
    setCopiedLink(true);
    toast.success("Activation link copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Helper for Status Badge
  const getStatusBadge = (status: UserStatus) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="size-3" /> Active
          </span>
        );
      case "PENDING_ACTIVATION":
      case "INVITED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-800 dark:text-amber-300">
            <Clock className="size-3" /> Pending Activation
          </span>
        );
      case "INACTIVE":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-extrabold text-muted-foreground">
            <UserX className="size-3" /> Inactive
          </span>
        );
      case "SUSPENDED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2.5 py-0.5 text-[10px] font-extrabold text-destructive">
            <AlertCircle className="size-3" /> Suspended
          </span>
        );
      default:
        return null;
    }
  };

  if (isWorker) {
    return (
      <div className="farm-glass-strong rounded-3xl border border-border/80 p-8 text-center max-w-md mx-auto my-12 shadow-xl">
        <div className="mx-auto size-14 rounded-2xl bg-amber-500/15 flex items-center justify-center text-amber-600 mb-4">
          <Shield className="size-8" />
        </div>
        <h2 className="text-xl font-extrabold text-foreground">Operational Access Only</h2>
        <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
          As a Farm Worker, your account is configured for operational tasks including daily milking, feeding, and herd care. Team member and role administration is restricted to Farm Owners and Management staff.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* 1. Header & Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid size-10 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 shadow-sm">
              <Users2 className="size-5" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                Farm Team & Operational Roles
              </h1>
              <p className="text-xs text-muted-foreground">
                Jharanai Farm · Staff management, worker shifts & RBAC permissions
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => void loadTeamData(true)}
            disabled={refreshing}
            className="h-10 rounded-2xl border-border/80 bg-background/60 hover:bg-background text-xs font-bold"
            aria-label="Refresh team data"
          >
            <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          {/* Add Management Button (Owner only) */}
          {canAddManagement && (
            <Button
              onClick={() => setAddMgmtOpen(true)}
              className="h-10 gap-1.5 rounded-2xl border border-emerald-600/30 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-100 text-xs font-extrabold shadow-sm active:scale-95"
            >
              <Shield className="size-3.5" />
              <span>+ Add Management</span>
            </Button>
          )}

          {/* Add Worker Button (Owner & Manager) */}
          {canAddWorker && (
            <Button
              onClick={() => setAddWorkerOpen(true)}
              className="h-10 gap-1.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-md shadow-emerald-600/25 active:scale-95"
            >
              <Plus className="size-4" />
              <span>+ Add Worker</span>
            </Button>
          )}
        </div>
      </div>

      {/* 2. Top Summary KPI Cards (Real DB counts) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {/* Total Members */}
        <div className="farm-glass-strong rounded-2xl border border-border/80 p-3.5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Total Team
          </p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-foreground">{summary.totalMembers}</span>
            <Users2 className="size-4 text-emerald-600 opacity-80" />
          </div>
          <p className="mt-0.5 text-[10px] text-muted-foreground">Across all operations</p>
        </div>

        {/* Management Staff */}
        <div className="farm-glass-strong rounded-2xl border border-border/80 p-3.5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Management
          </p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
              {summary.managementCount}
            </span>
            <Shield className="size-4 text-emerald-600 opacity-80" />
          </div>
          <p className="mt-0.5 text-[10px] text-muted-foreground">Supervisors & Leads</p>
        </div>

        {/* Farm Workers */}
        <div className="farm-glass-strong rounded-2xl border border-border/80 p-3.5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Farm Workers
          </p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-foreground">{summary.workerCount}</span>
            <Briefcase className="size-4 text-sky-600 opacity-80" />
          </div>
          <p className="mt-0.5 text-[10px] text-muted-foreground">Milking & field crew</p>
        </div>

        {/* Active Accounts */}
        <div className="farm-glass-strong rounded-2xl border border-border/80 p-3.5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Active Now
          </p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
              {summary.activeCount}
            </span>
            <UserCheck className="size-4 text-emerald-600 opacity-80" />
          </div>
          <p className="mt-0.5 text-[10px] text-muted-foreground">Verified & active</p>
        </div>

        {/* Pending Activation */}
        <div className="farm-glass-strong col-span-2 sm:col-span-1 rounded-2xl border border-border/80 p-3.5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Pending Invites
          </p>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {summary.pendingCount}
            </span>
            <Clock className="size-4 text-amber-500 opacity-80" />
          </div>
          <p className="mt-0.5 text-[10px] text-muted-foreground">Awaiting password setup</p>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="farm-glass rounded-2xl border border-border/70 p-3 space-y-3">
        {/* Quick Role Tabs */}
        <div className="flex gap-1.5 border-b border-border/50 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab("ALL")}
            className={`rounded-xl px-3 py-1.5 text-xs font-extrabold transition-colors ${
              activeTab === "ALL"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-muted-foreground hover:bg-background/80 hover:text-foreground"
            }`}
          >
            All Members ({filteredMembers.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("MANAGEMENT")}
            className={`rounded-xl px-3 py-1.5 text-xs font-extrabold transition-colors ${
              activeTab === "MANAGEMENT"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-muted-foreground hover:bg-background/80 hover:text-foreground"
            }`}
          >
            Management Team ({managementMembers.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("WORKERS")}
            className={`rounded-xl px-3 py-1.5 text-xs font-extrabold transition-colors ${
              activeTab === "WORKERS"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-muted-foreground hover:bg-background/80 hover:text-foreground"
            }`}
          >
            Farm Workers ({workerMembers.length})
          </button>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
          {/* Search Box */}
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name, ID, phone, department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 rounded-xl bg-background/80 pl-9 text-xs font-semibold"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by Status"
            className="h-10 rounded-xl border border-input bg-background/80 px-3 text-xs font-bold text-foreground focus:border-emerald-600 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="PENDING">Pending Activation</option>
            <option value="INACTIVE">Inactive Only</option>
          </select>

          {/* Department Filter */}
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            aria-label="Filter by Department"
            className="h-10 rounded-xl border border-input bg-background/80 px-3 text-xs font-bold text-foreground focus:border-emerald-600 focus:outline-none"
          >
            <option value="ALL">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4. Loading State */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="size-8 animate-spin text-emerald-600" />
          <p className="mt-3 text-xs font-semibold">Loading Jharanai Farm team data...</p>
        </div>
      ) : filteredMembers.length === 0 ? (
        /* Empty State */
        <div className="farm-glass-strong rounded-3xl border border-dashed border-border/80 p-10 text-center">
          <div className="mx-auto size-12 rounded-2xl bg-muted grid place-items-center text-muted-foreground mb-3">
            <Users2 className="size-6" />
          </div>
          <h3 className="text-base font-extrabold text-foreground">No team members found</h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
            {searchQuery
              ? `No results matching "${searchQuery}". Try adjusting your filters.`
              : "No team members added yet. Start by adding a farm worker or management member."}
          </p>
          {canAddWorker && (
            <div className="mt-4 flex justify-center gap-2">
              <Button
                onClick={() => setAddWorkerOpen(true)}
                className="h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
              >
                <Plus className="size-3.5 mr-1" /> Add Worker
              </Button>
            </div>
          )}
        </div>
      ) : (
        /* 5. Team List Display */
        <div className="space-y-6">
          {/* Section A: Management Team */}
          {(activeTab === "ALL" || activeTab === "MANAGEMENT") && managementMembers.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="size-4 text-emerald-600" />
                  <h2 className="text-sm font-extrabold uppercase tracking-wider text-foreground">
                    Management Team ({managementMembers.length})
                  </h2>
                </div>
                <span className="text-[11px] text-muted-foreground font-medium">
                  Executive & Operational Supervisors
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {managementMembers.map((member) => {
                  const isCurrent = user?.id === member.id;
                  return (
                    <div
                      key={member.id}
                      className={`farm-glass-strong rounded-2xl border p-4 transition-all hover:shadow-md ${
                        isCurrent
                          ? "border-emerald-600 ring-2 ring-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/20"
                          : "border-border/80"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-emerald-600/15 font-black text-emerald-800 dark:text-emerald-300 text-sm shadow-sm">
                            {member.fullName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="truncate text-sm font-black text-foreground">
                                {member.fullName}
                              </p>
                              {isCurrent && (
                                <span className="rounded-full bg-emerald-600 text-white px-2 py-0.2 text-[8px] font-extrabold shrink-0">
                                  You
                                </span>
                              )}
                            </div>
                            <p className="truncate text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                              {member.jobPosition || "Management"}
                            </p>
                          </div>
                        </div>

                        <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[9px] font-extrabold text-secondary-foreground shrink-0">
                          {member.role}
                        </span>
                      </div>

                      {/* Details row */}
                      <div className="mt-3 space-y-1.5 text-xs text-muted-foreground border-t border-border/50 pt-2.5">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[11px] font-bold text-foreground">
                            {member.employeeId || "—"}
                          </span>
                          {getStatusBadge(member.status)}
                        </div>

                        <div className="flex items-center gap-2 truncate">
                          <Phone className="size-3.5 shrink-0 text-muted-foreground" />
                          <span className="truncate">{member.mobileNumber}</span>
                        </div>

                        {member.email && (
                          <div className="flex items-center gap-2 truncate">
                            <Mail className="size-3.5 shrink-0 text-muted-foreground" />
                            <span className="truncate">{member.email}</span>
                          </div>
                        )}

                        {member.department && (
                          <div className="flex items-center gap-2 text-[11px]">
                            <Briefcase className="size-3.5 shrink-0 text-muted-foreground" />
                            <span className="truncate">Dept: {member.department}</span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-3 flex items-center justify-between gap-1.5 border-t border-border/50 pt-2.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedMember(member);
                            setViewModalOpen(true);
                          }}
                          className="h-8 rounded-xl px-2.5 text-xs font-bold hover:bg-background/80"
                        >
                          <Eye className="size-3.5 mr-1" /> View
                        </Button>

                        <div className="flex items-center gap-1">
                          {isOwner && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditModal(member)}
                              className="h-8 rounded-xl px-2 text-xs font-bold hover:bg-background/80"
                              aria-label={`Edit ${member.fullName}`}
                            >
                              <Edit2 className="size-3.5" />
                            </Button>
                          )}

                          {member.invitationPending && isOwner && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => void handleResendInvitation(member)}
                              className="h-8 rounded-xl px-2 text-xs font-bold text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/10"
                              title="Resend Activation Invite"
                            >
                              <Send className="size-3.5 mr-1" /> Invite
                            </Button>
                          )}

                          {isOwner && member.role !== "OWNER" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => void handleToggleStatus(member)}
                              className={`h-8 rounded-xl px-2 text-xs font-bold ${
                                member.status === "ACTIVE"
                                  ? "text-destructive hover:bg-destructive/10"
                                  : "text-emerald-600 hover:bg-emerald-500/10"
                              }`}
                              title={member.status === "ACTIVE" ? "Deactivate" : "Activate"}
                            >
                              {member.status === "ACTIVE" ? (
                                <UserX className="size-3.5" />
                              ) : (
                                <UserCheck className="size-3.5" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section B: Farm Workers */}
          {(activeTab === "ALL" || activeTab === "WORKERS") && workerMembers.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Briefcase className="size-4 text-emerald-600" />
                  <h2 className="text-sm font-extrabold uppercase tracking-wider text-foreground">
                    Farm Workers ({workerMembers.length})
                  </h2>
                </div>
                <span className="text-[11px] text-muted-foreground font-medium">
                  Milking, Cattle Care & Field Crew
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {workerMembers.map((member) => {
                  const isCurrent = user?.id === member.id;
                  return (
                    <div
                      key={member.id}
                      className={`farm-glass-strong rounded-2xl border p-4 transition-all hover:shadow-md ${
                        isCurrent
                          ? "border-emerald-600 ring-2 ring-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/20"
                          : "border-border/80"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-sky-500/15 font-black text-sky-800 dark:text-sky-300 text-sm shadow-sm">
                            {member.fullName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="truncate text-sm font-black text-foreground">
                                {member.fullName}
                              </p>
                              {isCurrent && (
                                <span className="rounded-full bg-emerald-600 text-white px-2 py-0.2 text-[8px] font-extrabold shrink-0">
                                  You
                                </span>
                              )}
                            </div>
                            <p className="truncate text-xs font-semibold text-muted-foreground">
                              {member.jobPosition || "Farm Worker"}
                            </p>
                          </div>
                        </div>

                        <span className="rounded-full bg-sky-500/10 text-sky-800 dark:text-sky-300 px-2 py-0.5 text-[9px] font-extrabold shrink-0">
                          WORKER
                        </span>
                      </div>

                      {/* Operational Tags */}
                      <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[10px]">
                        {member.shift && (
                          <span className="rounded-md bg-secondary/80 px-2 py-0.5 font-bold text-secondary-foreground">
                            Shift: {member.shift}
                          </span>
                        )}
                        {member.assignedArea && (
                          <span className="rounded-md bg-secondary/80 px-2 py-0.5 font-bold text-secondary-foreground">
                            Area: {member.assignedArea}
                          </span>
                        )}
                      </div>

                      {/* Details row */}
                      <div className="mt-3 space-y-1 text-xs text-muted-foreground border-t border-border/50 pt-2.5">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[11px] font-bold text-foreground">
                            {member.employeeId || "—"}
                          </span>
                          {getStatusBadge(member.status)}
                        </div>

                        <div className="flex items-center gap-2 truncate">
                          <Phone className="size-3.5 shrink-0 text-muted-foreground" />
                          <span className="truncate">{member.mobileNumber}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-3 flex items-center justify-between gap-1.5 border-t border-border/50 pt-2.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedMember(member);
                            setViewModalOpen(true);
                          }}
                          className="h-8 rounded-xl px-2.5 text-xs font-bold hover:bg-background/80"
                        >
                          <Eye className="size-3.5 mr-1" /> View
                        </Button>

                        <div className="flex items-center gap-1">
                          {canAddWorker && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditModal(member)}
                              className="h-8 rounded-xl px-2 text-xs font-bold hover:bg-background/80"
                              aria-label={`Edit ${member.fullName}`}
                            >
                              <Edit2 className="size-3.5" />
                            </Button>
                          )}

                          {member.invitationPending && canAddWorker && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => void handleResendInvitation(member)}
                              className="h-8 rounded-xl px-2 text-xs font-bold text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/10"
                              title="Resend Activation Invite"
                            >
                              <Send className="size-3.5 mr-1" /> Invite
                            </Button>
                          )}

                          {canAddWorker && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => void handleToggleStatus(member)}
                              className={`h-8 rounded-xl px-2 text-xs font-bold ${
                                member.status === "ACTIVE"
                                  ? "text-destructive hover:bg-destructive/10"
                                  : "text-emerald-600 hover:bg-emerald-500/10"
                              }`}
                              title={member.status === "ACTIVE" ? "Deactivate" : "Activate"}
                            >
                              {member.status === "ACTIVE" ? (
                                <UserX className="size-3.5" />
                              ) : (
                                <UserCheck className="size-3.5" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ADD WORKER */}
      {/* ========================================================================= */}
      <Dialog open={addWorkerOpen} onOpenChange={setAddWorkerOpen}>
        <DialogContent className="max-w-md sm:max-w-lg rounded-3xl p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-xl bg-emerald-500/15 text-emerald-800 dark:text-emerald-300">
                <Briefcase className="size-4.5" />
              </span>
              <div>
                <DialogTitle className="text-lg font-extrabold text-foreground">
                  Add Farm Worker
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Create a worker account for daily milking, feeding & cattle operations
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Auto ID Notice */}
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50/50 p-3 text-xs dark:bg-emerald-950/30">
            <p className="font-extrabold text-emerald-800 dark:text-emerald-300">
              Automatic Provisioning
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Unique Worker ID (e.g. <span className="font-mono font-bold text-foreground">JHF-WRK-xxx</span>) and username (<span className="font-mono font-bold text-foreground">jharanai.wrk.xxx</span>) will be generated by Jharanai Farm.
            </p>
          </div>

          <form onSubmit={handleAddWorkerSubmit} className="space-y-3.5 mt-2">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">
                Full Name <span className="text-destructive">*</span>
              </label>
              <Input
                type="text"
                placeholder="e.g. Ramesh Patel"
                value={workerName}
                onChange={(e) => setWorkerName(e.target.value)}
                required
                className="h-11 rounded-xl text-xs font-semibold"
              />
            </div>

            {/* Mobile Phone */}
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">
                Phone Number <span className="text-destructive">*</span>
              </label>
              <div className="flex gap-2">
                <select
                  value={workerPhoneCode}
                  onChange={(e) => setWorkerPhoneCode(e.target.value)}
                  className="h-11 rounded-xl border border-input bg-background px-2.5 text-xs font-bold"
                >
                  <option value="+91">🇮🇳 +91</option>
                  <option value="+1">🇺🇸 +1</option>
                  <option value="+44">🇬🇧 +44</option>
                  <option value="+971">🇦🇪 +971</option>
                </select>
                <Input
                  type="tel"
                  placeholder="98765 43210"
                  value={workerPhone}
                  onChange={(e) => setWorkerPhone(e.target.value)}
                  required
                  className="h-11 rounded-xl flex-1 text-xs font-semibold"
                />
              </div>
            </div>

            {/* Email (Optional) */}
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">
                Email Address <span className="text-[10px] text-muted-foreground font-normal">(Optional)</span>
              </label>
              <Input
                type="email"
                placeholder="worker@example.com"
                value={workerEmail}
                onChange={(e) => setWorkerEmail(e.target.value)}
                className="h-11 rounded-xl text-xs font-semibold"
              />
            </div>

            {/* Department & Position */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Department</label>
                <select
                  value={workerDept}
                  onChange={(e) => setWorkerDept(e.target.value)}
                  className="h-11 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold"
                >
                  <option value="Milking">Milking</option>
                  <option value="Feeding & Nutrition">Feeding & Nutrition</option>
                  <option value="Health & Veterinary">Health & Veterinary</option>
                  <option value="General Operations">General Operations</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Job Position</label>
                <Input
                  type="text"
                  placeholder="e.g. Milking Specialist"
                  value={workerPosition}
                  onChange={(e) => setWorkerPosition(e.target.value)}
                  className="h-11 rounded-xl text-xs font-semibold"
                />
              </div>
            </div>

            {/* Area & Shift */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Assigned Area</label>
                <Input
                  type="text"
                  placeholder="e.g. Milking Parlor / Barn A"
                  value={workerArea}
                  onChange={(e) => setWorkerArea(e.target.value)}
                  className="h-11 rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Shift</label>
                <select
                  value={workerShift}
                  onChange={(e) => setWorkerShift(e.target.value)}
                  className="h-11 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold"
                >
                  <option value="Morning">Morning (5:00 AM - 1:00 PM)</option>
                  <option value="Evening">Evening (1:00 PM - 9:00 PM)</option>
                  <option value="Night">Night (9:00 PM - 5:00 AM)</option>
                  <option value="Rotational">Rotational</option>
                </select>
              </div>
            </div>

            {/* Activation Option */}
            <div className="rounded-2xl border border-border/80 bg-background/50 p-3">
              <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={workerSendInvite}
                  onChange={(e) => setWorkerSendInvite(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Generate secure activation link</span>
              </label>
              <p className="mt-1 text-[10px] text-muted-foreground pl-5">
                Worker can open the secure link to set their own password during first login.
              </p>
            </div>

            <DialogFooter className="mt-4 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddWorkerOpen(false)}
                className="h-11 rounded-xl text-xs font-bold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                    Adding Worker...
                  </>
                ) : (
                  "+ Create Worker Profile"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 2: ADD MANAGEMENT (Farm Owner Only) */}
      {/* ========================================================================= */}
      <Dialog open={addMgmtOpen} onOpenChange={setAddMgmtOpen}>
        <DialogContent className="max-w-md sm:max-w-lg rounded-3xl p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-xl bg-emerald-500/15 text-emerald-800 dark:text-emerald-300">
                <Shield className="size-4.5" />
              </span>
              <div>
                <DialogTitle className="text-lg font-extrabold text-foreground">
                  Add Management Member
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Grant operational supervisor privileges for Jharanai Farm
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Auto ID Notice */}
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50/50 p-3 text-xs dark:bg-emerald-950/30">
            <p className="font-extrabold text-emerald-800 dark:text-emerald-300">
              Owner-Controlled Role Provisioning
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Account role is locked to <span className="font-bold text-foreground">MANAGEMENT</span>. ID (<span className="font-mono font-bold text-foreground">JHF-MGT-xxx</span>) and username (<span className="font-mono font-bold text-foreground">jharanai.mgmt.xxx</span>) are assigned automatically.
            </p>
          </div>

          <form onSubmit={handleAddMgmtSubmit} className="space-y-3.5 mt-2">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">
                Full Legal Name <span className="text-destructive">*</span>
              </label>
              <Input
                type="text"
                placeholder="e.g. Rajesh Kumar"
                value={mgmtName}
                onChange={(e) => setMgmtName(e.target.value)}
                required
                className="h-11 rounded-xl text-xs font-semibold"
              />
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">
                Official Email Address <span className="text-destructive">*</span>
              </label>
              <Input
                type="email"
                placeholder="manager@jharanai.com"
                value={mgmtEmail}
                onChange={(e) => setMgmtEmail(e.target.value)}
                required
                className="h-11 rounded-xl text-xs font-semibold"
              />
            </div>

            {/* Mobile Phone */}
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">
                Mobile Phone <span className="text-destructive">*</span>
              </label>
              <div className="flex gap-2">
                <select
                  value={mgmtPhoneCode}
                  onChange={(e) => setMgmtPhoneCode(e.target.value)}
                  className="h-11 rounded-xl border border-input bg-background px-2.5 text-xs font-bold"
                >
                  <option value="+91">🇮🇳 +91</option>
                  <option value="+1">🇺🇸 +1</option>
                  <option value="+44">🇬🇧 +44</option>
                </select>
                <Input
                  type="tel"
                  placeholder="98765 12345"
                  value={mgmtPhone}
                  onChange={(e) => setMgmtPhone(e.target.value)}
                  required
                  className="h-11 rounded-xl flex-1 text-xs font-semibold"
                />
              </div>
            </div>

            {/* Department & Position */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Department</label>
                <select
                  value={mgmtDept}
                  onChange={(e) => setMgmtDept(e.target.value)}
                  className="h-11 w-full rounded-xl border border-input bg-background px-3 text-xs font-bold"
                >
                  <option value="Farm Operations">Farm Operations</option>
                  <option value="Herd Supervision">Herd Supervision</option>
                  <option value="Milk Production">Milk Production</option>
                  <option value="Supply & Inventory">Supply & Inventory</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Position / Title</label>
                <Input
                  type="text"
                  placeholder="e.g. Operations Manager"
                  value={mgmtPosition}
                  onChange={(e) => setMgmtPosition(e.target.value)}
                  className="h-11 rounded-xl text-xs font-semibold"
                />
              </div>
            </div>

            {/* Responsibilities */}
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Responsibilities</label>
              <Input
                type="text"
                placeholder="e.g. Daily milking schedule, feed distribution, worker shifts"
                value={mgmtResponsibilities}
                onChange={(e) => setMgmtResponsibilities(e.target.value)}
                className="h-11 rounded-xl text-xs font-semibold"
              />
            </div>

            <DialogFooter className="mt-4 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddMgmtOpen(false)}
                className="h-11 rounded-xl text-xs font-bold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                    Adding Staff...
                  </>
                ) : (
                  "+ Add Management Member"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 3: INVITATION LINK READY (Share / Copy) */}
      {/* ========================================================================= */}
      <Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6 text-center">
          <div className="mx-auto size-14 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-600 mb-3">
            <Sparkles className="size-7" />
          </div>
          <DialogTitle className="text-xl font-extrabold text-foreground">
            Activation Link Generated!
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            An invitation token has been created for <span className="font-bold text-foreground">{lastGeneratedInvite?.name}</span>. Share the link so they can set their password.
          </DialogDescription>

          {lastGeneratedInvite && (
            <div className="mt-4 rounded-2xl border border-border/80 bg-background/60 p-3.5 text-left text-xs space-y-2">
              <div className="flex justify-between items-center text-[11px] text-muted-foreground">
                <span>Assigned Username:</span>
                <span className="font-mono font-bold text-foreground">
                  {lastGeneratedInvite.username}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px] text-muted-foreground">
                <span>Role:</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400">
                  {lastGeneratedInvite.role}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px] text-muted-foreground">
                <span>Expires In:</span>
                <span className="font-bold text-foreground">72 Hours</span>
              </div>
            </div>
          )}

          <div className="mt-4 space-y-2">
            <Button
              onClick={() => {
                if (lastGeneratedInvite?.token) {
                  copyActivationLink(lastGeneratedInvite.token);
                }
              }}
              className="w-full h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs gap-2"
            >
              {copiedLink ? <Check className="size-4" /> : <Copy className="size-4" />}
              <span>{copiedLink ? "Link Copied!" : "Copy Secure Activation Link"}</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => setInviteModalOpen(false)}
              className="w-full h-10 rounded-2xl text-xs font-bold"
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 4: VIEW MEMBER PROFILE */}
      {/* ========================================================================= */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          {selectedMember && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="grid size-12 place-items-center rounded-2xl bg-emerald-600/15 font-black text-emerald-800 dark:text-emerald-300 text-base shadow-sm">
                    {selectedMember.fullName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  <div>
                    <DialogTitle className="text-lg font-extrabold text-foreground">
                      {selectedMember.fullName}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                      {selectedMember.role} · {selectedMember.jobPosition || "Farm Staff"}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="mt-4 space-y-3 text-xs">
                <div className="rounded-2xl border border-border/80 bg-background/60 p-3.5 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Employee ID:</span>
                    <span className="font-mono font-bold text-foreground">
                      {selectedMember.employeeId || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Username:</span>
                    <span className="font-mono font-bold text-foreground">
                      {selectedMember.username}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Account Status:</span>
                    {getStatusBadge(selectedMember.status)}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Farm:</span>
                    <span className="font-bold text-foreground">{selectedMember.farmName}</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-border/80 bg-background/60 p-3.5 space-y-2">
                  <div className="flex items-center gap-2">
                    <Phone className="size-3.5 text-muted-foreground" />
                    <span className="font-semibold text-foreground">{selectedMember.mobileNumber}</span>
                  </div>
                  {selectedMember.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="size-3.5 text-muted-foreground" />
                      <span className="font-semibold text-foreground">{selectedMember.email}</span>
                    </div>
                  )}
                  {selectedMember.department && (
                    <div className="flex items-center gap-2">
                      <Briefcase className="size-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Dept: <span className="font-semibold text-foreground">{selectedMember.department}</span>
                      </span>
                    </div>
                  )}
                  {selectedMember.assignedArea && (
                    <div className="flex items-center gap-2">
                      <MapPin className="size-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Area: <span className="font-semibold text-foreground">{selectedMember.assignedArea}</span>
                      </span>
                    </div>
                  )}
                  {selectedMember.shift && (
                    <div className="flex items-center gap-2">
                      <Clock className="size-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Shift: <span className="font-semibold text-foreground">{selectedMember.shift}</span>
                      </span>
                    </div>
                  )}
                  {selectedMember.joiningDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="size-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Joined: <span className="font-semibold text-foreground">{selectedMember.joiningDate}</span>
                      </span>
                    </div>
                  )}
                </div>

                {selectedMember.responsibilities && (
                  <div className="rounded-2xl border border-border/80 bg-background/60 p-3.5">
                    <p className="font-bold text-foreground text-xs mb-1">Responsibilities</p>
                    <p className="text-[11px] text-muted-foreground">{selectedMember.responsibilities}</p>
                  </div>
                )}
              </div>

              <DialogFooter className="mt-4 gap-2">
                {canAddWorker && (
                  <Button
                    onClick={() => {
                      setViewModalOpen(false);
                      openEditModal(selectedMember);
                    }}
                    className="h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                  >
                    <Edit2 className="size-3.5 mr-1" /> Edit Profile
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setViewModalOpen(false)}
                  className="h-10 rounded-xl text-xs font-bold"
                >
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 5: EDIT MEMBER PROFILE */}
      {/* ========================================================================= */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold text-foreground">
              Edit Team Member
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Update employment details for {selectedMember?.fullName}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-3 mt-2">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Full Name</label>
              <Input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                className="h-11 rounded-xl text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Phone Number</label>
              <Input
                type="tel"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                required
                className="h-11 rounded-xl text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Email Address</label>
              <Input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="h-11 rounded-xl text-xs font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Department</label>
                <Input
                  type="text"
                  value={editDept}
                  onChange={(e) => setEditDept(e.target.value)}
                  className="h-11 rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Position</label>
                <Input
                  type="text"
                  value={editPosition}
                  onChange={(e) => setEditPosition(e.target.value)}
                  className="h-11 rounded-xl text-xs font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Assigned Area</label>
                <Input
                  type="text"
                  value={editArea}
                  onChange={(e) => setEditArea(e.target.value)}
                  className="h-11 rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Shift</label>
                <Input
                  type="text"
                  value={editShift}
                  onChange={(e) => setEditShift(e.target.value)}
                  className="h-11 rounded-xl text-xs font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Responsibilities</label>
              <Input
                type="text"
                value={editResponsibilities}
                onChange={(e) => setEditResponsibilities(e.target.value)}
                className="h-11 rounded-xl text-xs font-semibold"
              />
            </div>

            <DialogFooter className="mt-4 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditModalOpen(false)}
                className="h-11 rounded-xl text-xs font-bold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
