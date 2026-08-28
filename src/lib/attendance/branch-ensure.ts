import { prisma } from "@/lib/prisma";

export const ATTENDANCE_DEFAULT_BRANCH_CODE = "MAIN";
export const ATTENDANCE_DEFAULT_BRANCH_NAME = "สาขาหลัก";

/** รหัสสาขา — A-Z 0-9 _ - สูงสุด 20 ตัว */
export function normalizeAttendanceBranchCode(raw: string): string {
  const t = raw.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
  return (t || ATTENDANCE_DEFAULT_BRANCH_CODE).slice(0, 20);
}

/** สร้างสาขาหลักถ้ายังไม่มี — คืน id สาขาแรก (sort_order) */
export async function ensureAttendanceBranchesFromLegacy(
  ownerUserId: string,
  trialSessionId: string,
): Promise<{ id: number }> {
  let branch = await prisma.attendanceBranch.findFirst({
    where: { ownerUserId, trialSessionId },
    orderBy: { sortOrder: "asc" },
    select: { id: true },
  });

  if (!branch) {
    branch = await prisma.attendanceBranch.create({
      data: {
        ownerUserId,
        trialSessionId,
        name: ATTENDANCE_DEFAULT_BRANCH_NAME,
        code: ATTENDANCE_DEFAULT_BRANCH_CODE,
        sortOrder: 0,
      },
      select: { id: true },
    });
  }

  return branch;
}
