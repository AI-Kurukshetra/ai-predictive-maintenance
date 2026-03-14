import { NextResponse } from "next/server";

import { getDemoSessionFromCookies } from "@/lib/auth/session";
import { hasSupabaseEnv } from "@/lib/config";
import { getBootstrapPayload, getCurrentSessionUser } from "@/lib/data/repository";
import { getAllPredictionSnapshots } from "@/lib/prediction";
import { getFacilityName, getEquipmentName } from "@/lib/view-helpers";

function escapeCsv(value: string | number) {
  const stringValue = String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

export async function GET(request: Request) {
  const currentUser = hasSupabaseEnv() ? await getCurrentSessionUser() : await getDemoSessionFromCookies();
  const bootstrap = await getBootstrapPayload(currentUser);
  const { searchParams } = new URL(request.url);
  const facilityId = searchParams.get("facilityId");
  const windowDays = Number(searchParams.get("windowDays") ?? "30");
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - windowDays);

  const filteredEquipment = facilityId && facilityId !== "all"
    ? bootstrap.equipment.filter((item) => item.facilityId === facilityId)
    : bootstrap.equipment;
  const filteredAlerts = bootstrap.alerts.filter((item) => {
    const matchesFacility = !facilityId || facilityId === "all" || item.facilityId === facilityId;
    return matchesFacility && new Date(item.createdAt) >= cutoff;
  });
  const filteredWorkOrders = bootstrap.workOrders.filter((item) => {
    const matchesFacility = !facilityId || facilityId === "all" || item.facilityId === facilityId;
    return matchesFacility && new Date(item.dueDate) >= cutoff;
  });
  const predictions = getAllPredictionSnapshots(bootstrap.equipment, bootstrap.telemetry);

  const rows = [
    ["equipment", "facility", "health_score", "risk_level", "predicted_failure_window", "open_alerts", "active_work_orders", "window_days"],
    ...filteredEquipment.map((item) => {
      const prediction = predictions.find((candidate) => candidate.equipmentId === item.id);
      const openAlerts = filteredAlerts.filter((alert) => alert.equipmentId === item.id && alert.status !== "Resolved").length;
      const activeWorkOrders = filteredWorkOrders.filter((workOrder) => workOrder.equipmentId === item.id && workOrder.status !== "Completed").length;
      return [
        getEquipmentName(item.id, bootstrap.equipment),
        getFacilityName(item.facilityId, bootstrap.facilities),
        prediction?.healthScore ?? "",
        prediction?.riskLevel ?? "",
        prediction?.predictedFailureWindow ?? "",
        openAlerts,
        activeWorkOrders,
        windowDays,
      ];
    }),
  ];

  const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="intellimaintain-report.csv"',
    },
  });
}
