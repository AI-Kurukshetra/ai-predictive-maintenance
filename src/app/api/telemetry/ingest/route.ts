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

  let payload: z.infer<typeof postSchema>;
  try {
    payload = postSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  try {
    const result = await ingestTelemetryPoint(payload);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
