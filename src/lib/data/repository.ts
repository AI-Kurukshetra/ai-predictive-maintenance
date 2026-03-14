import { randomUUID } from "node:crypto";

import { alertsSeed, documents, equipment, facilities, inventorySeed, sensorConfigurations, telemetry, users, workOrdersSeed } from "@/lib/seed-data";
import { hasPermission } from "@/lib/auth/permissions";
import { hasSupabaseEnv } from "@/lib/config";
import { rolePermissions } from "@/lib/auth/permissions";
import { buildSessionUser } from "@/lib/auth/session";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { buildPredictionSnapshot } from "@/lib/prediction";
import type {
  Alert,
  AlertStatus,
  BootstrapPayload,
  Equipment,
  EquipmentDocument,
  EquipmentTelemetry,
  Facility,
  InventoryItem,
  PredictionSnapshot,
  SensorConfiguration,
  SessionUser,
  TelemetryIngestPayload,
  TelemetryIngestResult,
  UserProfile,
  WorkOrder,
  WorkOrderStatus,
} from "@/lib/types";

function mapProfile(record: {
  id: string;
  email: string;
  name: string;
  role: UserProfile["role"];
  facility_id: string;
  permissions: string[];
}): UserProfile {
  const permissions = Array.from(new Set([...rolePermissions[record.role], ...record.permissions]));
  return {
    id: record.id,
    email: record.email,
    name: record.name,
    role: record.role,
    facilityId: record.facility_id,
    permissions,
  };
}

function mapAlert(record: {
  id: string;
  equipment_id: string;
  facility_id: string;
  severity: Alert["severity"];
  title: string;
  summary: string;
  status: AlertStatus;
  recommended_action: string;
  created_at: string;
}): Alert {
  return {
    id: record.id,
    equipmentId: record.equipment_id,
    facilityId: record.facility_id,
    severity: record.severity,
    title: record.title,
    summary: record.summary,
    status: record.status,
    recommendedAction: record.recommended_action,
    createdAt: record.created_at,
  };
}

function mapWorkOrder(record: {
  id: string;
  equipment_id: string;
  facility_id: string;
  source_alert_id: string | null;
  title: string;
  assignee: string;
  due_date: string;
  priority: WorkOrder["priority"];
  status: WorkOrderStatus;
  notes: string;
  parts_required: string[];
}): WorkOrder {
  return {
    id: record.id,
    equipmentId: record.equipment_id,
    facilityId: record.facility_id,
    sourceAlertId: record.source_alert_id ?? undefined,
    title: record.title,
    assignee: record.assignee,
    dueDate: record.due_date,
    priority: record.priority,
    status: record.status,
    notes: record.notes,
    partsRequired: record.parts_required ?? [],
  };
}

function mapFacility(record: {
  id: string;
  name: string;
  region: string;
  timezone: string;
  lines: number;
  uptime_target: number;
  site_lead: string;
}): Facility {
  return {
    id: record.id,
    name: record.name,
    region: record.region,
    timezone: record.timezone,
    lines: record.lines,
    uptimeTarget: record.uptime_target,
    siteLead: record.site_lead,
  };
}

function mapEquipment(record: {
  id: string;
  name: string;
  facility_id: string;
  type: string;
  model: string;
  line: string;
  criticality: Equipment["criticality"];
  install_date: string;
  last_maintenance_at: string;
  baseline_oee: number;
  baseline_power_kw: number;
  sensors: string[];
}): Equipment {
  return {
    id: record.id,
    name: record.name,
    facilityId: record.facility_id,
    type: record.type,
    model: record.model,
    line: record.line,
    criticality: record.criticality,
    installDate: record.install_date,
    lastMaintenanceAt: record.last_maintenance_at,
    baselineOee: record.baseline_oee,
    baselinePowerKw: record.baseline_power_kw,
    sensors: record.sensors ?? [],
  };
}

function mapInventory(record: {
  id: string;
  facility_id: string;
  part_name: string;
  sku: string;
  on_hand: number;
  reorder_point: number;
  linked_equipment_ids: string[];
  lead_time_days: number;
}): InventoryItem {
  return {
    id: record.id,
    facilityId: record.facility_id,
    partName: record.part_name,
    sku: record.sku,
    onHand: record.on_hand,
    reorderPoint: record.reorder_point,
    linkedEquipmentIds: record.linked_equipment_ids ?? [],
    leadTimeDays: record.lead_time_days,
  };
}

function mapDocument(record: {
  id: string;
  equipment_id: string;
  title: string;
  category: EquipmentDocument["category"];
  updated_at: string;
}): EquipmentDocument {
  return {
    id: record.id,
    equipmentId: record.equipment_id,
    title: record.title,
    category: record.category,
    updatedAt: record.updated_at,
  };
}

function mapSensorConfiguration(record: {
  id: string;
  facility_id: string;
  sensor_type: string;
  coverage: number;
  last_calibrated_at: string;
  gateway_status: "Healthy" | "Needs Attention";
}): SensorConfiguration {
  return {
    id: record.id,
    facilityId: record.facility_id,
    sensorType: record.sensor_type,
    coverage: record.coverage,
    lastCalibratedAt: record.last_calibrated_at,
    gatewayStatus: record.gateway_status,
  };
}

function mapTelemetry(records: Array<{
  equipment_id: string;
  timestamp: string;
  vibration: number;
  temperature: number;
  acoustic: number;
  pressure: number;
  runtime_hours: number;
}>): EquipmentTelemetry[] {
  const grouped = new Map<string, EquipmentTelemetry["points"]>();
  records.forEach((record) => {
    const points = grouped.get(record.equipment_id) ?? [];
    points.push({
      timestamp: record.timestamp,
      vibration: record.vibration,
      temperature: record.temperature,
      acoustic: record.acoustic,
      pressure: record.pressure,
      runtimeHours: record.runtime_hours,
    });
    grouped.set(record.equipment_id, points);
  });

  return Array.from(grouped.entries()).map(([equipmentId, points]) => ({
    equipmentId,
    points: points.sort((left, right) => left.timestamp.localeCompare(right.timestamp)),
  }));
}

function severityFromRisk(riskLevel: PredictionSnapshot["riskLevel"]): Alert["severity"] {
  switch (riskLevel) {
    case "Critical":
      return "Critical";
    case "High":
      return "High";
    case "Elevated":
      return "Medium";
    default:
      return "Low";
  }
}

function buildTelemetryAlert(asset: Equipment, prediction: PredictionSnapshot): Alert {
  return {
    id: `alt-${randomUUID().slice(0, 8)}`,
    equipmentId: asset.id,
    facilityId: asset.facilityId,
    severity: severityFromRisk(prediction.riskLevel),
    title: `${asset.name} live telemetry anomaly`,
    summary: `Fresh telemetry moved ${asset.name} to ${prediction.riskLevel.toLowerCase()} risk with ${prediction.anomalyCount} active anomaly signals.`,
    status: "Open",
    recommendedAction: prediction.recommendedAction,
    createdAt: prediction.latest.timestamp,
  };
}

export async function getCurrentSessionUser(): Promise<SessionUser | null> {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return null;
  }

  const admin = createSupabaseAdminClient();
  const profileResponse = await admin
    .from("profiles")
    .select("id, email, name, role, facility_id, permissions")
    .eq("id", data.user.id)
    .single();

  if (profileResponse.error || !profileResponse.data) {
    return null;
  }

  return buildSessionUser(mapProfile(profileResponse.data));
}

export async function getBootstrapPayload(currentUser: SessionUser | null): Promise<BootstrapPayload> {
  if (!hasSupabaseEnv()) {
    return {
      mode: "demo",
      currentUser,
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
  }

  const admin = createSupabaseAdminClient();
  const [facilitiesResponse, equipmentResponse, telemetryResponse, alertsResponse, workOrdersResponse, inventoryResponse, documentsResponse, profilesResponse, sensorConfigResponse] =
    await Promise.all([
      admin.from("facilities").select("id, name, region, timezone, lines, uptime_target, site_lead"),
      admin.from("equipment").select("id, name, facility_id, type, model, line, criticality, install_date, last_maintenance_at, baseline_oee, baseline_power_kw, sensors"),
      admin.from("telemetry_points").select("equipment_id, timestamp, vibration, temperature, acoustic, pressure, runtime_hours"),
      admin.from("alerts").select("id, equipment_id, facility_id, severity, title, summary, status, recommended_action, created_at"),
      admin.from("work_orders").select("id, equipment_id, facility_id, source_alert_id, title, assignee, due_date, priority, status, notes, parts_required"),
      admin.from("inventory_items").select("id, facility_id, part_name, sku, on_hand, reorder_point, linked_equipment_ids, lead_time_days"),
      admin.from("equipment_documents").select("id, equipment_id, title, category, updated_at"),
      admin.from("profiles").select("id, email, name, role, facility_id, permissions"),
      admin.from("sensor_configurations").select("id, facility_id, sensor_type, coverage, last_calibrated_at, gateway_status"),
    ]);

  return {
    mode: "supabase",
    currentUser,
    facilities: (facilitiesResponse.data ?? []).map(mapFacility),
    equipment: (equipmentResponse.data ?? []).map(mapEquipment),
    telemetry: mapTelemetry(telemetryResponse.data ?? []),
    alerts: (alertsResponse.data ?? []).map(mapAlert),
    workOrders: (workOrdersResponse.data ?? []).map(mapWorkOrder),
    inventory: (inventoryResponse.data ?? []).map(mapInventory),
    documents: (documentsResponse.data ?? []).map(mapDocument),
    users: (profilesResponse.data ?? []).map(mapProfile),
    sensorConfigurations: (sensorConfigResponse.data ?? []).map(mapSensorConfiguration),
  };
}

export async function updateAlertStatus(alertId: string, status: AlertStatus) {
  if (!hasSupabaseEnv()) {
    const alert = alertsSeed.find((item) => item.id === alertId);
    if (!alert) {
      throw new Error("Alert not found");
    }
    return {
      ...alert,
      status,
    } satisfies Alert;
  }

  const admin = createSupabaseAdminClient();
  const response = await admin
    .from("alerts")
    .update({ status })
    .eq("id", alertId)
    .select("id, equipment_id, facility_id, severity, title, summary, status, recommended_action, created_at")
    .single();

  if (response.error || !response.data) {
    throw new Error(response.error?.message ?? "Failed to update alert");
  }

  return mapAlert(response.data);
}

export async function createWorkOrderFromAlert(alertId: string, currentUser: SessionUser | null) {
  const baseAlert = hasSupabaseEnv()
    ? await (async () => {
        const admin = createSupabaseAdminClient();
        const response = await admin
          .from("alerts")
          .select("id, equipment_id, facility_id, severity, title, summary, status, recommended_action, created_at")
          .eq("id", alertId)
          .single();
        if (response.error || !response.data) {
          throw new Error(response.error?.message ?? "Alert not found");
        }
        return mapAlert(response.data);
      })()
    : alertsSeed.find((item) => item.id === alertId);

  if (!baseAlert) {
    throw new Error("Alert not found");
  }

  const createdOrder: WorkOrder = {
    id: `wo-${randomUUID().slice(0, 8)}`,
    equipmentId: baseAlert.equipmentId,
    facilityId: baseAlert.facilityId,
    sourceAlertId: baseAlert.id,
    title: baseAlert.title,
    assignee: currentUser?.name ?? "Assign technician",
    dueDate: baseAlert.severity === "Critical" ? "2026-03-14" : "2026-03-16",
    priority: baseAlert.severity,
    status: "Open",
    notes: baseAlert.recommendedAction,
    partsRequired: baseAlert.severity === "Critical" ? ["Bearing kit BK-42"] : ["Inspection kit"],
  };

  if (!hasSupabaseEnv()) {
    return createdOrder;
  }

  const admin = createSupabaseAdminClient();
  const response = await admin
    .from("work_orders")
    .insert({
      id: createdOrder.id,
      equipment_id: createdOrder.equipmentId,
      facility_id: createdOrder.facilityId,
      source_alert_id: createdOrder.sourceAlertId,
      title: createdOrder.title,
      assignee: createdOrder.assignee,
      due_date: createdOrder.dueDate,
      priority: createdOrder.priority,
      status: createdOrder.status,
      notes: createdOrder.notes,
      parts_required: createdOrder.partsRequired,
    })
    .select("id, equipment_id, facility_id, source_alert_id, title, assignee, due_date, priority, status, notes, parts_required")
    .single();

  if (response.error || !response.data) {
    throw new Error(response.error?.message ?? "Failed to create work order");
  }

  await updateAlertStatus(alertId, "Acknowledged");
  return mapWorkOrder(response.data);
}

export async function createWorkOrder(
  currentUser: SessionUser | null,
  payload: {
    equipmentId: string;
    title: string;
    assignee?: string;
    dueDate: string;
    priority: WorkOrder["priority"];
    status?: WorkOrderStatus;
    notes?: string;
    partsRequired?: string[];
    sourceAlertId?: string;
  },
) {
  const baseEquipment = hasSupabaseEnv()
    ? await (async () => {
        const admin = createSupabaseAdminClient();
        const response = await admin
          .from("equipment")
          .select("id, name, facility_id, type, model, line, criticality, install_date, last_maintenance_at, baseline_oee, baseline_power_kw, sensors")
          .eq("id", payload.equipmentId)
          .single();
        if (response.error || !response.data) {
          throw new Error(response.error?.message ?? "Equipment not found");
        }
        return mapEquipment(response.data);
      })()
    : equipment.find((item) => item.id === payload.equipmentId);

  if (!baseEquipment) {
    throw new Error("Equipment not found");
  }

  const workOrder: WorkOrder = {
    id: `wo-${randomUUID().slice(0, 8)}`,
    equipmentId: baseEquipment.id,
    facilityId: baseEquipment.facilityId,
    sourceAlertId: payload.sourceAlertId,
    title: payload.title.trim(),
    assignee: payload.assignee?.trim() || currentUser?.name || "Assign technician",
    dueDate: payload.dueDate,
    priority: payload.priority,
    status: payload.status ?? "Open",
    notes: payload.notes?.trim() || "Manual work order created from operations console.",
    partsRequired: payload.partsRequired?.filter(Boolean) ?? [],
  };

  if (!hasSupabaseEnv()) {
    return workOrder;
  }

  const admin = createSupabaseAdminClient();
  const response = await admin
    .from("work_orders")
    .insert({
      id: workOrder.id,
      equipment_id: workOrder.equipmentId,
      facility_id: workOrder.facilityId,
      source_alert_id: workOrder.sourceAlertId,
      title: workOrder.title,
      assignee: workOrder.assignee,
      due_date: workOrder.dueDate,
      priority: workOrder.priority,
      status: workOrder.status,
      notes: workOrder.notes,
      parts_required: workOrder.partsRequired,
    })
    .select("id, equipment_id, facility_id, source_alert_id, title, assignee, due_date, priority, status, notes, parts_required")
    .single();

  if (response.error || !response.data) {
    throw new Error(response.error?.message ?? "Failed to create work order");
  }

  if (payload.sourceAlertId) {
    await updateAlertStatus(payload.sourceAlertId, "Acknowledged");
  }

  return mapWorkOrder(response.data);
}

export async function updateWorkOrder(
  workOrderId: string,
  payload: {
    status?: WorkOrderStatus;
    assignee?: string;
    dueDate?: string;
    priority?: WorkOrder["priority"];
    notes?: string;
    partsRequired?: string[];
  },
) {
  if (!hasSupabaseEnv()) {
    const order = workOrdersSeed.find((item) => item.id === workOrderId);
    if (!order) {
      throw new Error("Work order not found");
    }
    return {
      ...order,
      status: payload.status ?? order.status,
      assignee: payload.assignee?.trim() || order.assignee,
      dueDate: payload.dueDate || order.dueDate,
      priority: payload.priority ?? order.priority,
      notes: payload.notes?.trim() || order.notes,
      partsRequired: payload.partsRequired ?? order.partsRequired,
    } satisfies WorkOrder;
  }

  const admin = createSupabaseAdminClient();
  const response = await admin
    .from("work_orders")
    .update({
      status: payload.status,
      assignee: payload.assignee?.trim(),
      due_date: payload.dueDate,
      priority: payload.priority,
      notes: payload.notes?.trim(),
      parts_required: payload.partsRequired,
    })
    .eq("id", workOrderId)
    .select("id, equipment_id, facility_id, source_alert_id, title, assignee, due_date, priority, status, notes, parts_required")
    .single();

  if (response.error || !response.data) {
    throw new Error(response.error?.message ?? "Failed to update work order");
  }

  return mapWorkOrder(response.data);
}

export async function updateWorkOrderStatus(workOrderId: string, status: WorkOrderStatus) {
  return updateWorkOrder(workOrderId, { status });
}

export async function createAuthProfile(payload: {
  id: string;
  email: string;
  name: string;
  role: UserProfile["role"];
  facilityId: string;
}) {
  const admin = createSupabaseAdminClient();
  const permissions = rolePermissions[payload.role];
  const response = await admin
    .from("profiles")
    .insert({
      id: payload.id,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      facility_id: payload.facilityId,
      permissions,
    })
    .select("id, email, name, role, facility_id, permissions")
    .single();

  if (response.error || !response.data) {
    throw new Error(response.error?.message ?? "Failed to create profile");
  }

  return buildSessionUser(mapProfile(response.data));
}

export async function updateCurrentProfile(
  currentUser: SessionUser,
  payload: {
    name?: string;
    facilityId?: string;
    role?: UserProfile["role"];
  },
) {
  const nextRole =
    payload.role && hasPermission(currentUser, "settings:manage") ? payload.role : currentUser.role;

  const nextProfile = {
    name: payload.name?.trim() || currentUser.name,
    facilityId: payload.facilityId || currentUser.facilityId,
    role: nextRole,
    permissions: rolePermissions[nextRole],
  };

  if (!hasSupabaseEnv()) {
    return {
      ...currentUser,
      ...nextProfile,
    } satisfies SessionUser;
  }

  const admin = createSupabaseAdminClient();
  const response = await admin
    .from("profiles")
    .update({
      name: nextProfile.name,
      facility_id: nextProfile.facilityId,
      role: nextProfile.role,
      permissions: nextProfile.permissions,
    })
    .eq("id", currentUser.id)
    .select("id, email, name, role, facility_id, permissions")
    .single();

  if (response.error || !response.data) {
    throw new Error(response.error?.message ?? "Failed to update profile");
  }

  return buildSessionUser(mapProfile(response.data));
}

export async function updateManagedProfile(
  userId: string,
  payload: {
    name?: string;
    facilityId?: string;
    role?: UserProfile["role"];
  },
) {
  if (!hasSupabaseEnv()) {
    const profile = users.find((item) => item.id === userId);
    if (!profile) {
      throw new Error("User not found");
    }

    const role = payload.role ?? profile.role;
    return {
      ...profile,
      name: payload.name?.trim() || profile.name,
      facilityId: payload.facilityId || profile.facilityId,
      role,
      permissions: rolePermissions[role],
    } satisfies UserProfile;
  }

  const admin = createSupabaseAdminClient();
  const existing = await admin
    .from("profiles")
    .select("id, email, name, role, facility_id, permissions")
    .eq("id", userId)
    .single();

  if (existing.error || !existing.data) {
    throw new Error(existing.error?.message ?? "User not found");
  }

  const role = (payload.role ?? existing.data.role) as UserProfile["role"];
  const response = await admin
    .from("profiles")
    .update({
      name: payload.name?.trim() || existing.data.name,
      facility_id: payload.facilityId || existing.data.facility_id,
      role,
      permissions: rolePermissions[role],
    })
    .eq("id", userId)
    .select("id, email, name, role, facility_id, permissions")
    .single();

  if (response.error || !response.data) {
    throw new Error(response.error?.message ?? "Failed to update user");
  }

  return mapProfile(response.data);
}

export async function updateFacilityRecord(
  facilityId: string,
  payload: {
    name?: string;
    region?: string;
    timezone?: string;
    lines?: number;
    uptimeTarget?: number;
    siteLead?: string;
  },
) {
  if (!hasSupabaseEnv()) {
    const facility = facilities.find((item) => item.id === facilityId);
    if (!facility) {
      throw new Error("Facility not found");
    }

    return {
      ...facility,
      name: payload.name?.trim() || facility.name,
      region: payload.region?.trim() || facility.region,
      timezone: payload.timezone?.trim() || facility.timezone,
      lines: payload.lines ?? facility.lines,
      uptimeTarget: payload.uptimeTarget ?? facility.uptimeTarget,
      siteLead: payload.siteLead?.trim() || facility.siteLead,
    } satisfies Facility;
  }

  const admin = createSupabaseAdminClient();
  const response = await admin
    .from("facilities")
    .update({
      name: payload.name?.trim(),
      region: payload.region?.trim(),
      timezone: payload.timezone?.trim(),
      lines: payload.lines,
      uptime_target: payload.uptimeTarget,
      site_lead: payload.siteLead?.trim(),
    })
    .eq("id", facilityId)
    .select("id, name, region, timezone, lines, uptime_target, site_lead")
    .single();

  if (response.error || !response.data) {
    throw new Error(response.error?.message ?? "Failed to update facility");
  }

  return mapFacility(response.data);
}

export async function updateSensorConfigurationRecord(
  configId: string,
  payload: {
    coverage?: number;
    lastCalibratedAt?: string;
    gatewayStatus?: SensorConfiguration["gatewayStatus"];
  },
) {
  if (!hasSupabaseEnv()) {
    const config = sensorConfigurations.find((item) => item.id === configId);
    if (!config) {
      throw new Error("Sensor configuration not found");
    }

    return {
      ...config,
      coverage: payload.coverage ?? config.coverage,
      lastCalibratedAt: payload.lastCalibratedAt || config.lastCalibratedAt,
      gatewayStatus: payload.gatewayStatus ?? config.gatewayStatus,
    } satisfies SensorConfiguration;
  }

  const admin = createSupabaseAdminClient();
  const response = await admin
    .from("sensor_configurations")
    .update({
      coverage: payload.coverage,
      last_calibrated_at: payload.lastCalibratedAt,
      gateway_status: payload.gatewayStatus,
    })
    .eq("id", configId)
    .select("id, facility_id, sensor_type, coverage, last_calibrated_at, gateway_status")
    .single();

  if (response.error || !response.data) {
    throw new Error(response.error?.message ?? "Failed to update sensor configuration");
  }

  return mapSensorConfiguration(response.data);
}

export async function ingestTelemetryPoint(payload: TelemetryIngestPayload): Promise<TelemetryIngestResult> {
  const point = {
    timestamp: payload.timestamp,
    vibration: payload.vibration,
    temperature: payload.temperature,
    acoustic: payload.acoustic,
    pressure: payload.pressure,
    runtimeHours: payload.runtimeHours,
  };

  if (!hasSupabaseEnv()) {
    const asset = equipment.find((item) => item.id === payload.equipmentId);
    const existing = telemetry.find((item) => item.equipmentId === payload.equipmentId);
    if (!asset || !existing) {
      throw new Error("Equipment telemetry source not found");
    }

    const prediction = buildPredictionSnapshot(asset, [
      {
        equipmentId: payload.equipmentId,
        points: [...existing.points, point].sort((left, right) => left.timestamp.localeCompare(right.timestamp)),
      },
    ]);

    const alert = prediction.riskLevel === "High" || prediction.riskLevel === "Critical"
      ? buildTelemetryAlert(asset, prediction)
      : undefined;

    return { point, prediction, alert };
  }

  const admin = createSupabaseAdminClient();
  const insertResponse = await admin.from("telemetry_points").insert({
    equipment_id: payload.equipmentId,
    timestamp: point.timestamp,
    vibration: point.vibration,
    temperature: point.temperature,
    acoustic: point.acoustic,
    pressure: point.pressure,
    runtime_hours: point.runtimeHours,
  });

  if (insertResponse.error) {
    throw new Error(insertResponse.error.message);
  }

  const [equipmentResponse, telemetryResponse, openAlertResponse] = await Promise.all([
    admin
      .from("equipment")
      .select("id, name, facility_id, type, model, line, criticality, install_date, last_maintenance_at, baseline_oee, baseline_power_kw, sensors")
      .eq("id", payload.equipmentId)
      .single(),
    admin
      .from("telemetry_points")
      .select("equipment_id, timestamp, vibration, temperature, acoustic, pressure, runtime_hours")
      .eq("equipment_id", payload.equipmentId)
      .order("timestamp", { ascending: true }),
    admin
      .from("alerts")
      .select("id")
      .eq("equipment_id", payload.equipmentId)
      .neq("status", "Resolved")
      .limit(1),
  ]);

  if (equipmentResponse.error || !equipmentResponse.data) {
    throw new Error(equipmentResponse.error?.message ?? "Equipment not found after telemetry ingest");
  }

  const asset = mapEquipment(equipmentResponse.data);
  const prediction = buildPredictionSnapshot(asset, mapTelemetry(telemetryResponse.data ?? []));

  let alert: Alert | undefined;
  if ((prediction.riskLevel === "High" || prediction.riskLevel === "Critical") && (openAlertResponse.data?.length ?? 0) === 0) {
    const candidate = buildTelemetryAlert(asset, prediction);
    const alertResponse = await admin
      .from("alerts")
      .insert({
        id: candidate.id,
        equipment_id: candidate.equipmentId,
        facility_id: candidate.facilityId,
        severity: candidate.severity,
        title: candidate.title,
        summary: candidate.summary,
        status: candidate.status,
        recommended_action: candidate.recommendedAction,
        created_at: candidate.createdAt,
      })
      .select("id, equipment_id, facility_id, severity, title, summary, status, recommended_action, created_at")
      .single();

    if (!alertResponse.error && alertResponse.data) {
      alert = mapAlert(alertResponse.data);
    }
  }

  return { point, prediction, alert };
}
