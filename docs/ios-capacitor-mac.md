# คู่มือ build แอป MAWELL บน Mac (iOS / Capacitor)

อัปเดต: 2026-08-27  
ใช้เมื่อพร้อมทำ iOS บนเครื่อง Mac ที่เป็นเซิร์ฟเวอร์/เครื่อง build

---

## สิ่งที่ต้องมี

- Mac + **Xcode** ล่าสุดที่รองรับ
- บัญชี **Apple Developer** (จ่ายรายปี)
- โปรเจกต์นี้ clone แล้ว (`appId` = `com.mawell.app`)
- โหนด Node 22 (เช่น `nvm use 22`)

แอป Capacitor ชี้เว็บโปรดักชัน: `https://app.ma-well.com` (`capacitor.config.ts`)

---

## ขั้นตอนบน Mac

```bash
cd /path/to/Ai\ Cluster   # หรือโฟลเดอร์โปรเจกต์
nvm use 22
npm ci
npx cap sync ios
npm run cap:ios           # เปิด Xcode
```

ใน Xcode:

1. เลือก target **App** → **Signing & Capabilities**
2. ใส่ Team (Apple Developer) · Bundle ID ต้องเป็น `com.mawell.app`
3. เลือกอุปกรณ์จริง หรือ Any iOS Device
4. **Product → Archive**
5. กระจายด้วยอย่างใดอย่างหนึ่ง:
   - **TestFlight / App Store Connect** (แนะนำลูกค้าทั่วไป)
   - **Ad Hoc / Enterprise** + ไฟล์ `manifest.plist` สำหรับติดตั้งจากเว็บ (องค์กร)

---

## หลังได้ลิงก์ติดตั้ง — เปิดบนเว็บอัตโนมัติ

ตั้ง env บนเซิร์ฟเวอร์เว็บ (เช่น `app.ma-well.com`):

```bash
NEXT_PUBLIC_MAWELL_IOS_INSTALL_URL="https://testflight.apple.com/join/XXXX"
```

หรือลิงก์ App Store / `itms-services://?...manifest.plist`

แล้ว **รีสตาร์ท** Next / PM2

หน้าเว็บจะโชว์ปุ่ม **ดาวน์โหลดติดตั้ง iOS** เอง (ไม่ต้องแก้โค้ด)

---

## OTA ติดตั้งจากเว็บ (Enterprise / Ad Hoc)

1. Export IPA จาก Xcode
2. อัปโหลด IPA + `manifest.plist` ไปที่ `public/downloads/ios/`
3. ตั้ง  
   `NEXT_PUBLIC_MAWELL_IOS_INSTALL_URL=itms-services://?action=download-manifest&url=https://app.ma-well.com/downloads/ios/manifest.plist`
4. ลูกค้าเปิด **Safari** → กดปุ่มติดตั้งบนหน้า `/download-app`

ตัวอย่างโครง `manifest.plist` ดูใน `public/downloads/ios/manifest.plist.example`

---

## Sync URL เว็บ

ถ้าเปลี่ยนโดเมน:

```bash
# ตรวจ capacitor.config.ts = https://app.ma-well.com
npx cap sync ios
```

แล้ว Archive ใหม่ใน Xcode

---

## เช็คลิสต์

- [ ] Apple Developer + Signing ใน Xcode ผ่าน
- [ ] Archive สำเร็จ
- [ ] มีลิงก์ TestFlight / App Store / OTA
- [ ] ตั้ง `NEXT_PUBLIC_MAWELL_IOS_INSTALL_URL` บนเซิร์ฟเวอร์เว็บ
- [ ] ลองบน iPhone จริง: หน้าแรก → แอปมือถือ / `/download-app` → กดปุ่ม iOS
