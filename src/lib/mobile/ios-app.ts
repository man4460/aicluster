/**
 * ลิงก์ติดตั้ง iOS
 *
 * ปกติ **ไม่ต้องตั้งเอง** — `npm run ios:publish-ipa` จะวาง IPA + manifest ไว้ที่
 * `public/downloads/ios/` แล้ว `next.config.ts` สร้างลิงก์ `itms-services://` ให้ตอน build
 *
 * ตั้ง env `NEXT_PUBLIC_MAWELL_IOS_INSTALL_URL` เมื่อต้องการ override เช่น:
 * - TestFlight: https://testflight.apple.com/join/XXXX
 * - App Store:  https://apps.apple.com/app/idXXXXXXXX
 */
export const MAWELL_IOS_BUNDLE_ID = "com.mawell.app";

export const MAWELL_IOS_APP_VERSION = "1.0.1";

/** พาธสำรองถ้าโฮสต์ไฟล์ OTA เอง (หลังมี IPA + manifest บน Mac) */
export const MAWELL_IOS_MANIFEST_PATH = "/downloads/ios/manifest.plist";

export function getMawellIosInstallUrl(): string | null {
  const fromEnv = process.env.NEXT_PUBLIC_MAWELL_IOS_INSTALL_URL?.trim();
  if (fromEnv) return fromEnv;
  return null;
}

export function isMawellIosInstallReady(): boolean {
  return Boolean(getMawellIosInstallUrl());
}
