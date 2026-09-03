import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { clubEventOwnerFromAuth } from "@/lib/club-event/api-owner";
import { clubEventOwnerWhere, clubEventSessionContext } from "@/lib/club-event/session-context";
import { prisma } from "@/lib/prisma";
import {
  composeClubEventMemberDisplayName,
  parseClubEventMemberImportFile,
} from "@/systems/club-event/lib/member-excel";

/** นำเข้าสมาชิกจากแบบฟอร์ม Excel / CSV */
export async function POST(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await clubEventOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;

    const { profile, scope } = await clubEventSessionContext(own.ownerId);

    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      return NextResponse.json({ error: "รูปแบบไม่ถูกต้อง" }, { status: 400 });
    }

    const file = form.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "ไม่มีไฟล์" }, { status: 400 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const parsed = parseClubEventMemberImportFile(buf, file.name || "members.xls");
    if (parsed.errors.length && parsed.rows.length === 0) {
      return NextResponse.json({ error: parsed.errors[0], errors: parsed.errors }, { status: 400 });
    }

    let created = 0;
    let updated = 0;
    const rowErrors = [...parsed.errors];

    for (const row of parsed.rows) {
      const name = composeClubEventMemberDisplayName(row.firstName, row.lastName);
      const data = {
        name,
        firstName: row.firstName,
        lastName: row.lastName,
        nickname: row.nickname,
        gender: row.gender,
        phone: row.phone,
        position: row.position,
        email: row.email,
        social: row.social,
        memberCode: row.memberCode,
        dataConsent: row.dataConsent,
        customFieldsJson: JSON.stringify(row.customFields),
        isActive: row.isActive,
      };

      let existing = null as Awaited<ReturnType<typeof prisma.clubEventMember.findFirst>>;
      if (row.memberCode) {
        existing = await prisma.clubEventMember.findFirst({
          where: {
            profileId: profile.id,
            ...clubEventOwnerWhere(own.ownerId, scope.trialSessionId),
            memberCode: row.memberCode,
          },
        });
      }
      if (!existing && row.phone) {
        existing = await prisma.clubEventMember.findFirst({
          where: {
            profileId: profile.id,
            ...clubEventOwnerWhere(own.ownerId, scope.trialSessionId),
            phone: row.phone,
          },
        });
      }

      if (existing) {
        await prisma.clubEventMember.update({
          where: { id: existing.id },
          data,
        });
        updated += 1;
      } else {
        await prisma.clubEventMember.create({
          data: {
            ownerUserId: own.ownerId,
            trialSessionId: scope.trialSessionId,
            profileId: profile.id,
            ...data,
          },
        });
        created += 1;
      }
    }

    return NextResponse.json({
      ok: true,
      created,
      updated,
      total: created + updated,
      errors: rowErrors,
    });
  } catch (e) {
    console.error("[club-event/session/members/import POST]", e);
    return NextResponse.json({ error: "นำเข้าไม่สำเร็จ" }, { status: 500 });
  }
}
