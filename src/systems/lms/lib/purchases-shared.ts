import type {
  LmsCourse,
  LmsCoursePurchase,
  LmsLearner,
  LmsPurchasePayMethod,
  LmsPurchaseStatus,
} from "@/generated/prisma/client";

export const LMS_PURCHASE_STATUS_LABELS: Record<LmsPurchaseStatus, string> = {
  PENDING_REVIEW: "รอตรวจสลิป",
  APPROVED: "ยืนยันแล้ว",
  REJECTED: "ปฏิเสธ",
};

export const LMS_PURCHASE_PAY_METHOD_LABELS: Record<LmsPurchasePayMethod, string> = {
  PROMPTPAY: "พร้อมเพย์",
  TRANSFER: "โอนธนาคาร",
};

export const LMS_FAKE_SLIP_WARNING =
  "ห้ามอัปโหลดสลิปปลอมหรือหลักฐานที่ไม่ใช่การโอนจริง หากตรวจพบจะถูกปฏิเสธและอาจถูกลบบัญชีผู้เรียนถาวร";

export type LmsCoursePurchaseDto = {
  id: string;
  learnerId: string;
  courseId: string;
  amountBaht: number;
  payMethod: LmsPurchasePayMethod;
  slipUrl: string | null;
  status: LmsPurchaseStatus;
  reviewerNote: string;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  learner?: {
    id: string;
    username: string;
    fullName: string;
    status: string;
  };
  course?: {
    id: string;
    title: string;
    coverImageUrl: string | null;
    priceBaht: number;
  };
};

export function mapLmsCoursePurchase(
  p: LmsCoursePurchase & {
    learner?: Pick<LmsLearner, "id" | "username" | "fullName" | "status"> | null;
    course?: Pick<LmsCourse, "id" | "title" | "coverImageUrl" | "priceBaht"> | null;
  },
): LmsCoursePurchaseDto {
  return {
    id: p.id,
    learnerId: p.learnerId,
    courseId: p.courseId,
    amountBaht: p.amountBaht,
    payMethod: p.payMethod,
    slipUrl: p.slipUrl,
    status: p.status,
    reviewerNote: p.reviewerNote,
    reviewedAt: p.reviewedAt?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    learner: p.learner
      ? {
          id: p.learner.id,
          username: p.learner.username,
          fullName: p.learner.fullName,
          status: p.learner.status,
        }
      : undefined,
    course: p.course
      ? {
          id: p.course.id,
          title: p.course.title,
          coverImageUrl: p.course.coverImageUrl,
          priceBaht: p.course.priceBaht,
        }
      : undefined,
  };
}
