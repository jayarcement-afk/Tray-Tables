import Image from "next/image";
import Link from "next/link";

import { SignOutButton } from "@/components/shell/sign-out-button";
import { env, normalizedSupabaseUrl } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const HEADER_LOGO_SRC = "/keep-this-logo-202604141317.png";

export async function AppHeader() {
  let user: { id: string } | null = null;
  const normalizedUrl = normalizedSupabaseUrl(env.supabaseUrl?.trim());
  const hasSupabaseEnv =
    Boolean(env.supabaseAnonKey?.trim()) && Boolean(normalizedUrl);

  // Guard prerender/build from malformed env (e.g. invalid URL in deployment settings).
  if (hasSupabaseEnv) {
    try {
      const supabase = await createSupabaseServerClient();
      const { data } = await supabase.auth.getUser();
      user = data.user;
    } catch {
      user = null;
    }
  }
  const homeHref = "/";

  return (
    <header className="sticky top-0 z-[1100] border-b border-zinc-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-2 px-4 sm:gap-3 sm:px-6">
        <Link
          href={homeHref}
          className="shrink-0 rounded-md p-0.5 outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-zinc-400"
          aria-label="Tray Tables — home"
        >
          <Image
            src={HEADER_LOGO_SRC}
            alt="Tray Tables"
            width={140}
            height={44}
            className="h-9 w-auto max-h-10 object-contain object-left sm:max-w-[7.5rem] md:max-w-[8.5rem]"
            priority
          />
        </Link>
        <nav className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-x-0.5 gap-y-1 sm:gap-x-1">
          <Link
            href="/games"
            className="shrink-0 rounded-lg px-2 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 sm:px-3"
          >
            Games
          </Link>
          {user ? (
            <>
              <Link
                href="/trips/new"
                className="shrink-0 rounded-lg px-2 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 sm:px-3"
              >
                New Trip
              </Link>
              <Link
                href="/trips"
                className="shrink-0 rounded-lg px-2 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 sm:px-3"
              >
                My Trips
              </Link>
              <Link
                href="/passport"
                className="shrink-0 rounded-lg px-2 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 sm:px-3"
              >
                Passport
              </Link>
              <SignOutButton />
            </>
          ) : (
            <Link
              href="/auth"
              className="shrink-0 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
