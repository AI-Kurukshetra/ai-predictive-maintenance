import { NextResponse } from "next/server";

import { getDemoSessionFromCookies } from "@/lib/auth/session";
import { hasSupabaseEnv } from "@/lib/config";
import { getCurrentSessionUser } from "@/lib/data/repository";

export async function GET() {
  const user = hasSupabaseEnv() ? await getCurrentSessionUser() : await getDemoSessionFromCookies();
  return NextResponse.json({
    mode: hasSupabaseEnv() ? "supabase" : "demo",
    user,
  });
}
