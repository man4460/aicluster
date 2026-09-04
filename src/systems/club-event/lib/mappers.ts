import type {
  ClubEventAssetStatus,
  ClubEventDynamicLinkType,
  ClubEventFinanceType,
  ClubEventScheduleStatus,
} from "@/generated/prisma/enums";
import {
  normalizeClubEventYoutubeEmbedUrl,
  parseClubEventYoutubeVideos,
  type ClubEventYoutubeVideo,
} from "@/systems/club-event/lib/youtube";

export type { ClubEventYoutubeVideo };

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

export type ClubDynamicLinkFieldType = "text" | "choice" | "qty";

/** ตัวเลือก choice พร้อมราคา (บาท) ที่บวกเมื่อเลือก */
export type ClubDynamicLinkChoiceOption = {
  label: string;
  amountBaht: number;
};

/** รายการย่อยแบบจำนวน (เช่น ขนาดเสื้อ) — กรอกจำนวน × ราคาต่อหน่วย */
export type ClubDynamicLinkQtyItem = {
  key: string;
  label: string;
  amountBaht: number;
  /** จำนวนเริ่มต้นบนฟอร์มสาธารณะ (ว่าง = ไม่ใส่ล่วงหน้า) */
  defaultQty?: number;
};

export type ClubDynamicLinkField = {
  key: string;
  label: string;
  type: ClubDynamicLinkFieldType;
  /**
   * ป้ายตัวเลือก (legacy) — sync จาก choiceOptions
   * @deprecated ใช้ choiceOptions เป็นหลัก
   */
  options?: string[];
  /** ตัวเลือกเมื่อ type = choice พร้อมราคา */
  choiceOptions?: ClubDynamicLinkChoiceOption[];
  /** รายการจำนวนเมื่อ type = qty */
  qtyItems?: ClubDynamicLinkQtyItem[];
  required?: boolean;
};

export type ClubDynamicLinkConfig = {
  url?: string;
  amountBaht?: number;
  eventId?: string;
  description?: string;
  fields?: ClubDynamicLinkField[];
  /**
   * ผูกกับลิงก์ค่าบำรุงประจำปี (legacy id) — ใช้คู่กับ linkAnnualDues
   */
  annualDuesLinkId?: string;
  /**
   * เปิดตัวเลือกพ่วงค่าบำรุงตามตั้งค่าชมรม
   */
  linkAnnualDues?: boolean;
  /** ลิงก์นี้คือลิงก์ค่าบำรุงที่ระบบดูแลจากตั้งค่า */
  isClubDuesLink?: boolean;
};

const DEFAULT_QTY_SIZES = ["3XL", "2XL", "XL", "L", "M", "S", "SS"] as const;

export function defaultClubLinkQtyItems(): ClubDynamicLinkQtyItem[] {
  return DEFAULT_QTY_SIZES.map((label) => ({
    key: `size_${label.toLowerCase()}`,
    label,
    amountBaht: 0,
    defaultQty: 0,
  }));
}

function normalizeChoiceOptions(raw: unknown): ClubDynamicLinkChoiceOption[] {
  if (!Array.isArray(raw) || raw.length === 0) return [];
  const out: ClubDynamicLinkChoiceOption[] = [];
  for (const row of raw) {
    if (typeof row === "string") {
      const label = row.trim().slice(0, 120);
      if (label) out.push({ label, amountBaht: 0 });
      continue;
    }
    if (typeof row !== "object" || row === null) continue;
    const label =
      typeof (row as { label?: unknown }).label === "string"
        ? (row as { label: string }).label.trim().slice(0, 120)
        : typeof (row as { value?: unknown }).value === "string"
          ? (row as { value: string }).value.trim().slice(0, 120)
          : "";
    if (!label) continue;
    const amountRaw = (row as { amountBaht?: unknown }).amountBaht;
    const amountBaht =
      typeof amountRaw === "number" && Number.isFinite(amountRaw)
        ? Math.max(0, Math.round(amountRaw))
        : typeof amountRaw === "string" && amountRaw.trim()
          ? Math.max(0, Math.round(Number(amountRaw)) || 0)
          : 0;
    out.push({ label, amountBaht });
    if (out.length >= 30) break;
  }
  return out;
}

function normalizeQtyItems(raw: unknown): ClubDynamicLinkQtyItem[] {
  if (!Array.isArray(raw) || raw.length === 0) return [];
  const out: ClubDynamicLinkQtyItem[] = [];
  for (let i = 0; i < raw.length && out.length < 24; i += 1) {
    const row = raw[i];
    if (typeof row !== "object" || row === null) continue;
    const label =
      typeof (row as { label?: unknown }).label === "string"
        ? (row as { label: string }).label.trim().slice(0, 64)
        : "";
    if (!label) continue;
    const keyRaw =
      typeof (row as { key?: unknown }).key === "string"
        ? (row as { key: string }).key.trim().slice(0, 64)
        : "";
    const key = keyRaw || `item_${i + 1}`;
    const amountRaw = (row as { amountBaht?: unknown }).amountBaht;
    const amountBaht =
      typeof amountRaw === "number" && Number.isFinite(amountRaw)
        ? Math.max(0, Math.round(amountRaw))
        : typeof amountRaw === "string" && amountRaw.trim()
          ? Math.max(0, Math.round(Number(amountRaw)) || 0)
          : 0;
    const qtyRaw = (row as { defaultQty?: unknown }).defaultQty;
    const defaultQty =
      typeof qtyRaw === "number" && Number.isFinite(qtyRaw)
        ? Math.max(0, Math.min(999, Math.floor(qtyRaw)))
        : typeof qtyRaw === "string" && qtyRaw.trim()
          ? Math.max(0, Math.min(999, Math.floor(Number(qtyRaw)) || 0))
          : 0;
    out.push({ key, label, amountBaht, defaultQty });
  }
  return out;
}

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
    const type: ClubDynamicLinkFieldType =
      typeRaw === "choice" ? "choice" : typeRaw === "qty" ? "qty" : "text";
    const keyRaw = typeof (row as { key?: unknown }).key === "string"
      ? (row as { key: string }).key.trim().slice(0, 64)
      : "";
    const key = keyRaw || `q${i + 1}`;

    if (type === "choice") {
      const fromChoice = normalizeChoiceOptions((row as { choiceOptions?: unknown }).choiceOptions);
      const fromOpts = normalizeChoiceOptions((row as { options?: unknown }).options);
      let choiceOptions = fromChoice.length > 0 ? fromChoice : fromOpts;
      if (choiceOptions.length === 0) choiceOptions = [{ label: "ตัวเลือก 1", amountBaht: 0 }];
      out.push({
        key,
        label,
        type,
        choiceOptions,
        options: choiceOptions.map((o) => o.label),
        required: Boolean((row as { required?: unknown }).required),
      });
      continue;
    }

    if (type === "qty") {
      let qtyItems = normalizeQtyItems((row as { qtyItems?: unknown }).qtyItems);
      if (qtyItems.length === 0) qtyItems = defaultClubLinkQtyItems();
      out.push({
        key,
        label,
        type,
        qtyItems,
        required: Boolean((row as { required?: unknown }).required),
      });
      continue;
    }

    out.push({
      key,
      label,
      type: "text",
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
    const annualDuesLinkId =
      typeof cfg.annualDuesLinkId === "string" && cfg.annualDuesLinkId.trim()
        ? cfg.annualDuesLinkId.trim().slice(0, 64)
        : undefined;
    return {
      ...cfg,
      annualDuesLinkId,
      linkAnnualDues: Boolean(cfg.linkAnnualDues) || Boolean(annualDuesLinkId),
      isClubDuesLink: Boolean(cfg.isClubDuesLink),
      fields: cfg.fields ? normalizeClubDynamicLinkFields(cfg.fields) : undefined,
    };
  } catch {
    return {};
  }
}

/** ยอดค่าบำรุงจาก config ลิงก์ค่าบำรุง (ใช้เงินฐานเป็นหลัก) */
export function clubLinkAnnualDuesAmountBaht(config: ClubDynamicLinkConfig): number {
  const n = Number(config.amountBaht);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
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
  /** แสดงปุ่มคณะกรรมการบนเว็บสาธารณะ */
  portalShowCommittee: boolean;
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
  /** ค่าบำรุงสมาชิก */
  duesEnabled: boolean;
  duesAmountBaht: number;
  duesPeriod: "MONTHLY" | "QUARTERLY" | "SEMIANNUAL" | "YEARLY";
  duesLinkId: string | null;
  duesPublicPath: string | null;
};

export type ClubEventRecordDto = {
  id: string;
  title: string;
  eventDate: string;
  status: ClubEventScheduleStatus;
  description: string;
  /** @deprecated ใช้ youtubeVideos — คงไว้เป็นวิดีโอตัวแรก */
  youtubeEmbedUrl: string | null;
  /** embed URL รายการ — คงไว้เพื่อความเข้ากันได้ */
  youtubeUrls: string[];
  /** คลิป YouTube แบบลิงก์ทดลอง (ชื่อ · คำอธิบาย · URL) */
  youtubeVideos: ClubEventYoutubeVideo[];
  galleryCount: number;
  /** จำนวนเช็กอินวันงาน (ถ้า API ส่ง _count.checkIns) */
  checkInCount: number;
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
  { id: "inc-event-link", name: "ค่ากิจกรรม (ลิงก์)", type: "INCOME" },
  { id: "inc-sponsor", name: "สปอนเซอร์", type: "INCOME" },
  { id: "inc-other", name: "รายรับอื่น", type: "INCOME" },
  { id: "exp-venue", name: "ค่าสถานที่", type: "EXPENSE" },
  { id: "exp-food", name: "อาหารว่าง", type: "EXPENSE" },
  { id: "exp-prize", name: "ของรางวัล", type: "EXPENSE" },
  { id: "exp-other", name: "รายจ่ายอื่น", type: "EXPENSE" },
];

/** รวมหมวดค่าเริ่ม + ที่ผู้ใช้ตั้ง — ไม่ซ้ำชื่อ */
export function mergeClubEventFinanceCategories(
  raw: ClubFinanceCategory[],
): ClubFinanceCategory[] {
  const byName = new Map<string, ClubFinanceCategory>();
  for (const row of DEFAULT_CLUB_EVENT_FINANCE_CATEGORIES) {
    byName.set(`${row.type}:${row.name}`, row);
  }
  for (const row of raw) {
    const key = `${row.type}:${row.name}`;
    if (!byName.has(key)) byName.set(key, row);
  }
  return Array.from(byName.values());
}

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
  portalShowCommittee?: boolean;
  paymentRulesNote?: string;
  promptPayPhone: string | null;
  promptPayQrImageUrl: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
  taxId?: string | null;
  slipPaperSize: string;
  financeCategoriesJson?: string;
  duesEnabled?: boolean;
  duesAmountBaht?: number;
  duesPeriod?: "MONTHLY" | "QUARTERLY" | "SEMIANNUAL" | "YEARLY";
  duesLinkId?: string | null;
}): ClubEventProfileDto {
  const cats = mergeClubEventFinanceCategories(
    parseFinanceCategoriesJson(row.financeCategoriesJson ?? "[]"),
  );
  const duesLinkId = row.duesLinkId ?? null;
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
    portalShowCommittee: row.portalShowCommittee !== false,
    paymentRulesNote: row.paymentRulesNote ?? "",
    promptPayPhone: row.promptPayPhone,
    promptPayQrImageUrl: row.promptPayQrImageUrl,
    bankName: row.bankName,
    bankAccountNumber: row.bankAccountNumber,
    bankAccountName: row.bankAccountName,
    taxId: row.taxId ?? null,
    slipPaperSize: row.slipPaperSize,
    financeCategories: cats,
    publicUrl: `/club/${row.slug}`,
    duesEnabled: Boolean(row.duesEnabled),
    duesAmountBaht: Math.max(0, Math.round(Number(row.duesAmountBaht) || 0)),
    duesPeriod: row.duesPeriod ?? "YEARLY",
    duesLinkId,
    duesPublicPath: duesLinkId ? `/club/${row.slug}/link/${duesLinkId}` : null,
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
  _count?: { gallery: number; checkIns?: number };
}): ClubEventRecordDto {
  const youtubeVideos = parseClubEventYoutubeVideos(row.youtubeUrlsJson, row.youtubeEmbedUrl);
  const youtubeUrls = youtubeVideos
    .map((v) => normalizeClubEventYoutubeEmbedUrl(v.youtubeUrl))
    .filter((u): u is string => Boolean(u));
  return {
    id: row.id,
    title: row.title,
    eventDate: row.eventDate.toISOString(),
    status: row.status,
    description: row.description,
    youtubeEmbedUrl: youtubeUrls[0] ?? null,
    youtubeUrls,
    youtubeVideos,
    galleryCount: row._count?.gallery ?? 0,
    checkInCount: row._count?.checkIns ?? 0,
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
