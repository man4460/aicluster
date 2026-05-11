/**
 * บัญชีบริการยอดนิยม — ใช้แสดงไอคอน/สีในการ์ดของระบบคลังรหัสผ่าน
 * - key เป็นตัวพิมพ์เล็ก (เก็บลง brandKey ของ DB)
 * - color สำหรับ avatar fallback (HEX)
 * - initial 1–2 ตัวอักษรที่แสดงในวงกลม
 * - hint ใช้ตรวจ auto-detect จาก serviceName/websiteUrl ตอนผู้ใช้กรอก
 */
export type VaultBrandPreset = {
  key: string;
  label: string;
  initial: string;
  color: string;
  textColor?: string;
  category: string;
  websiteHints?: readonly string[];
};

export const VAULT_BRAND_PRESETS: readonly VaultBrandPreset[] = [
  { key: "google", label: "Google", initial: "G", color: "#ea4335", category: "email", websiteHints: ["google.com", "gmail.com"] },
  { key: "facebook", label: "Facebook", initial: "f", color: "#1877f2", category: "social", websiteHints: ["facebook.com", "fb.com"] },
  { key: "instagram", label: "Instagram", initial: "IG", color: "#e1306c", category: "social", websiteHints: ["instagram.com"] },
  { key: "x", label: "X (Twitter)", initial: "X", color: "#0f1419", category: "social", websiteHints: ["x.com", "twitter.com"] },
  { key: "line", label: "LINE", initial: "L", color: "#06c755", category: "social", websiteHints: ["line.me"] },
  { key: "tiktok", label: "TikTok", initial: "T", color: "#010101", category: "social", websiteHints: ["tiktok.com"] },
  { key: "youtube", label: "YouTube", initial: "Y", color: "#ff0000", category: "social", websiteHints: ["youtube.com"] },
  { key: "discord", label: "Discord", initial: "D", color: "#5865f2", category: "social", websiteHints: ["discord.com", "discord.gg"] },
  { key: "github", label: "GitHub", initial: "GH", color: "#24292f", category: "work", websiteHints: ["github.com"] },
  { key: "microsoft", label: "Microsoft", initial: "M", color: "#0078d4", category: "work", websiteHints: ["microsoft.com", "outlook.com", "office.com", "live.com", "hotmail.com"] },
  { key: "apple", label: "Apple ID", initial: "", color: "#1d1d1f", category: "work", websiteHints: ["apple.com", "icloud.com"] },
  { key: "linkedin", label: "LinkedIn", initial: "in", color: "#0a66c2", category: "work", websiteHints: ["linkedin.com"] },
  { key: "shopee", label: "Shopee", initial: "S", color: "#ee4d2d", category: "shopping", websiteHints: ["shopee.co.th", "shopee.com"] },
  { key: "lazada", label: "Lazada", initial: "L", color: "#0f146d", category: "shopping", websiteHints: ["lazada.co.th", "lazada.com"] },
  { key: "kbank", label: "ธ.กสิกร (K-Plus)", initial: "K+", color: "#138f2d", category: "finance", websiteHints: ["kasikornbank.com", "kbank.co.th"] },
  { key: "scb", label: "ธ.ไทยพาณิชย์", initial: "SCB", color: "#4e2982", category: "finance", websiteHints: ["scb.co.th"] },
  { key: "promptpay", label: "พร้อมเพย์/ทรูมันนี่", initial: "₿", color: "#f37021", category: "finance" },
  { key: "netflix", label: "Netflix", initial: "N", color: "#e50914", category: "entertainment", websiteHints: ["netflix.com"] },
  { key: "spotify", label: "Spotify", initial: "S", color: "#1db954", category: "entertainment", websiteHints: ["spotify.com"] },
  { key: "steam", label: "Steam", initial: "S", color: "#1b2838", category: "games", websiteHints: ["steampowered.com", "steamcommunity.com"] },
  { key: "wifi", label: "Wi-Fi / Router", initial: "📶", color: "#475569", category: "system" },
  { key: "generic", label: "ทั่วไป", initial: "•", color: "#6366f1", category: "other" },
] as const;

export type VaultCategory =
  | "social"
  | "email"
  | "work"
  | "finance"
  | "shopping"
  | "entertainment"
  | "games"
  | "system"
  | "other";

export const VAULT_CATEGORIES: readonly { key: VaultCategory; label: string }[] = [
  { key: "social", label: "โซเชียล" },
  { key: "email", label: "อีเมล" },
  { key: "work", label: "ทำงาน/พัฒนา" },
  { key: "finance", label: "การเงิน/ธนาคาร" },
  { key: "shopping", label: "ช้อปปิ้ง" },
  { key: "entertainment", label: "บันเทิง/สตรีมมิ่ง" },
  { key: "games", label: "เกม" },
  { key: "system", label: "อุปกรณ์/Wi-Fi" },
  { key: "other", label: "อื่น ๆ" },
] as const;

const PRESET_BY_KEY = new Map<string, VaultBrandPreset>(VAULT_BRAND_PRESETS.map((p) => [p.key, p]));

export function findVaultBrandPreset(brandKey: string | null | undefined): VaultBrandPreset {
  if (!brandKey) return PRESET_BY_KEY.get("generic")!;
  return PRESET_BY_KEY.get(brandKey) ?? PRESET_BY_KEY.get("generic")!;
}

/** ทาย brand จากชื่อบริการ + URL — ใช้ตอนผู้ใช้กรอกฟอร์ม */
export function guessVaultBrandKey(input: { serviceName?: string; websiteUrl?: string }): string {
  const name = (input.serviceName ?? "").toLowerCase().trim();
  const url = (input.websiteUrl ?? "").toLowerCase().trim();
  for (const p of VAULT_BRAND_PRESETS) {
    if (p.key === "generic") continue;
    if (name === p.key || name === p.label.toLowerCase()) return p.key;
    if (p.websiteHints?.some((h) => url.includes(h))) return p.key;
    if (p.websiteHints?.some((h) => name.includes(h.split(".")[0]))) return p.key;
  }
  return "generic";
}
