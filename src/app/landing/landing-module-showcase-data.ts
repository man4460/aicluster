/** รูปปกการ์ดโมดูลบน landing — เฉพาะโมดูลที่แคตตาล็อกแดชบอร์ดแสดง (กลุ่ม 1) ไม่รวมระบบที่ซ่อนตามฟีเจอร์ (เช่น MQTT ปิดค่าเริ่มต้น) */
export type LandingModuleShowcaseItem = {
  slug: string;
  blurb: string;
  coverSrc: string;
};

export const LANDING_FREE_MODULE_SHOWCASE: LandingModuleShowcaseItem[] = [
  {
    slug: "general-store-pos",
    blurb: "การ์ดสินค้า บันทึกขาย ไม่หักโทเคนรายวัน",
    coverSrc:
      "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=900&q=78",
  },
  {
    slug: "wait-queue",
    blurb: "จัดคิวหน้าร้าน เรียกลูกค้าเข้าบริการ",
    coverSrc:
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=900&q=78",
  },
  {
    slug: "appointment-queue",
    blurb: "จองเวลาล่วงหน้า มัดจำ บอร์ดคิว",
    coverSrc:
      "https://images.unsplash.com/photo-1506784365847-bbad939e9335?auto=format&fit=crop&w=900&q=78",
  },
  {
    slug: "loyalty-stamp",
    blurb: "บัตรสะสมแต้มดิจิทัล ร้านกาแฟ/อาหาร",
    coverSrc:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=78",
  },
  {
    slug: "school-bank",
    blurb: "บัญชีออม ฝาก–ถอน โรงเรียน",
    coverSrc:
      "https://images.unsplash.com/photo-1543286386-713bdd548da4?auto=format&fit=crop&w=900&q=78",
  },
  {
    slug: "community-coop",
    blurb: "สมาชิก หุ้น เงินออม ปันผล",
    coverSrc:
      "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=900&q=78",
  },
  {
    slug: "prompt-library",
    blurb: "คลัง Prompt ใช้กับงาน AI",
    coverSrc:
      "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=900&q=78",
  },
  {
    slug: "vault",
    blurb: "เก็บรหัสผ่านบริการต่าง ๆ อย่างปลอดภัย",
    coverSrc:
      "https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=900&q=78",
  },
];

export const LANDING_DAILY_MODULE_SHOWCASE: LandingModuleShowcaseItem[] = [
  {
    slug: "asset",
    blurb: "ทะเบียนทรัพย์สิน ตรวจนับ โอน จำหน่าย",
    coverSrc:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=900&q=78",
  },
  {
    slug: "income-expense-basic",
    blurb: "รายรับ–รายจ่าย ครัวเรือน/ธุรกิจ",
    coverSrc:
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=900&q=78",
  },
  {
    slug: "dormitory",
    blurb: "ห้อง ผู้เช่า บิล หอพัก",
    coverSrc:
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=900&q=78",
  },
  {
    slug: "village",
    blurb: "นิติบุคคล หมู่บ้าน จดหมาย แจ้งเตือน",
    coverSrc:
      "https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&w=900&q=78",
  },
  {
    slug: "educare",
    blurb: "เช็คชื่อนักเรียน ห้อง รายงาน",
    coverSrc:
      "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=78",
  },
  {
    slug: "attendance",
    blurb: "เช็คอินพนักงาน/กิจกรรม",
    coverSrc:
      "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=900&q=78",
  },
  {
    slug: "doc-transmission",
    blurb: "ส่งหนังสือ ลงทะเบียน รับ–ส่ง",
    coverSrc:
      "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=900&q=78",
  },
  {
    slug: "media-registry",
    blurb: "ยืม–คืน สื่อ CD/DVD/อุปกรณ์",
    coverSrc:
      "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=900&q=78",
  },
  {
    slug: "inventory",
    blurb: "คลัง สต๊อก การเคลื่อนไหวสินค้า",
    coverSrc:
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=900&q=78",
  },
  {
    slug: "ecommerce-store",
    blurb: "ร้านออนไลน์ สต๊อก หน้าร้อง แนบสลิป PromptPay",
    coverSrc:
      "https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=900&q=78",
  },
  {
    slug: "barber",
    blurb: "จองคิว ร้านตัดผม",
    coverSrc:
      "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=900&q=78",
  },
  {
    slug: "car-wash",
    blurb: "ลานล้าง แพ็กเกจ สมาชิก",
    coverSrc:
      "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&w=900&q=78",
  },
  {
    slug: "massage",
    blurb: "คิวจอง walk-in แพ็กเกจ QR",
    coverSrc:
      "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=900&q=78",
  },
  {
    slug: "laundry",
    blurb: "รับฝากซัก ติดตามออเดอร์",
    coverSrc:
      "https://images.unsplash.com/photo-1582735689369-4fe89db7114c?auto=format&fit=crop&w=900&q=78",
  },
  {
    slug: "parking",
    blurb: "จอดรถ ยอด ประวัติ",
    coverSrc:
      "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=900&q=78",
  },
  {
    slug: "building-pos",
    blurb: "POS ร้านอาหาร QR สั่งอาหาร",
    coverSrc:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=78",
  },
  {
    slug: "drink-pos",
    blurb: "POS เครื่องดื่ม สะสมแต้ม · 1 บาท/วัน",
    coverSrc:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=78",
  },
  {
    slug: "hotel-resort",
    blurb: "โรงแรม รีสอร์ท · ห้องพัก จอง QR · 1 บาท/วัน",
    coverSrc:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=78",
  },
];
