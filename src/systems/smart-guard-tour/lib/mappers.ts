export type SmartGuardShopDto = {
  id: string;
  ownerUserId: string;
  trialSessionId: string;
  slug: string;
  displayName: string;
  logoUrl: string | null;
  address: string | null;
  contactPhone: string | null;
  emergencyPhone: string | null;
  contactLine: string | null;
  lineNotifyToken: string | null;
  facebookUrl: string | null;
  mapUrl: string | null;
  shopLat: number | null;
  shopLng: number | null;
  openTimeHm: string | null;
  closeTimeHm: string | null;
  portalBannerUrl: string | null;
  portalGallery: string[];
  portalEnabled: boolean;
  portalSosEnabled: boolean;
  promptPayPhone: string | null;
  promptPayQrImageUrl: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
  taxId: string | null;
  slipPaperSize: string;
  /** มีรหัสเข้าเว็บพนักงานตั้งไว้แล้ว (ไม่ส่งรหัสจริง) */
  staffDailyPinSet: boolean;
  /** สะพานเช็คอินอัจฉริยะ → เข้ากะจุดตรวจ */
  attendanceLinkEnabled: boolean;
  attendanceBranchId: number | null;
  attendanceLocationId: number | null;
  attendanceRequireMatch: boolean;
  /** ซิงค์ชื่อ·เบอร์·รูป·สถานะ กับรายชื่อเช็คอิน */
  attendanceStaffSyncEnabled: boolean;
};

function parseGalleryJson(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((u): u is string => typeof u === "string" && u.trim().length > 0).slice(0, 40);
  } catch {
    return [];
  }
}

export function mapSmartGuardShop(row: {
  id: string;
  ownerUserId: string;
  trialSessionId: string;
  slug: string;
  displayName: string;
  logoUrl: string | null;
  address: string | null;
  contactPhone: string | null;
  emergencyPhone?: string | null;
  contactLine: string | null;
  lineNotifyToken?: string | null;
  facebookUrl: string | null;
  mapUrl: string | null;
  shopLat?: { toString(): string } | number | null;
  shopLng?: { toString(): string } | number | null;
  openTimeHm: string | null;
  closeTimeHm: string | null;
  portalBannerUrl: string | null;
  portalGalleryJson: string;
  portalEnabled: boolean;
  portalSosEnabled?: boolean;
  promptPayPhone: string | null;
  promptPayQrImageUrl: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
  taxId: string | null;
  slipPaperSize: string;
  staffDailyPinHash?: string | null;
  attendanceLinkEnabled?: boolean;
  attendanceBranchId?: number | null;
  attendanceLocationId?: number | null;
  attendanceRequireMatch?: boolean;
  attendanceStaffSyncEnabled?: boolean;
}): SmartGuardShopDto {
  const toNum = (v: { toString(): string } | number | null | undefined): number | null => {
    if (v == null) return null;
    const n = typeof v === "number" ? v : Number(v.toString());
    return Number.isFinite(n) ? n : null;
  };
  return {
    id: row.id,
    ownerUserId: row.ownerUserId,
    trialSessionId: row.trialSessionId,
    slug: row.slug,
    displayName: row.displayName,
    logoUrl: row.logoUrl,
    address: row.address,
    contactPhone: row.contactPhone,
    emergencyPhone: row.emergencyPhone ?? null,
    contactLine: row.contactLine,
    lineNotifyToken: row.lineNotifyToken ?? null,
    facebookUrl: row.facebookUrl,
    mapUrl: row.mapUrl,
    shopLat: toNum(row.shopLat),
    shopLng: toNum(row.shopLng),
    openTimeHm: row.openTimeHm,
    closeTimeHm: row.closeTimeHm,
    portalBannerUrl: row.portalBannerUrl,
    portalGallery: parseGalleryJson(row.portalGalleryJson),
    portalEnabled: row.portalEnabled,
    portalSosEnabled: row.portalSosEnabled !== false,
    promptPayPhone: row.promptPayPhone,
    promptPayQrImageUrl: row.promptPayQrImageUrl,
    bankName: row.bankName,
    bankAccountNumber: row.bankAccountNumber,
    bankAccountName: row.bankAccountName,
    taxId: row.taxId,
    slipPaperSize: row.slipPaperSize,
    staffDailyPinSet: Boolean(row.staffDailyPinHash?.trim()),
    attendanceLinkEnabled: Boolean(row.attendanceLinkEnabled),
    attendanceBranchId: row.attendanceBranchId ?? null,
    attendanceLocationId: row.attendanceLocationId ?? null,
    attendanceRequireMatch: row.attendanceRequireMatch !== false,
    attendanceStaffSyncEnabled: Boolean(row.attendanceStaffSyncEnabled),
  };
}
