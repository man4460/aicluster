import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { findClubEventPublicProfile } from "@/lib/club-event/public-profile";
import {
  memberCustomFieldsMatchQuery,
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

    const rows = await prisma.clubEventMember.findMany({
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
          ...(fields.customFields ? [{ customFieldsJson: { contains: q } }] : []),
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
        customFieldsJson: true,
      },
      take: 40,
      orderBy: { name: "asc" },
    });

    const members = rows
      .filter((m) => {
        if (!fields.customFields) return true;
        // ถ้าตรงชื่อ/รหัสอยู่แล้ว เก็บไว้; ถ้ามาจาก JSON contains อาจเป็น false positive — ยืนยันอีกชั้น
        const baseHit =
          m.name.includes(q) ||
          m.firstName.includes(q) ||
          m.lastName.includes(q) ||
          m.nickname.includes(q) ||
          m.memberCode.includes(q) ||
          m.position.includes(q) ||
          (digits.length >= 3 && m.phone.includes(digits));
        if (baseHit) return true;
        return memberCustomFieldsMatchQuery(m.customFieldsJson, q);
      })
      .slice(0, 24)
      .map((m) => projectPublicMember(m, fields));

    return NextResponse.json({
      fields,
      members,
    });
  } catch (e) {
    console.error("[club-event/public members search]", e);
    return NextResponse.json({ error: "ค้นหาไม่สำเร็จ" }, { status: 500 });
  }
}
