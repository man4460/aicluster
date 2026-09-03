import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { bangkokDateKey } from "@/lib/time/bangkok";

export {
  LMS_FAKE_SLIP_WARNING,
  LMS_PURCHASE_PAY_METHOD_LABELS,
  LMS_PURCHASE_STATUS_LABELS,
  mapLmsCoursePurchase,
  type LmsCoursePurchaseDto,
} from "@/systems/lms/lib/purchases-shared";

type Tx = Prisma.TransactionClient;

async function ensureEnrollment(
  tx: Tx,
  args: {
    ownerUserId: string;
    trialSessionId: string;
    learnerId: string;
    courseId: string;
  },
) {
  const existing = await tx.lmsEnrollment.findUnique({
    where: { learnerId_courseId: { learnerId: args.learnerId, courseId: args.courseId } },
  });
  if (existing) return existing;
  return tx.lmsEnrollment.create({
    data: {
      ownerUserId: args.ownerUserId,
      trialSessionId: args.trialSessionId,
      learnerId: args.learnerId,
      courseId: args.courseId,
      status: "ENROLLED",
      progressPercent: 0,
    },
  });
}

async function revokeCourseAccess(
  tx: Tx,
  args: { learnerId: string; courseId: string },
) {
  const lessons = await tx.lmsLesson.findMany({
    where: { courseId: args.courseId },
    select: { id: true },
  });
  const lessonIds = lessons.map((l) => l.id);
  if (lessonIds.length > 0) {
    await tx.lmsLessonProgress.deleteMany({
      where: { learnerId: args.learnerId, lessonId: { in: lessonIds } },
    });
  }
  await tx.lmsCertificate.deleteMany({
    where: { learnerId: args.learnerId, courseId: args.courseId },
  });
  await tx.lmsEnrollment.deleteMany({
    where: { learnerId: args.learnerId, courseId: args.courseId },
  });
}

/**
 * หลังอัปโหลดสลิป: สร้างคำขอรอตรวจ + เปิดสิทธิ์เรียนทันที (ยังไม่บันทึกรายรับ)
 */
export async function createPendingPurchaseWithImmediateAccess(args: {
  ownerUserId: string;
  trialSessionId: string;
  profileId: string;
  learnerId: string;
  courseId: string;
  amountBaht: number;
  payMethod: "PROMPTPAY" | "TRANSFER";
  slipUrl: string | null;
}) {
  return prisma.$transaction(async (tx) => {
    const purchase = await tx.lmsCoursePurchase.create({
      data: {
        ownerUserId: args.ownerUserId,
        trialSessionId: args.trialSessionId,
        profileId: args.profileId,
        learnerId: args.learnerId,
        courseId: args.courseId,
        amountBaht: args.amountBaht,
        payMethod: args.payMethod,
        slipUrl: args.slipUrl,
        status: "PENDING_REVIEW",
      },
      include: {
        learner: { select: { id: true, username: true, fullName: true, status: true } },
        course: { select: { id: true, title: true, coverImageUrl: true, priceBaht: true } },
      },
    });

    await ensureEnrollment(tx, {
      ownerUserId: args.ownerUserId,
      trialSessionId: args.trialSessionId,
      learnerId: args.learnerId,
      courseId: args.courseId,
    });

    return purchase;
  });
}

/** อนุมัติสลิป: ยืนยันสิทธิ์เรียน (ถ้ายังไม่มี) + บันทึกรายรับ */
export async function approveLmsCoursePurchase(
  purchaseId: string,
  ownerUserId: string,
  trialSessionId: string,
) {
  return prisma.$transaction(async (tx) => {
    const purchase = await tx.lmsCoursePurchase.findFirst({
      where: { id: purchaseId, ownerUserId, trialSessionId },
      include: { course: true },
    });
    if (!purchase) return { ok: false as const, error: "ไม่พบคำขอซื้อ", status: 404 };
    if (purchase.status !== "PENDING_REVIEW") {
      return { ok: false as const, error: "คำขอนี้ถูกตรวจแล้ว", status: 409 };
    }

    await ensureEnrollment(tx, {
      ownerUserId,
      trialSessionId,
      learnerId: purchase.learnerId,
      courseId: purchase.courseId,
    });

    if (purchase.amountBaht > 0) {
      const today = bangkokDateKey();
      await tx.lmsFinanceTransaction.create({
        data: {
          ownerUserId,
          trialSessionId,
          profileId: purchase.profileId,
          type: "INCOME",
          category: "ค่าคอร์ส",
          amountBaht: purchase.amountBaht,
          transactedAt: new Date(`${today}T12:00:00+07:00`),
          note: `ซื้อคอร์ส · ${purchase.course.title}`,
          slipUrl: purchase.slipUrl,
        },
      });
    }

    const updated = await tx.lmsCoursePurchase.update({
      where: { id: purchase.id },
      data: {
        status: "APPROVED",
        reviewedAt: new Date(),
        reviewerNote: "",
      },
      include: {
        learner: { select: { id: true, username: true, fullName: true, status: true } },
        course: { select: { id: true, title: true, coverImageUrl: true, priceBaht: true } },
      },
    });

    return { ok: true as const, purchase: updated };
  });
}

/** ปฏิเสธสลิป: ถอนสิทธิ์เรียน + ตัวเลือกปิดบัญชี */
export async function rejectLmsCoursePurchase(
  purchaseId: string,
  ownerUserId: string,
  trialSessionId: string,
  opts: { reviewerNote: string; deactivateLearner: boolean },
) {
  return prisma.$transaction(async (tx) => {
    const purchase = await tx.lmsCoursePurchase.findFirst({
      where: { id: purchaseId, ownerUserId, trialSessionId },
    });
    if (!purchase) return { ok: false as const, error: "ไม่พบคำขอซื้อ", status: 404 };
    if (purchase.status !== "PENDING_REVIEW") {
      return { ok: false as const, error: "คำขอนี้ถูกตรวจแล้ว", status: 409 };
    }

    await revokeCourseAccess(tx, {
      learnerId: purchase.learnerId,
      courseId: purchase.courseId,
    });

    if (opts.deactivateLearner) {
      await tx.lmsLearner.update({
        where: { id: purchase.learnerId },
        data: { status: "INACTIVE" },
      });
    }

    const updated = await tx.lmsCoursePurchase.update({
      where: { id: purchase.id },
      data: {
        status: "REJECTED",
        reviewerNote: opts.reviewerNote,
        reviewedAt: new Date(),
      },
      include: {
        learner: { select: { id: true, username: true, fullName: true, status: true } },
        course: { select: { id: true, title: true, coverImageUrl: true, priceBaht: true } },
      },
    });

    return {
      ok: true as const,
      purchase: {
        ...updated,
        learner: updated.learner
          ? {
              ...updated.learner,
              status: opts.deactivateLearner ? ("INACTIVE" as const) : updated.learner.status,
            }
          : updated.learner,
      },
      learnerDeactivated: opts.deactivateLearner,
    };
  });
}

/**
 * เปิดสิทธิ์เรียนทันทีสำหรับคำขอรอตรวจที่ยังไม่มี enrollment
 * (รองรับคำขอเก่าก่อนปรับโฟลว์ + กันพลาด)
 */
export async function ensureAccessForPendingPurchases(learnerId: string) {
  const pending = await prisma.lmsCoursePurchase.findMany({
    where: { learnerId, status: "PENDING_REVIEW" },
    select: {
      id: true,
      ownerUserId: true,
      trialSessionId: true,
      courseId: true,
    },
  });
  if (pending.length === 0) return;

  for (const p of pending) {
    const existing = await prisma.lmsEnrollment.findUnique({
      where: { learnerId_courseId: { learnerId, courseId: p.courseId } },
    });
    if (existing) continue;
    await prisma.lmsEnrollment.create({
      data: {
        ownerUserId: p.ownerUserId,
        trialSessionId: p.trialSessionId,
        learnerId,
        courseId: p.courseId,
        status: "ENROLLED",
        progressPercent: 0,
      },
    });
  }
}
