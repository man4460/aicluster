import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { smartGuardTourOwnerFromAuth } from "@/lib/smart-guard-tour/api-owner";
import { smartGuardTourSessionContext } from "@/lib/smart-guard-tour/session-context";
import { bangkokDateKey } from "@/lib/time/bangkok";
import {
  bangkokWeekMonday,
  bangkokWeekSunday,
  rollupWeekWages,
} from "@/systems/smart-guard-tour/lib/wage-engine";
import { ensureSmartGuardDutyTemplates, recomputeSmartGuardWorkSpanForPostDuty } from "@/systems/smart-guard-tour/lib/work-span";

export async function GET(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await smartGuardTourOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const { shop, scope } = await smartGuardTourSessionContext(own.ownerId);
    await ensureSmartGuardDutyTemplates(prisma, shop.id, own.ownerId, scope.trialSessionId);

    const url = new URL(req.url);
    const dutyOn = url.searchParams.get("dutyOn")?.trim() || bangkokDateKey();
    const weekAnchor = url.searchParams.get("week")?.trim() || dutyOn;

    const [posts, templates, duties, tourAssignments, schedules, staff, workSpans] =
      await Promise.all([
        prisma.smartGuardPost.findMany({
          where: { shopId: shop.id, isActive: true },
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        }),
        prisma.smartGuardDutyTemplate.findMany({
          where: { shopId: shop.id, isActive: true },
          orderBy: [{ sortOrder: "asc" }],
        }),
        prisma.smartGuardPostDuty.findMany({
          where: { shopId: shop.id, dutyOn },
          include: {
            post: { select: { id: true, name: true, code: true } },
            staff: { select: { id: true, displayName: true, phone: true, photoUrl: true } },
            template: { select: { id: true, name: true, startHm: true, endHm: true } },
            tourAssignments: {
              include: { schedule: { select: { id: true, name: true } } },
            },
          },
          orderBy: [{ createdAt: "asc" }],
        }),
        prisma.smartGuardTourAssignment.findMany({
          where: { shopId: shop.id, dutyOn },
          include: {
            schedule: { select: { id: true, name: true } },
            staff: { select: { id: true, displayName: true } },
            postDuty: { select: { id: true, postId: true } },
          },
        }),
        prisma.smartGuardSchedule.findMany({
          where: { shopId: shop.id, isActive: true },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        }),
        prisma.smartGuardStaff.findMany({
          where: { shopId: shop.id, isActive: true },
          select: {
            id: true,
            displayName: true,
            phone: true,
            photoUrl: true,
            hourlyRateBaht: true,
          },
          orderBy: { displayName: "asc" },
        }),
        prisma.smartGuardWorkSpan.findMany({
          where: {
            shopId: shop.id,
            workOn: {
              gte: bangkokWeekMonday(weekAnchor),
              lte: bangkokWeekSunday(bangkokWeekMonday(weekAnchor)),
            },
          },
          select: {
            staffId: true,
            workOn: true,
            normalMinutes: true,
            otMinutes: true,
            totalBaht: true,
            flagsJson: true,
          },
        }),
      ]);

    const weekStart = bangkokWeekMonday(weekAnchor);
    const byStaff = new Map<string, typeof workSpans>();
    for (const w of workSpans) {
      const list = byStaff.get(w.staffId) ?? [];
      list.push(w);
      byStaff.set(w.staffId, list);
    }
    const weekWarnings = staff.map((s) => {
      const days = byStaff.get(s.id) ?? [];
      const roll = rollupWeekWages(
        days.map((d) => ({
          workOn: d.workOn,
          normalMinutes: d.normalMinutes,
          otMinutes: d.otMinutes,
          totalBaht: d.totalBaht,
        })),
        { weeklyNormalCapMinutes: shop.weeklyNormalCapMinutes },
        weekAnchor,
      );
      return {
        staffId: s.id,
        displayName: s.displayName,
        ...roll,
      };
    });

    return NextResponse.json({
      dutyOn,
      weekStart,
      weekEnd: bangkokWeekSunday(weekStart),
      posts: posts.map((p) => ({
        id: p.id,
        name: p.name,
        code: p.code,
        zoneLabel: p.zoneLabel,
        buildingLabel: p.buildingLabel,
        requiredStaffPerShift: p.requiredStaffPerShift,
      })),
      templates: templates.map((t) => ({
        id: t.id,
        name: t.name,
        startHm: t.startHm,
        endHm: t.endHm,
        plannedMinutes: t.plannedMinutes,
        normalCapMinutes: t.normalCapMinutes,
        roleMask: t.roleMask,
      })),
      schedules,
      staff,
      duties: duties.map((d) => ({
        id: d.id,
        dutyOn: d.dutyOn,
        status: d.status,
        post: d.post,
        staff: d.staff,
        template: d.template,
        tourAssignments: d.tourAssignments.map((a) => ({
          id: a.id,
          scheduleId: a.schedule.id,
          scheduleName: a.schedule.name,
        })),
      })),
      tourAssignments: tourAssignments.map((a) => ({
        id: a.id,
        scheduleId: a.schedule.id,
        scheduleName: a.schedule.name,
        staffId: a.staff.id,
        staffName: a.staff.displayName,
        postDutyId: a.postDutyId,
      })),
      weekWarnings,
      wageRules: {
        dailyNormalCapMinutes: shop.dailyNormalCapMinutes,
        weeklyNormalCapMinutes: shop.weeklyNormalCapMinutes,
        otMultiplier: Number(shop.otMultiplier),
        holidayMultiplier: Number(shop.holidayMultiplier),
        holidayOtMultiplier: Number(shop.holidayOtMultiplier),
        overtimeMode: "WARN" as const,
      },
    });
  } catch (e) {
    console.error("[smart-guard-tour/duties GET]", e);
    return NextResponse.json({ error: "โหลดไม่สำเร็จ" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await smartGuardTourOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    if (own.isStaff) return NextResponse.json({ error: "เฉพาะเจ้าของ" }, { status: 403 });
    const { shop, scope } = await smartGuardTourSessionContext(own.ownerId);
    const body = (await req.json()) as Record<string, unknown>;
    const kind = body.kind === "tour" ? "tour" : "post";

    if (kind === "post") {
      const dutyOn = typeof body.dutyOn === "string" ? body.dutyOn.trim() : bangkokDateKey();
      const postId = typeof body.postId === "string" ? body.postId : "";
      const staffId = typeof body.staffId === "string" ? body.staffId : "";
      const templateId = typeof body.templateId === "string" ? body.templateId : "";
      if (!postId || !staffId || !templateId) {
        return NextResponse.json({ error: "ข้อมูลไม่ครบ" }, { status: 400 });
      }
      const [post, staff, template] = await Promise.all([
        prisma.smartGuardPost.findFirst({ where: { id: postId, shopId: shop.id, isActive: true } }),
        prisma.smartGuardStaff.findFirst({ where: { id: staffId, shopId: shop.id, isActive: true } }),
        prisma.smartGuardDutyTemplate.findFirst({
          where: { id: templateId, shopId: shop.id, isActive: true },
        }),
      ]);
      if (!post || !staff || !template) {
        return NextResponse.json({ error: "ไม่พบจุด / พนักงาน / กะ" }, { status: 404 });
      }

      // เตือนสัปดาห์ 48 ชม. — ไม่บล็อก
      const weekStart = bangkokWeekMonday(dutyOn);
      const weekEnd = bangkokWeekSunday(weekStart);
      const weekSum = await prisma.smartGuardWorkSpan.aggregate({
        where: {
          shopId: shop.id,
          staffId,
          workOn: { gte: weekStart, lte: weekEnd },
        },
        _sum: { normalMinutes: true },
      });
      const plannedNormal = Math.min(template.plannedMinutes, template.normalCapMinutes);
      const weeklyWarning =
        (weekSum._sum.normalMinutes ?? 0) + plannedNormal > shop.weeklyNormalCapMinutes;

      const duty = await prisma.smartGuardPostDuty.create({
        data: {
          ownerUserId: own.ownerId,
          trialSessionId: scope.trialSessionId,
          shopId: shop.id,
          dutyOn,
          postId,
          staffId,
          templateId,
          status: "PLANNED",
        },
      });

      await recomputeSmartGuardWorkSpanForPostDuty(prisma, duty.id);

      // มอบหมายสายตรวจควบ (ถ้าส่ง scheduleId)
      let tourAssignment = null;
      const scheduleId = typeof body.scheduleId === "string" ? body.scheduleId : "";
      if (scheduleId) {
        const schedule = await prisma.smartGuardSchedule.findFirst({
          where: { id: scheduleId, shopId: shop.id, isActive: true },
        });
        if (schedule) {
          tourAssignment = await prisma.smartGuardTourAssignment.create({
            data: {
              ownerUserId: own.ownerId,
              trialSessionId: scope.trialSessionId,
              shopId: shop.id,
              dutyOn,
              scheduleId,
              staffId,
              templateId,
              postDutyId: duty.id,
            },
          });
        }
      }

      return NextResponse.json({
        duty: { id: duty.id, dutyOn, postId, staffId, templateId, status: duty.status },
        tourAssignment: tourAssignment
          ? { id: tourAssignment.id, scheduleId: tourAssignment.scheduleId }
          : null,
        weeklyWarning,
        weeklyNormalCapMinutes: shop.weeklyNormalCapMinutes,
      });
    }

    // kind === tour — มอบหมายสายอย่างเดียว (หรือผูก postDuty ที่มี)
    const dutyOn = typeof body.dutyOn === "string" ? body.dutyOn.trim() : bangkokDateKey();
    const scheduleId = typeof body.scheduleId === "string" ? body.scheduleId : "";
    const staffId = typeof body.staffId === "string" ? body.staffId : "";
    const postDutyId =
      typeof body.postDutyId === "string" && body.postDutyId ? body.postDutyId : null;
    if (!scheduleId || !staffId) {
      return NextResponse.json({ error: "ข้อมูลไม่ครบ" }, { status: 400 });
    }
    const row = await prisma.smartGuardTourAssignment.create({
      data: {
        ownerUserId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        shopId: shop.id,
        dutyOn,
        scheduleId,
        staffId,
        postDutyId,
        templateId: typeof body.templateId === "string" ? body.templateId : null,
      },
    });
    return NextResponse.json({ tourAssignment: { id: row.id, scheduleId, staffId, postDutyId } });
  } catch (e) {
    console.error("[smart-guard-tour/duties POST]", e);
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("Unique") || msg.includes("unique")) {
      return NextResponse.json({ error: "มีเวรนี้อยู่แล้ว" }, { status: 409 });
    }
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await smartGuardTourOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    if (own.isStaff) return NextResponse.json({ error: "เฉพาะเจ้าของ" }, { status: 403 });
    const { shop } = await smartGuardTourSessionContext(own.ownerId);
    const url = new URL(req.url);
    const dutyId = url.searchParams.get("dutyId");
    const tourId = url.searchParams.get("tourId");
    if (dutyId) {
      const row = await prisma.smartGuardPostDuty.findFirst({
        where: { id: dutyId, shopId: shop.id },
        select: { id: true },
      });
      if (!row) return NextResponse.json({ error: "ไม่พบเวร" }, { status: 404 });
      await prisma.smartGuardTourAssignment.deleteMany({ where: { postDutyId: dutyId } });
      // ลบกะห่อเวร → WorkSpan cascade ตาม shiftLog
      await prisma.smartGuardShiftLog.deleteMany({ where: { postDutyId: dutyId } });
      await prisma.smartGuardPostDuty.delete({ where: { id: dutyId } });
      return NextResponse.json({ ok: true });
    }
    if (tourId) {
      const row = await prisma.smartGuardTourAssignment.findFirst({
        where: { id: tourId, shopId: shop.id },
        select: { id: true },
      });
      if (!row) return NextResponse.json({ error: "ไม่พบมอบหมาย" }, { status: 404 });
      await prisma.smartGuardTourAssignment.delete({ where: { id: tourId } });
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "ระบุ dutyId หรือ tourId" }, { status: 400 });
  } catch (e) {
    console.error("[smart-guard-tour/duties DELETE]", e);
    return NextResponse.json({ error: "ลบไม่สำเร็จ" }, { status: 500 });
  }
}
