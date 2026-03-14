import { NextResponse } from "next/server";

import { getDemoSessionFromCookies } from "@/lib/auth/session";
import { hasSupabaseEnv } from "@/lib/config";
import { getBootstrapPayload, getCurrentSessionUser } from "@/lib/data/repository";
import { getAllPredictionSnapshots } from "@/lib/prediction";

export async function GET() {
  const currentUser = hasSupabaseEnv() ? await getCurrentSessionUser() : await getDemoSessionFromCookies();
  const bootstrap = await getBootstrapPayload(currentUser);
  const predictions = getAllPredictionSnapshots(bootstrap.equipment, bootstrap.telemetry);
  const averageHealth = predictions.reduce((sum, item) => sum + item.healthScore, 0) / Math.max(predictions.length, 1);
  const projectedUptime =
    predictions.reduce((sum, item) => sum + item.uptimeProjection, 0) / Math.max(predictions.length, 1);

  return NextResponse.json({
    metrics: {
      averageHealth: Math.round(averageHealth),
      projectedUptime: Number(projectedUptime.toFixed(1)),
      criticalAlerts: bootstrap.alerts.filter((item) => item.severity === "Critical").length,
      activeWorkOrders: bootstrap.workOrders.filter((item) => item.status !== "Completed").length,
    },
  });
}
