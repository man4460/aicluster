import { randomBytes } from "crypto";
import type { PrismaClient } from "@/generated/prisma/client";
import { bangkokDateKeyMinusDays } from "@/lib/barber/bangkok-day";
import {
  DEMO_MODULE_CONTACT,
  DEMO_MODULE_PAYMENT,
  DEMO_PAYMENT_SLIP_URL,
  trialDemoDisplayName,
} from "@/lib/trial/demo-module-settings";
import { hashStaffDailyPin } from "@/lib/modules/staff-daily-pin";
import { bangkokDateKey } from "@/lib/time/bangkok";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";
import { ensureSmartGuardShop } from "@/systems/smart-guard-tour/lib/ensure-shop";
import { recomputeSmartGuardWorkSpanForPostDuty } from "@/systems/smart-guard-tour/lib/work-span";
import {
  SMART_GUARD_PORTAL_SAMPLE_BANNER,
  SMART_GUARD_PORTAL_SAMPLE_GALLERY,
  SMART_GUARD_SAMPLE_LOGO,
  SMART_GUARD_SAMPLE_YOUTUBE,
  smartGuardCheckpointSampleImage,
  smartGuardStaffSamplePhoto,
} from "@/systems/smart-guard-tour/lib/portal-media";

/** PIN เว็บพนักงานตัวอย่าง — ใช้ทดลองลิงก์ staff */
export const SMART_GUARD_DEMO_STAFF_PIN = "1234";

type Tx = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends" | "$use"
>;
type DbLike = PrismaClient | Tx;

const DEMO_NOTE = "[SGT_DEMO]";

const CHECKPOINTS: ReadonlyArray<{
  name: string;
  slug: string;
  zoneLabel: string;
  buildingLabel: string;
  floorLabel: string;
  lat: number;
  lng: number;
}> = [
  { name: "ประตูหลัก A", slug: "gate-a", zoneLabel: "ทางเข้า", buildingLabel: "อาคาร A", floorLabel: "G", lat: 13.7563, lng: 100.5018 },
  { name: "ลานจอดรถ B1", slug: "parking-b1", zoneLabel: "จอดรถ", buildingLabel: "อาคาร B", floorLabel: "B1", lat: 13.7565, lng: 100.502 },
  { name: "ห้องควบคุม CCTV", slug: "cctv-room", zoneLabel: "ศูนย์ควบคุม", buildingLabel: "อาคาร A", floorLabel: "2", lat: 13.7564, lng: 100.5019 },
  { name: "คลังสินค้า C", slug: "warehouse-c", zoneLabel: "คลัง", buildingLabel: "อาคาร C", floorLabel: "1", lat: 13.7568, lng: 100.5022 },
  { name: "หลังอาคาร D", slug: "rear-d", zoneLabel: "รอบรั้ว", buildingLabel: "อาคาร D", floorLabel: "G", lat: 13.757, lng: 100.5025 },
  { name: "ลิฟต์ผู้โดยสาร 1", slug: "lift-1", zoneLabel: "ลิฟต์", buildingLabel: "อาคาร A", floorLabel: "G", lat: 13.75635, lng: 100.50185 },
  { name: "ห้องไฟฟ้า", slug: "electrical", zoneLabel: "วิศวกรรม", buildingLabel: "อาคาร B", floorLabel: "B2", lat: 13.75655, lng: 100.50205 },
  { name: "ดาดฟ้า", slug: "rooftop", zoneLabel: "ดาดฟ้า", buildingLabel: "อาคาร A", floorLabel: "R", lat: 13.75632, lng: 100.50182 },
  { name: "ประตูฉุกเฉิน E", slug: "emergency-e", zoneLabel: "ฉุกเฉิน", buildingLabel: "อาคาร E", floorLabel: "G", lat: 13.7572, lng: 100.5028 },
  { name: "จุดพัก รปภ.", slug: "guard-post", zoneLabel: "พักคอย", buildingLabel: "อาคาร A", floorLabel: "G", lat: 13.75628, lng: 100.50175 },
  { name: "ห้องเซิร์ฟเวอร์", slug: "server-room", zoneLabel: "IT", buildingLabel: "อาคาร B", floorLabel: "3", lat: 13.7566, lng: 100.5021 },
  { name: "รั้วด้านตะวันออก", slug: "fence-east", zoneLabel: "รอบรั้ว", buildingLabel: "ภายนอก", floorLabel: "G", lat: 13.7574, lng: 100.503 },
];

const STAFF_NAMES = [
  "สมชาย รักษาการ",
  "วิชัย ยามดี",
  "ประยุทธ์ เฝ้าระวัง",
  "สุรชัย ตรวจการณ์",
  "มานพ ลาดตระเวน",
  "กิตติ ดูแลไซต์",
  "อนุชา กะดึก",
  "ธีรพงศ์ กะเช้า",
] as const;

function phoneAt(i: number): string {
  return `08${String(10000000 + i * 137).slice(0, 8)}`;
}

function qrToken(prefix: string, i: number): string {
  return `${prefix}-${i}-${randomBytes(8).toString("hex")}`;
}

function bangkokAt(ymd: string, hour: number, minute = 0): Date {
  return new Date(`${ymd}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00+07:00`);
}

async function wipeSmartGuardDemoData(db: DbLike, ownerUserId: string, trialSessionId: string) {
  const where = { ownerUserId, trialSessionId };
  await db.smartGuardWorkSpan.deleteMany({ where });
  await db.smartGuardTourAssignment.deleteMany({ where });
  await db.smartGuardAttendanceStaffLink.deleteMany({ where });
  await db.smartGuardCheckpointVideo.deleteMany({ where });
  await db.smartGuardIncidentImage.deleteMany({ where });
  await db.smartGuardTourLog.deleteMany({ where });
  await db.smartGuardIncident.deleteMany({ where });
  await db.smartGuardShiftLog.deleteMany({ where });
  await db.smartGuardPostDuty.deleteMany({ where });
  await db.smartGuardDutyTemplate.deleteMany({ where });
  await db.smartGuardPost.deleteMany({ where });
  await db.smartGuardCheckpoint.deleteMany({ where });
  await db.smartGuardSchedule.deleteMany({ where });
  await db.smartGuardLedgerEntry.deleteMany({ where });
  await db.smartGuardAsset.deleteMany({ where });
  await db.smartGuardContact.deleteMany({ where });
  await db.smartGuardStaff.deleteMany({ where });
  await db.smartGuardFinanceCategory.deleteMany({ where });
  await db.smartGuardShop.deleteMany({ where });
}

async function upsertDemoShop(db: DbLike, ownerUserId: string, trialSessionId: string, displayName: string) {
  const shop = await ensureSmartGuardShop(db, ownerUserId, trialSessionId);
  const galleryJson = JSON.stringify([...SMART_GUARD_PORTAL_SAMPLE_GALLERY]);
  const staffDailyPinHash = await hashStaffDailyPin(SMART_GUARD_DEMO_STAFF_PIN);
  return db.smartGuardShop.update({
    where: { id: shop.id },
    data: {
      displayName,
      tagline: "จุดตรวจ · สายตรวจ · กะ · เหตุการณ์",
      logoUrl: SMART_GUARD_SAMPLE_LOGO,
      address: DEMO_MODULE_CONTACT.address,
      contactPhone: DEMO_MODULE_CONTACT.contactPhone,
      emergencyPhone: "191",
      contactLine: DEMO_MODULE_CONTACT.lineId,
      facebookUrl: DEMO_MODULE_CONTACT.facebookUrl,
      mapUrl: DEMO_MODULE_CONTACT.mapUrl,
      shopLat: 13.7563,
      shopLng: 100.5018,
      openTimeHm: "00:00",
      closeTimeHm: "23:59",
      portalBannerUrl: SMART_GUARD_PORTAL_SAMPLE_BANNER,
      portalGalleryJson: galleryJson,
      portalEnabled: true,
      portalSosEnabled: true,
      portalIntroHtml: "<p>ศูนย์ควบคุมจุดตรวจ</p>",
      payoutMode: "ADVANCE",
      staffDailyPinHash,
      promptPayPhone: DEMO_MODULE_PAYMENT.promptPayPhone,
      bankName: DEMO_MODULE_PAYMENT.bankName,
      bankAccountNumber: DEMO_MODULE_PAYMENT.bankAccountNumber,
      bankAccountName: DEMO_MODULE_PAYMENT.bankAccountName,
      taxId: DEMO_MODULE_PAYMENT.taxId,
      slipPaperSize: "SLIP_58",
    },
  });
}

async function seedSmartGuardActivity(
  db: DbLike,
  ownerUserId: string,
  trialSessionId: string,
  shopId: string,
): Promise<void> {
  const today = bangkokDateKey();
  const scope = { ownerUserId, trialSessionId, shopId };

  const staffRows = await Promise.all(
    STAFF_NAMES.map((displayName, i) =>
      db.smartGuardStaff.create({
        data: {
          ...scope,
          displayName,
          /** คนแรกใช้เบอร์เดียวกับ attendance roster demo (0812345678) เพื่อแม็ปสะพาน */
          phone: i === 0 ? "0812345678" : phoneAt(i + 10),
          photoUrl: smartGuardStaffSamplePhoto(i),
          workStartHm: i % 2 === 0 ? "08:00" : "20:00",
          workEndHm: i % 2 === 0 ? "20:00" : "08:00",
          wageBahtPerShift: 600 + (i % 3) * 50,
          otBahtPerHour: 80,
          hourlyRateBaht: 50 + (i % 4) * 5,
          isActive: i < 7,
          note: DEMO_NOTE,
        },
      }),
    ),
  );

  const checkpoints = await Promise.all(
    CHECKPOINTS.map((cp, i) =>
      db.smartGuardCheckpoint.create({
        data: {
          ...scope,
          name: cp.name,
          slug: cp.slug,
          zoneLabel: cp.zoneLabel,
          buildingLabel: cp.buildingLabel,
          floorLabel: cp.floorLabel,
          lat: cp.lat,
          lng: cp.lng,
          geofenceRadiusM: 60 + (i % 3) * 20,
          coverImageUrl: smartGuardCheckpointSampleImage(i),
          qrToken: qrToken("sgt-qr", i),
          sortOrder: (i + 1) * 10,
          isActive: i < 11,
          note: DEMO_NOTE,
        },
      }),
    ),
  );

  for (let i = 0; i < Math.min(6, checkpoints.length); i++) {
    const cp = checkpoints[i]!;
    await db.smartGuardCheckpointVideo.create({
      data: {
        ownerUserId,
        trialSessionId,
        checkpointId: cp.id,
        youtubeUrl: SMART_GUARD_SAMPLE_YOUTUBE[i % SMART_GUARD_SAMPLE_YOUTUBE.length]!,
        title: `วิดีโอจุดตรวจ · ${cp.name}`,
        sortOrder: 0,
      },
    });
  }

  const scheduleDay = await db.smartGuardSchedule.create({
    data: {
      ...scope,
      name: "สายตรวจกลางวัน",
      routeMode: "SEQUENTIAL",
      intervalMinutes: 120,
      checkpointIdsJson: JSON.stringify(checkpoints.slice(0, 6).map((c) => c.id)),
      isActive: true,
    },
  });
  const scheduleNight = await db.smartGuardSchedule.create({
    data: {
      ...scope,
      name: "สายตรวจกลางคืน",
      routeMode: "FREE",
      intervalMinutes: 90,
      checkpointIdsJson: JSON.stringify(checkpoints.slice(4, 10).map((c) => c.id)),
      isActive: true,
    },
  });
  await db.smartGuardSchedule.create({
    data: {
      ...scope,
      name: "สายตรวจฉุกเฉิน (พักใช้)",
      routeMode: "FREE",
      intervalMinutes: 60,
      checkpointIdsJson: JSON.stringify(checkpoints.slice(8, 12).map((c) => c.id)),
      isActive: false,
    },
  });

  const templates = await db.smartGuardDutyTemplate.findMany({
    where: { shopId },
    orderBy: { sortOrder: "asc" },
  });
  const tplDay = templates.find((t) => t.startHm === "07:00") ?? templates[0];
  const tplNight = templates.find((t) => t.startHm === "19:00") ?? templates[1] ?? tplDay;

  const posts = await Promise.all(
    [
      { name: "ป้อมประตูหลัก A", code: "POST-A", zoneLabel: "ทางเข้า", buildingLabel: "อาคาร A", req: 1 },
      { name: "ป้อมลานจอด B1", code: "POST-B1", zoneLabel: "จอดรถ", buildingLabel: "อาคาร B", req: 1 },
      { name: "ล็อบบี้ A", code: "POST-LOB", zoneLabel: "ล็อบบี้", buildingLabel: "อาคาร A", req: 1 },
      { name: "คลัง C", code: "POST-C", zoneLabel: "คลัง", buildingLabel: "อาคาร C", req: 2 },
    ].map((p, i) =>
      db.smartGuardPost.create({
        data: {
          ...scope,
          name: p.name,
          code: p.code,
          zoneLabel: p.zoneLabel,
          buildingLabel: p.buildingLabel,
          linkedCheckpointIdsJson: JSON.stringify(
            checkpoints.slice(i * 2, i * 2 + 2).map((c) => c.id),
          ),
          requiredStaffPerShift: p.req,
          sortOrder: (i + 1) * 10,
          isActive: true,
          note: DEMO_NOTE,
        },
      }),
    ),
  );

  if (tplDay && posts[0] && staffRows[0]) {
    const d0 = await db.smartGuardPostDuty.create({
      data: {
        ...scope,
        dutyOn: today,
        postId: posts[0].id,
        staffId: staffRows[0].id,
        templateId: tplDay.id,
        status: "CHECKED_IN",
      },
    });
    await db.smartGuardTourAssignment.create({
      data: {
        ...scope,
        dutyOn: today,
        scheduleId: scheduleDay.id,
        staffId: staffRows[0].id,
        templateId: tplDay.id,
        postDutyId: d0.id,
      },
    });
  }
  if (tplDay && posts[1] && staffRows[2]) {
    await db.smartGuardPostDuty.create({
      data: {
        ...scope,
        dutyOn: today,
        postId: posts[1].id,
        staffId: staffRows[2].id,
        templateId: tplDay.id,
        status: "PLANNED",
      },
    });
  }
  if (tplNight && posts[2] && staffRows[1]) {
    const dN = await db.smartGuardPostDuty.create({
      data: {
        ...scope,
        dutyOn: today,
        postId: posts[2].id,
        staffId: staffRows[1].id,
        templateId: tplNight.id,
        status: "PLANNED",
      },
    });
    await db.smartGuardTourAssignment.create({
      data: {
        ...scope,
        dutyOn: today,
        scheduleId: scheduleNight.id,
        staffId: staffRows[1].id,
        templateId: tplNight.id,
        postDutyId: dN.id,
      },
    });
  }
  if (tplDay && posts[3] && staffRows[4] && staffRows[6]) {
    await db.smartGuardPostDuty.create({
      data: {
        ...scope,
        dutyOn: today,
        postId: posts[3].id,
        staffId: staffRows[4].id,
        templateId: tplDay.id,
        status: "PLANNED",
      },
    });
    await db.smartGuardPostDuty.create({
      data: {
        ...scope,
        dutyOn: today,
        postId: posts[3].id,
        staffId: staffRows[6].id,
        templateId: tplDay.id,
        status: "PLANNED",
      },
    });
  }

  // จัดเวรย้อนหลัง 6 วันให้คนแรก (กะ 12 ชม.) — ค่าแรงนับตามกะ → เกิน 48 ชม.ปกติ/สัปดาห์
  if (tplDay && posts[0] && staffRows[0]) {
    for (let dayAgo = 1; dayAgo < 7; dayAgo++) {
      const day = bangkokDateKeyMinusDays(today, dayAgo);
      await db.smartGuardPostDuty.create({
        data: {
          ...scope,
          dutyOn: day,
          postId: posts[0].id,
          staffId: staffRows[0].id,
          templateId: tplDay.id,
          status: "DONE",
        },
      });
    }
  }

  // คำนวณ WorkSpan จากทุก PostDuty (แหล่งชั่วโมง = แม่แบบกะ ไม่ใช่เช็คอิน)
  const allDuties = await db.smartGuardPostDuty.findMany({
    where: { shopId },
    orderBy: [{ dutyOn: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });
  for (const d of allDuties) {
    await recomputeSmartGuardWorkSpanForPostDuty(db, d.id);
  }

  const contacts = await Promise.all(
    (
      [
        { displayName: "หัวหน้าศูนย์ควบคุม", phone: phoneAt(90), lineId: "@sgt-control", isActive: true },
        { displayName: "ผู้จัดการอาคาร", phone: phoneAt(91), lineId: "@sgt-facility", isActive: true },
        { displayName: "สายด่วนฉุกเฉิน", phone: "191", lineId: null, isActive: true },
        { displayName: "ช่างซ่อมบำรุง", phone: phoneAt(92), lineId: "@sgt-tech", isActive: true },
        { displayName: "ผู้จัดการความปลอดภัย", phone: phoneAt(93), lineId: "@sgt-safety", isActive: true },
        { displayName: "ประสานงานลูกค้า", phone: phoneAt(94), lineId: "@sgt-client", isActive: false },
      ] as const
    ).map((c) =>
      db.smartGuardContact.create({
        data: {
          ...scope,
          displayName: c.displayName,
          phone: c.phone,
          lineId: c.lineId,
          isActive: c.isActive,
          note: DEMO_NOTE,
        },
      }),
    ),
  );

  const assets = await Promise.all(
    [
      { name: "วิทยุสื่อสาร #1", kind: "RADIO", assetCode: "RAD-001", status: "AVAILABLE" },
      { name: "วิทยุสื่อสาร #2", kind: "RADIO", assetCode: "RAD-002", status: "IN_USE" },
      { name: "ไฟฉาย LED", kind: "FLASHLIGHT", assetCode: "FL-01", status: "AVAILABLE" },
      { name: "ไฟฉายสำรอง", kind: "FLASHLIGHT", assetCode: "FL-02", status: "MAINTENANCE" },
      { name: "รถตรวจการณ์", kind: "VEHICLE", assetCode: "VH-01", status: "IN_USE" },
      { name: "ชุดปฐมพยาบาล", kind: "OTHER", assetCode: "FA-01", status: "AVAILABLE" },
      { name: "กล้องตรวจการณ์มือถือ", kind: "OTHER", assetCode: "CAM-01", status: "IN_USE" },
      { name: "วิทยุสื่อสาร #3 (ชำรุด)", kind: "RADIO", assetCode: "RAD-003", status: "RETIRED" },
    ].map((a) =>
      db.smartGuardAsset.create({
        data: {
          ...scope,
          name: a.name,
          kind: a.kind,
          assetCode: a.assetCode,
          status: a.status,
          note: DEMO_NOTE,
        },
      }),
    ),
  );

  // กะจากเช็คอิน demo — สถานะเข้างานเท่านั้น (ค่าแรงมาจาก PostDuty แล้ว)
  for (let dayAgo = 0; dayAgo < 7; dayAgo++) {
    const day = bangkokDateKeyMinusDays(today, dayAgo);
    for (let i = 0; i < staffRows.length; i++) {
      if (!staffRows[i]!.isActive) continue;
      const isDayShift = i % 2 === 0;
      if (dayAgo === 0) {
        if (isDayShift && i > 6) continue;
        if (!isDayShift && i > 5) continue;
      } else if (i > 5) {
        continue;
      }
      // คนแรกมีเวรป้อม + WorkSpan แล้ว — ไม่สร้าง ShiftLog ซ้ำ
      if (i === 0) continue;
      const checkInH = isDayShift ? 7 : 19;
      const checkOutH = isDayShift ? 19 : 7;
      let checkOutAt: Date | null = null;
      if (dayAgo === 0) {
        if (isDayShift && i === 3) checkOutAt = bangkokAt(day, 16, 0);
      } else {
        const outDay = isDayShift ? day : bangkokDateKeyMinusDays(day, -1);
        checkOutAt = bangkokAt(outDay, checkOutH, 5);
      }
      const tpl = isDayShift ? tplDay : tplNight;
      const dutyForDay = await db.smartGuardPostDuty.findFirst({
        where: { shopId, staffId: staffRows[i]!.id, dutyOn: day },
        select: { id: true, templateId: true },
      });
      await db.smartGuardShiftLog.create({
        data: {
          ...scope,
          staffId: staffRows[i]!.id,
          shiftOn: day,
          checkInAt: bangkokAt(day, checkInH, 30 + (i % 15)),
          checkOutAt,
          note: DEMO_NOTE,
          templateId: dutyForDay?.templateId ?? tpl?.id ?? null,
          postDutyId: dutyForDay?.id ?? null,
        },
      });
    }
  }

  // สายตรวจย้อนหลัง + วันนี้
  const statuses = ["CHECKED_OK", "CHECKED_OK", "CHECKED_ISSUE", "OVERDUE", "MISSED", "PENDING"] as const;
  for (let dayAgo = 0; dayAgo < 10; dayAgo++) {
    const day = bangkokDateKeyMinusDays(today, dayAgo);
    for (let i = 0; i < checkpoints.length; i++) {
      if (dayAgo > 0 && i > 7) continue;
      const cp = checkpoints[i]!;
      const staff = staffRows[i % staffRows.length]!;
      const status = dayAgo === 0 && i >= 8 ? "PENDING" : statuses[i % statuses.length]!;
      await db.smartGuardTourLog.create({
        data: {
          ...scope,
          checkpointId: cp.id,
          staffId: staff.id,
          scheduleId: i % 2 === 0 ? scheduleDay.id : scheduleNight.id,
          status,
          scannedAt: status === "PENDING" || status === "MISSED" ? null : bangkokAt(day, 8 + (i % 10), (i * 7) % 60),
          scanLat: status.startsWith("CHECKED") ? Number(cp.lat) + 0.00001 : null,
          scanLng: status.startsWith("CHECKED") ? Number(cp.lng) + 0.00001 : null,
          photoUrl: status === "CHECKED_OK" ? smartGuardCheckpointSampleImage(i) : null,
          note: DEMO_NOTE,
          scanToken: status.startsWith("CHECKED") ? qrToken("scan", i + dayAgo * 20) : null,
          entryOn: day,
        },
      });
    }
  }

  const openIncidents = [
    {
      title: "พบประตูฉุกเฉินเปิดค้าง",
      kind: "ISSUE",
      severity: "MEDIUM",
      status: "PENDING",
      checkpointId: checkpoints[8]!.id,
    },
    {
      title: "SOS — ได้ยินเสียงดังผิดปกติ",
      kind: "SOS_URGENT",
      severity: "HIGH",
      status: "IN_PROGRESS",
      checkpointId: checkpoints[4]!.id,
    },
    {
      title: "ไฟทางเดินชั้น 2 ดับ",
      kind: "ISSUE",
      severity: "LOW",
      status: "PENDING",
      checkpointId: checkpoints[5]!.id,
    },
    {
      title: "รั้วด้านตะวันออกหลวม",
      kind: "ISSUE",
      severity: "CRITICAL",
      status: "IN_PROGRESS",
      checkpointId: checkpoints[11]!.id,
    },
  ] as const;

  for (let i = 0; i < openIncidents.length; i++) {
    const inc = openIncidents[i]!;
    const row = await db.smartGuardIncident.create({
      data: {
        ...scope,
        checkpointId: inc.checkpointId,
        staffId: staffRows[i]!.id,
        contactId: contacts[i % contacts.length]!.id,
        kind: inc.kind,
        status: inc.status,
        severity: inc.severity,
        title: inc.title,
        detail: DEMO_NOTE,
        reportLat: 13.7563 + i * 0.0002,
        reportLng: 100.5018 + i * 0.0002,
      },
    });
    await db.smartGuardIncidentImage.create({
      data: {
        ownerUserId,
        trialSessionId,
        incidentId: row.id,
        imageUrl: smartGuardCheckpointSampleImage(i + 2),
        sortOrder: 0,
      },
    });
    if (i < 2) {
      await db.smartGuardIncidentImage.create({
        data: {
          ownerUserId,
          trialSessionId,
          incidentId: row.id,
          imageUrl: smartGuardCheckpointSampleImage(i + 5),
          sortOrder: 1,
        },
      });
    }
  }

  await db.smartGuardIncident.create({
    data: {
      ...scope,
      checkpointId: checkpoints[2]!.id,
      staffId: staffRows[0]!.id,
      contactId: contacts[0]!.id,
      kind: "OTHER",
      status: "RESOLVED",
      severity: "LOW",
      title: "ตรวจพบกล้อง CCTV รีบูตเอง",
      detail: DEMO_NOTE,
      resolvedNote: "รีสตาร์ท NVR แล้วปกติ",
      resolvedAt: bangkokAt(bangkokDateKeyMinusDays(today, 1), 14, 0),
    },
  });
  await db.smartGuardIncident.create({
    data: {
      ...scope,
      checkpointId: checkpoints[0]!.id,
      staffId: staffRows[1]!.id,
      contactId: contacts[1]!.id,
      kind: "ISSUE",
      status: "CLOSED",
      severity: "MEDIUM",
      title: "รถจอดขวางประตูหลัก",
      detail: DEMO_NOTE,
      resolvedNote: "แจ้งเจ้าของรถย้ายแล้ว — ปิดเคส",
      resolvedAt: bangkokAt(bangkokDateKeyMinusDays(today, 3), 11, 30),
    },
  });

  const categories = await db.smartGuardFinanceCategory.findMany({
    where: { shopId },
    select: { id: true, kind: true, systemKey: true },
  });
  const incomeCat = categories.find((c) => c.systemKey === "SECURITY_SERVICE") ?? categories.find((c) => c.kind === "INCOME");
  const wageCat = categories.find((c) => c.systemKey === "GUARD_WAGES");
  const otCat = categories.find((c) => c.systemKey === "OT_BONUS");
  const equipCat = categories.find((c) => c.systemKey === "TOUR_EQUIPMENT");
  const otherCat = categories.find((c) => c.systemKey === "OTHER");

  for (let dayAgo = 0; dayAgo < 21; dayAgo++) {
    const day = bangkokDateKeyMinusDays(today, dayAgo);
    if (incomeCat) {
      await db.smartGuardLedgerEntry.create({
        data: {
          ...scope,
          categoryId: incomeCat.id,
          kind: "INCOME",
          title: dayAgo % 7 === 0 ? "ค่าบริการรักษาความปลอดภัย (รายเดือน)" : "ค่าบริการรักษาความปลอดภัย",
          amountBaht: dayAgo % 7 === 0 ? 45000 : 15000 + (dayAgo % 5) * 500,
          entryOn: day,
          paymentMethod: dayAgo % 2 === 0 ? "TRANSFER" : "PROMPTPAY",
          slipImageUrl: dayAgo % 3 === 0 ? DEMO_PAYMENT_SLIP_URL : null,
          note: DEMO_NOTE,
        },
      });
    }
    if (wageCat && dayAgo % 2 === 0) {
      await db.smartGuardLedgerEntry.create({
        data: {
          ...scope,
          categoryId: wageCat.id,
          staffId: staffRows[dayAgo % staffRows.length]!.id,
          kind: "EXPENSE",
          title: "ค่าแรง รปภ.",
          amountBaht: 2400 + (dayAgo % 4) * 100,
          entryOn: day,
          paymentMethod: "CASH",
          note: DEMO_NOTE,
        },
      });
    }
    if (otCat && dayAgo % 3 === 0) {
      await db.smartGuardLedgerEntry.create({
        data: {
          ...scope,
          categoryId: otCat.id,
          staffId: staffRows[(dayAgo + 1) % staffRows.length]!.id,
          kind: "EXPENSE",
          title: "ค่า OT / เบี้ยขยัน",
          amountBaht: 320 + dayAgo * 10,
          entryOn: day,
          paymentMethod: "TRANSFER",
          slipImageUrl: dayAgo % 6 === 0 ? DEMO_PAYMENT_SLIP_URL : null,
          note: DEMO_NOTE,
        },
      });
    }
    if (equipCat && (dayAgo === 2 || dayAgo === 9)) {
      await db.smartGuardLedgerEntry.create({
        data: {
          ...scope,
          categoryId: equipCat.id,
          assetId: assets[dayAgo === 2 ? 0 : 2]!.id,
          kind: "EXPENSE",
          title: dayAgo === 2 ? "ซื้อแบตวิทยุสื่อสาร" : "เปลี่ยนหลอดไฟฉาย",
          amountBaht: dayAgo === 2 ? 1800 : 450,
          entryOn: day,
          paymentMethod: "TRANSFER",
          slipImageUrl: DEMO_PAYMENT_SLIP_URL,
          note: DEMO_NOTE,
        },
      });
    }
    if (otherCat && dayAgo === 5) {
      await db.smartGuardLedgerEntry.create({
        data: {
          ...scope,
          categoryId: otherCat.id,
          kind: "EXPENSE",
          title: "ค่าน้ำมันรถตรวจการณ์",
          amountBaht: 950,
          entryOn: day,
          paymentMethod: "CASH",
          note: DEMO_NOTE,
        },
      });
    }
  }

  // สะพานเช็คอิน: สร้าง/แม็ปรายชื่อ + เปิดลิงก์ + ผูกสาขา/จุด
  const attBranch = await db.attendanceBranch.findFirst({
    where: { ownerUserId, trialSessionId },
    select: { id: true },
    orderBy: { sortOrder: "asc" },
  });
  const attLocation = attBranch
    ? await db.attendanceLocation.findFirst({
        where: { ownerUserId, trialSessionId, branchId: attBranch.id },
        select: { id: true },
        orderBy: { sortOrder: "asc" },
      })
    : null;

  await db.smartGuardShop.update({
    where: { id: shopId },
    data: {
      attendanceLinkEnabled: true,
      attendanceStaffSyncEnabled: true,
      attendanceRequireMatch: true,
      attendanceBranchId: attBranch?.id ?? null,
      attendanceLocationId: attLocation?.id ?? null,
    },
  });

  for (let i = 0; i < Math.min(5, staffRows.length); i++) {
    const staff = staffRows[i]!;
    if (!staff.phone) continue;
    let roster = await db.attendanceRosterEntry.findFirst({
      where: { ownerUserId, trialSessionId, phone: staff.phone },
      select: { id: true },
    });
    if (!roster) {
      roster = await db.attendanceRosterEntry.create({
        data: {
          ownerUserId,
          trialSessionId,
          displayName: staff.displayName,
          phone: staff.phone,
          photoUrl: staff.photoUrl,
          isActive: staff.isActive,
          rosterShiftIndex: i % 2,
        },
        select: { id: true },
      });
    }
    await db.smartGuardAttendanceStaffLink.create({
      data: {
        ownerUserId,
        trialSessionId,
        shopId,
        guardStaffId: staff.id,
        rosterEntryId: roster.id,
      },
    });
  }
}

export async function seedSmartGuardTourTrialData(
  tx: Tx,
  ownerUserId: string,
  trialSessionId: string,
): Promise<void> {
  if (!trialSessionId || trialSessionId === TRIAL_PROD_SCOPE) return;
  await wipeSmartGuardDemoData(tx, ownerUserId, trialSessionId);
  const shop = await upsertDemoShop(
    tx,
    ownerUserId,
    trialSessionId,
    trialDemoDisplayName("จุดตรวจ รปภ. มาเวล"),
  );
  await seedSmartGuardActivity(tx, ownerUserId, trialSessionId, shop.id);
}

export async function seedSmartGuardTourProdDemoForOwner(
  prisma: PrismaClient,
  ownerUserId: string,
  opts?: { refresh?: boolean },
): Promise<void> {
  const trialSessionId = TRIAL_PROD_SCOPE;
  const refresh = opts?.refresh !== false;
  if (!refresh) {
    const n = await prisma.smartGuardCheckpoint.count({ where: { ownerUserId, trialSessionId } });
    if (n >= 8) return;
  }
  await wipeSmartGuardDemoData(prisma, ownerUserId, trialSessionId);
  const shop = await upsertDemoShop(prisma, ownerUserId, trialSessionId, "จุดตรวจ รปภ. มาเวล (ตัวอย่าง)");
  await seedSmartGuardActivity(prisma, ownerUserId, trialSessionId, shop.id);
}
