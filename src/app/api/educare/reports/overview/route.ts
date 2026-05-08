import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { bangkokYmd, ymdToDateUTC } from "@/systems/educare/lib/educare-data";
import { withEducareOwnerContext } from "@/systems/educare/lib/educare-api";

const querySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  classroomId: z.coerce.number().int().positive().optional(),
});

export async function GET(req: Request) {
  const r = await withEducareOwnerContext();
  if (!r.ok) return r.res;

  const url = new URL(req.url);
  const parsed = querySchema.safeParse({
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined,
    classroomId: url.searchParams.get("classroomId") ?? undefined,
  });
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });

  const today = bangkokYmd();
  const to = parsed.data.to ?? today;
  const fromDate = parsed.data.from
    ? parsed.data.from
    : (() => {
        const d = ymdToDateUTC(today);
        d.setUTCDate(d.getUTCDate() - 29);
        return bangkokYmd(d);
      })();

  const records = await prisma.educareCheckRecord.findMany({
    where: {
      ownerUserId: r.ctx.ownerUserId,
      trialSessionId: r.ctx.trialSessionId,
      date: { gte: ymdToDateUTC(fromDate), lte: ymdToDateUTC(to) },
      ...(parsed.data.classroomId ? { classroomId: parsed.data.classroomId } : {}),
    },
    select: {
      date: true,
      feature: true,
      status: true,
      classroomId: true,
      studentId: true,
    },
  });

  const byFeature: Record<string, Record<string, number>> = {};
  const byDate: Record<string, { present: number; absent: number; late: number; excused: number }> = {};

  for (const rec of records) {
    if (!byFeature[rec.feature]) byFeature[rec.feature] = {};
    byFeature[rec.feature][rec.status] = (byFeature[rec.feature][rec.status] ?? 0) + 1;

    if (rec.feature === "ASSEMBLY") {
      const ymd = bangkokYmd(rec.date);
      if (!byDate[ymd]) byDate[ymd] = { present: 0, absent: 0, late: 0, excused: 0 };
      if (rec.status === "PRESENT") byDate[ymd].present++;
      else if (rec.status === "ABSENT") byDate[ymd].absent++;
      else if (rec.status === "LATE") byDate[ymd].late++;
      else if (rec.status === "EXCUSED") byDate[ymd].excused++;
    }
  }

  const totalRecords = records.length;
  return NextResponse.json({
    range: { from: fromDate, to },
    totalRecords,
    byFeature,
    byDate: Object.keys(byDate)
      .sort()
      .map((d) => ({ date: d, ...byDate[d] })),
  });
}
