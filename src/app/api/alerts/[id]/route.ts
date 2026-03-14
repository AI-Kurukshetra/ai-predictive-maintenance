import { NextResponse } from "next/server";
import { z } from "zod";

import { updateAlertStatus } from "@/lib/data/repository";

const patchSchema = z.object({
  status: z.enum(["Open", "Acknowledged", "Escalated", "Resolved"]),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const payload = patchSchema.parse(await request.json());
  const alert = await updateAlertStatus(id, payload.status);
  return NextResponse.json({ alert });
}
