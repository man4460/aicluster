import { persistFootballTurfCourtImageUrl, persistFootballTurfSlipUrl } from "@/systems/football-turf/lib/persist-slip";
import { sameFootballTurfCustomer } from "@/systems/football-turf/lib/booking-session";
import { prisma } from "@/lib/prisma";
import {
  formatBookingDate,
  mapBooking,
  mapCostCategory,
  mapCostEntry,
  mapCourt,
  mapCustomer,
  mapProfileToSettings,
  mapPromotion,
  mapPromotionSale,
  parseBookingDate,
} from "@/systems/football-turf/lib/mappers";
import type {
  FootballTurfBooking,
  FootballTurfCostCategory,
  FootballTurfCostEntry,
  FootballTurfCourt,
  FootballTurfCustomer,
  FootballTurfFullState,
  FootballTurfPromotion,
  FootballTurfPromotionSale,
  FootballTurfRevenueEntry,
  FootballTurfVenueSettings,
} from "@/systems/football-turf/lib/types";

type Scope = { ownerUserId: string; trialSessionId: string };

function scopeWhere(scope: Scope) {
  return { ownerUserId: scope.ownerUserId, trialSessionId: scope.trialSessionId };
}

async function upsertCustomerByPhone(
  scope: Scope,
  input: { phone: string; name: string; teamName?: string; note?: string },
) {
  const phone = input.phone.trim();
  if (!phone) return;
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
      name: input.name.trim() || undefined,
      teamName: input.teamName?.trim() || undefined,
      note: input.note?.trim() || undefined,
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
    const where = scopeWhere(scope);
    const [profile, courts, bookings, promotions, promotionSales, costCategories, costEntries, customers] =
      await Promise.all([
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
        prisma.footballTurfCustomer.findMany({ where, orderBy: { id: "asc" } }),
      ]);

    return {
      settings: mapProfileToSettings(profile),
      courts: courts.map(mapCourt),
      bookings: bookings.map((row) => mapBooking(row, row.court.name)),
      promotions: promotions.map(mapPromotion),
      promotionSales: promotionSales.map(mapPromotionSale),
      costCategories: costCategories.map(mapCostCategory),
      costEntries: costEntries.map((row) => mapCostEntry(row, row.category.name)),
      customers: customers.map(mapCustomer),
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
    return mapProfileToSettings(profile);
  }

  async updateSettings(patch: Partial<FootballTurfVenueSettings>): Promise<FootballTurfVenueSettings> {
    const profile = await prisma.footballTurfShopProfile.update({
      where: {
        ownerUserId_trialSessionId: {
          ownerUserId: this.ownerUserId,
          trialSessionId: this.trialSessionId,
        },
      },
      data: patch,
    });
    return mapProfileToSettings(profile);
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

    await upsertCustomerByPhone(scope, {
      phone: input.customerPhone,
      name: input.customerName,
      teamName: input.teamName,
      note: input.note,
    });

    const row = await prisma.footballTurfBooking.create({
      data: {
        ownerUserId: scope.ownerUserId,
        trialSessionId: scope.trialSessionId,
        courtId: input.courtId,
        bookingDate: parseBookingDate(input.bookingDate),
        startTime: input.startTime,
        endTime: input.endTime,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        teamName: input.teamName ?? "",
        playerCount: input.playerCount ?? 0,
        source: input.source,
        status: input.status,
        listedPrice: input.listedPrice,
        finalPrice: input.finalPrice,
        depositAmountBaht: input.depositAmountBaht ?? null,
        promotionSaleId: input.promotionSaleId ?? null,
        note: input.note ?? "",
        paymentMethod: input.paymentMethod ?? "UNPAID",
        paymentStatus: input.paymentStatus ?? "UNPAID",
        paymentSlipDataUrl: await persistFootballTurfSlipUrl(scope.ownerUserId, input.paymentSlipDataUrl),
        paymentReference: input.paymentReference ?? "",
        ...(input.createdAt ? { createdAt: new Date(input.createdAt) } : {}),
      },
      include: { court: { select: { name: true } } },
    });
    return mapBooking(row, row.court.name);
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

    const data: Record<string, unknown> = { ...patch };
    delete data.courtName;
    delete data.createdAt;
    if (patch.bookingDate) data.bookingDate = parseBookingDate(patch.bookingDate);
    if (patch.paymentSlipDataUrl !== undefined) {
      data.paymentSlipDataUrl = await persistFootballTurfSlipUrl(
        this.scope().ownerUserId,
        patch.paymentSlipDataUrl || null,
      );
    }

    if (patch.customerPhone || patch.customerName) {
      await upsertCustomerByPhone(this.scope(), {
        phone: patch.customerPhone ?? existing.customerPhone,
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
    await upsertCustomerByPhone(scope, {
      phone: input.customerPhone,
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
        customerPhone: input.customerPhone,
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
    const row = await prisma.footballTurfCostEntry.create({
      data: {
        ownerUserId: scope.ownerUserId,
        trialSessionId: scope.trialSessionId,
        categoryId: input.categoryId,
        spentAt: new Date(input.spentAt),
        amount: input.amount,
        itemLabel: input.itemLabel ?? "",
        note: input.note ?? "",
      },
    });
    return mapCostEntry(row, category.name);
  }

  async deleteCostEntry(id: number): Promise<boolean> {
    const existing = await prisma.footballTurfCostEntry.findFirst({
      where: { id, ...scopeWhere(this.scope()) },
    });
    if (!existing) return false;
    await prisma.footballTurfCostEntry.delete({ where: { id } });
    return true;
  }

  async listRevenueEntries(): Promise<FootballTurfRevenueEntry[]> {
    const [bookings, promotionSales] = await Promise.all([this.listBookings(), this.listPromotionSales()]);
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
    return [...bookingRows, ...promotionRows].sort(
      (a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime(),
    );
  }

  async listCustomers(): Promise<FootballTurfCustomer[]> {
    const rows = await prisma.footballTurfCustomer.findMany({
      where: scopeWhere(this.scope()),
      orderBy: { id: "asc" },
    });
    return rows.map(mapCustomer);
  }

  async createCustomer(input: Omit<FootballTurfCustomer, "id">): Promise<FootballTurfCustomer> {
    const scope = this.scope();
    const phone = input.phone.trim();
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
      },
      update: {
        name: input.name.trim(),
        teamName: input.teamName?.trim() ?? "",
        note: input.note?.trim() ?? "",
        isActive: input.isActive ?? true,
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
    const row = await prisma.footballTurfCustomer.update({ where: { id }, data: patch });
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

  async loadPublicState(): Promise<Omit<FootballTurfFullState, "costCategories" | "costEntries" | "customers">> {
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
}

export function createFootballTurfServerRepo(ownerUserId: string, trialSessionId: string) {
  return new FootballTurfServerRepo(ownerUserId, trialSessionId);
}
