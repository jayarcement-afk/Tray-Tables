import { type NextRequest, NextResponse } from "next/server";

import { createServerClient } from "@supabase/ssr";

import { env, isValidHttpUrl } from "@/lib/env";

export async function proxy(request: NextRequest) {
  const base = NextResponse.next({ request });

  const url = env.supabaseUrl?.trim();
  const key = env.supabaseAnonKey?.trim();
  if (!url || !key || !isValidHttpUrl(url)) {
    return base;
  }

  let response = base;

  try {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            try {
              response.cookies.set(name, value, options);
            } catch {
              // Rejected cookie options should not take down the whole request.
            }
          }
        },
      },
    });

    await supabase.auth.getUser();
  } catch (err) {
    console.error("[proxy] session refresh failed:", err);
    return base;
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
