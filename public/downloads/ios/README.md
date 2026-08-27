# iOS ติดตั้งจากเว็บ

วางไฟล์หลัง build บน Mac:

| ไฟล์ | ใช้เมื่อ |
|------|---------|
| `MAWELL.ipa` | แพ็กเกจจาก Xcode (Ad Hoc / Enterprise) |
| `manifest.plist` | จาก `manifest.plist.example` แก้ URL ให้ชี้ IPA |

ลูกค้าติดตั้งผ่าน Safari ด้วยลิงก์ `itms-services://...`  
ตั้งค่า env: ดู `docs/ios-capacitor-mac.md`
