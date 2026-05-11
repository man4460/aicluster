import type { PrismaClient } from "@/generated/prisma/client";
import { encryptVaultPassword } from "@/lib/vault/password-cipher";

type Tx = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends" | "$use"
>;
type DbLike = Tx | PrismaClient;

type VaultDemoSeed = {
  serviceName: string;
  username: string;
  password: string;
  websiteUrl: string | null;
  category: string;
  brandKey: string;
  note: string | null;
  isFavorite: boolean;
  /** จำลองการใช้งานล่าสุด — กี่ชั่วโมงก่อน (null = ยังไม่เคยใช้) */
  lastUsedHoursAgo: number | null;
};

const ENTRIES: VaultDemoSeed[] = [
  {
    serviceName: "Google",
    username: "demo.mawell@gmail.com",
    password: "Mawell-G00gle!2026",
    websiteUrl: "https://accounts.google.com",
    category: "email",
    brandKey: "google",
    note: "บัญชีหลัก — เปิด 2FA ผ่าน Authenticator app",
    isFavorite: true,
    lastUsedHoursAgo: 2,
  },
  {
    serviceName: "Facebook",
    username: "demo.mawell",
    password: "Faceb00k-Demo#2026",
    websiteUrl: "https://www.facebook.com",
    category: "social",
    brandKey: "facebook",
    note: "เพจร้าน + บัญชีส่วนตัว",
    isFavorite: true,
    lastUsedHoursAgo: 10,
  },
  {
    serviceName: "LINE",
    username: "demo_mawell",
    password: "LineDemo!Pass2026",
    websiteUrl: "https://line.me",
    category: "social",
    brandKey: "line",
    note: "LINE OA สำหรับติดต่อลูกค้า",
    isFavorite: false,
    lastUsedHoursAgo: 26,
  },
  {
    serviceName: "Instagram",
    username: "mawell_demo",
    password: "Insta-Demo@2026",
    websiteUrl: "https://www.instagram.com",
    category: "social",
    brandKey: "instagram",
    note: null,
    isFavorite: false,
    lastUsedHoursAgo: 48,
  },
  {
    serviceName: "GitHub",
    username: "mawell-dev",
    password: "ghp-DemoSeed-Mawell-2026",
    websiteUrl: "https://github.com",
    category: "work",
    brandKey: "github",
    note: "Personal access token สำหรับ CI",
    isFavorite: true,
    lastUsedHoursAgo: 5,
  },
  {
    serviceName: "Microsoft 365",
    username: "demo@mawell.local",
    password: "M$365-Demo-2026",
    websiteUrl: "https://login.microsoftonline.com",
    category: "work",
    brandKey: "microsoft",
    note: "Outlook + OneDrive ของบริษัท",
    isFavorite: false,
    lastUsedHoursAgo: 36,
  },
  {
    serviceName: "Apple ID",
    username: "demo.mawell@icloud.com",
    password: "Apple-ID-Demo#2026",
    websiteUrl: "https://appleid.apple.com",
    category: "work",
    brandKey: "apple",
    note: "ใช้กับ iPhone + iCloud — เปิด 2FA",
    isFavorite: false,
    lastUsedHoursAgo: 96,
  },
  {
    serviceName: "Shopee",
    username: "0812345678",
    password: "Shopee@Demo-2026",
    websiteUrl: "https://shopee.co.th",
    category: "shopping",
    brandKey: "shopee",
    note: "ผูก K+ และ TrueMoney",
    isFavorite: false,
    lastUsedHoursAgo: 72,
  },
  {
    serviceName: "Lazada",
    username: "0812345678",
    password: "Lazada-Demo@2026",
    websiteUrl: "https://www.lazada.co.th",
    category: "shopping",
    brandKey: "lazada",
    note: null,
    isFavorite: false,
    lastUsedHoursAgo: 168,
  },
  {
    serviceName: "K-Plus (กสิกร)",
    username: "DEMO00112233",
    password: "K-PLUS-PIN-Demo-2026",
    websiteUrl: "https://www.kasikornbank.com",
    category: "finance",
    brandKey: "kbank",
    note: "PIN และคำถามกู้คืน — อย่าให้ผู้อื่นเห็น",
    isFavorite: true,
    lastUsedHoursAgo: 18,
  },
  {
    serviceName: "Netflix",
    username: "demo.mawell@gmail.com",
    password: "Netflix-Demo!2026",
    websiteUrl: "https://www.netflix.com",
    category: "entertainment",
    brandKey: "netflix",
    note: "แชร์กับครอบครัว 4 จอ",
    isFavorite: false,
    lastUsedHoursAgo: 22,
  },
  {
    serviceName: "Spotify",
    username: "demo.mawell@gmail.com",
    password: "Spotify-Demo@2026",
    websiteUrl: "https://www.spotify.com",
    category: "entertainment",
    brandKey: "spotify",
    note: null,
    isFavorite: false,
    lastUsedHoursAgo: 60,
  },
  {
    serviceName: "Wi-Fi บ้าน",
    username: "MAWELL_WIFI",
    password: "MawellHomeWiFi-2026",
    websiteUrl: null,
    category: "system",
    brandKey: "wifi",
    note: "Router ห้องนั่งเล่น — กล่อง TP-Link",
    isFavorite: false,
    lastUsedHoursAgo: null,
  },
];

export async function seedVaultProdDemoForOwner(db: DbLike, ownerUserId: string): Promise<void> {
  // skip เฉพาะกรณีที่มีรายการตัวอย่างของ seed นี้อยู่ครบแล้ว — ไม่อิงจำนวน entry ที่ผู้ใช้สร้างเอง
  const existingMatched = await db.vaultEntry.count({
    where: {
      ownerUserId,
      OR: ENTRIES.map((e) => ({ serviceName: e.serviceName, username: e.username })),
    },
  });
  if (existingMatched >= ENTRIES.length) return;

  const now = Date.now();
  for (const e of ENTRIES) {
    // เช็คซ้ำ (serviceName + username) — สอดคล้องกับ "บัญชีเดียวกัน" ในมุมผู้ใช้
    const already = await db.vaultEntry.count({
      where: { ownerUserId, serviceName: e.serviceName, username: e.username },
    });
    if (already > 0) continue;
    const lastUsedAt =
      e.lastUsedHoursAgo === null
        ? null
        : new Date(now - e.lastUsedHoursAgo * 60 * 60 * 1000);
    await db.vaultEntry.create({
      data: {
        ownerUserId,
        serviceName: e.serviceName,
        username: e.username,
        passwordEnc: encryptVaultPassword(e.password),
        websiteUrl: e.websiteUrl,
        category: e.category,
        brandKey: e.brandKey,
        note: e.note,
        isFavorite: e.isFavorite,
        lastUsedAt,
      },
    });
  }
}
