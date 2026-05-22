/**
 * รูป Unsplash สำหรับ POS เครื่องดื่ม — ทดสอบ HTTP 200 แล้ว (ไม่ใช้ photo id ที่ 404)
 * ใช้ร่วมกับ seed และแนะนำภาพตัวอย่าง
 */
const Q = "auto=format&fit=crop&q=78";

export const DRINK_POS_CATEGORY_IMAGES = [
  `https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?${Q}&w=640&h=400`,
  `https://images.unsplash.com/photo-1544787219-7f47ccb76574?${Q}&w=640&h=400`,
  `https://images.unsplash.com/photo-1563805042-7684c019e1cb?${Q}&w=640&h=400`,
] as const;

/** ลาเต้ · อเมริกาโน่ · คาปูชิโน่ · มอคค่า · ชาเขียว · ชาไทย · โกโก้ · นม · ท็อปปิ้ง · วิป · เอสเปรสโซ่ */
export const DRINK_POS_PRODUCT_IMAGES = [
  `https://images.unsplash.com/photo-1572442388796-11668a67e53d?${Q}&w=800&h=600`,
  `https://images.unsplash.com/photo-1509042239860-f550ce710b93?${Q}&w=800&h=600`,
  `https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?${Q}&w=800&h=600`,
  `https://images.unsplash.com/photo-1442512595331-e89e73853f31?${Q}&w=800&h=600`,
  `https://images.unsplash.com/photo-1544145945-f90425340c7e?${Q}&w=800&h=600`,
  `https://images.unsplash.com/photo-1544787219-7f47ccb76574?${Q}&w=800&h=600`,
  `https://images.unsplash.com/photo-1551024506-0bccd828d307?${Q}&w=800&h=600`,
  `https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?${Q}&w=800&h=600`,
  `https://images.unsplash.com/photo-1621939514649-280e2ee25f60?${Q}&w=800&h=600`,
  `https://images.unsplash.com/photo-1563805042-7684c019e1cb?${Q}&w=800&h=600`,
  `https://images.unsplash.com/photo-1509042239860-f550ce710b93?${Q}&w=800&h=600`,
] as const;

export const DRINK_POS_DEFAULT_IMAGE = `https://images.unsplash.com/photo-1604719312566-8912e9227c6a?${Q}&w=800&h=600`;
