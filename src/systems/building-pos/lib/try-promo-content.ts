/** เนื้อหาหน้าโฆษณา /try/building-pos — นอก git ถ้าต้องการแก้วิดีโอบ่อย แก้ไฟล์นี้ */

const Q = "auto=format&fit=crop&q=80";

export const BUILDING_POS_TRY_BANNER =
  `https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?${Q}&w=1920&h=1080`;

export type BuildingPosTryVideoItem = {
  id: string;
  title: string;
  hint: string;
  /** ลิงก์เปิดดู (YouTube / Vimeo / หน้าคู่มือ) */
  href: string;
  /** รูปปกการ์ด */
  thumb: string;
};

/**
 * แกลเลอรีวิดีโอเรียนรู้ — คลิกเปิดแท็บใหม่ (แนว Melody Wash)
 * แก้ href เป็นคลิปจริงของทีมได้ทีหลัง
 */
export const BUILDING_POS_TRY_VIDEOS: BuildingPosTryVideoItem[] = [
  {
    id: "order",
    title: "รับออเดอร์หน้าร้าน",
    hint: "เลือกโต๊ะ · เมนู · ส่งครัว",
    href: "https://www.youtube.com/results?search_query=restaurant+POS+order+taking",
    thumb: `https://images.unsplash.com/photo-1559339352-11d035aa65de?${Q}&w=800&h=600`,
  },
  {
    id: "kitchen",
    title: "คิวครัวเรียลไทม์",
    hint: "รับ → กำลังทำ → เสิร์ฟ",
    href: "https://www.youtube.com/results?search_query=restaurant+kitchen+display+system",
    thumb: `https://images.unsplash.com/photo-1556910103-1c02745aae4d?${Q}&w=800&h=600`,
  },
  {
    id: "qr",
    title: "QR สั่งอาหารที่โต๊ะ",
    hint: "ลูกค้าสแกนสั่งเอง",
    href: "https://www.youtube.com/results?search_query=QR+code+restaurant+ordering",
    thumb: `https://images.unsplash.com/photo-1414235077428-338989a2e8c0?${Q}&w=800&h=600`,
  },
  {
    id: "booking",
    title: "จองโต๊ะผ่านเว็บ",
    hint: "ลิงก์ลูกค้า · มัดจำ · สลิป",
    href: "https://www.youtube.com/results?search_query=online+restaurant+table+reservation",
    thumb: `https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?${Q}&w=800&h=600`,
  },
  {
    id: "finance",
    title: "การเงินและปิดบิล",
    hint: "ยอดขาย · พร้อมเพย์ · สลิป",
    href: "https://www.youtube.com/results?search_query=restaurant+payment+POS+promptpay",
    thumb: `https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?${Q}&w=800&h=600`,
  },
  {
    id: "setup",
    title: "ตั้งค่าร้านและเมนู",
    hint: "หมวด · ราคา · QR พนักงาน",
    href: "https://www.youtube.com/results?search_query=restaurant+menu+POS+setup",
    thumb: `https://images.unsplash.com/photo-1600891964599-f61ba0e24092?${Q}&w=800&h=600`,
  },
];

export const BUILDING_POS_TRY_FEATURES: { title: string; hint: string }[] = [
  { title: "ออเดอร์ + คิวครัว", hint: "หน้าร้านและแผนกหลังร้านอัปเดตร่วมกัน" },
  { title: "QR สั่งเอง", hint: "ลูกค้าสแกนที่โต๊ะ ไม่ต้องคีย์ซ้ำ" },
  { title: "เว็บจองโต๊ะ", hint: "แบนเนอร์ · เมนู · มัดจำ · สลิป" },
  { title: "การเงินครบ", hint: "ยอดขาย กราฟ รายจ่าย พิมพ์สลิป" },
];
