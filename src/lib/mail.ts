import nodemailer from "nodemailer";
import { normalizeAppPublicBase } from "@/lib/url/normalize-app-public-base";

function appUrl() {
  const raw = (process.env.APP_URL ?? "").trim().replace(/\/$/, "");
  if (!raw) return "http://localhost:3000";
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return normalizeAppPublicBase(raw);
  }
  return raw;
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const resetUrl = `${appUrl()}/reset-password?token=${encodeURIComponent(token)}`;

  const host = process.env.SMTP_HOST;
  if (!host) {
    console.warn("[mail] SMTP_HOST not set — reset link (dev):", resetUrl);
    return;
  }

  const port = Number(process.env.SMTP_PORT ?? "587");
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? `"MAWELL Buffet" <noreply@mawell.local>`,
    to,
    subject: "รีเซ็ตรหัสผ่าน — MAWELL Buffet",
    text: `คลิกลิงก์เพื่อตั้งรหัสผ่านใหม่:\n${resetUrl}\n\nลิงก์หมดอายุใน 1 ชั่วโมง`,
    html: `<p>คลิกลิงก์เพื่อตั้งรหัสผ่านใหม่:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>ลิงก์หมดอายุใน 1 ชั่วโมง</p>`,
  });
}
