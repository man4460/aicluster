import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { barberOwnerFromAuth } from "@/lib/barber/api-owner";
import { parseBarberCashReceiptBasenameFromStored } from "@/lib/barber/receipt-display-url";
import { getBarberDataScope } from "@/lib/trial/module-scopes";

export const dynamic = "force-dynamic";

const EXT_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

type Ctx = { params: Promise<{ id: string }> };

function parseId(raw: string): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/**
 * เสิร์ฟสลิปขายแพ็กตามรหัสสมาชิก — ต้องล็อกอิน + เป็นเจ้าของข้อมูล
 * (กว่า `/uploads/...` ตรง ๆ เพราะบางโหมด deploy ไฟล์ใน public หลัง build ไม่ถูกเสิร์ฟ / หรือเคยพึ่ง API เก่าที่ 403)
 */
export async function GET(_req: Request, ctx: Ctx) {
  const auth = await requireSession();
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const own = await barberOwnerFromAuth(auth.session.sub);
  if (!own.ok) return own.response;
  const scope = await getBarberDataScope(own.ownerId);
  const id = parseId((await ctx.params).id);
  if (id === null) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });

  let sub = await prisma.barberCustomerSubscription.findFirst({
    where: { id, ownerUserId: own.ownerId, trialSessionId: scope.trialSessionId },
    select: { saleReceiptImageUrl: true },
  });
  if (!sub) {
    sub = await prisma.barberCustomerSubscription.findFirst({
      where: { id, ownerUserId: own.ownerId },
      select: { saleReceiptImageUrl: true },
    });
  }
  if (!sub) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });

  const basename = parseBarberCashReceiptBasenameFromStored(sub.saleReceiptImageUrl);
  if (!basename) return NextResponse.json({ error: "ไม่พบ" }, { status: 404 });

  const ext = basename.includes(".") ? (basename.split(".").pop()?.toLowerCase() ?? "") : "";
  const mime = EXT_MIME[ext];
  if (!mime) return NextResponse.json({ error: "ไม่รองรับชนิดไฟล์" }, { status: 400 });

  const dir = path.join(process.cwd(), "public", "uploads", "barber-cash-receipts");
  const fp = path.join(dir, basename);
  const resolvedDir = path.resolve(dir);
  const resolvedFile = path.resolve(fp);
  if (!resolvedFile.startsWith(resolvedDir + path.sep)) {
    return NextResponse.json({ error: "ไม่พบ" }, { status: 400 });
  }

  try {
    const buf = await readFile(resolvedFile);
    return new NextResponse(buf, {
      headers: {
        "Content-Type": mime,
        "Cache-Control": "private, max-age=120",
      },
    });
  } catch {
    return NextResponse.json({ error: "ไม่พบไฟล์" }, { status: 404 });
  }
}
