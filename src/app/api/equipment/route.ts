import { NextResponse } from "next/server";

import { getDemoSessionFromCookies } from "@/lib/auth/session";
import { hasSupabaseEnv } from "@/lib/config";
import { getBootstrapPayload, getCurrentSessionUser } from "@/lib/data/repository";
import { getAllPredictionSnapshots } from "@/lib/prediction";

export async function GET() {
  const currentUser = hasSupabaseEnv() ? await getCurrentSessionUser() : await getDemoSessionFromCookies();
  const bootstrap = await getBootstrapPayload(currentUser);
  const predictions = getAllPredictionSnapshots(bootstrap.equipment, bootstrap.telemetry);
  const payload = bootstrap.equipment.map((item) => ({
    ...item,
    prediction: predictions.find((prediction) => prediction.equipmentId === item.id),
  }));

  return NextResponse.json({ equipment: payload });
}
