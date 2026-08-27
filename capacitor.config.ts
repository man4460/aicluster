import type { CapacitorConfig } from "@capacitor/cli";

/**
 * แอปโหลดเว็บจาก URL นี้
 * - Play / โปรดักชัน: ชี้โดเมนเดียวกับเบราว์เซอร์ (app.ma-well.com) — แก้เว็บแล้วแอปเห็นตาม
 * - ชั่วคราว: ตั้ง CAPACITOR_SERVER_URL
 * - Dev LAN: CAPACITOR_SERVER_URL=http://192.168.x.x:3000
 */
const serverUrl =
  process.env.CAPACITOR_SERVER_URL?.trim() || "https://app.ma-well.com";

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
  plugins: {
    StatusBar: {
      overlaysWebView: false,
      style: "DARK",
      backgroundColor: "#1e1b4b",
    },
  },
  ios: {
    /**
     * ต้องเป็น "never" — WebView ครอบเต็มจอ แล้ว CSS `env(safe-area-inset-*)` ทำงาน
     * ถ้าตั้ง "always" WebKit ถือว่า WebView อยู่ในพื้นที่ปลอดภัยแล้ว → insets = 0
     * และหน้าที่ไม่ scroll ที่ document (เช่นหน้าแรก) จะยังซ้อน status bar
     */
    contentInset: "never",
  },
};

export default config;
// แก้ไฟล์เดิม
