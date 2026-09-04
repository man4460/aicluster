import {
  extractYoutubeVideoId,
  youtubeEmbedUrl,
  youtubeWatchUrl,
} from "@/lib/youtube-url";

export type ClubEventYoutubeVideo = {
  id: string;
  title: string;
  hint: string;
  /** watch URL มาตรฐาน */
  youtubeUrl: string;
  videoId: string;
};

/**
 * คลิปตัวอย่างสำหรับบัญชีทดลอง/ฟรี — โชว์บนหน้ารายละเอียดเมื่อยังไม่มีวิดีโอจริง
 * เพื่อให้เห็นการ์ดกริด ~6 ใบ (มือถือ 2 · เดสก์ท็อป 6)
 */
export const CLUB_EVENT_TRIAL_SAMPLE_YOUTUBE_VIDEOS: ClubEventYoutubeVideo[] = [
  {
    id: "sample-1",
    title: "ตัวอย่างคลิป 1",
    hint: "ตัวอย่างสำหรับบัญชีทดลอง",
    videoId: "M7lc1UVf-VE",
    youtubeUrl: youtubeWatchUrl("M7lc1UVf-VE"),
  },
  {
    id: "sample-2",
    title: "ตัวอย่างคลิป 2",
    hint: "ตัวอย่างสำหรับบัญชีทดลอง",
    videoId: "aqz-KE-bpKQ",
    youtubeUrl: youtubeWatchUrl("aqz-KE-bpKQ"),
  },
  {
    id: "sample-3",
    title: "ตัวอย่างคลิป 3",
    hint: "ตัวอย่างสำหรับบัญชีทดลอง",
    videoId: "LXb3EKWsInQ",
    youtubeUrl: youtubeWatchUrl("LXb3EKWsInQ"),
  },
  {
    id: "sample-4",
    title: "ตัวอย่างคลิป 4",
    hint: "ตัวอย่างสำหรับบัญชีทดลอง",
    videoId: "ScMzIvxBSi4",
    youtubeUrl: youtubeWatchUrl("ScMzIvxBSi4"),
  },
  {
    id: "sample-5",
    title: "ตัวอย่างคลิป 5",
    hint: "ตัวอย่างสำหรับบัญชีทดลอง",
    videoId: "jNQXAC9IVRw",
    youtubeUrl: youtubeWatchUrl("jNQXAC9IVRw"),
  },
  {
    id: "sample-6",
    title: "ตัวอย่างคลิป 6",
    hint: "ตัวอย่างสำหรับบัญชีทดลอง",
    videoId: "C0DPdy98e4c",
    youtubeUrl: youtubeWatchUrl("C0DPdy98e4c"),
  },
];

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

function videoFromParts(
  title: string,
  youtubeRaw: string,
  hint: string,
  idHint?: string,
): ClubEventYoutubeVideo | null {
  const videoId = extractYoutubeVideoId(youtubeRaw);
  if (!videoId) return null;
  const t = title.trim().slice(0, 120) || "คลิป YouTube";
  return {
    id: (idHint?.trim() || `v-${videoId}`).slice(0, 64),
    title: t,
    hint: hint.trim().slice(0, 200),
    youtubeUrl: youtubeWatchUrl(videoId),
    videoId,
  };
}

/** อ่านรายการคลิปจาก JSON + fallback ฟิลด์เดี่ยวเก่า — รองรับทั้ง string[] และ object[] */
export function parseClubEventYoutubeVideos(
  youtubeUrlsJson: string | null | undefined,
  legacyEmbedUrl?: string | null,
): ClubEventYoutubeVideo[] {
  const out: ClubEventYoutubeVideo[] = [];
  const seen = new Set<string>();
  const push = (v: ClubEventYoutubeVideo | null) => {
    if (!v || seen.has(v.videoId)) return;
    seen.add(v.videoId);
    out.push(v);
  };

  if (youtubeUrlsJson?.trim()) {
    try {
      const parsed = JSON.parse(youtubeUrlsJson) as unknown;
      if (Array.isArray(parsed)) {
        parsed.forEach((row, i) => {
          if (typeof row === "string") {
            push(videoFromParts(`คลิป ${i + 1}`, row, ""));
            return;
          }
          if (!row || typeof row !== "object") return;
          const r = row as Record<string, unknown>;
          const title = typeof r.title === "string" ? r.title : `คลิป ${i + 1}`;
          const hint = typeof r.hint === "string" ? r.hint : "";
          const youtubeUrl =
            typeof r.youtubeUrl === "string"
              ? r.youtubeUrl
              : typeof r.url === "string"
                ? r.url
                : "";
          const id = typeof r.id === "string" ? r.id : undefined;
          push(videoFromParts(title, youtubeUrl, hint, id));
        });
      }
    } catch {
      /* ignore */
    }
  }

  if (out.length === 0 && legacyEmbedUrl?.trim()) {
    push(videoFromParts("คลิป 1", legacyEmbedUrl, ""));
  }

  return out;
}

/** @deprecated ใช้ parseClubEventYoutubeVideos — คืน embed URL รายการ */
export function parseClubEventYoutubeUrls(
  youtubeUrlsJson: string | null | undefined,
  legacyEmbedUrl?: string | null,
): string[] {
  return parseClubEventYoutubeVideos(youtubeUrlsJson, legacyEmbedUrl).map((v) =>
    youtubeEmbedUrl(v.videoId, false),
  );
}

export function serializeClubEventYoutubeVideos(videos: ClubEventYoutubeVideo[]): string {
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

/** เก็บแบบ object — ยังรับ string[] เก่าได้ผ่าน normalize */
export function serializeClubEventYoutubeUrls(urls: string[]): string {
  const videos = urls
    .map((u, i) => videoFromParts(`คลิป ${i + 1}`, u, ""))
    .filter((v): v is ClubEventYoutubeVideo => v != null);
  return serializeClubEventYoutubeVideos(videos);
}

/**
 * รับ body youtubeVideos (object[]) และ/หรือ youtubeUrls (string[]) / youtubeEmbedUrl
 */
export function normalizeClubEventYoutubeVideosFromBody(body: {
  youtubeVideos?: unknown;
  youtubeUrls?: unknown;
  youtubeEmbedUrl?: unknown;
}): { ok: true; videos: ClubEventYoutubeVideo[] } | { ok: false; error: string } {
  if (Array.isArray(body.youtubeVideos)) {
    const videos: ClubEventYoutubeVideo[] = [];
    const seen = new Set<string>();
    for (const row of body.youtubeVideos) {
      if (!row || typeof row !== "object") continue;
      const r = row as Record<string, unknown>;
      const title = typeof r.title === "string" ? r.title.trim() : "";
      const youtubeUrl = typeof r.youtubeUrl === "string" ? r.youtubeUrl.trim() : "";
      const hint = typeof r.hint === "string" ? r.hint : "";
      const id = typeof r.id === "string" ? r.id : undefined;
      if (!title || !youtubeUrl) {
        return { ok: false, error: "กรอกชื่อคลิปและลิงก์ YouTube ให้ครบ" };
      }
      const v = videoFromParts(title, youtubeUrl, hint, id);
      if (!v) {
        return {
          ok: false,
          error: "ลิงก์ YouTube ไม่ถูกต้อง — วางจาก watch / youtu.be / embed ได้",
        };
      }
      if (seen.has(v.videoId)) continue;
      seen.add(v.videoId);
      videos.push(v);
    }
    return { ok: true, videos };
  }

  const legacy = normalizeClubEventYoutubeUrlsFromBody(body);
  if (!legacy.ok) return legacy;
  const videos = legacy.urls
    .map((u, i) => videoFromParts(`คลิป ${i + 1}`, u, ""))
    .filter((v): v is ClubEventYoutubeVideo => v != null);
  return { ok: true, videos };
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
      else if (row && typeof row === "object") {
        const r = row as Record<string, unknown>;
        if (typeof r.youtubeUrl === "string" && r.youtubeUrl.trim()) rawList.push(r.youtubeUrl.trim());
      }
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
