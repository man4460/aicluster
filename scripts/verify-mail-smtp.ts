/**
 * ทดสอบ SMTP / Gmail OAuth โดยไม่ส่งอีเมล — รัน: npx tsx scripts/verify-mail-smtp.ts
 */
import "dotenv/config";
import { createMailTransporter } from "../src/lib/mail";

function modeLabel(): string {
  const rt = process.env.GMAIL_OAUTH_REFRESH_TOKEN?.trim();
  const u = process.env.GMAIL_SENDER_EMAIL?.trim() || process.env.SMTP_USER?.trim();
  const cid =
    process.env.GMAIL_OAUTH_CLIENT_ID?.trim() ||
    process.env.GOOGLE_CLIENT_ID?.trim();
  const cs =
    process.env.GMAIL_OAUTH_CLIENT_SECRET?.trim() ||
    process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (rt && u && cid && cs) return "Gmail OAuth2";
  if (process.env.SMTP_HOST?.trim()) return `SMTP (${process.env.SMTP_HOST})`;
  return "ไม่ได้ตั้งค่า";
}

async function main() {
  console.log("โหมด:", modeLabel());
  const t = createMailTransporter();
  if (!t) {
    console.error("FAIL: ตั้ง GMAIL_OAUTH_* ครบชุด หรือ SMTP_HOST + SMTP_USER + SMTP_PASS");
    process.exit(1);
  }
  try {
    await t.verify();
    console.log("OK: เชื่อมต่อ SMTP / ยืนยันตัวตนสำเร็จ (ยังไม่ได้ส่งอีเมลจริง)");
  } catch (e) {
    console.error("FAIL:", e instanceof Error ? e.message : e);
    process.exit(1);
  }
}

void main();
