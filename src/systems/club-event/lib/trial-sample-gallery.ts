/** รูปแกลเลอรีตัวอย่างสำหรับบัญชีทดลอง/ฟรี — โชว์เมื่อยังไม่มีรูปจริง (กริดมือถือ 3 · คอม 8) */

export type ClubEventTrialSampleGalleryItem = {
  id: string;
  imageUrl: string;
  fileName: string;
  sortOrder: number;
};

const SAMPLE_URLS = [
  "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=900&q=80",
] as const;

export const CLUB_EVENT_TRIAL_SAMPLE_GALLERY: ClubEventTrialSampleGalleryItem[] = SAMPLE_URLS.map(
  (imageUrl, i) => ({
    id: `sample-gallery-${i + 1}`,
    imageUrl,
    fileName: `ตัวอย่างรูป ${i + 1}`,
    sortOrder: i,
  }),
);
