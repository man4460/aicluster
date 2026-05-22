import { prisma } from "@/lib/prisma";
import { bangkokDayRangeFromDateKey } from "@/lib/massage/booking-datetime";
import {
  ACTIVE_QUEUE_STATUSES,
  APPOINTMENT_QUEUE_STATUS_LABEL,
} from "@/lib/appointment-queue/booking-status";
import type { AppointmentQueueBookingStatus } from "@/generated/prisma/enums";

export function bangkokTodayDateKey(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
}

export type BoardBookingDto = {
  id: number;
  serviceId: number;
  status: AppointmentQueueBookingStatus;
  statusLabel: string;
  phone: string;
  customerName: string | null;
  scheduledAt: string;
  timeLabel: string;
  serviceName: string;
  staffName: string | null;
  depositSlipUrl: string | null;
  note: string | null;
};

export type AppointmentQueueDashboardDto = {
  dateKey: string;
  profile: {
    displayName: string | null;
    publicBookingEnabled: boolean;
    depositRequired: boolean;
    depositAmountBaht: number | null;
    promptPayId: string | null;
    promptPayName: string | null;
  };
  stats: {
    pendingDeposit: number;
    booked: number;
    todayTotal: number;
  };
  bookings: BoardBookingDto[];
  pendingDeposit: BoardBookingDto[];
};

function timeLabelFromDate(d: Date): string {
  return d.toLocaleTimeString("th-TH", {
    timeZone: "Asia/Bangkok",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export async function loadAppointmentQueueDashboard(
  ownerUserId: string,
  trialSessionId: string,
  dateKey = bangkokTodayDateKey(),
): Promise<AppointmentQueueDashboardDto | null> {
  const range = bangkokDayRangeFromDateKey(dateKey);
  if (!range) return null;

  const profile = await prisma.appointmentQueueShopProfile.findUnique({
    where: { ownerUserId_trialSessionId: { ownerUserId, trialSessionId } },
  });
  if (!profile) return null;

  const rows = await prisma.appointmentQueueBooking.findMany({
    where: {
      ownerUserId,
      trialSessionId,
      scheduledAt: { gte: range.start, lt: range.end },
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
    },
    include: { service: true, staff: true },
    orderBy: [{ scheduledAt: "asc" }, { id: "asc" }],
  });

  const mapRow = (r: (typeof rows)[0]): BoardBookingDto => ({
    id: r.id,
    serviceId: r.serviceId,
    status: r.status,
    statusLabel: APPOINTMENT_QUEUE_STATUS_LABEL[r.status],
    phone: r.phone,
    customerName: r.customerName,
    scheduledAt: r.scheduledAt.toISOString(),
    timeLabel: timeLabelFromDate(r.scheduledAt),
    serviceName: r.service.name,
    staffName: r.staff?.name ?? null,
    depositSlipUrl: r.depositSlipUrl,
    note: r.note,
  });

  const pendingDeposit = rows.filter((r) => r.status === "PENDING_DEPOSIT").map(mapRow);
  const bookings = rows
    .filter((r) => ACTIVE_QUEUE_STATUSES.includes(r.status))
    .map(mapRow);

  return {
    dateKey,
    profile: {
      displayName: profile.displayName,
      publicBookingEnabled: profile.publicBookingEnabled,
      depositRequired: profile.depositRequired,
      depositAmountBaht: profile.depositAmountBaht != null ? Number(profile.depositAmountBaht) : null,
      promptPayId: profile.promptPayId,
      promptPayName: profile.promptPayName,
    },
    stats: {
      pendingDeposit: pendingDeposit.length,
      booked: bookings.length,
      todayTotal: rows.length,
    },
    bookings,
    pendingDeposit,
  };
}
