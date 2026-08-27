# แอป iOS MAWELL — build บน Mac + ให้ลูกค้าดาวน์โหลดติดตั้งเอง

อัปเดต: 2026-08-27
เครื่อง build = Mac เครื่องเดียวกับที่รันเว็บ (`app.ma-well.com` ผ่าน PM2 + Cloudflare Tunnel)

แอปเป็น **Capacitor** ครอบเว็บโปรดักชัน (`capacitor.config.ts` → `https://app.ma-well.com`)
แก้เว็บแล้ว **ไม่ต้อง** build แอปใหม่ — build ใหม่เฉพาะเมื่อแตะ plugin native / permission / ไอคอน

---

## ข้อบังคับของ Apple (ข้ามไม่ได้)

ให้ลูกค้า "ดาวน์โหลดแล้วติดตั้งเอง" บน iPhone ได้ **ต้องเซ็นแอปด้วยบัญชี Apple Developer**
ต่างจาก Android ที่แจก APK ได้ฟรี

| ทาง | ค่าใช้จ่าย | ติดตั้งเองจากเว็บ | ข้อจำกัด |
|---|---|---|---|
| **Ad Hoc + OTA** | 99 USD/ปี | ได้ (Safari) | ต้องลงทะเบียน UDID ของแต่ละเครื่อง · จำกัด 100 เครื่อง/ปี |
| **TestFlight** | 99 USD/ปี | ได้ (ผ่านแอป TestFlight) | เชิญด้วยอีเมล/ลิงก์ · Apple review รอบแรก · หมดอายุ 90 วัน |
| **App Store** | 99 USD/ปี | ได้ (ทุกคน) | ผ่าน review ทุกเวอร์ชัน |
| **Enterprise** | 299 USD/ปี | ได้ ไม่จำกัดเครื่อง | Apple อนุมัติยาก · ต้องเป็นนิติบุคคลขนาดใหญ่ |
| **PWA (ทำแล้ว)** | ฟรี | เพิ่มไปหน้าจอโฮม | ไม่ใช่ native · ใช้ Bluetooth printer ไม่ได้ |

ถ้ายังไม่มีบัญชี — เว็บจะโชว์คู่มือ PWA ให้อัตโนมัติ (ปุ่มติดตั้ง native ซ่อนไว้)

---

## ครั้งแรก: ตั้งค่าบัญชี Apple ในเครื่อง

1. สมัคร <https://developer.apple.com/programs/> (99 USD/ปี — ใช้เวลาอนุมัติ ~1–2 วัน)
2. เปิด Xcode → **Settings → Accounts → +** → ใส่ Apple ID
3. เลือกทีม → **Manage Certificates → + → Apple Development / Distribution**
4. ตรวจว่ามีใบรับรองแล้ว:

```bash
security find-identity -v -p codesigning     # ต้องไม่ขึ้น "0 valid identities found"
```

5. (Ad Hoc เท่านั้น) ลงทะเบียนเครื่องที่จะติดตั้ง — <https://developer.apple.com/account/resources/devices/list>
   หา UDID: ต่อ iPhone กับ Mac → Finder → คลิกชื่อเครื่อง → คลิกบรรทัดรุ่น/ซีเรียลจนขึ้น UDID
6. จด **Team ID** (10 ตัวอักษร) จาก <https://developer.apple.com/account> → Membership
   ใส่ใน `.env` ก็ได้: `IOS_DEVELOPMENT_TEAM=ABCDE12345`

---

## build + ปล่อยให้ติดตั้งเอง (คำสั่งเดียว)

```bash
cd /Users/mawell/aicluster
npm run ios:publish-ipa                  # ad-hoc + สร้าง manifest OTA
npm run build && pm2 restart mawell-serve
```

สคริปต์ `scripts/build-ios-ipa.cjs` ทำให้ทั้งหมด:

1. `cap sync ios`
2. `xcodebuild archive` (signing อัตโนมัติ · เวอร์ชันจาก `MAWELL_IOS_APP_VERSION` · build number = timestamp)
3. `xcodebuild -exportArchive` → IPA
4. คัดลอกไป `public/downloads/ios/MAWELL.ipa`
5. สร้าง `public/downloads/ios/manifest.plist` ชี้ URL จริงจาก `APP_URL`

`next.config.ts` เห็นไฟล์ทั้งสองแล้ว **สร้างลิงก์ `itms-services://` ให้เอง** →
ปุ่ม **ดาวน์โหลดติดตั้ง iOS** โผล่ที่หน้าแรก · `/download-app` · การ์ดในแดชบอร์ด (ไม่ต้องแก้โค้ดหรือตั้ง env)

### ตัวเลือกสคริปต์

```bash
npm run ios:build-check                        # ทดสอบ compile บน simulator (ไม่ต้องมี certificate)
npm run ios:publish-ipa -- --team ABCDE12345   # ระบุ Team ID
npm run ios:publish-ipa -- --method development # ใช้ระหว่างพัฒนา
npm run ios:publish-ipa:appstore               # ได้ IPA ไปอัปโหลด App Store Connect / TestFlight
npm run ios:publish-ipa -- --base-url https://dev.ma-well.com
```

---

## ลูกค้าติดตั้งอย่างไร

1. เปิด `https://app.ma-well.com/download-app#ios` ด้วย **Safari** (Chrome บน iOS ติดตั้งไม่ได้)
2. กดปุ่มม่วง → ระบบถาม "ติดตั้ง MAWELL?" → ตกลง
3. ไอคอนขึ้นบนหน้าจอโฮม
4. ครั้งแรกอาจต้อง **ตั้งค่า → ทั่วไป → VPN และการจัดการอุปกรณ์ → เชื่อถือ MAWELL**

---

## ถ้าใช้ TestFlight แทน OTA

```bash
npm run ios:publish-ipa:appstore
```

อัปโหลด IPA จาก `build/ios/export/` ด้วย Xcode Organizer หรือ Transporter → เชิญผู้ทดสอบ →
ตั้งใน `.env` แล้วรีสตาร์ท:

```bash
NEXT_PUBLIC_MAWELL_IOS_INSTALL_URL="https://testflight.apple.com/join/XXXX"
```

env นี้ **override** ลิงก์ OTA อัตโนมัติ

---

## ขึ้นเวอร์ชันใหม่

แก้ `MAWELL_IOS_APP_VERSION` ใน `src/lib/mobile/ios-app.ts` → `npm run ios:publish-ipa` → `npm run build` → restart
(Xcode `MARKETING_VERSION` ถูก override จากสคริปต์ ไม่ต้องแก้มือ)

---

## ปัญหาที่พบบ่อย

| อาการ | แก้ |
|---|---|
| `0 valid identities found` | ยังไม่มี certificate — ทำขั้นตอน "ครั้งแรก" ด้านบน |
| `iOS 26.4 is not installed` | `xcodebuild -downloadPlatform iOS` (~8.5 GB) |
| ติดตั้งแล้วขึ้น "ไม่สามารถติดตั้งแอปได้" | UDID ของเครื่องนั้นไม่ได้ลงทะเบียน (Ad Hoc) — เพิ่ม UDID แล้ว build ใหม่ |
| ปุ่ม iOS ไม่โผล่บนเว็บ | ยังไม่มี `public/downloads/ios/MAWELL.ipa` + `manifest.plist` หรือยังไม่ `npm run build` |
| กดปุ่มแล้วไม่มีอะไรเกิด | ต้องเปิดด้วย Safari และเว็บต้องเป็น https |
| plugin เครื่องพิมพ์ Bluetooth ไม่ทำงาน | `@delicity/capacitor-thermal-printer` ไม่มี Package.swift → ไม่รองรับ SPM ของ Capacitor 8 (Android ใช้ได้) |

---

## เช็คลิสต์

- [ ] Apple Developer Program อนุมัติแล้ว
- [ ] certificate ในเครื่อง (`security find-identity -v -p codesigning`)
- [ ] UDID ลงทะเบียน (ถ้า Ad Hoc)
- [ ] `npm run ios:publish-ipa` ผ่าน
- [ ] `npm run build` + restart PM2
- [ ] ทดสอบบน iPhone จริงผ่าน Safari
