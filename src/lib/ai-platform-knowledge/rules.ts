export type PlatformRuleTopic =
  | "billing"
  | "timezone"
  | "qr"
  | "roles"
  | "ux"
  | "print"
  | "security"
  | "all";

const RULES: Record<Exclude<PlatformRuleTopic, "all">, { titleTh: string; points: string[] }> = {
  billing: {
    titleTh: "โทเคน · สายรายวัน · แพ็ก",
    points: [
      "เข้าใช้โมดูลที่ต้องจ่าย → หักประมาณ 1 โทเคน/โมดูล/วันปฏิทิน Asia/Bangkok",
      "โมดูลฟรี (ไม่หักรายวัน): wait-queue, appointment-queue, loyalty-stamp, school-bank, community-coop, prompt-library, vault, general-store-pos",
      "ยอดติดลบได้ — ติดลบแรงจะล็อกจนกว่าเติมจนไม่ติดลบ",
      "CTA แพ็กเหมา 199/เดือนบน UI ปิดชั่วคราว (SHOW_MODULE_MONTHLY_199_CTA=false)",
      "แคตตาล็อกลูกค้าเห็นกลุ่ม 1 เป็นหลัก (UI_VISIBLE_MAX_MODULE_GROUP=1)",
    ],
  },
  timezone: {
    titleTh: "เวลาไทย",
    points: [
      "ธุรกิจไทยต้องใช้ Asia/Bangkok",
      "ใช้ helper @/lib/time/bangkok: bangkokDateKey, bangkokNowMinutes, isBangkokWeekend",
      "ห้ามใช้ toISOString().slice(0,10) เป็น «วันนี้» ของธุรกิจ",
      "ฟอร์มเวลา 24 ชม. ใช้ AppTime24Input — ห้าม input type=time ที่โชว์ AM/PM ตาม OS",
    ],
  },
  qr: {
    titleTh: "ลิงก์ / QR สาธารณะ",
    points: [
      "โมดูลสายรายวันส่วนใหญ่จำกัด QR/ลิงก์สาธารณะ (กันคัดลอกลิงก์แล้วดาวน์เกรด)",
      "อนุญาตบนสายรายวัน: โมดูลฟรีทั้งหมด + lms",
      "Hub QR อยู่แท็บตั้งค่า «ลิงก์» — การ์ดคู่เว็บลูกค้า + พนักงาน ห่อเกตครั้งเดียว",
      "ห้ามยัดปุ่มคัดลอกลิงก์/QR ลงแท็บตั้งค่าเว็บไซต์",
    ],
  },
  roles: {
    titleTh: "บทบาท",
    points: [
      "USER = เจ้าของร้าน/องค์กร (ownerUserId)",
      "ADMIN = ศูนย์แอดมินแพลตฟอร์ม",
      "พนักงาน ≠ UserRole — เข้าผ่าน PIN/QR/staff kiosk ของโมดูล",
      "ลูกค้าสาธารณะใช้พอร์ทัลโดยไม่ล็อกอิน",
      "trialSessionId: prod = ของจริง · ค่าอื่น = sandbox ทดลอง",
    ],
  },
  ux: {
    titleTh: "UX / โครงโมดูล",
    points: [
      "แม่แบบล่าสุด: รับฝากซักผ้า · baseline ดั้งเดิม: คาร์แคร์",
      "มือถือ = โทรศัพท์ + ไอแพดแนวตั้ง · dock ล่างโมดูล",
      "รายการที่กรองได้ต้องมีปุ่มแสดง/ซ่อนกรองทุก breakpoint",
      "สถิติการ์ดมือถือใช้ grid-cols-2",
      "ห้ามใส่ MawellLogo ซ้ำใน chrome โมดูลย่อย",
      "UI รูป/กราฟ/พิมพ์/อัปโหลด → ใช้ @/components/app-templates ก่อนสร้างใหม่",
    ],
  },
  print: {
    titleTh: "พิมพ์ใบเสร็จ / ใบกำกับ",
    points: [
      "ขายแพ็ก: ติ๊กใบกำกับ → พิมพ์ใบกำกับอย่างเดียว · ไม่ติ๊ก → พิมพ์ใบเสร็จอย่างเดียว",
      "ห้ามพิมพ์ใบเสร็จคู่ใบกำกับตอนขายอัตโนมัติ",
      "พิมพ์ย้อนหลังเลือกใบเสร็จและ/หรือใบกำกับได้",
      "ใช้ print helpers จาก app-templates + ขนาดกระดาษต่อร้าน",
    ],
  },
  security: {
    titleTh: "ขอบเขต Knowledge API",
    points: [
      "API นี้เป็นแคตตาล็อก/วิธีใช้ — อ่านอย่างเดียว",
      "ไม่เปิดข้อมูลลูกค้าจริง · สลิป · การเงินร้าน · session ผู้ใช้",
      "ต้องมี MAWELL_AI_KNOWLEDGE_API_KEY",
      "อย่าให้ Gemini ยิง API ธุรกิจของร้านโดยไม่มี auth แยก",
    ],
  },
};

export function getPlatformRules(topic: PlatformRuleTopic = "all") {
  if (topic === "all") {
    return {
      topic: "all" as const,
      sections: Object.entries(RULES).map(([id, section]) => ({ id, ...section })),
    };
  }
  const section = RULES[topic];
  return { topic, ...section };
}

export function parseRuleTopic(raw: string | null | undefined): PlatformRuleTopic {
  const v = (raw ?? "all").trim().toLowerCase();
  if (
    v === "billing" ||
    v === "timezone" ||
    v === "qr" ||
    v === "roles" ||
    v === "ux" ||
    v === "print" ||
    v === "security" ||
    v === "all"
  ) {
    return v;
  }
  return "all";
}
