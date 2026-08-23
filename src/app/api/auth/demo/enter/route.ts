import { NextResponse } from "next/server";
import { establishDemoSession } from "@/lib/auth/demo-enter";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { requestHostRedirectOrigin } from "@/lib/http/public-redirect-origin";

export const dynamic = "force-dynamic";

function safeNextPath(raw: string | null | undefined): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/dashboard";
  return raw;
}

async function enterDemo(req: Request, nextRaw: string | null): Promise<NextResponse> {
  const origin = requestHostRedirectOrigin(req);
  const next = safeNextPath(nextRaw);

  const ip = clientIp(req.headers);
  const rl = rateLimit(`demo_enter:${ip}`, 15, 15 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.redirect(new URL("/login?error=demo_rate_limited", origin), 303);
  }

  const result = await establishDemoSession(req);
  if (!result.ok) {
    return NextResponse.redirect(new URL(`/login?error=${result.error}`, origin), 303);
  }

  return NextResponse.redirect(new URL(next, origin), 303);
}

/** GET — สำหรับสแกน QR / ลิงก์ทดลองโมดูล (`?next=/dashboard/...`) */
export async function GET(req: Request) {
  const url = new URL(req.url);
  return enterDemo(req, url.searchParams.get("next"));
}

/**
 * เข้าบัญชีทดลอง — เก็บ JWT เดิมไว้ในคุกกี้ชั่วคราว (ถ้าไม่ใช่บัญชีทดลองอยู่แล้ว) แล้วล็อกอินเป็นบัญชี DEMO_ACCOUNT_*
 */
export async function POST(req: Request) {
  let nextRaw: string | null = null;
  const ct = req.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    try {
      const j = (await req.json()) as { next?: string };
      nextRaw = typeof j.next === "string" ? j.next : null;
    } catch {
      /* keep null */
    }
  } else {
    const fd = await req.formData().catch(() => null);
    if (fd && typeof fd.get("next") === "string") {
      nextRaw = String(fd.get("next"));
    }
  }
  return enterDemo(req, nextRaw);
}
