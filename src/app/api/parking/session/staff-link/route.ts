import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { getModuleBillingContext } from "@/lib/modules/billing-context";
import { STAFF_LINK_PERMANENT_SESSION_ID } from "@/lib/modules/permanent-staff-link";
import { decryptStaffTokenFromStorage, encryptStaffTokenForStorage } from "@/lib/building-pos/staff-token-cipher";
import { generatePlainStaffToken, hashStaffToken } from "@/lib/building-pos/staff-token";
import { buildStaffPortalUrl } from "@/lib/url/staff-link-origin";
import { PARKING_MODULE_SLUG } from "@/lib/modules/config";

export async function GET(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const ctx = await getModuleBillingContext(auth.session.sub);
    if (!ctx || ctx.isStaff) return NextResponse.json({ error: "เฉพาะเจ้าของร้าน" }, { status: 403 });
    const ownerId = ctx.billingUserId;
    const row = await prisma.parkingStaffLink.findUnique({
      where: {
        ownerUserId_trialSessionId: {
          ownerUserId: ownerId,
          trialSessionId: STAFF_LINK_PERMANENT_SESSION_ID,
        },
      },
      select: { tokenCipher: true },
    });
    if (!row) return NextResponse.json({ configured: false, url: null });
    let url: string | null = null;
    if (row.tokenCipher?.trim()) {
      try {
        const plain = decryptStaffTokenFromStorage(row.tokenCipher.trim());
        if (plain) {
          url = buildStaffPortalUrl({ req, pathPrefix: "/parking/staff", ownerId, plainToken: plain });
        }
      } catch {
        // The owner can rotate a link whose cipher can no longer be decrypted.
      }
    }
    return NextResponse.json({ configured: true, url, module: PARKING_MODULE_SLUG });
  } catch (error) {
    console.error("[parking/session/staff-link GET]", error);
    return NextResponse.json({ error: "โหลดลิงก์ไม่สำเร็จ" }, { status: 503 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const ctx = await getModuleBillingContext(auth.session.sub);
    if (!ctx || ctx.isStaff) return NextResponse.json({ error: "เฉพาะเจ้าของร้าน" }, { status: 403 });
    const ownerId = ctx.billingUserId;
    const plain = generatePlainStaffToken();
    let tokenCipher: string;
    try {
      tokenCipher = encryptStaffTokenForStorage(plain);
    } catch {
      return NextResponse.json(
        { error: "ตั้ง AUTH_SECRET ใน .env ให้ยาวอย่างน้อย 16 ตัวอักษร" },
        { status: 500 },
      );
    }
    await prisma.parkingStaffLink.upsert({
      where: {
        ownerUserId_trialSessionId: {
          ownerUserId: ownerId,
          trialSessionId: STAFF_LINK_PERMANENT_SESSION_ID,
        },
      },
      create: {
        ownerUserId: ownerId,
        trialSessionId: STAFF_LINK_PERMANENT_SESSION_ID,
        tokenHash: hashStaffToken(plain),
        tokenCipher,
      },
      update: { tokenHash: hashStaffToken(plain), tokenCipher },
    });
    const url = buildStaffPortalUrl({ req, pathPrefix: "/parking/staff", ownerId, plainToken: plain });
    return NextResponse.json({ url });
  } catch (error) {
    console.error("[parking/session/staff-link POST]", error);
    return NextResponse.json({ error: "สร้างลิงก์ไม่สำเร็จ" }, { status: 503 });
  }
}
