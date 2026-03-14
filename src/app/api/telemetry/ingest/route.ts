import { NextResponse } from "next/server";
import { z } from "zod";

import { getDemoSessionFromCookies } from "@/lib/auth/session";
import { hasSupabaseEnv } from "@/lib/config";
import { getCurrentSessionUser, ingestTelemetryPoint } from "@/lib/data/repository";

const postSchema = z.object({
  equipmentId: z.string().min(1),
  timestamp: z.string().min(1),
  vibration: z.number().min(0),
  temperature: z.number().min(0),
  acoustic: z.number().min(0),
  pressure: z.number().min(0),
  runtimeHours: z.number().min(0),
});

export async function POST(request: Request) {
  const currentUser = hasSupabaseEnv() ? await getCurrentSessionUser() : await getDemoSessionFromCookies();
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = postSchema.parse(await request.json());
  const result = await ingestTelemetryPoint(payload);
  return NextResponse.json(result);
}
