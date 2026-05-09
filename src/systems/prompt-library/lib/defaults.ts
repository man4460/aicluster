import { prisma } from "@/lib/prisma";

/** ชุดหมวดเริ่มต้น — เทียบกับ `CONFIG.DEFAULTS.CATEGORIES` ใน Google Script pms/config.gs */
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

export async function ensureDefaultPromptCategories(ownerUserId: string): Promise<void> {
  const n = await prisma.promptLibraryCategory.count({ where: { ownerUserId } });
  if (n > 0) return;
  await prisma.promptLibraryCategory.createMany({
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
