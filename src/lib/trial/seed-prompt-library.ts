import type { PrismaClient } from "@/generated/prisma/client";

type DbLike = PrismaClient;

/** หมวดเริ่มต้น — สอดคล้องกับ `ensureDefaultPromptCategories` */
const DEFAULT_CATEGORIES: readonly {
  name: string;
  icon: string;
  color: string;
  description: string;
  sortOrder: number;
}[] = [
  { name: "Writing", icon: "✍️", color: "#8b5cf6", description: "คำสั่งสำหรับงานเขียน", sortOrder: 10 },
  { name: "Coding", icon: "💻", color: "#06b6d4", description: "คำสั่งสำหรับโปรแกรมเมอร์", sortOrder: 20 },
  { name: "Marketing", icon: "📣", color: "#f59e0b", description: "คำสั่งสำหรับการตลาด", sortOrder: 30 },
  { name: "Analysis", icon: "📊", color: "#10b981", description: "คำสั่งสำหรับการวิเคราะห์", sortOrder: 40 },
  { name: "Creative", icon: "🎨", color: "#ec4899", description: "คำสั่งสำหรับงานสร้างสรรค์", sortOrder: 50 },
  { name: "Business", icon: "💼", color: "#3b82f6", description: "คำสั่งสำหรับธุรกิจ", sortOrder: 60 },
  { name: "Education", icon: "📚", color: "#ef4444", description: "คำสั่งสำหรับการศึกษา", sortOrder: 70 },
  { name: "General", icon: "🌐", color: "#64748b", description: "คำสั่งทั่วไป", sortOrder: 80 },
];

type SamplePrompt = {
  title: string;
  content: string;
  description: string;
  categoryName: string;
  tags: string;
  language: "th" | "en" | "mixed";
  modelHint: string | null;
  temperature: number;
  isFavorite: boolean;
  usageCount: number;
};

const SAMPLE_PROMPTS: SamplePrompt[] = [
  {
    title: "สรุปข้อความเป็น bullet ภาษาไทย",
    description: "อ่านแล้วสรุปเป็นรายการสั้น ๆ",
    categoryName: "Writing",
    tags: "สรุป,ไทย,งานเขียน",
    language: "th",
    modelHint: null,
    temperature: 0.6,
    isFavorite: true,
    usageCount: 2,
    content: `คุณเป็นผู้ช่วยเขียนภาษาไทย

งาน: อ่านข้อความที่ผู้ใช้แนบมา แล้วสรุปเป็น bullet ภาษาไทย 5–10 ข้อ
ข้อกำหนด:
- ใช้ภาษาสุภาพ กระชับ
- ไม่ตัดความสำคัญของตัวเลขและชื่อเฉพาะ
- ถ้ามีความเสี่ยง/ข้อควรระวัง ให้แยกหัวข้อ "ข้อควรระวัง"

ข้อความต้นฉบับ:
"""
{ใส่ข้อความที่นี่}
"""`,
  },
  {
    title: "เขียนอีเมลตอบลูกค้าแบบมืออาชีพ",
    description: "น้ำเสียงเป็นกันเองแต่เป็นทางการ",
    categoryName: "Business",
    tags: "อีเมล,ลูกค้า,CS",
    language: "th",
    modelHint: null,
    temperature: 0.5,
    isFavorite: true,
    usageCount: 1,
    content: `ร่างอีเมลตอบลูกค้าภาษาไทย โดย:
1) ขอบคุณที่ติดต่อ
2) สรุปประเด็นที่ลูกค้าถาม
3) ให้คำตอบ/ขั้นตอนถัดไปชัดเจน
4) ปิดท้ายด้วยคำเชิญชวนให้ติดต่อกลับหากมีคำถาม

ข้อมูลบริบท (แก้ให้ตรงจริง):
- ชื่อลูกค้า: 
- ประเด็น: 
- สิ่งที่เราทำได้: `,
  },
  {
    title: "โพสต์โซเชียล 1 ชุด (ไทย)",
    description: "แคปชัน + แฮชแท็ก",
    categoryName: "Marketing",
    tags: "โซเชียล,แคปชัน",
    language: "th",
    modelHint: null,
    temperature: 0.8,
    isFavorite: false,
    usageCount: 0,
    content: `สร้างโพสต์โปรโมทสินค้า/บริการภาษาไทย:
- แคปชันหลัก 2–4 ประโยค
- bullet จุดเด่น 3 ข้อ
- แฮชแท็ก 5–8 อัน (ภาษาไทย/อังกฤษผสมได้)
- Call-to-action ชัดเจน

สินค้า/บริการ: 
โทน: (เช่น เป็นกันเอง / หรู / ตลกเบา ๆ)`,
  },
  {
    title: "Code review checklist (สั้น)",
    description: "เช็กลิสต์ก่อน merge",
    categoryName: "Coding",
    tags: "review,PR,คุณภาพ",
    language: "mixed",
    modelHint: null,
    temperature: 0.3,
    isFavorite: false,
    usageCount: 0,
    content: `Review โค้ดที่ผู้ใช้แนบมา ตอบเป็นหัวข้อ:
- Correctness / edge cases
- Security (input validation, secrets)
- Performance hotspots
- Readability & naming
- Tests / logging ที่ควรมี

โค้ด:
"""
{paste code}
"""`,
  },
  {
    title: "ถอดความ KPI รายเดือนเป็นข้อความรายงาน",
    description: "สำหรับหัวหน้า/ทีม",
    categoryName: "Analysis",
    tags: "KPI,รายงาน",
    language: "th",
    modelHint: null,
    temperature: 0.45,
    isFavorite: false,
    usageCount: 1,
    content: `จากตัวเลข KPI ด้านล่าง ให้เขียน “สรุปผู้บริหาร” ภาษาไทย 3–5 ประโยค แล้วตามด้วย bullet สิ่งที่ทำได้ดี / ความเสี่ยง / แนวทางถัดไป

ตัวเลข:
- รายได้: 
- ต้นทุน: 
- ลูกค้าใหม่: 
- Churn / ข้อร้องเรียน: `,
  },
];

/**
 * เติมคลัง prompt ตัวอย่างสำหรับบัญชี demo (prod scope ต่อ user)
 * — ถ้ามีคำสั่ง ACTIVE อยู่แล้ว จะไม่แทรกซ้ำ
 */
export async function seedPromptLibraryProdDemoForOwner(db: DbLike, ownerUserId: string): Promise<void> {
  const existing = await db.promptLibraryPrompt.count({
    where: { ownerUserId, status: "ACTIVE" },
  });
  if (existing > 0) return;

  const catCount = await db.promptLibraryCategory.count({ where: { ownerUserId } });
  if (catCount === 0) {
    await db.promptLibraryCategory.createMany({
      data: DEFAULT_CATEGORIES.map((c) => ({
        ownerUserId,
        name: c.name,
        icon: c.icon,
        color: c.color,
        description: c.description,
        sortOrder: c.sortOrder,
      })),
    });
  }

  const cats = await db.promptLibraryCategory.findMany({
    where: { ownerUserId },
    select: { id: true, name: true },
  });
  const categoryIdByName = new Map(cats.map((c) => [c.name, c.id]));

  for (const s of SAMPLE_PROMPTS) {
    const categoryId = categoryIdByName.get(s.categoryName) ?? null;
    await db.$transaction(async (tx) => {
      const p = await tx.promptLibraryPrompt.create({
        data: {
          ownerUserId,
          categoryId,
          title: s.title,
          content: s.content,
          description: s.description,
          tags: s.tags,
          language: s.language,
          modelHint: s.modelHint,
          temperature: s.temperature,
          isFavorite: s.isFavorite,
          usageCount: s.usageCount,
        },
      });
      await tx.promptLibraryVersion.create({
        data: {
          promptId: p.id,
          content: p.content,
          versionNo: 1,
          changeNote: "ข้อมูลตัวอย่างจาก seed (บัญชีทดลอง)",
          createdById: ownerUserId,
        },
      });
    });
  }
}
