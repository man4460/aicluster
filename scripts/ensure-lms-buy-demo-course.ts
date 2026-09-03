import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient();

async function main() {
  const profiles = await prisma.lmsProfile.findMany({ where: { slug: "user" } });
  for (const p of profiles) {
    const existing = await prisma.lmsCourse.findFirst({
      where: { profileId: p.id, title: "โฆษณา Facebook Ads ขั้นกลาง" },
    });
    if (existing) {
      console.log("exists", existing.id);
      continue;
    }
    const c = await prisma.lmsCourse.create({
      data: {
        ownerUserId: p.ownerUserId,
        trialSessionId: p.trialSessionId,
        profileId: p.id,
        title: "โฆษณา Facebook Ads ขั้นกลาง",
        description: "seed:lms-demo-v2 — คอร์สให้ทดลองซื้อจากพอร์ทัลผู้เรียน",
        coverImageUrl:
          "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=900&q=78",
        status: "PUBLISHED",
        priceBaht: 990,
      },
    });
    await prisma.lmsLesson.create({
      data: {
        ownerUserId: p.ownerUserId,
        trialSessionId: p.trialSessionId,
        courseId: c.id,
        title: "เริ่มต้น Ads Manager",
        youtubeUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        orderIndex: 0,
        durationSec: 480,
      },
    });
    console.log("created", c.id, "for", p.slug);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
