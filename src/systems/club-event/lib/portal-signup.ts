export type ClubPortalSignupCollectDues = "OFF" | "OPTIONAL" | "REQUIRED";

export const CLUB_PORTAL_SIGNUP_COLLECT_DUES_LABELS: Record<ClubPortalSignupCollectDues, string> = {
  OFF: "ไม่เรียกเก็บตอนสมัคร (เรียกเก็บทีหลังได้)",
  OPTIONAL: "ให้เลือกชำระตอนสมัครได้ (ติ๊กเอง)",
  REQUIRED: "บังคับชำระค่าบำรุงตอนสมัคร",
};

export function parsePortalSignupCollectDues(raw: unknown): ClubPortalSignupCollectDues {
  if (raw === "OPTIONAL" || raw === "REQUIRED" || raw === "OFF") return raw;
  return "OFF";
}

/** โหมดเก็บจริงบนหน้าสาธารณะ — ปิดถ้าชมรมยังไม่เปิดค่าบำรุง */
export function resolvePortalSignupCollectDues(opts: {
  portalSignupCollectDues: string | null | undefined;
  duesEnabled: boolean;
  duesAmountBaht: number;
}): ClubPortalSignupCollectDues {
  if (!opts.duesEnabled || Math.max(0, Math.round(Number(opts.duesAmountBaht) || 0)) <= 0) {
    return "OFF";
  }
  return parsePortalSignupCollectDues(opts.portalSignupCollectDues);
}

export function clubEventSignupPublicPath(slug: string): string {
  return `/club/${encodeURIComponent(slug)}/signup`;
}
