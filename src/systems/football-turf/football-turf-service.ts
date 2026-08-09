"use client";

export type {
  FootballTurfBooking,
  FootballTurfBookingPaymentMethod,
  FootballTurfBookingPaymentStatus,
  FootballTurfBookingSource,
  FootballTurfBookingStatus,
  FootballTurfCostCategory,
  FootballTurfCostEntry,
  FootballTurfCourt,
  FootballTurfCustomer,
  FootballTurfFullState,
  FootballTurfIncomeCategory,
  FootballTurfIncomeEntry,
  FootballTurfPromotion,
  FootballTurfPromotionKind,
  FootballTurfPromotionSale,
  FootballTurfPromotionSalePaymentMethod,
  FootballTurfRepository,
  FootballTurfRevenueEntry,
  FootballTurfVenueSettings,
} from "@/systems/football-turf/lib/types";

import {
  readStoredStaffDailyUnlock,
  staffDailyUnlockHeaders,
} from "@/lib/modules/staff-daily-pin";

import type {
  FootballTurfBooking,
  FootballTurfCostCategory,
  FootballTurfCostEntry,
  FootballTurfCourt,
  FootballTurfCustomer,
  FootballTurfFullState,
  FootballTurfIncomeCategory,
  FootballTurfIncomeEntry,
  FootballTurfPromotion,
  FootballTurfPromotionSale,
  FootballTurfRepository,
  FootballTurfRevenueEntry,
  FootballTurfVenueSettings,
} from "@/systems/football-turf/lib/types";
import { bangkokDateKey } from "@/lib/time/bangkok";
import { sameFootballTurfCustomer } from "@/systems/football-turf/lib/booking-session";
import { timeToMinutes } from "@/systems/football-turf/lib/time-queue";
import { footballTurfBookingIsFullyPaid } from "@/systems/football-turf/lib/portal-booking";

type FootballTurfDB = {
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
  seq: {
    court: number;
    booking: number;
    promotion: number;
    promotionSale: number;
    costCategory: number;
    costEntry: number;
    incomeCategory: number;
    incomeEntry: number;
    customer: number;
  };
};

const STORAGE_KEY = "mawell.football-turf.db.v2";
let STORAGE_SCOPE_KEY = "";

function defaultVenueSettings(): FootballTurfVenueSettings {
  return {
    venueName: "สนามฟุตบอล MAWELL",
    venueSubtitle: "สนามหญ้าเทียม",
    logoUrl: "",
    promptpayNumber: "",
    bankName: "",
    accountName: "",
    accountNumber: "",
    venueAddress: "",
    taxId: "",
    contactPhone: "0812345678",
    contactLine: "",
    note: "",
    slipPaperSize: "SLIP_58",
    portalBookingPaymentMode: "NONE",
    depositAmountBaht: null,
    portalBannerUrl: "",
    portalGallery: [],
    facebookUrl: "",
    mapUrl: "",
    staffDailyPinSet: false,
  };
}

function plusDays(date: Date, days: number): string {
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  return bangkokDateKey(value);
}

const seedToday = new Date();
const seedDB: FootballTurfDB = {
  settings: defaultVenueSettings(),
  courts: [
    { id: 1, name: "สนาม A", openTime: "16:00", closeTime: "23:00", slotMinutes: 60, weekdayPrice: 900, weekendPrice: 1200, imageUrl: "", isActive: true },
    { id: 2, name: "สนาม B", openTime: "16:00", closeTime: "23:00", slotMinutes: 90, weekdayPrice: 1200, weekendPrice: 1500, imageUrl: "", isActive: true },
  ],
  bookings: [
    {
      id: 1,
      courtId: 1,
      courtName: "สนาม A",
      bookingDate: plusDays(seedToday, 0),
      startTime: "18:00",
      endTime: "19:00",
      customerName: "ทีมเสือดำ",
      customerPhone: "0811111111",
      teamName: "เสือดำ FC",
      playerCount: 10,
      source: "ONLINE",
      status: "BOOKED",
      listedPrice: 900,
      finalPrice: 900,
      promotionSaleId: null,
      note: "จองจากลิงก์ลูกค้า",
      paymentMethod: "TRANSFER",
      paymentStatus: "PAID",
      paymentSlipDataUrl: "",
      paymentReference: "REF-FT-0001",
      createdAt: seedToday.toISOString(),
    },
    {
      id: 2,
      courtId: 2,
      courtName: "สนาม B",
      bookingDate: plusDays(seedToday, 0),
      startTime: "20:00",
      endTime: "21:30",
      customerName: "ทีมตัวอย่าง",
      customerPhone: "0899999999",
      teamName: "Night League",
      playerCount: 12,
      source: "WALK_IN",
      status: "PLAYING",
      listedPrice: 1500,
      finalPrice: 1500,
      promotionSaleId: null,
      note: "walk-in หน้างาน",
      paymentMethod: "ONSITE",
      paymentStatus: "PAID",
      paymentSlipDataUrl: "",
      paymentReference: "",
      createdAt: seedToday.toISOString(),
    },
    {
      id: 3,
      courtId: 1,
      courtName: "สนาม A",
      bookingDate: plusDays(seedToday, -1),
      startTime: "17:00",
      endTime: "18:00",
      customerName: "คุณอาร์ม",
      customerPhone: "0822222222",
      teamName: "Arm United",
      playerCount: 8,
      source: "ONLINE",
      status: "COMPLETED",
      listedPrice: 900,
      finalPrice: 900,
      promotionSaleId: null,
      note: "",
      paymentMethod: "TRANSFER",
      paymentStatus: "PAID",
      paymentSlipDataUrl: "",
      paymentReference: "",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 4,
      courtId: 2,
      courtName: "สนาม B",
      bookingDate: plusDays(seedToday, -2),
      startTime: "19:00",
      endTime: "20:30",
      customerName: "ทีมเสือดำ",
      customerPhone: "0811111111",
      teamName: "เสือดำ FC",
      playerCount: 11,
      source: "ONLINE",
      status: "COMPLETED",
      listedPrice: 1500,
      finalPrice: 1500,
      promotionSaleId: null,
      note: "",
      paymentMethod: "TRANSFER",
      paymentStatus: "PAID",
      paymentSlipDataUrl: "",
      paymentReference: "REF-FT-0002",
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      id: 5,
      courtId: 1,
      courtName: "สนาม A",
      bookingDate: plusDays(seedToday, -3),
      startTime: "21:00",
      endTime: "22:00",
      customerName: "ทีมตัวอย่าง",
      customerPhone: "0899999999",
      teamName: "Night League",
      playerCount: 10,
      source: "WALK_IN",
      status: "COMPLETED",
      listedPrice: 900,
      finalPrice: 900,
      promotionSaleId: null,
      note: "",
      paymentMethod: "ONSITE",
      paymentStatus: "PAID",
      paymentSlipDataUrl: "",
      paymentReference: "",
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
    {
      id: 6,
      courtId: 1,
      courtName: "สนาม A",
      bookingDate: plusDays(seedToday, -5),
      startTime: "18:00",
      endTime: "19:00",
      customerName: "คุณอาร์ม",
      customerPhone: "0822222222",
      teamName: "Arm United",
      playerCount: 9,
      source: "ONLINE",
      status: "COMPLETED",
      listedPrice: 900,
      finalPrice: 900,
      promotionSaleId: null,
      note: "",
      paymentMethod: "TRANSFER",
      paymentStatus: "PAID",
      paymentSlipDataUrl: "",
      paymentReference: "",
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
    {
      id: 7,
      courtId: 2,
      courtName: "สนาม B",
      bookingDate: plusDays(seedToday, -7),
      startTime: "16:00",
      endTime: "17:30",
      customerName: "ทีมเสือดำ",
      customerPhone: "0811111111",
      teamName: "เสือดำ FC",
      playerCount: 12,
      source: "ONLINE",
      status: "COMPLETED",
      listedPrice: 1500,
      finalPrice: 1350,
      promotionSaleId: null,
      note: "ส่วนลดลูกค้าประจำ",
      paymentMethod: "TRANSFER",
      paymentStatus: "PAID",
      paymentSlipDataUrl: "",
      paymentReference: "REF-FT-0007",
      createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    },
  ],
  promotions: [
    { id: 1, name: "โปร 10 รอบ", kind: "COUNT", totalUses: 10, durationMinutes: 60, price: 8000, isActive: true, note: "เหมาะกับทีมประจำ" },
    { id: 2, name: "โปร 5 รอบ 90 นาที", kind: "HOUR", totalUses: 5, durationMinutes: 90, price: 5500, isActive: true, note: "ใช้สนามใหญ่" },
  ],
  promotionSales: [
    {
      id: 1,
      promotionId: 1,
      promotionName: "โปร 10 รอบ",
      customerName: "ทีมเสือดำ",
      customerPhone: "0811111111",
      teamName: "เสือดำ FC",
      totalUses: 10,
      remainingUses: 7,
      price: 8000,
      status: "ACTIVE",
      paymentMethod: "TRANSFER",
      paymentStatus: "PAID",
      paymentSlipDataUrl: "",
      paymentReference: "PROMO-001",
      createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    },
  ],
  costCategories: [
    { id: 1, name: "ค่าน้ำค่าไฟ" },
    { id: 2, name: "ค่าดูแลสนาม" },
  ],
  incomeCategories: [
    { id: 1, name: "ค่าสนาม", kind: "COURT_RENTAL", isBuiltin: true, sortOrder: 0 },
    { id: 2, name: "โปรโมชัน", kind: "PROMOTION", isBuiltin: true, sortOrder: 1 },
    { id: 3, name: "เช่าพื้นที่ขายของ", kind: "CUSTOM", isBuiltin: false, sortOrder: 10 },
  ],
  incomeEntries: [],
  costEntries: [
    {
      id: 1,
      categoryId: 2,
      categoryName: "ค่าดูแลสนาม",
      spentAt: new Date(Date.now() - 86400000).toISOString(),
      amount: 1200,
      itemLabel: "เติมยางเม็ด + ดูแลพื้น",
      note: "ข้อมูลตัวอย่าง",
      paymentSlipUrl: "",
    },
    {
      id: 2,
      categoryId: 1,
      categoryName: "ค่าน้ำค่าไฟ",
      spentAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      amount: 850,
      itemLabel: "ค่าไฟช่วงเย็น",
      note: "ข้อมูลตัวอย่าง",
      paymentSlipUrl: "",
    },
    {
      id: 3,
      categoryId: 1,
      categoryName: "ค่าน้ำค่าไฟ",
      spentAt: new Date(Date.now() - 6 * 86400000).toISOString(),
      amount: 640,
      itemLabel: "ค่าน้ำประปา",
      note: "",
      paymentSlipUrl: "",
    },
  ],
  customers: [
    {
      id: 1,
      name: "ทีมเสือดำ",
      phone: "0811111111",
      teamName: "เสือดำ FC",
      note: "ลูกค้าประจำ · ข้อมูลตัวอย่าง",
      isActive: true,
      taxInvoiceEnabled: false,
      billingName: "",
      taxId: "",
      taxAddress: "",
      taxBranch: "",
      photoUrl: "",
    },
    {
      id: 2,
      name: "ทีมตัวอย่าง",
      phone: "0899999999",
      teamName: "Night League",
      note: "ข้อมูลตัวอย่าง",
      isActive: true,
      taxInvoiceEnabled: false,
      billingName: "",
      taxId: "",
      taxAddress: "",
      taxBranch: "",
      photoUrl: "",
    },
    {
      id: 3,
      name: "คุณอาร์ม",
      phone: "0822222222",
      teamName: "Arm United",
      note: "",
      isActive: true,
      taxInvoiceEnabled: false,
      billingName: "",
      taxId: "",
      taxAddress: "",
      taxBranch: "",
      photoUrl: "",
    },
  ],
  seq: { court: 2, booking: 7, promotion: 2, promotionSale: 1, costCategory: 2, costEntry: 3, incomeCategory: 3, incomeEntry: 0, customer: 3 },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function activeStorageKey(): string {
  return STORAGE_SCOPE_KEY ? `${STORAGE_KEY}.${STORAGE_SCOPE_KEY}` : STORAGE_KEY;
}

export function footballTurfStorageKey(ownerId: string, trialSessionId?: string | null): string {
  const scope = footballTurfStorageScope(ownerId, trialSessionId);
  return scope ? `${STORAGE_KEY}.${scope}` : STORAGE_KEY;
}

function normalizeDB(parsed: Partial<FootballTurfDB>): FootballTurfDB {
  const base = clone(seedDB);
  const merged: FootballTurfDB = {
    ...base,
    ...parsed,
    settings: { ...defaultVenueSettings(), ...(parsed.settings ?? {}) },
    courts: (parsed.courts ?? base.courts).map((item) => ({
      ...item,
      imageUrl: item.imageUrl ?? "",
    })),
    bookings: (parsed.bookings ?? base.bookings).map((item) => ({
      ...item,
      paymentMethod: item.paymentMethod ?? "UNPAID",
      paymentStatus: item.paymentStatus ?? "UNPAID",
      paymentSlipDataUrl: item.paymentSlipDataUrl ?? "",
      paymentReference: item.paymentReference ?? "",
    })),
    promotions: parsed.promotions ?? base.promotions,
    promotionSales: parsed.promotionSales ?? base.promotionSales,
    costCategories: parsed.costCategories ?? base.costCategories,
    incomeCategories: parsed.incomeCategories ?? base.incomeCategories,
    incomeEntries: parsed.incomeEntries ?? base.incomeEntries,
    costEntries: (parsed.costEntries ?? base.costEntries).map((item) => ({
      ...item,
      paymentSlipUrl: item.paymentSlipUrl ?? "",
    })),
    customers: (parsed.customers ?? deriveCustomersFromLegacy(parsed)).map((item) => ({
      ...item,
      taxInvoiceEnabled: Boolean(item.taxInvoiceEnabled),
      billingName: item.billingName ?? "",
      taxId: item.taxId ?? "",
      taxAddress: item.taxAddress ?? "",
      taxBranch: item.taxBranch ?? "",
      photoUrl: item.photoUrl ?? "",
    })),
    seq: {
      ...base.seq,
      ...(parsed.seq ?? {}),
      customer: parsed.seq?.customer ?? (parsed.customers?.length ?? deriveCustomersFromLegacy(parsed).length),
    },
  };
  return merged;
}

function deriveCustomersFromLegacy(parsed: Partial<FootballTurfDB>): FootballTurfCustomer[] {
  const map = new Map<string, FootballTurfCustomer>();
  let id = 1;
  const upsert = (phone: string, name: string, teamName: string) => {
    const key = phone.trim();
    if (!key || map.has(key)) {
      const existing = map.get(key);
      if (existing && name.trim()) existing.name = name.trim();
      if (existing && teamName.trim()) existing.teamName = teamName.trim();
      return;
    }
    map.set(key, {
      id: id++,
      name: name.trim() || key,
      phone: key,
      teamName: teamName.trim(),
      note: "",
      isActive: true,
      taxInvoiceEnabled: false,
      billingName: "",
      taxId: "",
      taxAddress: "",
      taxBranch: "",
      photoUrl: "",
    });
  };
  for (const b of parsed.bookings ?? []) upsert(b.customerPhone, b.customerName, b.teamName);
  for (const s of parsed.promotionSales ?? []) upsert(s.customerPhone, s.customerName, s.teamName);
  return [...map.values()];
}

function loadDB(): FootballTurfDB {
  try {
    const raw = localStorage.getItem(activeStorageKey());
    if (!raw) {
      localStorage.setItem(activeStorageKey(), JSON.stringify(seedDB));
      return clone(seedDB);
    }
    const parsed = JSON.parse(raw) as Partial<FootballTurfDB>;
    if (!Array.isArray(parsed.courts) || !Array.isArray(parsed.bookings) || !parsed.seq) {
      localStorage.setItem(activeStorageKey(), JSON.stringify(seedDB));
      return clone(seedDB);
    }
    const db = normalizeDB(parsed);
    db.promotionSales = db.promotionSales.map((item) => ({
      ...item,
      paymentMethod: item.paymentMethod ?? "ONSITE",
      paymentStatus: item.paymentStatus ?? "PAID",
      paymentSlipDataUrl: item.paymentSlipDataUrl ?? "",
      paymentReference: item.paymentReference ?? "",
    }));
    localStorage.setItem(activeStorageKey(), JSON.stringify(db));
    return db;
  } catch {
    localStorage.setItem(activeStorageKey(), JSON.stringify(seedDB));
    return clone(seedDB);
  }
}

function saveDB(db: FootballTurfDB) {
  localStorage.setItem(activeStorageKey(), JSON.stringify(db));
}

function upsertLocalCustomer(
  db: FootballTurfDB,
  input: {
    phone: string;
    name: string;
    teamName?: string;
    note?: string;
    taxInvoiceEnabled?: boolean;
    billingName?: string;
    taxId?: string;
    taxAddress?: string;
    taxBranch?: string;
    photoUrl?: string;
  },
) {
  const phone = input.phone.trim();
  if (!phone) return;
  const idx = db.customers.findIndex((c) => c.phone === phone);
  if (idx >= 0) {
    db.customers[idx] = {
      ...db.customers[idx],
      name: input.name.trim() || db.customers[idx].name,
      teamName: input.teamName?.trim() || db.customers[idx].teamName,
      note: input.note?.trim() || db.customers[idx].note,
      ...(input.taxInvoiceEnabled !== undefined ? { taxInvoiceEnabled: Boolean(input.taxInvoiceEnabled) } : {}),
      ...(input.billingName !== undefined ? { billingName: input.billingName.trim() } : {}),
      ...(input.taxId !== undefined ? { taxId: input.taxId.replace(/\D/g, "").slice(0, 13) } : {}),
      ...(input.taxAddress !== undefined ? { taxAddress: input.taxAddress.trim() } : {}),
      ...(input.taxBranch !== undefined ? { taxBranch: input.taxBranch.trim() } : {}),
      ...(input.photoUrl !== undefined ? { photoUrl: input.photoUrl.trim() } : {}),
    };
    return;
  }
  const row: FootballTurfCustomer = {
    id: db.seq.customer + 1,
    name: input.name.trim() || phone,
    phone,
    teamName: input.teamName?.trim() ?? "",
    note: input.note?.trim() ?? "",
    isActive: true,
    taxInvoiceEnabled: Boolean(input.taxInvoiceEnabled),
    billingName: input.billingName?.trim() ?? "",
    taxId: input.taxId?.replace(/\D/g, "").slice(0, 13) ?? "",
    taxAddress: input.taxAddress?.trim() ?? "",
    taxBranch: input.taxBranch?.trim() ?? "",
    photoUrl: input.photoUrl?.trim() ?? "",
  };
  db.seq.customer = row.id;
  db.customers.push(row);
}

export function footballTurfStorageScope(ownerId: string, trialSessionId?: string | null): string {
  const owner = ownerId.trim() || "anonymous";
  const trial = trialSessionId?.trim();
  return trial ? `${owner}.${trial}` : owner;
}

export function setFootballTurfStorageScope(scopeKey?: string) {
  STORAGE_SCOPE_KEY = scopeKey?.trim() ?? "";
}

async function apiJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const data = (await res.json().catch(() => ({}))) as { error?: string; result?: T } & T;
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
  return ("result" in data && data.result !== undefined ? data.result : data) as T;
}

class ApiFootballTurfRepository implements FootballTurfRepository {
  private cache: FootballTurfFullState | null = null;

  constructor(
    private readonly staffAuth?: { ownerId: string; trialSessionId: string; k: string } | null,
  ) {}

  private authUrl(path: string): string {
    if (!this.staffAuth) return path;
    const qs = new URLSearchParams({
      ownerId: this.staffAuth.ownerId,
      t: this.staffAuth.trialSessionId,
      k: this.staffAuth.k,
    });
    const unlock = readStoredStaffDailyUnlock("football-turf", this.staffAuth.ownerId);
    if (unlock) qs.set("du", unlock);
    return `${path}${path.includes("?") ? "&" : "?"}${qs.toString()}`;
  }

  private authInit(init?: RequestInit): RequestInit {
    if (!this.staffAuth) {
      return { ...init, credentials: init?.credentials ?? "include" };
    }
    const headerBag = new Headers(init?.headers);
    const unlockHeaders = staffDailyUnlockHeaders("football-turf", this.staffAuth.ownerId);
    for (const [key, value] of Object.entries(unlockHeaders)) {
      headerBag.set(key, value);
    }
    return {
      ...init,
      credentials: "omit",
      cache: init?.cache ?? "no-store",
      headers: headerBag,
    };
  }

  private async loadState(force = false): Promise<FootballTurfFullState> {
    if (this.cache && !force) return this.cache;
    this.cache = await apiJson<FootballTurfFullState>(
      this.authUrl("/api/football-turf/state"),
      this.authInit(),
    );
    return this.cache;
  }

  private async mutate<T>(op: string, id?: number, input?: unknown): Promise<T> {
    const result = await apiJson<T>(this.authUrl("/api/football-turf/action"), {
      ...this.authInit({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op, id, input }),
      }),
    });
    this.cache = null;
    return result;
  }

  async getSettings(): Promise<FootballTurfVenueSettings> {
    return (await this.loadState()).settings;
  }
  async updateSettings(
    patch: Partial<FootballTurfVenueSettings> & {
      staffDailyPin?: string | null;
      staffDailyPinClear?: boolean;
    },
  ): Promise<FootballTurfVenueSettings> {
    return this.mutate("updateSettings", undefined, patch);
  }
  async listCourts(): Promise<FootballTurfCourt[]> {
    return (await this.loadState()).courts;
  }
  async createCourt(input: Omit<FootballTurfCourt, "id">): Promise<FootballTurfCourt> {
    return this.mutate("createCourt", undefined, input);
  }
  async updateCourt(id: number, patch: Partial<Omit<FootballTurfCourt, "id">>): Promise<FootballTurfCourt | null> {
    return this.mutate("updateCourt", id, patch);
  }
  async deleteCourt(id: number): Promise<boolean> {
    const result = await this.mutate<{ deleted: boolean }>("deleteCourt", id);
    return result.deleted;
  }
  async listBookings(): Promise<FootballTurfBooking[]> {
    return (await this.loadState()).bookings;
  }
  async createBooking(
    input: Omit<FootballTurfBooking, "id" | "createdAt"> & { createdAt?: string },
  ): Promise<FootballTurfBooking> {
    return this.mutate("createBooking", undefined, input);
  }
  async updateBooking(
    id: number,
    patch: Partial<Omit<FootballTurfBooking, "id" | "createdAt">>,
  ): Promise<FootballTurfBooking | null> {
    return this.mutate("updateBooking", id, patch);
  }
  async deleteBooking(id: number): Promise<boolean> {
    const result = await this.mutate<{ deleted: boolean }>("deleteBooking", id);
    return result.deleted;
  }
  async listPromotions(): Promise<FootballTurfPromotion[]> {
    return (await this.loadState()).promotions;
  }
  async createPromotion(input: Omit<FootballTurfPromotion, "id">): Promise<FootballTurfPromotion> {
    return this.mutate("createPromotion", undefined, input);
  }
  async updatePromotion(
    id: number,
    patch: Partial<Omit<FootballTurfPromotion, "id">>,
  ): Promise<FootballTurfPromotion | null> {
    return this.mutate("updatePromotion", id, patch);
  }
  async deletePromotion(id: number): Promise<boolean> {
    const result = await this.mutate<{ deleted: boolean }>("deletePromotion", id);
    return result.deleted;
  }
  async listPromotionSales(): Promise<FootballTurfPromotionSale[]> {
    return (await this.loadState()).promotionSales;
  }
  async createPromotionSale(
    input: Omit<FootballTurfPromotionSale, "id" | "createdAt" | "remainingUses" | "status">,
  ): Promise<FootballTurfPromotionSale> {
    return this.mutate("createPromotionSale", undefined, input);
  }
  async updatePromotionSale(
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
  ): Promise<FootballTurfPromotionSale | null> {
    return this.mutate("updatePromotionSale", id, patch);
  }
  async deletePromotionSale(id: number): Promise<boolean> {
    const result = await this.mutate<{ deleted: boolean }>("deletePromotionSale", id);
    return result.deleted;
  }
  async usePromotionSale(saleId: number, bookingId: number): Promise<FootballTurfPromotionSale | null> {
    return this.mutate("usePromotionSale", saleId, { bookingId });
  }
  async listCostCategories(): Promise<FootballTurfCostCategory[]> {
    return (await this.loadState()).costCategories;
  }
  async createCostCategory(name: string): Promise<FootballTurfCostCategory> {
    return this.mutate("createCostCategory", undefined, { name });
  }
  async updateCostCategory(id: number, name: string): Promise<FootballTurfCostCategory | null> {
    return this.mutate("updateCostCategory", id, { name });
  }
  async deleteCostCategory(id: number): Promise<boolean> {
    const result = await this.mutate<{ deleted: boolean }>("deleteCostCategory", id);
    return result.deleted;
  }
  async listCostEntries(): Promise<FootballTurfCostEntry[]> {
    return (await this.loadState()).costEntries;
  }
  async createCostEntry(
    input: Omit<FootballTurfCostEntry, "id" | "categoryName">,
  ): Promise<FootballTurfCostEntry> {
    return this.mutate("createCostEntry", undefined, input);
  }
  async updateCostEntry(
    id: number,
    patch: Partial<Omit<FootballTurfCostEntry, "id" | "categoryName">>,
  ): Promise<FootballTurfCostEntry | null> {
    return this.mutate("updateCostEntry", id, patch);
  }
  async deleteCostEntry(id: number): Promise<boolean> {
    const result = await this.mutate<{ deleted: boolean }>("deleteCostEntry", id);
    return result.deleted;
  }

  async listIncomeCategories(): Promise<FootballTurfIncomeCategory[]> {
    return (await this.loadState()).incomeCategories;
  }
  async createIncomeCategory(name: string): Promise<FootballTurfIncomeCategory> {
    return this.mutate("createIncomeCategory", undefined, { name });
  }
  async updateIncomeCategory(id: number, name: string): Promise<FootballTurfIncomeCategory | null> {
    return this.mutate("updateIncomeCategory", id, { name });
  }
  async deleteIncomeCategory(id: number): Promise<boolean> {
    const result = await this.mutate<{ deleted: boolean }>("deleteIncomeCategory", id);
    return result.deleted;
  }
  async listIncomeEntries(): Promise<FootballTurfIncomeEntry[]> {
    return (await this.loadState()).incomeEntries;
  }
  async createIncomeEntry(
    input: Omit<FootballTurfIncomeEntry, "id" | "categoryName">,
  ): Promise<FootballTurfIncomeEntry> {
    return this.mutate("createIncomeEntry", undefined, input);
  }
  async updateIncomeEntry(
    id: number,
    patch: Partial<Omit<FootballTurfIncomeEntry, "id" | "categoryName">>,
  ): Promise<FootballTurfIncomeEntry | null> {
    return this.mutate("updateIncomeEntry", id, patch);
  }
  async deleteIncomeEntry(id: number): Promise<boolean> {
    const result = await this.mutate<{ deleted: boolean }>("deleteIncomeEntry", id);
    return result.deleted;
  }
  async listRevenueEntries() {
    const state = await this.loadState();
    const bookingRows: FootballTurfRevenueEntry[] = state.bookings
      .filter((item) => item.status !== "CANCELLED" && item.finalPrice > 0)
      .map((item) => ({
        id: `booking-${item.id}`,
        paidAt: item.createdAt,
        amount: item.finalPrice,
        label: `${item.courtName} · ${item.startTime}-${item.endTime}`,
        customerName: item.customerName,
        customerPhone: item.customerPhone,
        source: "BOOKING",
      }));
    const promotionRows: FootballTurfRevenueEntry[] = state.promotionSales
      .filter((item) => (item.paymentStatus ?? "PAID") === "PAID" && item.price > 0)
      .map((item) => ({
      id: `promotion-${item.id}`,
      paidAt: item.createdAt,
      amount: item.price,
      label: item.promotionName,
      customerName: item.customerName,
      customerPhone: item.customerPhone,
      source: "PROMOTION",
    }));
    const incomeRows: FootballTurfRevenueEntry[] = (state.incomeEntries ?? []).map((item) => ({
      id: `income-${item.id}`,
      paidAt: item.earnedAt,
      amount: item.amount,
      label: item.itemLabel || item.categoryName,
      customerName: "",
      customerPhone: "",
      source: "INCOME",
    }));
    return [...bookingRows, ...promotionRows, ...incomeRows].sort(
      (a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime(),
    );
  }
  async listCustomers(): Promise<FootballTurfCustomer[]> {
    return (await this.loadState()).customers;
  }
  async createCustomer(input: Omit<FootballTurfCustomer, "id">): Promise<FootballTurfCustomer> {
    return this.mutate("createCustomer", undefined, input);
  }
  async updateCustomer(
    id: number,
    patch: Partial<Omit<FootballTurfCustomer, "id">>,
  ): Promise<FootballTurfCustomer | null> {
    return this.mutate("updateCustomer", id, patch);
  }
  async deleteCustomer(id: number): Promise<boolean> {
    const result = await this.mutate<{ deleted: boolean }>("deleteCustomer", id);
    return result.deleted;
  }
}

class PublicApiFootballTurfRepository implements FootballTurfRepository {
  private cache: Partial<FootballTurfFullState> | null = null;

  constructor(
    private readonly ownerId: string,
    private readonly trialSessionId?: string | null,
  ) {}

  private trialQuery() {
    const t = this.trialSessionId?.trim();
    return t ? `&t=${encodeURIComponent(t)}` : "";
  }

  private async loadPublicState(force = false) {
    if (this.cache && !force) return this.cache;
    this.cache = await apiJson<Partial<FootballTurfFullState>>(
      `/api/football-turf/public/state?ownerId=${encodeURIComponent(this.ownerId)}${this.trialQuery()}`,
    );
    return this.cache;
  }

  private async publicMutate<T>(op: string, id?: number, input?: unknown): Promise<T> {
    const result = await apiJson<T>("/api/football-turf/public/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ownerId: this.ownerId,
        trialSessionId: this.trialSessionId ?? undefined,
        op,
        id,
        input,
      }),
    });
    this.cache = null;
    return result;
  }

  private unsupported(): never {
    throw new Error("Operation not supported on public football-turf API");
  }

  async getSettings(): Promise<FootballTurfVenueSettings> {
    return (await this.loadPublicState()).settings ?? defaultVenueSettings();
  }
  async updateSettings(): Promise<FootballTurfVenueSettings> {
    return this.unsupported();
  }
  async listCourts(): Promise<FootballTurfCourt[]> {
    return (await this.loadPublicState()).courts ?? [];
  }
  async createCourt(): Promise<FootballTurfCourt> {
    return this.unsupported();
  }
  async updateCourt(): Promise<FootballTurfCourt | null> {
    return this.unsupported();
  }
  async deleteCourt(): Promise<boolean> {
    return this.unsupported();
  }
  async listBookings(): Promise<FootballTurfBooking[]> {
    return (await this.loadPublicState()).bookings ?? [];
  }
  async createBooking(
    input: Omit<FootballTurfBooking, "id" | "createdAt"> & { createdAt?: string },
  ): Promise<FootballTurfBooking> {
    return this.publicMutate("createBooking", undefined, input);
  }
  async updateBooking(
    id: number,
    patch: Partial<Omit<FootballTurfBooking, "id" | "createdAt">>,
  ): Promise<FootballTurfBooking | null> {
    return this.publicMutate("updateBooking", id, patch);
  }
  async deleteBooking(): Promise<boolean> {
    return this.unsupported();
  }
  async listPromotions(): Promise<FootballTurfPromotion[]> {
    return (await this.loadPublicState()).promotions ?? [];
  }
  async createPromotion(): Promise<FootballTurfPromotion> {
    return this.unsupported();
  }
  async updatePromotion(): Promise<FootballTurfPromotion | null> {
    return this.unsupported();
  }
  async deletePromotion(): Promise<boolean> {
    return this.unsupported();
  }
  async listPromotionSales(): Promise<FootballTurfPromotionSale[]> {
    return (await this.loadPublicState()).promotionSales ?? [];
  }
  async createPromotionSale(): Promise<FootballTurfPromotionSale> {
    return this.unsupported();
  }
  async updatePromotionSale(): Promise<FootballTurfPromotionSale | null> {
    return this.unsupported();
  }
  async deletePromotionSale(): Promise<boolean> {
    return this.unsupported();
  }
  async usePromotionSale(saleId: number, bookingId: number): Promise<FootballTurfPromotionSale | null> {
    return this.publicMutate("usePromotionSale", saleId, { bookingId });
  }
  async listCostCategories(): Promise<FootballTurfCostCategory[]> {
    return [];
  }
  async createCostCategory(): Promise<FootballTurfCostCategory> {
    return this.unsupported();
  }
  async updateCostCategory(): Promise<FootballTurfCostCategory | null> {
    return this.unsupported();
  }
  async deleteCostCategory(): Promise<boolean> {
    return this.unsupported();
  }
  async listCostEntries(): Promise<FootballTurfCostEntry[]> {
    return [];
  }
  async createCostEntry(): Promise<FootballTurfCostEntry> {
    return this.unsupported();
  }
  async updateCostEntry(): Promise<FootballTurfCostEntry | null> {
    return this.unsupported();
  }
  async deleteCostEntry(): Promise<boolean> {
    return this.unsupported();
  }
  async listIncomeCategories(): Promise<FootballTurfIncomeCategory[]> {
    return [];
  }
  async createIncomeCategory(): Promise<FootballTurfIncomeCategory> {
    return this.unsupported();
  }
  async updateIncomeCategory(): Promise<FootballTurfIncomeCategory | null> {
    return this.unsupported();
  }
  async deleteIncomeCategory(): Promise<boolean> {
    return this.unsupported();
  }
  async listIncomeEntries(): Promise<FootballTurfIncomeEntry[]> {
    return [];
  }
  async createIncomeEntry(): Promise<FootballTurfIncomeEntry> {
    return this.unsupported();
  }
  async updateIncomeEntry(): Promise<FootballTurfIncomeEntry | null> {
    return this.unsupported();
  }
  async deleteIncomeEntry(): Promise<boolean> {
    return this.unsupported();
  }
  async listRevenueEntries(): Promise<FootballTurfRevenueEntry[]> {
    return [];
  }
  async listCustomers(): Promise<FootballTurfCustomer[]> {
    return [];
  }
  async createCustomer(): Promise<FootballTurfCustomer> {
    return this.unsupported();
  }
  async updateCustomer(): Promise<FootballTurfCustomer | null> {
    return this.unsupported();
  }
  async deleteCustomer(): Promise<boolean> {
    return this.unsupported();
  }
}

export class LocalStorageFootballTurfRepository implements FootballTurfRepository {
  async getSettings() {
    return loadDB().settings;
  }
  async updateSettings(
    patch: Partial<FootballTurfVenueSettings> & {
      staffDailyPin?: string | null;
      staffDailyPinClear?: boolean;
    },
  ) {
    const db = loadDB();
    const { staffDailyPin, staffDailyPinClear, ...rest } = patch;
    db.settings = { ...db.settings, ...rest };
    if (staffDailyPinClear) {
      db.settings.staffDailyPinSet = false;
    } else if (typeof staffDailyPin === "string" && staffDailyPin.trim()) {
      db.settings.staffDailyPinSet = true;
    }
    saveDB(db);
    return db.settings;
  }
  async listCourts() {
    return loadDB().courts.sort((a, b) => a.id - b.id);
  }
  async createCourt(input: Omit<FootballTurfCourt, "id">) {
    const db = loadDB();
    const row = { ...input, id: db.seq.court + 1 };
    db.seq.court = row.id;
    db.courts.push(row);
    saveDB(db);
    return row;
  }
  async updateCourt(id: number, patch: Partial<Omit<FootballTurfCourt, "id">>) {
    const db = loadDB();
    const idx = db.courts.findIndex((x) => x.id === id);
    if (idx < 0) return null;
    db.courts[idx] = { ...db.courts[idx], ...patch };
    saveDB(db);
    return db.courts[idx];
  }
  async deleteCourt(id: number) {
    const db = loadDB();
    const hasBookings = db.bookings.some((b) => b.courtId === id);
    if (hasBookings) {
      const idx = db.courts.findIndex((x) => x.id === id);
      if (idx < 0) return false;
      db.courts[idx] = { ...db.courts[idx], isActive: false };
      saveDB(db);
      return true;
    }
    const prev = db.courts.length;
    db.courts = db.courts.filter((x) => x.id !== id);
    saveDB(db);
    return prev !== db.courts.length;
  }
  async listBookings() {
    return loadDB().bookings.sort((a, b) => `${b.bookingDate}${b.startTime}`.localeCompare(`${a.bookingDate}${a.startTime}`));
  }
  async createBooking(input: Omit<FootballTurfBooking, "id" | "createdAt"> & { createdAt?: string }) {
    const db = loadDB();
    const startMin = timeToMinutes(input.startTime);
    const endMin = timeToMinutes(input.endTime);
    const conflict = db.bookings.some((b) => {
      if (b.courtId !== input.courtId || b.bookingDate !== input.bookingDate || b.status === "CANCELLED") {
        return false;
      }
      return timeToMinutes(b.startTime) < endMin && timeToMinutes(b.endTime) > startMin;
    });
    if (conflict) throw new Error("ช่วงเวลานี้ถูกจองแล้ว");

    const finalPrice = Math.max(0, Math.round(Number(input.finalPrice ?? 0)));
    let amountPaidBaht = Math.max(0, Math.round(Number(input.amountPaidBaht ?? 0)));
    let paymentStatus = input.paymentStatus ?? "UNPAID";
    if (paymentStatus === "PAID" && amountPaidBaht <= 0) amountPaidBaht = finalPrice;
    if (input.source === "WALK_IN" && amountPaidBaht < finalPrice) {
      throw new Error("walk-in เช็กอินหน้างานต้องชำระเต็มยอด");
    }

    upsertLocalCustomer(db, {
      phone: input.customerPhone,
      name: input.customerName,
      teamName: input.teamName,
      note: input.note,
    });
    const row = {
      ...input,
      finalPrice,
      amountPaidBaht,
      paymentStatus,
      id: db.seq.booking + 1,
      createdAt: input.createdAt ?? new Date().toISOString(),
    };
    db.seq.booking = row.id;
    db.bookings.push(row);
    saveDB(db);
    return row;
  }
  async updateBooking(id: number, patch: Partial<Omit<FootballTurfBooking, "id" | "createdAt">>) {
    const db = loadDB();
    const idx = db.bookings.findIndex((x) => x.id === id);
    if (idx < 0) return null;
    const existing = db.bookings[idx];
    if (patch.status === "CHECKED_IN" || patch.status === "PLAYING") {
      const next = { ...existing, ...patch };
      if (!footballTurfBookingIsFullyPaid(next)) {
        throw new Error("ต้องชำระเต็มยอดก่อนเช็กอิน");
      }
    }
    const nextPatch = { ...patch };
    if (patch.paymentStatus === "PAID" && patch.amountPaidBaht === undefined) {
      const currentPaid = existing.amountPaidBaht ?? 0;
      if (currentPaid < existing.finalPrice) {
        nextPatch.amountPaidBaht = existing.finalPrice;
      }
    }
    db.bookings[idx] = { ...existing, ...nextPatch };
    if (patch.customerPhone || patch.customerName) {
      upsertLocalCustomer(db, {
        phone: patch.customerPhone ?? db.bookings[idx].customerPhone,
        name: patch.customerName ?? db.bookings[idx].customerName,
        teamName: patch.teamName ?? db.bookings[idx].teamName,
        note: patch.note ?? db.bookings[idx].note,
      });
    }
    if (patch.status === "CHECKED_IN" || patch.status === "PLAYING" || patch.status === "COMPLETED") {
      for (let i = 0; i < db.bookings.length; i += 1) {
        const item = db.bookings[i];
        if (item.id === id) continue;
        if (item.courtId !== existing.courtId || item.bookingDate !== existing.bookingDate) continue;
        if (!sameFootballTurfCustomer(existing, item)) continue;
        if (patch.status === "COMPLETED") {
          if (item.status === "BOOKED" || item.status === "CHECKED_IN" || item.status === "PLAYING") {
            db.bookings[i] = { ...item, status: "COMPLETED" };
          }
        } else if (item.status === "BOOKED") {
          db.bookings[i] = { ...item, status: "CHECKED_IN" };
        }
      }
    }
    saveDB(db);
    return db.bookings[idx];
  }
  async deleteBooking(id: number) {
    const db = loadDB();
    const prev = db.bookings.length;
    db.bookings = db.bookings.filter((x) => x.id !== id);
    saveDB(db);
    return prev !== db.bookings.length;
  }
  async listPromotions() {
    return loadDB().promotions.sort((a, b) => a.id - b.id);
  }
  async createPromotion(input: Omit<FootballTurfPromotion, "id">) {
    const db = loadDB();
    const row = { ...input, id: db.seq.promotion + 1 };
    db.seq.promotion = row.id;
    db.promotions.push(row);
    saveDB(db);
    return row;
  }
  async updatePromotion(id: number, patch: Partial<Omit<FootballTurfPromotion, "id">>) {
    const db = loadDB();
    const idx = db.promotions.findIndex((x) => x.id === id);
    if (idx < 0) return null;
    db.promotions[idx] = { ...db.promotions[idx], ...patch };
    saveDB(db);
    return db.promotions[idx];
  }
  async deletePromotion(id: number) {
    const db = loadDB();
    const hasSales = db.promotionSales.some((s) => s.promotionId === id);
    if (hasSales) {
      const idx = db.promotions.findIndex((x) => x.id === id);
      if (idx < 0) return false;
      db.promotions[idx] = { ...db.promotions[idx], isActive: false };
      saveDB(db);
      return true;
    }
    const prev = db.promotions.length;
    db.promotions = db.promotions.filter((x) => x.id !== id);
    saveDB(db);
    return prev !== db.promotions.length;
  }
  async listPromotionSales() {
    return loadDB().promotionSales.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  async createPromotionSale(input: Omit<FootballTurfPromotionSale, "id" | "createdAt" | "remainingUses" | "status">) {
    const db = loadDB();
    upsertLocalCustomer(db, {
      phone: input.customerPhone,
      name: input.customerName,
      teamName: input.teamName,
    });
    const row: FootballTurfPromotionSale = {
      ...input,
      id: db.seq.promotionSale + 1,
      remainingUses: input.totalUses,
      status: "ACTIVE",
      paymentMethod: input.paymentMethod ?? "ONSITE",
      paymentStatus: input.paymentStatus ?? "PAID",
      paymentSlipDataUrl: input.paymentSlipDataUrl ?? "",
      paymentReference: input.paymentReference ?? "",
      createdAt: new Date().toISOString(),
    };
    db.seq.promotionSale = row.id;
    db.promotionSales.push(row);
    saveDB(db);
    return row;
  }
  async updatePromotionSale(
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
  ) {
    const db = loadDB();
    const idx = db.promotionSales.findIndex((x) => x.id === id);
    if (idx < 0) return null;
    db.promotionSales[idx] = { ...db.promotionSales[idx], ...patch };
    saveDB(db);
    return db.promotionSales[idx];
  }
  async deletePromotionSale(id: number) {
    const db = loadDB();
    const prev = db.promotionSales.length;
    db.promotionSales = db.promotionSales.filter((x) => x.id !== id);
    db.bookings = db.bookings.map((b) => (b.promotionSaleId === id ? { ...b, promotionSaleId: null } : b));
    saveDB(db);
    return prev !== db.promotionSales.length;
  }
  async usePromotionSale(saleId: number, bookingId: number) {
    const db = loadDB();
    const saleIdx = db.promotionSales.findIndex((x) => x.id === saleId);
    const bookingIdx = db.bookings.findIndex((x) => x.id === bookingId);
    if (saleIdx < 0 || bookingIdx < 0) return null;
    const sale = db.promotionSales[saleIdx];
    const booking = db.bookings[bookingIdx];
    if (sale.status !== "ACTIVE" || sale.remainingUses <= 0) return null;
    if (booking.status === "CANCELLED" || booking.promotionSaleId) return null;
    sale.remainingUses -= 1;
    sale.status = sale.remainingUses > 0 ? "ACTIVE" : "USED_UP";
    db.bookings[bookingIdx] = { ...booking, promotionSaleId: sale.id, finalPrice: 0 };
    saveDB(db);
    return sale;
  }
  async listCostCategories() {
    return loadDB().costCategories.sort((a, b) => a.id - b.id);
  }
  async createCostCategory(name: string) {
    const db = loadDB();
    const row = { id: db.seq.costCategory + 1, name: name.trim() };
    db.seq.costCategory = row.id;
    db.costCategories.push(row);
    saveDB(db);
    return row;
  }
  async updateCostCategory(id: number, name: string) {
    const db = loadDB();
    const idx = db.costCategories.findIndex((x) => x.id === id);
    if (idx < 0) return null;
    db.costCategories[idx] = { ...db.costCategories[idx], name: name.trim() };
    saveDB(db);
    return db.costCategories[idx];
  }
  async deleteCostCategory(id: number) {
    const db = loadDB();
    if (db.costEntries.some((x) => x.categoryId === id)) {
      throw new Error("มีรายจ่ายในหมวดนี้ — ย้ายหรือลบรายจ่ายก่อน");
    }
    const prev = db.costCategories.length;
    db.costCategories = db.costCategories.filter((x) => x.id !== id);
    saveDB(db);
    return prev !== db.costCategories.length;
  }
  async listCostEntries() {
    return loadDB().costEntries.sort((a, b) => new Date(b.spentAt).getTime() - new Date(a.spentAt).getTime());
  }
  async createCostEntry(input: Omit<FootballTurfCostEntry, "id" | "categoryName">) {
    const db = loadDB();
    const categoryName = db.costCategories.find((x) => x.id === input.categoryId)?.name ?? "ไม่ระบุหมวด";
    const row = {
      ...input,
      paymentSlipUrl: input.paymentSlipUrl ?? "",
      id: db.seq.costEntry + 1,
      categoryName,
    };
    db.seq.costEntry = row.id;
    db.costEntries.push(row);
    saveDB(db);
    return row;
  }
  async updateCostEntry(id: number, patch: Partial<Omit<FootballTurfCostEntry, "id" | "categoryName">>) {
    const db = loadDB();
    const idx = db.costEntries.findIndex((x) => x.id === id);
    if (idx < 0) return null;
    const next = { ...db.costEntries[idx], ...patch };
    if (patch.categoryId !== undefined) {
      next.categoryName = db.costCategories.find((x) => x.id === patch.categoryId)?.name ?? next.categoryName;
    }
    db.costEntries[idx] = next;
    saveDB(db);
    return db.costEntries[idx];
  }
  async deleteCostEntry(id: number) {
    const db = loadDB();
    const prev = db.costEntries.length;
    db.costEntries = db.costEntries.filter((x) => x.id !== id);
    saveDB(db);
    return prev !== db.costEntries.length;
  }

  async listIncomeCategories() {
    return loadDB().incomeCategories.sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
  }
  async createIncomeCategory(name: string) {
    const db = loadDB();
    const trimmed = name.trim();
    if (trimmed.length < 2) throw new Error("ตั้งชื่อหมวดอย่างน้อย 2 ตัวอักษร");
    const sortOrder = Math.max(0, ...db.incomeCategories.map((c) => c.sortOrder)) + 1;
    const row = {
      id: db.seq.incomeCategory + 1,
      name: trimmed,
      kind: "CUSTOM" as const,
      isBuiltin: false,
      sortOrder,
    };
    db.seq.incomeCategory = row.id;
    db.incomeCategories.push(row);
    saveDB(db);
    return row;
  }
  async updateIncomeCategory(id: number, name: string) {
    const db = loadDB();
    const idx = db.incomeCategories.findIndex((x) => x.id === id);
    if (idx < 0) return null;
    const current = db.incomeCategories[idx];
    if (current.isBuiltin || current.kind !== "CUSTOM") {
      throw new Error("หมวดรายรับหลักแก้ชื่อไม่ได้");
    }
    db.incomeCategories[idx] = { ...current, name: name.trim() };
    saveDB(db);
    return db.incomeCategories[idx];
  }
  async deleteIncomeCategory(id: number) {
    const db = loadDB();
    const cat = db.incomeCategories.find((x) => x.id === id);
    if (!cat) return false;
    if (cat.isBuiltin || cat.kind !== "CUSTOM") throw new Error("หมวดรายรับหลักลบไม่ได้");
    if (db.incomeEntries.some((x) => x.categoryId === id)) {
      throw new Error("มีรายรับในหมวดนี้ — ย้ายหรือลบรายรับก่อน");
    }
    const prev = db.incomeCategories.length;
    db.incomeCategories = db.incomeCategories.filter((x) => x.id !== id);
    saveDB(db);
    return prev !== db.incomeCategories.length;
  }
  async listIncomeEntries() {
    return loadDB().incomeEntries.sort((a, b) => new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime());
  }
  async createIncomeEntry(input: Omit<FootballTurfIncomeEntry, "id" | "categoryName">) {
    const db = loadDB();
    const category = db.incomeCategories.find((x) => x.id === input.categoryId);
    if (!category || category.kind !== "CUSTOM") throw new Error("เลือกหมวดที่บันทึกมือได้เท่านั้น");
    const row = {
      ...input,
      paymentSlipUrl: input.paymentSlipUrl ?? "",
      id: db.seq.incomeEntry + 1,
      categoryName: category.name,
    };
    db.seq.incomeEntry = row.id;
    db.incomeEntries.push(row);
    saveDB(db);
    return row;
  }
  async updateIncomeEntry(id: number, patch: Partial<Omit<FootballTurfIncomeEntry, "id" | "categoryName">>) {
    const db = loadDB();
    const idx = db.incomeEntries.findIndex((x) => x.id === id);
    if (idx < 0) return null;
    const next = { ...db.incomeEntries[idx], ...patch };
    if (patch.categoryId !== undefined) {
      const category = db.incomeCategories.find((x) => x.id === patch.categoryId);
      if (!category || category.kind !== "CUSTOM") throw new Error("เลือกหมวดที่บันทึกมือได้เท่านั้น");
      next.categoryName = category.name;
    }
    db.incomeEntries[idx] = next;
    saveDB(db);
    return db.incomeEntries[idx];
  }
  async deleteIncomeEntry(id: number) {
    const db = loadDB();
    const prev = db.incomeEntries.length;
    db.incomeEntries = db.incomeEntries.filter((x) => x.id !== id);
    saveDB(db);
    return prev !== db.incomeEntries.length;
  }

  async listRevenueEntries() {
    const db = loadDB();
    const bookingRows: FootballTurfRevenueEntry[] = db.bookings
      .filter((item) => item.status !== "CANCELLED" && item.finalPrice > 0)
      .map((item) => ({
        id: `booking-${item.id}`,
        paidAt: item.createdAt,
        amount: item.finalPrice,
        label: `${item.courtName} · ${item.startTime}-${item.endTime}`,
        customerName: item.customerName,
        customerPhone: item.customerPhone,
        source: "BOOKING",
      }));
    const promotionRows: FootballTurfRevenueEntry[] = db.promotionSales
      .filter((item) => (item.paymentStatus ?? "PAID") === "PAID" && item.price > 0)
      .map((item) => ({
      id: `promotion-${item.id}`,
      paidAt: item.createdAt,
      amount: item.price,
      label: item.promotionName,
      customerName: item.customerName,
      customerPhone: item.customerPhone,
      source: "PROMOTION",
    }));
    const incomeRows: FootballTurfRevenueEntry[] = db.incomeEntries.map((item) => ({
      id: `income-${item.id}`,
      paidAt: item.earnedAt,
      amount: item.amount,
      label: item.itemLabel || item.categoryName,
      customerName: "",
      customerPhone: "",
      source: "INCOME",
    }));
    return [...bookingRows, ...promotionRows, ...incomeRows].sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime());
  }
  async listCustomers() {
    return loadDB().customers.sort((a, b) => a.id - b.id);
  }
  async createCustomer(input: Omit<FootballTurfCustomer, "id">) {
    const db = loadDB();
    upsertLocalCustomer(db, input);
    saveDB(db);
    const row = db.customers.find((c) => c.phone === input.phone.trim());
    if (!row) throw new Error("createCustomer failed");
    return row;
  }
  async updateCustomer(id: number, patch: Partial<Omit<FootballTurfCustomer, "id">>) {
    const db = loadDB();
    const idx = db.customers.findIndex((x) => x.id === id);
    if (idx < 0) return null;
    db.customers[idx] = { ...db.customers[idx], ...patch };
    saveDB(db);
    return db.customers[idx];
  }
  async deleteCustomer(id: number) {
    const db = loadDB();
    const prev = db.customers.length;
    db.customers = db.customers.filter((x) => x.id !== id);
    saveDB(db);
    return prev !== db.customers.length;
  }
}

export function createFootballTurfRepository(opts?: {
  mode?: "api" | "storage" | "public";
  ownerId?: string;
  trialSessionId?: string | null;
  staffAuth?: { ownerId: string; trialSessionId: string; k: string } | null;
}): FootballTurfRepository {
  const mode = opts?.mode ?? (typeof window !== "undefined" ? "api" : "storage");
  if (mode === "storage") return new LocalStorageFootballTurfRepository();
  if (mode === "public") {
    if (!opts?.ownerId) throw new Error("ownerId required for public football-turf repository");
    return new PublicApiFootballTurfRepository(opts.ownerId, opts.trialSessionId);
  }
  return new ApiFootballTurfRepository(opts?.staffAuth ?? null);
}
