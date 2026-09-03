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

/** อ่านรายการ YouTube จาก JSON + fallback ฟิลด์เดี่ยวเก่า */
export function parseClubEventYoutubeUrls(
  youtubeUrlsJson: string | null | undefined,
  legacyEmbedUrl?: string | null,
): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const push = (raw: string) => {
    const n = normalizeClubEventYoutubeEmbedUrl(raw);
    if (!n || seen.has(n)) return;
    seen.add(n);
    out.push(n);
  };

  if (youtubeUrlsJson?.trim()) {
    try {
      const parsed = JSON.parse(youtubeUrlsJson) as unknown;
      if (Array.isArray(parsed)) {
        for (const row of parsed) {
          if (typeof row === "string") push(row);
        }
      }
    } catch {
      /* ignore */
    }
  }

  if (out.length === 0 && legacyEmbedUrl?.trim()) {
    push(legacyEmbedUrl);
  }

  return out;
}

export function serializeClubEventYoutubeUrls(urls: string[]): string {
  return JSON.stringify(urls);
}

/**
 * รับ body youtubeUrls (string[]) และ/หรือ youtubeEmbedUrl (string) แล้ว normalize
 * คืน error ถ้ามีลิงก์ที่ไม่ถูกต้อง
 */
export function normalizeClubEventYoutubeUrlsFromBody(body: {
  youtubeUrls?: unknown;
  youtubeEmbedUrl?: unknown;
}): { ok: true; urls: string[] } | { ok: false; error: string } {
  const rawList: string[] = [];

  if (Array.isArray(body.youtubeUrls)) {
    for (const row of body.youtubeUrls) {
      if (typeof row === "string" && row.trim()) rawList.push(row.trim());
    }
  } else if (typeof body.youtubeEmbedUrl === "string" && body.youtubeEmbedUrl.trim()) {
    rawList.push(body.youtubeEmbedUrl.trim());
  } else if (body.youtubeEmbedUrl === null || body.youtubeEmbedUrl === "") {
    return { ok: true, urls: [] };
  } else if (body.youtubeUrls === undefined && body.youtubeEmbedUrl === undefined) {
    return { ok: true, urls: [] };
  }

  const urls: string[] = [];
  const seen = new Set<string>();
  for (const raw of rawList) {
    const n = normalizeClubEventYoutubeEmbedUrl(raw);
    if (!n) {
      return {
        ok: false,
        error: "ลิงก์ YouTube ไม่ถูกต้อง — วางจาก watch / youtu.be / embed ได้",
      };
    }
    if (seen.has(n)) continue;
    seen.add(n);
    urls.push(n);
  }
  return { ok: true, urls };
}
