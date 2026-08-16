import type { AppSlipPaperSize } from "@/components/app-templates/slip-print";

export type FootballTurfBookingStatus =
  | "BOOKED"
  | "CHECKED_IN"
  | "PLAYING"
  | "COMPLETED"
  | "CANCELLED";

export type FootballTurfBookingSource = "ONLINE" | "WALK_IN" | "STAFF";
export type FootballTurfPromotionKind = "COUNT" | "HOUR";
export type FootballTurfBookingPaymentMethod = "UNPAID" | "PROMPTPAY" | "TRANSFER" | "ONSITE";
export type FootballTurfBookingPaymentStatus = "UNPAID" | "PENDING_REVIEW" | "PARTIAL" | "PAID";

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
  /** ยอดที่ชำระแล้วสะสม */
  amountPaidBaht?: number;
  promotionSaleId: number | null;
  /** ลายเซ็นลูกค้าตอนใช้สิทธิ์โปร / หักแพ็ก */
  signatureImageUrl?: string | null;
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
  /** โลโก้สนาม — path /uploads หรือ URL */
  logoUrl: string;
  promptpayNumber: string;
  /** รูป QR พร้อมเพย์ที่อัปโหลดเอง (ว่าง = สร้างจากเบอร์) */
  promptPayQrImageUrl: string;
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
  /** แบนเนอร์หน้าเว็บจองลูกค้า */
  portalBannerUrl: string;
  /** แกลเลอรีหน้าเว็บจอง */
  portalGallery: string[];
  facebookUrl: string;
  mapUrl: string;
  /** มีรหัสเข้าลิงก์พนักงานรายวันหรือไม่ (ไม่เก็บรหัสจริง) */
  staffDailyPinSet?: boolean;
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
  paymentSlipUrl: string;
};

export type FootballTurfIncomeCategoryKind = "COURT_RENTAL" | "PROMOTION" | "CUSTOM";

export type FootballTurfIncomeCategory = {
  id: number;
  name: string;
  kind: FootballTurfIncomeCategoryKind;
  isBuiltin: boolean;
  sortOrder: number;
};

export type FootballTurfIncomeEntry = {
  id: number;
  categoryId: number;
  categoryName: string;
  earnedAt: string;
  amount: number;
  itemLabel: string;
  note: string;
  paymentSlipUrl: string;
};

export type FootballTurfRevenueEntry = {
  id: string;
  paidAt: string;
  amount: number;
  label: string;
  customerName: string;
  customerPhone: string;
  source: "BOOKING" | "PROMOTION" | "INCOME";
};

export type FootballTurfCustomer = {
  id: number;
  name: string;
  phone: string;
  teamName: string;
  note: string;
  isActive: boolean;
  /** ต้องการออกใบกำกับภาษี — เก็บข้อมูลภาษีไว้ใช้ตอนพิมพ์ */
  taxInvoiceEnabled: boolean;
  billingName: string;
  taxId: string;
  taxAddress: string;
  taxBranch: string;
  /** รูปโปรไฟล์ลูกค้า */
  photoUrl: string;
  pointsBalance?: number;
  totalEarned?: number;
  totalRedeemed?: number;
};

export type FootballTurfFullState = {
  settings: FootballTurfVenueSettings;
  courts: FootballTurfCourt[];
  bookings: FootballTurfBooking[];
  promotions: FootballTurfPromotion[];
  promotionSales: FootballTurfPromotionSale[];
  costCategories: FootballTurfCostCategory[];
  costEntries: FootballTurfCostEntry[];
  incomeCategories: FootballTurfIncomeCategory[];
  incomeEntries: FootballTurfIncomeEntry[];
  customers: FootballTurfCustomer[];
};

export interface FootballTurfRepository {
  listCourts(): Promise<FootballTurfCourt[]>;
  createCourt(input: Omit<FootballTurfCourt, "id">): Promise<FootballTurfCourt>;
  updateCourt(id: number, patch: Partial<Omit<FootballTurfCourt, "id">>): Promise<FootballTurfCourt | null>;
  deleteCourt(id: number): Promise<boolean>;
  getSettings(): Promise<FootballTurfVenueSettings>;
  updateSettings(
    patch: Partial<FootballTurfVenueSettings> & {
      staffDailyPin?: string | null;
      staffDailyPinClear?: boolean;
    },
  ): Promise<FootballTurfVenueSettings>;
  listBookings(): Promise<FootballTurfBooking[]>;
  createBooking(input: Omit<FootballTurfBooking, "id" | "createdAt"> & { createdAt?: string }): Promise<FootballTurfBooking>;
  createOnlineBookingsBatch?(input: {
    courtId: number;
    bookingDate: string;
    slots: Array<{ startTime: string; endTime: string }>;
    customerName: string;
    customerPhone: string;
    teamName?: string;
    playerCount?: number;
    paymentMethod?: string;
    paymentSlipDataUrl?: string;
    paymentReference?: string;
  }): Promise<FootballTurfBooking[]>;
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
  usePromotionSale(
    saleId: number,
    bookingId: number,
    signatureImageUrl?: string | null,
  ): Promise<FootballTurfPromotionSale | null>;
  listCostCategories(): Promise<FootballTurfCostCategory[]>;
  createCostCategory(name: string): Promise<FootballTurfCostCategory>;
  updateCostCategory(id: number, name: string): Promise<FootballTurfCostCategory | null>;
  deleteCostCategory(id: number): Promise<boolean>;
  listCostEntries(): Promise<FootballTurfCostEntry[]>;
  createCostEntry(input: Omit<FootballTurfCostEntry, "id" | "categoryName">): Promise<FootballTurfCostEntry>;
  updateCostEntry(
    id: number,
    patch: Partial<Omit<FootballTurfCostEntry, "id" | "categoryName">>,
  ): Promise<FootballTurfCostEntry | null>;
  deleteCostEntry(id: number): Promise<boolean>;
  listIncomeCategories(): Promise<FootballTurfIncomeCategory[]>;
  createIncomeCategory(name: string): Promise<FootballTurfIncomeCategory>;
  updateIncomeCategory(id: number, name: string): Promise<FootballTurfIncomeCategory | null>;
  deleteIncomeCategory(id: number): Promise<boolean>;
  listIncomeEntries(): Promise<FootballTurfIncomeEntry[]>;
  createIncomeEntry(input: Omit<FootballTurfIncomeEntry, "id" | "categoryName">): Promise<FootballTurfIncomeEntry>;
  updateIncomeEntry(
    id: number,
    patch: Partial<Omit<FootballTurfIncomeEntry, "id" | "categoryName">>,
  ): Promise<FootballTurfIncomeEntry | null>;
  deleteIncomeEntry(id: number): Promise<boolean>;
  listRevenueEntries(): Promise<FootballTurfRevenueEntry[]>;
  listCustomers(): Promise<FootballTurfCustomer[]>;
  createCustomer(input: Omit<FootballTurfCustomer, "id">): Promise<FootballTurfCustomer>;
  updateCustomer(id: number, patch: Partial<Omit<FootballTurfCustomer, "id">>): Promise<FootballTurfCustomer | null>;
  deleteCustomer(id: number): Promise<boolean>;
}
