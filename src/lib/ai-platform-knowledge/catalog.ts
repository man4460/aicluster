import {
  DAILY_TOKEN_EXEMPT_MODULE_SLUGS,
  MODULE_GROUP_FEATURE_SUMMARY,
  MODULE_GROUP_TIER_NAME,
  QR_LINK_DAILY_ALLOWED_MODULE_SLUGS,
  SHOW_MODULE_MONTHLY_199_CTA,
  UI_HIDDEN_MODULE_SLUGS,
  UI_VISIBLE_MAX_MODULE_GROUP,
  displayAppModuleTitle,
  isDailyTokenExemptModuleSlug,
  isModuleHiddenFromDashboardUi,
  isQrLinkAllowedOnDailyPlan,
} from "@/lib/modules/config";
import { dashboardModuleCardDescription } from "@/lib/modules/dashboard-card-descriptions";
import { dashboardModuleHref } from "@/lib/dashboard-nav";
import {
  LANDING_DAILY_MODULE_SHOWCASE,
  LANDING_FREE_MODULE_SHOWCASE,
} from "@/app/landing/landing-module-showcase-data";

export type MawellModuleKnowledge = {
  slug: string;
  titleTh: string;
  groupId: number;
  billing: "free_daily_exempt" | "daily_token" | "placeholder" | "hidden";
  visibleInCatalog: boolean;
  dashboardPath: string;
  publicPaths: string[];
  blurb: string;
  cardDescription: string;
  capabilities: string[];
  notes?: string;
};

const LANDING_BLURB = new Map(
  [...LANDING_FREE_MODULE_SHOWCASE, ...LANDING_DAILY_MODULE_SHOWCASE].map((m) => [m.slug, m.blurb]),
);

type Seed = {
  slug: string;
  groupId: number;
  publicPaths?: string[];
  capabilities: string[];
  notes?: string;
  /** ถ้าไม่ใส่ ใช้ displayAppModuleTitle + dashboard card */
  billingOverride?: MawellModuleKnowledge["billing"];
};

const MODULE_SEEDS: Seed[] = [
  {
    slug: "general-store-pos",
    groupId: 1,
    capabilities: ["หมวดสินค้า", "บันทึกขายแบบง่าย", "ไม่หักโทเคนรายวัน"],
  },
  {
    slug: "wait-queue",
    groupId: 1,
    capabilities: ["ลงคิว walk-in", "เรียกลูกค้าตามลำดับ", "ประกาศเสียง (ถ้าตั้ง TTS)"],
  },
  {
    slug: "appointment-queue",
    groupId: 1,
    publicPaths: ["/appointment-queue/[ownerId]"],
    capabilities: ["จองเวลาล่วงหน้า", "มัดจำ/สลิป", "บอร์ดสถานะคิว", "ลิงก์แปะโซเชียล"],
  },
  {
    slug: "loyalty-stamp",
    groupId: 1,
    publicPaths: ["/loyalty-stamp/[ownerId]"],
    capabilities: ["บัตรสะสมแต้มดิจิทัล", "QR ลูกค้า", "ร้านกดเพิ่มแต้ม"],
  },
  {
    slug: "school-bank",
    groupId: 1,
    capabilities: ["บัญชีออมนักเรียน", "ฝาก–ถอน", "ประวัติและสรุปยอด"],
  },
  {
    slug: "community-coop",
    groupId: 1,
    capabilities: ["สมาชิก", "หุ้น", "เงินออม", "ปันผลจำลอง"],
  },
  {
    slug: "prompt-library",
    groupId: 1,
    capabilities: ["คลัง Prompt", "หมวด/เวอร์ชัน", "นำเข้า–ส่งออก"],
  },
  {
    slug: "vault",
    groupId: 1,
    capabilities: ["เก็บรหัสผ่านบริการ", "เข้ารหัส AES", "คัดลอกเร็ว"],
  },
  {
    slug: "attendance",
    groupId: 1,
    publicPaths: ["/check-in/[ownerId]", "/check-in/[ownerId]/face"],
    capabilities: ["เช็คอินพนักงาน/กิจกรรม", "GPS", "face (ถ้าเปิด)", "QR / roster"],
  },
  {
    slug: "income-expense-basic",
    groupId: 1,
    capabilities: [
      "รายรับ–รายจ่ายส่วนตัว/ครัวเรือน",
      "หมวด · สาธารณูปโภค · ยานพาหนะ",
      "สลิป + คู่ Chat AI OCR",
    ],
    notes: "หน้าแดชบอร์ดจริงมักเป็น /dashboard/home-finance",
  },
  {
    slug: "dormitory",
    groupId: 1,
    publicPaths: ["/dorm/[ownerId]", "/pay/dorm/[token]"],
    capabilities: ["ห้อง · ผู้เช่า", "มิเตอร์", "แบ่งบิล", "สลิป/ใบเสร็จ", "พอร์ทัลแขก"],
  },
  {
    slug: "village",
    groupId: 1,
    publicPaths: ["/village/[ownerId]", "/pay/village/[token]"],
    capabilities: ["ลูกบ้าน", "ค่าส่วนกลาง", "สลิป", "รายงาน/ส่งออก"],
  },
  {
    slug: "barber",
    groupId: 1,
    publicPaths: ["/barber/[ownerId]"],
    capabilities: ["จองคิว", "แพ็กสมาชิก", "หักแพ็ก+ลายเซ็น", "การเงิน", "QR พนักงาน/ลูกค้า"],
  },
  {
    slug: "car-wash",
    groupId: 1,
    publicPaths: ["/car-wash/[ownerId]"],
    capabilities: ["ลานล้าง", "แพ็ก/สมาชิก", "จอง · รับ–ส่งรถ", "staff lane", "แม่แบบ UX ดั้งเดิม"],
  },
  {
    slug: "football-turf",
    groupId: 1,
    publicPaths: ["/football-turf/book/[ownerId]", "/football-turf/check-in/[ownerId]"],
    capabilities: ["จองสนาม", "ตาราง", "walk-in", "โปร/ลูกค้า", "การเงิน · QR"],
  },
  {
    slug: "massage",
    groupId: 1,
    publicPaths: ["/massage/[ownerId]"],
    capabilities: ["จองคิว", "นักบำบัด", "แพ็ก", "walk-in", "การเงิน · QR"],
  },
  {
    slug: "laundry",
    groupId: 1,
    publicPaths: ["/laundry/[ownerId]", "/laundry/pickup/[ownerId]"],
    capabilities: [
      "ออเดอร์รับ–ส่งผ้า",
      "แพ็กสมาชิก + ลายเซ็นหักแพ็ก",
      "การเงิน · พิมพ์ใบเสร็จ/ใบกำกับ",
      "พอร์ทัลลูกค้า (แม่แบบ UX ล่าสุด)",
    ],
  },
  {
    slug: "parking",
    groupId: 1,
    publicPaths: ["/parking/[ownerId]"],
    capabilities: ["ลานจอด", "บัตร/QR", "สมาชิก", "จอง/เช็คอิน", "การเงิน"],
  },
  {
    slug: "building-pos",
    groupId: 1,
    publicPaths: ["/building-pos/[ownerId]"],
    capabilities: ["เมนู · ออเดอร์ QR โต๊ะ", "ครัว · เสิร์ฟ", "loyalty", "พิมพ์"],
  },
  {
    slug: "drink-pos",
    groupId: 1,
    publicPaths: ["/drink-pos/[ownerId]"],
    capabilities: ["POS เครื่องดื่ม", "สะสมแต้ม", "ครัว", "การเงิน"],
  },
  {
    slug: "hotel-resort",
    groupId: 1,
    publicPaths: ["/hotel-resort/[ownerId]"],
    capabilities: ["ผังห้อง", "จอง · เช็คอิน", "มัดจำ/ชำระ (สด·พร้อมเพย์·โอน)", "พอร์ทัลแขก"],
  },
  {
    slug: "ecommerce-store",
    groupId: 1,
    publicPaths: ["/shop/[storeId]"],
    capabilities: ["แคตตาล็อกสินค้า", "ตะกร้า · checkout", "สลิป PromptPay", "สต๊อก · ออเดอร์"],
  },
  {
    slug: "used-car-showroom",
    groupId: 1,
    publicPaths: ["/car/[slug]", "/car/[slug]/v/[vehicleId]"],
    capabilities: ["สต็อกรถ", "จอง", "ไฟแนนซ์", "P&L", "โชว์รูมออนไลน์"],
  },
  {
    slug: "club-event",
    groupId: 1,
    publicPaths: ["/club/[slug]"],
    capabilities: ["กิจกรรม", "สมาชิก · ค่าบำรุง", "ลิงก์ฟอร์ม", "แกลเลอรี/YouTube"],
  },
  {
    slug: "lms",
    groupId: 1,
    publicPaths: ["/lms/[slug]"],
    capabilities: ["คอร์สออนไลน์", "บทเรียน YouTube", "ข้อสอบ", "ใบรับรอง", "โควตานักเรียน"],
    notes: "อนุญาต QR/ลิงก์สาธารณะบนสายรายวัน (ยกเว้นพิเศษ)",
  },
  {
    slug: "educare",
    groupId: 1,
    capabilities: ["เช็คชื่อนักเรียน", "ห้องเรียน", "รายงาน"],
  },
  {
    slug: "asset",
    groupId: 1,
    capabilities: ["ทะเบียนทรัพย์สิน", "ตรวจนับ", "โอน/ยืม", "ซ่อม", "จำหน่าย · รายงาน"],
  },
  {
    slug: "doc-transmission",
    groupId: 1,
    publicPaths: ["/share/doc-transmission/[token]"],
    capabilities: ["ส่ง–รับหนังสือ", "workflow", "PDF revision", "แชร์ลิงก์"],
  },
  {
    slug: "media-registry",
    groupId: 1,
    capabilities: ["ยืม–คืนสื่อ/อุปกรณ์", "ชำรุด/ซ่อม"],
  },
  {
    slug: "inventory",
    groupId: 1,
    capabilities: ["หลายคลัง", "รับเข้า/เบิก/โอน", "แจ้งของใกล้หมด"],
  },
  {
    slug: "pro-resume",
    groupId: 1,
    publicPaths: ["/resume/[slug]"],
    capabilities: ["เรซูเม่", "พอร์ตโฟลิโอ", "เว็บสาธารณะ"],
  },
  {
    slug: "smart-guard-tour",
    groupId: 1,
    publicPaths: ["/guard/[slug]"],
    capabilities: [
      "จุดตรวจ · จุดรักษาการณ์",
      "จัดเวร/กะ · สายตรวจ",
      "เหตุการณ์ · พนักงาน รปภ.",
      "การเงินไซต์ · เชื่อมระบบ",
    ],
    notes: "ชื่อแสดง: ธุรกิจ รปภ. — ลิงก์ /guard/[slug] อยู่ในตั้งค่า; ตรวจความพร้อมหน้า public ตามเวอร์ชัน",
  },
  {
    slug: "mqtt-service",
    groupId: 1,
    capabilities: ["MQTT credentials", "ACL อุปกรณ์ IoT"],
    notes: "ซ่อนจากแคตตาล็อกเมื่อ MQTT_SERVICE_ENABLED ไม่เปิด",
  },
  {
    slug: "smart-police",
    groupId: 2,
    billingOverride: "hidden",
    capabilities: ["สำนวนคดี", "แม่แบบ", "พิมพ์เอกสาร"],
    notes: "ซ่อนจาก UI ลูกค้าทั่วไป (UI_HIDDEN_MODULE_SLUGS)",
  },
  {
    slug: "stock-management",
    groupId: 2,
    billingOverride: "placeholder",
    capabilities: ["แผนสต็อก (placeholder)"],
    notes: "ยังไม่ใช่ระบบเต็ม — ใช้ inventory ในกลุ่ม 1",
  },
  {
    slug: "receipt-print",
    groupId: 2,
    billingOverride: "placeholder",
    capabilities: ["แผนพิมพ์ใบเสร็จแยก (placeholder)"],
    notes: "พิมพ์ฝังในโมดูลขายแล้ว",
  },
  {
    slug: "analytics-dashboard",
    groupId: 3,
    billingOverride: "placeholder",
    capabilities: ["แผนวิเคราะห์ (placeholder)"],
  },
  {
    slug: "inter-branch-chat",
    groupId: 3,
    billingOverride: "placeholder",
    capabilities: ["แผนแชทสาขา (placeholder)"],
  },
  {
    slug: "employee-management",
    groupId: 4,
    billingOverride: "placeholder",
    capabilities: ["แผน HR (placeholder)"],
  },
  {
    slug: "payroll",
    groupId: 4,
    billingOverride: "placeholder",
    capabilities: ["แผนเงินเดือน (placeholder)"],
  },
  {
    slug: "external-api",
    groupId: 5,
    billingOverride: "placeholder",
    capabilities: ["แผน API ภายนอก (placeholder)"],
  },
  {
    slug: "advanced-automation",
    groupId: 5,
    billingOverride: "placeholder",
    capabilities: ["แผน automation (placeholder)"],
  },
];

function resolveBilling(seed: Seed): MawellModuleKnowledge["billing"] {
  if (seed.billingOverride) return seed.billingOverride;
  if (isModuleHiddenFromDashboardUi(seed.slug)) return "hidden";
  if (isDailyTokenExemptModuleSlug(seed.slug)) return "free_daily_exempt";
  if (seed.groupId > UI_VISIBLE_MAX_MODULE_GROUP) return "placeholder";
  return "daily_token";
}

function buildModule(seed: Seed): MawellModuleKnowledge {
  const titleTh = displayAppModuleTitle(seed.slug, seed.slug);
  const billing = resolveBilling(seed);
  const visibleInCatalog =
    !isModuleHiddenFromDashboardUi(seed.slug) &&
    seed.groupId <= UI_VISIBLE_MAX_MODULE_GROUP &&
    billing !== "placeholder" &&
    billing !== "hidden";

  return {
    slug: seed.slug,
    titleTh,
    groupId: seed.groupId,
    billing,
    visibleInCatalog,
    dashboardPath: dashboardModuleHref(seed.slug),
    publicPaths: seed.publicPaths ?? [],
    blurb: LANDING_BLURB.get(seed.slug) ?? dashboardModuleCardDescription(seed.slug).split("\n")[0]!,
    cardDescription: dashboardModuleCardDescription(seed.slug),
    capabilities: seed.capabilities,
    notes: seed.notes,
  };
}

const MODULES: MawellModuleKnowledge[] = MODULE_SEEDS.map(buildModule);
const BY_SLUG = new Map(MODULES.map((m) => [m.slug, m]));

export function getPlatformOverview() {
  return {
    brand: "MAWELL",
    legalNameTh: "ห้างหุ้นส่วนจำกัด มาเวล",
    taglineTh:
      "แพลตฟอร์มเดียวครบระบบหลังบ้าน องค์กร ธุรกิจ โรงเรียน — โมดูลฟรีหลายระบบ และสายรายวัน 1 บาทต่อวันต่อระบบ",
    productType: "Thai business SaaS — multi-module dashboard",
    primaryUrlHint: "https://app.ma-well.com",
    techStack: {
      app: "Next.js App Router · React · TypeScript · Tailwind",
      db: "MySQL · Prisma",
      auth: "Session cookie · Google OAuth optional",
      aiInApp: "Chat AI at /dashboard/chat-ai (Ollama / OpenClaw)",
    },
    billing: {
      model: "token_daily_line",
      dailyDeductionTh:
        "หักประมาณ 1 โทเคนต่อโมดูลต่อวันปฏิทิน Asia/Bangkok เมื่อเข้าใช้โมดูลที่ต้องจ่าย",
      freeDailyExemptSlugs: [...DAILY_TOKEN_EXEMPT_MODULE_SLUGS],
      qrAllowedOnDailyExtraSlugs: [...QR_LINK_DAILY_ALLOWED_MODULE_SLUGS],
      monthly199CtaEnabled: SHOW_MODULE_MONTHLY_199_CTA,
      visibleMaxGroupId: UI_VISIBLE_MAX_MODULE_GROUP,
      hiddenSlugs: [...UI_HIDDEN_MODULE_SLUGS],
      groupTierNames: MODULE_GROUP_TIER_NAME,
      groupFeatureSummary: MODULE_GROUP_FEATURE_SUMMARY,
    },
    actors: [
      { id: "owner", labelTh: "เจ้าของร้าน/องค์กร (UserRole.USER)", notes: "ข้อมูลผูก ownerUserId" },
      { id: "admin", labelTh: "แอดมินแพลตฟอร์ม (UserRole.ADMIN)", notes: "/dashboard/admin" },
      {
        id: "staff",
        labelTh: "พนักงาน",
        notes: "ไม่ใช่ UserRole แยก — เข้าผ่าน PIN/QR/staff kiosk ของแต่ละโมดูล",
      },
      { id: "public_customer", labelTh: "ลูกค้าสาธารณะ", notes: "พอร์ทัลไม่ล็อกอิน" },
    ],
    crossCutting: [
      "Asia/Bangkok timezone helpers (@/lib/time/bangkok)",
      "Module mobile dock · header collapse · wide page gutter",
      "Shop settings tabs: basic · finance · portal · hours · link/QR",
      "app-templates: images, charts, print, upload, signature, payments",
      "Package sale print rule: tax invoice XOR receipt on auto-print",
      "Trial sandbox via trialSessionId (prod vs demo)",
      "Public try pages /try/[moduleSlug]",
    ],
    moduleCounts: {
      totalInKnowledge: MODULES.length,
      visibleInCatalog: MODULES.filter((m) => m.visibleInCatalog).length,
      freeDailyExempt: MODULES.filter((m) => m.billing === "free_daily_exempt").length,
      dailyToken: MODULES.filter((m) => m.billing === "daily_token").length,
      placeholderOrHidden: MODULES.filter(
        (m) => m.billing === "placeholder" || m.billing === "hidden",
      ).length,
    },
    docs: {
      briefMarkdownPath: "docs/MAWELL-PLATFORM-BRIEF.md",
      geminiToolsPath: "docs/MAWELL-GEMINI-TOOLS.md",
    },
  };
}

export type ListModulesQuery = {
  freeOnly?: boolean;
  visibleOnly?: boolean;
  dailyOnly?: boolean;
  q?: string;
  groupId?: number;
};

export function listModules(query: ListModulesQuery = {}): MawellModuleKnowledge[] {
  let rows = [...MODULES];
  if (query.visibleOnly) rows = rows.filter((m) => m.visibleInCatalog);
  if (query.freeOnly) rows = rows.filter((m) => m.billing === "free_daily_exempt");
  if (query.dailyOnly) rows = rows.filter((m) => m.billing === "daily_token");
  if (query.groupId != null) rows = rows.filter((m) => m.groupId === query.groupId);
  if (query.q?.trim()) {
    const q = query.q.trim().toLowerCase();
    rows = rows.filter(
      (m) =>
        m.slug.includes(q) ||
        m.titleTh.toLowerCase().includes(q) ||
        m.blurb.toLowerCase().includes(q) ||
        m.capabilities.some((c) => c.toLowerCase().includes(q)),
    );
  }
  return rows;
}

export function getModuleDetail(slug: string) {
  const base = BY_SLUG.get(slug.trim().toLowerCase());
  if (!base) return null;
  return {
    ...base,
    qrAllowedOnDailyPlan: isQrLinkAllowedOnDailyPlan(base.slug),
    dailyTokenExempt: isDailyTokenExemptModuleSlug(base.slug),
    uiHidden: isModuleHiddenFromDashboardUi(base.slug),
    groupTierName: MODULE_GROUP_TIER_NAME[base.groupId] ?? `Group ${base.groupId}`,
  };
}
