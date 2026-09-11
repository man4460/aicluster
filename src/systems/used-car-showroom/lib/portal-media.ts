/** รูปพอร์ทัลโชว์รูมรถมือสอง — แบนเนอร์ + แกลเลอรี + รูปรถตัวอย่าง (seed/ทดลอง) */

export const USED_CAR_PORTAL_GALLERY_MAX = 20;

const Q = "auto=format&fit=crop&q=78";

function g(id: string, w = 800, h = 600): string {
  return `https://images.unsplash.com/${id}?${Q}&w=${w}&h=${h}`;
}

export const USED_CAR_PORTAL_SAMPLE_BANNER =
  `https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?${Q}&w=1400&h=560`;

/** โลโก้เต็นท์ตัวอย่าง */
export const USED_CAR_SHOWROOM_SAMPLE_LOGO = g("photo-1489824904134-891ab64532f1", 240, 240);

/**
 * รูปรถ Unsplash ที่ใช้ seed — ตรวจ HEAD แล้วว่า 200
 * ห้ามใส่ picsum / URL สุ่มที่พังบ่อย
 */
export const USED_CAR_VEHICLE_SAMPLE_IMAGES = [
  g("photo-1492144534655-ae79c964c9d7"),
  g("photo-1503376780353-7e6692767b70"),
  g("photo-1549317661-bd32c8ce0db2"),
  g("photo-1552519507-da3b142c6e3d"),
  g("photo-1583121274602-3e2820c69888"),
  g("photo-1617531653332-bd46c24f2068"),
  g("photo-1605559424843-9e4c228bf1c2"),
  g("photo-1493238792000-8113da705763"),
  g("photo-1489824904134-891ab64532f1"),
  g("photo-1519641471654-76ce0107ad1b"),
  g("photo-1494976388531-d1058494cdd8"),
  g("photo-1502877338535-766e1452684a"),
  g("photo-1549399542-7e3f8b79c341"),
  g("photo-1541899481282-d53bffe3c35d"),
  g("photo-1550355291-bbee04a92027"),
  g("photo-1568605117036-5fe5e7bab0b7"),
  g("photo-1494905998402-395d579af36f"),
  g("photo-1525609004556-c46c7d6cf023"),
  g("photo-1618843479313-40f8afb4b4d8"),
  g("photo-1609521263047-f8f205293f24"),
  g("photo-1617814076367-b759c7d7e738"),
  g("photo-1544636331-e26879cd4d9b"),
  g("photo-1504215680853-026ed2a45def"),
  g("photo-1563720223185-11003d516935"),
  g("photo-1549923746-c502d488b3ea"),
  g("photo-1606664515524-ed2f786a0bd6"),
  g("photo-1619767886558-efdc259cde1a"),
  g("photo-1621135802920-133df287f89c"),
] as const;

export const USED_CAR_PORTAL_SAMPLE_GALLERY = USED_CAR_VEHICLE_SAMPLE_IMAGES.slice(0, 8);

export function usedCarVehicleSampleImage(index: number): string {
  const list = USED_CAR_VEHICLE_SAMPLE_IMAGES;
  return list[((index % list.length) + list.length) % list.length]!;
}

/** รูปปก + แกลเลอรีย่อยต่อคัน (2–3 รูป) */
export function usedCarVehicleSampleImageSet(vehicleIndex: number, count = 3): string[] {
  const n = Math.min(Math.max(1, count), 4);
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    out.push(usedCarVehicleSampleImage(vehicleIndex * 2 + i));
  }
  return out;
}

/** YouTube ตัวอย่างรีวิวรถ (สาธารณะคงที่) */
export const USED_CAR_SAMPLE_YOUTUBE = [
  "https://www.youtube.com/watch?v=LXb3EKWsInQ",
  "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
  "https://www.youtube.com/watch?v=M7lc1UVf-VE",
  "https://www.youtube.com/watch?v=jNQXAC9IVRw",
] as const;
