import { SYSTEM_MAP_CATALOG_ROW } from "@/lib/modules/system-map-catalog";

/**
 * คำอธิบายบนการ์ดแดชบอร์ดหลัก — กระชับ 2 บรรทัด (ใช้ \\n) ให้ความสูงเท่ากัน
 * ไม่แทนที่ description ใน DB (หน้าระบบทั้งหมด / แอดมิน ยังใช้ข้อมูลเดิม)
 */
const BY_SLUG: Record<string, string> = {
  attendance:
    "เช็คเข้า-ออก · GPS และหลังบ้าน\nจัดการพนักงานภายใต้เจ้าของ",
  dormitory: "ห้อง · มิเตอร์ · แบ่งบิล\nประวัติชำระ · ตั้งค่า",
  barber: "แพ็กเกจ สมาชิก · เช็คอินเบอร์\nบันทึกประวัติการใช้บริการ",
  massage: "คิวจอง · walk-in · แพ็กเกจ\nรายรับ-รายจ่าย · QR ลูกค้า/พนักงาน",
  "car-wash": "แพ็กเกจบริการ · รับ-ส่งรถ\nติดตามร้องเรียนและบริการ",
  village: "ลูกบ้าน · ค่าส่วนกลาง\nสลิป · รายปี · ส่งออก",
  "mqtt-service": "Credentials · ACL อุปกรณ์ IoT\nสถานะการเชื่อมต่อแบบรวมศูนย์",
  "building-pos": "เมนู ออเดอร์ · ห้องครัว\nสั่งผ่าน QR ที่โต๊ะ",
  "income-expense-basic": "ค่าน้ำไฟ รถ · ซ่อมบ้าน\nรายรับรายจ่ายในครัวเรือน",
  parking: "รับฝากจอดรถ · QR บัตรลูกค้า\nสมาชิก · บัญชีรายรับ–รายจ่าย",
  "wait-queue": "ลงคิว walk-in · เรียกคิวตามลำดับ\nแจ้งเมื่อถึงคิวเข้าร้าน",
  "appointment-queue": "จองเวลาล่วงหน้า · มัดจำสลิป\nบอร์ดคิวลากสถานะ · ลิงก์แปะโซเชียล",
  "school-bank": "บัญชีออมนักเรียน · ฝาก–ถอน\nประวัติรายการและสรุปยอด",
  "community-coop": "สมาชิก · หุ้น · เงินออม\nปันผลจำลองและบันทึกรายการ",
  vault: "คลังรหัสผ่าน · Google · FB\nคัดลอกได้รวดเร็ว เข้ารหัส AES",
  inventory: "คลังหลายสาขา · สต๊อกแบบเรียลไทม์\nรับเข้า เบิกออก โอน + แจ้งของใกล้หมด",
  "stock-management": "รับ-จ่ายสต็อก · จุดสั่งซื้อ\nตรวจนับและรายงานสินค้า",
  "receipt-print": "พิมพ์ใบเสร็จ · เทมเพลต\nเชื่อมกับระบบขายและ POS",
  "analytics-dashboard": "กราฟ KPI · ดูแนวโน้ม\nสรุปยอดและสถิติการใช้งาน",
  "inter-branch-chat": "แชทระหว่างสาขา · กลุ่ม\nแจ้งเตือนใกล้เคียงเรียลไทม์",
  "employee-management": "โปรไฟล์ · ตำแหน่งและกะ\nกำหนดสิทธิ์การเข้าใช้งาน",
  payroll: "คำนวณเงินเดือน · หักลดยอด\nสรุปภาษีและสลิปให้พนักงาน",
  "external-api": "REST / Webhook · คีย์ API\nเชื่อมต่อกับระบบภายนอก",
  "advanced-automation": "กฎอัตโนมัติ · ทริกเกอร์เหตุการณ์\nลดงานซ้ำด้วยสคริปต์และลูป",
};

const FALLBACK = "พร้อมใช้งานทันที\nกดปุ่มเพื่อเข้าระบบ";

export function dashboardModuleCardDescription(slug: string): string {
  return BY_SLUG[slug] ?? FALLBACK;
}

export function dashboardSystemMapCardDescription(): string {
  return SYSTEM_MAP_CATALOG_ROW.description;
}
