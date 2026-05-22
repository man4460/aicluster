import type { PrismaClient } from "@/generated/prisma/client";
import { bangkokDateKey } from "@/lib/time/bangkok";
import { parseYmdToDbDate } from "@/lib/home-finance/entry-date";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";
import { ensureAppointmentQueueProfile } from "@/systems/appointment-queue/lib/ensure-profile";

type Tx = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends" | "$use"
>;

type DbLike = Tx | PrismaClient;

const DEMO_NOTE = "seed:appointment-queue-demo-v1";

function shiftDateKey(ymd: string, delta: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + delta);
  return bangkokDateKey(dt);
}

async function ensureServices(db: DbLike, ownerUserId: string, trialSessionId: string) {
  const specs = [
    { name: "จองสนาม A", duration: 60, price: 400, deposit: 100 },
    { name: "จองสนาม B", duration: 60, price: 400, deposit: 100 },
    { name: "บริการทั่วไป", duration: 45, price: null, deposit: null },
  ];
  const existing = await db.appointmentQueueService.findMany({
    where: { ownerUserId, trialSessionId },
    orderBy: { sortOrder: "asc" },
  });
  if (existing.length >= specs.length) return existing;

  const out = [...existing];
  for (let i = existing.length; i < specs.length; i++) {
    const s = specs[i]!;
    const row = await db.appointmentQueueService.create({
      data: {
        ownerUserId,
        trialSessionId,
        name: s.name,
        durationMinutes: s.duration,
        priceBaht: s.price,
        depositBaht: s.deposit,
        sortOrder: i,
      },
    });
    out.push(row);
  }
  return out;
}

async function seedSchedules(db: DbLike, ownerUserId: string, trialSessionId: string, today: string) {
  for (let d = 0; d < 7; d++) {
    const dateKey = shiftDateKey(today, d);
    const scheduleDate = parseYmdToDbDate(dateKey);
    if (!scheduleDate) continue;
    const isSunday = new Date(`${dateKey}T12:00:00+07:00`).getDay() === 0;
    await db.appointmentQueueDaySchedule.upsert({
      where: {
        ownerUserId_trialSessionId_scheduleDate: {
          ownerUserId,
          trialSessionId,
          scheduleDate,
        },
      },
      create: {
        ownerUserId,
        trialSessionId,
        scheduleDate,
        openTime: "09:00",
        closeTime: isSunday ? "15:00" : "19:00",
        slotMinutes: 60,
        isClosed: false,
      },
      update: {},
    });
  }
}

/**
 * เติมข้อมูลตัวอย่างจองคิว (production scope) — ข้ามถ้ามีคิว demo แล้ว
 */
export async function seedAppointmentQueueProdDemoForOwner(
  prisma: PrismaClient,
  ownerUserId: string,
): Promise<void> {
  const trialSessionId = TRIAL_PROD_SCOPE;
  const demoCount = await prisma.appointmentQueueBooking.count({
    where: { ownerUserId, trialSessionId, note: DEMO_NOTE },
  });
  if (demoCount > 0) return;

  await ensureAppointmentQueueProfile(ownerUserId, trialSessionId);

  await prisma.appointmentQueueShopProfile.update({
    where: { ownerUserId_trialSessionId: { ownerUserId, trialSessionId } },
    data: {
      displayName: "ร้านเดโม่ · จองคิวอัจฉริยะ",
      tagline: "สแกน QR จองเวลา — สนาม / บริการตามที่ร้านกำหนด",
      contactPhone: "0812345678",
      depositRequired: true,
      depositAmountBaht: 100,
      promptPayId: "0812345678",
      promptPayName: "ร้านเดโม่",
      defaultSlotMinutes: 60,
    },
  });

  const today = bangkokDateKey();
  await seedSchedules(prisma, ownerUserId, trialSessionId, today);

  const services = await ensureServices(prisma, ownerUserId, trialSessionId);
  const fieldA = services[0]!;
  const fieldB = services[1] ?? fieldA;

  type Sample = {
    time: string;
    status: "PENDING_DEPOSIT" | "CONFIRMED";
    name: string;
    phone: string;
    serviceId: number;
  };

  const samples: Sample[] = [
    { time: "10:00", status: "CONFIRMED", name: "คุณมิ้น", phone: "0891111111", serviceId: fieldA.id },
    { time: "11:00", status: "CONFIRMED", name: "คุณบอล", phone: "0892222222", serviceId: fieldA.id },
    { time: "13:00", status: "CONFIRMED", name: "คุณเจ", phone: "0893333333", serviceId: fieldB.id },
    { time: "14:00", status: "PENDING_DEPOSIT", name: "คุณแพร", phone: "0894444444", serviceId: fieldA.id },
    { time: "15:00", status: "CONFIRMED", name: "Walk-in", phone: "0895555555", serviceId: fieldB.id },
  ];

  for (const s of samples) {
    const svc = services.find((x) => x.id === s.serviceId) ?? fieldA;
    await prisma.appointmentQueueBooking.create({
      data: {
        ownerUserId,
        trialSessionId,
        serviceId: svc.id,
        staffId: null,
        phone: s.phone,
        customerName: s.name,
        scheduledAt: new Date(`${today}T${s.time}:00+07:00`),
        durationMinutes: svc.durationMinutes,
        status: s.status,
        depositAmountBaht: s.status === "PENDING_DEPOSIT" ? 50 : null,
        depositSlipUrl: null,
        note: DEMO_NOTE,
        boardSort: 0,
      },
    });
  }
}
