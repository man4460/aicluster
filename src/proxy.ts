import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isEcommercePlatformHost, normalizeEcommerceHostname } from "@/lib/ecommerce/custom-domain";

/** Custom domain → rewrite ไปหน้าร้อง `/shop/[storeId]` (Next.js 16: proxy แทน middleware) */
export async function proxy(request: NextRequest) {
  const host = normalizeEcommerceHostname(request.headers.get("host"));
  if (!host || isEcommercePlatformHost(host)) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/landing") ||
    pathname.startsWith("/uploads/") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/shop/")) {
    return NextResponse.next();
  }

  const resolveUrl = new URL("/api/ecommerce-store/resolve-domain", request.url);
  resolveUrl.searchParams.set("host", host);

  try {
    const res = await fetch(resolveUrl.toString(), {
      headers: { "x-ec-resolve": "1" },
      cache: "no-store",
    });
    if (!res.ok) return NextResponse.next();
    const data = (await res.json()) as { storeId?: string | null };
    const storeId = data.storeId?.trim();
    if (!storeId) return NextResponse.next();

    const url = request.nextUrl.clone();
    const suffix = pathname === "/" ? "" : pathname;
    url.pathname = `/shop/${storeId}${suffix}`;
    return NextResponse.rewrite(url);
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads/).*)"],
};
