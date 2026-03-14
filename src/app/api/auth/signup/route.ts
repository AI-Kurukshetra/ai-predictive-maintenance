import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";
import { z } from "zod";

import { rolePermissions } from "@/lib/auth/permissions";
import { setDemoSessionOnResponse } from "@/lib/auth/session";
import { hasSupabaseEnv } from "@/lib/config";
import { createAuthProfile } from "@/lib/data/repository";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SessionUser, UserProfile } from "@/lib/types";

const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["Maintenance Manager", "Reliability Engineer", "Plant Director", "Technician"]),
  facilityId: z.string().min(1),
});

export async function POST(request: Request) {
  let payload: z.infer<typeof signupSchema>;
  try {
    payload = signupSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  if (!hasSupabaseEnv()) {
    const demoUser: SessionUser = {
      id: `demo-${randomUUID().slice(0, 8)}`,
      name: payload.name,
      email: payload.email,
      role: payload.role as UserProfile["role"],
      facilityId: payload.facilityId,
      permissions: rolePermissions[payload.role],
    };
    const response = NextResponse.json({ user: demoUser, mode: "demo" });
    setDemoSessionOnResponse(response, demoUser);
    return response;
  }

  const supabase = await createSupabaseServerClient();
  const signUpResponse = await supabase.auth.signUp({
    email: payload.email,
    password: payload.password,
    options: {
      data: {
        name: payload.name,
      },
    },
  });

  if (signUpResponse.error || !signUpResponse.data.user) {
    return NextResponse.json({ error: signUpResponse.error?.message ?? "Failed to sign up." }, { status: 400 });
  }

  const profile = await createAuthProfile({
    id: signUpResponse.data.user.id,
    email: payload.email,
    name: payload.name,
    role: payload.role,
    facilityId: payload.facilityId,
  });

  return NextResponse.json({ user: profile, mode: "supabase" });
}
