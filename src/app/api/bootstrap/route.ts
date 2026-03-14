import { NextResponse } from "next/server";

import { getDemoSessionFromCookies } from "@/lib/auth/session";
import { getBootstrapPayload, getCurrentSessionUser } from "@/lib/data/repository";
import { hasSupabaseEnv } from "@/lib/config";

export async function GET() {
  const currentUser = hasSupabaseEnv() ? await getCurrentSessionUser() : await getDemoSessionFromCookies();
  const payload = await getBootstrapPayload(currentUser);
  return NextResponse.json(payload);
}
