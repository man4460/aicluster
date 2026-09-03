import { NextResponse } from "next/server";
import { readLmsLearnerSession } from "@/lib/lms/learner-session";
import { findLmsPublicProfile } from "@/lib/lms/public-profile";
import { prisma } from "@/lib/prisma";
import {
  approveLmsCoursePurchase,
  createPendingPurchaseWithImmediateAccess,
  LMS_FAKE_SLIP_WARNING,
  mapLmsCoursePurchase,
} from "@/systems/lms/lib/purchases";

type Ctx = { params: Promise<{ slug: string }> };

/** ผู้เรียนส่งคำขอซื้อคอร์ส + สลิป → เข้าเรียนได้ทันที · สถาบันตรวจสลิปภายหลัง */
export async function POST(req: Request, ctx: Ctx) {
  try {
    const { slug } = await ctx.params;
    const url = new URL(req.url);
    const session = await readLmsLearnerSession();
    if (!session || session.slug !== slug) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }

    const profile = await findLmsPublicProfile(slug, url.searchParams.get("t"));
    if (!profile || profile.id !== session.profileId) {
      return NextResponse.json({ error: "ไม่พบสถาบัน" }, { status: 404 });
    }

    const learner = await prisma.lmsLearner.findFirst({
      where: { id: session.learnerId, profileId: profile.id, status: "ACTIVE" },
    });
    if (!learner) {
      return NextResponse.json({ error: "บัญชีผู้เรียนถูกปิดหรือไม่พบ" }, { status: 401 });
    }

    const body = (await req.json()) as Record<string, unknown>;
    const courseId = typeof body.courseId === "string" ? body.courseId : "";
    const payMethod =
      body.payMethod === "TRANSFER" || body.payMethod === "PROMPTPAY" ? body.payMethod : "";
    const slipUrl = typeof body.slipUrl === "string" ? body.slipUrl.trim() : "";
    const acknowledgedRules = body.acknowledgedRules === true;

    if (!courseId) {
      return NextResponse.json({ error: "เลือกคอร์ส" }, { status: 400 });
    }
    if (!acknowledgedRules) {
      return NextResponse.json(
        { error: "ต้องยอมรับเงื่อนไขเกี่ยวกับสลิปก่อนส่งคำขอ" },
        { status: 400 },
      );
    }

    const course = await prisma.lmsCourse.findFirst({
      where: { id: courseId, profileId: profile.id, status: "PUBLISHED" },
    });
    if (!course) {
      return NextResponse.json({ error: "ไม่พบคอร์ส" }, { status: 404 });
    }

    const enrolled = await prisma.lmsEnrollment.findUnique({
      where: { learnerId_courseId: { learnerId: learner.id, courseId } },
    });
    if (enrolled) {
      return NextResponse.json({ error: "คุณลงทะเบียนคอร์สนี้แล้ว" }, { status: 409 });
    }

    const pending = await prisma.lmsCoursePurchase.findFirst({
      where: { learnerId: learner.id, courseId, status: "PENDING_REVIEW" },
    });
    if (pending) {
      return NextResponse.json(
        { error: "มีคำขอซื้อคอร์สนี้อยู่แล้ว — ตรวจที่แท็บกำลังเรียนได้" },
        { status: 409 },
      );
    }

    const amountBaht = Math.max(0, course.priceBaht);

    if (amountBaht === 0) {
      const freePurchase = await createPendingPurchaseWithImmediateAccess({
        ownerUserId: profile.ownerUserId,
        trialSessionId: profile.trialSessionId,
        profileId: profile.id,
        learnerId: learner.id,
        courseId,
        amountBaht: 0,
        payMethod: "PROMPTPAY",
        slipUrl: null,
      });
      const approved = await approveLmsCoursePurchase(
        freePurchase.id,
        profile.ownerUserId,
        profile.trialSessionId,
      );
      if (!approved.ok) {
        return NextResponse.json({ error: approved.error }, { status: approved.status });
      }
      return NextResponse.json({
        purchase: mapLmsCoursePurchase(approved.purchase),
        enrolled: true,
        warning: LMS_FAKE_SLIP_WARNING,
      });
    }

    if (!payMethod) {
      return NextResponse.json({ error: "เลือกช่องทางชำระเงิน" }, { status: 400 });
    }
    if (!slipUrl || !slipUrl.startsWith("/uploads/")) {
      return NextResponse.json({ error: "กรุณาแนบสลิปการโอน" }, { status: 400 });
    }

    const row = await createPendingPurchaseWithImmediateAccess({
      ownerUserId: profile.ownerUserId,
      trialSessionId: profile.trialSessionId,
      profileId: profile.id,
      learnerId: learner.id,
      courseId,
      amountBaht,
      payMethod,
      slipUrl: slipUrl.slice(0, 512),
    });

    return NextResponse.json({
      purchase: mapLmsCoursePurchase(row),
      enrolled: true,
      pendingReview: true,
      warning: LMS_FAKE_SLIP_WARNING,
    });
  } catch (e) {
    console.error("[lms/public/[slug]/purchases POST]", e);
    return NextResponse.json({ error: "ส่งคำขอซื้อไม่สำเร็จ" }, { status: 500 });
  }
}
