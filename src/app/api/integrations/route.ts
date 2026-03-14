import { NextResponse } from "next/server";

import { getDemoSessionFromCookies } from "@/lib/auth/session";
import { hasSupabaseEnv } from "@/lib/config";
import { listIntegrations } from "@/lib/integrations";
import { getCurrentSessionUser } from "@/lib/data/repository";

export async function GET() {
  const currentUser = hasSupabaseEnv() ? await getCurrentSessionUser() : await getDemoSessionFromCookies();
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ integrations: listIntegrations() });
}
