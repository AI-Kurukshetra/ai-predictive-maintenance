import { NextResponse } from "next/server";
import { z } from "zod";

import { hasPermission } from "@/lib/auth/permissions";
import { getDemoSessionFromCookies } from "@/lib/auth/session";
import { hasSupabaseEnv } from "@/lib/config";
import { getCurrentSessionUser, updateAlertStatus } from "@/lib/data/repository";

const patchSchema = z.object({
  status: z.enum(["Open", "Acknowledged", "Escalated", "Resolved"]),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const currentUser = hasSupabaseEnv() ? await getCurrentSessionUser() : await getDemoSessionFromCookies();
  if (!currentUser || !hasPermission(currentUser, "alerts:triage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  let payload: z.infer<typeof patchSchema>;
  try {
    payload = patchSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid status value." }, { status: 400 });
  }

  try {
    const alert = await updateAlertStatus(id, payload.status);
    return NextResponse.json({ alert });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.toLowerCase().includes("not found") || message.toLowerCase().includes("rows returned") || message.toLowerCase().includes("0 rows")) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
