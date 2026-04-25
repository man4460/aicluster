import { NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { bangkokDayRangeFromDateKey } from "@/lib/barber/booking-datetime";
import { barberOwnerFromAuth } from "@/lib/barber/api-owner";
import { getBarberDataScope } from "@/lib/trial/module-scopes";
import { exclusiveEndAfterInclusiveTo, formatDbDateToYmd, parseYmdToDbDate } from "@/lib/home-finance/entry-date";
import { getModuleBillingContext } from "@/lib/modules/billing-context";
import { addBangkokCalendarDays, formatBangkokHm, formatBangkokYmd } from "@/lib/reminders/bangkok-calendar";
import type {
  DailyDigestFinance,
  DailyDigestNote,
  DailyDigestResponse,
  DailyReminderItem,
  DailyReminderStatus,
} from "@/lib/reminders/daily-reminder-types";

function stepsToDescription(steps: Prisma.JsonValue): string {
  if (steps == null) return "";
  if (typeof steps === "string") return steps.slice(0, 240);
  if (Array.isArray(steps)) {
    const first = steps[0];
    if (typeof first === "string") return first.slice(0, 240);
    if (first && typeof first === "object" && "text" in first) {
      const t = (first as { text?: unknown }).text;
      if (typeof t === "string") return t.slice(0, 240);
    }
  }
  return "";
}

function mapHomeFinanceReminder(row: {
  id: number;
  ownerUserId: string;
  title: string;
  note: string | null;
  dueDate: Date;
  isDone: boolean;
}): DailyReminderItem {
  const dueDate = formatDbDateToYmd(row.dueDate);
  return {
    id: `hfr-${row.id}`,
    userId: row.ownerUserId,
    title: row.title,
    description: row.note?.trim() ?? "",
    dueDate,
    dueTime: "",
    type: "payment",
    status: row.isDone ? "done" : "pending",
    notifyBefore: 0,
    source: "home_finance_reminder",
  };
}

function mapPersonalPlan(row: {
  id: string;
  userId: string;
  title: string;
  steps: Prisma.JsonValue;
  status: string;
  dueDate: Date | null;
}): DailyReminderItem {
  const dueDate = row.dueDate ? formatDbDateToYmd(row.dueDate) : "";
  return {
    id: `plan-${row.id}`,
    userId: row.userId,
    title: row.title,
    description: stepsToDescription(row.steps),
    dueDate,
    dueTime: "",
    type: "task",
    status: row.status === "DONE" || row.status === "CANCELLED" ? "done" : "pending",
    notifyBefore: 0,
    source: "personal_plan",
  };
}

function mapBarberBooking(
  row: { id: number; ownerUserId: string; phone: string; customerName: string | null; scheduledAt: Date; status: string },
  ownerUserId: string,
): DailyReminderItem {
  const dueDate = formatBangkokYmd(row.scheduledAt);
  const dueTime = formatBangkokHm(row.scheduledAt);
  const name = row.customerName?.trim() || row.phone;
  const st: DailyReminderStatus =
    row.status === "CANCELLED" || row.status === "NO_SHOW" ? "done" : "pending";
  return {
    id: `bb-${row.id}`,
    userId: ownerUserId,
    title: `จองคิว — ${name}`,
    description: row.phone,
    dueDate,
    dueTime,
    type: "meeting",
    status: st,
    notifyBefore: 0,
    source: "barber_booking",
  };
}

function sortDigestItems(a: DailyReminderItem, b: DailyReminderItem): number {
  const ta = a.dueTime && /^\d{2}:\d{2}$/.test(a.dueTime) ? a.dueTime : "99:99";
  const tb = b.dueTime && /^\d{2}:\d{2}$/.test(b.dueTime) ? b.dueTime : "99:99";
  if (ta !== tb) return ta.localeCompare(tb);
  return a.title.localeCompare(b.title, "th");
}

function normalizeThaiText(s: string): string {
  return s.replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
}

/** จัดโน้ตข้อความอิสระเข้าช่องวันนี้/พรุ่งนี้จากคำว่า "วันนี้" / "พรุ่งนี้" ในข้อความ */
function digestBucketFromNoteContent(content: string): "today" | "tomorrow" | null {
  const t = normalizeThaiText(content);
  if (!t) return null;
  if (/พรุ่งนี้/u.test(t)) return "tomorrow";
  if (/วันนี้/u.test(t)) return "today";
  return null;
}

function mapNoteToDigestReminder(args: {
  note: { id: string; content: string };
  userId: string;
  bucket: "today" | "tomorrow";
  dayYmd: string;
}): DailyReminderItem {
  const raw = normalizeThaiText(args.note.content);
  const stripped =
    args.bucket === "tomorrow" ? raw.replace(/^พรุ่งนี้\s*/u, "").trim() : raw.replace(/^วันนี้\s*/u, "").trim();
  const title = (stripped || raw).slice(0, 200);
  return {
    id: `note-${args.note.id}-${args.bucket}`,
    userId: args.userId,
    title,
    description: "จากบันทึกรวดเร็ว (จดว่า…)",
    fullText: args.note.content,
    dueDate: args.dayYmd,
    dueTime: "",
    type: "reminder",
    status: "pending",
    notifyBefore: 0,
    source: "personal_note",
  };
}

/**
 * สรุปแจ้งเตือน / งาน / บัญชีวันนี้สำหรับหน้าเลขาส่วนตัว
 * ใช้ session เท่านั้น — ไม่รับ `userId` จาก query (กันสิทธิ์ข้ามผู้ใช้)
 */
export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) {
    return NextResponse.json({ error: "ไม่ได้เข้าสู่ระบบ — ล็อกอินใหม่" }, { status: 401 });
  }

  const userId = auth.session.sub;
  const todayYmd = formatBangkokYmd();
  const tomorrowYmd = addBangkokCalendarDays(todayYmd, 1);
  const todayDb = parseYmdToDbDate(todayYmd);
  const tomorrowDb = parseYmdToDbDate(tomorrowYmd);
  if (!todayDb || !tomorrowDb) {
    return NextResponse.json({ error: "คำนวณวันที่ไม่สำเร็จ" }, { status: 500 });
  }

  const ctx = await getModuleBillingContext(userId);
  const financeOwnerId = ctx && !ctx.isStaff ? ctx.billingUserId : null;

  const [
    homeToday,
    homeTomorrow,
    homeOverdue,
    plansPending,
    notesRows,
    financeAgg,
    financeEntriesRows,
  ] = await Promise.all([
    financeOwnerId
      ? prisma.homeFinanceReminder.findMany({
          where: { ownerUserId: financeOwnerId, dueDate: todayDb, isDone: false },
          orderBy: [{ id: "asc" }],
          take: 30,
        })
      : Promise.resolve([]),
    financeOwnerId
      ? prisma.homeFinanceReminder.findMany({
          where: { ownerUserId: financeOwnerId, dueDate: tomorrowDb, isDone: false },
          orderBy: [{ id: "asc" }],
          take: 30,
        })
      : Promise.resolve([]),
    financeOwnerId
      ? prisma.homeFinanceReminder.findMany({
          where: { ownerUserId: financeOwnerId, dueDate: { lt: todayDb }, isDone: false },
          orderBy: [{ dueDate: "asc" }, { id: "asc" }],
          take: 20,
        })
      : Promise.resolve([]),
    prisma.personalAiPlan.findMany({
      where: { userId, status: { in: ["TODO", "IN_PROGRESS"] } },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      take: 80,
      select: { id: true, userId: true, title: true, steps: true, status: true, dueDate: true },
    }),
    prisma.personalAiNote.findMany({
      where: { userId, hiddenFromDigest: false },
      orderBy: { createdAt: "desc" },
      take: 24,
      select: { id: true, content: true, createdAt: true },
    }),
    financeOwnerId
      ? prisma.homeFinanceEntry.groupBy({
          by: ["type"],
          where: {
            ownerUserId: financeOwnerId,
            entryDate: { gte: todayDb, lt: exclusiveEndAfterInclusiveTo(todayDb) },
          },
          _sum: { amount: true },
        })
      : Promise.resolve([] as { type: string; _sum: { amount: unknown } }[]),
    financeOwnerId
      ? prisma.homeFinanceEntry.findMany({
          where: {
            ownerUserId: financeOwnerId,
            entryDate: { gte: todayDb, lt: exclusiveEndAfterInclusiveTo(todayDb) },
          },
          orderBy: [{ id: "asc" }],
          take: 15,
          select: { id: true, type: true, title: true, categoryLabel: true, amount: true },
        })
      : Promise.resolve([]),
  ]);

  let barberToday: DailyReminderItem[] = [];
  let barberTomorrow: DailyReminderItem[] = [];
  const own = await barberOwnerFromAuth(userId);
  if (own.ok) {
    const scope = await getBarberDataScope(own.ownerId);
    const rToday = bangkokDayRangeFromDateKey(todayYmd);
    const rTomorrow = bangkokDayRangeFromDateKey(tomorrowYmd);
    if (rToday && rTomorrow) {
      const [bToday, bTomorrow] = await Promise.all([
        prisma.barberBooking.findMany({
          where: {
            ownerUserId: own.ownerId,
            trialSessionId: scope.trialSessionId,
            scheduledAt: { gte: rToday.start, lt: rToday.end },
            status: { in: ["SCHEDULED", "ARRIVED"] },
          },
          orderBy: { scheduledAt: "asc" },
          take: 40,
          select: { id: true, ownerUserId: true, phone: true, customerName: true, scheduledAt: true, status: true },
        }),
        prisma.barberBooking.findMany({
          where: {
            ownerUserId: own.ownerId,
            trialSessionId: scope.trialSessionId,
            scheduledAt: { gte: rTomorrow.start, lt: rTomorrow.end },
            status: { in: ["SCHEDULED", "ARRIVED"] },
          },
          orderBy: { scheduledAt: "asc" },
          take: 40,
          select: { id: true, ownerUserId: true, phone: true, customerName: true, scheduledAt: true, status: true },
        }),
      ]);
      barberToday = bToday.map((r) => mapBarberBooking(r, own.ownerId));
      barberTomorrow = bTomorrow.map((r) => mapBarberBooking(r, own.ownerId));
    }
  }

  const hfTodayItems = homeToday.map(mapHomeFinanceReminder);
  const hfTomorrowItems = homeTomorrow.map(mapHomeFinanceReminder);
  const hfOverItems = homeOverdue.map(mapHomeFinanceReminder);

  const plansTodayItems: DailyReminderItem[] = [];
  const plansTomorrowItems: DailyReminderItem[] = [];
  const plansBacklogItems: DailyReminderItem[] = [];
  for (const p of plansPending) {
    const item = mapPersonalPlan(p);
    if (!p.dueDate) {
      plansBacklogItems.push(item);
      continue;
    }
    const y = formatDbDateToYmd(p.dueDate);
    if (y === todayYmd) plansTodayItems.push(item);
    else if (y === tomorrowYmd) plansTomorrowItems.push(item);
    else plansBacklogItems.push(item);
  }

  const noteTodayItems: DailyReminderItem[] = [];
  const noteTomorrowItems: DailyReminderItem[] = [];
  for (const n of notesRows) {
    const bucket = digestBucketFromNoteContent(n.content);
    if (bucket === "today") {
      noteTodayItems.push(mapNoteToDigestReminder({ note: n, userId, bucket: "today", dayYmd: todayYmd }));
    } else if (bucket === "tomorrow") {
      noteTomorrowItems.push(mapNoteToDigestReminder({ note: n, userId, bucket: "tomorrow", dayYmd: tomorrowYmd }));
    }
  }

  const today = [...barberToday, ...hfTodayItems, ...plansTodayItems, ...noteTodayItems].sort(sortDigestItems);
  const tomorrow = [...barberTomorrow, ...hfTomorrowItems, ...plansTomorrowItems, ...noteTomorrowItems].sort(
    sortDigestItems,
  );

  const pendingTodos: DailyReminderItem[] = [...hfOverItems, ...plansBacklogItems];

  let incomeBaht = 0;
  let expenseBaht = 0;
  for (const row of financeAgg) {
    const n = Number(row._sum.amount ?? 0);
    const t = String(row.type);
    if (t === "INCOME") incomeBaht += n;
    if (t === "EXPENSE") expenseBaht += n;
  }

  const financeEntries = financeEntriesRows.map((r) => ({
    id: r.id,
    type: r.type as "INCOME" | "EXPENSE",
    title: r.title,
    categoryLabel: r.categoryLabel,
    amountBaht: Number(r.amount),
  }));

  const financeToday: DailyDigestFinance = {
    available: Boolean(financeOwnerId),
    incomeBaht,
    expenseBaht,
    entries: financeEntries,
  };

  const notes: DailyDigestNote[] = notesRows.slice(0, 8).map((n) => ({
    id: n.id,
    content: n.content,
    createdAt: n.createdAt.toISOString(),
  }));

  const body: DailyDigestResponse = {
    todayYmd,
    tomorrowYmd,
    today,
    tomorrow,
    overdue: hfOverItems,
    pendingTodos,
    financeToday,
    notes,
  };

  return NextResponse.json(body, {
    headers: { "Cache-Control": "private, no-store, max-age=0" },
  });
}
