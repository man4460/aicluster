import nodemailer, { type Transporter } from "nodemailer";
import { publicRedirectOriginFromRequest } from "@/lib/http/public-redirect-origin";
import { normalizeAppPublicBase } from "@/lib/url/normalize-app-public-base";

function trimEnv(key: string): string | undefined {
  const v = process.env[key]?.trim();
  return v || undefined;
}

function googleMailOAuthClientId(): string | undefined {
  return trimEnv("GMAIL_OAUTH_CLIENT_ID") ?? trimEnv("GOOGLE_CLIENT_ID");
}

function googleMailOAuthClientSecret(): string | undefined {
  return trimEnv("GMAIL_OAUTH_CLIENT_SECRET") ?? trimEnv("GOOGLE_CLIENT_SECRET");
}

/**
 * ลำดับ: Gmail (บัญชี Google) ด้วย OAuth2 → SMTP ทั่วไป (เช่น smtp.gmail.com + App Password)
 * OAuth: ต้องได้ refresh token จาก OAuth consent ที่มี scope `https://www.googleapis.com/auth/gmail.send`
 * (คนละโทเค็นกับล็อกอินด้วย Google ของผู้ใช้ท้ายแอป)
 */
/** สำหรับทดสอบการเชื่อมต่อ (เช่น `scripts/verify-mail-smtp.ts`) */
export function createMailTransporter(): Transporter | null {
  const refreshToken = trimEnv("GMAIL_OAUTH_REFRESH_TOKEN");
  const gmailUser = trimEnv("GMAIL_SENDER_EMAIL") ?? trimEnv("SMTP_USER");
  const clientId = googleMailOAuthClientId();
  const clientSecret = googleMailOAuthClientSecret();

  if (refreshToken && gmailUser && clientId && clientSecret) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: gmailUser,
        clientId,
        clientSecret,
        refreshToken,
      },
    });
  }

  const host = trimEnv("SMTP_HOST");
  if (!host) return null;

  const port = Number(process.env.SMTP_PORT ?? "587");
  const user = trimEnv("SMTP_USER");
  const pass = trimEnv("SMTP_PASS");
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: user && pass ? { user, pass } : undefined,
  });
}

function mailFromAddress(): string {
  const custom = trimEnv("SMTP_FROM");
  if (custom) return custom;
  const sender = trimEnv("GMAIL_SENDER_EMAIL") ?? trimEnv("SMTP_USER");
  if (sender) return `"MAWELL Buffet" <${sender}>`;
  return `"MAWELL Buffet" <noreply@mawell.local>`;
}

/**
 * Origin สำหรับลิงก์ในอีเมล — สอดคล้องกับลิงก์สาธารณะอื่น (NEXT_PUBLIC_APP_URL → APP_URL → VERCEL_URL)
 * ถ้า env ไม่ครบ ใช้ Host จากคำขอลืมรหัสผ่าน (รองรับ reverse proxy / โดเมนจริง)
 */
function passwordResetPublicOrigin(req: Request): string {
  const pub = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (pub && /^https?:\/\//i.test(pub)) {
    return normalizeAppPublicBase(pub);
  }
  const app = process.env.APP_URL?.trim();
  if (app && /^https?:\/\//i.test(app)) {
    return normalizeAppPublicBase(app);
  }
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//i, "");
    return `https://${host}`;
  }
  return publicRedirectOriginFromRequest(req);
}

export async function sendPasswordResetEmail(to: string, token: string, req: Request) {
  const resetUrl = `${passwordResetPublicOrigin(req)}/reset-password?token=${encodeURIComponent(token)}`;

  const transporter = createMailTransporter();
  if (!transporter) {
    console.warn(
      "[mail] ไม่ได้ตั้ง Gmail OAuth (GMAIL_OAUTH_*) หรือ SMTP_HOST — reset link (dev):",
      resetUrl,
    );
    return;
  }

  await transporter.sendMail({
    from: mailFromAddress(),
    to,
    subject: "รีเซ็ตรหัสผ่าน — MAWELL Buffet",
    text: `คลิกลิงก์เพื่อตั้งรหัสผ่านใหม่:\n${resetUrl}\n\nลิงก์หมดอายุใน 1 ชั่วโมง`,
    html: `<p>คลิกลิงก์เพื่อตั้งรหัสผ่านใหม่:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>ลิงก์หมดอายุใน 1 ชั่วโมง</p>`,
  });
}
