import { ensureAttendanceLocationsFromLegacy } from "@/lib/attendance/location-ensure";
import { prisma } from "@/lib/prisma";
import { getAttendanceDataScope } from "@/lib/trial/module-scopes";
import { getServerAppBaseUrl } from "@/lib/url/server-app-base-url";
import type { PublicCheckInLinkNotice } from "@/systems/attendance/components/PublicCheckInLinkCopy";

export type AttendancePublicLinksContext = {
  ownerSub: string;
  baseUrl: string;
  trialSessionId: string;
  isTrialSandbox: boolean;
  locations: { id: number; name: string }[];
  faceLinkNotice: PublicCheckInLinkNotice;
};

export async function loadAttendancePublicLinksContext(
  billingUserId: string,
): Promise<AttendancePublicLinksContext> {
  const scope = await getAttendanceDataScope(billingUserId);
  await ensureAttendanceLocationsFromLegacy(billingUserId, scope.trialSessionId);

  const [baseUrl, locations, faceSettings, faceEnrolledCount] = await Promise.all([
    getServerAppBaseUrl(),
    prisma.attendanceLocation.findMany({
      where: { ownerUserId: billingUserId, trialSessionId: scope.trialSessionId },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true },
    }),
    prisma.attendanceSettings.findUnique({
      where: {
        ownerUserId_trialSessionId: {
          ownerUserId: billingUserId,
          trialSessionId: scope.trialSessionId,
        },
      },
      select: { faceCheckInEnabled: true },
    }),
    prisma.attendanceRosterEntry.count({
      where: {
        ownerUserId: billingUserId,
        trialSessionId: scope.trialSessionId,
        isActive: true,
        faceDescriptorJson: { not: null },
      },
    }),
  ]);

  const faceCheckInEnabled = Boolean(faceSettings?.faceCheckInEnabled);
  const faceLinkNotice: PublicCheckInLinkNotice = !faceCheckInEnabled
    ? {
        text: "ยังไม่ได้เปิด «เช็คอินด้วยสแกนใบหน้า» — เปิดก่อน ลิงก์นี้จึงจะสแกนได้",
        href: "/dashboard/attendance/settings",
        hrefLabel: "เปิดในตั้งค่าเช็คอิน",
      }
    : faceEnrolledCount === 0
      ? {
          text: "เปิดใช้แล้ว แต่ยังไม่มีพนักงานลงทะเบียนใบหน้า — สแกนจะยังไม่ผ่าน",
          href: "/dashboard/attendance/roster",
          hrefLabel: "ไปลงทะเบียนใบหน้า",
        }
      : {
          tone: "info",
          text: `พร้อมใช้งาน — ลงทะเบียนใบหน้าแล้ว ${faceEnrolledCount.toLocaleString("th-TH")} คน`,
        };

  return {
    ownerSub: billingUserId,
    baseUrl,
    trialSessionId: scope.trialSessionId,
    isTrialSandbox: scope.isTrialSandbox,
    locations,
    faceLinkNotice,
  };
}
