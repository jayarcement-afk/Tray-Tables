import { type NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  // Keep middleware side-effect free at build/prerender time.
  return NextResponse.next({ request });
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
