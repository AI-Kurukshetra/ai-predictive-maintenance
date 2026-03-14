import { createClient } from "@supabase/supabase-js";

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
} from "../src/lib/seed-data.ts";
import { seededSupabaseDemoPassword } from "../src/lib/auth/constants.ts";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function run() {
  await supabase.from("telemetry_points").delete().neq("id", "");
  await supabase.from("work_orders").delete().neq("id", "");
  await supabase.from("alerts").delete().neq("id", "");
  await supabase.from("inventory_items").delete().neq("id", "");
  await supabase.from("equipment_documents").delete().neq("id", "");
  await supabase.from("sensor_configurations").delete().neq("id", "");
  await supabase.from("equipment").delete().neq("id", "");
  await supabase.from("profiles").delete().neq("id", "");
  await supabase.from("facilities").delete().neq("id", "");

  const existingUsersResponse = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (existingUsersResponse.error) throw existingUsersResponse.error;

  const seededEmails = new Set(users.map((user) => user.email));
  const existingSeedUsers = existingUsersResponse.data.users.filter((user) => seededEmails.has(user.email ?? ""));
  for (const user of existingSeedUsers) {
    const deleteResponse = await supabase.auth.admin.deleteUser(user.id);
    if (deleteResponse.error) throw deleteResponse.error;
  }

  const facilitiesInsert = await supabase.from("facilities").insert(
    facilities.map((facility) => ({
      id: facility.id,
      name: facility.name,
      region: facility.region,
      timezone: facility.timezone,
      lines: facility.lines,
      uptime_target: facility.uptimeTarget,
      site_lead: facility.siteLead,
    })),
  );
  if (facilitiesInsert.error) throw facilitiesInsert.error;

  const equipmentInsert = await supabase.from("equipment").insert(
    equipment.map((item) => ({
      id: item.id,
      name: item.name,
      facility_id: item.facilityId,
      type: item.type,
      model: item.model,
      line: item.line,
      criticality: item.criticality,
      install_date: item.installDate,
      last_maintenance_at: item.lastMaintenanceAt,
      baseline_oee: item.baselineOee,
      baseline_power_kw: item.baselinePowerKw,
      sensors: item.sensors,
    })),
  );
  if (equipmentInsert.error) throw equipmentInsert.error;

  const telemetryInsert = await supabase.from("telemetry_points").insert(
    telemetry.flatMap((series) =>
      series.points.map((point) => ({
        equipment_id: series.equipmentId,
        timestamp: point.timestamp,
        vibration: point.vibration,
        temperature: point.temperature,
        acoustic: point.acoustic,
        pressure: point.pressure,
        runtime_hours: point.runtimeHours,
      })),
    ),
  );
  if (telemetryInsert.error) throw telemetryInsert.error;

  const alertsInsert = await supabase.from("alerts").insert(
    alertsSeed.map((alert) => ({
      id: alert.id,
      equipment_id: alert.equipmentId,
      facility_id: alert.facilityId,
      severity: alert.severity,
      title: alert.title,
      summary: alert.summary,
      status: alert.status,
      recommended_action: alert.recommendedAction,
      created_at: alert.createdAt,
    })),
  );
  if (alertsInsert.error) throw alertsInsert.error;

  const workOrdersInsert = await supabase.from("work_orders").insert(
    workOrdersSeed.map((order) => ({
      id: order.id,
      equipment_id: order.equipmentId,
      facility_id: order.facilityId,
      source_alert_id: order.sourceAlertId ?? null,
      title: order.title,
      assignee: order.assignee,
      due_date: order.dueDate,
      priority: order.priority,
      status: order.status,
      notes: order.notes,
      parts_required: order.partsRequired,
    })),
  );
  if (workOrdersInsert.error) throw workOrdersInsert.error;

  const inventoryInsert = await supabase.from("inventory_items").insert(
    inventorySeed.map((item) => ({
      id: item.id,
      facility_id: item.facilityId,
      part_name: item.partName,
      sku: item.sku,
      on_hand: item.onHand,
      reorder_point: item.reorderPoint,
      linked_equipment_ids: item.linkedEquipmentIds,
      lead_time_days: item.leadTimeDays,
    })),
  );
  if (inventoryInsert.error) throw inventoryInsert.error;

  const documentInsert = await supabase.from("equipment_documents").insert(
    documents.map((document) => ({
      id: document.id,
      equipment_id: document.equipmentId,
      title: document.title,
      category: document.category,
      updated_at: document.updatedAt,
    })),
  );
  if (documentInsert.error) throw documentInsert.error;

  const configInsert = await supabase.from("sensor_configurations").insert(
    sensorConfigurations.map((config) => ({
      id: config.id,
      facility_id: config.facilityId,
      sensor_type: config.sensorType,
      coverage: config.coverage,
      last_calibrated_at: config.lastCalibratedAt,
      gateway_status: config.gatewayStatus,
    })),
  );
  if (configInsert.error) throw configInsert.error;

  const authProfiles: Array<{
    id: string;
    email: string;
    name: string;
    role: string;
    facility_id: string;
    permissions: string[];
  }> = [];

  for (const user of users) {
    const createUserResponse = await supabase.auth.admin.createUser({
      email: user.email,
      password: seededSupabaseDemoPassword,
      email_confirm: true,
      user_metadata: {
        name: user.name,
      },
    });
    if (createUserResponse.error || !createUserResponse.data.user) {
      throw createUserResponse.error ?? new Error(`Failed to create auth user for ${user.email}`);
    }
    authProfiles.push({
      id: createUserResponse.data.user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      facility_id: user.facilityId,
      permissions: user.permissions,
    });
  }

  const profileInsert = await supabase.from("profiles").insert(
    authProfiles,
  );
  if (profileInsert.error) throw profileInsert.error;

  console.log("Seeded facilities, equipment, telemetry, alerts, work orders, inventory, documents, sensor configurations, auth users, and profiles.");
  console.log(`Seeded Supabase users all use password: ${seededSupabaseDemoPassword}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
