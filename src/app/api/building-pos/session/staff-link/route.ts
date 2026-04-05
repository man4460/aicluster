import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { buildingPosOwnerFromAuth } from "@/lib/building-pos/api-owner";
import { formatBuildingPosDbError, jsonBuildingPosError } from "@/lib/building-pos/route-errors";
import { decryptStaffTokenFromStorage, encryptStaffTokenForStorage } from "@/lib/building-pos/staff-token-cipher";
import { generatePlainStaffToken, hashStaffToken } from "@/lib/building-pos/staff-token";
import { getBuildingPosDataScope } from "@/lib/trial/module-scopes";

function absoluteOrigin(req: Request): string {
  const env = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (env && (env.startsWith("http://") || env.startsWith("https://"))) return env;
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!host) return "";
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

export async function GET(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await buildingPosOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const scope = await getBuildingPosDataScope(own.ownerId);
    const row = await prisma.buildingPosStaffLink.findUnique({
      where: {
        ownerUserId_trialSessionId: { ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
      },
      select: { id: true, tokenCipher: true },
    });
    if (!row) {
      return NextResponse.json({ configured: false as const, url: null as string | null });
    }
    let url: string | null = null;
    if (row.tokenCipher?.trim()) {
      try {
        const plain = decryptStaffTokenFromStorage(row.tokenCipher.trim());
        if (plain) {
          const origin = absoluteOrigin(req);
          const qs = new URLSearchParams({ t: scope.trialSessionId, k: plain });
          const path = `/building-pos/staff/${encodeURIComponent(own.ownerId)}?${qs.toString()}`;
          url = origin ? `${origin}${path}` : path;
        }
      } catch {
        /* cipher ไม่พร้อม (เช่น ไม่มี AUTH_SECRET) — ไม่ส่ง url */
      }
    }
    return NextResponse.json({ configured: true as const, url });
  } catch (e) {
    console.error("[building-pos/session/staff-link GET]", e);
    return jsonBuildingPosError(formatBuildingPosDbError(e), e, 503);
  }
}

/** สร้างหรือหมุนโทเค็น — ส่งกลับ URL + โทเค็นแบบ plain ครั้งเดียว */
export async function POST(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await buildingPosOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const scope = await getBuildingPosDataScope(own.ownerId);
    const plain = generatePlainStaffToken();
    const tokenHash = hashStaffToken(plain);
    let tokenCipher: string;
    try {
      tokenCipher = encryptStaffTokenForStorage(plain);
    } catch (err) {
      console.error("[building-pos/session/staff-link POST] cipher", err);
      return NextResponse.json(
        { error: "ตั้ง AUTH_SECRET ใน .env ให้ยาวอย่างน้อย 16 ตัวอักษร — ใช้เข้ารหัสลิงก์พนักงาน" },
        { status: 500 },
      );
    }
    await prisma.buildingPosStaffLink.upsert({
      where: {
        ownerUserId_trialSessionId: { ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
      },
      create: {
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        tokenHash,
        tokenCipher,
      },
      update: { tokenHash, tokenCipher },
    });
    const origin = absoluteOrigin(req);
    const qs = new URLSearchParams({
      t: scope.trialSessionId,
      k: plain,
    });
    const path = `/building-pos/staff/${encodeURIComponent(own.ownerId)}?${qs.toString()}`;
    const url = origin ? `${origin}${path}` : path;
    return NextResponse.json({ url });
  } catch (e) {
    console.error("[building-pos/session/staff-link POST]", e);
    return jsonBuildingPosError(formatBuildingPosDbError(e), e, 503);
  }
}
