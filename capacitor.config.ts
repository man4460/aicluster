import type { CapacitorConfig } from "@capacitor/cli";

/**
 * แอปโหลดเว็บจาก URL นี้
 * - Play / โปรดักชัน: ตั้ง CAPACITOR_SERVER_URL หรือใช้ค่าเริ่มต้นด้านล่าง
 * - Dev LAN: CAPACITOR_SERVER_URL=http://192.168.x.x:3000
 */
const serverUrl =
  process.env.CAPACITOR_SERVER_URL?.trim() || "https://buffet.ma-well.com";

const isHttp = serverUrl.startsWith("http://");

const config: CapacitorConfig = {
  appId: "com.mawell.app",
  appName: "MAWELL",
  webDir: "capacitor-www",
  server: {
    url: serverUrl,
    cleartext: isHttp,
  },
  android: {
    allowMixedContent: isHttp,
  },
};

export default config;
