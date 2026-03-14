import { NextResponse } from "next/server";
import { z } from "zod";

import { hasPermission } from "@/lib/auth/permissions";
import { getDemoSessionFromCookies } from "@/lib/auth/session";
import { hasSupabaseEnv } from "@/lib/config";
import { getCurrentSessionUser, updateWorkOrder } from "@/lib/data/repository";

const patchSchema = z.object({
  status: z.enum(["Open", "Scheduled", "In Progress", "Completed"]).optional(),
  assignee: z.string().min(2).optional(),
  dueDate: z.string().min(1).optional(),
  priority: z.enum(["Critical", "High", "Medium", "Low"]).optional(),
  notes: z.string().optional(),
  partsRequired: z.array(z.string().min(1)).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const currentUser = hasSupabaseEnv() ? await getCurrentSessionUser() : await getDemoSessionFromCookies();
  if (!currentUser || !hasPermission(currentUser, "workorders:update")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  let payload: z.infer<typeof patchSchema>;
  try {
    payload = patchSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  try {
    const workOrder = await updateWorkOrder(id, payload);
    return NextResponse.json({ workOrder });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.toLowerCase().includes("not found") || message.toLowerCase().includes("rows returned") || message.toLowerCase().includes("0 rows")) {
      return NextResponse.json({ error: "Work order not found" }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
