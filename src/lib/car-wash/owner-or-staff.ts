import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { carWashOwnerFromAuth } from "@/lib/car-wash/api-owner";
import { requireCarWashStaff } from "@/lib/car-wash/staff-auth";
import { getCarWashDataScope } from "@/lib/trial/module-scopes";

export type CarWashOwnerOrStaffResult =
  | {
      ok: true;
      ownerId: string;
      trialSessionId: string;
      isStaff: boolean;
      /** ชื่อผู้บันทึกลงคิว/บิล — พนักงาน (ลิงก์โทเค็น) เป็น "พนักงาน" เสมอ */
      recordedByName: string;
    }
  | { ok: false; res: NextResponse };

/**
 * เจ้าของ (session) หรือลิงก์พนักงานคาร์แคร์แบบโทเค็น (`ownerId`+`t`+`k`)
 * — ใช้กับ API งานที่ต้องเปิดให้พนักงานผ่านลิงก์ QR บันทึกแทนเจ้าของได้
 */
export async function getCarWashOwnerOrStaffContext(req: Request): Promise<CarWashOwnerOrStaffResult> {
  const auth = await requireSession();
  if (auth.ok) {
    const own = await carWashOwnerFromAuth(auth.session.sub);
    if (own.ok) {
      const scope = await getCarWashDataScope(own.ownerId);
      return {
        ok: true,
        ownerId: own.ownerId,
        trialSessionId: scope.trialSessionId,
        isStaff: own.isStaff,
        recordedByName: auth.session.username?.trim() || "",
      };
    }
  }

  const staff = await requireCarWashStaff(req);
  if ("error" in staff) return { ok: false, res: staff.error };
  return {
    ok: true,
    ownerId: staff.ctx.ownerId,
    trialSessionId: staff.ctx.trialSessionId,
    isStaff: true,
    recordedByName: "พนักงาน",
  };
}
