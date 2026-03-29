import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ไม่ให้ bundle Prisma เข้า SSR — ใช้ Node process เต็มรูปแบบ (กัน process.once is not a function)
  serverExternalPackages: ["@prisma/client", "prisma"],
};

export default nextConfig;
