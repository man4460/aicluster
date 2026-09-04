/** แปลงเนื้อหาผลงาน / รายละเอียดเรซูเม่ ระหว่างข้อความธรรมดากับ HTML ที่พอร์ทัลแสดง */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const LIST_BULLET = /^[-*•]\s+(.+)$/;
const LIST_NUMBER = /^\d+[.)]\s+(.+)$/;
const HEADING_MARK = /^(#{1,3})\s+(.+)$/;

/** ตัวหนาแบบ **ข้อความ** หลัง escape แล้ว */
function formatInline(escaped: string): string {
  return escaped.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

function isAutoHeadingLine(line: string, opts?: { maxLen?: number }): boolean {
  const t = line.trim();
  const maxLen = opts?.maxLen ?? 48;
  if (!t || t.length > maxLen) return false;
  if (LIST_BULLET.test(t) || LIST_NUMBER.test(t) || HEADING_MARK.test(t)) return false;
  if (/[.!?。…]$/.test(t)) return false;
  if (t.includes("**")) return false;
  return true;
}

function headingTag(level: 1 | 2 | 3, text: string): string {
  const tag = `h${level}` as const;
  return `<${tag}>${formatInline(escapeHtml(text))}</${tag}>`;
}

/**
 * ข้อความธรรมดา → HTML
 *
 * รูปแบบที่รองรับ:
 * - `# ` / `## ` / `### ` → หัวข้อ h1–h3
 * - บรรทัดสั้นเดี่ยว (หรือบรรทัดแรกของบล็อก) → หัวข้อ h2 อัตโนมัติ
 * - ย่อหน้า → p (คั่นด้วยบรรทัดว่าง = แยกบล็อก)
 * - `- ` / `* ` / `• ` → รายการ ul
 * - `1. ` / `1) ` → รายการ ol
 * - `**ตัวหนา**` → strong
 */
export function plainTextToContentHtml(plain: string): string {
  const normalized = plain.replace(/\r\n/g, "\n").trim();
  if (!normalized) return "";

  const blocks = normalized.split(/\n\s*\n+/);
  const parts: string[] = [];

  for (const block of blocks) {
    const lines = block
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (!lines.length) continue;

    const bulletItems = lines.map((l) => l.match(LIST_BULLET)?.[1]?.trim() ?? null);
    if (bulletItems.every((x) => x != null)) {
      parts.push(
        `<ul>${bulletItems.map((item) => `<li>${formatInline(escapeHtml(item!))}</li>`).join("")}</ul>`,
      );
      continue;
    }

    const numberItems = lines.map((l) => l.match(LIST_NUMBER)?.[1]?.trim() ?? null);
    if (numberItems.every((x) => x != null)) {
      parts.push(
        `<ol>${numberItems.map((item) => `<li>${formatInline(escapeHtml(item!))}</li>`).join("")}</ol>`,
      );
      continue;
    }

    if (lines.length === 1) {
      const only = lines[0]!;
      const marked = only.match(HEADING_MARK);
      if (marked) {
        const level = Math.min(3, marked[1]!.length) as 1 | 2 | 3;
        parts.push(headingTag(level, marked[2]!.trim()));
        continue;
      }
      // บรรทัดเดียวสั้นมาก (เช่น «ผลลัพธ์») → หัวข้อ · ยาวกว่านั้นเป็นย่อหน้า
      if (isAutoHeadingLine(only, { maxLen: 20 })) {
        parts.push(headingTag(2, only));
        continue;
      }
      parts.push(`<p>${formatInline(escapeHtml(only))}</p>`);
      continue;
    }

    let pendingList: { type: "ul" | "ol"; items: string[] } | null = null;
    const flushList = () => {
      if (!pendingList?.items.length) {
        pendingList = null;
        return;
      }
      const tag = pendingList.type;
      parts.push(
        `<${tag}>${pendingList.items.map((item) => `<li>${formatInline(escapeHtml(item))}</li>`).join("")}</${tag}>`,
      );
      pendingList = null;
    };

    lines.forEach((line, idx) => {
      const marked = line.match(HEADING_MARK);
      if (marked) {
        flushList();
        const level = Math.min(3, marked[1]!.length) as 1 | 2 | 3;
        parts.push(headingTag(level, marked[2]!.trim()));
        return;
      }

      const bullet = line.match(LIST_BULLET)?.[1]?.trim();
      if (bullet) {
        if (pendingList?.type !== "ul") {
          flushList();
          pendingList = { type: "ul", items: [] };
        }
        pendingList.items.push(bullet);
        return;
      }

      const numbered = line.match(LIST_NUMBER)?.[1]?.trim();
      if (numbered) {
        if (pendingList?.type !== "ol") {
          flushList();
          pendingList = { type: "ol", items: [] };
        }
        pendingList.items.push(numbered);
        return;
      }

      flushList();

      if (idx === 0 && isAutoHeadingLine(line)) {
        parts.push(headingTag(2, line));
        return;
      }

      parts.push(`<p>${formatInline(escapeHtml(line))}</p>`);
    });

    flushList();
  }

  return parts.join("");
}

/** HTML → ข้อความธรรมดา (โหลดฟอร์มแก้ไข) */
export function contentHtmlToPlainText(html: string): string {
  const raw = html.trim();
  if (!raw) return "";

  if (!/<[a-z][\s\S]*>/i.test(raw)) return raw.replace(/\r\n/g, "\n");

  let s = raw
    .replace(/\r\n/g, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/h1>/gi, "\n\n")
    .replace(/<h1[^>]*>/gi, "# ")
    .replace(/<\/h2>/gi, "\n\n")
    .replace(/<h2[^>]*>/gi, "## ")
    .replace(/<\/h3>/gi, "\n\n")
    .replace(/<h3[^>]*>/gi, "### ")
    .replace(/<\/(p|div|section|article)>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<\/(ul|ol)>/gi, "\n")
    .replace(/<(ul|ol)[^>]*>/gi, "\n")
    .replace(/<(p|div)[^>]*>/gi, "")
    .replace(/<\/?(strong|b)>/gi, "**")
    .replace(/<\/?(em|i)>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  s = s
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, "").replace(/^[ \t]+/g, ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return s;
}

/** อนุญาตเฉพาะแท็กที่ตัวแปลงสร้าง — กัน XSS จาก HTML ค้างใน DB */
export function sanitizeResumeContentHtml(html: string): string {
  let s = html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\s(href|src)\s*=\s*("\s*javascript:[^"]*"|'\s*javascript:[^']*')/gi, "");

  s = s.replace(/<\/?([a-z0-9]+)(\s[^>]*)?>/gi, (full, tag: string) => {
    const t = tag.toLowerCase();
    if (["h1", "h2", "h3", "p", "ul", "ol", "li", "strong", "em", "br"].includes(t)) {
      if (t === "br") return "<br />";
      if (full.startsWith("</")) return `</${t}>`;
      return `<${t}>`;
    }
    return "";
  });

  return s;
}

/** ข้อความหรือ HTML → HTML พร้อมแสดงบนพอร์ทัล (รอบผ่านข้อความธรรมดาเพื่อจัดรูปแบบใหม่) */
export function toDisplayContentHtml(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  const plain = contentHtmlToPlainText(trimmed);
  return sanitizeResumeContentHtml(plainTextToContentHtml(plain));
}
