/**
 * Google Custom Search (Programmable Search Engine) — JSON API
 * ----------------------------------------------------------------
 * ใช้กับ chat-ai เพื่อค้นข้อมูล/ข่าวบนเว็บก่อนสรุปให้ผู้ใช้
 *
 * ENV ที่ต้องตั้ง:
 *   GOOGLE_API_KEY   — API key จาก Google Cloud Console (ต้องเปิด Custom Search API)
 *   GOOGLE_CSE_ID    — Search engine cx จาก https://programmablesearchengine.google.com/
 *                       (สร้าง search engine แล้วเปิด "Search the entire web")
 *
 * หมายเหตุ: ใช้ค่าจาก env เท่านั้น ห้าม hard-code คีย์ในซอร์ส
 */
export type GoogleSearchHit = {
  title: string;
  link: string;
  snippet: string;
  displayLink?: string;
  source?: string;
  publishedAt?: string;
};

export type GoogleSearchOptions = {
  query: string;
  /** จำนวนผลลัพธ์ต่อหนึ่ง request (Google จำกัด 1-10) */
  num?: number;
  /** ภาษาผลลัพธ์ ค่าเริ่มต้น "th" */
  hl?: string;
  /** ประเทศของผลลัพธ์ ค่าเริ่มต้น "th" */
  gl?: string;
  /** จำกัดวันที่: d1=24 ชม., w1=7 วัน, m1=30 วัน */
  dateRestrict?: string;
  /** "active" | "off" */
  safe?: "active" | "off";
  signal?: AbortSignal;
};

function pickStringField(obj: Record<string, unknown>, key: string): string | undefined {
  const v = obj[key];
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

function extractMetatagDate(item: Record<string, unknown>): string | undefined {
  const pagemap = item.pagemap as Record<string, unknown> | undefined;
  if (!pagemap) return undefined;
  const metatags = pagemap.metatags as Array<Record<string, unknown>> | undefined;
  if (!Array.isArray(metatags) || metatags.length === 0) return undefined;
  const m0 = metatags[0] ?? {};
  const candidates = [
    "article:published_time",
    "og:article:published_time",
    "article:modified_time",
    "datepublished",
    "date",
    "pubdate",
    "publishdate",
  ];
  for (const k of candidates) {
    const v = m0[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

/** เรียก Google Custom Search JSON API — โยน Error ถ้า env ไม่ครบ/HTTP ไม่ผ่าน */
export async function searchWithGoogleApi(
  opts: GoogleSearchOptions,
): Promise<GoogleSearchHit[]> {
  const apiKey = process.env.GOOGLE_API_KEY?.trim();
  const cx =
    process.env.GOOGLE_CSE_ID?.trim() ||
    process.env.GOOGLE_PROGRAMMABLE_SEARCH_CX?.trim() ||
    "";
  if (!apiKey) throw new Error("ยังไม่ได้ตั้ง GOOGLE_API_KEY");
  if (!cx) {
    throw new Error(
      "ยังไม่ได้ตั้ง GOOGLE_CSE_ID — สร้าง Search Engine ที่ https://programmablesearchengine.google.com/ แล้วใส่ cx ใน .env",
    );
  }
  const query = opts.query.trim();
  if (!query) return [];

  const params = new URLSearchParams({
    key: apiKey,
    cx,
    q: query,
    num: String(Math.min(Math.max(opts.num ?? 10, 1), 10)),
    hl: opts.hl ?? "th",
    gl: opts.gl ?? "th",
    safe: opts.safe ?? "active",
  });
  if (opts.dateRestrict) params.set("dateRestrict", opts.dateRestrict);

  const url = `https://www.googleapis.com/customsearch/v1?${params.toString()}`;
  const res = await fetch(url, { method: "GET", signal: opts.signal });
  const rawText = await res.text();
  let payload: Record<string, unknown> = {};
  try {
    payload = JSON.parse(rawText) as Record<string, unknown>;
  } catch {
    payload = {};
  }
  if (!res.ok) {
    const err = payload.error as Record<string, unknown> | undefined;
    const msg =
      (typeof err?.message === "string" && err.message) || `HTTP ${res.status}`;
    throw new Error(`Google Custom Search ผิดพลาด: ${msg}`);
  }
  const itemsRaw = (payload as { items?: unknown }).items;
  const items = Array.isArray(itemsRaw)
    ? (itemsRaw as Array<Record<string, unknown>>)
    : [];
  return items
    .map((it) => {
      const title = pickStringField(it, "title") ?? "";
      const link = pickStringField(it, "link") ?? "";
      const snippet = (pickStringField(it, "snippet") ?? "").replace(/\s+/g, " ");
      const displayLink = pickStringField(it, "displayLink");
      const source = pickStringField(it, "source") ?? displayLink;
      const publishedAt = extractMetatagDate(it);
      return { title, link, snippet, displayLink, source, publishedAt };
    })
    .filter((h) => h.title && h.link);
}

/** จัดผลลัพธ์เป็นบล็อกข้อความสั้นๆ ให้โมเดลใช้สรุป — ปรับขนาดผ่าน maxChars */
export function formatHitsForPrompt(
  hits: GoogleSearchHit[],
  maxChars = 2400,
): string {
  if (hits.length === 0) return "(ไม่พบผลลัพธ์)";
  const lines: string[] = [];
  for (let i = 0; i < hits.length; i += 1) {
    const h = hits[i]!;
    const idx = i + 1;
    const src = h.displayLink ?? h.link;
    const date = h.publishedAt ? ` · ${h.publishedAt.slice(0, 10)}` : "";
    const snippet = h.snippet ? h.snippet.slice(0, 320) : "";
    lines.push(`${idx}) ${h.title}\n   ${snippet}\n   แหล่ง: ${src}${date}`);
  }
  let out = lines.join("\n");
  if (out.length > maxChars) out = `${out.slice(0, maxChars - 1)}…`;
  return out;
}

/** วันไทย (พ.ศ.) สำหรับใช้ในหัวข้อ "ข่าวเด่นวันที่ …" */
export function formatThaiDateHeader(now: Date = new Date()): string {
  const d = new Intl.DateTimeFormat("th-TH-u-ca-buddhist", {
    timeZone: "Asia/Bangkok",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(now);
  return d;
}
