import { NextResponse } from "next/server";
import { z } from "zod";

import { hasPermission } from "@/lib/auth/permissions";
import { getDemoSessionFromCookies } from "@/lib/auth/session";
import { hasSupabaseEnv } from "@/lib/config";
import { getCurrentSessionUser, updateSensorConfigurationRecord } from "@/lib/data/repository";

const patchSchema = z.object({
  coverage: z.number().int().min(0).max(100).optional(),
  lastCalibratedAt: z.string().min(1).optional(),
  gatewayStatus: z.enum(["Healthy", "Needs Attention"]).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const currentUser = hasSupabaseEnv() ? await getCurrentSessionUser() : await getDemoSessionFromCookies();
  if (!currentUser || !hasPermission(currentUser, "settings:manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let payload: z.infer<typeof patchSchema>;
  try {
    payload = patchSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  const { id } = await params;

  try {
    const sensorConfiguration = await updateSensorConfigurationRecord(id, payload);
    return NextResponse.json({ sensorConfiguration });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.toLowerCase().includes("not found") || message.toLowerCase().includes("rows returned") || message.toLowerCase().includes("0 rows")) {
      return NextResponse.json({ error: "Sensor configuration not found" }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
