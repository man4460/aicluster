import {
  hotelResortNormalizeCheckoutExtraPresets,
  type HotelResortCheckoutExtraPreset,
} from "@/systems/hotel-resort/lib/checkout-extras";

/** ฟิลด์โปรไฟล์ที่ใช้พิมพ์ใบเสร็จ / ใบกำกับ / โฟลิโอ */
export const hotelResortProfilePrintSelect = {
  propertyName: true,
  managerName: true,
  logoUrl: true,
  taxId: true,
  contactPhone: true,
  bankName: true,
  bankAccountNumber: true,
  bankAccountName: true,
  slipPaperSize: true,
  checkoutExtraPresets: true,
} as const;

export type HotelResortPropertyPrintMeta = {
  propertyName: string;
  managerName: string | null;
  logoUrl: string | null;
  taxId: string | null;
  contactPhone: string | null;
  address: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
  slipPaperSize: string;
  checkoutExtraPresets: HotelResortCheckoutExtraPreset[];
};

export function hotelResortPropertyPrintFromProfile(
  profile: {
    propertyName: string;
    managerName?: string | null;
    logoUrl?: string | null;
    taxId?: string | null;
    contactPhone?: string | null;
    bankName?: string | null;
    bankAccountNumber?: string | null;
    bankAccountName?: string | null;
    slipPaperSize?: string | null;
    checkoutExtraPresets?: unknown;
  } | null,
): HotelResortPropertyPrintMeta {
  return {
    propertyName: profile?.propertyName ?? "โรงแรม",
    managerName: profile?.managerName ?? null,
    logoUrl: profile?.logoUrl ?? null,
    taxId: profile?.taxId ?? null,
    contactPhone: profile?.contactPhone ?? null,
    address: null,
    bankName: profile?.bankName ?? null,
    bankAccountNumber: profile?.bankAccountNumber ?? null,
    bankAccountName: profile?.bankAccountName ?? null,
    slipPaperSize: profile?.slipPaperSize ?? "SLIP_58",
    checkoutExtraPresets: hotelResortNormalizeCheckoutExtraPresets(profile?.checkoutExtraPresets),
  };
}
