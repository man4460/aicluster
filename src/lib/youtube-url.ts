/**
 * แยก YouTube video id จาก URL ที่แอดมินวาง
 * รองรับ watch / youtu.be / embed / shorts
 */
export function extractYoutubeVideoId(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s;

  try {
    const u = new URL(s);
    const host = u.hostname.replace(/^www\./, "").toLowerCase();
    if (host === "youtu.be") {
      const id = u.pathname.split("/").filter(Boolean)[0] ?? "";
      return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }
    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      const v = u.searchParams.get("v");
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
      const parts = u.pathname.split("/").filter(Boolean);
      if (parts[0] === "embed" || parts[0] === "shorts" || parts[0] === "live") {
        const id = parts[1] ?? "";
        return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
      }
    }
  } catch {
    return null;
  }
  return null;
}

export function youtubeThumbUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

export function youtubeEmbedUrl(videoId: string, autoplay = true): string {
  const q = autoplay ? "?autoplay=1&rel=0" : "?rel=0";
  return `https://www.youtube.com/embed/${videoId}${q}`;
}

/**
 * Embed โหมดปลอดภัย (LMS / เล่นในแอป) — ปิด controls ของ YouTube · modestbranding · playsinline
 * ใช้กับ AppSecureYoutubePlayer / AppYoutubeLightbox — ห้ามโชว์ลิงก์ watch ให้ผู้ใช้คัดลอก
 */
export function secureYoutubeEmbedUrl(videoId: string, autoplay = false): string {
  const params = new URLSearchParams({
    modestbranding: "1",
    controls: "0",
    showinfo: "0",
    rel: "0",
    disablekb: "1",
    enablejsapi: "1",
    playsinline: "1",
  });
  if (autoplay) params.set("autoplay", "1");
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}

/** แปลง URL/id ใด ๆ เป็น secure embed หรือ null */
export function normalizeSecureYoutubeEmbedUrl(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const id = extractYoutubeVideoId(trimmed);
  if (!id) return null;
  return secureYoutubeEmbedUrl(id);
}

export function youtubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}
