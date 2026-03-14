import { NextResponse } from "next/server";
import { z } from "zod";

import { getDemoSessionFromCookies } from "@/lib/auth/session";
import { hasSupabaseEnv } from "@/lib/config";
import { createWorkOrder, createWorkOrderFromAlert, getBootstrapPayload, getCurrentSessionUser } from "@/lib/data/repository";
import { hasPermission } from "@/lib/auth/permissions";

export async function GET() {
  const currentUser = hasSupabaseEnv() ? await getCurrentSessionUser() : await getDemoSessionFromCookies();
  const bootstrap = await getBootstrapPayload(currentUser);
  return NextResponse.json({
    workOrders: bootstrap.workOrders,
    summary: {
      open: bootstrap.workOrders.filter((item) => item.status === "Open").length,
      scheduled: bootstrap.workOrders.filter((item) => item.status === "Scheduled").length,
      inProgress: bootstrap.workOrders.filter((item) => item.status === "In Progress").length,
      completed: bootstrap.workOrders.filter((item) => item.status === "Completed").length,
    },
  });
}

const createSchema = z
  .object({
    alertId: z.string().min(1).optional(),
    equipmentId: z.string().min(1).optional(),
    title: z.string().min(3).optional(),
    assignee: z.string().min(2).optional(),
    dueDate: z.string().min(1).optional(),
    priority: z.enum(["Critical", "High", "Medium", "Low"]).optional(),
    status: z.enum(["Open", "Scheduled", "In Progress", "Completed"]).optional(),
    notes: z.string().optional(),
    partsRequired: z.array(z.string().min(1)).optional(),
    sourceAlertId: z.string().min(1).optional(),
  })
  .refine((value) => Boolean(value.alertId) || Boolean(value.equipmentId && value.title && value.dueDate && value.priority), {
    message: "Provide either alertId or a manual work order payload.",
  });

export async function POST(request: Request) {
  const currentUser = hasSupabaseEnv() ? await getCurrentSessionUser() : await getDemoSessionFromCookies();
  if (!currentUser || !hasPermission(currentUser, "workorders:create")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const payload = createSchema.parse(await request.json());
  const workOrder = payload.alertId
    ? await createWorkOrderFromAlert(payload.alertId, currentUser)
    : await createWorkOrder(currentUser, {
        equipmentId: payload.equipmentId!,
        title: payload.title!,
        assignee: payload.assignee,
        dueDate: payload.dueDate!,
        priority: payload.priority!,
        status: payload.status,
        notes: payload.notes,
        partsRequired: payload.partsRequired,
        sourceAlertId: payload.sourceAlertId,
      });
  return NextResponse.json({ workOrder });
}
