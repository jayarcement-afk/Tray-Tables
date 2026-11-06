import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Only allow known image hosts — avoids open proxy abuse */
const ALLOWED =
  /^https:\/\/(images\.unsplash\.com|upload\.wikimedia\.org|placehold\.co)\//;

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("u");
  if (!raw) {
    return new NextResponse("Missing u", { status: 400 });
  }

  let decoded: string;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return new NextResponse("Bad u", { status: 400 });
  }

  if (!ALLOWED.test(decoded)) {
    return new NextResponse("URL not allowed", { status: 403 });
  }

  const referer = decoded.startsWith("https://upload.wikimedia.org/")
    ? "https://commons.wikimedia.org/"
    : "https://unsplash.com/";

  const upstream = await fetch(decoded, {
    cache: "no-store",
    redirect: "follow",
    headers: {
      Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Referer: referer,
    },
  });

  if (!upstream.ok || !upstream.body) {
    return new NextResponse(null, { status: upstream.status || 502 });
  }

  const ct = upstream.headers.get("content-type") ?? "image/jpeg";

  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": ct,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
