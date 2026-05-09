import type { PrismaClient } from "@/generated/prisma/client";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";
import {
  buildDocNumber,
  buildTrackingCode,
  defaultThaiAcademicYear,
} from "@/systems/doc-transmission/lib/doc-types";

type Tx = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends" | "$use">;
type DbLike = Tx | PrismaClient;

function ymdToDateUTC(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function shiftYmd(deltaDays: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + deltaDays);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

const DEPARTMENTS = [
  { code: "VIC-1", name: "ฝ่ายวิชาการ", contactPerson: "อ.วิภาดา", phone: "02-111-0001", isInternal: true, sortOrder: 0 },
  { code: "BUD-1", name: "ฝ่ายงบประมาณ", contactPerson: "คุณนพดล", phone: "02-111-0002", isInternal: true, sortOrder: 1 },
  { code: "GEN-1", name: "งานทั่วไป", contactPerson: "คุณสมหญิง", phone: "02-111-0003", isInternal: true, sortOrder: 2 },
  { code: "STU-1", name: "ฝ่ายกิจการนักเรียน", contactPerson: "อ.ภัทร", phone: "02-111-0004", isInternal: true, sortOrder: 3 },
  { code: "EXT-1", name: "เขตพื้นที่การศึกษา", contactPerson: "ศธจ. กรุงเทพ", phone: "02-222-0001", isInternal: false, sortOrder: 4 },
  { code: "EXT-2", name: "สำนักงาน สพฐ.", contactPerson: "งานสารบรรณ", phone: "02-222-0002", isInternal: false, sortOrder: 5 },
] as const;

type RecordSeed = {
  category: "ORDERS" | "MEMOS" | "INCOMING" | "OUTGOING" | "CIRCULARS";
  subject: string;
  person: string;
  deptCode: string;
  recordYmd: string;
  dueYmd?: string;
  status: "NORMAL" | "IN_PROGRESS" | "DONE" | "CANCELED";
  priority: "NORMAL" | "URGENT" | "IMMEDIATE";
  assigneeName?: string;
  assigneeDept?: string;
  note?: string;
  /** เหตุการณ์เพิ่มเติมใน timeline (ถ้าไม่ใส่ จะมีแค่ CREATED) */
  events?: Array<{
    action: "RECEIVED" | "REGISTERED" | "ASSIGNED" | "IN_TRANSIT" | "SIGNED" | "DELIVERED" | "COMPLETED" | "CANCELED" | "NOTE";
    note?: string;
    actor?: string;
    deltaDays?: number;
  }>;
};

const RECORDS: ReadonlyArray<RecordSeed> = [
  {
    category: "ORDERS",
    subject: "แต่งตั้งคณะกรรมการประเมินผลภายใน ภาคเรียนที่ 1",
    person: "ผู้อำนวยการโรงเรียน",
    deptCode: "VIC-1",
    recordYmd: shiftYmd(-30),
    status: "DONE",
    priority: "NORMAL",
    assigneeName: "อ.วิภาดา",
    assigneeDept: "ฝ่ายวิชาการ",
    events: [
      { action: "REGISTERED", actor: "เจ้าหน้าที่สารบรรณ", deltaDays: -29 },
      { action: "SIGNED", note: "ผอ.ลงนามแล้ว", actor: "ผอ.", deltaDays: -28 },
      { action: "COMPLETED", note: "แจ้งคณะกรรมการเรียบร้อย", actor: "อ.วิภาดา", deltaDays: -27 },
    ],
  },
  {
    category: "ORDERS",
    subject: "ปฏิบัติหน้าที่เวรประจำสัปดาห์",
    person: "รองผู้อำนวยการ",
    deptCode: "GEN-1",
    recordYmd: shiftYmd(-7),
    status: "IN_PROGRESS",
    priority: "URGENT",
    assigneeName: "ครูเวร",
    events: [{ action: "ASSIGNED", actor: "งานทั่วไป", deltaDays: -6 }],
  },
  {
    category: "MEMOS",
    subject: "ขออนุมัติจัดซื้อวัสดุการเรียนการสอน ปีการศึกษา 2567",
    person: "อ.วิภาดา",
    deptCode: "VIC-1",
    recordYmd: shiftYmd(-12),
    dueYmd: shiftYmd(-2),
    status: "IN_PROGRESS",
    priority: "URGENT",
    assigneeName: "งานพัสดุ",
    events: [
      { action: "REGISTERED", deltaDays: -11 },
      { action: "ASSIGNED", note: "ส่งงานพัสดุพิจารณา", deltaDays: -10 },
    ],
  },
  {
    category: "MEMOS",
    subject: "ขอใช้ห้องประชุมประจำเดือน",
    person: "อ.ภัทร",
    deptCode: "STU-1",
    recordYmd: shiftYmd(-3),
    status: "DONE",
    priority: "NORMAL",
    events: [{ action: "COMPLETED", note: "อนุมัติใช้ห้องประชุม A", deltaDays: -1 }],
  },
  {
    category: "INCOMING",
    subject: "การจัดสรรงบประมาณค่าใช้จ่ายในการดำเนินงาน",
    person: "สำนักงาน สพฐ.",
    deptCode: "EXT-2",
    recordYmd: shiftYmd(-5),
    dueYmd: shiftYmd(10),
    status: "IN_PROGRESS",
    priority: "IMMEDIATE",
    assigneeName: "คุณนพดล",
    assigneeDept: "ฝ่ายงบประมาณ",
    events: [
      { action: "RECEIVED", note: "รับเอกสารจาก สพฐ.", deltaDays: -5 },
      { action: "REGISTERED", deltaDays: -5 },
      { action: "ASSIGNED", note: "ส่งฝ่ายงบประมาณดำเนินการ", deltaDays: -4 },
    ],
  },
  {
    category: "INCOMING",
    subject: "ขอความอนุเคราะห์สถานที่จัดกิจกรรม",
    person: "เครือข่ายผู้ปกครอง",
    deptCode: "EXT-1",
    recordYmd: shiftYmd(-15),
    status: "DONE",
    priority: "NORMAL",
    events: [{ action: "COMPLETED", note: "ตอบกลับยินยอมแล้ว", deltaDays: -10 }],
  },
  {
    category: "OUTGOING",
    subject: "รายงานผลการดำเนินงานประจำเดือน",
    person: "เขตพื้นที่การศึกษา",
    deptCode: "EXT-1",
    recordYmd: shiftYmd(-2),
    status: "NORMAL",
    priority: "NORMAL",
    events: [{ action: "DELIVERED", note: "ส่งทางไปรษณีย์ลงทะเบียน", deltaDays: -1 }],
  },
  {
    category: "OUTGOING",
    subject: "ขอเชิญร่วมเป็นวิทยากรในการอบรมครู",
    person: "วิทยากรภายนอก",
    deptCode: "EXT-1",
    recordYmd: shiftYmd(-20),
    status: "DONE",
    priority: "NORMAL",
    events: [
      { action: "SIGNED", deltaDays: -19 },
      { action: "DELIVERED", note: "ส่งทาง email", deltaDays: -19 },
      { action: "COMPLETED", deltaDays: -18 },
    ],
  },
  {
    category: "CIRCULARS",
    subject: "ประกาศแนวปฏิบัติการแต่งกายของบุคลากร",
    person: "กลุ่มบริหารทั่วไป",
    deptCode: "GEN-1",
    recordYmd: shiftYmd(-1),
    status: "NORMAL",
    priority: "NORMAL",
  },
  {
    category: "CIRCULARS",
    subject: "เวียนแจ้งกำหนดการสอบกลางภาค",
    person: "ฝ่ายวิชาการ",
    deptCode: "VIC-1",
    recordYmd: shiftYmd(-25),
    status: "DONE",
    priority: "URGENT",
    events: [{ action: "COMPLETED", note: "แจ้งครูทุกท่าน", deltaDays: -23 }],
  },
];

export async function seedDocTransmissionProdDemoForOwner(
  db: DbLike,
  ownerUserId: string,
): Promise<void> {
  const trialSessionId = TRIAL_PROD_SCOPE;
  const existing = await db.docTransmissionRecord.count({ where: { ownerUserId, trialSessionId } });
  if (existing > 0) return;
  await seedDocTransmissionDemoForUser(db, ownerUserId, trialSessionId);
}

export async function seedDocTransmissionDemoForUser(
  db: DbLike,
  ownerUserId: string,
  trialSessionId: string = TRIAL_PROD_SCOPE,
): Promise<void> {
  await db.docTransmissionSettings.upsert({
    where: { ownerUserId_trialSessionId: { ownerUserId, trialSessionId } },
    update: {
      orgName: "โรงเรียนสาธิตวิทยา",
      orgAddress: "เลขที่ 99 ถนนพหลโยธิน เขตจตุจักร กรุงเทพฯ 10900",
      orgPhone: "02-111-0000",
      defaultYear: defaultThaiAcademicYear(),
    },
    create: {
      ownerUserId,
      trialSessionId,
      orgName: "โรงเรียนสาธิตวิทยา",
      orgAddress: "เลขที่ 99 ถนนพหลโยธิน เขตจตุจักร กรุงเทพฯ 10900",
      orgPhone: "02-111-0000",
      defaultYear: defaultThaiAcademicYear(),
    },
  });

  const deptMap = new Map<string, number>();
  for (const d of DEPARTMENTS) {
    const row = await db.docTransmissionDepartment.upsert({
      where: { ownerUserId_trialSessionId_code: { ownerUserId, trialSessionId, code: d.code } },
      update: {
        name: d.name,
        contactPerson: d.contactPerson,
        phone: d.phone,
        isInternal: d.isInternal,
        sortOrder: d.sortOrder,
        isActive: true,
      },
      create: {
        ownerUserId,
        trialSessionId,
        code: d.code,
        name: d.name,
        contactPerson: d.contactPerson,
        phone: d.phone,
        isInternal: d.isInternal,
        sortOrder: d.sortOrder,
      },
    });
    deptMap.set(d.code, row.id);
  }

  const seqByCatYear = new Map<string, number>();
  const PREFIX_MAP = {
    ORDERS: "ORD",
    MEMOS: "MEM",
    INCOMING: "IN",
    OUTGOING: "OUT",
    CIRCULARS: "CIR",
  } as const;

  const year = defaultThaiAcademicYear();

  for (const r of RECORDS) {
    const key = `${r.category}:${year}`;
    const seq = (seqByCatYear.get(key) ?? 0) + 1;
    seqByCatYear.set(key, seq);
    const docNumber = buildDocNumber(PREFIX_MAP[r.category], year, seq);
    const trackingCode = buildTrackingCode("DOC", r.category, seq + Math.floor(Math.random() * 7));

    const recordDate = ymdToDateUTC(r.recordYmd);
    const dueDate = r.dueYmd ? ymdToDateUTC(r.dueYmd) : null;

    const created = await db.docTransmissionRecord.create({
      data: {
        ownerUserId,
        trialSessionId,
        category: r.category,
        academicYear: year,
        runningSeq: seq,
        docNumber,
        subject: r.subject,
        person: r.person,
        departmentId: deptMap.get(r.deptCode) ?? null,
        recordDate,
        dueDate,
        status: r.status,
        priority: r.priority,
        assigneeName: r.assigneeName ?? null,
        assigneeDept: r.assigneeDept ?? null,
        trackingCode,
        note: r.note ?? null,
      },
    });

    await db.docTransmissionTimelineEntry.create({
      data: {
        recordId: created.id,
        ownerUserId,
        trialSessionId,
        action: "CREATED",
        actorName: "เจ้าหน้าที่สารบรรณ",
        occurredAt: recordDate,
      },
    });

    for (const ev of r.events ?? []) {
      const occurred = new Date();
      occurred.setUTCDate(occurred.getUTCDate() + (ev.deltaDays ?? 0));
      await db.docTransmissionTimelineEntry.create({
        data: {
          recordId: created.id,
          ownerUserId,
          trialSessionId,
          action: ev.action,
          note: ev.note ?? null,
          actorName: ev.actor ?? null,
          occurredAt: occurred,
        },
      });
    }

    await db.docTransmissionAuditLog.create({
      data: {
        ownerUserId,
        trialSessionId,
        recordId: created.id,
        action: "CREATE",
        actorName: "ระบบ seed",
      },
    });
  }
}
