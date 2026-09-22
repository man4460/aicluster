# MAWELL PLATFORM — Brief สำหรับ AI (Gemini / อื่น ๆ)

อัปเดต: กันยายน 2026 · แหล่งความจริงในโค้ด: `src/lib/modules/config.ts`, Knowledge API `/api/ai/platform/*`  
เอกสารคู่: `docs/MAWELL-GEMINI-TOOLS.md`

---

## 1. คืออะไร

**MAWELL** (หจก.มาเวล) เป็น SaaS ธุรกิจไทย — รวมระบบหลังบ้านหลายโมดูลในบัญชีเดียว  
ผู้ใช้สมัคร → เติมโทเคน / สมัครโมดูล → ใช้แดชบอร์ด `/dashboard/...`  
โดเมนผลิตมักเป็น `https://app.ma-well.com`

Tagline: แพลตฟอร์มเดียวครบระบบหลังบ้าน องค์กร ธุรกิจ โรงเรียน — โมดูลฟรีหลายระบบ และสายรายวันประมาณ 1 บาทต่อวันต่อระบบ

มีเว็บ + Capacitor (Android/iOS) + PWA · Chat AI «เลขาส่วนตัว» ที่ `/dashboard/chat-ai`

---

## 2. Tech stack

- Next.js App Router · React · TypeScript · Tailwind
- MySQL + Prisma
- Auth: session cookie · Google OAuth (ทางเลือก)
- AI ในแอป: Ollama / OpenClaw · OCR สลิป → บันทึกรายรับ–รายจ่าย
- อื่น ๆ: MQTT · PromptPay QR · พิมพ์ใบเสร็จ · face check-in

---

## 3. บทบาท

| Actor | หมายเหตุ |
|-------|----------|
| Owner (`UserRole.USER`) | เจ้าของร้าน — ข้อมูลผูก `ownerUserId` |
| Admin (`UserRole.ADMIN`) | `/dashboard/admin` |
| Staff | ไม่ใช่ UserRole — PIN / QR / staff kiosk ของโมดูล |
| ลูกค้าสาธารณะ | พอร์ทัลไม่ล็อกอิน |

Sandbox: `trialSessionId` — `"prod"` = ของจริง · ค่าอื่น = ทดลอง

---

## 4. โมเดลธุรกิจ

- **สายรายวัน:** หัก ~1 โทเคน / โมดูล / วัน (Asia/Bangkok) เมื่อเข้าใช้โมดูลที่ต้องจ่าย
- **โมดูลฟรี (ไม่หักรายวัน):** `wait-queue`, `appointment-queue`, `loyalty-stamp`, `school-bank`, `community-coop`, `prompt-library`, `vault`, `general-store-pos`
- ลูกค้าเห็นกลุ่มโมดูล **1 (Basic)** เป็นหลัก
- `smart-police` ซ่อน UI · `mqtt-service` เปิดด้วย feature flag
- QR/ลิงก์สาธารณะบนสายรายวัน: จำกัด ยกเว้นโมดูลฟรี + `lms`
- CTA แพ็ก 199/เดือนบน UI: ปิดชั่วคราว

---

## 5. ฟีเจอร์แพลตฟอร์มร่วม

- Shell: sidebar · dock มือถือต่อโมดูล · ยุบหัวโมดูล
- ตั้งค่าร้าน: พื้นฐาน · การเงิน · เว็บ · เวลาเปิด · ลิงก์/QR
- พิมพ์: ใบเสร็จ / ใบกำกับ — ขายแพ็กติ๊กใบกำกับ → พิมพ์ใบกำกับอย่างเดียว (ห้ามคู่ใบเสร็จตอน auto-print)
- เวลาธุรกิจ: **Asia/Bangkok** (`@/lib/time/bangkok`)
- UI กลาง: `@/components/app-templates` (รูป · กราฟ · อัปโหลด · ลายเซ็น · พิมพ์)
- แม่แบบ UX โมดูลร้าน: **ซักผ้า** (ล่าสุด) · **คาร์แคร์** (baseline)

---

## 6. โมดูลหลัก (slug → ชื่อ)

### ฟรี
- `general-store-pos` POS ร้านทั่วไป (ง่าย)
- `wait-queue` คิวหน้าร้าน
- `appointment-queue` จองคิวอัจฉริยะ → `/appointment-queue/[ownerId]`
- `loyalty-stamp` สะสมแต้ม → `/loyalty-stamp/[ownerId]`
- `school-bank` ธนาคารโรงเรียน
- `community-coop` สหกรณ์ชุมชน
- `prompt-library` คลังคำสั่ง AI
- `vault` คลังรหัสผ่าน

### สายรายวัน (ตัวอย่างสำคัญ)
- `attendance` เช็คอินอัจฉริยะ → `/check-in/[ownerId]`
- `income-expense-basic` บันทึกส่วนตัว → `/dashboard/home-finance`
- `dormitory` หอพัก → `/dorm/[ownerId]`
- `village` หมู่บ้าน → `/village/[ownerId]`
- `barber` ร้านตัดผม → `/barber/[ownerId]`
- `car-wash` คาร์แคร์ → `/car-wash/[ownerId]`
- `football-turf` สนามฟุตบอล
- `massage` ร้านนวด
- `laundry` รับฝากซักผ้า → `/laundry/[ownerId]`
- `parking` จอดรถ
- `building-pos` POS ร้านอาหาร
- `drink-pos` POS เครื่องดื่ม
- `hotel-resort` โรงแรม/รีสอร์ท
- `ecommerce-store` ร้านออนไลน์ → `/shop/[storeId]`
- `used-car-showroom` โชว์รูมรถ → `/car/[slug]`
- `club-event` ชมรม → `/club/[slug]`
- `lms` LMS → `/lms/[slug]` (QR รายวันได้)
- `educare` เช็คนักเรียน
- `asset` ทรัพย์สิน
- `doc-transmission` สารบรรณ
- `media-registry` ทะเบียนสื่อ
- `inventory` สต๊อก
- `pro-resume` เรซูเม่ → `/resume/[slug]`
- `smart-guard-tour` **ธุรกิจ รปภ.** (จุดตรวจ · สายตรวจ · กะ · เหตุการณ์)
- `mqtt-service` MQTT (feature flag)

กลุ่ม 2–5 มี placeholder ใน seed — ยังไม่พร้อมขายทั่วไป

---

## 7. ความสามารถซ้ำในโมดูลบริการ

แดชบอร์ดสถิติ · การเงิน+กราฟ+สลิป · แพ็กสมาชิก (ขาย/หัก+ลายเซ็น+พิมพ์) · จองคิว · พอร์ทัลลูกค้า · Hub QR · staff kiosk · ตั้งค่า 5 แท็บ · popup กลาง

---

## 8. ข้อห้ามเมื่อออกแบบ/แก้โค้ด

1. อย่าใช้ UTC date เป็นวันธุรกิจไทย  
2. อย่าใส่แบรนด์ซ้ำใน chrome โมดูล  
3. อย่าสร้าง lightbox/กราฟ/พิมพ์เองถ้ามีใน app-templates  
4. อย่าอ้างว่ากลุ่ม 2–5 พร้อมขาย  
5. Knowledge API นี้ **ไม่** เปิดข้อมูลลูกค้าจริง

---

## 9. เรียกความรู้แบบสด (แนะนำคู่กับไฟล์นี้)

ตั้ง `MAWELL_AI_KNOWLEDGE_API_KEY` แล้วเรียก:

- `GET /api/ai/platform`
- `GET /api/ai/platform/modules?visibleOnly=true`
- `GET /api/ai/platform/modules/{slug}`
- `GET /api/ai/platform/rules?topic=billing`
- `GET /api/ai/platform/tools`

Header: `Authorization: Bearer <key>`

รายละเอียด tools สำหรับ Gemini: ดู `docs/MAWELL-GEMINI-TOOLS.md`
