import type { AppSlipPaperSize } from "@/components/app-templates/slip-print";

export type FootballTurfBookingStatus =
  | "BOOKED"
  | "CHECKED_IN"
  | "PLAYING"
  | "COMPLETED"
  | "CANCELLED";

export type FootballTurfBookingSource = "ONLINE" | "WALK_IN" | "STAFF";
export type FootballTurfPromotionKind = "COUNT" | "HOUR";
export type FootballTurfBookingPaymentMethod = "UNPAID" | "TRANSFER" | "ONSITE";
export type FootballTurfBookingPaymentStatus = "UNPAID" | "PENDING_REVIEW" | "PAID";

export type FootballTurfCourt = {
  id: number;
  name: string;
  openTime: string;
  closeTime: string;
  slotMinutes: number;
  weekdayPrice: number;
  weekendPrice: number;
  imageUrl: string;
  isActive: boolean;
};

export type FootballTurfBooking = {
  id: number;
  courtId: number;
  courtName: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  customerName: string;
  customerPhone: string;
  teamName: string;
  playerCount: number;
  source: FootballTurfBookingSource;
  status: FootballTurfBookingStatus;
  listedPrice: number;
  finalPrice: number;
  /** มัดจำ/ยอดชำระตอนจองจากลิงก์ลูกค้า (null = ไม่บังคับ) */
  depositAmountBaht?: number | null;
  promotionSaleId: number | null;
  note: string;
  paymentMethod?: FootballTurfBookingPaymentMethod;
  paymentStatus?: FootballTurfBookingPaymentStatus;
  paymentSlipDataUrl?: string;
  paymentReference?: string;
  createdAt: string;
};

export type FootballTurfPortalBookingPaymentMode = "NONE" | "DEPOSIT" | "FULL";

export type FootballTurfVenueSettings = {
  venueName: string;
  venueSubtitle: string;
  promptpayNumber: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  venueAddress: string;
  taxId: string;
  contactPhone: string;
  contactLine: string;
  note: string;
  slipPaperSize: AppSlipPaperSize;
  /** การชำระตอนจองจากลิงก์ลูกค้า */
  portalBookingPaymentMode: FootballTurfPortalBookingPaymentMode;
  /** จำนวนมัดจำ (บาท) เมื่อโหมด DEPOSIT */
  depositAmountBaht: number | null;
};

export type FootballTurfPromotion = {
  id: number;
  name: string;
  kind: FootballTurfPromotionKind;
  totalUses: number;
  durationMinutes: number;
  price: number;
  isActive: boolean;
  note: string;
};

export type FootballTurfPromotionSalePaymentMethod = "ONSITE" | "TRANSFER" | "CASH";

export type FootballTurfPromotionSale = {
  id: number;
  promotionId: number;
  promotionName: string;
  customerName: string;
  customerPhone: string;
  teamName: string;
  totalUses: number;
  remainingUses: number;
  price: number;
  status: "ACTIVE" | "USED_UP" | "DISABLED";
  paymentMethod?: FootballTurfPromotionSalePaymentMethod;
  paymentStatus?: FootballTurfBookingPaymentStatus;
  paymentSlipDataUrl?: string;
  paymentReference?: string;
  createdAt: string;
};

export type FootballTurfCostCategory = {
  id: number;
  name: string;
};

export type FootballTurfCostEntry = {
  id: number;
  categoryId: number;
  categoryName: string;
  spentAt: string;
  amount: number;
  itemLabel: string;
  note: string;
};

export type FootballTurfRevenueEntry = {
  id: string;
  paidAt: string;
  amount: number;
  label: string;
  customerName: string;
  customerPhone: string;
  source: "BOOKING" | "PROMOTION";
};

export type FootballTurfCustomer = {
  id: number;
  name: string;
  phone: string;
  teamName: string;
  note: string;
  isActive: boolean;
};

export type FootballTurfFullState = {
  settings: FootballTurfVenueSettings;
  courts: FootballTurfCourt[];
  bookings: FootballTurfBooking[];
  promotions: FootballTurfPromotion[];
  promotionSales: FootballTurfPromotionSale[];
  costCategories: FootballTurfCostCategory[];
  costEntries: FootballTurfCostEntry[];
  customers: FootballTurfCustomer[];
};

export interface FootballTurfRepository {
  listCourts(): Promise<FootballTurfCourt[]>;
  createCourt(input: Omit<FootballTurfCourt, "id">): Promise<FootballTurfCourt>;
  updateCourt(id: number, patch: Partial<Omit<FootballTurfCourt, "id">>): Promise<FootballTurfCourt | null>;
  deleteCourt(id: number): Promise<boolean>;
  getSettings(): Promise<FootballTurfVenueSettings>;
  updateSettings(patch: Partial<FootballTurfVenueSettings>): Promise<FootballTurfVenueSettings>;
  listBookings(): Promise<FootballTurfBooking[]>;
  createBooking(input: Omit<FootballTurfBooking, "id" | "createdAt"> & { createdAt?: string }): Promise<FootballTurfBooking>;
  updateBooking(id: number, patch: Partial<Omit<FootballTurfBooking, "id" | "createdAt">>): Promise<FootballTurfBooking | null>;
  deleteBooking(id: number): Promise<boolean>;
  listPromotions(): Promise<FootballTurfPromotion[]>;
  createPromotion(input: Omit<FootballTurfPromotion, "id">): Promise<FootballTurfPromotion>;
  updatePromotion(id: number, patch: Partial<Omit<FootballTurfPromotion, "id">>): Promise<FootballTurfPromotion | null>;
  deletePromotion(id: number): Promise<boolean>;
  listPromotionSales(): Promise<FootballTurfPromotionSale[]>;
  createPromotionSale(input: Omit<FootballTurfPromotionSale, "id" | "createdAt" | "remainingUses" | "status">): Promise<FootballTurfPromotionSale>;
  updatePromotionSale(
    id: number,
    patch: Partial<
      Pick<
        FootballTurfPromotionSale,
        | "customerName"
        | "customerPhone"
        | "teamName"
        | "remainingUses"
        | "status"
        | "paymentMethod"
        | "paymentStatus"
        | "paymentSlipDataUrl"
        | "paymentReference"
      >
    >,
  ): Promise<FootballTurfPromotionSale | null>;
  deletePromotionSale(id: number): Promise<boolean>;
  usePromotionSale(saleId: number, bookingId: number): Promise<FootballTurfPromotionSale | null>;
  listCostCategories(): Promise<FootballTurfCostCategory[]>;
  createCostCategory(name: string): Promise<FootballTurfCostCategory>;
  listCostEntries(): Promise<FootballTurfCostEntry[]>;
  createCostEntry(input: Omit<FootballTurfCostEntry, "id" | "categoryName">): Promise<FootballTurfCostEntry>;
  deleteCostEntry(id: number): Promise<boolean>;
  listRevenueEntries(): Promise<FootballTurfRevenueEntry[]>;
  listCustomers(): Promise<FootballTurfCustomer[]>;
  createCustomer(input: Omit<FootballTurfCustomer, "id">): Promise<FootballTurfCustomer>;
  updateCustomer(id: number, patch: Partial<Omit<FootballTurfCustomer, "id">>): Promise<FootballTurfCustomer | null>;
  deleteCustomer(id: number): Promise<boolean>;
}
