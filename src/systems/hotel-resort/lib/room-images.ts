export const HOTEL_RESORT_ROOM_IMAGE_MAX = 10;

/** รูป Unsplash ตัวอย่างห้องพัก / รีสอร์ท (ใช้ seed + ปุ่มใส่รูปตัวอย่าง) */
const Q = "auto=format&fit=crop&q=78";

export const HOTEL_RESORT_ROOM_SAMPLE_IMAGES = [
  `https://images.unsplash.com/photo-1631049307264-da0ec9d70304?${Q}&w=800&h=600`,
  `https://images.unsplash.com/photo-1618773928121-c32242e63f39?${Q}&w=800&h=600`,
  `https://images.unsplash.com/photo-1590490360182-c33d57733427?${Q}&w=800&h=600`,
  `https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?${Q}&w=800&h=600`,
  `https://images.unsplash.com/photo-1566073771259-6a8506099945?${Q}&w=800&h=600`,
  `https://images.unsplash.com/photo-1578683010236-d716f9a3f461?${Q}&w=800&h=600`,
  `https://images.unsplash.com/photo-1595576508898-0ad5c879a061?${Q}&w=800&h=600`,
  `https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?${Q}&w=800&h=600`,
  `https://images.unsplash.com/photo-1445019980597-93fa8acb246c?${Q}&w=800&h=600`,
  `https://images.unsplash.com/photo-1564501049412-61c2a3083791?${Q}&w=800&h=600`,
] as const;

/** เลือกรูปตัวอย่าง 2–4 รูปต่อห้อง ตามดัชนี (วนชุดรูป) */
export function hotelResortSampleRoomImageUrls(roomIndex = 0, count = 3): string[] {
  const n = Math.min(Math.max(1, count), HOTEL_RESORT_ROOM_IMAGE_MAX, HOTEL_RESORT_ROOM_SAMPLE_IMAGES.length);
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    out.push(HOTEL_RESORT_ROOM_SAMPLE_IMAGES[(roomIndex * 2 + i) % HOTEL_RESORT_ROOM_SAMPLE_IMAGES.length]!);
  }
  return out;
}

/** แปลง JSON รูปห้อง → string[] สูงสุด 10 URL */
export function hotelResortNormalizeRoomImageUrls(raw: unknown): string[] {
  let list: unknown = raw;
  if (typeof raw === "string") {
    const t = raw.trim();
    if (!t) return [];
    try {
      list = JSON.parse(t) as unknown;
    } catch {
      return [];
    }
  }
  if (!Array.isArray(list)) return [];
  const out: string[] = [];
  for (const item of list) {
    if (typeof item !== "string") continue;
    const url = item.trim();
    if (!url || url.length > 512) continue;
    out.push(url);
    if (out.length >= HOTEL_RESORT_ROOM_IMAGE_MAX) break;
  }
  return out;
}
