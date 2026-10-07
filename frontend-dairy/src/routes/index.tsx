import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { Toaster, toast } from "sonner";
import { Loader2, ShieldAlert } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { ModulesDrawer } from "@/components/layout/ModulesDrawer";
import { QuickAddModal } from "@/components/quick-add/QuickAddModal";
import { AnimalProfileModal } from "@/components/animals/AnimalProfileModal";
import { EditAnimalModal } from "@/components/animals/EditAnimalModal";
import { LifecycleModal } from "@/components/animals/LifecycleModal";
import { AnimalListView } from "@/components/animals/AnimalListView";
import { CowPerformanceGroupsView } from "@/components/animals/CowPerformanceGroupsView";
import { FarmDashboard } from "@/components/dashboard/FarmDashboard";
import { AnalyticsDashboardView } from "@/components/dashboard/AnalyticsDashboardView";
import { MilkingModuleView } from "@/components/modules/MilkingModuleView";
import { EquipmentModuleView } from "@/components/modules/EquipmentModuleView";
import { MoreModulesView } from "@/components/modules/MoreModulesView";
import { HealthModuleView } from "@/components/modules/HealthModuleView";
import { FeedingModuleView } from "@/components/modules/FeedingModuleView";
import { StockModuleView } from "@/components/modules/StockModuleView";
import { FodderModuleView } from "@/components/modules/FodderModuleView";
import { ProductionModuleView } from "@/components/modules/ProductionModuleView";
import { SupplyModuleView } from "@/components/modules/SupplyModuleView";
import { AlertsView } from "@/components/alerts/AlertsView";
import { ReportsView } from "@/components/modules/ReportsView";
import { TeamView } from "@/components/modules/TeamView";
import { ProfileSettingsView } from "@/components/profile/ProfileSettingsView";
import { ProfileModal } from "@/components/auth/ProfileModal";
import { ExportModal } from "@/components/common/ExportModal";
import { CowBrandLogo } from "@/components/common/CowBrandLogo";
import { farmService, INITIAL_FIELDS } from "@/services/farm-service";
import { useAuth } from "@/context/AuthContext";
import type { Animal, FarmAlert, MilkRecord, StockItem } from "@/types/farm";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Jharanai Farm | Dairy Farm Management" },
      {
        name: "description",
        content:
          "Mobile-first, practical daily farm management for dairy cows, milking, health, rations, and stock.",
      },
      { property: "og:title", content: "Jharanai Farm | Dairy Farm Management" },
      {
        property: "og:description",
        content:
          "Mobile-first, practical daily farm management for dairy cows, milking, health, rations, and stock.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FarmApp,
});

export function FarmApp() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, isRestoringSession, isWorker, isManager, isOwner } = useAuth();

  // Navigation & Page State
  const [currentPage, setCurrentPage] = useState<string>("home");

  // Modals
  const [quickAddOpen, setQuickAddOpen] = useState<boolean>(false);
  const [quickAddInitialAction, setQuickAddInitialAction] = useState<string>("menu");
  const [modulesDrawerOpen, setModulesDrawerOpen] = useState<boolean>(false);
  const [profileModalOpen, setProfileModalOpen] = useState<boolean>(false);
  const [exportModalOpen, setExportModalOpen] = useState<boolean>(false);
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
  const [editAnimalOpen, setEditAnimalOpen] = useState<boolean>(false);
  const [animalToEdit, setAnimalToEdit] = useState<Animal | null>(null);
  const [lifecycleModalOpen, setLifecycleModalOpen] = useState<boolean>(false);
  const [animalForLifecycle, setAnimalForLifecycle] = useState<Animal | null>(null);

  // Domain Data State & Background Fetch State
  const [isDataLoading, setIsDataLoading] = useState<boolean>(true);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [alerts, setAlerts] = useState<FarmAlert[]>([]);
  const [recentMilk, setRecentMilk] = useState<MilkRecord[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);

  // Frontend Route Protection Guard: wait until session check completes before redirecting
  useEffect(() => {
    if (!isRestoringSession && !isAuthenticated) {
      navigate({ to: "/login" });
    }
  }, [isRestoringSession, isAuthenticated, navigate]);

  // Load latest data from reactive farm service
  const loadData = useCallback(async () => {
    setIsDataLoading(true);
    try {
      const [animalList, alertList, milkList, stockList] = await Promise.all([
        farmService.listAnimals(),
        farmService.getAlerts(),
        farmService.getMilkRecords(),
        farmService.getStock(),
      ]);
      setAnimals(animalList);
      setAlerts(alertList);
      setRecentMilk(milkList);
      setStockItems(stockList);
    } catch (err) {
      console.error("Failed to load farm domain data:", err);
    } finally {
      setIsDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      void loadData();
    }
  }, [isAuthenticated, loadData]);

  // RBAC Navigation Guard
  const handleNavigate = (page: string) => {
    if (isWorker && page === "users") {
      toast.error("Access Restricted", {
        description: "Team & Role management requires Farm Manager or Owner access.",
      });
      return;
    }
    setCurrentPage(page);
  };

  // Open Quick Add with specific preselected action
  const handleOpenQuickAdd = (actionKey?: string) => {
    setQuickAddInitialAction(actionKey || "menu");
    setQuickAddOpen(true);
  };

  // Urgent alerts count for header and bottom nav badges
  const urgentAlertCount = alerts.filter((a) => a.level === "Urgent").length;

  // Session verification loading screen (only on initial session restoration)
  if (isRestoringSession) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
        <CowBrandLogo size="lg" />
        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground font-semibold">
          <Loader2 className="size-4 animate-spin text-emerald-600" />
          <span>Verifying farm session...</span>
        </div>
      </div>
    );
  }

  // If not authenticated, return null while redirecting
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-emerald-500/20">
      <Toaster position="top-right" richColors />

      {/* Atmospheric Soft Gradient Backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl dark:bg-emerald-500/5" />
        <div className="absolute -right-24 top-20 h-80 w-80 rounded-full bg-sky-500/10 blur-3xl dark:bg-sky-500/5" />
        <div className="absolute -bottom-24 left-1/3 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl dark:bg-amber-500/5" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-[1600px] gap-4 p-2 sm:gap-5 sm:p-4 lg:p-5">
        {/* Desktop Sidebar */}
        <Sidebar
          currentPage={currentPage}
          onNavigate={handleNavigate}
          onOpenProfile={() => setProfileModalOpen(true)}
          alertCount={urgentAlertCount}
        />

        {/* Main Application Area */}
        <div className="min-w-0 flex-1 pb-24 lg:pb-6">
          {/* Mobile Top Header (hidden on desktop, and hidden on home/analytics where the gradient app bar is built-in) */}
          {currentPage !== "home" && currentPage !== "analytics" && (
            <MobileHeader
              onOpenModules={() => setModulesDrawerOpen(true)}
              onOpenAlerts={() => handleNavigate("alerts")}
              onOpenProfile={() => setProfileModalOpen(true)}
              alertCount={urgentAlertCount}
            />
          )}

          {/* Module Views */}
          <main className="animate-fade-in space-y-4">
            {currentPage === "home" && (
              <FarmDashboard
                animals={animals}
                alerts={alerts}
                recentMilk={recentMilk}
                stockItems={stockItems}
                isLoading={isDataLoading}
                onNavigateModule={handleNavigate}
                onOpenQuickAdd={handleOpenQuickAdd}
                onSelectAnimal={setSelectedAnimal}
                onOpenModulesDrawer={() => setModulesDrawerOpen(true)}
              />
            )}

            {currentPage === "analytics" && (
              <AnalyticsDashboardView
                animals={animals}
                alerts={alerts}
                recentMilk={recentMilk}
                stockItems={stockItems}
                onOpenModulesDrawer={() => setModulesDrawerOpen(true)}
                onOpenQuickRecord={() => handleOpenQuickAdd("record-milk")}
                onSelectAnimal={setSelectedAnimal}
                onOpenExport={() => setExportModalOpen(true)}
              />
            )}

            {currentPage === "animals" && (
              <AnimalListView
                animals={animals}
                recentMilk={recentMilk}
                onSelectAnimal={setSelectedAnimal}
                onAddNew={() => handleOpenQuickAdd("add-animal")}
                onRecordMilk={() => handleOpenQuickAdd("record-milk")}
                onEditAnimal={(a) => {
                  setAnimalToEdit(a);
                  setEditAnimalOpen(true);
                }}
                onChangeStatus={(a) => {
                  setAnimalForLifecycle(a);
                  setLifecycleModalOpen(true);
                }}
              />
            )}

            {currentPage === "performance" && (
              <CowPerformanceGroupsView
                animals={animals}
                recentMilk={recentMilk}
                onSelectAnimal={setSelectedAnimal}
                onRecordMilk={() => handleOpenQuickAdd("record-milk")}
              />
            )}

            {currentPage === "milking" && (
              <MilkingModuleView
                records={recentMilk}
                animals={animals}
                onRefresh={loadData}
                onOpenQuickRecord={() => handleOpenQuickAdd("record-milk")}
                onRecordForAnimal={() => handleOpenQuickAdd("record-milk")}
              />
            )}

            {currentPage === "production" && (
              <ProductionModuleView
                animals={animals}
                records={recentMilk}
                onSelectAnimal={setSelectedAnimal}
              />
            )}

            {currentPage === "health" && (
              <HealthModuleView
                animals={animals}
                onOpenQuickHealth={() => handleOpenQuickAdd("health")}
                onSelectAnimal={setSelectedAnimal}
              />
            )}

            {currentPage === "equipment" && <EquipmentModuleView />}
            
            {currentPage === "more" && (
              <MoreModulesView
                onNavigate={handleNavigate}
                urgentAlertCount={urgentAlertCount}
              />
            )}

            {currentPage === "feeding" && (
              <FeedingModuleView
                onOpenQuickFeeding={() => handleOpenQuickAdd("feeding")}
              />
            )}

            {currentPage === "stock" && (
              <StockModuleView
                stockItems={stockItems}
                animals={animals}
                onOpenQuickStock={() => handleOpenQuickAdd("stock")}
              />
            )}

            {currentPage === "fodder" && (
              <FodderModuleView
                fields={INITIAL_FIELDS}
                onOpenQuickFodder={() => handleOpenQuickAdd("fodder")}
              />
            )}

            {currentPage === "supply" && (
              <SupplyModuleView
                onOpenQuickSupply={() => handleOpenQuickAdd("supply")}
              />
            )}

            {currentPage === "alerts" && (
              <AlertsView
                alerts={alerts}
                onNavigateModule={handleNavigate}
              />
            )}

            {currentPage === "reports" && <ReportsView />}

            {currentPage === "users" && <TeamView />}

            {currentPage === "settings" && <ProfileSettingsView />}
          </main>
        </div>
      </div>

      {/* Mobile Fixed Bottom Navigation (hidden on desktop) */}
      <MobileBottomNav
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onOpenQuickAdd={() => handleOpenQuickAdd("record-milk")}
        onOpenModules={() => setModulesDrawerOpen(true)}
        onOpenProfile={() => setProfileModalOpen(true)}
        alertCount={urgentAlertCount}
      />

      {/* Global Modals & Drawers */}
      <QuickAddModal
        open={quickAddOpen}
        onOpenChange={setQuickAddOpen}
        animals={animals}
        initialAction={quickAddInitialAction}
        onDataUpdated={loadData}
      />

      <AnimalProfileModal
        animal={selectedAnimal}
        onOpenChange={(open) => !open && setSelectedAnimal(null)}
        onRecordMilk={() => handleOpenQuickAdd("record-milk")}
        onEditAnimal={(a) => {
          setSelectedAnimal(null);
          setAnimalToEdit(a);
          setEditAnimalOpen(true);
        }}
        onLifecycleChange={(a) => {
          setSelectedAnimal(null);
          setAnimalForLifecycle(a);
          setLifecycleModalOpen(true);
        }}
      />

      <EditAnimalModal
        animal={animalToEdit}
        open={editAnimalOpen}
        onOpenChange={setEditAnimalOpen}
        availableAnimals={animals}
        onAnimalUpdated={(updated) => {
          loadData();
          if (selectedAnimal?.id === updated.id) {
            setSelectedAnimal(updated);
          }
        }}
      />

      <LifecycleModal
        animal={animalForLifecycle}
        open={lifecycleModalOpen}
        onOpenChange={setLifecycleModalOpen}
        onStatusChanged={(updated) => {
          loadData();
          if (selectedAnimal?.id === updated.id) {
            setSelectedAnimal(updated);
          }
        }}
      />

      <ModulesDrawer
        open={modulesDrawerOpen}
        onOpenChange={setModulesDrawerOpen}
        onSelectModule={handleNavigate}
        currentModule={currentPage}
      />

      <ProfileModal
        open={profileModalOpen}
        onOpenChange={setProfileModalOpen}
      />

      <ExportModal
        open={exportModalOpen}
        onOpenChange={setExportModalOpen}
        defaultModule="milk"
        title="Export Farm Analytics & Certified Records"
      />
    </div>
  );
}