import type { PrismaClient } from "@/generated/prisma/client";
import { hashPassword } from "@/lib/auth/password";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";
import {
  DEMO_MODULE_CONTACT,
  DEMO_MODULE_LOGO_URL,
  DEMO_MODULE_PAYMENT,
} from "@/lib/trial/demo-module-settings";
import { bangkokDateKey } from "@/lib/time/bangkok";
import { ensureLmsProfile } from "@/systems/lms/lib/ensure-lms-profile";
import { stringifyChoices } from "@/systems/lms/lib/mappers";
import { lmsYoutubeEmbedUrl } from "@/systems/lms/lib/youtube";

const DEMO_MARKER = "seed:lms-demo-v3";

async function wipeLmsDemoScope(
  prisma: PrismaClient,
  ownerUserId: string,
  trialSessionId: string,
): Promise<void> {
  const where = { ownerUserId, trialSessionId };
  await prisma.lmsCertificate.deleteMany({ where });
  await prisma.lmsLessonProgress.deleteMany({ where });
  await prisma.lmsEnrollment.deleteMany({ where });
  await prisma.lmsCoursePurchase.deleteMany({ where });
  await prisma.lmsQuestion.deleteMany({ where });
  await prisma.lmsExam.deleteMany({ where });
  await prisma.lmsLesson.deleteMany({ where });
  await prisma.lmsCourse.deleteMany({ where });
  await prisma.lmsFinanceTransaction.deleteMany({ where });
  await prisma.lmsLearner.deleteMany({ where });
}

function bangkokOffsetDays(days: number, hour = 10): Date {
  const key = bangkokDateKey();
  const base = new Date(`${key}T12:00:00+07:00`);
  base.setTime(base.getTime() + days * 24 * 60 * 60 * 1000);
  const ymd = bangkokDateKey(base);
  const h = String(hour).padStart(2, "0");
  return new Date(`${ymd}T${h}:00:00+07:00`);
}

/** ล้างแล้วใส่ชุด LMS ใหม่ตามวันนี้ (Asia/Bangkok) — ให้ทดลองใช้สมจริงทุกวัน */
export async function seedLmsProdDemoForOwner(prisma: PrismaClient, ownerUserId: string) {
  const trialSessionId = TRIAL_PROD_SCOPE;
  await wipeLmsDemoScope(prisma, ownerUserId, trialSessionId);

  const profile = await ensureLmsProfile(prisma, ownerUserId, trialSessionId);

  await prisma.lmsProfile.update({
    where: { id: profile.id },
    data: {
      displayName: "สถาบันตัวอย่าง MAWELL LMS",
      tagline: "คอร์สออนไลน์ตัวอย่าง · อัปเดตรายวัน",
      logoUrl: DEMO_MODULE_LOGO_URL,
      contactPhone: DEMO_MODULE_CONTACT.contactPhone,
      contactLine: DEMO_MODULE_CONTACT.lineId,
      promptPayPhone: DEMO_MODULE_PAYMENT.promptPayPhone,
      bankName: DEMO_MODULE_PAYMENT.bankName,
      bankAccountNumber: DEMO_MODULE_PAYMENT.bankAccountNumber,
      bankAccountName: DEMO_MODULE_PAYMENT.bankAccountName,
      certSignerName: "อ.สมชาย วิทยากร",
      certTemplateNote: "ใบประกาศตัวอย่างสำหรับทดลองพิมพ์",
    },
  });

  const course = await prisma.lmsCourse.create({
    data: {
      ownerUserId,
      trialSessionId,
      profileId: profile.id,
      title: "พื้นฐานการตลาดออนไลน์",
      description: `${DEMO_MARKER} — คอร์สตัวอย่างสำหรับทดลอง LMS`,
      coverImageUrl:
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=78",
      status: "PUBLISHED",
      priceBaht: 1490,
    },
  });

  const courseBuy = await prisma.lmsCourse.create({
    data: {
      ownerUserId,
      trialSessionId,
      profileId: profile.id,
      title: "โฆษณา Facebook Ads ขั้นกลาง",
      description: `${DEMO_MARKER} — คอร์สให้ทดลองซื้อจากพอร์ทัลผู้เรียน`,
      coverImageUrl:
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=900&q=78",
      status: "PUBLISHED",
      priceBaht: 990,
    },
  });

  const lessonTitles = [
    { title: "แนะนำคอร์ส", videoId: "dQw4w9WgXcQ" },
    { title: "วางแผนคอนเทนต์", videoId: "jNQXAC9IVRw" },
    { title: "วัดผลแคมเปญ", videoId: "9bZkp7q19f0" },
  ];
  for (let i = 0; i < lessonTitles.length; i += 1) {
    const row = lessonTitles[i]!;
    await prisma.lmsLesson.create({
      data: {
        ownerUserId,
        trialSessionId,
        courseId: course.id,
        title: row.title,
        youtubeUrl: lmsYoutubeEmbedUrl(row.videoId),
        orderIndex: i,
        durationSec: 600 + i * 120,
      },
    });
  }

  await prisma.lmsLesson.create({
    data: {
      ownerUserId,
      trialSessionId,
      courseId: courseBuy.id,
      title: "เริ่มต้น Ads Manager",
      youtubeUrl: lmsYoutubeEmbedUrl("dQw4w9WgXcQ"),
      orderIndex: 0,
      durationSec: 480,
    },
  });

  const exam = await prisma.lmsExam.create({
    data: {
      ownerUserId,
      trialSessionId,
      courseId: course.id,
      title: "แบบทดสอบท้ายคอร์ส",
      passingScorePercent: 70,
    },
  });

  await prisma.lmsQuestion.createMany({
    data: [
      {
        ownerUserId,
        trialSessionId,
        examId: exam.id,
        questionText: "KPI ที่ใช้วัดการเข้าถึงบ่อยที่สุดคือข้อใด?",
        choicesJson: stringifyChoices(["Reach", "ROAS", "CPA", "LTV"]),
        correctAnswer: "0",
        orderIndex: 0,
      },
      {
        ownerUserId,
        trialSessionId,
        examId: exam.id,
        questionText: "ก่อนลงโฆษณาควรทำอะไรเป็นอันดับแรก?",
        choicesJson: stringifyChoices(["ตั้งงบ", "กำหนดเป้าหมาย", "เลือกสีโฆษณา", "ปิดแคมเปญเก่า"]),
        correctAnswer: "1",
        orderIndex: 1,
      },
    ],
  });

  const pw1 = await hashPassword("demo1234");
  const pw2 = await hashPassword("demo1234");
  const [learner1, learner2] = await Promise.all([
    prisma.lmsLearner.create({
      data: {
        ownerUserId,
        trialSessionId,
        profileId: profile.id,
        username: "demo.student1",
        passwordHash: pw1,
        fullName: "นักเรียนตัวอย่าง 1",
        email: "student1@example.com",
        status: "ACTIVE",
      },
    }),
    prisma.lmsLearner.create({
      data: {
        ownerUserId,
        trialSessionId,
        profileId: profile.id,
        username: "demo.student2",
        passwordHash: pw2,
        fullName: "นักเรียนตัวอย่าง 2",
        email: "student2@example.com",
        status: "ACTIVE",
      },
    }),
  ]);

  await prisma.lmsEnrollment.createMany({
    data: [
      {
        ownerUserId,
        trialSessionId,
        learnerId: learner1.id,
        courseId: course.id,
        progressPercent: 45,
        status: "IN_PROGRESS",
      },
      {
        ownerUserId,
        trialSessionId,
        learnerId: learner2.id,
        courseId: course.id,
        progressPercent: 100,
        status: "COMPLETED",
        examScorePercent: 85,
        completedAt: bangkokOffsetDays(0, 11),
      },
    ],
  });

  await prisma.lmsCertificate.create({
    data: {
      ownerUserId,
      trialSessionId,
      learnerId: learner2.id,
      courseId: course.id,
      issueDate: bangkokOffsetDays(0, 12),
      certCode: `LMS-${bangkokDateKey().replace(/-/g, "")}-DEMO`,
    },
  });

  await prisma.lmsCoursePurchase.create({
    data: {
      ownerUserId,
      trialSessionId,
      profileId: profile.id,
      learnerId: learner1.id,
      courseId: courseBuy.id,
      amountBaht: 990,
      payMethod: "PROMPTPAY",
      status: "PENDING_REVIEW",
    },
  });

  await prisma.lmsFinanceTransaction.createMany({
    data: [
      {
        ownerUserId,
        trialSessionId,
        profileId: profile.id,
        type: "INCOME",
        category: "ค่าคอร์ส",
        amountBaht: 1490,
        transactedAt: bangkokOffsetDays(0, 10),
        note: DEMO_MARKER,
      },
      {
        ownerUserId,
        trialSessionId,
        profileId: profile.id,
        type: "INCOME",
        category: "ค่าคอร์ส",
        amountBaht: 990,
        transactedAt: bangkokOffsetDays(-1, 15),
        note: DEMO_MARKER,
      },
      {
        ownerUserId,
        trialSessionId,
        profileId: profile.id,
        type: "EXPENSE",
        category: "ค่าโฆษณา",
        amountBaht: 350,
        transactedAt: bangkokOffsetDays(0, 14),
        note: DEMO_MARKER,
      },
      {
        ownerUserId,
        trialSessionId,
        profileId: profile.id,
        type: "EXPENSE",
        category: "ค่าแพลตฟอร์ม",
        amountBaht: 199,
        transactedAt: bangkokOffsetDays(-2, 9),
        note: DEMO_MARKER,
      },
    ],
  });
}
