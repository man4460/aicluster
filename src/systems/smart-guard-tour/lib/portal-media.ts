/** รูปพอร์ทัล / seed จุดตรวจ รปภ. — Unsplash ที่ตรวจ HEAD แล้วว่า 200 */

export const SMART_GUARD_PORTAL_GALLERY_MAX = 12;

const Q = "auto=format&fit=crop&q=78";

function g(id: string, w = 800, h = 600): string {
  return `https://images.unsplash.com/${id}?${Q}&w=${w}&h=${h}`;
}

/** รูปปกแคตตาล็อก / landing */
export const SMART_GUARD_MODULE_COVER = g("photo-1563013544-824ae1b704d3", 900, 600);

export const SMART_GUARD_PORTAL_SAMPLE_BANNER = g("photo-1486406146926-c627a92ad1ab", 1400, 560);

export const SMART_GUARD_SAMPLE_LOGO = g("photo-1563013544-824ae1b704d3", 240, 240);

/** จุดตรวจ / อาคาร / อุตสาหกรรม — รูปปกจุดตรวจ */
export const SMART_GUARD_CHECKPOINT_SAMPLE_IMAGES = [
  g("photo-1581091226825-a6a2a5aee158"),
  g("photo-1581092918056-0c4c3acd3789"),
  g("photo-1581092160562-40aa08e78837"),
  g("photo-1581092795360-fd1ca04f0952"),
  g("photo-1581092162384-8987c1d64718"),
  g("photo-1497366216548-37526070297c"),
  g("photo-1497366754035-f200968a6e72"),
  g("photo-1497366811353-6870744d04b2"),
  g("photo-1454165804606-c3d57bc86b40"),
  g("photo-1504384308090-c894fdcc538d"),
  g("photo-1556761175-5973dc0f32e7"),
  g("photo-1556761175-b413da4baf72"),
] as const;

export const SMART_GUARD_PORTAL_SAMPLE_GALLERY = SMART_GUARD_CHECKPOINT_SAMPLE_IMAGES.slice(0, 8);

/** รูปโปรไฟล์พนักงานตัวอย่าง */
export const SMART_GUARD_STAFF_SAMPLE_PHOTOS = [
  g("photo-1560250097-0b93528c311a", 240, 240),
  g("photo-1573496359142-b8d87734a5a2", 240, 240),
  g("photo-1507003211169-0a1dd7228f2d", 240, 240),
  g("photo-1472099645785-5658abf4ff4e", 240, 240),
  g("photo-1516321318423-f06f85e504b3", 240, 240),
] as const;

export function smartGuardCheckpointSampleImage(index: number): string {
  const list = SMART_GUARD_CHECKPOINT_SAMPLE_IMAGES;
  return list[((index % list.length) + list.length) % list.length]!;
}

export function smartGuardStaffSamplePhoto(index: number): string {
  const list = SMART_GUARD_STAFF_SAMPLE_PHOTOS;
  return list[((index % list.length) + list.length) % list.length]!;
}

/** YouTube ตัวอย่าง (ความปลอดภัย / อาคาร) */
export const SMART_GUARD_SAMPLE_YOUTUBE = [
  "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
  "https://www.youtube.com/watch?v=M7lc1UVf-VE",
  "https://www.youtube.com/watch?v=jNQXAC9IVRw",
  "https://www.youtube.com/watch?v=LXb3EKWsInQ",
] as const;
