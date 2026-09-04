import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { findClubEventPublicProfile } from "@/lib/club-event/public-profile";
import {
  parsePortalMemberFieldsJson,
  projectPublicMember,
} from "@/systems/club-event/lib/portal-member-fields";

type Ctx = { params: Promise<{ slug: string }> };

/**
 * ค้นหาสมาชิกบนเว็บสาธารณะ — เฉพาะเมื่อเปิด portalShowMembers
 * คืนเฉพาะฟิลด์ที่ตั้งค่าเปิดเผย (ชื่อเต็มเปิดเสมอ)
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
    if (!profile.portalShowMembers) {
      return NextResponse.json({ error: "ไม่ได้เปิดค้นหาสมาชิกบนเว็บ" }, { status: 403 });
    }

    const fields = parsePortalMemberFieldsJson(profile.portalMemberFieldsJson);
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
          { position: { contains: q } },
          ...(digits.length >= 3 ? [{ phone: { contains: digits } }] : []),
        ],
      },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        nickname: true,
        gender: true,
        phone: true,
        photoUrl: true,
        position: true,
        email: true,
        social: true,
        memberCode: true,
      },
      take: 24,
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      fields,
      members: members.map((m) => projectPublicMember(m, fields)),
    });
  } catch (e) {
    console.error("[club-event/public members search]", e);
    return NextResponse.json({ error: "ค้นหาไม่สำเร็จ" }, { status: 500 });
  }
}
