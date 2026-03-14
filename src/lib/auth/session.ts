import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";

import { rolePermissions } from "@/lib/auth/permissions";
import { demoSessionCookieName } from "@/lib/config";
import { users } from "@/lib/seed-data";
import type { SessionUser, UserProfile } from "@/lib/types";

function encodeSession(session: SessionUser) {
  return Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
}

function decodeSession(value: string | undefined) {
  if (!value) return null;
  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as SessionUser;
  } catch {
    return null;
  }
}

export function buildSessionUser(profile: Pick<UserProfile, "id" | "name" | "email" | "role" | "facilityId" | "permissions">): SessionUser {
  const permissions = Array.from(new Set([...rolePermissions[profile.role], ...profile.permissions]));
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    role: profile.role,
    facilityId: profile.facilityId,
    permissions,
  };
}

export function getDemoUsers() {
  return users.map((user) => buildSessionUser(user));
}

export async function getDemoSessionFromCookies() {
  const store = await cookies();
  return decodeSession(store.get(demoSessionCookieName)?.value);
}

export function getDemoSessionFromRequest(request: NextRequest) {
  return decodeSession(request.cookies.get(demoSessionCookieName)?.value);
}

export function setDemoSessionOnResponse(response: NextResponse, session: SessionUser) {
  response.cookies.set(demoSessionCookieName, encodeSession(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export function clearDemoSessionOnResponse(response: NextResponse) {
  response.cookies.set(demoSessionCookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
