import type { PrismaClient } from "@/generated/prisma/client";
import { DEMO_MODULE_CONTACT, DEMO_MODULE_LOGO_URL } from "@/lib/trial/demo-module-settings";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";
import { bangkokDateKey } from "@/lib/time/bangkok";
import { ensureResumeProfile } from "@/systems/pro-resume/lib/ensure-resume-profile";

const DEMO_MARKER = "seed:pro-resume-demo-v1";

const PROFILE_PHOTO =
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&h=400&q=80";

const COVER_POOL = [
  "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=900&q=78",
  "https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=900&q=78",
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=78",
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=78",
  "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=900&q=78",
  "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=900&q=78",
  "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=900&q=78",
  "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=900&q=78",
] as const;

const GALLERY_POOL = [
  "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1551434678-e076c223a692f?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80",
] as const;

const CERT_FILE =
  "https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=800&q=80";

function bangkokOffsetDays(days: number, hour = 14, minute = 0): Date {
  const key = bangkokDateKey();
  const base = new Date(`${key}T12:00:00+07:00`);
  base.setTime(base.getTime() + days * 24 * 60 * 60 * 1000);
  const ymd = bangkokDateKey(base);
  const h = String(hour).padStart(2, "0");
  const m = String(minute).padStart(2, "0");
  return new Date(`${ymd}T${h}:${m}:00+07:00`);
}

function gallery(start: number, count: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < count; i += 1) {
    out.push(GALLERY_POOL[(start + i) % GALLERY_POOL.length]!);
  }
  return out;
}

function htmlBlock(title: string, body: string): string {
  return `<h2>${title}</h2><p>${body}</p><ul><li>เป้าหมายชัดเจนและวัดผลได้</li><li>ทำงานร่วมทีมข้ามหน่วยงาน</li><li>ส่งมอบตรงเวลาพร้อมเอกสารครบ</li></ul>`;
}

async function wipeProResumeDemoScope(
  prisma: PrismaClient,
  ownerUserId: string,
  trialSessionId: string,
): Promise<void> {
  await prisma.resumeViewAnalytics.deleteMany({ where: { ownerUserId, trialSessionId } });
  await prisma.resumePortfolioItem.deleteMany({ where: { ownerUserId, trialSessionId } });
  await prisma.resumePortfolioCategory.deleteMany({ where: { ownerUserId, trialSessionId } });
  await prisma.resumeCertificate.deleteMany({ where: { ownerUserId, trialSessionId } });
  await prisma.resumeExperience.deleteMany({ where: { ownerUserId, trialSessionId } });
  await prisma.resumeEducation.deleteMany({ where: { ownerUserId, trialSessionId } });
}

/**
 * ล้างแล้วใส่ชุดข้อมูลทดลองครบฟังก์ชัน: โปรไฟล์ · การศึกษา · ประวัติงาน · ใบประกาศ ·
 * หมวด/ชิ้นงานพอร์ตโฟลิโอ · สถิติเข้าชม/คลิก
 */
export async function seedProResumeProdDemoForOwner(
  prisma: PrismaClient,
  ownerUserId: string,
  trialSessionId: string = TRIAL_PROD_SCOPE,
): Promise<void> {
  await wipeProResumeDemoScope(prisma, ownerUserId, trialSessionId);

  const profile = await ensureResumeProfile(prisma, ownerUserId, trialSessionId);
  const user = await prisma.user.findUnique({
    where: { id: ownerUserId },
    select: { username: true, email: true },
  });
  const username = user?.username ?? "demo";
  const slugBase = username
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 36);
  let slug = slugBase.length >= 3 ? `resume-${slugBase}` : `resume-${ownerUserId.slice(0, 8)}`;
  let suffix = 0;
  while (
    await prisma.resumeProfile.findFirst({
      where: { slug, trialSessionId, NOT: { id: profile.id } },
      select: { id: true },
    })
  ) {
    suffix += 1;
    slug = `${slugBase || "resume"}-${suffix}`;
  }

  await prisma.resumeProfile.update({
    where: { id: profile.id },
    data: {
      slug,
      fullName: "คุณสมชาย พัฒนาผลงาน",
      positionTitle: "นักพัฒนาระบบ / Product Owner",
      bio: `${DEMO_MARKER} — ผู้เชี่ยวชาญด้าน SaaS และระบบธุรกิจท้องถิ่น มีประสบการณ์นำทีมส่งมอบโปรเจกต์ดิจิทัลครบวงจร ตั้งแต่วิเคราะห์ความต้องการจนถึงเปิดใช้งานจริง`,
      profileImageUrl: PROFILE_PHOTO || DEMO_MODULE_LOGO_URL,
      contactEmail: user?.email ?? "demo@mawell.local",
      contactPhone: DEMO_MODULE_CONTACT.contactPhone,
      publicEnabled: true,
      isPremium: false,
    },
  });

  const educations = [
    {
      degree: "ปริญญาโท สาขาการจัดการเทคโนโลยีสารสนเทศ",
      institution: "มหาวิทยาลัยขอนแก่น",
      startYear: 2018,
      endYear: 2020,
      description: "วิทยานิพนธ์เรื่องแพลตฟอร์มบริการธุรกิจชุมชน · GPA 3.85",
    },
    {
      degree: "ปริญญาตรี สาขาวิทยาการคอมพิวเตอร์",
      institution: "มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี",
      startYear: 2012,
      endYear: 2016,
      description: "โครงงานจบ: ระบบจองคิวออนไลน์สำหรับร้านค้าชุมชน",
    },
    {
      degree: "มัธยมศึกษาตอนปลาย วิทย์–คณิต",
      institution: "โรงเรียนสาธิตมหาวิทยาลัยขอนแก่น",
      startYear: 2009,
      endYear: 2012,
      description: "กรรมการสภานักเรียน · ทีมโอลิมปิกคอมพิวเตอร์",
    },
  ] as const;

  for (let i = 0; i < educations.length; i += 1) {
    const e = educations[i]!;
    await prisma.resumeEducation.create({
      data: {
        ownerUserId,
        trialSessionId,
        profileId: profile.id,
        degree: e.degree,
        institution: e.institution,
        startYear: e.startYear,
        endYear: e.endYear,
        description: e.description,
        orderIndex: i,
      },
    });
  }

  const experiences = [
    {
      jobTitle: "Product Owner / Tech Lead",
      company: "MAWELL Digital Platform",
      startDate: "2023-01",
      endDate: null as string | null,
      achievements:
        "นำทีมพัฒนาโมดูล SaaS หลายระบบ · ออกแบบ UX ตามมาตรฐานแดชบอร์ด · ลดเวลาส่งมอบเฉลี่ย 30%",
    },
    {
      jobTitle: "Full-stack Developer",
      company: "บริษัท โซลูชันท้องถิ่น จำกัด",
      startDate: "2020-03",
      endDate: "2022-12",
      achievements:
        "พัฒนา Next.js + Prisma · ระบบจอง/ชำระเงิน · ดูแล CI/CD และฐานข้อมูล MySQL",
    },
    {
      jobTitle: "Software Engineer",
      company: "สตาร์ทอัพ FinTech ภาคอีสาน",
      startDate: "2017-06",
      endDate: "2020-02",
      achievements: "สร้าง API ชำระเงิน · Dashboard รายงาน · ผสาน PromptPay และสลิปอัตโนมัติ",
    },
    {
      jobTitle: "Internship — Web Developer",
      company: "สำนักงานพัฒนาดิจิทัลท้องถิ่น",
      startDate: "2015-05",
      endDate: "2015-08",
      achievements: "เว็บประชาสัมพันธ์หน่วยงาน · ระบบลงทะเบียนอบรมออนไลน์",
    },
  ] as const;

  for (let i = 0; i < experiences.length; i += 1) {
    const e = experiences[i]!;
    await prisma.resumeExperience.create({
      data: {
        ownerUserId,
        trialSessionId,
        profileId: profile.id,
        jobTitle: e.jobTitle,
        company: e.company,
        startDate: e.startDate,
        endDate: e.endDate,
        achievements: e.achievements,
        orderIndex: i,
      },
    });
  }

  const certificates = [
    {
      name: "AWS Certified Cloud Practitioner",
      issuedBy: "Amazon Web Services",
      year: 2024,
      fileUrl: CERT_FILE,
    },
    {
      name: "Professional Scrum Product Owner I",
      issuedBy: "Scrum.org",
      year: 2023,
      fileUrl: CERT_FILE,
    },
    {
      name: "Google UX Design Certificate",
      issuedBy: "Google / Coursera",
      year: 2022,
      fileUrl: null as string | null,
    },
    {
      name: "หลักสูตร Digital Transformation สำหรับ SME",
      issuedBy: "สำนักงานส่งเสริมวิสาหกิจขนาดกลางและขนาดย่อม",
      year: 2021,
      fileUrl: CERT_FILE,
    },
  ] as const;

  for (let i = 0; i < certificates.length; i += 1) {
    const c = certificates[i]!;
    await prisma.resumeCertificate.create({
      data: {
        ownerUserId,
        trialSessionId,
        profileId: profile.id,
        name: c.name,
        issuedBy: c.issuedBy,
        year: c.year,
        fileUrl: c.fileUrl,
        orderIndex: i,
      },
    });
  }

  const catDev = await prisma.resumePortfolioCategory.create({
    data: {
      ownerUserId,
      trialSessionId,
      profileId: profile.id,
      name: "การพัฒนางาน",
      orderIndex: 0,
    },
  });
  const catInnov = await prisma.resumePortfolioCategory.create({
    data: {
      ownerUserId,
      trialSessionId,
      profileId: profile.id,
      name: "นวัตกรรม",
      orderIndex: 1,
    },
  });
  const catLead = await prisma.resumePortfolioCategory.create({
    data: {
      ownerUserId,
      trialSessionId,
      profileId: profile.id,
      name: "ผู้นำทีม / อบรม",
      orderIndex: 2,
    },
  });

  type ItemSeed = {
    categoryId: string;
    title: string;
    cover: string;
    short: string;
    html: string;
    youtube: string | null;
    images: string[];
    clicks: number;
  };

  const items: ItemSeed[] = [
    {
      categoryId: catDev.id,
      title: "ระบบรับฝากซักผ้าออนไลน์",
      cover: COVER_POOL[0]!,
      short: "พอร์ทัลลูกค้า · คิว · ชำระเงิน · พิมพ์ใบเสร็จ — ครบวงจร",
      html: htmlBlock(
        "ภาพรวมโครงการ",
        "ออกแบบและพัฒนาระบบรับฝากซักผ้าแบบ Multi-tenant รองรับมือถือเต็มรูปแบบ พร้อมสถิติและการเงิน",
      ),
      youtube: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      images: gallery(0, 4),
      clicks: 42,
    },
    {
      categoryId: catDev.id,
      title: "แดชบอร์ดบริหารชมรม",
      cover: COVER_POOL[1]!,
      short: "กิจกรรม สมาชิก การเงิน และเว็บสาธารณะ /club/[slug]",
      html: htmlBlock(
        "ผลลัพธ์",
        "ลดงานเอกสารลงทะเบียนวันงาน และเปิดให้สมาชิกชำระค่าบำรุงผ่านลิงก์ไดนามิก",
      ),
      youtube: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
      images: gallery(2, 3),
      clicks: 28,
    },
    {
      categoryId: catDev.id,
      title: "LMS คอร์สออนไลน์",
      cover: COVER_POOL[2]!,
      short: "คอร์ส YouTube · ข้อสอบ · ใบรับรอง · โควตาผู้เรียน",
      html: htmlBlock(
        "บทบาท",
        "ออกแบบโครงสร้างคอร์ส/บทเรียน และโฟลว์ซื้อคอร์สพร้อมตรวจสลิป",
      ),
      youtube: null,
      images: gallery(1, 5),
      clicks: 19,
    },
    {
      categoryId: catInnov.id,
      title: "นวัตกรรม QR Hub + สลิปอัจฉริยะ",
      cover: COVER_POOL[3]!,
      short: "มาตรฐาน QR ลูกค้า/พนักงาน และอัปโหลดสลิปย่อรูปก่อนส่งเซิร์ฟเวอร์",
      html: htmlBlock(
        "นวัตกรรม",
        "รวมเทมเพลต QR โปสเตอร์และระบบย่อรูปก่อนอัปโหลด ลดภาระแบนด์วิดท์ร้านค้า",
      ),
      youtube: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
      images: gallery(3, 4),
      clicks: 35,
    },
    {
      categoryId: catInnov.id,
      title: "ระบบเวลาไทย Asia/Bangkok กลาง",
      cover: COVER_POOL[4]!,
      short: "มาตรฐานวันที่/คิว/ราคาวันหยุดสำหรับทุกโมดูลธุรกิจไทย",
      html: htmlBlock(
        "ผลกระทบ",
        "แก้ปัญหาเลื่อนวันกลางคืนและราคาเสาร์–อาทิตย์ไม่ตรงโซนเซิร์ฟเวอร์",
      ),
      youtube: null,
      images: gallery(4, 2),
      clicks: 11,
    },
    {
      categoryId: catLead.id,
      title: "เวิร์กช็อป UX สำหรับทีมท้องถิ่น",
      cover: COVER_POOL[5]!,
      short: "อบรม 2 วัน · ออกแบบการ์ดรายการ Left Data / Right Action",
      html: htmlBlock(
        "เนื้อหาอบรม",
        "สอนแพทเทิร์นแดชบอร์ดมือถือ dock ล่าง · กรอง · ไอคอนแก้ไข/ลบ และพอร์ทัลลูกค้า",
      ),
      youtube: "https://www.youtube.com/watch?v=LXb3EKWsInQ",
      images: gallery(0, 3),
      clicks: 22,
    },
    {
      categoryId: catLead.id,
      title: "คู่มือมาตรฐานโมดูลซักผ้า (Golden Template)",
      cover: COVER_POOL[6]!,
      short: "จัดทำกฎ Cursor Rules และแผนที่ไฟล์สำหรับโมดูลใหม่",
      html: htmlBlock(
        "ส่งมอบ",
        "เอกสารและตัวอย่างโค้ดที่ทีมใช้เป็นแม่แบบเมื่อสร้างโมดูลแดชบอร์ดใหม่",
      ),
      youtube: null,
      images: gallery(5, 3),
      clicks: 8,
    },
    {
      categoryId: catLead.id,
      title: "รีวิวสถาปัตยกรรม Multi-tenant",
      cover: COVER_POOL[7]!,
      short: "ทบทวน ownerUserId + trialSessionId และแผนรายเดือนต่อโมดูล",
      html: htmlBlock(
        "ข้อเสนอแนะ",
        "กำหนดเกต Premium สำหรับแชร์ลิงก์สาธารณะ และ sync สิทธิ์จาก UserModulePlan",
      ),
      youtube: "https://www.youtube.com/watch?v=M7lc1UVf-VE",
      images: gallery(2, 2),
      clicks: 15,
    },
  ];

  const createdItems: { id: string; clicks: number }[] = [];
  for (let i = 0; i < items.length; i += 1) {
    const it = items[i]!;
    const row = await prisma.resumePortfolioItem.create({
      data: {
        ownerUserId,
        trialSessionId,
        profileId: profile.id,
        categoryId: it.categoryId,
        title: it.title,
        coverImage: it.cover,
        shortDesc: it.short,
        contentHTML: it.html,
        youtubeUrl: it.youtube,
        imagesJson: JSON.stringify(it.images),
        orderIndex: i,
        clickCount: it.clicks,
      },
      select: { id: true },
    });
    createdItems.push({ id: row.id, clicks: it.clicks });
  }

  const devices = ["desktop", "mobile", "tablet", "mobile", "desktop"] as const;
  const ips = ["203.0.113.10", "203.0.113.22", "198.51.100.7", "198.51.100.44", "192.0.2.55"];

  for (let day = -6; day <= 0; day += 1) {
    const viewsToday = day === 0 ? 5 : day === -1 ? 4 : 2 + ((-day) % 3);
    for (let v = 0; v < viewsToday; v += 1) {
      await prisma.resumeViewAnalytics.create({
        data: {
          ownerUserId,
          trialSessionId,
          profileId: profile.id,
          viewerIp: ips[v % ips.length]!,
          viewedAt: bangkokOffsetDays(day, 9 + v * 2, 10 + v * 3),
          deviceType: devices[v % devices.length]!,
          portfolioItemId: null,
        },
      });
    }
  }

  for (const item of createdItems) {
    const sampleClicks = Math.min(5, Math.max(1, Math.floor(item.clicks / 8)));
    for (let c = 0; c < sampleClicks; c += 1) {
      await prisma.resumeViewAnalytics.create({
        data: {
          ownerUserId,
          trialSessionId,
          profileId: profile.id,
          viewerIp: ips[c % ips.length]!,
          viewedAt: bangkokOffsetDays(-(c % 5), 11 + c, 20),
          deviceType: devices[c % devices.length]!,
          portfolioItemId: item.id,
        },
      });
    }
  }
}
