import { NextResponse } from "next/server";
import { z } from "zod";

import { getDemoUsers, setDemoSessionOnResponse } from "@/lib/auth/session";
import { hasSupabaseEnv } from "@/lib/config";
import { getCurrentSessionUser } from "@/lib/data/repository";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const loginSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  demoUserId: z.string().optional(),
});

export async function POST(request: Request) {
  const body = await request.json();
  const payload = loginSchema.parse(body);

  if (!hasSupabaseEnv()) {
    const demoUsers = getDemoUsers();
    const selected =
      demoUsers.find((user) => user.id === payload.demoUserId) ??
      demoUsers.find((user) => user.email === payload.email) ??
      demoUsers[0];

    const response = NextResponse.json({ user: selected, mode: "demo" });
    setDemoSessionOnResponse(response, selected);
    return response;
  }

  if (!payload.email || !payload.password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const signInResponse = await supabase.auth.signInWithPassword({
    email: payload.email,
    password: payload.password,
  });

  if (signInResponse.error) {
    return NextResponse.json({ error: signInResponse.error.message }, { status: 400 });
  }

  const user = await getCurrentSessionUser();
  return NextResponse.json({ user, mode: "supabase" });
}
