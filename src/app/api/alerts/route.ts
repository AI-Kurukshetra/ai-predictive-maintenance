import { NextResponse } from "next/server";

import { getDemoSessionFromCookies } from "@/lib/auth/session";
import { hasSupabaseEnv } from "@/lib/config";
import { getBootstrapPayload, getCurrentSessionUser } from "@/lib/data/repository";

export async function GET() {
  const currentUser = hasSupabaseEnv() ? await getCurrentSessionUser() : await getDemoSessionFromCookies();
  const bootstrap = await getBootstrapPayload(currentUser);
  return NextResponse.json({
    alerts: bootstrap.alerts,
    summary: {
      open: bootstrap.alerts.filter((item) => item.status === "Open").length,
      escalated: bootstrap.alerts.filter((item) => item.status === "Escalated").length,
      critical: bootstrap.alerts.filter((item) => item.severity === "Critical").length,
    },
  });
}
