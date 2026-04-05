# เทมเพลตระบบย่อยในแดชบอร์ด (อ้างอิง: รายรับ–รายจ่าย)

เอกสารนี้สรุปรูปแบบที่ใช้ใน **ระบบรายรับรายจ่าย** (`home-finance`) เพื่อให้สร้างระบบอื่นในโปรเจกต์เดียวกันได้สอดคล้องกัน — เปลี่ยนเฉพาะชื่อโดเมน, slug โมดูล, โมเดล Prisma และเส้นทาง URL

---

## 1. หลักการรวม

| ชั้น | บทบาท |
|------|--------|
| **Prisma** | ตารางผูก `ownerUserId` → `User`, ชื่อตาราง `snake_case` ผ่าน `@@map` |
| **โมดูล** | ลงทะเบียน slug + `group_id` ในระบบ subscribe / `module_list` |
| **Guard** | Layout เรียก `require*Section()` → ภายในใช้ `requireModulePage(SLUG)` |
| **API** | `src/app/api/<ระบบ>/...` — `requireSession` → `getModuleBillingContext` → 403 ถ้า staff หรือไม่มีสิทธิ์ |
| **แอป** | `layout.tsx` (server) + `Shell` (client, เมนูย่อย) + หน้า thin ส่ง `section` เข้า `*Client` เดียว |
| **Validation** | Zod ใน `src/lib/<ระบบ>/` แยกจาก route — ข้อความไทยใน response |

---

## 2. แผนที่ไฟล์ (ตัวอย่างจริง)

```
src/systems/home-finance/
  homeFinanceSection.ts          # union section + derive จาก pathname
  lib/guard.ts                   # requireHomeFinanceSection → requireModulePage
  components/
    HomeFinanceShell.tsx         # header + nav ย่อย + {children}
    HomeFinanceClient.tsx        # logic หนัก + fetch
    HomeFinanceUi.tsx            # presentational / ฟอร์มย่อย (ถ้าแยก)
    HomeFinanceImageLightbox.tsx

src/app/(dashboard)/dashboard/home-finance/
  layout.tsx                     # await requireHomeFinanceSection(); <Shell>{children}</Shell>
  page.tsx                       # <HomeFinanceClient section="dashboard" />
  history/page.tsx               # section="history"
  categories/ utilities/ vehicles/ reminders/ ...

src/app/api/home-finance/
  entries/route.ts, entries/[id]/route.ts
  categories/, utilities/, vehicles/, reminders/, upload/

src/lib/home-finance/
  entry-schema.ts                # Zod + zodFirstIssueMessage
  entry-date.ts                  # วันที่ YMD / ช่วง query
```

ระบบใหม่: แทนที่ `home-finance` / `HomeFinance` / `homeFinance` ด้วย prefix ของโดเมน (เช่น `inventory`, `Inventory`)

**ตัวอย่างโครงเดียวกัน (หลายหน้าน้อยกว่า):** `building-pos` — `buildingPosSection.ts`, `lib/guard.ts`, `components/BuildingPosShell.tsx` (หัวข้ออย่างเดียว), `BuildingPosUnifiedMenuBar.tsx` การ์ดเมนูเดียวรวมลิงก์หน้า + แท็บย่อย + รีเฟรช — ใช้ทั้งหน้าแดชบอร์ดและยอดขาย, `dashboard/building-pos/layout.tsx`, หน้า `page.tsx` + `sales/page.tsx`

---

## 3. โมดูลและการนำทาง

1. **`src/lib/modules/config.ts`**  
   - ค่าคงที่ `*_MODULE_SLUG`, `*_MODULE_GROUP_ID`  
   - เพิ่ม case ใน `displayAppModuleTitle` ถ้าต้องการชื่อแสดงพิเศษ

2. **`src/lib/dashboard-system-catalog.ts`**  
   - การ์ด `DASHBOARD_LIVE_SYSTEMS`: `href`, `label`, `emoji`

3. **`src/lib/dashboard-nav.ts`**  
   - แมป `slug` → path แดชบอร์ดของระบบ (ถ้ามี logic พิเศษ)

4. **Seed / DB**  
   - แถวใน `module_list` ต้องตรง slug ที่ config

---

## 4. Layout และ Section

- **อย่าใช้** `pathname.includes("history")` แบบกว้าง — ใช้ segment หลัง base path เหมือน `deriveHomeFinanceSection` ใน `homeFinanceSection.ts`
- **Shell** รับผิดชอบ: หัวข้อระบบ, คำอธิบายสั้น, เมนูย่อย, สไตล์ `app-surface`, `rounded-2xl`, สีโทนม่วง (`#2e2a58`, `#4d47b6`)
- **หน้าแต่ละเส้นทาง** เป็น thin component — ส่ง prop `section` เข้า client เดียวเพื่อลด duplicate

---

## 5. API Route — แพทเทิร์นมาตรฐาน

```text
GET/POST/PATCH/DELETE
  → requireSession() → 401 ถ้าไม่ล็อกอิน
  → getModuleBillingContext(sub)
  → ถ้าไม่มี ctx หรือ isStaff → 403 + ข้อความไทยชัดเจน
  → prisma กรองด้วย ownerUserId = ctx.billingUserId
  → body/query validate ด้วย Zod
  → (ถ้ามี) writeSystemActivityLog สำหรับ audit
```

- **Upload** (ถ้ามี): จำกัด MIME/ขนาด, โฟลเดอร์ใต้ `public/uploads/<ระบบ>/`, ชื่อไฟล์ไม่ลื่นไถลด้วย user id + timestamp

---

## 6. Client และข้อมูล

- Fetch ไป `/api/home-finance/...` พร้อม credentials
- จัดการ state ฟอร์ม, modal, ช่วงวันที่สรุป/กราฟ ใน client หลัก
- แยก UI ซ้ำๆ ไป `HomeFinanceUi.tsx` เมื่อไฟล์ client ใหญ่เกินไป

---

## 7. Lightbox คลิกดูรูป — สัดส่วนตาม device

ใช้เป็นต้นแบบเมื่อระบบมีรูปสลิป / รูปแนบ / รูปโปรไฟล์ย่อยที่คลิกแล้วขยายเต็มจอ

**หลักการ**

| หัวข้อ | ทำอย่างไร |
|--------|------------|
| ขนาดรูป | `img` ใช้ `h-auto w-auto object-contain` จำกัดด้วย **`max-h`** + **`max-w`** ที่อิง **dynamic viewport** (`dvh` / `dvw`) ไม่ใช้ความกว้างคงที่ px เป็นหลัก |
| เว้นที่ UI | `max-h` ใช้ `min(85dvh, calc(100dvh - 7rem))` เผื่อแถบปุ่มปิด — `max-w` ใช้ `min(92dvw, calc(100dvw - 1.5rem))` เผื่อ padding |
| มือถือ / notch | padding โอเวอร์เลย์ + ปุ่มปิด ใช้ **`env(safe-area-inset-*)`** ร่วมกับค่าขั้นต่ำ px |
| เลื่อนได้ | ห่อรูปด้วย `flex … min-h-0 min-w-0 overflow-auto` กรณีรูปสูงมากบนจอเล็ก |
| พฤติกรรม | คลิกพื้นหลังปิด, **Escape** ปิด, `body { overflow: hidden }` ตอนเปิด |
| โค้ดอ้างอิง | คัดลอก/ปรับจาก `HomeFinanceImageLightbox.tsx` |

**เช็กลิสต์ระบบใหม่ที่มี lightbox**

- [ ] คอมโพเนนต์แยกไฟล์ (`*ImageLightbox.tsx`) รับ `src | null`, `onClose`, `alt`  
- [ ] ไม่ใช้ `w-full` บนรูปเต็มจอถ้าต้องการให้สัดส่วนตามทั้งกว้างและสูง — ใช้ `object-contain` + จำกัดสองแกน  
- [ ] z-index สูงพอ (`z-[100]` หรือตามดีไซน์ระบบ) ไม่ให้ถูกทับโดยแถบ/โมดัลอื่น

---

## 8. Prisma — checklist

- [ ] ทุกแถวมี `ownerUserId` + relation `onDelete: Cascade` ที่สมเหตุสมผล  
- [ ] `@@index` สำหรับ query หลัก (owner + วันที่ / หมวด)  
- [ ] `Decimal` สำหรับเงิน, วันที่ธุรกิจใช้ `@db.Date` เมื่อไม่ต้องการเวลา  
- [ ] Enum เฉพาะโดเมนอยู่ใน `schema.prisma` พร้อมคอมเมนต์สั้น

---

## 9. เช็กลิสต์ “ระบบใหม่ให้เหมือนรายรับ–รายจ่าย”

1. เพิ่มโมเดล + migrate  
2. เพิ่ม `*_MODULE_SLUG` / group + seed module  
3. `systems/<name>/lib/guard.ts` + `*Section.ts` (derive path)  
4. `Shell` + `Client` (+ `Ui` ถ้าจำเป็น)  
5. `app/(dashboard)/dashboard/<path>/layout.tsx` + หน้าย่อย  
6. `app/api/<path>/...` ครบ CRUD ที่ต้องการ + upload ถ้ามี  
7. `lib/<name>/` สำหรับ Zod และ helper วันที่/รูปแบบ  
8. `dashboard-system-catalog.ts` + `dashboard-nav.ts` + `displayAppModuleTitle`  
9. ถ้ามีรูปคลิกขยาย: lightbox ตาม **หมวด 7** (คัดลอกแพทเทิร์นจาก `HomeFinanceImageLightbox`)  
10. ทดสอบ: เจ้าของ vs พนักงาน (403), ไม่ล็อกอิน (401)

---

## 10. ไฟล์อ้างอิงด่วน

| หน้าที่ | ไฟล์ |
|---------|------|
| derive section | `src/systems/home-finance/homeFinanceSection.ts` |
| guard | `src/systems/home-finance/lib/guard.ts` |
| shell | `src/systems/home-finance/components/HomeFinanceShell.tsx` |
| lightbox รูป (responsive) | `src/systems/home-finance/components/HomeFinanceImageLightbox.tsx` |
| ตัวอย่าง API เต็มรูปแบบ | `src/app/api/home-finance/entries/route.ts` |
| Zod รายการ | `src/lib/home-finance/entry-schema.ts` |
| อัปโหลดรูป | `src/app/api/home-finance/upload/route.ts` |
| โมเดล DB | `prisma/schema.prisma` (บล็อก `HomeFinance*`, `HomeUtility*`, `HomeVehicle*`) |

เมื่อสั่งให้ทำระบบอื่น “แบบเดียวกัน” ให้อ้างอิงเอกสารนี้ + เปลี่ยนเฉพาะโดเมนและ slug โมดูล
