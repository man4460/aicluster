import type {
  ClubEventAssetStatus,
  ClubEventDynamicLinkType,
  ClubEventFinanceType,
  ClubEventScheduleStatus,
} from "@/generated/prisma/enums";
import { parseClubEventYoutubeUrls } from "@/systems/club-event/lib/youtube";

export type ClubCommitteeMember = {
  role: string;
  name: string;
  phone?: string;
  photoUrl?: string;
};

export type ClubMemberCustomField = {
  key: string;
  label: string;
  value: string;
};

export type ClubDynamicLinkFieldType = "text" | "choice";

export type ClubDynamicLinkField = {
  key: string;
  label: string;
  type: ClubDynamicLinkFieldType;
  /** ตัวเลือกเมื่อ type = choice */
  options?: string[];
  required?: boolean;
};

export type ClubDynamicLinkConfig = {
  url?: string;
  amountBaht?: number;
  eventId?: string;
  description?: string;
  fields?: ClubDynamicLinkField[];
};

export function normalizeClubDynamicLinkFields(raw: unknown): ClubDynamicLinkField[] {
  if (!Array.isArray(raw)) return [];
  const out: ClubDynamicLinkField[] = [];
  for (let i = 0; i < raw.length && out.length < 20; i += 1) {
    const row = raw[i];
    if (typeof row !== "object" || row === null) continue;
    const label = typeof (row as { label?: unknown }).label === "string"
      ? (row as { label: string }).label.trim().slice(0, 160)
      : "";
    if (!label) continue;
    const typeRaw = (row as { type?: unknown }).type;
    const type: ClubDynamicLinkFieldType = typeRaw === "choice" ? "choice" : "text";
    const keyRaw = typeof (row as { key?: unknown }).key === "string"
      ? (row as { key: string }).key.trim().slice(0, 64)
      : "";
    const key = keyRaw || `q${i + 1}`;
    let options: string[] | undefined;
    if (type === "choice") {
      const optsRaw = (row as { options?: unknown }).options;
      const list = Array.isArray(optsRaw)
        ? optsRaw
        : typeof optsRaw === "string"
          ? optsRaw.split(/\n|,/)
          : [];
      options = list
        .map((o) => (typeof o === "string" ? o.trim() : ""))
        .filter(Boolean)
        .slice(0, 30);
      if (options.length === 0) options = ["ตัวเลือก 1"];
    }
    out.push({
      key,
      label,
      type,
      options,
      required: Boolean((row as { required?: unknown }).required),
    });
  }
  return out;
}

export function parseCommitteeJson(raw: string): ClubCommitteeMember[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (row): row is ClubCommitteeMember =>
        typeof row === "object" &&
        row !== null &&
        typeof (row as ClubCommitteeMember).role === "string" &&
        typeof (row as ClubCommitteeMember).name === "string",
    );
  } catch {
    return [];
  }
}

export function parseCustomFieldsJson(raw: string): ClubMemberCustomField[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (row): row is ClubMemberCustomField =>
        typeof row === "object" &&
        row !== null &&
        typeof (row as ClubMemberCustomField).key === "string" &&
        typeof (row as ClubMemberCustomField).label === "string",
    );
  } catch {
    return [];
  }
}

export function parseDynamicLinkConfig(raw: string): ClubDynamicLinkConfig {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null) return {};
    const cfg = parsed as ClubDynamicLinkConfig;
    return {
      ...cfg,
      fields: cfg.fields ? normalizeClubDynamicLinkFields(cfg.fields) : undefined,
    };
  } catch {
    return {};
  }
}

export type ClubFinanceCategory = {
  id: string;
  name: string;
  type: ClubEventFinanceType;
};

export type ClubEventProfileDto = {
  id: string;
  slug: string;
  displayName: string;
  logoUrl: string | null;
  tagline: string | null;
  rulesMarkdown: string;
  committee: ClubCommitteeMember[];
  contactPhone: string | null;
  contactLine: string | null;
  address: string | null;
  facebookUrl: string | null;
  mapUrl: string | null;
  portalBannerUrl: string | null;
  portalGallery: string[];
  paymentRulesNote: string;
  promptPayPhone: string | null;
  promptPayQrImageUrl: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
  taxId: string | null;
  slipPaperSize: string;
  financeCategories: ClubFinanceCategory[];
  publicUrl: string;
};

export type ClubEventRecordDto = {
  id: string;
  title: string;
  eventDate: string;
  status: ClubEventScheduleStatus;
  description: string;
  /** @deprecated ใช้ youtubeUrls — คงไว้เป็นวิดีโอตัวแรก */
  youtubeEmbedUrl: string | null;
  youtubeUrls: string[];
  galleryCount: number;
};

export type ClubEventGalleryDto = {
  id: string;
  eventId: string;
  imageUrl: string;
  fileName: string;
  sortOrder: number;
};

export type ClubEventMemberDto = {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  nickname: string;
  gender: string;
  phone: string;
  photoUrl: string | null;
  position: string;
  email: string;
  social: string;
  memberCode: string;
  dataConsent: boolean;
  customFields: ClubMemberCustomField[];
  isActive: boolean;
};

export type ClubEventFinanceDto = {
  id: string;
  type: ClubEventFinanceType;
  category: string;
  amountBaht: number;
  transactedAt: string;
  note: string;
  slipUrl: string | null;
};

export type ClubEventAssetDto = {
  id: string;
  name: string;
  quantity: number;
  status: ClubEventAssetStatus;
  note: string;
  imageUrl: string | null;
};

export type ClubEventDynamicLinkDto = {
  id: string;
  type: ClubEventDynamicLinkType;
  title: string;
  config: ClubDynamicLinkConfig;
  isActive: boolean;
  publicPath: string;
};

export function parseFinanceCategoriesJson(raw: string): ClubFinanceCategory[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (row): row is ClubFinanceCategory =>
        typeof row === "object" &&
        row !== null &&
        typeof (row as ClubFinanceCategory).id === "string" &&
        typeof (row as ClubFinanceCategory).name === "string" &&
        ((row as ClubFinanceCategory).type === "INCOME" || (row as ClubFinanceCategory).type === "EXPENSE"),
    );
  } catch {
    return [];
  }
}

export const DEFAULT_CLUB_EVENT_FINANCE_CATEGORIES: ClubFinanceCategory[] = [
  { id: "inc-dues", name: "ค่าบำรุงสมาชิก", type: "INCOME" },
  { id: "inc-sponsor", name: "สปอนเซอร์", type: "INCOME" },
  { id: "inc-other", name: "รายรับอื่น", type: "INCOME" },
  { id: "exp-venue", name: "ค่าสถานที่", type: "EXPENSE" },
  { id: "exp-food", name: "อาหารว่าง", type: "EXPENSE" },
  { id: "exp-prize", name: "ของรางวัล", type: "EXPENSE" },
  { id: "exp-other", name: "รายจ่ายอื่น", type: "EXPENSE" },
];

export function parsePortalGalleryJson(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((u): u is string => typeof u === "string" && u.trim().length > 0).slice(0, 24);
  } catch {
    return [];
  }
}

export function mapClubEventProfile(row: {
  id: string;
  slug: string;
  displayName: string;
  logoUrl: string | null;
  tagline: string | null;
  rulesMarkdown: string;
  committeeJson: string;
  contactPhone: string | null;
  contactLine: string | null;
  address?: string | null;
  facebookUrl?: string | null;
  mapUrl?: string | null;
  portalBannerUrl?: string | null;
  portalGalleryJson?: string;
  paymentRulesNote?: string;
  promptPayPhone: string | null;
  promptPayQrImageUrl: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
  taxId?: string | null;
  slipPaperSize: string;
  financeCategoriesJson?: string;
}): ClubEventProfileDto {
  const cats = parseFinanceCategoriesJson(row.financeCategoriesJson ?? "[]");
  return {
    id: row.id,
    slug: row.slug,
    displayName: row.displayName,
    logoUrl: row.logoUrl,
    tagline: row.tagline,
    rulesMarkdown: row.rulesMarkdown,
    committee: parseCommitteeJson(row.committeeJson),
    contactPhone: row.contactPhone,
    contactLine: row.contactLine,
    address: row.address ?? null,
    facebookUrl: row.facebookUrl ?? null,
    mapUrl: row.mapUrl ?? null,
    portalBannerUrl: row.portalBannerUrl ?? null,
    portalGallery: parsePortalGalleryJson(row.portalGalleryJson ?? "[]"),
    paymentRulesNote: row.paymentRulesNote ?? "",
    promptPayPhone: row.promptPayPhone,
    promptPayQrImageUrl: row.promptPayQrImageUrl,
    bankName: row.bankName,
    bankAccountNumber: row.bankAccountNumber,
    bankAccountName: row.bankAccountName,
    taxId: row.taxId ?? null,
    slipPaperSize: row.slipPaperSize,
    financeCategories: cats.length > 0 ? cats : DEFAULT_CLUB_EVENT_FINANCE_CATEGORIES,
    publicUrl: `/club/${row.slug}`,
  };
}

export function mapClubEventRecord(row: {
  id: string;
  title: string;
  eventDate: Date;
  status: ClubEventScheduleStatus;
  description: string;
  youtubeEmbedUrl: string | null;
  youtubeUrlsJson?: string | null;
  _count?: { gallery: number };
}): ClubEventRecordDto {
  const youtubeUrls = parseClubEventYoutubeUrls(row.youtubeUrlsJson, row.youtubeEmbedUrl);
  return {
    id: row.id,
    title: row.title,
    eventDate: row.eventDate.toISOString(),
    status: row.status,
    description: row.description,
    youtubeEmbedUrl: youtubeUrls[0] ?? null,
    youtubeUrls,
    galleryCount: row._count?.gallery ?? 0,
  };
}

export function mapClubEventMember(row: {
  id: string;
  name: string;
  firstName?: string | null;
  lastName?: string | null;
  nickname?: string | null;
  gender?: string | null;
  phone: string;
  photoUrl: string | null;
  position?: string | null;
  email?: string | null;
  social?: string | null;
  memberCode?: string | null;
  dataConsent?: boolean | null;
  customFieldsJson: string;
  isActive: boolean;
}): ClubEventMemberDto {
  const firstName = (row.firstName ?? "").trim();
  const lastName = (row.lastName ?? "").trim();
  const display =
    `${firstName} ${lastName}`.trim() ||
    row.name ||
    [firstName, lastName].filter(Boolean).join(" ");
  return {
    id: row.id,
    name: display,
    firstName: firstName || (display.includes(" ") ? display.split(/\s+/)[0]! : display),
    lastName: lastName || (display.includes(" ") ? display.split(/\s+/).slice(1).join(" ") : ""),
    nickname: row.nickname ?? "",
    gender: row.gender ?? "",
    phone: row.phone,
    photoUrl: row.photoUrl,
    position: row.position ?? "",
    email: row.email ?? "",
    social: row.social ?? "",
    memberCode: row.memberCode ?? "",
    dataConsent: Boolean(row.dataConsent),
    customFields: parseCustomFieldsJson(row.customFieldsJson),
    isActive: row.isActive,
  };
}

export function deriveEventStatus(eventDate: Date, now = new Date()): ClubEventScheduleStatus {
  return eventDate.getTime() < now.getTime() ? "PAST" : "UPCOMING";
}

export const CLUB_EVENT_ASSET_STATUS_LABELS: Record<ClubEventAssetStatus, string> = {
  AVAILABLE: "พร้อมใช้",
  IN_USE: "กำลังใช้",
  DAMAGED: "ชำรุด",
  RETIRED: "จำหน่าย/เลิกใช้",
};

export const CLUB_EVENT_LINK_TYPE_LABELS: Record<ClubEventDynamicLinkType, string> = {
  SURVEY: "แบบสำรวจ",
  RSVP: "ลงทะเบียนเข้าร่วม",
  PAYMENT: "เก็บเงิน",
  URL: "ลิงก์ภายนอก",
};

export const CLUB_EVENT_FINANCE_TYPE_LABELS: Record<ClubEventFinanceType, string> = {
  INCOME: "รายรับ",
  EXPENSE: "รายจ่าย",
};
