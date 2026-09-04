import type { PrismaClient } from "@/generated/prisma/client";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";
import {
  DEMO_MODULE_CONTACT,
  DEMO_MODULE_LOGO_URL,
  DEMO_MODULE_PAYMENT,
} from "@/lib/trial/demo-module-settings";
import { bangkokDateKey } from "@/lib/time/bangkok";
import { youtubeEmbedUrl } from "@/lib/youtube-url";
import { ensureClubEventProfile } from "@/systems/club-event/lib/ensure-club-event-profile";
import {
  fieldsFromLinkConfigJson,
  fulfillmentFromAnswers,
  parseSubmissionAnswers,
  serializeFulfillmentJson,
  type ClubEventFulfillmentItem,
} from "@/systems/club-event/lib/desk";
import { clubEventDuesPeriodForDate } from "@/systems/club-event/lib/dues";
import { DEFAULT_CLUB_EVENT_FINANCE_CATEGORIES } from "@/systems/club-event/lib/mappers";
import { syncClubEventDuesPublicLink } from "@/systems/club-event/lib/sync-dues-link";

const DEMO_MARKER = "seed:club-event-demo-v4";

const GALLERY_POOL = [
  "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1528605105345-5344ea20e269?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1591115765373-5207764f72e7?auto=format&fit=crop&w=900&q=80",
] as const;

const PORTRAIT_POOL = [
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=240&h=240&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&h=240&q=80",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=240&h=240&q=80",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=240&h=240&q=80",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=240&h=240&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&h=240&q=80",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&h=240&q=80",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=240&h=240&q=80",
] as const;

const BANNER =
  "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1600&h=900&q=80";

const YT = {
  eventRecap: youtubeEmbedUrl("jNQXAC9IVRw", false),
  workshop: youtubeEmbedUrl("aqz-KE-bpKQ", false),
  meetup: youtubeEmbedUrl("LXb3EKWsInQ", false),
  charity: youtubeEmbedUrl("M7lc1UVf-VE", false),
  talk: youtubeEmbedUrl("9bZkp7q19f0", false),
} as const;

function bangkokOffsetDays(days: number, hour = 14, minute = 0): Date {
  const key = bangkokDateKey();
  const base = new Date(`${key}T12:00:00+07:00`);
  base.setTime(base.getTime() + days * 24 * 60 * 60 * 1000);
  const ymd = bangkokDateKey(base);
  const h = String(hour).padStart(2, "0");
  const m = String(minute).padStart(2, "0");
  return new Date(`${ymd}T${h}:${m}:00+07:00`);
}

function pickGallery(start: number, count: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < count; i += 1) {
    out.push(GALLERY_POOL[(start + i) % GALLERY_POOL.length]!);
  }
  return out;
}

function ytJson(...urls: (string | null | undefined)[]): string {
  return JSON.stringify(urls.filter((u): u is string => Boolean(u?.trim())));
}

/** ล้างข้อมูลชมรมใน scope prod ของ user demo แล้วใส่ใหม่ */
async function wipeClubEventDemoScope(
  prisma: PrismaClient,
  ownerUserId: string,
  trialSessionId: string,
): Promise<void> {
  const links = await prisma.clubEventDynamicLink.findMany({
    where: { ownerUserId, trialSessionId },
    select: { id: true },
  });
  if (links.length) {
    await prisma.clubEventLinkSubmission.deleteMany({
      where: { linkId: { in: links.map((l) => l.id) } },
    });
  }
  await prisma.clubEventDuesPayment.deleteMany({ where: { ownerUserId, trialSessionId } });
  await prisma.clubEventDynamicLink.deleteMany({ where: { ownerUserId, trialSessionId } });
  await prisma.clubEventFinanceTransaction.deleteMany({ where: { ownerUserId, trialSessionId } });
  await prisma.clubEventAsset.deleteMany({ where: { ownerUserId, trialSessionId } });
  await prisma.clubEventMember.deleteMany({ where: { ownerUserId, trialSessionId } });
  await prisma.clubEventGalleryImage.deleteMany({ where: { ownerUserId, trialSessionId } });
  await prisma.clubEventRecord.deleteMany({ where: { ownerUserId, trialSessionId } });
}

export async function seedClubEventProdDemoForOwner(
  prisma: PrismaClient,
  ownerUserId: string,
): Promise<void> {
  const trialSessionId = TRIAL_PROD_SCOPE;
  await wipeClubEventDemoScope(prisma, ownerUserId, trialSessionId);

  const profile = await ensureClubEventProfile(prisma, ownerUserId, trialSessionId);

  await prisma.clubEventProfile.update({
    where: { id: profile.id },
    data: {
      displayName: "ชมรมพัฒนาชุมชน MAWELL",
      tagline: "กิจกรรม · สมาชิก · การเงิน · ทรัพย์สิน · เว็บสาธารณะ",
      logoUrl: DEMO_MODULE_LOGO_URL,
      contactPhone: DEMO_MODULE_CONTACT.contactPhone,
      contactLine: DEMO_MODULE_CONTACT.lineId,
      address: "99/9 หมู่ 5 ต.ตัวอย่าง อ.เมือง จ.ขอนแก่น 40000",
      facebookUrl: "https://www.facebook.com/",
      mapUrl: "https://maps.google.com/?q=Khon+Kaen",
      portalBannerUrl: BANNER,
      portalGalleryJson: JSON.stringify(pickGallery(0, 8)),
      portalShowCommittee: true,
      paymentRulesNote:
        "โอนค่าบำรุงหรือมัดจำกิจกรรมแล้วแนบสลิปทุกครั้ง · ตรวจสอบภายใน 1–2 วันทำการ",
      promptPayPhone: DEMO_MODULE_PAYMENT.promptPayPhone,
      bankName: DEMO_MODULE_PAYMENT.bankName,
      bankAccountNumber: DEMO_MODULE_PAYMENT.bankAccountNumber,
      bankAccountName: "ชมรมพัฒนาชุมชน MAWELL",
      taxId: "0105559999991",
      slipPaperSize: "SLIP_58",
      financeCategoriesJson: JSON.stringify(DEFAULT_CLUB_EVENT_FINANCE_CATEGORIES),
      rulesMarkdown: [
        "## กฎระเบียบชมรม (ตัวอย่าง)",
        "",
        "1. สมาชิกต้องลงทะเบียนและยินยอมเก็บข้อมูลก่อนเข้าร่วมกิจกรรม",
        "2. รักษาทรัพย์สินส่วนกลาง — ยืมแล้วต้องคืนตามกำหนด",
        "3. จ่ายค่าบำรุงประจำปีภายในไตรมาสแรก หรือแจ้งขอผ่อนผัน",
        "4. ประพฤติตนสุภาพ ไม่ก่อความเดือดร้อนในกิจกรรมสาธารณะ",
        "",
        `_${DEMO_MARKER}_`,
      ].join("\n"),
      committeeJson: JSON.stringify([
        { role: "ประธาน", name: "สมชาย ใจดี", phone: "0811110001", photoUrl: PORTRAIT_POOL[0] },
        { role: "รองประธาน", name: "สมหญิง รักงาน", phone: "0811110002", photoUrl: PORTRAIT_POOL[1] },
        { role: "เลขาธิการ", name: "วิชัย จัดงาน", phone: "0811110003", photoUrl: PORTRAIT_POOL[2] },
        { role: "เหรัญญิก", name: "มานี บัญชีดี", phone: "0811110004", photoUrl: PORTRAIT_POOL[3] },
        { role: "ฝ่ายกิจกรรม", name: "ปิติ สร้างสรรค์", phone: "0811110005", photoUrl: PORTRAIT_POOL[4] },
        { role: "ฝ่ายประชาสัมพันธ์", name: "สุดา สื่อสาร", phone: "0811110006", photoUrl: PORTRAIT_POOL[5] },
      ]),
    },
  });

  const pastDefs = [
    {
      title: "งานปีใหม่ชมรม",
      daysAgo: 280,
      youtube: [YT.eventRecap, YT.talk],
      images: 12,
      galleryStart: 0,
      description: `งานเลี้ยงปีใหม่สมาชิกและครอบครัว — โชว์ · แจกรางวัล · รูปย้อนหลัง\n\n${DEMO_MARKER}`,
    },
    {
      title: "อบรมทักษะทีมเวิร์ค",
      daysAgo: 210,
      youtube: [YT.workshop],
      images: 10,
      galleryStart: 4,
      description: `เวิร์กช็อปทั้งวันที่ศูนย์ชุมชน\n\n${DEMO_MARKER}`,
    },
    {
      title: "ออกค่ายอาสาพัฒนา",
      daysAgo: 150,
      youtube: [YT.charity, YT.meetup],
      images: 14,
      galleryStart: 8,
      description: `ค่ายอาสา 3 วัน 2 คืน\n\n${DEMO_MARKER}`,
    },
    {
      title: "มีตอัพสมาชิกไตรมาส 2",
      daysAgo: 90,
      youtube: [YT.meetup],
      images: 11,
      galleryStart: 2,
      description: `พบปะสมาชิก · อัปเดตแผนงาน\n\n${DEMO_MARKER}`,
    },
    {
      title: "งานกาชาดและรับสมาชิกใหม่",
      daysAgo: 45,
      youtube: [YT.eventRecap],
      images: 13,
      galleryStart: 6,
      description: `บูธประชาสัมพันธ์ · รับสมัคร\n\n${DEMO_MARKER}`,
    },
    {
      title: "กิจกรรมกีฬาเชื่อมสัมพันธ์",
      daysAgo: 14,
      youtube: [YT.workshop, YT.eventRecap],
      images: 12,
      galleryStart: 10,
      description: `แข่งกีฬาเบา ๆ · ของรางวัล\n\n${DEMO_MARKER}`,
    },
  ] as const;

  const pastEvents: { id: string; title: string }[] = [];
  for (const def of pastDefs) {
    const event = await prisma.clubEventRecord.create({
      data: {
        ownerUserId,
        trialSessionId,
        profileId: profile.id,
        title: def.title,
        eventDate: bangkokOffsetDays(-def.daysAgo, 15, 0),
        status: "PAST",
        description: def.description,
        youtubeEmbedUrl: def.youtube[0] ?? null,
        youtubeUrlsJson: ytJson(...def.youtube),
      },
    });
    pastEvents.push({ id: event.id, title: event.title });
    const urls = pickGallery(def.galleryStart, def.images);
    await prisma.clubEventGalleryImage.createMany({
      data: urls.map((imageUrl, i) => ({
        ownerUserId,
        trialSessionId,
        eventId: event.id,
        imageUrl,
        fileName: `demo-${event.id.slice(0, 6)}-${i + 1}.jpg`,
        sortOrder: i,
      })),
    });
  }

  const upcomingDefs = [
    {
      title: "ประชุมใหญ่สามัญประจำปี",
      daysAhead: 12,
      description: `วาระเลือกตั้งกรรมการ · รายงานการเงิน\n\n${DEMO_MARKER}`,
      youtube: [] as string[],
      images: 8,
      galleryStart: 0,
    },
    {
      title: "ทริปศึกษาดูงานต่างจังหวัด",
      daysAhead: 35,
      description: `รับสมัคร 40 ที่นั่ง — ชำระมัดจำผ่านลิงก์\n\n${DEMO_MARKER}`,
      youtube: [YT.meetup],
      images: 10,
      galleryStart: 4,
    },
    {
      title: "พบปะสังสรรค์ประจำปี",
      daysAhead: 25,
      description:
        `งานพบปะสมาชิกประจำปี — สอบถามการเข้าร่วม · ฟุตบอล · นิทรรศการ · ขนาดเสื้อ\n` +
        `ชำระค่าร่วมงาน + ค่าเสื้อ และพ่วงค่าบำรุงประจำปีได้ในรอบเดียว\n\n${DEMO_MARKER}`,
      youtube: [YT.meetup, YT.eventRecap],
      images: 10,
      galleryStart: 12,
    },
    {
      title: "งานครบรอบก่อตั้งชมรม",
      daysAhead: 60,
      description: `คอนเสิร์ตเล็ก · บูธอาหาร · เปิดรับสปอนเซอร์\n\n${DEMO_MARKER}`,
      youtube: [YT.eventRecap, YT.talk],
      images: 12,
      galleryStart: 8,
    },
    {
      title: "อบรมอาสาสมัครรุ่นใหม่ (ร่าง)",
      daysAhead: 90,
      description: `กำลังเตรียมวิทยากร — สถานะร่างในระบบ\n\n${DEMO_MARKER}`,
      youtube: [] as string[],
      images: 6,
      galleryStart: 14,
      draft: true,
    },
  ];

  const upcomingEvents: { id: string; title: string }[] = [];
  for (const def of upcomingDefs) {
    const event = await prisma.clubEventRecord.create({
      data: {
        ownerUserId,
        trialSessionId,
        profileId: profile.id,
        title: def.title,
        eventDate: bangkokOffsetDays(def.daysAhead, 18, 30),
        status: "draft" in def && def.draft ? "UPCOMING" : "UPCOMING",
        description: def.description,
        youtubeEmbedUrl: def.youtube[0] ?? null,
        youtubeUrlsJson: ytJson(...def.youtube),
      },
    });
    upcomingEvents.push({ id: event.id, title: event.title });
    const urls = pickGallery(def.galleryStart, def.images);
    await prisma.clubEventGalleryImage.createMany({
      data: urls.map((imageUrl, i) => ({
        ownerUserId,
        trialSessionId,
        eventId: event.id,
        imageUrl,
        fileName: `demo-${event.id.slice(0, 6)}-${i + 1}.jpg`,
        sortOrder: i,
      })),
    });
  }

  const memberDefs = [
    { name: "อรุณ แสงทอง", phone: "0892001001", position: "กรรมการ", gender: "MALE" },
    { name: "กมลชนก ใจเย็น", phone: "0892001002", position: "กรรมการ", gender: "FEMALE" },
    { name: "ธีรพงศ์ ตั้งใจ", phone: "0892001003", position: "สมาชิก", gender: "MALE" },
    { name: "นภาวรรณ สุขใจ", phone: "0892001004", position: "สมาชิก", gender: "FEMALE" },
    { name: "พีรพล ร่วมมือ", phone: "0892001005", position: "สมาชิก", gender: "MALE" },
    { name: "ศิริพร ช่วยงาน", phone: "0892001006", position: "สมาชิก", gender: "FEMALE" },
    { name: "อนุชา ก้าวหน้า", phone: "0892001007", position: "สมาชิก", gender: "MALE" },
    { name: "วราภรณ์ ใสใจ", phone: "0892001008", position: "สมาชิก", gender: "FEMALE" },
    { name: "ชาญชัย มั่นคง", phone: "0892001009", position: "ที่ปรึกษา", gender: "MALE" },
    { name: "ปาริฉัตร งามดี", phone: "0892001010", position: "สมาชิก", gender: "FEMALE" },
    { name: "กิตติพงษ์ เร็วแรง", phone: "0892001011", position: "สมาชิก", gender: "MALE" },
    { name: "มณีรัตน์ อบอุ่น", phone: "0892001012", position: "สมาชิก", gender: "FEMALE" },
    { name: "สุรศักดิ์ ยั่งยืน", phone: "0892001013", position: "สมาชิก", gender: "MALE" },
    { name: "พิมพ์ใจ รักษ์ดี", phone: "0892001014", position: "สมาชิก", gender: "FEMALE" },
    { name: "ธนพล ทดลอง (ปิด)", phone: "0892001015", position: "สมาชิก", gender: "MALE", inactive: true },
  ] as const;

  await prisma.clubEventMember.createMany({
    data: memberDefs.map((m, i) => {
      const [firstName, ...rest] = m.name.split(" ");
      const lastName = rest.join(" ");
      return {
        ownerUserId,
        trialSessionId,
        profileId: profile.id,
        name: m.name,
        firstName: firstName ?? m.name,
        lastName,
        nickname: firstName ?? "",
        gender: m.gender,
        phone: m.phone,
        photoUrl: PORTRAIT_POOL[i % PORTRAIT_POOL.length],
        position: m.position,
        email: `member${i + 1}@demo.club`,
        social: `line:clubdemo${i + 1}`,
        memberCode: `M${String(i + 1).padStart(3, "0")}`,
        dataConsent: true,
        customFieldsJson: JSON.stringify([
          { key: "dept", label: "แผนก/กลุ่ม", value: i % 3 === 0 ? "ฝ่ายกิจกรรม" : "สมาชิกทั่วไป" },
          { key: "joined", label: "ปีที่เข้าร่วม", value: String(2020 + (i % 5)) },
          { key: "note", label: "หมายเหตุ", value: DEMO_MARKER },
        ]),
        isActive: !("inactive" in m && m.inactive),
      };
    }),
  });

  await prisma.clubEventAsset.createMany({
    data: [
      {
        ownerUserId,
        trialSessionId,
        profileId: profile.id,
        name: "ลำโพงพกพา Bluetooth",
        quantity: 4,
        status: "AVAILABLE",
        note: DEMO_MARKER,
        imageUrl: GALLERY_POOL[5],
      },
      {
        ownerUserId,
        trialSessionId,
        profileId: profile.id,
        name: "เต็นท์กิจกรรม 3×3 ม.",
        quantity: 6,
        status: "IN_USE",
        note: DEMO_MARKER,
        imageUrl: GALLERY_POOL[10],
      },
      {
        ownerUserId,
        trialSessionId,
        profileId: profile.id,
        name: "กล้อง DSLR ชมรม",
        quantity: 2,
        status: "AVAILABLE",
        note: DEMO_MARKER,
        imageUrl: GALLERY_POOL[15],
      },
      {
        ownerUserId,
        trialSessionId,
        profileId: profile.id,
        name: "โต๊ะพับเหล็ก",
        quantity: 20,
        status: "DAMAGED",
        note: `ขาหัก 2 ตัว — ${DEMO_MARKER}`,
        imageUrl: GALLERY_POOL[20],
      },
      {
        ownerUserId,
        trialSessionId,
        profileId: profile.id,
        name: "โปรเจคเตอร์พกพา",
        quantity: 1,
        status: "AVAILABLE",
        note: DEMO_MARKER,
        imageUrl: GALLERY_POOL[3],
      },
      {
        ownerUserId,
        trialSessionId,
        profileId: profile.id,
        name: "ไมโครโฟนไร้สาย",
        quantity: 8,
        status: "IN_USE",
        note: DEMO_MARKER,
        imageUrl: GALLERY_POOL[7],
      },
      {
        ownerUserId,
        trialSessionId,
        profileId: profile.id,
        name: "ชุดปฐมพยาบาล",
        quantity: 3,
        status: "AVAILABLE",
        note: DEMO_MARKER,
        imageUrl: GALLERY_POOL[12],
      },
    ],
  });

  const financeRows: {
    type: "INCOME" | "EXPENSE";
    category: string;
    amountBaht: number;
    daysAgo: number;
    hour: number;
    slip?: boolean;
  }[] = [
    { type: "INCOME", category: "ค่าบำรุงสมาชิก", amountBaht: 15000, daysAgo: 120, hour: 10, slip: true },
    { type: "INCOME", category: "ค่าบำรุงสมาชิก", amountBaht: 12500, daysAgo: 55, hour: 9, slip: true },
    { type: "INCOME", category: "สปอนเซอร์", amountBaht: 8000, daysAgo: 40, hour: 11, slip: true },
    { type: "INCOME", category: "สปอนเซอร์", amountBaht: 5000, daysAgo: 18, hour: 15 },
    { type: "INCOME", category: "รายรับอื่น", amountBaht: 1200, daysAgo: 10, hour: 13 },
    { type: "INCOME", category: "ค่าบำรุงสมาชิก", amountBaht: 3000, daysAgo: 3, hour: 10, slip: true },
    { type: "EXPENSE", category: "ค่าสถานที่", amountBaht: 3500, daysAgo: 100, hour: 16, slip: true },
    { type: "EXPENSE", category: "อาหารว่าง", amountBaht: 2800, daysAgo: 90, hour: 12 },
    { type: "EXPENSE", category: "ของรางวัล", amountBaht: 4200, daysAgo: 45, hour: 17, slip: true },
    { type: "EXPENSE", category: "ค่าสถานที่", amountBaht: 2500, daysAgo: 20, hour: 14 },
    { type: "EXPENSE", category: "อาหารว่าง", amountBaht: 1850, daysAgo: 14, hour: 11 },
    { type: "EXPENSE", category: "รายจ่ายอื่น", amountBaht: 900, daysAgo: 7, hour: 9 },
    { type: "EXPENSE", category: "ของรางวัล", amountBaht: 1500, daysAgo: 2, hour: 16, slip: true },
  ];

  await prisma.clubEventFinanceTransaction.createMany({
    data: financeRows.map((row, i) => ({
      ownerUserId,
      trialSessionId,
      profileId: profile.id,
      type: row.type,
      category: row.category,
      amountBaht: row.amountBaht,
      transactedAt: bangkokOffsetDays(-row.daysAgo, row.hour, (i * 7) % 60),
      note: DEMO_MARKER,
      slipUrl: row.slip ? GALLERY_POOL[i % GALLERY_POOL.length] : null,
    })),
  });

  const meeting = upcomingEvents[0];
  const trip = upcomingEvents[1];
  const party = upcomingEvents[2];
  const sportsPast = pastEvents[5];

  /** แพ็กชำระรวม — ค่าร่วมงาน 200 + เสื้อ 250 + ค่าบำรุง 300 = 750 */
  const PARTY_FEE_EVENT = 200;
  const PARTY_FEE_SHIRT = 250;
  const PARTY_FEE_DUES = 300;

  const meetingKitItems = [
    { key: "doc_pack", label: "ชุดเอกสารการประชุม", amountBaht: 0, defaultQty: 0 },
    { key: "souvenir", label: "ของที่ระลึก", amountBaht: 0, defaultQty: 0 },
    { key: "badge", label: "ป้ายชื่อ", amountBaht: 0, defaultQty: 0 },
  ];

  const rsvpFields = [
    { key: "attend", label: "สถานะการเข้าร่วม", type: "choice" as const, options: ["เข้าร่วม", "ไม่สะดวก", "ยังไม่แน่ใจ"], required: true },
    { key: "guests", label: "จำนวนผู้ติดตาม", type: "text" as const, required: false },
    {
      key: "kits",
      label: "รับของหน้างาน (จำนวน)",
      type: "qty" as const,
      qtyItems: meetingKitItems,
      required: false,
    },
    { key: "note", label: "หมายเหตุ", type: "text" as const, required: false },
  ];

  const rsvp = await prisma.clubEventDynamicLink.create({
    data: {
      ownerUserId,
      trialSessionId,
      profileId: profile.id,
      type: "RSVP",
      title: "ยืนยันเข้าร่วมประชุมใหญ่",
      configJson: JSON.stringify({
        eventId: meeting?.id,
        description: "กรุณายืนยันการเข้าร่วม · ของหน้างานต้องยืนยันรับและเซ็นชื่อที่โต๊ะลงทะเบียน",
        fields: rsvpFields,
      }),
      isActive: true,
    },
  });

  const duesFields = [
    { key: "note", label: "หมายเหตุการโอน", type: "text" as const, required: false },
  ];

  const duesLinkId = await syncClubEventDuesPublicLink({
    prisma,
    profileId: profile.id,
    ownerUserId,
    trialSessionId,
    duesEnabled: true,
    duesAmountBaht: PARTY_FEE_DUES,
    duesPeriod: "YEARLY",
    existingDuesLinkId: profile.duesLinkId,
  });

  await prisma.clubEventProfile.update({
    where: { id: profile.id },
    data: {
      duesEnabled: true,
      duesAmountBaht: PARTY_FEE_DUES,
      duesPeriod: "YEARLY",
      duesLinkId,
    },
  });

  const pay = duesLinkId
    ? await prisma.clubEventDynamicLink.findFirstOrThrow({ where: { id: duesLinkId } })
    : await prisma.clubEventDynamicLink.create({
        data: {
          ownerUserId,
          trialSessionId,
          profileId: profile.id,
          type: "PAYMENT",
          title: "จ่ายค่าบำรุงประจำปี",
          configJson: JSON.stringify({
            amountBaht: PARTY_FEE_DUES,
            description: "ค่าบำรุงสมาชิกปีนี้",
            fields: duesFields,
            isClubDuesLink: true,
          }),
          isActive: true,
        },
      });

  const surveyFields = [
    {
      key: "score",
      label: "คะแนนความพึงพอใจ",
      type: "choice" as const,
      options: ["5 ดีมาก", "4 ดี", "3 ปานกลาง", "2 พอใช้", "1 ควรปรับปรุง"],
      required: true,
    },
    {
      key: "favorite",
      label: "กิจกรรมที่ชอบที่สุด",
      type: "choice" as const,
      options: ["ฟุตบอล", "แบดมินตัน", "วิ่ง", "เกมส์นันทนาการ"],
      required: true,
    },
    { key: "comment", label: "ข้อเสนอแนะ", type: "text" as const, required: false },
  ];

  const survey = await prisma.clubEventDynamicLink.create({
    data: {
      ownerUserId,
      trialSessionId,
      profileId: profile.id,
      type: "SURVEY",
      title: "แบบสำรวจความพึงพอใจกิจกรรมกีฬา",
      configJson: JSON.stringify({
        eventId: sportsPast?.id,
        fields: surveyFields,
      }),
      isActive: true,
    },
  });

  const tripFields = [
    {
      key: "room",
      label: "ประเภทที่พัก",
      type: "choice" as const,
      options: ["พักคู่", "พักเดี่ยว (+200)", "ยังไม่ระบุ"],
      required: true,
    },
    { key: "note", label: "อาหารแพ้ / หมายเหตุ", type: "text" as const, required: false },
  ];

  const tripPay = await prisma.clubEventDynamicLink.create({
    data: {
      ownerUserId,
      trialSessionId,
      profileId: profile.id,
      type: "PAYMENT",
      title: "มัดจำทริปศึกษาดูงาน",
      configJson: JSON.stringify({
        eventId: trip?.id,
        amountBaht: 500,
        description: "มัดจำทริป — โอนแล้วแนบสลิป",
        fields: tripFields,
      }),
      isActive: true,
    },
  });

  /** ลิงก์เดียวของงานพบปะ — รวมสอบถามทุกข้อ + ยอดจาก choice/qty */
  const partyShirtItems = [
    { key: "size_3xl", label: "3XL", amountBaht: PARTY_FEE_SHIRT },
    { key: "size_2xl", label: "2XL", amountBaht: PARTY_FEE_SHIRT },
    { key: "size_xl", label: "XL", amountBaht: PARTY_FEE_SHIRT },
    { key: "size_l", label: "L", amountBaht: PARTY_FEE_SHIRT },
    { key: "size_m", label: "M", amountBaht: PARTY_FEE_SHIRT },
    { key: "size_s", label: "S", amountBaht: PARTY_FEE_SHIRT },
    { key: "size_ss", label: "SS", amountBaht: PARTY_FEE_SHIRT },
  ];

  const partyFields = [
    {
      key: "attend",
      label: "สอบถามการเข้าร่วมงาน",
      type: "choice" as const,
      choiceOptions: [
        { label: "เข้าร่วม", amountBaht: PARTY_FEE_EVENT },
        { label: "ไม่สะดวก", amountBaht: 0 },
        { label: "ยังไม่แน่ใจ", amountBaht: 0 },
      ],
      required: true,
    },
    {
      key: "football",
      label: "สอบถามร่วมกิจกรรมเล่นฟุตบอล",
      type: "choice" as const,
      choiceOptions: [
        { label: "เล่น", amountBaht: 0 },
        { label: "ไม่เล่น", amountBaht: 0 },
        { label: "ยังไม่แน่ใจ", amountBaht: 0 },
      ],
      required: true,
    },
    {
      key: "exhibition",
      label: "กิจกรรมนิทรรศการ",
      type: "choice" as const,
      choiceOptions: [
        { label: "สนใจร่วม", amountBaht: 0 },
        { label: "สนใจชม", amountBaht: 0 },
        { label: "ไม่สนใจ", amountBaht: 0 },
      ],
      required: true,
    },
    {
      key: "shirts",
      label: "ต้องการเสื้อ (จำนวนต่อขนาด)",
      type: "qty" as const,
      qtyItems: partyShirtItems,
      required: false,
    },
    { key: "note", label: "หมายเหตุ", type: "text" as const, required: false },
  ];

  const partyPay = await prisma.clubEventDynamicLink.create({
    data: {
      ownerUserId,
      trialSessionId,
      profileId: profile.id,
      type: "PAYMENT",
      title: "ลงทะเบียนพบปะสังสรรค์ + ชำระรวม",
      configJson: JSON.stringify({
        eventId: party?.id,
        amountBaht: 0,
        description:
          `ยอดคำนวณจากคำตอบ: เข้าร่วม ฿${PARTY_FEE_EVENT} · เสื้อ ฿${PARTY_FEE_SHIRT}/ตัว` +
          ` · พ่วงค่าบำรุง ฿${PARTY_FEE_DUES} ได้จากตั้งค่าชมรม`,
        fields: partyFields,
        linkAnnualDues: true,
        annualDuesLinkId: pay.id,
      }),
      isActive: true,
    },
  });

  await prisma.clubEventDynamicLink.create({
    data: {
      ownerUserId,
      trialSessionId,
      profileId: profile.id,
      type: "URL",
      title: "กลุ่ม LINE ชมรม",
      configJson: JSON.stringify({
        url: `https://line.me/ti/p/~${DEMO_MODULE_CONTACT.lineId.replace(/^@/, "")}`,
      }),
      isActive: true,
    },
  });

  type SeedAnswer = {
    linkId: string;
    name: string;
    phone: string;
    memberCode?: string;
    answers: Record<string, string>;
    fields:
      | typeof rsvpFields
      | typeof duesFields
      | typeof surveyFields
      | typeof tripFields
      | typeof partyFields;
    amountBaht?: number;
    paymentMethod?: string;
    slipIndex?: number;
    daysAgo?: number;
    /** พ่วงค่าบำรุงจากลิงก์ค่าบำรุงประจำปี */
    includeAnnualDues?: boolean;
  };

  const partySeedAmount = (answers: Record<string, string>, includeDues: boolean) => {
    let total = 0;
    if (answers.attend === "เข้าร่วม") total += PARTY_FEE_EVENT;
    if (includeDues) total += PARTY_FEE_DUES;
    try {
      const qty = JSON.parse(answers.shirts || "{}") as Record<string, number>;
      for (const q of Object.values(qty)) {
        if (typeof q === "number" && q > 0) total += q * PARTY_FEE_SHIRT;
      }
    } catch {
      /* ignore */
    }
    return total;
  };

  const mkPayload = (row: SeedAnswer) =>
    JSON.stringify({
      answers: row.answers,
      answer: row.answers[row.fields[0]?.key ?? ""] ?? "",
      fields: row.fields,
      ...(row.memberCode ? { memberCode: row.memberCode } : {}),
      ...(row.includeAnnualDues
        ? {
            includeAnnualDues: true,
            annualDuesLinkId: pay.id,
            annualDuesAmountBaht: PARTY_FEE_DUES,
            annualDuesTitle: pay.title,
          }
        : {}),
    });

  const submissionDefs: SeedAnswer[] = [
    // RSVP — ประชุมใหญ่ (มีรายการของหน้างานให้ยืนยันรับ)
    {
      linkId: rsvp.id,
      name: "ธีรพงศ์ ตั้งใจ",
      phone: "0892001003",
      memberCode: "M003",
      fields: rsvpFields,
      answers: {
        attend: "เข้าร่วม",
        guests: "1",
        kits: JSON.stringify({ doc_pack: 1, badge: 1 }),
        note: "จะถึงช้าประมาณ 15 นาที",
      },
      daysAgo: 3,
    },
    {
      linkId: rsvp.id,
      name: "นภาวรรณ สุขใจ",
      phone: "0892001004",
      memberCode: "M004",
      fields: rsvpFields,
      answers: {
        attend: "เข้าร่วม",
        guests: "0",
        kits: JSON.stringify({ doc_pack: 1, souvenir: 1, badge: 1 }),
        note: "",
      },
      daysAgo: 3,
    },
    {
      linkId: rsvp.id,
      name: "พีรพล ร่วมมือ",
      phone: "0892001005",
      memberCode: "M005",
      fields: rsvpFields,
      answers: {
        attend: "เข้าร่วม",
        guests: "2",
        kits: JSON.stringify({ doc_pack: 3, badge: 3, souvenir: 2 }),
        note: "พาครอบครัวมาด้วย · ของ 3 ชุด",
      },
      daysAgo: 2,
    },
    {
      linkId: rsvp.id,
      name: "ปาริฉัตร งามดี",
      phone: "0892001010",
      memberCode: "M010",
      fields: rsvpFields,
      answers: {
        attend: "ยังไม่แน่ใจ",
        guests: "0",
        kits: JSON.stringify({ doc_pack: 1 }),
        note: "รอตารางงานบริษัท",
      },
      daysAgo: 2,
    },
    {
      linkId: rsvp.id,
      name: "ชาญชัย มั่นคง",
      phone: "0892001009",
      memberCode: "M009",
      fields: rsvpFields,
      answers: { attend: "ไม่สะดวก", guests: "0", kits: "", note: "ติดภารกิจต่างจังหวัด" },
      daysAgo: 1,
    },
    {
      linkId: rsvp.id,
      name: "มณีรัตน์ อบอุ่น",
      phone: "0892001012",
      memberCode: "M012",
      fields: rsvpFields,
      answers: {
        attend: "เข้าร่วม",
        guests: "1",
        kits: JSON.stringify({ doc_pack: 1, souvenir: 1, badge: 1 }),
        note: "",
      },
      daysAgo: 1,
    },
    {
      linkId: rsvp.id,
      name: "สุรศักดิ์ ยั่งยืน",
      phone: "0892001013",
      memberCode: "M013",
      fields: rsvpFields,
      answers: {
        attend: "เข้าร่วม",
        guests: "0",
        kits: JSON.stringify({ doc_pack: 1, souvenir: 1, badge: 1 }),
        note: "พร้อมช่วยรับลงทะเบียน",
      },
      daysAgo: 0,
    },
    // ค่าบำรุง (ลิงก์เดี่ยว)
    {
      linkId: pay.id,
      name: "ศิริพร ช่วยงาน",
      phone: "0892001006",
      memberCode: "M006",
      fields: duesFields,
      answers: { note: "โอนจากบัญชีกรุงไทย" },
      amountBaht: 300,
      paymentMethod: "PROMPTPAY",
      slipIndex: 0,
      daysAgo: 5,
    },
    {
      linkId: pay.id,
      name: "อนุชา ก้าวหน้า",
      phone: "0892001007",
      memberCode: "M007",
      fields: duesFields,
      answers: { note: "" },
      amountBaht: 300,
      paymentMethod: "TRANSFER",
      slipIndex: 1,
      daysAgo: 4,
    },
    {
      linkId: pay.id,
      name: "อรุณ แสงทอง",
      phone: "0892001001",
      memberCode: "M001",
      fields: duesFields,
      answers: { note: "จ่ายรวมกับคู่สมรส" },
      amountBaht: 300,
      paymentMethod: "PROMPTPAY",
      slipIndex: 2,
      daysAgo: 3,
    },
    {
      linkId: pay.id,
      name: "กมลชนก ใจเย็น",
      phone: "0892001002",
      memberCode: "M002",
      fields: duesFields,
      answers: { note: "" },
      amountBaht: 300,
      paymentMethod: "CASH",
      daysAgo: 2,
    },
    // สำรวจกิจกรรมกีฬา
    {
      linkId: survey.id,
      name: "วราภรณ์ ใสใจ",
      phone: "0892001008",
      memberCode: "M008",
      fields: surveyFields,
      answers: { score: "5 ดีมาก", favorite: "ฟุตบอล", comment: "สนุกมาก อยากให้มีบ่อยกว่านี้" },
      daysAgo: 10,
    },
    {
      linkId: survey.id,
      name: "กิตติพงษ์ เร็วแรง",
      phone: "0892001011",
      memberCode: "M011",
      fields: surveyFields,
      answers: { score: "4 ดี", favorite: "เกมส์นันทนาการ", comment: "น้ำดื่มควรเพิ่มจุดบริการ" },
      daysAgo: 9,
    },
    {
      linkId: survey.id,
      name: "พิมพ์ใจ รักษ์ดี",
      phone: "0892001014",
      memberCode: "M014",
      fields: surveyFields,
      answers: { score: "5 ดีมาก", favorite: "วิ่ง", comment: "" },
      daysAgo: 9,
    },
    {
      linkId: survey.id,
      name: "ธีรพงศ์ ตั้งใจ",
      phone: "0892001003",
      memberCode: "M003",
      fields: surveyFields,
      answers: { score: "3 ปานกลาง", favorite: "แบดมินตัน", comment: "สนามแบดค่อนข้างแออัด" },
      daysAgo: 8,
    },
    {
      linkId: survey.id,
      name: "นภาวรรณ สุขใจ",
      phone: "0892001004",
      memberCode: "M004",
      fields: surveyFields,
      answers: { score: "4 ดี", favorite: "ฟุตบอล", comment: "ของรางวัลน่ารักดี" },
      daysAgo: 8,
    },
    {
      linkId: survey.id,
      name: "พีรพล ร่วมมือ",
      phone: "0892001005",
      memberCode: "M005",
      fields: surveyFields,
      answers: { score: "5 ดีมาก", favorite: "เกมส์นันทนาการ", comment: "ทีมงานใจดีมาก" },
      daysAgo: 7,
    },
    {
      linkId: survey.id,
      name: "ศิริพร ช่วยงาน",
      phone: "0892001006",
      memberCode: "M006",
      fields: surveyFields,
      answers: { score: "2 พอใช้", favorite: "วิ่ง", comment: "จุดลงทะเบียนช้าในช่วงเช้า" },
      daysAgo: 7,
    },
    {
      linkId: survey.id,
      name: "อนุชา ก้าวหน้า",
      phone: "0892001007",
      memberCode: "M007",
      fields: surveyFields,
      answers: { score: "4 ดี", favorite: "ฟุตบอล", comment: "อยากได้เสื้อที่ระลึก" },
      daysAgo: 6,
    },
    // มัดจำทริป
    {
      linkId: tripPay.id,
      name: "ธีรพงศ์ ตั้งใจ",
      phone: "0892001003",
      memberCode: "M003",
      fields: tripFields,
      answers: { room: "พักคู่", note: "แพ้อาหารทะเล" },
      amountBaht: 500,
      paymentMethod: "PROMPTPAY",
      slipIndex: 3,
      daysAgo: 4,
    },
    {
      linkId: tripPay.id,
      name: "นภาวรรณ สุขใจ",
      phone: "0892001004",
      memberCode: "M004",
      fields: tripFields,
      answers: { room: "พักคู่", note: "ขอคู่กับพิมพ์ใจ" },
      amountBaht: 500,
      paymentMethod: "TRANSFER",
      slipIndex: 4,
      daysAgo: 3,
    },
    {
      linkId: tripPay.id,
      name: "พิมพ์ใจ รักษ์ดี",
      phone: "0892001014",
      memberCode: "M014",
      fields: tripFields,
      answers: { room: "พักคู่", note: "" },
      amountBaht: 500,
      paymentMethod: "PROMPTPAY",
      slipIndex: 5,
      daysAgo: 3,
    },
    {
      linkId: tripPay.id,
      name: "กิตติพงษ์ เร็วแรง",
      phone: "0892001011",
      memberCode: "M011",
      fields: tripFields,
      answers: { room: "พักเดี่ยว (+200)", note: "" },
      amountBaht: 700,
      paymentMethod: "TRANSFER",
      slipIndex: 6,
      daysAgo: 2,
    },
    {
      linkId: tripPay.id,
      name: "วราภรณ์ ใสใจ",
      phone: "0892001008",
      memberCode: "M008",
      fields: tripFields,
      answers: { room: "ยังไม่ระบุ", note: "รอคอนเฟิร์มวันหยุด" },
      amountBaht: 500,
      paymentMethod: "PROMPTPAY",
      slipIndex: 7,
      daysAgo: 1,
    },
    // พบปะสังสรรค์ประจำปี — ลิงก์เดียว + ติ๊กพ่วงค่าบำรุงจากลิงก์ค่าบำรุง
    ...([
      {
        name: "ธีรพงศ์ ตั้งใจ",
        phone: "0892001003",
        memberCode: "M003",
        answers: {
          attend: "เข้าร่วม",
          football: "เล่น",
          exhibition: "สนใจชม",
          shirts: JSON.stringify({ size_l: 2 }),
          note: "มาพร้อมครอบครัว · เสื้อ 2 ตัว",
        },
        includeAnnualDues: true,
        paymentMethod: "PROMPTPAY",
        slipIndex: 8,
        daysAgo: 5,
      },
      {
        name: "นภาวรรณ สุขใจ",
        phone: "0892001004",
        memberCode: "M004",
        answers: {
          attend: "เข้าร่วม",
          football: "ไม่เล่น",
          exhibition: "สนใจร่วม",
          shirts: JSON.stringify({ size_m: 1 }),
          note: "",
        },
        includeAnnualDues: true,
        paymentMethod: "TRANSFER",
        slipIndex: 9,
        daysAgo: 4,
      },
      {
        name: "พีรพล ร่วมมือ",
        phone: "0892001005",
        memberCode: "M005",
        answers: {
          attend: "เข้าร่วม",
          football: "เล่น",
          exhibition: "สนใจชม",
          shirts: JSON.stringify({ size_xl: 1, size_m: 1 }),
          note: "จ่ายค่าบำรุงไปแล้วช่วงต้นปี",
        },
        includeAnnualDues: false,
        paymentMethod: "PROMPTPAY",
        slipIndex: 10,
        daysAgo: 4,
      },
      {
        name: "ศิริพร ช่วยงาน",
        phone: "0892001006",
        memberCode: "M006",
        answers: {
          attend: "เข้าร่วม",
          football: "ยังไม่แน่ใจ",
          exhibition: "สนใจร่วม",
          shirts: JSON.stringify({ size_s: 1 }),
          note: "",
        },
        includeAnnualDues: true,
        paymentMethod: "CASH",
        daysAgo: 3,
      },
      {
        name: "กิตติพงษ์ เร็วแรง",
        phone: "0892001011",
        memberCode: "M011",
        answers: {
          attend: "เข้าร่วม",
          football: "เล่น",
          exhibition: "ไม่สนใจ",
          shirts: "",
          note: "มีเสื้อจากปีก่อนแล้ว",
        },
        includeAnnualDues: true,
        paymentMethod: "PROMPTPAY",
        slipIndex: 11,
        daysAgo: 3,
      },
      {
        name: "พิมพ์ใจ รักษ์ดี",
        phone: "0892001014",
        memberCode: "M014",
        answers: {
          attend: "เข้าร่วม",
          football: "ไม่เล่น",
          exhibition: "สนใจชม",
          shirts: JSON.stringify({ size_m: 1 }),
          note: "",
        },
        includeAnnualDues: true,
        paymentMethod: "TRANSFER",
        slipIndex: 12,
        daysAgo: 2,
      },
      {
        name: "มณีรัตน์ อบอุ่น",
        phone: "0892001012",
        memberCode: "M012",
        answers: {
          attend: "ยังไม่แน่ใจ",
          football: "ไม่เล่น",
          exhibition: "สนใจชม",
          shirts: JSON.stringify({ size_l: 1 }),
          note: "รอคอนเฟิร์มตาราง",
        },
        includeAnnualDues: false,
        paymentMethod: "PROMPTPAY",
        slipIndex: 13,
        daysAgo: 2,
      },
      {
        name: "อรุณ แสงทอง",
        phone: "0892001001",
        memberCode: "M001",
        answers: {
          attend: "เข้าร่วม",
          football: "เล่น",
          exhibition: "สนใจร่วม",
          shirts: JSON.stringify({ size_3xl: 1 }),
          note: "ช่วยจัดบูธนิทรรศการ",
        },
        includeAnnualDues: true,
        paymentMethod: "TRANSFER",
        slipIndex: 14,
        daysAgo: 1,
      },
      {
        name: "กมลชนก ใจเย็น",
        phone: "0892001002",
        memberCode: "M002",
        answers: {
          attend: "เข้าร่วม",
          football: "ไม่เล่น",
          exhibition: "สนใจร่วม",
          shirts: JSON.stringify({ size_m: 1, size_ss: 1 }),
          note: "",
        },
        includeAnnualDues: true,
        paymentMethod: "PROMPTPAY",
        slipIndex: 15,
        daysAgo: 1,
      },
      {
        name: "สุรศักดิ์ ยั่งยืน",
        phone: "0892001013",
        memberCode: "M013",
        answers: {
          attend: "เข้าร่วม",
          football: "เล่น",
          exhibition: "สนใจชม",
          shirts: JSON.stringify({ size_l: 1 }),
          note: "พร้อมช่วยรับลงทะเบียนหน้างาน",
        },
        includeAnnualDues: true,
        paymentMethod: "PROMPTPAY",
        slipIndex: 0,
        daysAgo: 0,
      },
    ] as const).map(
      (row): SeedAnswer => ({
        linkId: partyPay.id,
        name: row.name,
        phone: row.phone,
        memberCode: row.memberCode,
        fields: partyFields,
        answers: { ...row.answers },
        includeAnnualDues: row.includeAnnualDues,
        amountBaht: partySeedAmount({ ...row.answers }, row.includeAnnualDues),
        paymentMethod: row.paymentMethod,
        slipIndex: "slipIndex" in row ? row.slipIndex : undefined,
        daysAgo: row.daysAgo,
      }),
    ),
  ];

  await prisma.clubEventLinkSubmission.createMany({
    data: submissionDefs.map((row, i) => ({
      ownerUserId,
      trialSessionId,
      linkId: row.linkId,
      respondentName: row.name,
      respondentPhone: row.phone,
      payloadJson: mkPayload(row),
      amountBaht: row.amountBaht ?? null,
      paymentMethod: row.paymentMethod ?? null,
      slipUrl: row.slipIndex != null ? GALLERY_POOL[row.slipIndex % GALLERY_POOL.length]! : null,
      createdAt: bangkokOffsetDays(-(row.daysAgo ?? 1), 10 + (i % 8), (i * 11) % 60),
    })),
  });

  /** คำตอบพ่วงค่าบำรุง — บันทึกที่ลิงก์ค่าบำรุงด้วย */
  const bundledDues = submissionDefs.filter(
    (r) => r.linkId === partyPay.id && r.includeAnnualDues,
  );
  if (bundledDues.length > 0) {
    await prisma.clubEventLinkSubmission.createMany({
      data: bundledDues.map((row, i) => ({
        ownerUserId,
        trialSessionId,
        linkId: pay.id,
        respondentName: row.name,
        respondentPhone: row.phone,
        payloadJson: JSON.stringify({
          answers: { note: `พ่วงจากฟอร์ม «${partyPay.title}»` },
          answer: `พ่วงจากฟอร์ม «${partyPay.title}»`,
          fields: duesFields,
          memberCode: row.memberCode,
          bundledFromLinkId: partyPay.id,
        }),
        amountBaht: PARTY_FEE_DUES,
        paymentMethod: row.paymentMethod ?? null,
        slipUrl: row.slipIndex != null ? GALLERY_POOL[row.slipIndex % GALLERY_POOL.length]! : null,
        createdAt: bangkokOffsetDays(-(row.daysAgo ?? 1), 11 + (i % 6), (i * 13) % 60),
      })),
    });
  }

  const duesPeriodInfo = clubEventDuesPeriodForDate("YEARLY");
  const duesHistoryRows = [
    ...submissionDefs
      .filter((r) => r.linkId === pay.id)
      .map((r) => ({
        name: r.name,
        phone: r.phone,
        memberCode: r.memberCode ?? "",
        source: "DIRECT" as const,
        daysAgo: r.daysAgo ?? 1,
        slipIndex: r.slipIndex,
        paymentMethod: r.paymentMethod ?? null,
        note: "",
      })),
    ...bundledDues.map((r) => ({
      name: r.name,
      phone: r.phone,
      memberCode: r.memberCode ?? "",
      source: "EVENT_BUNDLE" as const,
      daysAgo: r.daysAgo ?? 1,
      slipIndex: r.slipIndex,
      paymentMethod: r.paymentMethod ?? null,
      note: `พ่วงจากฟอร์ม «${partyPay.title}»`,
    })),
  ];

  if (duesHistoryRows.length > 0) {
    await prisma.clubEventDuesPayment.createMany({
      data: duesHistoryRows.map((r, i) => ({
        ownerUserId,
        trialSessionId,
        profileId: profile.id,
        payerName: r.name,
        payerPhone: r.phone,
        memberCode: r.memberCode,
        amountBaht: PARTY_FEE_DUES,
        periodKey: duesPeriodInfo.periodKey,
        periodLabel: duesPeriodInfo.periodLabel,
        paymentMethod: r.paymentMethod,
        slipUrl: r.slipIndex != null ? GALLERY_POOL[r.slipIndex % GALLERY_POOL.length]! : null,
        source: r.source,
        sourceLinkId: r.source === "EVENT_BUNDLE" ? partyPay.id : pay.id,
        sourceEventId: r.source === "EVENT_BUNDLE" ? party?.id ?? null : null,
        note: r.note,
        paidAt: bangkokOffsetDays(-r.daysAgo, 10 + (i % 8), (i * 9) % 60),
      })),
    });
  }

  /** เช็กอินวันงานตัวอย่าง — ของรอจ่าย / จ่ายแล้วรอเซ็น / ครบแล้ว */
  const markDelivered = (items: ClubEventFulfillmentItem[], at: Date): ClubEventFulfillmentItem[] =>
    items.map((f) => ({
      ...f,
      delivered: true,
      deliveredAt: at.toISOString(),
    }));

  const membersByCode = new Map(
    (
      await prisma.clubEventMember.findMany({
        where: { profileId: profile.id, isActive: true },
        select: { id: true, memberCode: true },
      })
    ).map((m) => [m.memberCode.trim().toLowerCase(), m.id] as const),
  );

  const seedDeskCheckIns = async (
    eventId: string | undefined,
    linkId: string,
    linkConfigJson: string,
    specs: Array<{
      memberCode: string;
      /** pending = รอรับของ · signed = จ่ายของแล้วรอเซ็น · done = เซ็นครบ */
      stage: "pending" | "signed" | "done";
      minutesAgo: number;
    }>,
  ) => {
    if (!eventId) return;
    const fields = fieldsFromLinkConfigJson(linkConfigJson);
    const subs = await prisma.clubEventLinkSubmission.findMany({
      where: { linkId },
      orderBy: { createdAt: "desc" },
    });
    const byCode = new Map<string, (typeof subs)[number]>();
    for (const s of subs) {
      try {
        const p = JSON.parse(s.payloadJson) as { memberCode?: string };
        const code = typeof p.memberCode === "string" ? p.memberCode.trim().toLowerCase() : "";
        if (code && !byCode.has(code)) byCode.set(code, s);
      } catch {
        /* ignore */
      }
    }

    const now = Date.now();
    for (const spec of specs) {
      const code = spec.memberCode.trim().toLowerCase();
      const sub = byCode.get(code);
      if (!sub) continue;
      const fulfillment = fulfillmentFromAnswers(fields, parseSubmissionAnswers(sub.payloadJson));
      if (fulfillment.length === 0) continue;

      let memberCode = "";
      try {
        const p = JSON.parse(sub.payloadJson) as { memberCode?: string };
        if (typeof p.memberCode === "string") memberCode = p.memberCode.trim();
      } catch {
        /* ignore */
      }

      const checkedInAt = new Date(now - spec.minutesAgo * 60_000);
      const deliveredAt = new Date(checkedInAt.getTime() + 5 * 60_000);
      const fulfillmentJson =
        spec.stage === "pending"
          ? serializeFulfillmentJson(fulfillment)
          : serializeFulfillmentJson(markDelivered(fulfillment, deliveredAt));

      await prisma.clubEventCheckIn.create({
        data: {
          ownerUserId,
          trialSessionId,
          profileId: profile.id,
          eventId,
          memberId: membersByCode.get(code) ?? null,
          guestName: sub.respondentName || "ไม่ระบุชื่อ",
          guestPhone: sub.respondentPhone,
          memberCode,
          source: "STAFF",
          submissionId: sub.id,
          checkedInAt,
          fulfillmentJson,
          paymentDueBaht: 0,
          paymentCleared: true,
          signatureImageUrl: spec.stage === "done" ? GALLERY_POOL[0]! : null,
          signedAt: spec.stage === "done" ? new Date(deliveredAt.getTime() + 2 * 60_000) : null,
          note: DEMO_MARKER,
        },
      });
    }
  };

  await seedDeskCheckIns(meeting?.id, rsvp.id, rsvp.configJson, [
    { memberCode: "M013", stage: "pending", minutesAgo: 25 },
    { memberCode: "M004", stage: "pending", minutesAgo: 18 },
    { memberCode: "M003", stage: "signed", minutesAgo: 40 },
    { memberCode: "M005", stage: "done", minutesAgo: 55 },
  ]);

  await seedDeskCheckIns(party?.id, partyPay.id, partyPay.configJson, [
    { memberCode: "M003", stage: "pending", minutesAgo: 30 },
    { memberCode: "M004", stage: "pending", minutesAgo: 22 },
    { memberCode: "M014", stage: "signed", minutesAgo: 45 },
    { memberCode: "M001", stage: "done", minutesAgo: 60 },
  ]);
}
