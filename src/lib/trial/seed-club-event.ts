import type { PrismaClient } from "@/generated/prisma/client";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";
import {
  DEMO_MODULE_CONTACT,
  DEMO_MODULE_LOGO_URL,
  DEMO_MODULE_PAYMENT,
} from "@/lib/trial/demo-module-settings";
import { bangkokDateKey } from "@/lib/time/bangkok";
import { ensureClubEventProfile } from "@/systems/club-event/lib/ensure-club-event-profile";
import { youtubeEmbedUrl } from "@/lib/youtube-url";

const DEMO_MARKER = "seed:club-event-demo-v1";

/** รูป Unsplash สำหรับแกลเลอรีย้อนหลัง — เยอะเพื่อทดลอง slideshow */
const GALLERY_POOL = [
  "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1517457372414-e941883a8af0?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1429962712911-72a571d81ea9?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1459749411175-04bf529eec0e?auto=format&fit=crop&w=900&q=80",
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
] as const;

/** วิดีโอสาธารณะบน YouTube สำหรับตัวอย่าง */
const YT = {
  eventRecap: youtubeEmbedUrl("jNQXAC9IVRw", false),
  workshop: youtubeEmbedUrl("aqz-KE-bpKQ", false),
  meetup: youtubeEmbedUrl("LXb3EKWsInQ", false),
  charity: youtubeEmbedUrl("M7lc1UVf-VE", false),
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

export async function seedClubEventProdDemoForOwner(
  prisma: PrismaClient,
  ownerUserId: string,
): Promise<void> {
  const trialSessionId = TRIAL_PROD_SCOPE;
  const already = await prisma.clubEventRecord.count({
    where: { ownerUserId, trialSessionId, description: { contains: DEMO_MARKER } },
  });
  if (already >= 3) return;

  const profile = await ensureClubEventProfile(prisma, ownerUserId, trialSessionId);

  await prisma.clubEventProfile.update({
    where: { id: profile.id },
    data: {
      displayName: "ชมรมตัวอย่าง MAWELL",
      tagline: "กิจกรรมชุมชน · แกลเลอรี · การเงินชมรม",
      logoUrl: DEMO_MODULE_LOGO_URL,
      contactPhone: DEMO_MODULE_CONTACT.contactPhone,
      contactLine: DEMO_MODULE_CONTACT.lineId,
      promptPayPhone: DEMO_MODULE_PAYMENT.promptPayPhone,
      bankName: DEMO_MODULE_PAYMENT.bankName,
      bankAccountNumber: DEMO_MODULE_PAYMENT.bankAccountNumber,
      bankAccountName: "ชมรมตัวอย่าง MAWELL",
      rulesMarkdown: [
        "## กฎระเบียบชมรม (ตัวอย่าง)",
        "",
        "1. สมาชิกต้องลงทะเบียนก่อนเข้าร่วมกิจกรรม",
        "2. รักษาทรัพย์สินส่วนกลางของชมรม",
        "3. จ่ายค่าบำรุงตามกำหนด หรือแจ้งล่วงหน้า",
        "",
        `_${DEMO_MARKER}_`,
      ].join("\n"),
      committeeJson: JSON.stringify([
        { role: "ประธาน", name: "สมชาย ใจดี", phone: "0811110001", photoUrl: PORTRAIT_POOL[0] },
        { role: "รองประธาน", name: "สมหญิง รักงาน", phone: "0811110002", photoUrl: PORTRAIT_POOL[1] },
        { role: "เลขาธิการ", name: "วิชัย จัดงาน", phone: "0811110003", photoUrl: PORTRAIT_POOL[2] },
        { role: "เหรัญญิก", name: "มานี บัญชีดี", phone: "0811110004", photoUrl: PORTRAIT_POOL[3] },
        { role: "ฝ่ายกิจกรรม", name: "ปิติ สร้างสรรค์", phone: "0811110005", photoUrl: PORTRAIT_POOL[4] },
      ]),
    },
  });

  const pastDefs = [
    {
      title: "งานปีใหม่ชมรม 2025",
      daysAgo: 280,
      youtube: YT.eventRecap,
      images: 12,
      galleryStart: 0,
      description: `งานเลี้ยงปีใหม่สมาชิกและครอบครัว — มีโชว์ · แจกรางวัล · รูปเยอะสำหรับย้อนหลัง\n\n${DEMO_MARKER}`,
    },
    {
      title: "อบรมทักษะทีมเวิร์ค",
      daysAgo: 210,
      youtube: YT.workshop,
      images: 10,
      galleryStart: 4,
      description: `เวิร์กช็อปทั้งวันที่ศูนย์ชุมชน — วิดีโอสรุป + แกลเลอรี\n\n${DEMO_MARKER}`,
    },
    {
      title: "ออกค่ายอาสาพัฒนา",
      daysAgo: 150,
      youtube: YT.charity,
      images: 14,
      galleryStart: 8,
      description: `ค่ายอาสา 3 วัน 2 คืน — รูปกิจกรรมครบชุด\n\n${DEMO_MARKER}`,
    },
    {
      title: "มีตอัพสมาชิกไตรมาส 2",
      daysAgo: 90,
      youtube: YT.meetup,
      images: 11,
      galleryStart: 2,
      description: `พบปะสมาชิก · อัปเดตแผนงาน · ถ่ายภาพหมู่\n\n${DEMO_MARKER}`,
    },
    {
      title: "งานกาชาดและเปิดรับสมาชิกใหม่",
      daysAgo: 45,
      youtube: YT.eventRecap,
      images: 13,
      galleryStart: 6,
      description: `บูธประชาสัมพันธ์ · รับสมัคร · บันทึกวิดีโอสั้น\n\n${DEMO_MARKER}`,
    },
    {
      title: "กิจกรรมกีฬาเชื่อมสัมพันธ์",
      daysAgo: 14,
      youtube: YT.workshop,
      images: 12,
      galleryStart: 10,
      description: `แข่งกีฬาเบา ๆ · ของรางวัล · รูปสนามเต็มอัลบั้ม\n\n${DEMO_MARKER}`,
    },
  ] as const;

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
        youtubeEmbedUrl: def.youtube,
      },
    });
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
      youtube: null as string | null,
    },
    {
      title: "ทริปศึกษาดูงานต่างจังหวัด",
      daysAhead: 35,
      description: `รับสมัครสมาชิก 40 ที่นั่ง — ชำระมัดจำผ่านลิงก์\n\n${DEMO_MARKER}`,
      youtube: YT.meetup,
    },
    {
      title: "งานครบรอบก่อตั้งชมรม",
      daysAhead: 60,
      description: `คอนเสิร์ตเล็ก · บูธอาหาร · เปิดรับสปอนเซอร์\n\n${DEMO_MARKER}`,
      youtube: null,
    },
  ];

  for (const def of upcomingDefs) {
    await prisma.clubEventRecord.create({
      data: {
        ownerUserId,
        trialSessionId,
        profileId: profile.id,
        title: def.title,
        eventDate: bangkokOffsetDays(def.daysAhead, 18, 30),
        status: "UPCOMING",
        description: def.description,
        youtubeEmbedUrl: def.youtube,
      },
    });
  }

  const memberCount = await prisma.clubEventMember.count({
    where: { ownerUserId, trialSessionId },
  });
  if (memberCount < 5) {
    const members = [
      { name: "อรุณ แสงทอง", phone: "0892001001", photoUrl: PORTRAIT_POOL[0] },
      { name: "กมลชนก ใจเย็น", phone: "0892001002", photoUrl: PORTRAIT_POOL[1] },
      { name: "ธีรพงศ์ ตั้งใจ", phone: "0892001003", photoUrl: PORTRAIT_POOL[2] },
      { name: "นภาวรรณ สุขใจ", phone: "0892001004", photoUrl: PORTRAIT_POOL[3] },
      { name: "พีรพล ร่วมมือ", phone: "0892001005", photoUrl: PORTRAIT_POOL[4] },
      { name: "ศิริพร ช่วยงาน", phone: "0892001006", photoUrl: PORTRAIT_POOL[5] },
    ];
    await prisma.clubEventMember.createMany({
      data: members.map((m, i) => {
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
          gender: i % 2 === 0 ? "MALE" : "FEMALE",
          phone: m.phone,
          photoUrl: m.photoUrl,
          position: i < 2 ? "กรรมการ" : "สมาชิก",
          email: `member${i + 1}@demo.club`,
          social: `line:demo${i + 1}`,
          memberCode: `M${String(i + 1).padStart(3, "0")}`,
          dataConsent: true,
          customFieldsJson: JSON.stringify([
            { key: "dept", label: "แผนก", value: "สมาชิกทั่วไป" },
            { key: "note", label: "หมายเหตุ", value: DEMO_MARKER },
          ]),
          isActive: true,
        };
      }),
    });
  }

  const assetCount = await prisma.clubEventAsset.count({
    where: { ownerUserId, trialSessionId },
  });
  if (assetCount < 3) {
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
      ],
    });
  }

  const finCount = await prisma.clubEventFinanceTransaction.count({
    where: { ownerUserId, trialSessionId },
  });
  if (finCount < 4) {
    await prisma.clubEventFinanceTransaction.createMany({
      data: [
        {
          ownerUserId,
          trialSessionId,
          profileId: profile.id,
          type: "INCOME",
          category: "ค่าบำรุงสมาชิก",
          amountBaht: 15000,
          transactedAt: bangkokOffsetDays(-40, 10, 0),
          note: DEMO_MARKER,
          slipUrl: GALLERY_POOL[0],
        },
        {
          ownerUserId,
          trialSessionId,
          profileId: profile.id,
          type: "INCOME",
          category: "สปอนเซอร์",
          amountBaht: 8000,
          transactedAt: bangkokOffsetDays(-20, 11, 0),
          note: DEMO_MARKER,
          slipUrl: GALLERY_POOL[1],
        },
        {
          ownerUserId,
          trialSessionId,
          profileId: profile.id,
          type: "EXPENSE",
          category: "ค่าสถานที่",
          amountBaht: 3500,
          transactedAt: bangkokOffsetDays(-15, 16, 0),
          note: DEMO_MARKER,
          slipUrl: GALLERY_POOL[2],
        },
        {
          ownerUserId,
          trialSessionId,
          profileId: profile.id,
          type: "EXPENSE",
          category: "ของรางวัล / ของที่ระลึก",
          amountBaht: 4200,
          transactedAt: bangkokOffsetDays(-14, 17, 0),
          note: DEMO_MARKER,
        },
        {
          ownerUserId,
          trialSessionId,
          profileId: profile.id,
          type: "EXPENSE",
          category: "อาหารว่างกิจกรรม",
          amountBaht: 2800,
          transactedAt: bangkokOffsetDays(-13, 12, 0),
          note: DEMO_MARKER,
        },
      ],
    });
  }

  const linkCount = await prisma.clubEventDynamicLink.count({
    where: { ownerUserId, trialSessionId },
  });
  if (linkCount < 2) {
    await prisma.clubEventDynamicLink.createMany({
      data: [
        {
          ownerUserId,
          trialSessionId,
          profileId: profile.id,
          type: "RSVP",
          title: "ยืนยันเข้าร่วมประชุมใหญ่",
          configJson: JSON.stringify({
            fields: [
              { key: "name", label: "ชื่อ", type: "text" },
              { key: "phone", label: "เบอร์โทร", type: "tel" },
            ],
          }),
          isActive: true,
        },
        {
          ownerUserId,
          trialSessionId,
          profileId: profile.id,
          type: "PAYMENT",
          title: "จ่ายค่าบำรุงประจำปี",
          configJson: JSON.stringify({ amountBaht: 300 }),
          isActive: true,
        },
        {
          ownerUserId,
          trialSessionId,
          profileId: profile.id,
          type: "URL",
          title: "กลุ่ม LINE ชมรม",
          configJson: JSON.stringify({ url: "https://line.me/ti/g/demo-club-event" }),
          isActive: true,
        },
        {
          ownerUserId,
          trialSessionId,
          profileId: profile.id,
          type: "SURVEY",
          title: "แบบสำรวจความพึงพอใจกิจกรรม",
          configJson: JSON.stringify({
            fields: [
              { key: "score", label: "คะแนน 1–5", type: "number" },
              { key: "comment", label: "ความคิดเห็น", type: "text" },
            ],
          }),
          isActive: true,
        },
      ],
    });
  }
}
