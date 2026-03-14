import { NextResponse } from "next/server";

import { hasPermission } from "@/lib/auth/permissions";
import { getDemoSessionFromCookies } from "@/lib/auth/session";
import { hasSupabaseEnv } from "@/lib/config";
import { getBootstrapPayload, getCurrentSessionUser } from "@/lib/data/repository";
import { syncWorkOrderToProvider } from "@/lib/integrations";
import type { IntegrationProvider } from "@/lib/types";

function isProvider(value: string): value is IntegrationProvider {
  return value === "odoo" || value === "fracttal";
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ provider: string; id: string }> },
) {
  const currentUser = hasSupabaseEnv() ? await getCurrentSessionUser() : await getDemoSessionFromCookies();
  if (!currentUser || !hasPermission(currentUser, "workorders:create")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { provider, id } = await params;
  if (!isProvider(provider)) {
    return NextResponse.json({ error: "Unknown provider" }, { status: 404 });
  }

  const bootstrap = await getBootstrapPayload(currentUser);
  const workOrder = bootstrap.workOrders.find((item) => item.id === id);
  if (!workOrder) {
    return NextResponse.json({ error: "Work order not found" }, { status: 404 });
  }

  const asset = bootstrap.equipment.find((item) => item.id === workOrder.equipmentId);
  if (!asset) {
    return NextResponse.json({ error: "Linked equipment not found" }, { status: 404 });
  }

  try {
    const result = await syncWorkOrderToProvider(provider, workOrder, asset);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        provider,
        ok: false,
        message: error instanceof Error ? error.message : "Work-order sync failed.",
      },
      { status: 400 },
    );
  }
}
