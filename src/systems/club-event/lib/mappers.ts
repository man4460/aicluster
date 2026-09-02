import type {
  ClubEventAssetStatus,
  ClubEventDynamicLinkType,
  ClubEventFinanceType,
  ClubEventScheduleStatus,
} from "@/generated/prisma/enums";

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

export type ClubDynamicLinkConfig = {
  url?: string;
  amountBaht?: number;
  fields?: { key: string; label: string; type?: string }[];
};

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
    return parsed as ClubDynamicLinkConfig;
  } catch {
    return {};
  }
}

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
  promptPayPhone: string | null;
  promptPayQrImageUrl: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
  slipPaperSize: string;
  publicUrl: string;
};

export type ClubEventRecordDto = {
  id: string;
  title: string;
  eventDate: string;
  status: ClubEventScheduleStatus;
  description: string;
  youtubeEmbedUrl: string | null;
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
  phone: string;
  photoUrl: string | null;
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
};

export type ClubEventDynamicLinkDto = {
  id: string;
  type: ClubEventDynamicLinkType;
  title: string;
  config: ClubDynamicLinkConfig;
  isActive: boolean;
  publicPath: string;
};

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
  promptPayPhone: string | null;
  promptPayQrImageUrl: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
  slipPaperSize: string;
}): ClubEventProfileDto {
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
    promptPayPhone: row.promptPayPhone,
    promptPayQrImageUrl: row.promptPayQrImageUrl,
    bankName: row.bankName,
    bankAccountNumber: row.bankAccountNumber,
    bankAccountName: row.bankAccountName,
    slipPaperSize: row.slipPaperSize,
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
  _count?: { gallery: number };
}): ClubEventRecordDto {
  return {
    id: row.id,
    title: row.title,
    eventDate: row.eventDate.toISOString(),
    status: row.status,
    description: row.description,
    youtubeEmbedUrl: row.youtubeEmbedUrl,
    galleryCount: row._count?.gallery ?? 0,
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
