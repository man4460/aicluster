import { CLUB_EVENT_MODULE_SLUG } from "@/lib/modules/config";
import { hasMonthly199ForModule, type UserAccessFields } from "@/lib/modules/access";

/** ฟรี/ทดลอง: YouTube ได้ 1 ลิงก์ · แกลเลอรีได้ 20 รูป — เกินนี้ต้องสมัครรายเดือนโมดูล */
export const CLUB_EVENT_FREE_YOUTUBE_MAX = 1;
export const CLUB_EVENT_FREE_GALLERY_MAX = 20;
export const CLUB_EVENT_MONTHLY_YOUTUBE_MAX = 24;
export const CLUB_EVENT_MONTHLY_GALLERY_MAX = 500;

export type ClubEventMediaLimits = {
  isMonthly: boolean;
  youtubeMax: number;
  galleryMax: number;
};

export function clubEventHasMonthlyPlan(
  access: Pick<UserAccessFields, "role" | "monthly199Slugs">,
): boolean {
  return hasMonthly199ForModule(access, CLUB_EVENT_MODULE_SLUG);
}

export function resolveClubEventMediaLimits(
  access: Pick<UserAccessFields, "role" | "monthly199Slugs">,
): ClubEventMediaLimits {
  const isMonthly = clubEventHasMonthlyPlan(access);
  return {
    isMonthly,
    youtubeMax: isMonthly ? CLUB_EVENT_MONTHLY_YOUTUBE_MAX : CLUB_EVENT_FREE_YOUTUBE_MAX,
    galleryMax: isMonthly ? CLUB_EVENT_MONTHLY_GALLERY_MAX : CLUB_EVENT_FREE_GALLERY_MAX,
  };
}

export function assertClubEventYoutubeCount(
  count: number,
  limits: ClubEventMediaLimits,
): { ok: true } | { ok: false; error: string; code: "CLUB_EVENT_YOUTUBE_PLAN_GATE" } {
  if (count <= limits.youtubeMax) return { ok: true };
  if (limits.isMonthly) {
    return {
      ok: false,
      code: "CLUB_EVENT_YOUTUBE_PLAN_GATE",
      error: `เพิ่มวิดีโอ YouTube ได้สูงสุด ${limits.youtubeMax} ลิงก์ต่อกิจกรรม`,
    };
  }
  return {
    ok: false,
    code: "CLUB_EVENT_YOUTUBE_PLAN_GATE",
    error: `แพ็กฟรีเพิ่ม YouTube ได้ ${CLUB_EVENT_FREE_YOUTUBE_MAX} ลิงก์ — มากกว่านี้ต้องสมัครรายเดือนโมดูลบริหารชมรม`,
  };
}

export function assertClubEventGalleryCount(
  count: number,
  limits: ClubEventMediaLimits,
): { ok: true } | { ok: false; error: string; code: "CLUB_EVENT_GALLERY_PLAN_GATE" } {
  if (count <= limits.galleryMax) return { ok: true };
  if (limits.isMonthly) {
    return {
      ok: false,
      code: "CLUB_EVENT_GALLERY_PLAN_GATE",
      error: `อัปโหลดรูปได้สูงสุด ${limits.galleryMax} รูปต่อกิจกรรม`,
    };
  }
  return {
    ok: false,
    code: "CLUB_EVENT_GALLERY_PLAN_GATE",
    error: `แพ็กฟรีอัปโหลดได้ ${CLUB_EVENT_FREE_GALLERY_MAX} รูป — มากกว่านี้ต้องสมัครรายเดือนโมดูลบริหารชมรม`,
  };
}
