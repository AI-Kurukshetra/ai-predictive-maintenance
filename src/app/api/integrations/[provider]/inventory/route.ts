import { NextResponse } from "next/server";

import { hasPermission } from "@/lib/auth/permissions";
import { getDemoSessionFromCookies } from "@/lib/auth/session";
import { hasSupabaseEnv } from "@/lib/config";
import { getBootstrapPayload, getCurrentSessionUser } from "@/lib/data/repository";
import { pullInventoryComparison } from "@/lib/integrations";
import type { IntegrationProvider } from "@/lib/types";

function isProvider(value: string): value is IntegrationProvider {
  return value === "odoo" || value === "fracttal";
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ provider: string }> },
) {
  const currentUser = hasSupabaseEnv() ? await getCurrentSessionUser() : await getDemoSessionFromCookies();
  if (!currentUser || !hasPermission(currentUser, "inventory:view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { provider } = await params;
  if (!isProvider(provider)) {
    return NextResponse.json({ error: "Unknown provider" }, { status: 404 });
  }

  try {
    const bootstrap = await getBootstrapPayload(currentUser);
    const result = await pullInventoryComparison(provider, bootstrap.inventory);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        provider,
        ok: false,
        message: error instanceof Error ? error.message : "Inventory sync failed.",
      },
      { status: 400 },
    );
  }
}
