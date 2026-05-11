/**
 * หมวด built-in ของระบบรายรับ–รายจ่าย — ใช้เป็น seed source ตอนผู้ใช้เปิดหน้าหมวดครั้งแรก
 * และเป็น fallback บนคลายเอ้นต์ระหว่างรอ API
 *
 * key ต้องเสถียร ห้ามเปลี่ยน — มีโค้ดอ้างอิงโดยตรง (เช่น `src/app/api/home-finance/entries/ingest-slip/route.ts`)
 */
export type HomeFinanceBuiltinCategory = {
  key: string;
  name: string;
  sortOrder: number;
};

export const HOME_FINANCE_BUILTIN_CATEGORIES: readonly HomeFinanceBuiltinCategory[] = [
  { key: "UTILITIES_ELECTRIC", name: "ค่าไฟฟ้า", sortOrder: 10 },
  { key: "UTILITIES_WATER", name: "ค่าน้ำประปา", sortOrder: 20 },
  { key: "VEHICLE_CAR", name: "รถยนต์", sortOrder: 30 },
  { key: "VEHICLE_MOTORCYCLE", name: "รถจักรยานยนต์", sortOrder: 40 },
  { key: "VEHICLE_SERVICE", name: "ซ่อม/เข้าศูนย์รถ", sortOrder: 50 },
  { key: "GENERAL_FOOD", name: "ค่าอาหาร", sortOrder: 60 },
  { key: "GENERAL_HOME_REPAIR", name: "ค่าซ่อมบ้าน", sortOrder: 70 },
  { key: "GENERAL_SHOPPING", name: "ของใช้ในบ้าน", sortOrder: 80 },
  { key: "GENERAL_HEALTH", name: "สุขภาพ/ยา", sortOrder: 90 },
  { key: "GENERAL_EDUCATION", name: "การศึกษา", sortOrder: 100 },
  { key: "GENERAL_TRAVEL", name: "เดินทาง", sortOrder: 110 },
  { key: "GENERAL_INCOME", name: "รายรับทั่วไป", sortOrder: 120 },
  { key: "OTHER", name: "อื่นๆ", sortOrder: 130 },
] as const;

export const HOME_FINANCE_BUILTIN_KEYS = HOME_FINANCE_BUILTIN_CATEGORIES.map((c) => c.key);
