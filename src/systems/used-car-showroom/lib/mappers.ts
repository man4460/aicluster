import { bangkokDateKey } from "@/lib/time/bangkok";
import { computeUsedCarVehiclePnl } from "@/systems/used-car-showroom/lib/pnl";
import { mapUsedCarVehicleVideoRow } from "@/systems/used-car-showroom/lib/youtube";
import {
  parseUsedCarPortalPaymentMode,
  usedCarVehicleStatusLabel,
} from "@/systems/used-car-showroom/lib/status";

export type UsedCarShopDto = {
  id: string;
  ownerUserId: string;
  trialSessionId: string;
  slug: string;
  displayName: string;
  logoUrl: string | null;
  tagline: string | null;
  address: string | null;
  contactPhone: string | null;
  contactLine: string | null;
  facebookUrl: string | null;
  mapUrl: string | null;
  openTimeHm: string | null;
  closeTimeHm: string | null;
  portalBannerUrl: string | null;
  portalGallery: string[];
  portalEnabled: boolean;
  portalBookingPaymentMode: "NONE" | "DEPOSIT" | "FULL";
  depositAmountBaht: number;
  promptPayPhone: string | null;
  promptPayQrImageUrl: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
  taxId: string | null;
  slipPaperSize: string;
  /** มีรหัสเข้าเว็บพนักงานตั้งไว้แล้ว (ไม่ส่งรหัสจริง) */
  staffDailyPinSet: boolean;
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

export function mapUsedCarShop(row: {
  id: string;
  ownerUserId: string;
  trialSessionId: string;
  slug: string;
  displayName: string;
  logoUrl: string | null;
  tagline: string | null;
  address: string | null;
  contactPhone: string | null;
  contactLine: string | null;
  facebookUrl: string | null;
  mapUrl: string | null;
  openTimeHm: string | null;
  closeTimeHm: string | null;
  portalBannerUrl: string | null;
  portalGalleryJson: string;
  portalEnabled: boolean;
  portalBookingPaymentMode: string;
  depositAmountBaht: number;
  promptPayPhone: string | null;
  promptPayQrImageUrl: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
  taxId: string | null;
  slipPaperSize: string;
  staffDailyPinHash?: string | null;
}): UsedCarShopDto {
  return {
    id: row.id,
    ownerUserId: row.ownerUserId,
    trialSessionId: row.trialSessionId,
    slug: row.slug,
    displayName: row.displayName,
    logoUrl: row.logoUrl,
    tagline: row.tagline,
    address: row.address,
    contactPhone: row.contactPhone,
    contactLine: row.contactLine,
    facebookUrl: row.facebookUrl,
    mapUrl: row.mapUrl,
    openTimeHm: row.openTimeHm,
    closeTimeHm: row.closeTimeHm,
    portalBannerUrl: row.portalBannerUrl,
    portalGallery: parseGalleryJson(row.portalGalleryJson),
    portalEnabled: row.portalEnabled,
    portalBookingPaymentMode: parseUsedCarPortalPaymentMode(row.portalBookingPaymentMode),
    depositAmountBaht: row.depositAmountBaht,
    promptPayPhone: row.promptPayPhone,
    promptPayQrImageUrl: row.promptPayQrImageUrl,
    bankName: row.bankName,
    bankAccountNumber: row.bankAccountNumber,
    bankAccountName: row.bankAccountName,
    taxId: row.taxId,
    slipPaperSize: row.slipPaperSize,
    staffDailyPinSet: Boolean(row.staffDailyPinHash?.trim()),
  };
}

export function mapUsedCarVehicle(row: {
  id: string;
  shopId: string;
  status: string;
  brand: string;
  model: string;
  year: number | null;
  color: string | null;
  mileageKm: number | null;
  transmission: string | null;
  fuelType: string | null;
  bodyType: string | null;
  plateNumber: string | null;
  vin: string | null;
  engineNumber: string | null;
  hasRegistrationBook: boolean;
  purchaseCostBaht: number;
  askingPriceBaht: number;
  coverImageUrl: string | null;
  description: string | null;
  note: string | null;
  purchasedAt: Date | null;
  soldAt: Date | null;
  createdAt: Date;
  images?: { id: string; imageUrl: string; isCover: boolean; sortOrder: number }[];
  videos?: { id: string; youtubeUrl: string; title: string | null; sortOrder: number }[];
  documents?: { id: string; title: string; fileUrl: string; note: string | null }[];
  costLines?: {
    id: string;
    kind: string;
    label: string;
    amountBaht: number;
    slipImageUrl: string | null;
    spentAt: Date;
    note: string | null;
  }[];
}) {
  const images = (row.images ?? [])
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((img) => ({
      id: img.id,
      imageUrl: img.imageUrl,
      isCover: img.isCover,
      sortOrder: img.sortOrder,
    }));
  const videos = (row.videos ?? [])
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((v) => mapUsedCarVehicleVideoRow(v))
    .filter((v): v is NonNullable<typeof v> => v != null);
  const costLines = (row.costLines ?? []).map((c) => ({
    id: c.id,
    kind: c.kind,
    label: c.label,
    amountBaht: c.amountBaht,
    slipImageUrl: c.slipImageUrl,
    spentAt: c.spentAt.toISOString(),
    note: c.note,
  }));
  const prepCostBaht = costLines.reduce((s, c) => s + c.amountBaht, 0);
  return {
    id: row.id,
    shopId: row.shopId,
    status: row.status,
    statusLabel: usedCarVehicleStatusLabel(row.status),
    brand: row.brand,
    model: row.model,
    year: row.year,
    color: row.color,
    mileageKm: row.mileageKm,
    transmission: row.transmission,
    fuelType: row.fuelType,
    bodyType: row.bodyType,
    plateNumber: row.plateNumber,
    vin: row.vin,
    engineNumber: row.engineNumber,
    hasRegistrationBook: row.hasRegistrationBook,
    purchaseCostBaht: row.purchaseCostBaht,
    askingPriceBaht: row.askingPriceBaht,
    coverImageUrl: row.coverImageUrl ?? images.find((i) => i.isCover)?.imageUrl ?? images[0]?.imageUrl ?? null,
    description: row.description,
    note: row.note,
    purchasedAt: row.purchasedAt?.toISOString() ?? null,
    soldAt: row.soldAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    title: [row.brand, row.model, row.year].filter(Boolean).join(" "),
    images,
    videos,
    documents: (row.documents ?? []).map((d) => ({
      id: d.id,
      title: d.title,
      fileUrl: d.fileUrl,
      note: d.note,
    })),
    costLines,
    prepCostBaht,
  };
}

export function mapUsedCarVehiclePnl(row: {
  id: string;
  brand: string;
  model: string;
  year: number | null;
  status: string;
  purchaseCostBaht: number;
  askingPriceBaht: number;
  coverImageUrl: string | null;
  costLines?: { amountBaht: number }[];
  ledgerEntries?: { kind: string; amountBaht: number; category?: { systemKey: string | null } | null }[];
  sales?: { salePriceBaht: number; discountBaht: number }[];
}) {
  const prepCostBaht = (row.costLines ?? []).reduce((s, c) => s + c.amountBaht, 0);
  const commissionBaht = (row.ledgerEntries ?? [])
    .filter(
      (e) =>
        e.kind === "EXPENSE" &&
        (e.category?.systemKey === "COMMISSION" || !e.category?.systemKey),
    )
    .reduce((s, e) => {
      if (e.category?.systemKey === "COMMISSION") return s + e.amountBaht;
      return s;
    }, 0);
  const sale = row.sales?.[0];
  const salePriceBaht = sale?.salePriceBaht ?? row.askingPriceBaht;
  const discountBaht = sale?.discountBaht ?? 0;
  const pnl = computeUsedCarVehiclePnl({
    purchaseCostBaht: row.purchaseCostBaht,
    prepCostBaht,
    commissionBaht,
    salePriceBaht,
    discountBaht,
  });
  return {
    id: row.id,
    title: [row.brand, row.model, row.year].filter(Boolean).join(" "),
    status: row.status,
    statusLabel: usedCarVehicleStatusLabel(row.status),
    coverImageUrl: row.coverImageUrl,
    purchaseCostBaht: row.purchaseCostBaht,
    prepCostBaht,
    commissionBaht,
    salePriceBaht,
    discountBaht,
    ...pnl,
  };
}

export function mapUsedCarCustomer(row: {
  id: string;
  fullName: string;
  phone: string;
  lineId: string | null;
  email: string | null;
  address: string | null;
  nationalId: string | null;
  taxId: string | null;
  taxName: string | null;
  taxAddress: string | null;
  note: string | null;
  createdAt: Date;
}) {
  return {
    id: row.id,
    fullName: row.fullName,
    phone: row.phone,
    lineId: row.lineId,
    email: row.email,
    address: row.address,
    nationalId: row.nationalId,
    taxId: row.taxId,
    taxName: row.taxName,
    taxAddress: row.taxAddress,
    note: row.note,
    createdAt: row.createdAt.toISOString(),
  };
}

export function mapUsedCarReservation(row: {
  id: string;
  vehicleId: string;
  customerId: string | null;
  source: string;
  customerName: string;
  customerPhone: string;
  depositBaht: number;
  paymentMethod: string;
  slipImageUrl: string | null;
  status: string;
  expiresOn: string | null;
  note: string | null;
  createdAt: Date;
  vehicle?: { brand: string; model: string; year: number | null; coverImageUrl: string | null } | null;
}) {
  return {
    id: row.id,
    vehicleId: row.vehicleId,
    customerId: row.customerId,
    source: row.source,
    customerName: row.customerName,
    customerPhone: row.customerPhone,
    depositBaht: row.depositBaht,
    paymentMethod: row.paymentMethod,
    slipImageUrl: row.slipImageUrl,
    status: row.status,
    expiresOn: row.expiresOn,
    note: row.note,
    createdAt: row.createdAt.toISOString(),
    vehicleTitle: row.vehicle
      ? [row.vehicle.brand, row.vehicle.model, row.vehicle.year].filter(Boolean).join(" ")
      : null,
    vehicleCoverImageUrl: row.vehicle?.coverImageUrl ?? null,
  };
}

export function mapUsedCarAppointment(row: {
  id: string;
  vehicleId: string | null;
  customerName: string;
  customerPhone: string;
  kind: string;
  appointmentOn: string;
  appointmentHm: string;
  status: string;
  note: string | null;
  createdAt: Date;
  vehicle?: { brand: string; model: string; year: number | null } | null;
}) {
  return {
    id: row.id,
    vehicleId: row.vehicleId,
    customerName: row.customerName,
    customerPhone: row.customerPhone,
    kind: row.kind,
    appointmentOn: row.appointmentOn,
    appointmentHm: row.appointmentHm,
    status: row.status,
    note: row.note,
    createdAt: row.createdAt.toISOString(),
    vehicleTitle: row.vehicle
      ? [row.vehicle.brand, row.vehicle.model, row.vehicle.year].filter(Boolean).join(" ")
      : null,
    isToday: row.appointmentOn === bangkokDateKey(),
  };
}

export function mapUsedCarStaff(row: {
  id: string;
  fullName: string;
  phone: string | null;
  role: string;
  commissionPercent: number;
  bonusNote: string | null;
  startedOn: string | null;
  isActive: boolean;
  note: string | null;
}) {
  return {
    id: row.id,
    fullName: row.fullName,
    phone: row.phone,
    role: row.role,
    commissionPercent: row.commissionPercent,
    bonusNote: row.bonusNote,
    startedOn: row.startedOn,
    isActive: row.isActive,
    note: row.note,
  };
}

export function mapUsedCarPromotion(row: {
  id: string;
  vehicleId: string | null;
  title: string;
  description: string | null;
  kind: string;
  valueBaht: number;
  valuePercent: number;
  giftLabel: string | null;
  startsOn: string;
  endsOn: string;
  isActive: boolean;
}) {
  return {
    id: row.id,
    vehicleId: row.vehicleId,
    title: row.title,
    description: row.description,
    kind: row.kind,
    valueBaht: row.valueBaht,
    valuePercent: row.valuePercent,
    giftLabel: row.giftLabel,
    startsOn: row.startsOn,
    endsOn: row.endsOn,
    isActive: row.isActive,
  };
}

export function mapUsedCarFinanceCompany(row: {
  id: string;
  name: string;
  contactName: string | null;
  contactPhone: string | null;
  note: string | null;
  isActive: boolean;
}) {
  return {
    id: row.id,
    name: row.name,
    contactName: row.contactName,
    contactPhone: row.contactPhone,
    note: row.note,
    isActive: row.isActive,
  };
}

export function mapUsedCarFinanceCase(row: {
  id: string;
  vehicleId: string;
  saleId: string | null;
  customerId: string | null;
  companyId: string | null;
  financedAmountBaht: number;
  status: string;
  commissionBaht: number;
  commissionPaid: boolean;
  insuranceCompany: string | null;
  signOn: string | null;
  note: string | null;
  createdAt: Date;
  vehicle?: { brand: string; model: string; year: number | null } | null;
  company?: { name: string } | null;
}) {
  return {
    id: row.id,
    vehicleId: row.vehicleId,
    saleId: row.saleId,
    customerId: row.customerId,
    companyId: row.companyId,
    financedAmountBaht: row.financedAmountBaht,
    status: row.status,
    commissionBaht: row.commissionBaht,
    commissionPaid: row.commissionPaid,
    insuranceCompany: row.insuranceCompany,
    signOn: row.signOn,
    note: row.note,
    createdAt: row.createdAt.toISOString(),
    vehicleTitle: row.vehicle
      ? [row.vehicle.brand, row.vehicle.model, row.vehicle.year].filter(Boolean).join(" ")
      : null,
    companyName: row.company?.name ?? null,
  };
}

export function mapUsedCarLead(row: {
  id: string;
  customerId: string | null;
  vehicleId: string | null;
  staffId: string | null;
  fullName: string;
  phone: string;
  source: string;
  status: string;
  note: string | null;
  createdAt: Date;
}) {
  return {
    id: row.id,
    customerId: row.customerId,
    vehicleId: row.vehicleId,
    staffId: row.staffId,
    fullName: row.fullName,
    phone: row.phone,
    source: row.source,
    status: row.status,
    note: row.note,
    createdAt: row.createdAt.toISOString(),
  };
}

export function mapUsedCarLedgerEntry(row: {
  id: string;
  categoryId: string | null;
  vehicleId: string | null;
  saleId: string | null;
  kind: string;
  title: string;
  amountBaht: number;
  entryOn: string;
  paymentMethod: string | null;
  slipImageUrl: string | null;
  note: string | null;
  createdAt: Date;
  category?: { id: string; name: string; kind: string; systemKey: string | null } | null;
}) {
  return {
    id: row.id,
    categoryId: row.categoryId,
    vehicleId: row.vehicleId,
    saleId: row.saleId,
    kind: row.kind,
    title: row.title,
    amountBaht: row.amountBaht,
    entryOn: row.entryOn,
    paymentMethod: row.paymentMethod,
    slipImageUrl: row.slipImageUrl,
    note: row.note,
    createdAt: row.createdAt.toISOString(),
    categoryName: row.category?.name ?? null,
    categorySystemKey: row.category?.systemKey ?? null,
  };
}
