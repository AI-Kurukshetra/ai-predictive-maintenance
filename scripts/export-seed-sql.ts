import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

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

function escapeSql(value: string) {
  return value.replace(/'/g, "''");
}

function json(value: unknown) {
  return `'${escapeSql(JSON.stringify(value))}'::jsonb`;
}

function text(value: string) {
  return `'${escapeSql(value)}'`;
}

const statements: string[] = [
  "-- IntelliMaintain Pro seed export",
  "-- Generated from scripts/export-seed-sql.ts",
  "",
  "truncate table public.telemetry_points, public.work_orders, public.alerts, public.inventory_items, public.equipment_documents, public.sensor_configurations, public.equipment, public.profiles, public.facilities restart identity cascade;",
  "",
];

facilities.forEach((facility) => {
  statements.push(
    `insert into public.facilities (id, name, region, timezone, lines, uptime_target, site_lead) values (${text(facility.id)}, ${text(facility.name)}, ${text(facility.region)}, ${text(facility.timezone)}, ${facility.lines}, ${facility.uptimeTarget}, ${text(facility.siteLead)});`,
  );
});

equipment.forEach((item) => {
  statements.push(
    `insert into public.equipment (id, name, facility_id, type, model, line, criticality, install_date, last_maintenance_at, baseline_oee, baseline_power_kw, sensors) values (${text(item.id)}, ${text(item.name)}, ${text(item.facilityId)}, ${text(item.type)}, ${text(item.model)}, ${text(item.line)}, ${text(item.criticality)}, ${text(item.installDate)}, ${text(item.lastMaintenanceAt)}, ${item.baselineOee}, ${item.baselinePowerKw}, ${json(item.sensors)});`,
  );
});

telemetry.forEach((series) => {
  series.points.forEach((point) => {
    statements.push(
      `insert into public.telemetry_points (equipment_id, timestamp, vibration, temperature, acoustic, pressure, runtime_hours) values (${text(series.equipmentId)}, ${text(point.timestamp)}, ${point.vibration}, ${point.temperature}, ${point.acoustic}, ${point.pressure}, ${point.runtimeHours});`,
    );
  });
});

alertsSeed.forEach((alert) => {
  statements.push(
    `insert into public.alerts (id, equipment_id, facility_id, severity, title, summary, status, recommended_action, created_at) values (${text(alert.id)}, ${text(alert.equipmentId)}, ${text(alert.facilityId)}, ${text(alert.severity)}, ${text(alert.title)}, ${text(alert.summary)}, ${text(alert.status)}, ${text(alert.recommendedAction)}, ${text(alert.createdAt)});`,
  );
});

workOrdersSeed.forEach((order) => {
  statements.push(
    `insert into public.work_orders (id, equipment_id, facility_id, source_alert_id, title, assignee, due_date, priority, status, notes, parts_required) values (${text(order.id)}, ${text(order.equipmentId)}, ${text(order.facilityId)}, ${order.sourceAlertId ? text(order.sourceAlertId) : "null"}, ${text(order.title)}, ${text(order.assignee)}, ${text(order.dueDate)}, ${text(order.priority)}, ${text(order.status)}, ${text(order.notes)}, ${json(order.partsRequired)});`,
  );
});

inventorySeed.forEach((item) => {
  statements.push(
    `insert into public.inventory_items (id, facility_id, part_name, sku, on_hand, reorder_point, linked_equipment_ids, lead_time_days) values (${text(item.id)}, ${text(item.facilityId)}, ${text(item.partName)}, ${text(item.sku)}, ${item.onHand}, ${item.reorderPoint}, ${json(item.linkedEquipmentIds)}, ${item.leadTimeDays});`,
  );
});

documents.forEach((document) => {
  statements.push(
    `insert into public.equipment_documents (id, equipment_id, title, category, updated_at) values (${text(document.id)}, ${text(document.equipmentId)}, ${text(document.title)}, ${text(document.category)}, ${text(document.updatedAt)});`,
  );
});

sensorConfigurations.forEach((config) => {
  statements.push(
    `insert into public.sensor_configurations (id, facility_id, sensor_type, coverage, last_calibrated_at, gateway_status) values (${text(config.id)}, ${text(config.facilityId)}, ${text(config.sensorType)}, ${config.coverage}, ${text(config.lastCalibratedAt)}, ${text(config.gatewayStatus)});`,
  );
});

users.forEach((user) => {
  statements.push(
    `-- Create auth.users row for ${user.email} separately, then seed profile using the generated auth.users.id UUID.`,
  );
  statements.push(
    `-- insert into public.profiles (id, email, name, role, facility_id, permissions) values ('<auth-user-uuid>', ${text(user.email)}, ${text(user.name)}, ${text(user.role)}, ${text(user.facilityId)}, ${json(user.permissions)});`,
  );
});

const outputDir = join(process.cwd(), "supabase", "seed");
mkdirSync(outputDir, { recursive: true });
const outputPath = join(outputDir, "intellimaintain_seed.sql");
writeFileSync(outputPath, `${statements.join("\n")}\n`, "utf8");

console.log(`Wrote seed SQL to ${outputPath}`);
