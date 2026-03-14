import { NextResponse } from "next/server";

import { clearDemoSessionOnResponse } from "@/lib/auth/session";
import { hasSupabaseEnv } from "@/lib/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST() {
  if (!hasSupabaseEnv()) {
    const response = NextResponse.json({ ok: true, mode: "demo" });
    clearDemoSessionOnResponse(response);
    return response;
  }

  const supabase = await createSupabaseServerClient();
  const signOutResponse = await supabase.auth.signOut();
  if (signOutResponse.error) {
    return NextResponse.json({ error: signOutResponse.error.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true, mode: "supabase" });
}
