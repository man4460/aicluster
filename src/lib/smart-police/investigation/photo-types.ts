/** ประเภทของรูปบุคคลต้องสงสัย */
export const SUSPECT_PHOTO_KINDS = ["FRONT", "SIDE", "FULL", "TATTOO", "OTHER"] as const;
export type SuspectPhotoKind = (typeof SUSPECT_PHOTO_KINDS)[number];

export const SUSPECT_PHOTO_KIND_LABELS: Record<SuspectPhotoKind, string> = {
  FRONT: "หน้าตรง",
  SIDE: "ด้านข้าง",
  FULL: "เต็มตัว",
  TATTOO: "รอยสัก/ตำหนิ",
  OTHER: "อื่น ๆ",
};

export type SuspectPhotoDto = {
  id: string;
  url: string;
  kind: SuspectPhotoKind;
  caption: string | null;
  bytes: number | null;
  /** true = รูปนี้ถูกประมวลผลเป็น face embedding แล้ว (ค้นหาจากภาพได้) */
  hasEmbedding: boolean;
  createdAt: string;
};
