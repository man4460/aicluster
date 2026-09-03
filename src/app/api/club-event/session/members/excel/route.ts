import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { clubEventOwnerFromAuth } from "@/lib/club-event/api-owner";
import { clubEventOwnerWhere, clubEventSessionContext } from "@/lib/club-event/session-context";
import { prisma } from "@/lib/prisma";
import {
  buildClubEventMemberExportXls,
  buildClubEventMemberImportTemplateXls,
} from "@/systems/club-event/lib/member-excel";
import { mapClubEventMember } from "@/systems/club-event/lib/mappers";

/** ดาวน์โหลดแบบฟอร์มว่าง หรือส่งออกสมาชิกปัจจุบัน (?mode=export) */
export async function GET(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await clubEventOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;

    const { profile, scope } = await clubEventSessionContext(own.ownerId);
    const url = new URL(req.url);
    const mode = url.searchParams.get("mode");

    if (mode === "export") {
      const rows = await prisma.clubEventMember.findMany({
        where: { profileId: profile.id, ...clubEventOwnerWhere(own.ownerId, scope.trialSessionId) },
        orderBy: [{ memberCode: "asc" }, { name: "asc" }],
      });
      const members = rows.map(mapClubEventMember);
      const body = buildClubEventMemberExportXls(members);
      return new NextResponse(body, {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.ms-excel; charset=utf-8",
          "Content-Disposition": 'attachment; filename="club-event-members.xls"',
        },
      });
    }

    const existing = await prisma.clubEventMember.findMany({
      where: { profileId: profile.id, ...clubEventOwnerWhere(own.ownerId, scope.trialSessionId) },
      select: { customFieldsJson: true },
      take: 200,
    });
    const labels = new Set<string>();
    for (const row of existing) {
      try {
        const parsed = JSON.parse(row.customFieldsJson) as Array<{ label?: string }>;
        if (Array.isArray(parsed)) {
          for (const cf of parsed) {
            if (typeof cf?.label === "string" && cf.label.trim()) labels.add(cf.label.trim());
          }
        }
      } catch {
        /* ignore */
      }
    }

    const body = buildClubEventMemberImportTemplateXls([...labels]);
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.ms-excel; charset=utf-8",
        "Content-Disposition": 'attachment; filename="club-event-members-template.xls"',
      },
    });
  } catch (e) {
    console.error("[club-event/session/members/excel GET]", e);
    return NextResponse.json({ error: "ดาวน์โหลดไม่สำเร็จ" }, { status: 500 });
  }
}
