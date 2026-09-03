import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { lmsOwnerFromAuth } from "@/lib/lms/api-owner";
import { lmsSessionContext } from "@/lib/lms/session-context";
import {
  approveLmsCoursePurchase,
  mapLmsCoursePurchase,
  rejectLmsCoursePurchase,
} from "@/systems/lms/lib/purchases";

type Ctx = { params: Promise<{ id: string }> };

/**
 * ตรวจสลิป: อนุมัติ → ยืนยัน + บันทึกรายรับ
 * ปฏิเสธ → ถอนสิทธิ์เรียน + ตัวเลือกปิดบัญชีผู้เรียน
 */
export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const auth = await requireSession();
    if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const own = await lmsOwnerFromAuth(auth.session.sub);
    if (!own.ok) return own.response;
    const { scope } = await lmsSessionContext(own.ownerId);
    const { id } = await ctx.params;

    const body = (await req.json()) as Record<string, unknown>;
    const action = body.action === "APPROVE" || body.action === "REJECT" ? body.action : "";
    const reviewerNote =
      typeof body.reviewerNote === "string" ? body.reviewerNote.trim().slice(0, 500) : "";
    const deactivateLearner = body.deactivateLearner === true;

    if (!action) {
      return NextResponse.json({ error: "ระบุ action APPROVE หรือ REJECT" }, { status: 400 });
    }

    if (action === "APPROVE") {
      const result = await approveLmsCoursePurchase(id, own.ownerId, scope.trialSessionId);
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: result.status });
      }
      return NextResponse.json({ purchase: mapLmsCoursePurchase(result.purchase) });
    }

    const note =
      reviewerNote ||
      "สลิปไม่ถูกต้องหรือไม่ใช่หลักฐานการโอนจริง — ฝ่าฝืนกฎสถาบัน";

    const result = await rejectLmsCoursePurchase(id, own.ownerId, scope.trialSessionId, {
      reviewerNote: note,
      deactivateLearner,
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({
      purchase: mapLmsCoursePurchase(result.purchase),
      learnerDeactivated: result.learnerDeactivated,
    });
  } catch (e) {
    console.error("[lms/session/purchases/[id] PATCH]", e);
    return NextResponse.json({ error: "บันทึกผลการตรวจไม่สำเร็จ" }, { status: 500 });
  }
}
