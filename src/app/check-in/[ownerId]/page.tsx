import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isAttendancePublicOpenForOwner } from "@/lib/attendance/portal-access";
import { ensureAttendanceLocationsFromLegacy } from "@/lib/attendance/location-ensure";
import { AttendanceBusinessError, resolveAttendanceLocation } from "@/lib/attendance/service";
import { getBusinessProfile } from "@/lib/profile/business-profile";
import { prisma } from "@/lib/prisma";
import { AttendanceCheckClient } from "@/systems/attendance/components/AttendanceCheckClient";

type Props = {
  params: Promise<{ ownerId: string }>;
  searchParams: Promise<{ loc?: string }>;
};

export const metadata: Metadata = {
  title: "เช็คชื่อเข้างาน",
  robots: { index: false, follow: false },
};

export default async function PublicAttendancePage({ params, searchParams }: Props) {
  const { ownerId } = await params;
  if (!ownerId || ownerId.length < 10) notFound();

  const open = await isAttendancePublicOpenForOwner(ownerId);
  if (!open) notFound();

  const sp = await searchParams;
  const locRaw = sp.loc?.trim();
  const locNum =
    locRaw && /^\d+$/.test(locRaw) ? Math.min(Number.MAX_SAFE_INTEGER, Number(locRaw)) : null;

  await ensureAttendanceLocationsFromLegacy(ownerId);

  let site;
  try {
    site = await resolveAttendanceLocation(ownerId, locNum && locNum > 0 ? locNum : null);
  } catch (e) {
    if (e instanceof AttendanceBusinessError) {
      if (e.message === "NO_SETTINGS") {
        return (
          <div className="mx-auto max-w-md px-4 py-16 text-center text-sm text-slate-600">
            เจ้าของระบบยังไม่ตั้งค่าจุดเช็คอิน — ติดต่อผู้ดูแล
          </div>
        );
      }
      if (e.message === "BAD_LOCATION" || e.message === "NO_SHIFTS") notFound();
    }
    throw e;
  }

  const profile = await getBusinessProfile(ownerId);
  const orgName = profile?.name?.trim() || "องค์กร";

  const locRow =
    site.locationId > 0
      ? await prisma.attendanceLocation.findFirst({
          where: { id: site.locationId, ownerUserId: ownerId },
          select: { name: true },
        })
      : null;

  return (
    <AttendanceCheckClient
      mode="public"
      ownerId={ownerId}
      orgName={orgName}
      logoUrl={profile?.logoUrl ?? null}
      geofence={{
        lat: site.allowedLocationLat,
        lng: site.allowedLocationLng,
        radiusMeters: site.radiusMeters,
      }}
      publicLocationId={site.locationId > 0 ? site.locationId : null}
      locationLabel={locRow?.name ?? null}
    />
  );
}
