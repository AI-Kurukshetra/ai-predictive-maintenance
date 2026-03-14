import { NextResponse, type NextRequest } from "next/server";

import { getRoutePermission, hasPermission } from "@/lib/auth/permissions";
import { getDemoSessionFromRequest } from "@/lib/auth/session";
import { hasSupabaseEnv } from "@/lib/config";
import { createSupabaseMiddlewareClient, createSupabaseAdminClient } from "@/lib/supabase/server";

const publicRoutes = new Set(["/", "/login", "/signup", "/unauthorized"]);

function isStaticAsset(pathname: string) {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.includes(".")
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isStaticAsset(pathname) || pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  if (hasSupabaseEnv()) {
    const { supabase, response } = createSupabaseMiddlewareClient(request);
    const userResponse = await supabase.auth.getUser();
    const supabaseUser = userResponse.data.user;

    if (!supabaseUser && !publicRoutes.has(pathname)) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (supabaseUser) {
      const admin = createSupabaseAdminClient();
      const profileResponse = await admin
        .from("profiles")
        .select("permissions")
        .eq("id", supabaseUser.id)
        .single();
      const routePermission = getRoutePermission(pathname);
      const permissions = (profileResponse.data?.permissions ?? []) as string[];
      if (routePermission && !permissions.includes(routePermission)) {
        return NextResponse.redirect(new URL("/unauthorized", request.url));
      }
      if (publicRoutes.has(pathname)) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }

    return response;
  }

  const demoUser = getDemoSessionFromRequest(request);
  if (!demoUser && !publicRoutes.has(pathname) && !pathname.startsWith("/api")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (demoUser) {
    const routePermission = getRoutePermission(pathname);
    if (routePermission && !hasPermission(demoUser, routePermission)) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
    if (publicRoutes.has(pathname)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
