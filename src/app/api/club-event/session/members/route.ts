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

function pickMemberBody(body: Record<string, unknown>, existing?: {
  firstName: string;
  lastName: string;
  nickname: string;
  gender: string;
  phone: string;
  photoUrl: string | null;
  position: string;
  email: string;
  social: string;
  memberCode: string;
  dataConsent: boolean;
  customFieldsJson: string;
  isActive: boolean;
  name: string;
}) {
  const firstName =
    typeof body.firstName === "string"
      ? body.firstName.trim().slice(0, 80)
      : existing?.firstName ?? "";
  const lastName =
    typeof body.lastName === "string"
      ? body.lastName.trim().slice(0, 80)
      : existing?.lastName ?? "";
  const nameFromParts = composeClubEventMemberDisplayName(firstName, lastName);
  const name =
    nameFromParts ||
    (typeof body.name === "string" ? body.name.trim().slice(0, 160) : existing?.name ?? "");

  return {
    name,
    firstName: firstName || (name ? name.split(/\s+/)[0]!.slice(0, 80) : ""),
    lastName:
      lastName ||
      (name.includes(" ") ? name.split(/\s+/).slice(1).join(" ").slice(0, 80) : ""),
    nickname:
      typeof body.nickname === "string" ? body.nickname.trim().slice(0, 80) : existing?.nickname ?? "",
    gender:
      body.gender !== undefined
        ? normalizeClubEventMemberGender(typeof body.gender === "string" ? body.gender : "")
        : existing?.gender ?? "",
    phone: typeof body.phone === "string" ? body.phone.replace(/\D/g, "").slice(0, 32) : existing?.phone ?? "",
    photoUrl:
      typeof body.photoUrl === "string"
        ? body.photoUrl.slice(0, 512)
        : body.photoUrl === null
          ? null
          : existing?.photoUrl ?? null,
    position:
      typeof body.position === "string" ? body.position.trim().slice(0, 120) : existing?.position ?? "",
    email: typeof body.email === "string" ? body.email.trim().slice(0, 200) : existing?.email ?? "",
    social: typeof body.social === "string" ? body.social.trim().slice(0, 300) : existing?.social ?? "",
    memberCode:
      typeof body.memberCode === "string" ? body.memberCode.trim().slice(0, 64) : existing?.memberCode ?? "",
    dataConsent:
      typeof body.dataConsent === "boolean" ? body.dataConsent : existing?.dataConsent ?? false,
    customFieldsJson:
      body.customFields !== undefined
        ? JSON.stringify(
            Array.isArray(body.customFields)
              ? body.customFields
                  .filter(
                    (row): row is { key: string; label: string; value: string } =>
                      typeof row === "object" &&
                      row !== null &&
                      typeof (row as { key?: unknown }).key === "string" &&
                      typeof (row as { label?: unknown }).label === "string",
                  )
                  .map((row, i) => ({
                    key: String(row.key || `custom_${i + 1}`).slice(0, 64),
                    label: String(row.label).trim().slice(0, 80),
                    value: String((row as { value?: unknown }).value ?? "").slice(0, 500),
                  }))
                  .filter((r) => r.label.length > 0)
              : [],
          )
        : existing?.customFieldsJson ?? "[]",
    isActive: typeof body.isActive === "boolean" ? body.isActive : existing?.isActive ?? true,
  };
}

export async function GET() {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await clubEventOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;

    const { profile, scope } = await clubEventSessionContext(own.ownerId);
    const rows = await prisma.clubEventMember.findMany({
      where: { profileId: profile.id, ...clubEventOwnerWhere(own.ownerId, scope.trialSessionId) },
      orderBy: [{ memberCode: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({
      members: rows.map(mapClubEventMember),
    });
  } catch (e) {
    console.error("[club-event/session/members GET]", e);
    return NextResponse.json({ error: "โหลดไม่สำเร็จ" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await clubEventOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;

    const { profile, scope } = await clubEventSessionContext(own.ownerId);
    const body = (await req.json()) as Record<string, unknown>;
    const data = pickMemberBody(body);
    if (!data.firstName && !data.name) {
      return NextResponse.json({ error: "กรอกชื่อสมาชิก" }, { status: 400 });
    }

    const row = await prisma.clubEventMember.create({
      data: {
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        profileId: profile.id,
        ...data,
      },
    });

    return NextResponse.json({ member: mapClubEventMember(row) });
  } catch (e) {
    console.error("[club-event/session/members POST]", e);
    return NextResponse.json({ error: "สร้างไม่สำเร็จ" }, { status: 500 });
  }
}
