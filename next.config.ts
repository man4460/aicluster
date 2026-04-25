import type { NextConfig } from "next";

/**
 * โหมด dev: Next บล็อก cross-origin ไปที่ `/_next/*` — ถ้าเปิดจากมือถือด้วย IP LAN ต้องอนุญาต hostname นั้น
 * ตั้ง ALLOWED_DEV_ORIGINS=host1,host2 (คั่นด้วย comma/ช่องว่าง) เพื่อ **เพิ่ม** นอกเหนือจาก pattern เริ่มต้น (มี *.ma-well.com สำหรับ tunnel แล้ว)
 * (ไม่ตัด 192.168.*.* / 10.* / 172.* ทิ้ง — กันเคสตั้งแค่ host เดียวแล้วเครื่องอื่นโดน 403 ที่ `/_next/*`)
 */
/** รวม *.ma-well.com — โหมด dev ผ่าน Cloudflare Tunnel (Origin ไม่ใช่ localhost) */
const DEFAULT_ALLOWED_DEV_ORIGINS = [
  "127.0.0.1",
  "192.168.*.*",
  "10.*.*.*",
  "172.*.*.*",
  "*.ma-well.com",
] as const;

function parseAllowedDevOrigins(): string[] {
  const raw = process.env.ALLOWED_DEV_ORIGINS?.trim();
  if (!raw) {
    return [...DEFAULT_ALLOWED_DEV_ORIGINS];
  }
  const extras = raw
    .split(/[,;\s]+/)
    .map((s) => {
      const t = s.trim();
      if (!t) return "";
      try {
        if (t.includes("://")) {
          return new URL(t).hostname.toLowerCase();
        }
      } catch {
        /* fall through */
      }
      return t.split(":")[0]!.toLowerCase();
    })
    .filter(Boolean);
  return [...new Set([...DEFAULT_ALLOWED_DEV_ORIGINS, ...extras])];
}

const nextConfig: NextConfig = {
  // ไม่ให้ bundle Prisma เข้า SSR — ใช้ Node process เต็มรูปแบบ (กัน process.once is not a function)
  serverExternalPackages: ["@prisma/client", "prisma"],
  allowedDevOrigins: parseAllowedDevOrigins(),
  async redirects() {
    return [
      {
        source: "/dashboard/chatai",
        destination: "/dashboard/chat-ai",
        permanent: true,
      },
    ];
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...(config.watchOptions ?? {}),
        // ใช้ polling แทน native watch เพื่อให้เสถียรบน mapped drive / UNC path
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ["**/.git/**", "**/.next/**", "**/node_modules/**"],
      };
    }
    return config;
  },
};

export default nextConfig;
