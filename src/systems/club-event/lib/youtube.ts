import {
  extractYoutubeVideoId,
  youtubeEmbedUrl,
  youtubeWatchUrl,
} from "@/lib/youtube-url";

/** แปลงลิงก์ YouTube ใด ๆ (watch / youtu.be / embed / shorts) เป็น embed URL เก็บใน DB — ไม่มี autoplay */
export function normalizeClubEventYoutubeEmbedUrl(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const id = extractYoutubeVideoId(trimmed);
  if (!id) return null;
  return youtubeEmbedUrl(id, false);
}

export function clubEventYoutubeWatchUrlFromStored(embedOrAny: string | null | undefined): string | null {
  if (!embedOrAny?.trim()) return null;
  const id = extractYoutubeVideoId(embedOrAny.trim());
  if (!id) return null;
  return youtubeWatchUrl(id);
}

export function clubEventYoutubeEmbedSrc(embedOrAny: string | null | undefined): string | null {
  return normalizeClubEventYoutubeEmbedUrl(embedOrAny);
}
