import { NextResponse } from "next/server";
import { z } from "zod";

import { hasPermission } from "@/lib/auth/permissions";
import { getDemoSessionFromCookies } from "@/lib/auth/session";
import { hasSupabaseEnv } from "@/lib/config";
import { getCurrentSessionUser, updateManagedProfile } from "@/lib/data/repository";

const patchSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  facilityId: z.string().min(1).optional(),
  role: z.enum(["Maintenance Manager", "Reliability Engineer", "Plant Director", "Technician"]).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const currentUser = hasSupabaseEnv() ? await getCurrentSessionUser() : await getDemoSessionFromCookies();
  if (!currentUser || !hasPermission(currentUser, "settings:manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const payload = patchSchema.parse(await request.json());
  const { id } = await params;
  const user = await updateManagedProfile(id, payload);
  return NextResponse.json({ user });
}
