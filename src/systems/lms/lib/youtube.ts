import {
  extractYoutubeVideoId,
  normalizeSecureYoutubeEmbedUrl,
  secureYoutubeEmbedUrl,
  youtubeWatchUrl,
} from "@/lib/youtube-url";

/** Embed URL จาก video id — modestbranding / ปิด related / ปิดคีย์บอร์ด */
export function lmsYoutubeEmbedUrl(videoId: string): string {
  return secureYoutubeEmbedUrl(videoId);
}

/** แปลงลิงก์ YouTube เป็น embed URL เก็บใน DB */
export function normalizeLmsYoutubeEmbedUrl(raw: string | null | undefined): string | null {
  return normalizeSecureYoutubeEmbedUrl(raw);
}

export function lmsYoutubeVideoId(embedOrAny: string | null | undefined): string | null {
  if (!embedOrAny?.trim()) return null;
  return extractYoutubeVideoId(embedOrAny.trim());
}

export function lmsYoutubeWatchUrlFromStored(embedOrAny: string | null | undefined): string | null {
  const id = lmsYoutubeVideoId(embedOrAny);
  if (!id) return null;
  return youtubeWatchUrl(id);
}

/** Embed สำหรับห้องเรียน — ใช้ชุดพารามิเตอร์เดียวกันกับ secure embed */
export function lmsSecureYoutubeEmbedSrc(embedOrAny: string | null | undefined): string | null {
  return normalizeSecureYoutubeEmbedUrl(embedOrAny);
}
