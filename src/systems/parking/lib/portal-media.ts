export const PARKING_PORTAL_GALLERY_MAX = 8;
export const PARKING_REVIEW_PHOTO_MAX = 5;

export function normalizeParkingPortalGallery(raw: unknown): string[] {
  let value = raw;
  if (typeof raw === "string") {
    try {
      value = JSON.parse(raw.trim() || "[]") as unknown;
    } catch {
      return [];
    }
  }
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0 && item.length <= 512)
    .slice(0, PARKING_PORTAL_GALLERY_MAX);
}

export function normalizeParkingReviewPhotos(raw: unknown): string[] {
  let arr: unknown[] = [];
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) arr = parsed;
    } catch {
      arr = [];
    }
  } else if (Array.isArray(raw)) {
    arr = raw;
  }
  return arr
    .filter((u): u is string => typeof u === "string" && u.trim().startsWith("/"))
    .map((u) => u.trim())
    .slice(0, PARKING_REVIEW_PHOTO_MAX);
}

const Q = "auto=format&fit=crop&q=80";
export const PARKING_PORTAL_SAMPLE_BANNER =
  `https://images.unsplash.com/photo-1590674899484-d5640e854abe?${Q}&w=1600&h=900`;
export const PARKING_PORTAL_SAMPLE_GALLERY = [
  `https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?${Q}&w=800&h=600`,
  `https://images.unsplash.com/photo-1506521781263-d8422e82f27a?${Q}&w=800&h=600`,
  `https://images.unsplash.com/photo-1597404294360-feeeda04612e?${Q}&w=800&h=600`,
  `https://images.unsplash.com/photo-1621929747188-0b4dc28498d2?${Q}&w=800&h=600`,
] as const;
