import { unlink } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";

const UPLOAD_PREFIX = "/uploads/attendance-faces/";

function filePathFromPublicUrl(url: string): string | null {
  const u = url.trim();
  if (!u.startsWith(UPLOAD_PREFIX)) return null;
  const rest = u.slice(UPLOAD_PREFIX.length);
  if (!rest || rest.includes("..") || rest.includes("/") || rest.includes("\\")) return null;
  return path.join(process.cwd(), "public", "uploads", "attendance-faces", rest);
}

/** ลบไฟล์รูป + เคลียร์ URL ในฐานข้อมูลสำหรับบันทึกที่ check-in เก่ากว่า retention เดือน */
export async function pruneAttendanceFacePhotosOlderThanMonths(months: number): Promise<{
  rowsUpdated: number;
  filesRemoved: number;
  fileErrors: number;
}> {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);

  const rows = await prisma.attendanceLog.findMany({
    where: {
      checkInFacePhotoUrl: { not: null },
      checkInTime: { lt: cutoff },
    },
    select: { id: true, checkInFacePhotoUrl: true },
  });

  let filesRemoved = 0;
  let fileErrors = 0;

  for (const row of rows) {
    const url = row.checkInFacePhotoUrl;
    if (!url) continue;
    const fp = filePathFromPublicUrl(url);
    if (fp) {
      try {
        await unlink(fp);
        filesRemoved += 1;
      } catch {
        fileErrors += 1;
      }
    }
  }

  const ids = rows.map((r) => r.id);
  let rowsUpdated = 0;
  if (ids.length > 0) {
    const res = await prisma.attendanceLog.updateMany({
      where: { id: { in: ids } },
      data: { checkInFacePhotoUrl: null },
    });
    rowsUpdated = res.count;
  }

  return { rowsUpdated, filesRemoved, fileErrors };
}
