import {
  extractYoutubeVideoId,
  normalizeSecureYoutubeEmbedUrl,
  youtubeWatchUrl,
} from "@/lib/youtube-url";

export type UsedCarYoutubeClip = {
  id: string;
  title: string;
  youtubeUrl: string;
  videoId: string;
};

export function normalizeUsedCarYoutubeUrl(raw: string | null | undefined): string | null {
  return normalizeSecureYoutubeEmbedUrl(raw);
}

export function usedCarYoutubeWatchUrl(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  const id = extractYoutubeVideoId(raw.trim());
  if (!id) return null;
  return youtubeWatchUrl(id);
}

export function mapUsedCarVehicleVideoRow(row: {
  id: string;
  title: string | null;
  youtubeUrl: string;
}): UsedCarYoutubeClip | null {
  const videoId = extractYoutubeVideoId(row.youtubeUrl);
  if (!videoId) return null;
  return {
    id: row.id,
    title: (row.title?.trim() || "คลิป YouTube").slice(0, 120),
    youtubeUrl: youtubeWatchUrl(videoId),
    videoId,
  };
}
