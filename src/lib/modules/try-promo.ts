import { z } from "zod";
import { extractYoutubeVideoId, youtubeThumbUrl, youtubeWatchUrl } from "@/lib/youtube-url";

export const tryPromoVideoInputSchema = z.object({
  id: z.string().min(1).max(64).optional(),
  title: z.string().trim().min(1).max(120),
  hint: z.string().trim().max(200).optional().nullable(),
  youtubeUrl: z.string().trim().min(8).max(500),
});

export type TryPromoVideoStored = {
  id: string;
  title: string;
  hint: string;
  youtubeUrl: string;
  videoId: string;
};

export type TryPromoVideoPublic = TryPromoVideoStored & {
  thumbUrl: string;
  watchUrl: string;
};

export function parseTryPromoVideosJson(raw: string | null | undefined): TryPromoVideoStored[] {
  if (!raw?.trim()) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  const out: TryPromoVideoStored[] = [];
  for (const item of parsed) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const title = typeof row.title === "string" ? row.title.trim() : "";
    const youtubeUrl = typeof row.youtubeUrl === "string" ? row.youtubeUrl.trim() : "";
    const videoId =
      (typeof row.videoId === "string" && extractYoutubeVideoId(row.videoId)) ||
      extractYoutubeVideoId(youtubeUrl);
    if (!title || !videoId) continue;
    const id =
      typeof row.id === "string" && row.id.trim()
        ? row.id.trim().slice(0, 64)
        : `v-${videoId}`;
    const hint = typeof row.hint === "string" ? row.hint.trim().slice(0, 200) : "";
    out.push({
      id,
      title: title.slice(0, 120),
      hint,
      youtubeUrl: youtubeWatchUrl(videoId),
      videoId,
    });
    if (out.length >= 24) break;
  }
  return out;
}

export function serializeTryPromoVideos(videos: TryPromoVideoStored[]): string {
  return JSON.stringify(
    videos.map((v) => ({
      id: v.id,
      title: v.title,
      hint: v.hint,
      youtubeUrl: v.youtubeUrl,
      videoId: v.videoId,
    })),
  );
}

export function toPublicTryPromoVideos(videos: TryPromoVideoStored[]): TryPromoVideoPublic[] {
  return videos.map((v) => ({
    ...v,
    thumbUrl: youtubeThumbUrl(v.videoId),
    watchUrl: youtubeWatchUrl(v.videoId),
  }));
}

/** แปลงรายการจากแอดมิน → เก็บ DB (validate YouTube) */
export function normalizeTryPromoVideosFromAdmin(
  items: z.infer<typeof tryPromoVideoInputSchema>[],
): { ok: true; videos: TryPromoVideoStored[] } | { ok: false; error: string } {
  const videos: TryPromoVideoStored[] = [];
  for (const item of items) {
    const videoId = extractYoutubeVideoId(item.youtubeUrl);
    if (!videoId) {
      return { ok: false, error: `ลิงก์ YouTube ไม่ถูกต้อง: ${item.title}` };
    }
    videos.push({
      id: (item.id?.trim() || `v-${videoId}`).slice(0, 64),
      title: item.title.trim().slice(0, 120),
      hint: (item.hint ?? "").trim().slice(0, 200),
      youtubeUrl: youtubeWatchUrl(videoId),
      videoId,
    });
  }
  return { ok: true, videos };
}
