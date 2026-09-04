import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { findClubEventPublicProfile } from "@/lib/club-event/public-profile";

type Ctx = { params: Promise<{ slug: string }> };

/**
 * ค้นหาสมาชิกชมรมบนฟอร์มลิงก์สาธารณะ — ชื่อ / เบอร์ / รหัสสมาชิก
 * คืนข้อมูลจำกัดสำหรับกรอกฟอร์มอัตโนมัติเท่านั้น
 */
export async function GET(req: Request, ctx: Ctx) {
  try {
    const { slug } = await ctx.params;
    const url = new URL(req.url);
    const trialParam = url.searchParams.get("t");
    const q = (url.searchParams.get("q") ?? "").trim();
    if (q.length < 2) {
      return NextResponse.json({ error: "พิมพ์อย่างน้อย 2 ตัวอักษร" }, { status: 400 });
    }

    const profile = await findClubEventPublicProfile(slug, trialParam);
    if (!profile) {
      return NextResponse.json({ error: "ไม่พบชมรม" }, { status: 404 });
    }

    const digits = q.replace(/\D/g, "");
    const members = await prisma.clubEventMember.findMany({
      where: {
        profileId: profile.id,
        isActive: true,
        OR: [
          { name: { contains: q } },
          { firstName: { contains: q } },
          { lastName: { contains: q } },
          { nickname: { contains: q } },
          { memberCode: { contains: q } },
          ...(digits.length >= 3 ? [{ phone: { contains: digits } }] : []),
        ],
      },
      select: {
        id: true,
        name: true,
        phone: true,
        memberCode: true,
        firstName: true,
        lastName: true,
      },
      take: 8,
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      members: members.map((m) => ({
        id: m.id,
        name: m.name || `${m.firstName} ${m.lastName}`.trim(),
        phone: m.phone,
        memberCode: m.memberCode,
      })),
    });
  } catch (e) {
    console.error("[club-event/public members lookup]", e);
    return NextResponse.json({ error: "ค้นหาไม่สำเร็จ" }, { status: 500 });
  }
}
