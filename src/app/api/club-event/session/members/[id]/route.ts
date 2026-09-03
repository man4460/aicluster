import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { clubEventOwnerFromAuth } from "@/lib/club-event/api-owner";
import { clubEventOwnerWhere, clubEventSessionContext } from "@/lib/club-event/session-context";
import { prisma } from "@/lib/prisma";
import {
  composeClubEventMemberDisplayName,
  normalizeClubEventMemberGender,
} from "@/systems/club-event/lib/member-excel";
import { mapClubEventMember } from "@/systems/club-event/lib/mappers";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await clubEventOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;

    const { id } = await ctx.params;
    const { scope } = await clubEventSessionContext(own.ownerId);
    const existing = await prisma.clubEventMember.findFirst({
      where: { id, ...clubEventOwnerWhere(own.ownerId, scope.trialSessionId) },
    });
    if (!existing) return NextResponse.json({ error: "ไม่พบสมาชิก" }, { status: 404 });

    const body = (await req.json()) as Record<string, unknown>;
    const firstName =
      typeof body.firstName === "string" ? body.firstName.trim().slice(0, 80) : existing.firstName;
    const lastName =
      typeof body.lastName === "string" ? body.lastName.trim().slice(0, 80) : existing.lastName;
    const name =
      composeClubEventMemberDisplayName(firstName, lastName) ||
      (typeof body.name === "string" ? body.name.trim().slice(0, 160) : existing.name);

    const row = await prisma.clubEventMember.update({
      where: { id },
      data: {
        name,
        firstName,
        lastName,
        nickname:
          typeof body.nickname === "string" ? body.nickname.trim().slice(0, 80) : existing.nickname,
        gender:
          body.gender !== undefined
            ? normalizeClubEventMemberGender(typeof body.gender === "string" ? body.gender : "")
            : existing.gender,
        phone:
          typeof body.phone === "string" ? body.phone.replace(/\D/g, "").slice(0, 32) : existing.phone,
        photoUrl:
          typeof body.photoUrl === "string"
            ? body.photoUrl.slice(0, 512)
            : body.photoUrl === null
              ? null
              : existing.photoUrl,
        position:
          typeof body.position === "string" ? body.position.trim().slice(0, 120) : existing.position,
        email: typeof body.email === "string" ? body.email.trim().slice(0, 200) : existing.email,
        social: typeof body.social === "string" ? body.social.trim().slice(0, 300) : existing.social,
        memberCode:
          typeof body.memberCode === "string"
            ? body.memberCode.trim().slice(0, 64)
            : existing.memberCode,
        dataConsent:
          typeof body.dataConsent === "boolean" ? body.dataConsent : existing.dataConsent,
        customFieldsJson:
          body.customFields !== undefined
            ? JSON.stringify(
                Array.isArray(body.customFields)
                  ? body.customFields
                      .filter(
                        (r): r is { key: string; label: string; value?: string } =>
                          typeof r === "object" &&
                          r !== null &&
                          typeof (r as { key?: unknown }).key === "string" &&
                          typeof (r as { label?: unknown }).label === "string",
                      )
                      .map((r, i) => ({
                        key: String(r.key || `custom_${i + 1}`).slice(0, 64),
                        label: String(r.label).trim().slice(0, 80),
                        value: String(r.value ?? "").slice(0, 500),
                      }))
                      .filter((r) => r.label.length > 0)
                  : [],
              )
            : existing.customFieldsJson,
        isActive: typeof body.isActive === "boolean" ? body.isActive : existing.isActive,
      },
    });

    return NextResponse.json({ member: mapClubEventMember(row) });
  } catch (e) {
    console.error("[club-event/session/members/[id] PATCH]", e);
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await clubEventOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;

    const { id } = await ctx.params;
    const { scope } = await clubEventSessionContext(own.ownerId);
    const existing = await prisma.clubEventMember.findFirst({
      where: { id, ...clubEventOwnerWhere(own.ownerId, scope.trialSessionId) },
      select: { id: true },
    });
    if (!existing) return NextResponse.json({ error: "ไม่พบสมาชิก" }, { status: 404 });

    await prisma.clubEventMember.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[club-event/session/members/[id] DELETE]", e);
    return NextResponse.json({ error: "ลบไม่สำเร็จ" }, { status: 500 });
  }
}
