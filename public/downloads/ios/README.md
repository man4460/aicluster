# iOS ติดตั้งจากเว็บ (OTA)

ไฟล์ในโฟลเดอร์นี้ถูก **สร้างอัตโนมัติ** — อย่าแก้มือ อย่า commit

```bash
npm run ios:publish-ipa
```

| ไฟล์ | ที่มา |
|------|------|
| `MAWELL.ipa` | export จาก `xcodebuild` (gitignored) |
| `manifest.plist` | สร้างโดย `scripts/build-ios-ipa.cjs` ชี้ URL จาก `APP_URL` (gitignored) |
| `manifest.plist.example` | ตัวอย่างอ้างอิงเท่านั้น |

เมื่อมีสองไฟล์แรกครบ `next.config.ts` จะสร้างลิงก์ `itms-services://` ให้เอง
ปุ่มติดตั้ง iOS โผล่หลัง `npm run build`

คู่มือเต็ม: `docs/ios-capacitor-mac.md`
