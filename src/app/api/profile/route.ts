import { NextResponse } from "next/server";
import { z } from "zod";

import { getDemoSessionFromCookies, setDemoSessionOnResponse } from "@/lib/auth/session";
import { hasSupabaseEnv } from "@/lib/config";
import { getCurrentSessionUser, updateCurrentProfile } from "@/lib/data/repository";

const profilePatchSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  facilityId: z.string().min(1).optional(),
  role: z.enum(["Maintenance Manager", "Reliability Engineer", "Plant Director", "Technician"]).optional(),
});

export async function GET() {
  const user = hasSupabaseEnv() ? await getCurrentSessionUser() : await getDemoSessionFromCookies();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ user });
}

export async function PATCH(request: Request) {
  const currentUser = hasSupabaseEnv() ? await getCurrentSessionUser() : await getDemoSessionFromCookies();
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = profilePatchSchema.parse(await request.json());
  const user = await updateCurrentProfile(currentUser, payload);

  if (!hasSupabaseEnv()) {
    const response = NextResponse.json({ user, mode: "demo" });
    setDemoSessionOnResponse(response, user);
    return response;
  }

  return NextResponse.json({ user, mode: "supabase" });
}
