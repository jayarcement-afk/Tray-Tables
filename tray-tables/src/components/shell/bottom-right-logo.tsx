"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Brand mark fixed to the bottom-right; hidden on `/`. No frosted panel — only the image.
 * For a truly transparent edge, replace `public/tray-tables-logo.jpg` with a PNG that has an alpha channel.
 */
export function BottomRightLogo() {
  const pathname = usePathname();
  if (pathname === "/") return null;

  return (
    <div className="pointer-events-none fixed bottom-3 right-3 z-40 sm:bottom-5 sm:right-5">
      <Link
        href="/"
        className="pointer-events-auto block rounded-md outline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-zinc-400"
        aria-label="TRAY TABLES — home"
      >
        <Image
          src="/tray-tables-logo.jpg"
          alt=""
          width={280}
          height={140}
          className="h-14 w-auto max-w-[min(15rem,calc(100vw-1.75rem))] object-contain object-right drop-shadow-[0_1px_2px_rgba(0,0,0,0.12)] sm:h-16 md:h-[4.5rem]"
        />
      </Link>
    </div>
  );
}
