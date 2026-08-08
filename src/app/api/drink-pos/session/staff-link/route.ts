import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { getModuleBillingContext } from "@/lib/modules/billing-context";
import { STAFF_LINK_PERMANENT_SESSION_ID } from "@/lib/modules/permanent-staff-link";
import { decryptStaffTokenFromStorage, encryptStaffTokenForStorage } from "@/lib/building-pos/staff-token-cipher";
import { generatePlainStaffToken, hashStaffToken } from "@/lib/building-pos/staff-token";
import { buildStaffPortalUrl } from "@/lib/url/staff-link-origin";

export async function GET(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const ctx = await getModuleBillingContext(auth.session.sub);
    if (!ctx || ctx.isStaff) return NextResponse.json({ error: "เฉพาะเจ้าขององค์กร" }, { status: 403 });
    const ownerId = ctx.billingUserId;
    let row = await prisma.drinkPosStaffLink.findUnique({
      where: {
        ownerUserId_trialSessionId: {
          ownerUserId: ownerId,
          trialSessionId: STAFF_LINK_PERMANENT_SESSION_ID,
        },
      },
      select: { id: true, tokenCipher: true, tokenHash: true },
    });
    // ลิงก์เก่าที่ผูก trial — ย้ายมา prod ครั้งแรกที่โหลด
    if (!row) {
      const legacy = await prisma.drinkPosStaffLink.findFirst({
        where: { ownerUserId: ownerId, NOT: { trialSessionId: STAFF_LINK_PERMANENT_SESSION_ID } },
        orderBy: { updatedAt: "desc" },
        select: { tokenCipher: true, tokenHash: true },
      });
      if (legacy?.tokenHash) {
        row = await prisma.drinkPosStaffLink.upsert({
          where: {
            ownerUserId_trialSessionId: {
              ownerUserId: ownerId,
              trialSessionId: STAFF_LINK_PERMANENT_SESSION_ID,
            },
          },
          create: {
            ownerUserId: ownerId,
            trialSessionId: STAFF_LINK_PERMANENT_SESSION_ID,
            tokenHash: legacy.tokenHash,
            tokenCipher: legacy.tokenCipher,
          },
          update: {
            tokenHash: legacy.tokenHash,
            tokenCipher: legacy.tokenCipher,
          },
          select: { id: true, tokenCipher: true, tokenHash: true },
        });
      }
    }
    if (!row) {
      return NextResponse.json({ configured: false as const, url: null as string | null });
    }
    let url: string | null = null;
    if (row.tokenCipher?.trim()) {
      try {
        const plain = decryptStaffTokenFromStorage(row.tokenCipher.trim());
        if (plain) {
          url = buildStaffPortalUrl({
            req,
            pathPrefix: "/drink-pos/staff",
            ownerId,
            plainToken: plain,
          });
        }
      } catch {
        /* cipher ไม่พร้อม */
      }
    }
    return NextResponse.json({ configured: true as const, url });
  } catch (e) {
    console.error("[drink-pos/session/staff-link GET]", e);
    return NextResponse.json({ error: "โหลดลิงก์ไม่สำเร็จ" }, { status: 503 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const ctx = await getModuleBillingContext(auth.session.sub);
    if (!ctx || ctx.isStaff) return NextResponse.json({ error: "เฉพาะเจ้าขององค์กร" }, { status: 403 });
    const ownerId = ctx.billingUserId;
    const plain = generatePlainStaffToken();
    const tokenHash = hashStaffToken(plain);
    let tokenCipher: string;
    try {
      tokenCipher = encryptStaffTokenForStorage(plain);
    } catch (err) {
      console.error("[drink-pos/session/staff-link POST] cipher", err);
      return NextResponse.json(
        { error: "ตั้ง AUTH_SECRET ใน .env ให้ยาวอย่างน้อย 16 ตัวอักษร — ใช้เข้ารหัสลิงก์พนักงาน" },
        { status: 500 },
      );
    }
    await prisma.drinkPosStaffLink.upsert({
      where: {
        ownerUserId_trialSessionId: {
          ownerUserId: ownerId,
          trialSessionId: STAFF_LINK_PERMANENT_SESSION_ID,
        },
      },
      create: {
        ownerUserId: ownerId,
        trialSessionId: STAFF_LINK_PERMANENT_SESSION_ID,
        tokenHash,
        tokenCipher,
      },
      update: { tokenHash, tokenCipher },
    });
    const url = buildStaffPortalUrl({
      req,
      pathPrefix: "/drink-pos/staff",
      ownerId,
      plainToken: plain,
    });
    return NextResponse.json({ url });
  } catch (e) {
    console.error("[drink-pos/session/staff-link POST]", e);
    return NextResponse.json({ error: "สร้างลิงก์ไม่สำเร็จ" }, { status: 503 });
  }
}
