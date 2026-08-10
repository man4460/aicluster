import { persistFootballTurfCourtImageUrl, persistFootballTurfCustomerPhotoUrl, persistFootballTurfLogoUrl, persistFootballTurfSlipUrl } from "@/systems/football-turf/lib/persist-slip";
import { sameFootballTurfCustomer } from "@/systems/football-turf/lib/booking-session";
import {
  applyFootballTurfLoyaltyEarnOnBookingPaid,
  applyFootballTurfLoyaltyEarnOnPromotionSalePaid,
} from "@/systems/football-turf/lib/loyalty";
import { prisma } from "@/lib/prisma";
import { normalizeMemberPhone } from "@/lib/loyalty-stamp/member-qr";
import {
  formatBookingDate,
  mapBooking,
  mapCostCategory,
  mapCostEntry,
  mapCourt,
  mapCustomer,
  mapIncomeCategory,
  mapIncomeEntry,
  mapProfileToSettings,
  mapPromotion,
  mapPromotionSale,
  parseBookingDate,
} from "@/systems/football-turf/lib/mappers";
import { ensureFootballTurfIncomeCategories } from "@/systems/football-turf/lib/ensure-income-categories";
import {
  applyStaffDailyPinPatch,
  loadFootballTurfStaffDailyPinHash,
} from "@/lib/modules/staff-daily-pin-store";
import {
  footballTurfBookingIsFullyPaid,
  footballTurfComputePortalPayDue,
  footballTurfCourtPriceForDate,
  footballTurfPortalSlipProofMessage,
} from "@/systems/football-turf/lib/portal-booking";
import { footballTurfNormalizePortalGallery } from "@/systems/football-turf/lib/portal-media";
import {
  isSlotEligibleForAdvanceBooking,
  isSlotEligibleForWalkIn,
  localDateKey,
  localNowMinutes,
  minutesToTime,
  timeToMinutes,
} from "@/systems/football-turf/lib/time-queue";
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
  FootballTurfRevenueEntry,
  FootballTurfVenueSettings,
} from "@/systems/football-turf/lib/types";

type Scope = { ownerUserId: string; trialSessionId: string };

function scopeWhere(scope: Scope) {
  return { ownerUserId: scope.ownerUserId, trialSessionId: scope.trialSessionId };
}

function buildCourtTimelineForValidation(
  court: { openTime: string; closeTime: string; slotMinutes: number },
  courtBookings: Array<{ startTime: string; endTime: string; status: string }>,
) {
  const start = timeToMinutes(court.openTime);
  const end = timeToMinutes(court.closeTime);
  const slots: Array<{ startTime: string; endTime: string; booking: unknown }> = [];
  for (let minute = start; minute < end; minute += court.slotMinutes) {
    const slotStart = minute;
    const slotEnd = Math.min(minute + court.slotMinutes, end);
    const booking =
      courtBookings.find((item) => {
        if (item.status === "CANCELLED") return false;
        const bookingStart = timeToMinutes(item.startTime);
        const bookingEnd = timeToMinutes(item.endTime);
        return bookingStart < slotEnd && bookingEnd > slotStart;
      }) ?? null;
    slots.push({
      startTime: minutesToTime(slotStart),
      endTime: minutesToTime(slotEnd),
      booking,
    });
  }
  return slots;
}

async function upsertCustomerByPhone(
  scope: Scope,
  input: { phone: string; name: string; teamName?: string; note?: string },
) {
  const phone = normalizeMemberPhone(input.phone);
  if (phone.length < 9) return;
  await prisma.footballTurfCustomer.upsert({
    where: {
      ownerUserId_trialSessionId_phone: {
        ownerUserId: scope.ownerUserId,
        trialSessionId: scope.trialSessionId,
        phone,
      },
    },
    create: {
      ownerUserId: scope.ownerUserId,
      trialSessionId: scope.trialSessionId,
      phone,
      name: input.name.trim(),
      teamName: input.teamName?.trim() ?? "",
      note: input.note?.trim() ?? "",
      isActive: true,
    },
    update: {
      ...(input.name.trim() ? { name: input.name.trim() } : {}),
      ...(input.teamName?.trim() ? { teamName: input.teamName.trim() } : {}),
      ...(input.note?.trim() ? { note: input.note.trim() } : {}),
    },
  });
}

export class FootballTurfServerRepo {
  constructor(
    private readonly ownerUserId: string,
    private readonly trialSessionId: string,
  ) {}

  private scope(): Scope {
    return { ownerUserId: this.ownerUserId, trialSessionId: this.trialSessionId };
  }

  async loadFullState(): Promise<FootballTurfFullState> {
    const scope = this.scope();
    await ensureFootballTurfIncomeCategories(scope.ownerUserId, scope.trialSessionId);
    const where = scopeWhere(scope);
    const [
      profile,
      courts,
      bookings,
      promotions,
      promotionSales,
      costCategories,
      costEntries,
      incomeCategories,
      incomeEntries,
    ] = await Promise.all([
      prisma.footballTurfShopProfile.findUniqueOrThrow({
        where: { ownerUserId_trialSessionId: { ownerUserId: scope.ownerUserId, trialSessionId: scope.trialSessionId } },
      }),
      prisma.footballTurfCourt.findMany({ where, orderBy: [{ sortOrder: "asc" }, { id: "asc" }] }),
      prisma.footballTurfBooking.findMany({
        where,
        include: { court: { select: { name: true } } },
        orderBy: [{ bookingDate: "desc" }, { startTime: "desc" }],
      }),
      prisma.footballTurfPromotion.findMany({ where, orderBy: { id: "asc" } }),
      prisma.footballTurfPromotionSale.findMany({ where, orderBy: { createdAt: "desc" } }),
      prisma.footballTurfCostCategory.findMany({ where, orderBy: { id: "asc" } }),
      prisma.footballTurfCostEntry.findMany({
        where,
        include: { category: { select: { name: true } } },
        orderBy: { spentAt: "desc" },
      }),
      prisma.footballTurfIncomeCategory.findMany({
        where,
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      }),
      prisma.footballTurfIncomeEntry.findMany({
        where,
        include: { category: { select: { name: true } } },
        orderBy: { earnedAt: "desc" },
      }),
    ]);
    const customers = await this.listCustomers();
    const pinHash = await loadFootballTurfStaffDailyPinHash(scope.ownerUserId);

    return {
      settings: mapProfileToSettings(profile, { staffDailyPinSet: Boolean(pinHash) }),
      courts: courts.map(mapCourt),
      bookings: bookings.map((row) => mapBooking(row, row.court.name)),
      promotions: promotions.map(mapPromotion),
      promotionSales: promotionSales.map(mapPromotionSale),
      costCategories: costCategories.map(mapCostCategory),
      costEntries: costEntries.map((row) => mapCostEntry(row, row.category.name)),
      incomeCategories: incomeCategories.map(mapIncomeCategory),
      incomeEntries: incomeEntries.map((row) => mapIncomeEntry(row, row.category.name)),
      customers,
    };
  }

  async getSettings(): Promise<FootballTurfVenueSettings> {
    const profile = await prisma.footballTurfShopProfile.findUniqueOrThrow({
      where: {
        ownerUserId_trialSessionId: {
          ownerUserId: this.ownerUserId,
          trialSessionId: this.trialSessionId,
        },
      },
    });
    const pinHash = await loadFootballTurfStaffDailyPinHash(this.ownerUserId);
    return mapProfileToSettings(profile, { staffDailyPinSet: Boolean(pinHash) });
  }

  async updateSettings(
    patch: Partial<FootballTurfVenueSettings> & {
      staffDailyPin?: string | null;
      staffDailyPinClear?: boolean;
    },
  ): Promise<FootballTurfVenueSettings> {
    const {
      staffDailyPin,
      staffDailyPinClear,
      staffDailyPinSet: _pinSet,
      portalGallery,
      ...rest
    } = patch;
    const data: Record<string, unknown> = { ...rest };
    if (portalGallery !== undefined) {
      data.portalGalleryJson = JSON.stringify(footballTurfNormalizePortalGallery(portalGallery));
    }
    if (patch.portalBannerUrl !== undefined) {
      data.portalBannerUrl = patch.portalBannerUrl.trim() || null;
    }
    if (patch.logoUrl !== undefined) {
      data.logoUrl = await persistFootballTurfLogoUrl(this.ownerUserId, patch.logoUrl || null);
    }
    if (Object.keys(data).length > 0) {
      await prisma.footballTurfShopProfile.update({
        where: {
          ownerUserId_trialSessionId: {
            ownerUserId: this.ownerUserId,
            trialSessionId: this.trialSessionId,
          },
        },
        data,
      });
    }
    const pinResult = await applyStaffDailyPinPatch({
      ownerId: this.ownerUserId,
      module: "football-turf",
      staffDailyPin,
      staffDailyPinClear,
    });
    if (!pinResult.ok) throw new Error(pinResult.error);
    return this.getSettings();
  }

  async listCourts(): Promise<FootballTurfCourt[]> {
    const rows = await prisma.footballTurfCourt.findMany({
      where: scopeWhere(this.scope()),
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    });
    return rows.map(mapCourt);
  }

  async createCourt(input: Omit<FootballTurfCourt, "id">): Promise<FootballTurfCourt> {
    const scope = this.scope();
    const maxSort = await prisma.footballTurfCourt.aggregate({
      where: scopeWhere(scope),
      _max: { sortOrder: true },
    });
    const imageUrl = await persistFootballTurfCourtImageUrl(scope.ownerUserId, input.imageUrl || null);
    const row = await prisma.footballTurfCourt.create({
      data: {
        ownerUserId: scope.ownerUserId,
        trialSessionId: scope.trialSessionId,
        name: input.name,
        openTime: input.openTime,
        closeTime: input.closeTime,
        slotMinutes: input.slotMinutes,
        weekdayPrice: input.weekdayPrice,
        weekendPrice: input.weekendPrice,
        imageUrl,
        isActive: input.isActive,
        sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
      },
    });
    return mapCourt(row);
  }

  async updateCourt(id: number, patch: Partial<Omit<FootballTurfCourt, "id">>): Promise<FootballTurfCourt | null> {
    const existing = await prisma.footballTurfCourt.findFirst({
      where: { id, ...scopeWhere(this.scope()) },
    });
    if (!existing) return null;
    const data: Record<string, unknown> = { ...patch };
    if (patch.imageUrl !== undefined) {
      data.imageUrl = await persistFootballTurfCourtImageUrl(
        this.scope().ownerUserId,
        patch.imageUrl || null,
      );
    }
    const row = await prisma.footballTurfCourt.update({ where: { id }, data });
    return mapCourt(row);
  }

  async deleteCourt(id: number): Promise<boolean> {
    const scope = this.scope();
    const existing = await prisma.footballTurfCourt.findFirst({
      where: { id, ...scopeWhere(scope) },
    });
    if (!existing) return false;
    const bookingCount = await prisma.footballTurfBooking.count({
      where: { courtId: id, ...scopeWhere(scope) },
    });
    if (bookingCount > 0) {
      await prisma.footballTurfCourt.update({ where: { id }, data: { isActive: false } });
      return true;
    }
    await prisma.footballTurfCourt.delete({ where: { id } });
    return true;
  }

  async listBookings(): Promise<FootballTurfBooking[]> {
    const rows = await prisma.footballTurfBooking.findMany({
      where: scopeWhere(this.scope()),
      include: { court: { select: { name: true } } },
      orderBy: [{ bookingDate: "desc" }, { startTime: "desc" }],
    });
    return rows.map((row) => mapBooking(row, row.court.name));
  }

  async createBooking(
    input: Omit<FootballTurfBooking, "id" | "createdAt"> & { createdAt?: string },
  ): Promise<FootballTurfBooking> {
    const scope = this.scope();
    const court = await prisma.footballTurfCourt.findFirst({
      where: { id: input.courtId, ...scopeWhere(scope) },
    });
    if (!court) throw new Error("ไม่พบสนาม");

    const finalPrice = Math.max(0, Math.round(Number(input.finalPrice ?? 0)));
    const amountPaidBaht = Math.max(0, Math.round(Number(input.amountPaidBaht ?? 0)));
    if (input.source === "WALK_IN" && amountPaidBaht < finalPrice) {
      throw new Error("walk-in เช็กอินหน้างานต้องชำระเต็มยอด");
    }

    const bookingDate =
      typeof input.bookingDate === "string" ? input.bookingDate.trim() : formatBookingDate(new Date());
    const startTime = String(input.startTime ?? "").trim();
    const endTime = String(input.endTime ?? "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(bookingDate) || !/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) {
      throw new Error("ข้อมูลช่วงเวลาไม่ถูกต้อง");
    }

    const dayBookings = await prisma.footballTurfBooking.findMany({
      where: {
        ...scopeWhere(scope),
        courtId: input.courtId,
        bookingDate: parseBookingDate(bookingDate),
        status: { not: "CANCELLED" },
      },
      select: { startTime: true, endTime: true, status: true },
    });
    const startMin = timeToMinutes(startTime);
    const endMin = timeToMinutes(endTime);
    const conflict = dayBookings.some(
      (b) => timeToMinutes(b.startTime) < endMin && timeToMinutes(b.endTime) > startMin,
    );
    if (conflict) throw new Error("ช่วงเวลานี้ถูกจองแล้ว");

    const now = new Date();
    const slotTimeOpts = {
      scheduleDate: bookingDate,
      todayDateKey: localDateKey(now),
      nowMinutes: localNowMinutes(now),
    };
    const timeline = buildCourtTimelineForValidation(court, dayBookings);
    const slot = { startTime, endTime, booking: null };
    if (input.source === "WALK_IN") {
      if (bookingDate !== slotTimeOpts.todayDateKey) {
        throw new Error("เช็คอินหน้างานใช้ได้เฉพาะวันนี้");
      }
      if (!isSlotEligibleForWalkIn(slot, timeline, slotTimeOpts)) {
        throw new Error("เช็คอินได้เฉพาะรอบปัจจุบันหรือรอบถัดไปที่ว่าง");
      }
    } else if (input.source === "ONLINE" || input.source === "STAFF") {
      if (!isSlotEligibleForAdvanceBooking(slot, slotTimeOpts)) {
        throw new Error("จองได้เฉพาะรอบถัดไปที่ยังไม่เริ่ม");
      }
    }

    let depositAmountBaht = input.depositAmountBaht ?? null;
    let paymentMethod = input.paymentMethod ?? "UNPAID";
    let paymentStatus = input.paymentStatus ?? "UNPAID";
    let paymentSlipDataUrl = input.paymentSlipDataUrl ?? "";
    let enforcedPaid = amountPaidBaht;

    if (input.source === "ONLINE") {
      const settings = await this.getSettings();
      const payDue = footballTurfComputePortalPayDue({
        mode: settings.portalBookingPaymentMode ?? "NONE",
        depositAmountBaht: settings.depositAmountBaht,
        totalBaht: finalPrice,
      });
      if (settings.portalBookingPaymentMode === "DEPOSIT") {
        const dep = Math.max(0, Math.round(Number(settings.depositAmountBaht ?? 0)));
        if (dep <= 0) throw new Error("สนามยังไม่ได้ตั้งจำนวนมัดจำ");
      }
      if (payDue != null && payDue > 0) {
        if (paymentMethod !== "PROMPTPAY" && paymentMethod !== "TRANSFER") {
          throw new Error("ต้องชำระผ่านพร้อมเพย์หรือโอนเงิน");
        }
        if (!String(paymentSlipDataUrl).trim()) {
          throw new Error(footballTurfPortalSlipProofMessage(settings.portalBookingPaymentMode));
        }
        depositAmountBaht = payDue;
        enforcedPaid = payDue;
        paymentStatus =
          settings.portalBookingPaymentMode === "FULL" ? "PAID" : "PARTIAL";
      } else {
        depositAmountBaht = null;
        enforcedPaid = 0;
        paymentMethod = paymentMethod === "ONSITE" ? "ONSITE" : "UNPAID";
        paymentStatus = "UNPAID";
        paymentSlipDataUrl = "";
      }
    }

    await upsertCustomerByPhone(scope, {
      phone: input.customerPhone,
      name: input.customerName,
      teamName: input.teamName,
      note: input.note,
    });

    const normalizedPhone = normalizeMemberPhone(input.customerPhone) || input.customerPhone.trim();

    const row = await prisma.footballTurfBooking.create({
      data: {
        ownerUserId: scope.ownerUserId,
        trialSessionId: scope.trialSessionId,
        courtId: input.courtId,
        bookingDate: parseBookingDate(bookingDate),
        startTime,
        endTime,
        customerName: input.customerName,
        customerPhone: normalizedPhone,
        teamName: input.teamName ?? "",
        playerCount: input.playerCount ?? 0,
        source: input.source,
        status: input.status,
        listedPrice: input.listedPrice,
        finalPrice,
        depositAmountBaht,
        amountPaidBaht: enforcedPaid,
        promotionSaleId: input.promotionSaleId ?? null,
        note: input.note ?? "",
        paymentMethod,
        paymentStatus,
        paymentSlipDataUrl: await persistFootballTurfSlipUrl(scope.ownerUserId, paymentSlipDataUrl),
        paymentReference: input.paymentReference ?? "",
        ...(input.createdAt ? { createdAt: new Date(input.createdAt) } : {}),
      },
      include: { court: { select: { name: true } } },
    });

    if (paymentStatus === "PAID" && enforcedPaid > 0) {
      await applyFootballTurfLoyaltyEarnOnBookingPaid({
        ownerUserId: scope.ownerUserId,
        trialSessionId: scope.trialSessionId,
        bookingId: row.id,
        totalAmount: enforcedPaid,
        memberPhone: normalizedPhone,
        customerName: input.customerName,
        previousPointsEarned: 0,
      });
    }

    return mapBooking(row, row.court.name);
  }

  /** จองหลายช่วงจากลิงก์ลูกค้า — คิดมัดจำ/ชำระเต็มจากยอดรวมครั้งเดียว */
  async createOnlineBookingsBatch(input: {
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
  }): Promise<FootballTurfBooking[]> {
    const scope = this.scope();
    const slots = (input.slots ?? [])
      .map((s) => ({
        startTime: String(s.startTime ?? "").trim(),
        endTime: String(s.endTime ?? "").trim(),
      }))
      .filter((s) => /^\d{2}:\d{2}$/.test(s.startTime) && /^\d{2}:\d{2}$/.test(s.endTime));
    if (!slots.length) throw new Error("เลือกอย่างน้อย 1 ช่วงเวลา");
    if (slots.length > 12) throw new Error("จองได้สูงสุด 12 ช่วงต่อครั้ง");

    const seen = new Set<string>();
    for (const s of slots) {
      const key = `${s.startTime}-${s.endTime}`;
      if (seen.has(key)) throw new Error("ช่วงเวลาซ้ำ");
      seen.add(key);
    }
    slots.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

    const bookingDate = String(input.bookingDate ?? "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(bookingDate)) throw new Error("วันที่ไม่ถูกต้อง");

    const court = await prisma.footballTurfCourt.findFirst({
      where: { id: input.courtId, ...scopeWhere(scope), isActive: true },
    });
    if (!court) throw new Error("ไม่พบสนาม");

    const unitPrice = footballTurfCourtPriceForDate(
      { weekdayPrice: court.weekdayPrice, weekendPrice: court.weekendPrice },
      bookingDate,
    );
    const totalBaht = unitPrice * slots.length;
    const settings = await this.getSettings();
    const mode = settings.portalBookingPaymentMode ?? "NONE";
    if (mode === "DEPOSIT") {
      const dep = Math.max(0, Math.round(Number(settings.depositAmountBaht ?? 0)));
      if (dep <= 0) throw new Error("สนามยังไม่ได้ตั้งจำนวนมัดจำ");
    }
    const payDue = footballTurfComputePortalPayDue({
      mode,
      depositAmountBaht: settings.depositAmountBaht,
      totalBaht,
    });
    const requiresPay = payDue != null && payDue > 0;
    let paymentMethod = (input.paymentMethod ?? "UNPAID") as string;
    const slipUrl = String(input.paymentSlipDataUrl ?? "").trim();
    if (requiresPay) {
      if (paymentMethod !== "PROMPTPAY" && paymentMethod !== "TRANSFER") {
        throw new Error("ต้องชำระผ่านพร้อมเพย์หรือโอนเงิน");
      }
      if (!slipUrl) throw new Error(footballTurfPortalSlipProofMessage(mode));
    } else {
      paymentMethod = "UNPAID";
    }

    const now = new Date();
    const slotTimeOpts = {
      scheduleDate: bookingDate,
      todayDateKey: localDateKey(now),
      nowMinutes: localNowMinutes(now),
    };
    const dayBookings = await prisma.footballTurfBooking.findMany({
      where: {
        ...scopeWhere(scope),
        courtId: input.courtId,
        bookingDate: parseBookingDate(bookingDate),
        status: { not: "CANCELLED" },
      },
      select: { startTime: true, endTime: true },
    });

    for (const slot of slots) {
      if (!isSlotEligibleForAdvanceBooking({ ...slot, booking: null }, slotTimeOpts)) {
        throw new Error(`ช่วง ${slot.startTime}-${slot.endTime} จองไม่ได้แล้ว`);
      }
      const startMin = timeToMinutes(slot.startTime);
      const endMin = timeToMinutes(slot.endTime);
      const conflict = dayBookings.some(
        (b) => timeToMinutes(b.startTime) < endMin && timeToMinutes(b.endTime) > startMin,
      );
      if (conflict) throw new Error(`ช่วง ${slot.startTime}-${slot.endTime} ถูกจองแล้ว`);
      // reserve against later slots in same request
      dayBookings.push({ startTime: slot.startTime, endTime: slot.endTime });
    }

    const customerName = input.customerName.trim() || input.teamName?.trim() || "ลูกค้า";
    const teamName = input.teamName?.trim() ?? "";
    const playerCount = Math.max(0, Math.round(Number(input.playerCount ?? 0)));
    const phone = input.customerPhone;

    await upsertCustomerByPhone(scope, {
      phone,
      name: customerName,
      teamName,
      note: "ลูกค้าจองผ่านลิงก์สนาม",
    });
    const normalizedPhone = normalizeMemberPhone(phone) || phone.trim();
    const persistedSlip = requiresPay
      ? (await persistFootballTurfSlipUrl(scope.ownerUserId, slipUrl)) || ""
      : "";
    const payNote =
      requiresPay
        ? mode === "DEPOSIT"
          ? `ลูกค้าจองผ่านลิงก์ · มัดจำรวม ${payDue} บาท (${slots.length} ช่วง)`
          : `ลูกค้าจองผ่านลิงก์ · ชำระเต็มรวม ${payDue} บาท (${slots.length} ช่วง)`
        : "ลูกค้าจองผ่านลิงก์สนาม";

    const created: FootballTurfBooking[] = [];
    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      const isPrimary = i === 0;
      let depositAmountBaht: number | null = null;
      let amountPaidBaht = 0;
      let paymentStatus: string = "UNPAID";
      let rowPaymentMethod = "UNPAID";
      let rowSlip = "";

      if (requiresPay && mode === "FULL") {
        amountPaidBaht = unitPrice;
        paymentStatus = "PAID";
        rowPaymentMethod = paymentMethod;
        rowSlip = persistedSlip;
        depositAmountBaht = null;
      } else if (requiresPay && isPrimary) {
        depositAmountBaht = payDue;
        amountPaidBaht = payDue ?? 0;
        paymentStatus = "PARTIAL";
        rowPaymentMethod = paymentMethod;
        rowSlip = persistedSlip;
      }

      const row = await prisma.footballTurfBooking.create({
        data: {
          ownerUserId: scope.ownerUserId,
          trialSessionId: scope.trialSessionId,
          courtId: input.courtId,
          bookingDate: parseBookingDate(bookingDate),
          startTime: slot.startTime,
          endTime: slot.endTime,
          customerName,
          customerPhone: normalizedPhone,
          teamName,
          playerCount,
          source: "ONLINE",
          status: "BOOKED",
          listedPrice: unitPrice,
          finalPrice: unitPrice,
          depositAmountBaht,
          amountPaidBaht,
          promotionSaleId: null,
          note: payNote.slice(0, 500),
          paymentMethod: rowPaymentMethod,
          paymentStatus,
          paymentSlipDataUrl: rowSlip,
          paymentReference: requiresPay && isPrimary ? String(input.paymentReference ?? "").trim() : "",
        },
        include: { court: { select: { name: true } } },
      });
      created.push(mapBooking(row, row.court.name));

      if (paymentStatus === "PAID" && amountPaidBaht > 0) {
        await applyFootballTurfLoyaltyEarnOnBookingPaid({
          ownerUserId: scope.ownerUserId,
          trialSessionId: scope.trialSessionId,
          bookingId: row.id,
          totalAmount: amountPaidBaht,
          memberPhone: normalizedPhone,
          customerName,
          previousPointsEarned: 0,
        });
      }
    }

    return created;
  }

  async updateBooking(
    id: number,
    patch: Partial<Omit<FootballTurfBooking, "id" | "createdAt">>,
  ): Promise<FootballTurfBooking | null> {
    const existing = await prisma.footballTurfBooking.findFirst({
      where: { id, ...scopeWhere(this.scope()) },
      include: { court: { select: { name: true } } },
    });
    if (!existing) return null;

    if (patch.status === "CHECKED_IN" || patch.status === "PLAYING") {
      const nextPaid =
        patch.amountPaidBaht !== undefined
          ? Math.max(0, Math.round(Number(patch.amountPaidBaht)))
          : existing.amountPaidBaht ?? 0;
      const nextFinal =
        patch.finalPrice !== undefined
          ? Math.max(0, Math.round(Number(patch.finalPrice)))
          : existing.finalPrice;
      if (
        !footballTurfBookingIsFullyPaid({
          finalPrice: nextFinal,
          amountPaidBaht: nextPaid,
          depositAmountBaht: existing.depositAmountBaht,
          paymentStatus: patch.paymentStatus ?? existing.paymentStatus,
        })
      ) {
        throw new Error("ต้องชำระเต็มยอดก่อนเช็กอิน");
      }
    }

    const data: Record<string, unknown> = { ...patch };
    delete data.courtName;
    delete data.createdAt;
    if (patch.bookingDate) data.bookingDate = parseBookingDate(patch.bookingDate);
    if (patch.paymentStatus === "PAID" && patch.amountPaidBaht === undefined) {
      const currentPaid = existing.amountPaidBaht ?? 0;
      if (currentPaid < existing.finalPrice) {
        data.amountPaidBaht = existing.finalPrice;
      }
    }
    if (patch.paymentSlipDataUrl !== undefined) {
      data.paymentSlipDataUrl = await persistFootballTurfSlipUrl(
        this.scope().ownerUserId,
        patch.paymentSlipDataUrl || null,
      );
    }

    if (patch.customerPhone) {
      data.customerPhone = normalizeMemberPhone(patch.customerPhone) || patch.customerPhone.trim();
    }

    if (patch.customerPhone || patch.customerName) {
      await upsertCustomerByPhone(this.scope(), {
        phone: (data.customerPhone as string | undefined) ?? existing.customerPhone,
        name: patch.customerName ?? existing.customerName,
        teamName: patch.teamName ?? existing.teamName,
        note: patch.note ?? existing.note,
      });
    }

    const row = await prisma.footballTurfBooking.update({
      where: { id },
      data,
      include: { court: { select: { name: true } } },
    });

    const nextPaymentStatus = (patch.paymentStatus ?? row.paymentStatus) as string;
    const nextPaid = Math.max(0, Math.round(Number(row.amountPaidBaht ?? 0)));
    if (nextPaymentStatus === "PAID" && nextPaid > 0) {
      await applyFootballTurfLoyaltyEarnOnBookingPaid({
        ownerUserId: this.scope().ownerUserId,
        trialSessionId: this.scope().trialSessionId,
        bookingId: row.id,
        totalAmount: nextPaid,
        memberPhone: row.customerPhone,
        customerName: row.customerName,
        previousPointsEarned: existing.pointsEarned ?? 0,
      });
    }

    /** หลายช่วงเวลาชื่อ/เบอร์เดียวกัน → เช็กอิน/เช็กเอาต์ทั้งเซสชัน */
    if (patch.status === "CHECKED_IN" || patch.status === "PLAYING" || patch.status === "COMPLETED") {
      const siblings = await prisma.footballTurfBooking.findMany({
        where: {
          ...scopeWhere(this.scope()),
          courtId: existing.courtId,
          bookingDate: existing.bookingDate,
          id: { not: id },
          status:
            patch.status === "COMPLETED"
              ? { in: ["BOOKED", "CHECKED_IN", "PLAYING"] }
              : "BOOKED",
        },
      });
      const linkedIds = siblings
        .filter((item) =>
          sameFootballTurfCustomer(
            {
              customerName: existing.customerName,
              customerPhone: existing.customerPhone,
            },
            item,
          ),
        )
        .map((item) => item.id);
      if (linkedIds.length > 0) {
        await prisma.footballTurfBooking.updateMany({
          where: { id: { in: linkedIds } },
          data: {
            status: patch.status === "COMPLETED" ? "COMPLETED" : "CHECKED_IN",
          },
        });
      }
    }

    return mapBooking(row, row.court.name);
  }

  async deleteBooking(id: number): Promise<boolean> {
    const existing = await prisma.footballTurfBooking.findFirst({
      where: { id, ...scopeWhere(this.scope()) },
    });
    if (!existing) return false;
    await prisma.footballTurfBooking.delete({ where: { id } });
    return true;
  }

  async listPromotions(): Promise<FootballTurfPromotion[]> {
    const rows = await prisma.footballTurfPromotion.findMany({
      where: scopeWhere(this.scope()),
      orderBy: { id: "asc" },
    });
    return rows.map(mapPromotion);
  }

  async createPromotion(input: Omit<FootballTurfPromotion, "id">): Promise<FootballTurfPromotion> {
    const scope = this.scope();
    const row = await prisma.footballTurfPromotion.create({
      data: {
        ownerUserId: scope.ownerUserId,
        trialSessionId: scope.trialSessionId,
        name: input.name,
        kind: input.kind,
        totalUses: input.totalUses,
        durationMinutes: input.durationMinutes,
        price: input.price,
        isActive: input.isActive,
        note: input.note ?? "",
      },
    });
    return mapPromotion(row);
  }

  async updatePromotion(
    id: number,
    patch: Partial<Omit<FootballTurfPromotion, "id">>,
  ): Promise<FootballTurfPromotion | null> {
    const existing = await prisma.footballTurfPromotion.findFirst({
      where: { id, ...scopeWhere(this.scope()) },
    });
    if (!existing) return null;
    const row = await prisma.footballTurfPromotion.update({ where: { id }, data: patch });
    return mapPromotion(row);
  }

  async deletePromotion(id: number): Promise<boolean> {
    const scope = this.scope();
    const existing = await prisma.footballTurfPromotion.findFirst({
      where: { id, ...scopeWhere(scope) },
    });
    if (!existing) return false;
    const saleCount = await prisma.footballTurfPromotionSale.count({
      where: { promotionId: id, ...scopeWhere(scope) },
    });
    if (saleCount > 0) {
      await prisma.footballTurfPromotion.update({ where: { id }, data: { isActive: false } });
      return true;
    }
    await prisma.footballTurfPromotion.delete({ where: { id } });
    return true;
  }

  async listPromotionSales(): Promise<FootballTurfPromotionSale[]> {
    const rows = await prisma.footballTurfPromotionSale.findMany({
      where: scopeWhere(this.scope()),
      orderBy: { createdAt: "desc" },
    });
    return rows.map(mapPromotionSale);
  }

  async createPromotionSale(
    input: Omit<FootballTurfPromotionSale, "id" | "createdAt" | "remainingUses" | "status">,
  ): Promise<FootballTurfPromotionSale> {
    const scope = this.scope();
    const normalizedPhone = normalizeMemberPhone(input.customerPhone) || input.customerPhone.trim();
    await upsertCustomerByPhone(scope, {
      phone: normalizedPhone,
      name: input.customerName,
      teamName: input.teamName,
    });
    const row = await prisma.footballTurfPromotionSale.create({
      data: {
        ownerUserId: scope.ownerUserId,
        trialSessionId: scope.trialSessionId,
        promotionId: input.promotionId,
        promotionName: input.promotionName,
        customerName: input.customerName,
        customerPhone: normalizedPhone,
        teamName: input.teamName ?? "",
        totalUses: input.totalUses,
        remainingUses: input.totalUses,
        price: input.price,
        status: "ACTIVE",
        paymentMethod: input.paymentMethod ?? "ONSITE",
        paymentStatus: input.paymentStatus ?? "PAID",
        paymentSlipDataUrl: await persistFootballTurfSlipUrl(scope.ownerUserId, input.paymentSlipDataUrl),
        paymentReference: input.paymentReference ?? "",
      },
    });
    if ((input.paymentStatus ?? "PAID") === "PAID" && input.price > 0) {
      await applyFootballTurfLoyaltyEarnOnPromotionSalePaid({
        ownerUserId: scope.ownerUserId,
        trialSessionId: scope.trialSessionId,
        promotionSaleId: row.id,
        totalAmount: input.price,
        memberPhone: normalizedPhone,
        customerName: input.customerName,
        previousPointsEarned: 0,
      });
    }
    return mapPromotionSale(row);
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
    const existing = await prisma.footballTurfPromotionSale.findFirst({
      where: { id, ...scopeWhere(this.scope()) },
    });
    if (!existing) return null;
    const data: Record<string, unknown> = { ...patch };
    if (patch.paymentSlipDataUrl !== undefined) {
      data.paymentSlipDataUrl = await persistFootballTurfSlipUrl(
        this.scope().ownerUserId,
        patch.paymentSlipDataUrl || null,
      );
    }
    const row = await prisma.footballTurfPromotionSale.update({ where: { id }, data });
    if ((patch.paymentStatus ?? row.paymentStatus) === "PAID" && row.price > 0) {
      await applyFootballTurfLoyaltyEarnOnPromotionSalePaid({
        ownerUserId: this.scope().ownerUserId,
        trialSessionId: this.scope().trialSessionId,
        promotionSaleId: row.id,
        totalAmount: row.price,
        memberPhone: row.customerPhone,
        customerName: row.customerName,
        previousPointsEarned: existing.pointsEarned ?? 0,
      });
    }
    return mapPromotionSale(row);
  }

  async deletePromotionSale(id: number): Promise<boolean> {
    const existing = await prisma.footballTurfPromotionSale.findFirst({
      where: { id, ...scopeWhere(this.scope()) },
    });
    if (!existing) return false;
    await prisma.footballTurfBooking.updateMany({
      where: { promotionSaleId: id, ...scopeWhere(this.scope()) },
      data: { promotionSaleId: null },
    });
    await prisma.footballTurfPromotionSale.delete({ where: { id } });
    return true;
  }

  async usePromotionSale(saleId: number, bookingId: number): Promise<FootballTurfPromotionSale | null> {
    const scope = this.scope();
    const sale = await prisma.footballTurfPromotionSale.findFirst({
      where: { id: saleId, ...scopeWhere(scope) },
    });
    const booking = await prisma.footballTurfBooking.findFirst({
      where: { id: bookingId, ...scopeWhere(scope) },
    });
    if (!sale || !booking) return null;
    if (sale.status !== "ACTIVE" || sale.remainingUses <= 0) return null;
    if (booking.status === "CANCELLED" || booking.promotionSaleId) return null;

    const remainingUses = sale.remainingUses - 1;
    const status = remainingUses > 0 ? "ACTIVE" : "USED_UP";

    const [updatedSale] = await prisma.$transaction([
      prisma.footballTurfPromotionSale.update({
        where: { id: saleId },
        data: { remainingUses, status },
      }),
      prisma.footballTurfBooking.update({
        where: { id: bookingId },
        data: { promotionSaleId: saleId, finalPrice: 0 },
      }),
    ]);
    return mapPromotionSale(updatedSale);
  }

  async listCostCategories(): Promise<FootballTurfCostCategory[]> {
    const rows = await prisma.footballTurfCostCategory.findMany({
      where: scopeWhere(this.scope()),
      orderBy: { id: "asc" },
    });
    return rows.map(mapCostCategory);
  }

  async createCostCategory(name: string): Promise<FootballTurfCostCategory> {
    const scope = this.scope();
    const row = await prisma.footballTurfCostCategory.create({
      data: {
        ownerUserId: scope.ownerUserId,
        trialSessionId: scope.trialSessionId,
        name: name.trim(),
      },
    });
    return mapCostCategory(row);
  }

  async updateCostCategory(id: number, name: string): Promise<FootballTurfCostCategory | null> {
    const existing = await prisma.footballTurfCostCategory.findFirst({
      where: { id, ...scopeWhere(this.scope()) },
    });
    if (!existing) return null;
    const row = await prisma.footballTurfCostCategory.update({
      where: { id },
      data: { name: name.trim() },
    });
    return mapCostCategory(row);
  }

  async deleteCostCategory(id: number): Promise<boolean> {
    const scope = this.scope();
    const existing = await prisma.footballTurfCostCategory.findFirst({
      where: { id, ...scopeWhere(scope) },
    });
    if (!existing) return false;
    const entryCount = await prisma.footballTurfCostEntry.count({
      where: { categoryId: id, ...scopeWhere(scope) },
    });
    if (entryCount > 0) {
      throw new Error("มีรายจ่ายในหมวดนี้ — ย้ายหรือลบรายจ่ายก่อน");
    }
    await prisma.footballTurfCostCategory.delete({ where: { id } });
    return true;
  }

  async listCostEntries(): Promise<FootballTurfCostEntry[]> {
    const rows = await prisma.footballTurfCostEntry.findMany({
      where: scopeWhere(this.scope()),
      include: { category: { select: { name: true } } },
      orderBy: { spentAt: "desc" },
    });
    return rows.map((row) => mapCostEntry(row, row.category.name));
  }

  async createCostEntry(
    input: Omit<FootballTurfCostEntry, "id" | "categoryName">,
  ): Promise<FootballTurfCostEntry> {
    const scope = this.scope();
    const category = await prisma.footballTurfCostCategory.findFirst({
      where: { id: input.categoryId, ...scopeWhere(scope) },
    });
    if (!category) throw new Error("ไม่พบหมวดต้นทุน");
    const paymentSlipUrl = await persistFootballTurfSlipUrl(scope.ownerUserId, input.paymentSlipUrl || null);
    const row = await prisma.footballTurfCostEntry.create({
      data: {
        ownerUserId: scope.ownerUserId,
        trialSessionId: scope.trialSessionId,
        categoryId: input.categoryId,
        spentAt: new Date(input.spentAt),
        amount: input.amount,
        itemLabel: input.itemLabel ?? "",
        note: input.note ?? "",
        paymentSlipUrl: paymentSlipUrl ?? "",
      },
    });
    return mapCostEntry(row, category.name);
  }

  async updateCostEntry(
    id: number,
    patch: Partial<Omit<FootballTurfCostEntry, "id" | "categoryName">>,
  ): Promise<FootballTurfCostEntry | null> {
    const scope = this.scope();
    const existing = await prisma.footballTurfCostEntry.findFirst({
      where: { id, ...scopeWhere(scope) },
      include: { category: { select: { name: true } } },
    });
    if (!existing) return null;
    const data: Record<string, unknown> = {};
    if (patch.categoryId !== undefined) {
      const category = await prisma.footballTurfCostCategory.findFirst({
        where: { id: patch.categoryId, ...scopeWhere(scope) },
      });
      if (!category) throw new Error("ไม่พบหมวดต้นทุน");
      data.categoryId = patch.categoryId;
    }
    if (patch.spentAt !== undefined) data.spentAt = new Date(patch.spentAt);
    if (patch.amount !== undefined) data.amount = patch.amount;
    if (patch.itemLabel !== undefined) data.itemLabel = patch.itemLabel;
    if (patch.note !== undefined) data.note = patch.note;
    if (patch.paymentSlipUrl !== undefined) {
      data.paymentSlipUrl =
        (await persistFootballTurfSlipUrl(scope.ownerUserId, patch.paymentSlipUrl || null)) ?? "";
    }
    const row = await prisma.footballTurfCostEntry.update({
      where: { id },
      data,
      include: { category: { select: { name: true } } },
    });
    return mapCostEntry(row, row.category.name);
  }

  async deleteCostEntry(id: number): Promise<boolean> {
    const existing = await prisma.footballTurfCostEntry.findFirst({
      where: { id, ...scopeWhere(this.scope()) },
    });
    if (!existing) return false;
    await prisma.footballTurfCostEntry.delete({ where: { id } });
    return true;
  }

  async listIncomeCategories(): Promise<FootballTurfIncomeCategory[]> {
    const scope = this.scope();
    await ensureFootballTurfIncomeCategories(scope.ownerUserId, scope.trialSessionId);
    const rows = await prisma.footballTurfIncomeCategory.findMany({
      where: scopeWhere(scope),
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    });
    return rows.map(mapIncomeCategory);
  }

  async createIncomeCategory(name: string): Promise<FootballTurfIncomeCategory> {
    const scope = this.scope();
    const trimmed = name.trim();
    if (trimmed.length < 2) throw new Error("ตั้งชื่อหมวดอย่างน้อย 2 ตัวอักษร");
    const maxSort = await prisma.footballTurfIncomeCategory.aggregate({
      where: scopeWhere(scope),
      _max: { sortOrder: true },
    });
    const row = await prisma.footballTurfIncomeCategory.create({
      data: {
        ownerUserId: scope.ownerUserId,
        trialSessionId: scope.trialSessionId,
        name: trimmed,
        kind: "CUSTOM",
        isBuiltin: false,
        sortOrder: (maxSort._max.sortOrder ?? 9) + 1,
      },
    });
    return mapIncomeCategory(row);
  }

  async updateIncomeCategory(id: number, name: string): Promise<FootballTurfIncomeCategory | null> {
    const existing = await prisma.footballTurfIncomeCategory.findFirst({
      where: { id, ...scopeWhere(this.scope()) },
    });
    if (!existing) return null;
    if (existing.isBuiltin || existing.kind !== "CUSTOM") {
      throw new Error("หมวดรายรับหลักแก้ชื่อไม่ได้");
    }
    const trimmed = name.trim();
    if (trimmed.length < 2) throw new Error("ตั้งชื่อหมวดอย่างน้อย 2 ตัวอักษร");
    const row = await prisma.footballTurfIncomeCategory.update({
      where: { id },
      data: { name: trimmed },
    });
    return mapIncomeCategory(row);
  }

  async deleteIncomeCategory(id: number): Promise<boolean> {
    const scope = this.scope();
    const existing = await prisma.footballTurfIncomeCategory.findFirst({
      where: { id, ...scopeWhere(scope) },
    });
    if (!existing) return false;
    if (existing.isBuiltin || existing.kind !== "CUSTOM") {
      throw new Error("หมวดรายรับหลัก (ค่าสนาม / โปรโมชัน) ลบไม่ได้");
    }
    const entryCount = await prisma.footballTurfIncomeEntry.count({
      where: { categoryId: id, ...scopeWhere(scope) },
    });
    if (entryCount > 0) {
      throw new Error("มีรายรับในหมวดนี้ — ย้ายหรือลบรายรับก่อน");
    }
    await prisma.footballTurfIncomeCategory.delete({ where: { id } });
    return true;
  }

  async listIncomeEntries(): Promise<FootballTurfIncomeEntry[]> {
    const rows = await prisma.footballTurfIncomeEntry.findMany({
      where: scopeWhere(this.scope()),
      include: { category: { select: { name: true } } },
      orderBy: { earnedAt: "desc" },
    });
    return rows.map((row) => mapIncomeEntry(row, row.category.name));
  }

  async createIncomeEntry(
    input: Omit<FootballTurfIncomeEntry, "id" | "categoryName">,
  ): Promise<FootballTurfIncomeEntry> {
    const scope = this.scope();
    const category = await prisma.footballTurfIncomeCategory.findFirst({
      where: { id: input.categoryId, ...scopeWhere(scope) },
    });
    if (!category) throw new Error("ไม่พบหมวดรายรับ");
    if (category.kind !== "CUSTOM") {
      throw new Error("หมวดค่าสนาม / โปรโมชัน มาจากการจองและขายโปร — บันทึกมือไม่ได้");
    }
    const paymentSlipUrl = await persistFootballTurfSlipUrl(scope.ownerUserId, input.paymentSlipUrl || null);
    const row = await prisma.footballTurfIncomeEntry.create({
      data: {
        ownerUserId: scope.ownerUserId,
        trialSessionId: scope.trialSessionId,
        categoryId: input.categoryId,
        earnedAt: new Date(input.earnedAt),
        amount: input.amount,
        itemLabel: input.itemLabel ?? "",
        note: input.note ?? "",
        paymentSlipUrl: paymentSlipUrl ?? "",
      },
    });
    return mapIncomeEntry(row, category.name);
  }

  async updateIncomeEntry(
    id: number,
    patch: Partial<Omit<FootballTurfIncomeEntry, "id" | "categoryName">>,
  ): Promise<FootballTurfIncomeEntry | null> {
    const scope = this.scope();
    const existing = await prisma.footballTurfIncomeEntry.findFirst({
      where: { id, ...scopeWhere(scope) },
      include: { category: { select: { name: true, kind: true } } },
    });
    if (!existing) return null;
    const data: Record<string, unknown> = {};
    if (patch.categoryId != null) {
      const category = await prisma.footballTurfIncomeCategory.findFirst({
        where: { id: patch.categoryId, ...scopeWhere(scope) },
      });
      if (!category || category.kind !== "CUSTOM") throw new Error("เลือกหมวดรายรับที่บันทึกมือได้เท่านั้น");
      data.categoryId = patch.categoryId;
    }
    if (patch.earnedAt != null) data.earnedAt = new Date(patch.earnedAt);
    if (patch.amount != null) data.amount = patch.amount;
    if (patch.itemLabel != null) data.itemLabel = patch.itemLabel;
    if (patch.note != null) data.note = patch.note;
    if (patch.paymentSlipUrl !== undefined) {
      data.paymentSlipUrl =
        (await persistFootballTurfSlipUrl(scope.ownerUserId, patch.paymentSlipUrl || null)) ?? "";
    }
    const row = await prisma.footballTurfIncomeEntry.update({
      where: { id },
      data,
      include: { category: { select: { name: true } } },
    });
    return mapIncomeEntry(row, row.category.name);
  }

  async deleteIncomeEntry(id: number): Promise<boolean> {
    const existing = await prisma.footballTurfIncomeEntry.findFirst({
      where: { id, ...scopeWhere(this.scope()) },
    });
    if (!existing) return false;
    await prisma.footballTurfIncomeEntry.delete({ where: { id } });
    return true;
  }

  async listRevenueEntries(): Promise<FootballTurfRevenueEntry[]> {
    const [bookings, promotionSales, incomeEntries] = await Promise.all([
      this.listBookings(),
      this.listPromotionSales(),
      this.listIncomeEntries(),
    ]);
    const bookingRows: FootballTurfRevenueEntry[] = bookings
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
    const promotionRows: FootballTurfRevenueEntry[] = promotionSales
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
    const manualRows: FootballTurfRevenueEntry[] = incomeEntries.map((item) => ({
      id: `income-${item.id}`,
      paidAt: item.earnedAt,
      amount: item.amount,
      label: item.itemLabel || item.categoryName,
      customerName: "",
      customerPhone: "",
      source: "INCOME",
    }));
    return [...bookingRows, ...promotionRows, ...manualRows].sort(
      (a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime(),
    );
  }

  async listCustomers(): Promise<FootballTurfCustomer[]> {
    const scope = this.scope();
    const [rows, members] = await Promise.all([
      prisma.footballTurfCustomer.findMany({
        where: scopeWhere(scope),
        orderBy: { id: "asc" },
      }),
      prisma.footballTurfLoyaltyMember.findMany({
        where: scopeWhere(scope),
        select: { phone: true, pointsBalance: true, totalEarned: true, totalRedeemed: true },
      }),
    ]);
    const byPhone = new Map(members.map((m) => [m.phone, m]));
    return rows.map((row) => {
      const phone = normalizeMemberPhone(row.phone) || row.phone;
      const m = byPhone.get(phone);
      return {
        ...mapCustomer(row),
        pointsBalance: m?.pointsBalance ?? 0,
        totalEarned: m?.totalEarned ?? 0,
        totalRedeemed: m?.totalRedeemed ?? 0,
      };
    });
  }

  async createCustomer(input: Omit<FootballTurfCustomer, "id">): Promise<FootballTurfCustomer> {
    const scope = this.scope();
    const phone = normalizeMemberPhone(input.phone) || input.phone.trim();
    const taxInvoiceEnabled = Boolean(input.taxInvoiceEnabled);
    const photoUrl = await persistFootballTurfCustomerPhotoUrl(scope.ownerUserId, input.photoUrl);
    const row = await prisma.footballTurfCustomer.upsert({
      where: {
        ownerUserId_trialSessionId_phone: {
          ownerUserId: scope.ownerUserId,
          trialSessionId: scope.trialSessionId,
          phone,
        },
      },
      create: {
        ownerUserId: scope.ownerUserId,
        trialSessionId: scope.trialSessionId,
        phone,
        name: input.name.trim(),
        teamName: input.teamName?.trim() ?? "",
        note: input.note?.trim() ?? "",
        isActive: input.isActive ?? true,
        taxInvoiceEnabled,
        billingName: input.billingName?.trim() ?? "",
        taxId: input.taxId?.replace(/\D/g, "").slice(0, 13) ?? "",
        taxAddress: input.taxAddress?.trim() ?? "",
        taxBranch: input.taxBranch?.trim() ?? "",
        photoUrl,
      },
      update: {
        name: input.name.trim(),
        teamName: input.teamName?.trim() ?? "",
        note: input.note?.trim() ?? "",
        isActive: input.isActive ?? true,
        taxInvoiceEnabled,
        billingName: input.billingName?.trim() ?? "",
        taxId: input.taxId?.replace(/\D/g, "").slice(0, 13) ?? "",
        taxAddress: input.taxAddress?.trim() ?? "",
        taxBranch: input.taxBranch?.trim() ?? "",
        photoUrl,
      },
    });
    return mapCustomer(row);
  }

  async updateCustomer(
    id: number,
    patch: Partial<Omit<FootballTurfCustomer, "id">>,
  ): Promise<FootballTurfCustomer | null> {
    const existing = await prisma.footballTurfCustomer.findFirst({
      where: { id, ...scopeWhere(this.scope()) },
    });
    if (!existing) return null;
    const data: Record<string, unknown> = {};
    if (patch.name !== undefined) data.name = patch.name.trim();
    if (patch.phone !== undefined) data.phone = normalizeMemberPhone(patch.phone) || patch.phone.trim();
    if (patch.teamName !== undefined) data.teamName = patch.teamName.trim();
    if (patch.note !== undefined) data.note = patch.note.trim();
    if (patch.isActive !== undefined) data.isActive = patch.isActive;
    if (patch.taxInvoiceEnabled !== undefined) data.taxInvoiceEnabled = Boolean(patch.taxInvoiceEnabled);
    if (patch.billingName !== undefined) data.billingName = patch.billingName.trim();
    if (patch.taxId !== undefined) data.taxId = patch.taxId.replace(/\D/g, "").slice(0, 13);
    if (patch.taxAddress !== undefined) data.taxAddress = patch.taxAddress.trim();
    if (patch.taxBranch !== undefined) data.taxBranch = patch.taxBranch.trim();
    if (patch.photoUrl !== undefined) {
      data.photoUrl = await persistFootballTurfCustomerPhotoUrl(this.scope().ownerUserId, patch.photoUrl);
    }
    const row = await prisma.footballTurfCustomer.update({ where: { id }, data });
    return mapCustomer(row);
  }

  async deleteCustomer(id: number): Promise<boolean> {
    const existing = await prisma.footballTurfCustomer.findFirst({
      where: { id, ...scopeWhere(this.scope()) },
    });
    if (!existing) return false;
    await prisma.footballTurfCustomer.delete({ where: { id } });
    return true;
  }

  async loadPublicState(): Promise<
    Omit<FootballTurfFullState, "costCategories" | "costEntries" | "incomeCategories" | "incomeEntries" | "customers">
  > {
    const full = await this.loadFullState();
    const today = formatBookingDate(new Date());
    return {
      settings: full.settings,
      courts: full.courts.filter((c) => c.isActive),
      bookings: full.bookings.filter((b) => b.status !== "CANCELLED" && b.bookingDate >= today),
      promotions: full.promotions.filter((p) => p.isActive),
      promotionSales: full.promotionSales.filter((s) => s.status === "ACTIVE"),
    };
  }

  /**
   * ค้นหาสมาชิกจากเบอร์เต็ม (≥9) เพื่อจองจากลิงก์ลูกค้า
   * คืนชื่อ/ทีมเฉพาะเมื่อจับคู่เบอร์ตรง — ไม่รองรับ 4 หลักท้าย
   */
  async lookupPublicMemberForBooking(phoneRaw: string): Promise<{
    found: boolean;
    name?: string;
    teamName?: string;
    phone?: string;
  }> {
    const digits = phoneRaw.replace(/\D/g, "");
    if (digits.length < 9) return { found: false };
    const phone = normalizeMemberPhone(digits) || digits;
    const row = await prisma.footballTurfCustomer.findFirst({
      where: {
        ...scopeWhere(this.scope()),
        isActive: true,
        phone,
      },
      select: { name: true, teamName: true, phone: true },
    });
    if (!row) return { found: false };
    return {
      found: true,
      name: row.name,
      teamName: row.teamName ?? "",
      phone: row.phone,
    };
  }
}

export function createFootballTurfServerRepo(ownerUserId: string, trialSessionId: string) {
  return new FootballTurfServerRepo(ownerUserId, trialSessionId);
}
