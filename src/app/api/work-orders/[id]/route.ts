import { NextResponse } from "next/server";
import { z } from "zod";

import { updateWorkOrder } from "@/lib/data/repository";

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
  const { id } = await params;
  const payload = patchSchema.parse(await request.json());
  const workOrder = await updateWorkOrder(id, payload);
  return NextResponse.json({ workOrder });
}
