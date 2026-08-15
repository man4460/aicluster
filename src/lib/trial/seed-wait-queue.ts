import type { PrismaClient } from "@/generated/prisma/client";
import { bangkokDateKey } from "@/lib/time/bangkok";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";
import { formatWaitQueueTicketDisplay } from "@/systems/wait-queue/lib/ticket-label";

type Tx = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends" | "$use"
>;

type DbLike = Tx | PrismaClient;

/** คิวที่ seed ใส่ — รันซ้ำได้ จะเติมจนครบตามจำนวนตัวอย่าง */
const DEMO_NOTE = "seed:wait-queue-demo-v1";

type SampleRow = {
  partySize: number;
  customerName: string;
  status: "WAITING" | "CALLED" | "SEATED";
};

const SAMPLES: SampleRow[] = [
  { partySize: 2, customerName: "คุณสมชาย", status: "WAITING" },
  { partySize: 1, customerName: "คุณสมหญิง", status: "WAITING" },
  { partySize: 3, customerName: "ครอบครัวทดลอง", status: "CALLED" },
  { partySize: 2, customerName: "คุณเก่า", status: "SEATED" },
  { partySize: 1, customerName: "Walk-in", status: "WAITING" },
];

async function insertDemoTicketsForSite(
  db: DbLike,
  site: { id: string; name: string },
  opts?: { force?: boolean },
): Promise<void> {
  const dateKey = bangkokDateKey();

  if (opts?.force) {
    /** ลบคิววันเก่าทั้งหมด + คิว demo วันนี้ แล้วใส่ใหม่ */
    await db.waitQueueTicket.deleteMany({
      where: { siteId: site.id, dateKey: { lt: dateKey } },
    });
    await db.waitQueueTicket.deleteMany({
      where: { siteId: site.id, dateKey, note: DEMO_NOTE },
    });
  }

  const demoCount = await db.waitQueueTicket.count({
    where: { siteId: site.id, dateKey, note: DEMO_NOTE },
  });
  if (demoCount >= SAMPLES.length) return;

  const need = SAMPLES.length - demoCount;
  const agg = await db.waitQueueTicket.aggregate({
    where: { siteId: site.id, dateKey },
    _max: { ticketSeq: true },
  });
  let seq = agg._max.ticketSeq ?? 0;
  const now = Date.now();

  for (let i = 0; i < need; i++) {
    const idx = demoCount + i;
    const sample = SAMPLES[idx];
    if (!sample) break;
    seq += 1;
    const ticketLabel = formatWaitQueueTicketDisplay(seq);
    let calledAt: Date | null = null;
    let seatedAt: Date | null = null;
    if (sample.status === "CALLED") {
      calledAt = new Date(now - 120_000);
    } else if (sample.status === "SEATED") {
      calledAt = new Date(now - 900_000);
      seatedAt = new Date(now - 600_000);
    }

    await db.waitQueueTicket.create({
      data: {
        siteId: site.id,
        dateKey,
        ticketSeq: seq,
        ticketLabel,
        partySize: sample.partySize,
        customerName: sample.customerName,
        note: DEMO_NOTE,
        status: sample.status,
        calledAt,
        seatedAt,
      },
    });
  }
}

/**
 * เติมคิวตัวอย่าง (production scope, วันนี้ตาม Asia/Bangkok) ให้เจ้าของ
 * @param opts.refreshDaily — เคลียร์คิววันเก่า + รีเฟรชคิว demo วันนี้ (ค่าเริ่ม true)
 */
export async function seedWaitQueueProdDemoForOwner(
  prisma: PrismaClient,
  ownerUserId: string,
  opts?: { refreshDaily?: boolean },
): Promise<void> {
  const refresh = opts?.refreshDaily !== false;
  let site = await prisma.waitQueueSite.findFirst({
    where: { ownerUserId, trialSessionId: TRIAL_PROD_SCOPE },
    orderBy: { createdAt: "asc" },
  });
  if (!site) {
    site = await prisma.waitQueueSite.create({
      data: {
        ownerUserId,
        trialSessionId: TRIAL_PROD_SCOPE,
        name: "คิวหน้าร้าน",
        callMessage: "ถึงคิวแล้ว เชิญเข้าร้าน",
      },
    });
  }

  await insertDemoTicketsForSite(prisma, site, { force: refresh });
}

/** เติมคิวทดลองใน sandbox หลังกดเริ่มทดลองโมดูล */
export async function seedWaitQueueTrialData(tx: Tx, ownerUserId: string, trialSessionId: string): Promise<void> {
  if (!trialSessionId || trialSessionId === TRIAL_PROD_SCOPE) return;

  let site = await tx.waitQueueSite.findFirst({
    where: { ownerUserId, trialSessionId },
    orderBy: { createdAt: "asc" },
  });
  if (!site) {
    site = await tx.waitQueueSite.create({
      data: {
        ownerUserId,
        trialSessionId,
        name: "คิวหน้าร้าน (ทดลอง)",
        callMessage: "ถึงคิวแล้ว เชิญเข้าร้าน",
      },
    });
  }

  await insertDemoTicketsForSite(tx, site);
}
