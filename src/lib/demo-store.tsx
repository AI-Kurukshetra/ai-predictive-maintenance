"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  alertsSeed,
  documents,
  equipment,
  facilities,
  inventorySeed,
  sensorConfigurations,
  telemetry,
  users,
  workOrdersSeed,
} from "@/lib/seed-data";
import { hasPermission, rolePermissions } from "@/lib/auth/permissions";
import { demoStorageKey } from "@/lib/config";
import { buildPredictionSnapshot, getAllPredictionSnapshots } from "@/lib/prediction";
import type {
  Alert,
  BootstrapPayload,
  Facility,
  InventoryItem,
  SensorConfiguration,
  TelemetryIngestPayload,
  TelemetryIngestResult,
  UserProfile,
  WorkOrder,
  WorkOrderStatus,
} from "@/lib/types";

type PersistedOverlay = {
  activeFacilityId: string;
  facilities: Facility[];
  alerts: Alert[];
  workOrders: WorkOrder[];
  inventory: InventoryItem[];
  currentUser: DemoStoreState["currentUser"];
  users: DemoStoreState["users"];
  telemetry: DemoStoreState["telemetry"];
  sensorConfigurations: SensorConfiguration[];
};

type DemoStoreState = BootstrapPayload & {
  activeFacilityId: string;
};

type DemoStoreValue = DemoStoreState & {
  loading: boolean;
  error: string | null;
  setActiveFacilityId: (facilityId: string) => void;
  acknowledgeAlert: (alertId: string) => Promise<void>;
  escalateAlert: (alertId: string) => Promise<void>;
  createWorkOrderFromAlert: (alertId: string) => Promise<void>;
  createWorkOrder: (payload: {
    equipmentId: string;
    title: string;
    assignee?: string;
    dueDate: string;
    priority: WorkOrder["priority"];
    status?: WorkOrderStatus;
    notes?: string;
    partsRequired?: string[];
  }) => Promise<void>;
  editWorkOrder: (workOrderId: string, payload: {
    status?: WorkOrderStatus;
    assignee?: string;
    dueDate?: string;
    priority?: WorkOrder["priority"];
    notes?: string;
    partsRequired?: string[];
  }) => Promise<void>;
  updateWorkOrderStatus: (workOrderId: string, status: WorkOrderStatus) => Promise<void>;
  updateProfile: (payload: { name?: string; facilityId?: string; role?: "Maintenance Manager" | "Reliability Engineer" | "Plant Director" | "Technician" }) => Promise<void>;
  updateManagedUser: (userId: string, payload: { name?: string; facilityId?: string; role?: UserProfile["role"] }) => Promise<void>;
  updateFacility: (facilityId: string, payload: { name?: string; region?: string; timezone?: string; lines?: number; uptimeTarget?: number; siteLead?: string }) => Promise<void>;
  updateSensorConfiguration: (configId: string, payload: { coverage?: number; lastCalibratedAt?: string; gatewayStatus?: SensorConfiguration["gatewayStatus"] }) => Promise<void>;
  ingestTelemetry: (payload: TelemetryIngestPayload) => Promise<TelemetryIngestResult>;
  resetDemo: () => void;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
  can: (permission: string) => boolean;
  getWorkOrderByAlertId: (alertId: string) => WorkOrder | undefined;
  getPredictionByEquipmentId: (equipmentId: string) => ReturnType<typeof buildPredictionSnapshot>;
  filteredEquipment: DemoStoreState["equipment"];
  filteredAlerts: Alert[];
  filteredWorkOrders: WorkOrder[];
  filteredInventory: InventoryItem[];
  predictions: ReturnType<typeof getAllPredictionSnapshots>;
};

const defaultState: DemoStoreState = {
  mode: "demo",
  currentUser: null,
  activeFacilityId: "all",
  facilities,
  equipment,
  telemetry,
  alerts: alertsSeed,
  workOrders: workOrdersSeed,
  inventory: inventorySeed,
  documents,
  users,
  sensorConfigurations,
};

const DemoStoreContext = createContext<DemoStoreValue | null>(null);

function loadPersistedOverlay() {
  if (typeof window === "undefined") {
    return null;
  }

  const rawValue = window.localStorage.getItem(demoStorageKey);
  if (!rawValue) return null;

  try {
    return JSON.parse(rawValue) as PersistedOverlay;
  } catch {
    return null;
  }
}

function buildStateFromBootstrap(payload: BootstrapPayload): DemoStoreState {
  const persisted = payload.mode === "demo" ? loadPersistedOverlay() : null;
  return {
    ...payload,
    activeFacilityId: persisted?.activeFacilityId ?? "all",
    facilities: persisted?.facilities ?? payload.facilities,
    currentUser: persisted?.currentUser ?? payload.currentUser,
    alerts: persisted?.alerts ?? payload.alerts,
    workOrders: persisted?.workOrders ?? payload.workOrders,
    inventory: persisted?.inventory ?? payload.inventory,
    users: persisted?.users ?? payload.users,
    telemetry: persisted?.telemetry ?? payload.telemetry,
    sensorConfigurations: persisted?.sensorConfigurations ?? payload.sensorConfigurations,
  };
}

async function getBootstrap() {
  const response = await fetch("/api/bootstrap", {
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load platform bootstrap data.");
  }

  return (await response.json()) as BootstrapPayload;
}

export function DemoStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoStoreState>(defaultState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const payload = await getBootstrap();
      setState(buildStateFromBootstrap(payload));
      setError(null);
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : "Unexpected bootstrap error.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || state.mode !== "demo") return;
    const overlay: PersistedOverlay = {
      activeFacilityId: state.activeFacilityId,
      facilities: state.facilities,
      currentUser: state.currentUser,
      alerts: state.alerts,
      workOrders: state.workOrders,
      inventory: state.inventory,
      users: state.users,
      telemetry: state.telemetry,
      sensorConfigurations: state.sensorConfigurations,
    };
    window.localStorage.setItem(demoStorageKey, JSON.stringify(overlay));
  }, [state.activeFacilityId, state.alerts, state.currentUser, state.facilities, state.inventory, state.mode, state.sensorConfigurations, state.telemetry, state.users, state.workOrders]);

  const predictions = useMemo(
    () => getAllPredictionSnapshots(state.equipment, state.telemetry),
    [state.equipment, state.telemetry],
  );

  const filteredEquipment = state.equipment.filter(
    (item) => state.activeFacilityId === "all" || item.facilityId === state.activeFacilityId,
  );
  const filteredAlerts = state.alerts.filter(
    (item) => state.activeFacilityId === "all" || item.facilityId === state.activeFacilityId,
  );
  const filteredWorkOrders = state.workOrders.filter(
    (item) => state.activeFacilityId === "all" || item.facilityId === state.activeFacilityId,
  );
  const filteredInventory = state.inventory.filter(
    (item) => state.activeFacilityId === "all" || item.facilityId === state.activeFacilityId,
  );

  const value: DemoStoreValue = {
    ...state,
    loading,
    error,
    setActiveFacilityId: (facilityId) => {
      setState((current) => ({ ...current, activeFacilityId: facilityId }));
    },
    acknowledgeAlert: async (alertId) => {
      if (state.mode === "demo") {
        setState((current) => ({
          ...current,
          alerts: current.alerts.map((item) => (item.id === alertId ? { ...item, status: "Acknowledged" } : item)),
        }));
        return;
      }

      const response = await fetch(`/api/alerts/${alertId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "Acknowledged" }),
      });
      const payload = (await response.json()) as { alert: Alert };
      setState((current) => ({
        ...current,
        alerts: current.alerts.map((item) => (item.id === alertId ? payload.alert : item)),
      }));
    },
    escalateAlert: async (alertId) => {
      if (state.mode === "demo") {
        setState((current) => ({
          ...current,
          alerts: current.alerts.map((item) => (item.id === alertId ? { ...item, status: "Escalated" } : item)),
        }));
        return;
      }

      const response = await fetch(`/api/alerts/${alertId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "Escalated" }),
      });
      const payload = (await response.json()) as { alert: Alert };
      setState((current) => ({
        ...current,
        alerts: current.alerts.map((item) => (item.id === alertId ? payload.alert : item)),
      }));
    },
    createWorkOrderFromAlert: async (alertId) => {
      if (state.mode === "demo") {
        const baseAlert = state.alerts.find((item) => item.id === alertId);
        if (!baseAlert) {
          return;
        }

        const workOrder: WorkOrder = {
          id: `wo-local-${Date.now()}`,
          equipmentId: baseAlert.equipmentId,
          facilityId: baseAlert.facilityId,
          sourceAlertId: baseAlert.id,
          title: baseAlert.title,
          assignee: state.currentUser?.name ?? "Assign technician",
          dueDate: baseAlert.severity === "Critical" ? "2026-03-14" : "2026-03-16",
          priority: baseAlert.severity,
          status: "Open",
          notes: baseAlert.recommendedAction,
          partsRequired: baseAlert.severity === "Critical" ? ["Bearing kit BK-42"] : ["Inspection kit"],
        };

        setState((current) => ({
          ...current,
          alerts: current.alerts.map((item) =>
            item.id === alertId ? { ...item, status: "Acknowledged" } : item,
          ),
          workOrders: current.workOrders.some((item) => item.sourceAlertId === alertId)
            ? current.workOrders
            : [workOrder, ...current.workOrders],
        }));
        return;
      }

      const response = await fetch("/api/work-orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ alertId }),
      });
      const payload = (await response.json()) as { workOrder: WorkOrder };
      setState((current) => ({
        ...current,
        alerts: current.alerts.map((item) =>
          item.id === alertId ? { ...item, status: "Acknowledged" } : item,
        ),
        workOrders: current.workOrders.some((item) => item.sourceAlertId === alertId)
          ? current.workOrders
          : [payload.workOrder, ...current.workOrders],
      }));
    },
    createWorkOrder: async (workOrderPayload) => {
      if (state.mode === "demo") {
        const selectedEquipment = state.equipment.find((item) => item.id === workOrderPayload.equipmentId);
        if (!selectedEquipment) {
          return;
        }

        const workOrder: WorkOrder = {
          id: `wo-local-${Date.now()}`,
          equipmentId: selectedEquipment.id,
          facilityId: selectedEquipment.facilityId,
          title: workOrderPayload.title,
          assignee: workOrderPayload.assignee?.trim() || state.currentUser?.name || "Assign technician",
          dueDate: workOrderPayload.dueDate,
          priority: workOrderPayload.priority,
          status: workOrderPayload.status ?? "Open",
          notes: workOrderPayload.notes?.trim() || "Manual work order created from the control room console.",
          partsRequired: workOrderPayload.partsRequired?.filter(Boolean) ?? [],
        };

        setState((current) => ({
          ...current,
          workOrders: [workOrder, ...current.workOrders],
        }));
        return;
      }

      const response = await fetch("/api/work-orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(workOrderPayload),
      });
      const payload = (await response.json()) as { workOrder: WorkOrder };
      setState((current) => ({
        ...current,
        workOrders: [payload.workOrder, ...current.workOrders],
      }));
    },
    editWorkOrder: async (workOrderId, workOrderPayload) => {
      if (state.mode === "demo") {
        setState((current) => ({
          ...current,
          workOrders: current.workOrders.map((item) =>
            item.id === workOrderId
              ? {
                  ...item,
                  status: workOrderPayload.status ?? item.status,
                  assignee: workOrderPayload.assignee?.trim() || item.assignee,
                  dueDate: workOrderPayload.dueDate || item.dueDate,
                  priority: workOrderPayload.priority ?? item.priority,
                  notes: workOrderPayload.notes?.trim() || item.notes,
                  partsRequired: workOrderPayload.partsRequired ?? item.partsRequired,
                }
              : item,
          ),
        }));
        return;
      }

      const response = await fetch(`/api/work-orders/${workOrderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(workOrderPayload),
      });
      const payload = (await response.json()) as { workOrder: WorkOrder };
      setState((current) => ({
        ...current,
        workOrders: current.workOrders.map((item) => (item.id === workOrderId ? payload.workOrder : item)),
      }));
    },
    updateWorkOrderStatus: async (workOrderId, status) => {
      if (state.mode === "demo") {
        setState((current) => ({
          ...current,
          workOrders: current.workOrders.map((item) =>
            item.id === workOrderId ? { ...item, status } : item,
          ),
        }));
        return;
      }

      const response = await fetch(`/api/work-orders/${workOrderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      const payload = (await response.json()) as { workOrder: WorkOrder };
      setState((current) => ({
        ...current,
        workOrders: current.workOrders.map((item) => (item.id === workOrderId ? payload.workOrder : item)),
      }));
    },
    updateProfile: async (profilePayload) => {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profilePayload),
      });
      const payload = (await response.json()) as { user: NonNullable<DemoStoreState["currentUser"]> };
      setState((current) => ({
        ...current,
        currentUser: payload.user,
        users: current.users.map((user) =>
          user.id === payload.user.id
            ? {
                ...user,
                name: payload.user.name,
                email: payload.user.email,
                role: payload.user.role,
                facilityId: payload.user.facilityId,
                permissions: payload.user.permissions,
              }
            : user,
        ),
      }));
    },
    updateManagedUser: async (userId, userPayload) => {
      if (state.mode === "demo") {
        setState((current) => ({
          ...current,
          users: current.users.map((user) =>
            user.id === userId
              ? {
                  ...user,
                  name: userPayload.name?.trim() || user.name,
                  facilityId: userPayload.facilityId || user.facilityId,
                  role: userPayload.role ?? user.role,
                  permissions: userPayload.role ? rolePermissions[userPayload.role] : user.permissions,
                }
              : user,
          ),
          currentUser: current.currentUser?.id === userId
            ? {
                ...current.currentUser,
                name: userPayload.name?.trim() || current.currentUser.name,
                facilityId: userPayload.facilityId || current.currentUser.facilityId,
                role: userPayload.role ?? current.currentUser.role,
                permissions: userPayload.role ? rolePermissions[userPayload.role] : current.currentUser.permissions,
              }
            : current.currentUser,
        }));
        return;
      }

      const response = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userPayload),
      });
      const payload = (await response.json()) as { user: UserProfile };
      setState((current) => ({
        ...current,
        users: current.users.map((user) => (user.id === userId ? payload.user : user)),
        currentUser: current.currentUser?.id === userId
          ? {
              ...current.currentUser,
              name: payload.user.name,
              email: payload.user.email,
              role: payload.user.role,
              facilityId: payload.user.facilityId,
              permissions: payload.user.permissions,
            }
          : current.currentUser,
      }));
    },
    updateFacility: async (facilityId, facilityPayload) => {
      if (state.mode === "demo") {
        setState((current) => ({
          ...current,
          facilities: current.facilities.map((facility) =>
            facility.id === facilityId
              ? {
                  ...facility,
                  name: facilityPayload.name?.trim() || facility.name,
                  region: facilityPayload.region?.trim() || facility.region,
                  timezone: facilityPayload.timezone?.trim() || facility.timezone,
                  lines: facilityPayload.lines ?? facility.lines,
                  uptimeTarget: facilityPayload.uptimeTarget ?? facility.uptimeTarget,
                  siteLead: facilityPayload.siteLead?.trim() || facility.siteLead,
                }
              : facility,
          ),
        }));
        return;
      }

      const response = await fetch(`/api/facilities/${facilityId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(facilityPayload),
      });
      const payload = (await response.json()) as { facility: Facility };
      setState((current) => ({
        ...current,
        facilities: current.facilities.map((facility) => (facility.id === facilityId ? payload.facility : facility)),
      }));
    },
    updateSensorConfiguration: async (configId, configPayload) => {
      if (state.mode === "demo") {
        setState((current) => ({
          ...current,
          sensorConfigurations: current.sensorConfigurations.map((config) =>
            config.id === configId
              ? {
                  ...config,
                  coverage: configPayload.coverage ?? config.coverage,
                  lastCalibratedAt: configPayload.lastCalibratedAt || config.lastCalibratedAt,
                  gatewayStatus: configPayload.gatewayStatus ?? config.gatewayStatus,
                }
              : config,
          ),
        }));
        return;
      }

      const response = await fetch(`/api/sensor-configurations/${configId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(configPayload),
      });
      const payload = (await response.json()) as { sensorConfiguration: SensorConfiguration };
      setState((current) => ({
        ...current,
        sensorConfigurations: current.sensorConfigurations.map((config) =>
          config.id === configId ? payload.sensorConfiguration : config,
        ),
      }));
    },
    ingestTelemetry: async (telemetryPayload) => {
      if (state.mode === "demo") {
        const selectedEquipment = state.equipment.find((item) => item.id === telemetryPayload.equipmentId);
        if (!selectedEquipment) {
          throw new Error("Equipment not found");
        }

        const point = {
          timestamp: telemetryPayload.timestamp,
          vibration: telemetryPayload.vibration,
          temperature: telemetryPayload.temperature,
          acoustic: telemetryPayload.acoustic,
          pressure: telemetryPayload.pressure,
          runtimeHours: telemetryPayload.runtimeHours,
        };

        const currentTelemetry = state.telemetry.find((item) => item.equipmentId === telemetryPayload.equipmentId);
        if (!currentTelemetry) {
          throw new Error("Telemetry source not found");
        }

        const points = [...currentTelemetry.points, point].sort((left, right) => left.timestamp.localeCompare(right.timestamp));
        const prediction = buildPredictionSnapshot(selectedEquipment, [{ equipmentId: selectedEquipment.id, points }]);
        const alert: Alert | undefined = (prediction.riskLevel === "High" || prediction.riskLevel === "Critical")
          && !state.alerts.some((item) => item.equipmentId === selectedEquipment.id && item.status !== "Resolved")
          ? {
              id: `alt-local-${Date.now()}`,
              equipmentId: selectedEquipment.id,
              facilityId: selectedEquipment.facilityId,
              severity: prediction.riskLevel === "Critical" ? "Critical" : "High",
              title: `${selectedEquipment.name} live telemetry anomaly`,
              summary: `Fresh telemetry moved ${selectedEquipment.name} to ${prediction.riskLevel.toLowerCase()} risk with ${prediction.anomalyCount} active anomaly signals.`,
              status: "Open" as const,
              recommendedAction: prediction.recommendedAction,
              createdAt: point.timestamp,
            }
          : undefined;

        setState((current) => ({
          ...current,
          telemetry: current.telemetry.map((item) =>
            item.equipmentId === telemetryPayload.equipmentId ? { ...item, points } : item,
          ),
          alerts: alert ? [alert, ...current.alerts] : current.alerts,
        }));

        return { point, prediction, alert };
      }

      const response = await fetch("/api/telemetry/ingest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(telemetryPayload),
      });
      const payload = (await response.json()) as TelemetryIngestResult;
      setState((current) => ({
        ...current,
        telemetry: current.telemetry.map((item) =>
          item.equipmentId === telemetryPayload.equipmentId
            ? {
                ...item,
                points: [...item.points, payload.point].sort((left, right) => left.timestamp.localeCompare(right.timestamp)),
              }
            : item,
        ),
        alerts: payload.alert ? [payload.alert, ...current.alerts] : current.alerts,
      }));
      return payload;
    },
    resetDemo: () => {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(demoStorageKey);
      }
      setState((current) => ({
        ...current,
        activeFacilityId: "all",
        facilities,
        alerts: alertsSeed,
        workOrders: workOrdersSeed,
        inventory: inventorySeed,
        telemetry,
        users,
        sensorConfigurations,
      }));
    },
    refresh,
    logout: async () => {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(demoStorageKey);
      }
      setState((current) => ({
        ...current,
        currentUser: null,
      }));
    },
    can: (permission) => hasPermission(state.currentUser, permission),
    getWorkOrderByAlertId: (alertId) => state.workOrders.find((item) => item.sourceAlertId === alertId),
    getPredictionByEquipmentId: (equipmentId) => {
      const selectedEquipment = state.equipment.find((item) => item.id === equipmentId);
      if (!selectedEquipment) {
        throw new Error(`Equipment ${equipmentId} not found`);
      }
      return buildPredictionSnapshot(selectedEquipment, state.telemetry);
    },
    filteredEquipment,
    filteredAlerts,
    filteredWorkOrders,
    filteredInventory,
    predictions,
  };

  return <DemoStoreContext.Provider value={value}>{children}</DemoStoreContext.Provider>;
}

export function useDemoStore() {
  const context = useContext(DemoStoreContext);
  if (!context) {
    throw new Error("useDemoStore must be used within DemoStoreProvider");
  }
  return context;
}
