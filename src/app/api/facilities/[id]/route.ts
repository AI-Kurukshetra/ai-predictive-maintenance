import { NextResponse } from "next/server";
import { z } from "zod";

import { hasPermission } from "@/lib/auth/permissions";
import { getDemoSessionFromCookies } from "@/lib/auth/session";
import { hasSupabaseEnv } from "@/lib/config";
import { getCurrentSessionUser, updateFacilityRecord } from "@/lib/data/repository";

const patchSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  region: z.string().min(2).max(80).optional(),
  timezone: z.string().min(2).max(40).optional(),
  lines: z.number().int().min(1).max(20).optional(),
  uptimeTarget: z.number().min(50).max(100).optional(),
  siteLead: z.string().min(2).max(80).optional(),
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
    const facility = await updateFacilityRecord(id, payload);
    return NextResponse.json({ facility });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.toLowerCase().includes("not found") || message.toLowerCase().includes("rows returned") || message.toLowerCase().includes("0 rows")) {
      return NextResponse.json({ error: "Facility not found" }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
