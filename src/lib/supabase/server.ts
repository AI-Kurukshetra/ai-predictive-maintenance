import { cookies } from "next/headers";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function getUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
}

function getAnonKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
}

function getServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
}

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(getUrl(), getAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // No-op in contexts where cookie mutation is not supported.
        }
      },
    },
  });
}

export function createSupabaseMiddlewareClient(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(getUrl(), getAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  return { supabase, response };
}

export function createSupabaseAdminClient(): SupabaseClient {
  return createClient(getUrl(), getServiceRoleKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
