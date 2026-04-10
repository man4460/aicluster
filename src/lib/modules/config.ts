import type { SubscriptionTier, SubscriptionType, UserRole } from "@/generated/prisma/enums";

/** จำนวนกลุ่มโมดูลทั้งระบบ — ขยาย logic ใน access/config ให้สอดคล้อง */
export const MAX_MODULE_GROUP = 5 as const;

/**
 * กลุ่มโมดูลสูงสุดที่เปิดใช้งาน/แสดงในแดชบอร์ดและแคตตาล็อก (ไม่นับแอดมิน)
 * — กลุ่มอื่นปิดชั่วคราวจนกว่าจะปรับค่านี้
 */
export const UI_VISIBLE_MAX_MODULE_GROUP = 1 as const;

/** แพ็กเหมาที่เปิดให้สมัครใหม่ได้ — ตอนนี้เฉพาะ 199 (กลุ่ม 1) */
export const BUFFET_TIERS_OPEN_FOR_PURCHASE: ReadonlySet<SubscriptionTier> = new Set(["TIER_199"]);

export function isBuffetTierOpenForPurchase(tier: SubscriptionTier): boolean {
  return tier !== "NONE" && BUFFET_TIERS_OPEN_FOR_PURCHASE.has(tier);
}

/** กรองโมดูลในแคตตาล็อก/แดชบอร์ด — แอดมินเห็นทุกกลุ่ม */
export function filterAppModulesForDashboardUi<T extends { groupId: number }>(
  modules: T[],
  role: UserRole,
): T[] {
  if (role === "ADMIN") return modules;
  return modules.filter((m) => m.groupId <= UI_VISIBLE_MAX_MODULE_GROUP);
}

/**
 * สายรายวันเคยจำกัดเฉพาะเช็คอิน — ปัจจุบันใช้ `canAccessAppModule`: กลุ่ม 1 ทั้งหมดเมื่อมีโทเคน
 * (ค่านี้ยัง export ไว้สำหรับอ้างอิง/สคริปต์เก่า)
 */
export const DAILY_ALLOWED_MODULE_SLUG = "attendance" as const;

/** กลุ่ม 1 (Basic): สายรายวันหัก 1 โทเคน/วัน Bangkok เมื่อเข้าใช้ (ดู applyDormitoryModuleTokenDeduction) */
export const DORMITORY_MODULE_SLUG = "dormitory" as const;
export const DORMITORY_MODULE_GROUP_ID = 1 as const;

/** เช็คอินอัจฉริยะ — slug ตรง module_list */
export const ATTENDANCE_MODULE_SLUG = "attendance" as const;
export const ATTENDANCE_MODULE_GROUP_ID = 1 as const;

export const BARBER_MODULE_SLUG = "barber" as const;
export const BARBER_MODULE_GROUP_ID = 1 as const;
export const HOME_FINANCE_BASIC_MODULE_SLUG = "income-expense-basic" as const;
export const HOME_FINANCE_BASIC_MODULE_GROUP_ID = 1 as const;
export const CAR_WASH_MODULE_SLUG = "car-wash" as const;
export const CAR_WASH_MODULE_GROUP_ID = 1 as const;
export const MQTT_SERVICE_MODULE_SLUG = "mqtt-service" as const;
export const MQTT_SERVICE_MODULE_GROUP_ID = 1 as const;
export const BUILDING_POS_MODULE_SLUG = "building-pos" as const;
export const BUILDING_POS_MODULE_GROUP_ID = 1 as const;
export const VILLAGE_MODULE_SLUG = "village" as const;
export const VILLAGE_MODULE_GROUP_ID = 1 as const;

/** ระบบเช่าที่จอดรถ — กลุ่ม 1 (Basic) ลูกค้าเลือก Subscribe/ทดลองจากแคตตาล็อกโมดูล */
export const PARKING_MODULE_SLUG = "parking" as const;
export const PARKING_MODULE_GROUP_ID = 1 as const;

/** ชื่อแสดงในการ์ด/เมนู — ให้ตรงกันทุกที่แม้ DB เก่าจะยังเป็นชื่อสั้น */
export function displayAppModuleTitle(slug: string, title: string): string {
  if (slug === ATTENDANCE_MODULE_SLUG) return "เช็คอินอัจฉริยะ";
  if (slug === HOME_FINANCE_BASIC_MODULE_SLUG) return "รายรับ–รายจ่าย";
  if (slug === BARBER_MODULE_SLUG) return "ร้านตัดผม";
  if (slug === CAR_WASH_MODULE_SLUG) return "คาร์แคร์";
  if (slug === MQTT_SERVICE_MODULE_SLUG) return "ระบบบริการ MQTT";
  if (slug === BUILDING_POS_MODULE_SLUG) return "POS ร้านอาหาร";
  if (slug === DORMITORY_MODULE_SLUG) return "จัดการหอพัก";
  if (slug === VILLAGE_MODULE_SLUG) return "จัดการหมู่บ้าน";
  if (slug === PARKING_MODULE_SLUG) return "ระบบเช่าที่จอดรถ";
  return title;
}

/**
 * แมปกลุ่มโมดูล (module_list.group_id) กับชื่อระดับแพ็กเกจ
 * — sync กับข้อมูล seed / ที่ตั้งค่าใน DB
 */
export const MODULE_GROUP_TIER_NAME: Record<number, string> = {
  1: "Basic",
  2: "Silver",
  3: "Gold",
  4: "Platinum",
  5: "Ultimate",
};

/** สรุปฟีเจอร์ต่อกลุ่ม (ใช้ในหน้าแพ็กเกจ / คำอธิบาย) — ข้อความกระชับ */
export const MODULE_GROUP_FEATURE_SUMMARY: Record<number, string> = {
  1: "กลุ่ม 1: เช็คอิน · หอพัก · รายรับ–รายจ่าย · หมู่บ้าน · ตัดผม · คาร์แคร์ · จอดรถ · POS",
  2: "สต็อก · ใบเสร็จ",
  3: "วิเคราะห์ · แชทสาขา",
  4: "พนักงาน · เงินเดือน",
  5: "API ภายนอก · Automation",
};

/** ข้อความการ์ด «สายรายวัน» ในหน้าแพ็กเกจ */
export const DAILY_LINE_PLAN_SUMMARY = {
  title: "สายรายวัน",
  subtitle: "ไม่สมัครแพ็กเหมา — ใช้เมื่อมีโทเคน",
  lines: [
    "เปิดระบบกลุ่ม 1 ได้เมื่อมียอดโทเคน (โทเคนหมดใช้ไม่ได้)",
    "เหมาะกับใช้ไม่ถี่หรือทดลองระบบพื้นฐาน",
  ],
} as const;

export function moduleGroupLine(groupId: number): string {
  const tier = MODULE_GROUP_TIER_NAME[groupId];
  const feat = MODULE_GROUP_FEATURE_SUMMARY[groupId];
  if (tier && feat) return `กลุ่ม ${groupId} (${tier}): ${feat}`;
  return `กลุ่ม ${groupId}`;
}

export const PLAN_PRICES = [199, 299, 399, 499, 599] as const;
export type PlanPrice = (typeof PLAN_PRICES)[number];

export const PRICE_TO_TIER: Record<PlanPrice, SubscriptionTier> = {
  199: "TIER_199",
  299: "TIER_299",
  399: "TIER_399",
  499: "TIER_499",
  599: "TIER_599",
};

/** ราคาแพ็กเหมาเป็นหน่วยโทเคน (สมัครใหม่ = หักเต็มจำนวน) */
export const TIER_SUBSCRIPTION_TOKEN_COST: Record<SubscriptionTier, number> = {
  NONE: 0,
  TIER_199: 199,
  TIER_299: 299,
  TIER_399: 399,
  TIER_499: 499,
  TIER_599: 599,
};

/** โทเคนที่หักทุกเดือน (BUFFET) — เรตเดียวกับมูลค่าแพ็กเป็นหน่วยโทเคน */
export function tierMonthlyBuffetTokenCost(tier: SubscriptionTier): number {
  return TIER_SUBSCRIPTION_TOKEN_COST[tier];
}

const BUFFET_TARGET_TIERS: SubscriptionTier[] = [
  "TIER_199",
  "TIER_299",
  "TIER_399",
  "TIER_499",
  "TIER_599",
];

export type BuffetSubscriptionChargeResult =
  | { ok: true; tokensToDeduct: number; targetTier: SubscriptionTier }
  | { ok: false; error: string };

/**
 * คำนวณโทเคนที่จะหักเมื่อสมัคร/อัปเกรดแพ็กเหมา
 * - สายรายวันหรือยังไม่มีเหมา → หักราคาเต็มของแพ็กปลายทาง
 * - มีเหมาอยู่แล้ว → อัปเกรดหักเฉพาะส่วนต่าง (ราคาใหม่ − ราคาแพ็กปัจจุบัน)
 */
export function computeBuffetSubscriptionTokenCharge(input: {
  targetTier: SubscriptionTier;
  currentTier: SubscriptionTier;
  subscriptionType: SubscriptionType;
}): BuffetSubscriptionChargeResult {
  const { targetTier, currentTier, subscriptionType } = input;
  if (!BUFFET_TARGET_TIERS.includes(targetTier)) {
    return { ok: false, error: "แพ็กไม่ถูกต้อง" };
  }

  if (!isBuffetTierOpenForPurchase(targetTier)) {
    return {
      ok: false,
      error: "แพ็กราคานี้ปิดจำหน่ายชั่วคราว — เปิดเฉพาะแพ็กเหมา 199 โทเคน (กลุ่ม 1)",
    };
  }

  const isBuffetActive = subscriptionType === "BUFFET" && currentTier !== "NONE";

  if (isBuffetActive) {
    const curRank = buffetTierMaxGroup(currentTier);
    const tarRank = buffetTierMaxGroup(targetTier);
    if (tarRank <= curRank) {
      return {
        ok: false,
        error: "คุณใช้แพ็กนี้หรือสูงกว่าแล้ว — เลือกแพ็กที่สูงขึ้นเพื่ออัปเกรด (หักเฉพาะส่วนต่าง)",
      };
    }
    const fullNew = TIER_SUBSCRIPTION_TOKEN_COST[targetTier];
    const fullCur = TIER_SUBSCRIPTION_TOKEN_COST[currentTier];
    return { ok: true, tokensToDeduct: fullNew - fullCur, targetTier };
  }

  return {
    ok: true,
    tokensToDeduct: TIER_SUBSCRIPTION_TOKEN_COST[targetTier],
    targetTier,
  };
}

/**
 * แพ็กเหมา: สูงสุดถึงกลุ่มไหน (199→1, 299→2, …, 599→5)
 * NONE → 0 (ไม่ควรใช้คู่ BUFFET)
 */
export function buffetTierMaxGroup(tier: SubscriptionTier): number {
  switch (tier) {
    case "TIER_199":
      return 1;
    case "TIER_299":
      return 2;
    case "TIER_399":
      return 3;
    case "TIER_499":
      return 4;
    case "TIER_599":
      return 5;
    case "NONE":
    default:
      return 0;
  }
}

export function tierGroupLabel(tier: SubscriptionTier): string {
  if (tier === "NONE") return "ยังไม่สมัครแพ็กเกจเหมา";
  const n = buffetTierMaxGroup(tier);
  if (n <= 0) return "—";
  const name = MODULE_GROUP_TIER_NAME[n];
  if (n > UI_VISIBLE_MAX_MODULE_GROUP) {
    const tierName = name ?? `ระดับ ${n}`;
    return `แพ็ก ${tierName} — ขณะนี้ใช้งานได้เฉพาะกลุ่ม 1`;
  }
  if (n === 1 && name) return `รายเดือน 199 · กลุ่ม 1 (${name})`;
  if (name) return `เข้าถึงกลุ่ม 1–${n} (${name})`;
  return `เข้าถึงกลุ่มโมดูล 1–${n}`;
}

export function tierGroupBullets(tier: SubscriptionTier): string[] {
  if (tier === "NONE") {
    return [...DAILY_LINE_PLAN_SUMMARY.lines, MODULE_GROUP_FEATURE_SUMMARY[1] ?? moduleGroupLine(1)];
  }
  const n = buffetTierMaxGroup(tier);
  const lines: string[] = [
    "แพ็กเหมารายเดือน: หักโทเคนตามแพ็กทุกเดือน (เวลาไทย) — โทเคนไม่พอให้เติม",
  ];
  const shown = Math.min(n, UI_VISIBLE_MAX_MODULE_GROUP);
  for (let g = 1; g <= shown; g++) {
    lines.push(MODULE_GROUP_FEATURE_SUMMARY[g] ?? moduleGroupLine(g));
  }
  if (n > UI_VISIBLE_MAX_MODULE_GROUP) {
    lines.push("กลุ่มโมดูลสูงกว่านี้ปิดชั่วคราว — จะเปิดภายหลัง");
  }
  return lines;
}
