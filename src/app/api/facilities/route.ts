import { NextResponse } from "next/server";

import { getDemoSessionFromCookies } from "@/lib/auth/session";
import { hasSupabaseEnv } from "@/lib/config";
import { getBootstrapPayload, getCurrentSessionUser } from "@/lib/data/repository";
import { getAllPredictionSnapshots } from "@/lib/prediction";

export async function GET() {
  const currentUser = hasSupabaseEnv() ? await getCurrentSessionUser() : await getDemoSessionFromCookies();
  const bootstrap = await getBootstrapPayload(currentUser);
  const predictions = getAllPredictionSnapshots(bootstrap.equipment, bootstrap.telemetry);
  const payload = bootstrap.facilities.map((facility) => {
    const facilityEquipment = bootstrap.equipment.filter((item) => item.facilityId === facility.id);
    const health =
      facilityEquipment.reduce((sum, item) => {
        const prediction = predictions.find((candidate) => candidate.equipmentId === item.id);
        return sum + (prediction?.healthScore ?? 0);
      }, 0) / Math.max(facilityEquipment.length, 1);

    return {
      ...facility,
      assetCount: facilityEquipment.length,
      averageHealth: Math.round(health),
    };
  });

  return NextResponse.json({ facilities: payload });
}
