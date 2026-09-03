import {
  extractYoutubeVideoId,
  youtubeWatchUrl,
} from "@/lib/youtube-url";

/** Embed URL จาก video id — modestbranding / ปิด related / ปิดคีย์บอร์ด */
export function lmsYoutubeEmbedUrl(videoId: string): string {
  const params = new URLSearchParams({
    modestbranding: "1",
    controls: "0",
    showinfo: "0",
    rel: "0",
    disablekb: "1",
    enablejsapi: "1",
    playsinline: "1",
  });
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}

/** แปลงลิงก์ YouTube เป็น embed URL เก็บใน DB */
export function normalizeLmsYoutubeEmbedUrl(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const id = extractYoutubeVideoId(trimmed);
  if (!id) return null;
  return lmsYoutubeEmbedUrl(id);
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

/** Embed สำหรับห้องเรียน — ใช้ชุดพารามิเตอร์เดียวกันกับ lmsYoutubeEmbedUrl */
export function lmsSecureYoutubeEmbedSrc(embedOrAny: string | null | undefined): string | null {
  return normalizeLmsYoutubeEmbedUrl(embedOrAny);
}
