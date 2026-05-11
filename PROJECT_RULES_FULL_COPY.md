# MAWELL (Ai Cluster) — รวมกฎโปรเจกต์

ไฟล์นี้รวม `AGENTS.md` + ทุกไฟล์ใน `.cursor/rules/*.mdc` (UTF-8) — เปิดไฟล์นี้แล้ว Select All เพื่อ copy ครั้งเดียวได้

**แหล่งจริงที่ Cursor ใช้:** ไฟล์ `.mdc` แยกใน `.cursor/rules/` — ถ้าแก้กฎ ให้อัปเดตที่นั่น แล้วรัน `node scripts/compile-cursor-rules.cjs` เพื่อสร้างไฟล์รวมนี้ใหม่

---

## AGENTS.md

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Chat AI / dashboard sidebar (MAWELL)

- **Canonical chat URL:** `/dashboard/chat-ai` only in `<Link>` / nav items; use `canonicalDashboardNavHref()` in `DashboardShell` for sidebar links.
- **Shared layout classes:** `src/systems/chat/personal-ai-chat-shell.ts` — do not duplicate Tailwind strings between `chat-ai-client` skeleton and `PersonalAiChat` / `PersonalAiDailyDigest`.

Details: `CHAT_AI_CODE_FOR_REVIEW.md` §1.1.

---

## .cursor/rules


================================================================================
### .cursor/rules/app-dashboard-brand-cta.mdc
================================================================================

---
description: ปุ่ม CTA แบรนด์ MAWELL — ไล่สีฟ้า→ม่วง→ชมพู (เทมเพลตเดียวกับเติมโทเคน)
globs: "**/dashboard/**/*.tsx,**/app-templates/**/*.ts,**/TokenTopupModal.tsx"
alwaysApply: false
---

# ปุ่ม CTA แบรนด์ (gradient)

- **ไล่สีมาตรฐาน** (แนวนอน): `from-[#0000BF]` → `via-[#8b5cf6]` → `to-[#ec4899]` พร้อม hover มืดลง — อยู่ที่ `appDashboardBrandGradientFillClass` ใน `src/components/app-templates/dashboard-tokens.ts`
- **ปุ่ม pill ข้อความขาว** (เช่น «เติมโทเคน»): ใช้ `appDashboardBrandCtaPillButtonClass` จาก `@/components/app-templates` — ใส่ `w-full` ด้วย `cn(...)` เมื่ออยู่ในแถวเต็มความกว้าง
- **การ์ดโมดูล** (เปิดแผนผัง / Subscribe): ใช้ `appDashboardBrandGradientFillClass` ร่วมกับ `dashboardModulePrimaryButtonCore` / `dashboardModuleSubscribeButtonClass` ใน `DashboardModuleHeroCard` — **ห้าม** คัดลอกชุด hex ไปกำหนด gradient ใหม่ในโมดูลอื่น


================================================================================
### .cursor/rules/app-image-lightbox-centered.mdc
================================================================================

---
description: รูปย่อ/ดูรูปเต็มต้องกึ่งกลางจอและไม่ล้นขอบ
globs:
  - "src/components/app-templates/**/*.{ts,tsx}"
  - "src/systems/**/*.{ts,tsx}"
alwaysApply: false
---

# Image Lightbox — Centered & Fit Viewport

เมื่อเพิ่มหรือแก้ฟีเจอร์ “กดดูรูปเต็ม” (เช่น รูปพนักงาน, สลิป, รูปแนบ) ให้ยึดกฎนี้:

1. ใช้ `AppImageThumb` + `AppImageLightbox` + `useAppImageLightbox` จาก `@/components/app-templates` เท่านั้น
2. `AppImageLightbox` ต้อง render ผ่าน `createPortal(..., document.body)` เพื่อไม่ให้ตำแหน่งเพี้ยนจาก parent layout
3. Overlay ต้องกึ่งกลางจอจริงเสมอ (`fixed inset-0`, `items-center justify-center`)
4. รูปต้องไม่ล้นจอ: ใช้ `object-contain` และจำกัด `max-h/max-w` ตาม viewport (`dvh/dvw`)
5. ชั้นครอบต้องกันล้น (`overflow-hidden`) และรองรับ safe-area มือถือ
6. ปิดได้ 3 ทาง: ปุ่มปิด, คลิกพื้นหลัง, กด `Esc`
7. ห้ามสร้าง lightbox แบบ ad-hoc ในโมดูลย่อย; ถ้าต้องเพิ่มพฤติกรรม ให้ขยายใน `AppImageLightbox`

ตัวอย่าง pattern:
- Thumb: `<AppImageThumb src={url} onOpen={() => lb.open(url)} />`
- Lightbox: `<AppImageLightbox src={lb.src} onClose={lb.close} />`


================================================================================
### .cursor/rules/app-templates-central.mdc
================================================================================

---
description: บังคับให้ใช้ template กลาง @/components/app-templates ก่อนสร้าง UI ซ้ำ — ตรวจทุกครั้งที่แตะฟีเจอร์ที่มีในแพ็กเกจนี้
alwaysApply: true
---

# Template กลาง — ตรวจก่อนเขียน UI

ก่อนเพิ่มหรือแก้ UI ที่เกี่ยวกับ **รูป / lightbox / แดชบอร์ด / กราฟแท่ง / พิมพ์เอกสาร / อัปโหลดสลิป / กล้องถ่ายรูป**:

## บังคับ

1. **เปิดหรือค้น** `src/components/app-templates/index.ts` และโฟลเดอร์ `src/components/app-templates/` — ดูว่ามีคอมโพเนนต์ ฟังก์ชัน หรือโทเค็น (`appTemplate*`, `App*`) ที่ตรงงานหรือไม่
2. **Import จาก** `@/components/app-templates` (barrel) — ห้ามคัดลอกบล็อก JSX/CSS จาก `home-finance`, `building-pos` หรือโมดูลอื่นมาเป็นของใหม่ถ้าหน้าที่เดียวกันมีใน template แล้ว
3. **ถ้ายังไม่มี** สิ่งที่ต้องการ — **ขยายที่ `app-templates`** (คอมโพเนนต์ใหม่ / prop เพิ่ม / โทเค็นใน `dashboard-tokens`) แล้ว export ใน `index.ts` แทนการผูกเฉพาะหน้าเดียว

## หมวดที่ครอบคลุม (สรุป)

- รูปย่อ + ดูเต็มจอ → `AppImageThumb`, `AppImageLightbox`, `useAppImageLightbox` (รายละเอียดเพิ่มในกฎ `app-templates-media.mdc`)
- การ์ดแดชบอร์ด / หัวข้อ / ว่าง → `AppDashboardSection`, `AppSectionHeader`, `AppEmptyState`, โทเค็น `appDashboard*`
- กราฟแท่งเปรียบเทียบ / แท่งรายวัน / แท่งคู่ต่อช่วง / รายได้เทียบต้นทุนรายวัน → `AppCompareBarList`, `AppColumnBarSparkChart`, `AppColumnBarDualSparkChart`, `AppRevenueCostColumnChart`, เลย์เอาต์ `AppSparkChartPanel`, `AppSparkChartsTwoColumnGrid` (รายละเอียดกฎ `app-templates-spark-charts.mdc`)
- พิมพ์ HTML / ย่อรูปก่อนอัปโหลด → `openPrintableHtml`, `printPrintableHtmlInHiddenIframe`, `prepareImageFileForUpload`
- สลิป เลือกรูป ถ่ายกล้อง → `AppGalleryCameraFileInputs`, `AppImagePickCameraButtons`, `AppPickGalleryImageButton`, `AppTakePhotoButton`, `AppCameraCaptureModal`

## ข้อยกเว้น

- โมดูลที่ **ไม่เกี่ยวกับแพทเทิร์นข้างต้น** ไม่ต้องบังคับใช้ template — แต่ถ้าจะทำฟีเจอร์เดียวกันในอนาคต ให้ย้ายมาใช้กลางแทน


================================================================================
### .cursor/rules/app-templates-media.mdc
================================================================================

---
description: Template กลาง app-templates — รูป/lightbox, แดชบอร์ด, กราฟ, พิมพ์, อัปโหลดสลิป (กล้อง/แกลเลอรี)
alwaysApply: true
---

# Template กลาง — รูปแนบ / สลิป / ดูรูปเต็ม

เมื่อทำฟีเจอร์ที่มี **รูปย่อคลิกดูใหญ่**, **สลิป**, **หลักฐานโอน**, หรือ lightbox แบบเดียวกับรายรับ–รายจ่าย:

## บังคับ

- Import จาก **`@/components/app-templates`** เท่านั้น:
  - **`AppImageThumb`** — ปุ่มรูปย่อ (ค่าเริ่ม 64×64) + `onOpen`
  - **`AppImageLightbox`** — overlay ดูรูปเต็ม
  - **`useAppImageLightbox()`** — `{ src, open, close }` คู่กับ Lightbox
- **ห้าม** คัดลอก/เลียนแบบ `HomeFinanceImageLightbox` หรือ `HomeFinanceThumb` เป็นไฟล์ใหม่ในโมดูลอื่น
- **ห้าม** สร้าง lightbox ใหม่ด้วย `fixed inset-0` + `img` เองถ้าเป้าหมายคือ “ดูรูปแนบแบบเดียวกับระบบเดิม” — ขยายที่ `AppImageLightbox` ถ้าต้องการพฤติกรรมเพิ่ม (แล้วได้ทุกหน้าพร้อมกัน)

## แพทเทิร์นมาตรฐาน

```tsx
import { AppImageLightbox, AppImageThumb, useAppImageLightbox } from "@/components/app-templates";

const lb = useAppImageLightbox();

<AppImageThumb src={url} alt="คำอธิบาย" onOpen={() => url && lb.open(url)} />
<AppImageLightbox src={lb.src} onClose={lb.close} alt="คำอธิบาย" />
```

## AppImageThumb — กรอบคงที่ รูปพอดีกรอบ (template มาตรฐาน)

เมื่อแก้หรือเพิ่ม **`AppImageThumb`** (`src/components/app-templates/AppImageThumb.tsx`) หรือเลียนแบบรูปแบบเดียวกัน:

1. **กำหนดขนาดที่ wrapper** (`<button>` / กรอบคลิก) — เช่น `h-16 w-16` + `overflow-hidden` + `rounded-xl` + `ring-2` — ไม่ใช่กำหนดแค่ที่ `<img>` อย่างเดียว เพื่อไม่ให้กรอบกับรูปคนละขนาด
2. **`<img>`** ใช้ **`h-full w-full min-h-0 min-w-0 object-cover object-center`** ให้รูปเต็มกรอบสี่เหลี่ยม ตัดส่วนเกินสม่ำเสมอ ไม่เว้นขอบแปลกจาก intrinsic size
3. **สถานะไม่มีรูป** (`emptyLabel`) — ใช้ **ขนาดเดียวกับมีรูป** (`h-16 w-16` ฯลฯ) + `ring` สอดคล้องกรอบมีรูป
4. **ขนาดอื่น** — ส่ง **`className`** ไปที่ `AppImageThumb` เพื่อ override ขนาดกรอบ เช่น `className="h-20 w-20"` (ทั้งปุ่มและ empty ใช้ className ร่วมกันใน component)
5. **Lightbox ทับโมดัล** — `AppImageLightbox` ใช้ **`z-[240]`** เหนือ `FormModal` (`z-[200]`) และ `AppCameraCaptureModal` (`z-[220]`) — ถ้าแก้ z-index โมดัล ต้องเช็คลำดับซ้อนกับ lightbox

## ความเข้ากันได้

- ชื่อเก่า `HomeFinanceImageLightbox` / `HomeFinanceThumb` ยัง re-export ได้ — โค้ดใหม่ให้ใช้ **`AppImage*`** จาก `app-templates` โดยตรง

## แดชบอร์ด / กราฟ / พิมพ์ / อัปโหลดรูป

โมดูลรายรับ–รายจ่าย, POS, หรือรายงานที่ต้องการ UI สอดคล้องกัน:

- **`AppDashboardSection`** + **`appDashboardSectionSlateClass` / `appDashboardSectionVioletClass`** — การ์ดหลัก
- **`AppSectionHeader`** — หัวข้อ + คำอธิบาย + ปุ่มขวา (`tone`: `slate` | `violet`)
- **`AppEmptyState`** — กล่องว่างเส้นประ
- **`AppCompareBarList`** — กราฟแท่งแนวนอนเปรียบเทียบหลายแถว
- **`AppColumnBarSparkChart`** — กราฟแท่งแนวตั้งเลื่อนแนวนอน (ยอดรายวัน ฯลฯ)
- **`openPrintableHtml` / `printPrintableHtmlInHiddenIframe`** — เอกสาร HTML เต็มฉบับสำหรับ `window.print()` (บิล/สลิป/รายงาน)
- **`prepareImageFileForUpload`** — ย่อ/บีบ JPEG ก่อนอัปโหลด
- **`AppPickGalleryImageButton`** / **`AppTakePhotoButton`** — ปุ่มเดี่ยว (คลาส: `appTemplatePickGalleryImageButtonClass`, `appTemplateTakePhotoButtonClass`)
- **`AppGalleryCameraFileInputs`** + **`AppImagePickCameraButtons`** — แถวปุ่มคู่ (คู่กับ **`AppCameraCaptureModal`** — `getUserMedia`; สำรอง `input capture`)
- **`appTemplateOutlineButtonClass`** — ปุ่มขอบ (เช่น เลือกขนาดกระดาษพิมพ์)
- **`AppWindowPrintButton`** — พิมพ์หน้าปัจจุบัน (`window.print()`)

หลีกเลี่ยงการคัดลอกบล็อก JSX เดิมจาก POS / home-finance — ขยายที่ `app-templates` แทน


================================================================================
### .cursor/rules/app-templates-spark-charts.mdc
================================================================================

---
description: กราฟแท่งแนวตั้งแบบเลื่อน (spark) และรายได้เทียบต้นทุน — ใช้ template กลางเท่านั้น
alwaysApply: true
---

# กราฟแดชบอร์ดแบบแท่งรายช่วง (template กลาง)

## บังคับ

1. **ห้าม** เขียนกราฟแท่งแนวตั้ง + เลื่อนแนวนอนใหม่เอง — ใช้จาก `@/components/app-templates` เท่านั้น
2. **รายได้ vs รายจ่าย/ต้นทุนรายวัน** → `AppRevenueCostColumnChart` — ดูหลายวันใช้ `compact`
3. **แท่งเดี่ยวรายช่วง** → `AppColumnBarSparkChart` — โทนแบรนด์ `variant="brand"` ดูหลายวันใช้ `compact` + ถ้าจัดคู่กับ dual chart ใช้ `pairedLayout`
4. **สองแท่งคู่ต่อช่วง** (เช่น หมวด A vs B) → `AppColumnBarDualSparkChart` — คู่กับแบรนด์ใช้ `titleTone="brand"` + `compact`
5. **เลย์เอาต์การ์ด + grid สองคอลัมน์** → `AppSparkChartPanel`, `AppSparkChartsTwoColumnGrid` หรือโทเค็น `appSparkChartPanelClass`, `appSparkChartsTwoColumnGridClass` จาก barrel เดียวกัน

## แพทเทิร์นมาตรฐาน

- กราฟข้างใน: `className="flex min-h-0 flex-1 flex-col"`
- ช่องว่างระหว่างรายการในหน้าเดียวกัน: `space-y-3` ระหว่าง `AppRevenueCostColumnChart` กับแถวกราฟล่าง

## ขยาย

ถ้าต้องการพฤติกรรมใหม่ (เช่น stacked bar) — **เพิ่มที่ `src/components/app-templates/`** แล้ว export ใน `index.ts` อย่าคัดลอก CSS ไปโมดูลเดียว


================================================================================
### .cursor/rules/attendance-list-cards-ui.mdc
================================================================================

---
description: เช็คอิน / รายชื่อพนักงาน — การ์ดรายการกระชับ จัดซ้าย–ขวา และรูปตาม app-templates
globs:
  - "src/systems/attendance/**/*.{ts,tsx}"
  - "src/app/**/dashboard/**/attendance/**/*.tsx"
alwaysApply: false
---

# การ์ดรายการโมดูลเช็คอิน (รายชื่อพนักงาน ฯลฯ)

เมื่อเพิ่มหรือแก้ **รายการเป็นการ์ด** ในระบบเช็คอิน — ให้ทำครบในครั้งเดียวตามนี้ ไม่ต้องรอให้ผู้ใช้สั่งซ้ำเรื่อง “จัดระเบียบ / กระชับ / เฉลี่ยซ้ายขวา”:

## โครงการ์ด

1. **กระชับ** — padding การ์ดประมาณ `p-2.5 sm:p-3`; ระยะระหว่างการ์ดในรายการ `gap-1.5 sm:gap-2` (ไม่เว้นโล่งเกินจำเป็น)

2. **เฉลี่ย / แบ่งซ้าย–ขวา** — ใช้ `flex` + `justify-between` + `items-start` หรือ `items-end` ตามแถว:
   - **ซ้าย**: ข้อมูลหลัก (`min-w-0 flex-1 pr-1`) — ชื่อ เบอร์ คำอธิบาย
   - **ขวา**: สถานะ ปุ่มสำคัญ (`shrink-0`)

3. **ข้อความไทย** — หัวข้อ/ชื่อยาวใช้ `text-balance` และ `line-clamp-2` ถ้าจำเป็น; **ห้ามใช้ `uppercase`** กับข้อความไทยในป้ายการ์ด

4. **เบอร์โทร / รหัสยาว** — ใช้ `truncate` + `title={…}` ให้เห็นเต็มเมื่อโฮเวอร์/กดค้าง แทน `break-all` ยาวเต็มบรรทัดถ้าเป้าหมายคือการ์ดสะอาด

5. **แยกโซนในการ์ด** — คั่นแถวด้วย `border-t border-slate-100` หรือ `border-dashed border-slate-100` + `pt-1.5`–`pt-2` แทนการเว้นวรรคใหญ่หลายชั้นโดยไม่จำเป็น

6. **ป้ายสถานะ** — ให้สมส่วนกับการ์ดกระชับ: ประมาณ `text-[10px]`–`text-[11px]`, `px-2 py-0.5`, `rounded-md`

7. **แถวควบคุมล่าง** (เช่น เลือกกะ + ลบรายการ) — แถวเดียว `flex flex-wrap items-end justify-between gap-2`; ฟิลด์หลัก `flex-1 min-w-0`; ปุ่มทำลาย `shrink-0`

8. **มือถือ** — select / ปุ่มแตะหลักยังใช้ `min-h-[40px]`–`min-h-[44px]` และ `touch-manipulation` ตามที่หน้าเดิมใช้

## รูปโปรไฟล์ / สลิป / lightbox

- ใช้ **`AppImageThumb`**, **`AppImageLightbox`**, **`useAppImageLightbox`**, **`AppGalleryCameraFileInputs`**, **`AppImagePickCameraButtons`**, **`AppCameraCaptureModal`** จาก `@/components/app-templates` ตามกฎ **`app-templates-media`** — ห้ามทำ thumb/lightbox/input กล้องแยกสไตล์ใหม่ในโมดูลนี้

## โทนสี (template เดียวกับ Shell)

- ใช้โทเค็นใน **`src/systems/attendance/attendance-ui.ts`** — `attendanceCardClass`, `attendancePanelClass`, `attendanceFilterBarClass`, `attendanceEmptyStateClass`, `attendanceInsetClass`, `attendanceLabelClass`, `attendanceSecondaryBtnClass`, `attendanceOutlineBtnClass` ฯลฯ — ให้ขอบ/พื้นหลัง/ตัวอักษรสอดคล้อง `AttendanceShell` และ `appDashboardSectionVioletClass` (#2e2a58 / #66638c / #e8e6fc / #4d47b6)

## อ้างอิงโค้ด

- แพทเทิร์นการ์ดรายชื่อพนักงาน: `src/systems/attendance/components/AttendanceRosterClient.tsx`


================================================================================
### .cursor/rules/barber-module-dashboard-template.mdc
================================================================================

---
description: เทมเพลตแดชบอร์ดโมดูลร้านตัดผม — เลย์เอาต์ตามขนาดจอ สี การ์ด ขอบมน เมนูล่างมือถือ และแพทเทิร์นต่อยอดโมดูลอื่น
globs:
  - "**/systems/barber/**"
  - "**/app/**/dashboard/barber/**"
---

# ร้านตัดผม (Barber) — เทมเพลตแดชบอร์ด & UI

ใช้เป็นแบบอ้างอิงเมื่อสร้างโมดูลแดชบอร์ดใหม่ที่โทน MAWELL / glass / แยกเมนูมือถือ–เดสก์ท็อป — **หลักการ UX/UI ระดับโปรเจกต์ (เมนูล่าง มุมมน เฉดสี แม่แบบคาร์แคร์):** **`dashboard-ux-car-wash-baseline.mdc`**

**ตารางเทียบคู่ขนานคาร์แคร์:** **`dashboard-module-car-wash-barber-reference.mdc`**

## 1) เลย์เอาต์ตามขนาดจอ (Tailwind)

| โซน | มือถือ (`max-md`, &lt;768px) | แท็บเล็ต/คอม (`md:` ขึ้นไป) |
|-----|------------------------------|------------------------------|
| **แถบนำทางโมดูล** | **`BarberModuleMobileDock`** — `fixed inset-x-4 bottom-[max(1.5rem,env(safe-area-inset-bottom,0px))] z-40` กริด 4 คอลัมน์ · `rounded-[2.5rem]` | **`BarberModuleDesktopNav`** — ในการ์ดหัว (`BarberLayoutChrome`) ใต้เส้นแบ่ง `border-t border-white/40` |
| **หัวโมดูล** | โลโก้ + ชื่อระบบ + ปุ่มคู่มือ; tagline ซ่อนบนมือถือ (`hidden md:block`) | เหมือนเดิม + แสดง tagline |
| **พื้นที่เลื่อนเนื้อหา** | **`BarberLayoutChrome`** ใส่ `max-md:pb-20 md:pb-0` เพื่อไม่ให้เนื้อหาถูก dock บัง | ไม่ต้องเว้น pb แบบ dock |
| **Gutter แดชบอร์ด** | `DashboardShell` แถวหลัก: `max-md:px-2` เมื่ออยู่ใต้ `/dashboard/barber/*` | `sm:px-4` |
| **PageContainer ชั้นแดชบอร์ด** | `DashboardPagesShell`: `max-md:!px-3 sm:!px-6` สำหรับ path barber | `sm:!px-6` |
| **โมดูล Shell** | `BarberModuleShell` → `PageContainer` ใช้ `!px-0` (ไม่ซ้ำขอบแนวนอนกับชั้นแดชบอร์ด) | เหมือนกัน |

**หมายเหตุแท็บเล็ต:** ในโค้ดปัจจุบันใช้ breakpoint **`md` (768px)** เป็นจุดสลับ dock ↔ เมนูในการ์ด — แท็บเล็ตแนวตั้งส่วนใหญ่จึงได้ **dock ล่าง**; แท็บเล็ตแนวนอน/หน้าจอกว้างพอได้ **เมนูในการ์ด**

## 2) สี ขนาดการ์ด ขอบมน

**แหล่ง token หลัก:** `@/systems/barber/components/barber-ui-tokens.ts`

- **โทนแบรนด์ / ลิงก์ active:** `#5b61ff`, ไล่ข้อความหัวข้อ `#4338ca` → `#5b61ff` → `#0d9488`
- **ข้อความหลักเข้ม:** `#1e1b4b`, รอง `#5f5a8a` / `#66638c`
- **เปลือกโมดูล (glass):** `BarberLayoutChrome` — `rounded-[2.5rem] max-md:rounded-2xl`, เส้นขอบ `border-white/50`, พื้นไล่ `from-white/50 via-indigo-50/25 to-violet-100/20`, `backdrop-blur-2xl`, เงา inset ขาวอ่อน
- **เปลือกเนื้อหาชั้นใน (ใช้เฉพาะบางหน้า):** `rounded-[2rem] max-md:rounded-2xl`, `border-white/45`, `bg-white/35` — หน้าที่มีการ์ดหนาแล้วใช้โหมด **plain inner** (ดูด้านล่าง)
- **การ์ดย่อยในโมดูล:** `barberCardSurfaceRadiusClass` = `rounded-2xl sm:rounded-xl`; `barberCardBodyPaddingXClass` = `px-2.5 sm:px-4`
- **เซกชันแดชบอร์มมาตรฐาน (การเงิน ฯลฯ):** `AppDashboardSection` tone **`violet`** → `appDashboardSectionVioletClass` ใน `@/components/app-templates/dashboard-tokens.ts`

อย่าซ้อน glass card ทับ glass card โดยไม่จำเป็น — ถ้าหน้ามี `AppDashboardSection` หรือ hub header หนาแล้ว ให้ไม่ห่อด้วย `barberModuleContentShellClass` ซ้ำ

## 3) ปุ่มเมนู — มือถืออยู่ด้านล่าง

- **เมนูหลักโมดูล (แดชบอร์ด / การเงิน / แพ็กเกจ / QR):** ใช้ **`BarberModuleMobileDock`** เท่านั้นบนมือถือ — อย่าย้ายเป็นแถบบนหรือ hamburger สำหรับลิงก์เหล่านี้
- Dock ต้องอยู่ **นอก** การ์ดหัวที่มี `overflow-hidden` เพื่อไม่ถูกตัด — เรียบง่าย: dock เรนเดอร์ถัดจากการ์ดหัวใน `BarberLayoutChrome`
- **safe area:** `pb-[max(0.35rem,env(safe-area-inset-bottom))]` บน dock
- **ช่องสัมผัส:** ลิงก์ dock `min-h-[52px]`; ปุ่มนำทางเดสก์ท็อป `min-h-[44px]` (`barberNavLinkClass`)

## 4) แพทเทิร์นอื่นที่ควรคงไว้ในระบบต่อไป

- **Staff kiosk (`/dashboard/barber/staff`):** ซ่อน header/sidebar แดชบอร์ด + ซ่อน chrome โมดูล — เนื้อหาแบบพอร์ทัล (`DashboardPagesShell` / `BarberModuleShell` เต็มความกว้าง `!p-0` ตามโค้ด) — ห้ามใส่ gutter ซ้ำ
- **หน้า plain inner (ไม่ห่อ `barberModuleContentShellClass`):** `/dashboard/barber/staff`, `/finance`, `/packages`, `/qr` — ลดการ์ดซ้อน
- **โมดัลที่ต้องลอยเหนือ dock:** ใช้ **`BarberModalPortal`** (portal ไป `document.body`, z เหนือ dock) สำหรับฟอร์ม/กรองมือถือ
- **Hydration / ส่วนขยายเบราว์เซอร์:** ปุ่มที่โดน inject attribute (เช่น `fdprocessedid`) ใช้ `suppressHydrationWarning` ตามที่ทำใน clients ที่เกี่ยวข้อง
- **หน้า hub แพ็กเกจบนมือถือ:** หัวข้อเต็มความกว้าง → แถบแท็บเต็มความกว้าง → ปุ่มหลักเต็มความกว้าง (ดู `BarberPackagesHubClient`)

## ไฟล์อ้างอิงหลัก

| บทบาท | ไฟล์ |
|--------|------|
| Shell + glass + plain inner | `src/systems/barber/components/BarberLayoutChrome.tsx` |
| Dock / เดสก์ท็อป nav | `src/systems/barber/components/BarberModuleHeader.tsx` |
| PageContainer โมดูล | `src/systems/barber/components/BarberModuleShell.tsx` |
| Token การ์ด / ว่าง / modal | `src/systems/barber/components/barber-ui-tokens.ts` |
| Gutter แดชบอร์ด | `src/components/dashboard/DashboardPagesShell.tsx`, `src/components/layout/DashboardShell.tsx` |
| พอร์ทัลโมดัล | `src/systems/barber/components/BarberModalPortal.tsx` |

เมื่อคัดลอกเทมเพลตไปโมดูลใหม่: แยก **`ModuleLayoutChrome`** (glass header + desktop nav + **fixed mobile dock**) + **`module-ui-tokens.ts`** + ผูก path ใน `DashboardShell` / `DashboardPagesShell` ให้ gutter ไม่ซ้ำชั้น


================================================================================
### .cursor/rules/building-pos-dashboard-template.mdc
================================================================================

---
description: เทมเพลตแดชบอร์ด POS ร้านอาหาร (building-pos) — โครงเมนูเดียวกับคาร์แคร์ (แท็บหลัก 4 กลุ่ม + แท็บย่อย)
globs:
  - "**/dashboard/building-pos/**"
  - "**/systems/building-pos/**"
---

# Building POS — เทมเพลตแดชบอร์ด

**หลักการ UX ระดับโปรเจกต์:** `dashboard-ux-car-wash-baseline.mdc` — เมนูหลักมือถือล่าง (`BuildingPosMobileDock`), หัว glass (`BuildingPosShell`), ไอคอน/สี `#5b61ff` แบบคาร์แคร์

## Layout ชั้นนอก (`layout.tsx`)

- **`requireBuildingPosSection()`** + `BuildingPosShell` — **ห้าม** `shopQrTemplatePageBgClass` / พื้นเทาเต็มแผงในเลย์เอาต์นี้
- ความกว้างยึด **`PageContainer`** ของแดชบอร์ดหลัก

## Hub หลัก (หน้าเดียว)

- **ไฟล์:** `BuildingPosDashboardClient.tsx` + **`building-pos-nav.ts`**
- **แท็บหลัก (4):** แดชบอร์ด · QR · การเงิน · เมนู — เทียบคาร์แคร์ (overview / qr / finance / offers+menu)
- **แท็บย่อย:** `BuildingPosHubSubTabs.tsx`
  - **QR:** ลูกค้าสแกนสั่ง | พนักงานเสิร์ฟ (`qr=customer` | `qr=staff`)
  - **การเงิน:** ยอดขาย | ต้นทุน/รายจ่าย (`fin=sales` | `fin=costs`)
  - **เมนู:** เมนูอาหาร | หมวดหมู่ (`menu=items` | `menu=categories`)
- **URL เก่า:** `?tab=orders` → `?tab=qr` · `?tab=categories` → `?tab=menu&menu=categories` — normalize ใน client
- **หน้าเดิมแยก:** `sales` / `costs` / `staff-link` → **redirect** ไป hub พร้อม query ที่ถูกต้อง

## `FormModal` — ตำแหน่งบนมือถือ

- **ทุก `FormModal`** ในโมดูลนี้ต้องใส่ **`mobileCentered`** — ให้แผงอยู่ **กึ่งกลางจอ** (`items-center` + `p-3`) · มุมการ์ด `rounded-[2rem]` · **ห้าม** โหมดชิดขอบล่าง (`items-end`) บนมือถือ — เทียบ **`laundry-dashboard-ui.mdc`** (ข้อ «ตำแหน่งโมดัล»)

## Shell + เมนู (เทียบ `CarWashDashboard` การ์ดหัว)

- **`BuildingPosShell`:** การ์ด glass **เดียว** (`buildingPosModuleGlassShellClass`) รวม **ชื่อระบบ + แท็บหลัก + แท็บย่อย (เมื่อไม่ใช่ overview)** — บน **แท็บเล็กขึ้นไป (`md+` รวม tablet/คอม)** แท็บหลักอยู่ใต้เส้นแบ่ง `border-t border-white/40 pt-5` แบบคาร์แคร์; แท็บย่อยอยู่ใต้เส้นแบ่งอีกชั้น
- **`BuildingPosUnifiedMenuBar`:** `variant="embedded"` ใน `BuildingPosShell` — มือถือใช้ dock แทน (คอมโพเนนต์นี้ `hidden md:block`)
- **`BuildingPosHubSubTabs`:** `variant="embedded"` ใน `BuildingPosShell` — ยังแสดงบนมือถือในการ์ดหัวเมื่ออยู่กลุ่มย่อย (QR / การเงิน / เมนู)
- **`BuildingPosMobileDock`:** มือถือ — แถบล่าง pill glass (`rounded-[2.5rem]`) **ไอคอน + ชื่อเมนู** ใต้ไอคอน (`text-[9px] font-black`) เทียบ **`CarWashDashboard`** เมนูล่าง / **`BarberModuleMobileDock`** — ลำดับ แดชบอร์ด · การเงิน · เมนู · QR — แสดงเฉพาะ path `/dashboard/building-pos`
- **แดชบอร์ดมือถือ (`overview`):** ปุ่มรีเฟรชในแถบ `BuildingPosOpenTablesPanel` ใช้ **ไอคอนอย่างเดียว** (`max-md`) และข้อความ `รีเฟรชออเดอร์` จาก `md` ขึ้นไป · ปุ่ม **ออเดอร์** เปิด `FormModal` + **`BuildingPosCustomerOrderClient`** (`variant="staff"`, `embeddedInModal`) — เลือกเมนูแบบหน้าลูกค้า · ช่องทางสั่ง (พนักงาน / แคชเชียร์ / กลับบ้าน) บันทึกใน `PosOrder.note` ผ่าน `@/lib/building-pos/staff-order-channel`
- **ห้าม** ซ้อนการ์ด glass ใหม่รอบแถบเมนูใน client หลัก — นำทาง hub อยู่ที่ shell แล้ว (`BuildingPosDashboardClient` ไม่เรียก `UnifiedMenuBar` / `HubSubTabs` ซ้ำ)

## โทเคน UI

- **`components/building-pos-ui-tokens.ts`** — glass, การ์ดสถิติ, แถบแท็บย่อย, hub QR

## แยกจากหน้าสาธารณะ

- **`shop-qr-template`** ใช้กับ **หน้าลูกค้าสั่งอาหาร / พอร์ทัลพนักงาน** — ไม่ใช่ shell แท็บแดชบอร์ดหลัก

## เนื้อหา

- ยึด **`AppDashboardSection`** / `app-templates` ตาม `app-templates-central.mdc` ในส่วนที่มีอยู่แล้ว


================================================================================
### .cursor/rules/car-wash-dashboard-ui.mdc
================================================================================

---
description: คาร์แคร์ — เทมเพลตแดชบอร์ด เมนู ลานล้าง QR โปสเตอร์ ยอดขาย และคอมโพเนนต์ร่วม (แม่แบบ UX/UI ระดับโปรเจกต์)
globs:
  - "**/systems/car-wash/**"
  - "**/api/car-wash/**"
  - "**/app/**/car-wash/**"
---

# Car wash — แดชบอร์ด & UI

**แม่แบบ UX/UI ทั้งโปรเจกต์:** เมนูมือถือล่างโค้งมน การ์ด glass มุมมน เฉดสี/ไอคอน/ตัวอักษร — ดูกฎรวม **`dashboard-ux-car-wash-baseline.mdc`** (`alwaysApply`)

**ตารางเทียบคู่ขนานร้านตัดผม:** **`dashboard-module-car-wash-barber-reference.mdc`**

## โมดูลปุ่ม / การ์ดรายการ

- **`@/systems/car-wash/car-wash-popup-icon-buttons`**: `SalesRowOpenDetailButton`, `PopupIconButton`, `popupIconBtnDanger` — รายละเอียดใน `FormModal`, `aria-label` ไทย, `busy` ตอนอัปโหลด
- **ยอดขาย (`CarWashSalesPanel`)**: แถวกระชับ รูป 48px, ทะเบียนหนา, ขวาแค่ยอด + ปุ่มรายละเอียด; แพ็กเหมาขอบซ้ายอำพัน + ป้าย「เหมา」
- **แท็บเหมา (`CarWashDashboard`)**: ซ้ายข้อมูล / ขวา `border-l` ยอด + สิทธิ์ + `SalesRowOpenDetailButton`

## เมนู & ตำแหน่งปุ่ม

- แท็บ: **แพ็กเกจเหมา** (key `bundles`), **QR พนักงาน** (`staff_qr`)
- ปุ่มเมนู: **QR ลูกค้า** → เปิด `FormModal` (ไม่ใช่แท็บ)
- **`CarWashServiceLanePanel`** แถวหัวลานล้างวันนี้ — **รีเฟรช + บันทึกรายการ** อยู่ที่นี่ (`cw-btn`; บนมือถือไอคอนอย่างเดียวผ่าน `globals.css`) — **ไม่** อยู่หัวการ์ดหลักของโมดูล · โมดูลซักผ้าใช้แพทเทิร์นเดียวกันที่ `LaundryActiveOrdersPanelHeader` (ดู **`laundry-dashboard-ui.mdc`**)

## QR ลูกค้า & QR พนักงาน (โปสเตอร์กลาง MAWELL)

- ใช้ **`@/components/qr/shop-qr-template`**: `QRCode.toDataURL` (240px) → **`createShopQrPosterDataUrl`** (พรีวิว) / **`createShopQrPosterCanvas`** + **`downloadPosterPng`** / **`downloadPosterPdf`**
- คนละ **tagline** เป็นค่าคงที่ (เช่น `CAR_WASH_CUSTOMER_QR_TAGLINE`, `CAR_WASH_STAFF_QR_TAGLINE`); โลโก้ + `shopLabel` เหมือนกัน
- พรีวิว: กล่อง `overflow-x-auto` + รูป `w-[340px]` + สถานะโหลดเหมือนกัน
- **Modal QR ลูกค้า**: มีปุ่ม **ปิด** ใน `footer`; **แสดงลิงก์ / ซ่อนลิงก์** (ค่าเริ่มต้นซ่อน); รีเซ็ตซ่อนเมื่อเปิด modal
- **ลิงก์พนักงาน**: `/dashboard/car-wash/staff` (+ `t` ถ้า trial sandbox)

## หน้าพนักงาน (สแกน QR)

- Route: **`/dashboard/car-wash/staff`** → `CarWashDashboard` + **`layoutVariant="staff_lane"`**
- แสดงเฉพาะหัวข้อลาน + **`CarWashServiceLanePanel`** + modals ที่จำเป็นสำหรับบันทึก — **ไม่ใส่ลิงก์กลับหน้าหลักคาร์แคร์**

## การ์ดสถิติ overview (แม่แบบโปรเจกต์)

บล็อก **สถิติวันนี้** (ห่อกระจก `rounded-[2.5rem]` + กริด `CarWashStat`) ใช้เป็นแม่แบบให้โมดูลอื่นที่มีแดชบอร์ดคล้ายกัน — เช่น **รับฝากซักผ้า** (`LaundryStat` ใน `LaundryDashboard`) ตาม **`.cursor/rules/laundry-dashboard-ui.mdc`**

## พอร์ทัลลูกค้า (สมาชิก)

- **`CarWashCustomerPortalClient`** + API **`/api/car-wash/public/lookup`** (bundles + `recent_visits`), **`/api/car-wash/public/check-in`**
- UI: **`AppDashboardSection` tone violet**, **`AppSectionHeader`**, **`AppEmptyState`**, `appDashboardHistoryListShellClass` ตามเทมเพลตกลาง
- **ชำระ / หักสิทธิ์**: ต้องมีคิวในลาน (`service_status !== PAID`) และผู้ใช้ **แตะการ์ดคิวยืนยัน** ก่อนปุ่มชำระเปิด
- จำแนกเหมาใน visit: `bundle_id != null` หรือ `package_name` ขึ้นต้น **`เหมาจ่าย:`** (รองรับหลัง PAID ที่เคลียร์ `bundle_id`)

## กราฟสรุปเปรียบเทียบ (ยอดขาย)

- **ซ้าย — ยอดตามแพ็กเกจ (ปกติ)**: รวม `final_price` จาก visit ที่ **ไม่** นับเป็นการใช้สิทธิ์เหมา (helper `isBundleConsumptionVisit`)
- **ขวา — จำนวนครั้งตามแพ็กเหมา**: นับ **ครั้ง** จาก visit ที่เป็นเหมา จัดกลุ่มด้วย `bundleVisitPackageLabel` (ตัดคำนำหน้าเหมาจ่าย)
- แสดงค่า: ซ้าย `฿ …`, ขวา `… ครั้ง`

## ข้อความ / กราฟหลัก

- กราฟรายได้–ต้นทุน: ตัด subtitle/คำอธิบายยาวเมื่อผู้ใช้ขอ — ป้ายสุทธิใช้ **สุทธิ** ไม่ใส่ "(เทียบคร่าว)"

## Prisma / อัปโหลด / Git

- คอลัมน์ใหม่: migrate แล้วรีสตาร์ท dev — ข้อความ DB ใช้ **`@/lib/car-wash/route-errors`**, **`prisma-errors`**
- อัปโหลด: **`public/uploads/car-wash/*`** ใน **`.gitignore`** คงแค่ **`public/uploads/car-wash/.gitkeep`** ใน repo


================================================================================
### .cursor/rules/car-wash-templates-reference.mdc
================================================================================

---
description: อ้างอิงด่วน — ไฟล์หลักคาร์แคร์และเทมเพลตที่ใช้คู่กัน
globs:
  - "**/systems/car-wash/**"
  - "**/components/qr/**"
  - "**/components/app-templates/**"
alwaysApply: false
---

# Car wash — แมปไฟล์ ↔ เทมเพลต

| งาน | ไฟล์ / แพ็กเกจ |
|-----|------------------|
| แดชบอร์ดรวม | `CarWashDashboard.tsx` |
| ลานวันนี้ + บิล/สถานะ | `CarWashServiceLanePanel.tsx` |
| ยอดขาย กรอง กราฟ | `CarWashSalesPanel.tsx` + `AppRevenueCostColumnChart`, `AppCompareBarList` |
| ต้นทุน | `CarWashCostPanel.tsx` |
| พอร์ทัลลูกค้า | `CarWashCustomerPortalClient.tsx`, `app/car-wash/check-in/[ownerId]` |
| หน้าพนักงาน | `app/(dashboard)/dashboard/car-wash/staff/page.tsx` |
| โปสเตอร์ QR | `@/components/qr/shop-qr-template` (`createShopQrPosterDataUrl`, `createShopQrPosterCanvas`, `downloadPosterPng`, `downloadPosterPdf`) |
| การ์ดแดชบอร์ด | `@/components/app-templates` — `AppDashboardSection`, `AppSectionHeader`, `AppEmptyState`, `FormModal` |
| สถานะลาน | `@/lib/car-wash/service-status` (`carWashStatusLabelTh`, `normalizeCarWashServiceStatus`) |

กฎบังคับใช้ template กลางทุกโมดูล: **`app-templates-central.mdc`**


================================================================================
### .cursor/rules/car-wash-ux-reference.mdc
================================================================================

---
description: ใช้คาร์แคร์เป็นต้นแบบ UX/UI เมื่อปรับโมดูลอื่น (พอร์ทัล/หน้า staff/แดชบอร์ด/ปุ่มมุมการ์ด)
alwaysApply: false
---

# Car-wash = ต้นแบบ UX/UI สำหรับโมดูลอื่น

ระบบคาร์แคร์ผ่านการปรับ UX/UI หลายรอบจน **ลายต่อระหว่างหน้า staff / portal ลูกค้า / ป๊อปอัป QR** ลงตัว — ใช้เป็น **reference** เมื่อปรับ **dormitory / building-pos / village / chat-ai-digest / module ใหม่** ในรอบถัดไป

## ไฟล์อ้างอิงหลัก (อย่าคัดลอก JSX — import เทมเพลต)

| รูปแบบ | ไฟล์ต้นแบบ |
|--------|------------|
| Layout กระจกพื้นม่วง (พอร์ทัล/หน้า staff) | `AppPublicCheckInGlassPage` + `appPublicCheckInGlassCardClass` ใน `@/components/app-templates` |
| Header logo + ชื่อ + คำอธิบาย (กลาง, mobile-first) | `CarWashCustomerPortalClient` (lines ~180–195), `CarWashDashboard` สาขา `staff_lane` |
| การ์ดเนื้อหาในกล่องกระจก | `<div className={appPublicCheckInGlassCardClass}><div className="px-5 py-5 sm:px-6">…</div></div>` |
| รายการคิว + แอ็กชันมุมขวาบน | `CarWashServiceLanePanel.tsx` (`staffCardToolbar`, `headerRow`) |
| โหมดสลับ full ↔ mobile lane | prop `layoutVariant: "full" | "staff_lane"` ใน `CarWashDashboard` |

## หลักการเลย์เอาต์ที่ต้องคงไว้

1. **พื้นหลังกระจกใช้ template กลางเสมอ**
   - Wrap ด้วย `AppPublicCheckInGlassPage` (มี `px-4 pb-20 pt-8 sm:pt-12` แล้ว) — **ห้ามใส่ padding ขอบจอซ้ำ** ในคอนเทนเนอร์ลูก
   - คอนเทนเนอร์ลูกใช้แค่ `relative mx-auto max-w-md space-y-4`

2. **Header รูปแบบเดียวกันทั้ง portal และ staff**
   - กล่องไอคอน `h-14 w-14 rounded-[1.25rem]` ขอบ/ไล่สีขาว–ม่วง (`from-white/80 to-violet-100/60`) เงา `shadow-[0_8px_24px_-8px_rgba(91,97,255,0.35)]`
   - หัวข้อ `text-2xl font-black text-[#1e1b4b]` + คำอธิบาย `text-sm text-[#6b6894]`
   - ถ้ามี `shopLabel` → บรรทัดเล็ก `text-xs font-bold text-[#9490c0]`

3. **การ์ด/กล่องเนื้อหา**: ใช้ `appPublicCheckInGlassCardClass` แล้วเว้น **`px-5 py-5 sm:px-6`** ภายใน — สอดคล้องกับการ์ดค้นหา/สถานะของพอร์ทัล

4. **ปุ่มแอ็กชัน (รีเฟรช / เพิ่ม) อยู่ "มุมขวาบนภายในการ์ด"** — ห้าม FAB ลอยมุมล่าง
   - แถว `flex justify-end gap-2` ก่อนรายการ
   - ขนาด `h-10 w-10`, ไอคอนล้วน, รีเฟรชใช้ขอบขาว `bg-white/90`, ปุ่มหลัก (เพิ่ม/บันทึก) ใช้ไล่สี `from-[#5b61ff] to-[#6a63ff]`
   - ตัวอย่าง: `staffCardToolbar` ใน `CarWashServiceLanePanel`

5. **ตัดส่วนซ้ำสำหรับ staff**
   - **ห้าม** วาง header card ใหญ่ + ปุ่มรีเฟรชหัวตารางซ้ำ (เคยมีใน `CarWashDashboard` รอบเก่า)
   - **ห้าม** wrapper `max-w-md` ในไฟล์ page — ใช้แค่ `<CarWashDashboard layoutVariant="staff_lane" … />`

6. **คำพูดเกี่ยวกับการชำระเงินใช้คำกลาง**
   - ใช้ **"QR ชำระเงิน" / "สแกนจ่าย" / "เบอร์สำหรับ QR"** แทนการระบุยี่ห้อ (เช่น "พร้อมเพย์") ใน UI ที่ลูกค้าเห็น
   - เก็บคำเฉพาะแบรนด์ไว้ที่ **โปรไฟล์/ตั้งค่า** เท่านั้น (เช่น `ProfileEditor`)

7. **โหมด `staff_lane` (mobile-first)**
   - ใช้ flag เดียว (`layoutVariant`) สลับระหว่างเดสก์ท็อปเต็มและหน้า lane มือถือ
   - หน้า staff ไม่มีลิงก์กลับไปแดชบอร์ดเต็ม (ออกแบบให้ใช้กับ QR เฉพาะ)

## เมื่อแก้โมดูลอื่นในรอบถัดไป

- ก่อนแก้ **เปิดดู** `CarWashCustomerPortalClient.tsx` + `CarWashDashboard.tsx` (สาขา `isStaffLaneOnly`) + `CarWashServiceLanePanel.tsx` (`staffCardToolbar` / `headerRow`) เพื่อเทียบโครง
- ถ้าโมดูลอื่นมีหน้า portal/check-in/staff คล้ายกัน → **import เทมเพลตชุดเดียวกัน** อย่าสร้างกระจก/หัวข้อ/การ์ดใหม่
- ถ้าต้อง pattern ใหม่ที่ใช้ซ้ำได้ → ขยายที่ `@/components/app-templates` แล้ว export ใน `index.ts` (ตามกฎ `app-templates-central.mdc`)

## เช็กลิสต์ก่อน commit UI

- [ ] ใช้ `AppPublicCheckInGlassPage` / `appPublicCheckInGlassCardClass` (ไม่ duplicate gradient/padding)
- [ ] Header layout/spacing ตรงกับพอร์ทัลคาร์แคร์
- [ ] ปุ่มแอ็กชันการ์ด อยู่มุมขวาบนของการ์ด ขนาด `h-10 w-10` icon-only
- [ ] ไม่มี "พร้อมเพย์" หรือชื่อแบรนด์ผู้ให้บริการชำระเงินใน UI ลูกค้า
- [ ] หน้า staff ใช้ `layoutVariant` เดียว ไม่มี wrapper หรือ header ซ้ำ


================================================================================
### .cursor/rules/chat-ai-digest-sidebar.mdc
================================================================================

---
description: Chat AI — แถบซ้ายสรุปรายวัน (digest) โครง DOM และ shell ห้ามถอยกลับแบบเก่า
globs: "**/systems/chat/**/*,**/dashboard/chat-ai/**/*,**/personal-ai-chat-shell.ts"
alwaysApply: true
---

# Chat AI — แถบซ้าย (digest) ห้าม revert เป็นแบบเก่า

- **แหล่งคลาสเดียว**: ปรับ layout แถบซ้าย/สเกเลตันแชทที่ `src/systems/chat/personal-ai-chat-shell.ts` เท่านั้น — ห้ามคัดลอกสตริงคลาสซ้ำไปไฟล์อื่นโดยไม่จำเป็น
- **โครง DOM ต้องคงรูปนี้** (ห้ามเอา children ไปวางตรง `<aside>` โดยไม่มีชั้นใน):
  - `aside#personal-ai-digest` + `aria-label` สรุปรายวัน
  - ชั้นใน: `div` ด้วย **`PERSONAL_AI_CHAT_DIGEST_INNER_CLASS`** (`flex min-h-0 … flex-1 flex-col`)
  - ลูกโดยตรงของชั้นใน: **`<header className="shrink-0 …">`** (หัวการ์ดสรุป) แล้ว **`<section … min-h-0 flex-1 overflow-y-auto … [scrollbar-gutter:stable]>`** (เนื้อหาเลื่อน) + `aria-label` โซนรายการ
- **`PERSONAL_AI_CHAT_DIGEST_ASIDE_CLASS`**: ต้องมี **`min-h-0`**, **`w-full`**, **`min-w-0`** คู่กับ `flex flex-col overflow-hidden` — ห้ามถอดจน aside ล้น/สกอร์ลพังบน flex แนวนอน
- **สเกเลตัน** `chat-ai-client.tsx`: ใช้ **header + section** ให้สอดคล้องกับ `PersonalAiDailyDigest` (ห้ามกลับไปแค่ `div` เดียวห่อ pulse)
- **`PersonalAiDigestAsideFrame`**: ต้องห่อ children ด้วย inner `div` ตาม shell เสมอ — ห้ามลบ wrapper นี้

ถ้ามี PR/รีแฟคเตอร์ที่ “คืนค่าเดิม” โครงข้างบน ให้ปฏิเสธหรือแก้ให้ยังสอดคล้องกับกฎนี้


================================================================================
### .cursor/rules/dashboard-analytics-chart-clean-template.mdc
================================================================================

---
description: Dashboard analytics chart template (clean readable standard)
globs: src/{app/(dashboard),systems}/**/*.{ts,tsx}
alwaysApply: false
---

# Dashboard Analytics Chart Standard (Clean + Readable)

ใช้มาตรฐานนี้เมื่อทำกราฟในโมดูลแดชบอร์ดใหม่หรือรีแฟคเตอร์กราฟเดิม

## บังคับใช้ template กลางจาก `@/components/app-templates`

- รายรับ vs รายจ่ายรายช่วง: ใช้ `AppRevenueCostColumnChart` (compact เมื่อจุดข้อมูลเยอะ)
- กราฟแท่งเดี่ยวแนวโน้ม: ใช้ `AppColumnBarSparkChart` (`variant="brand"`, `compact`)
- สรุปตามหมวด: ใช้ `AppCompareBarList` (ลดแถวและอ่านง่าย)
- โครงเลย์เอาต์กราฟ: ใช้ `AppSparkChartPanel` และ `AppSparkChartsTwoColumnGrid`

## กฎลด noise

- หัวกราฟต้องมีตัวเลขหลักเดียวที่เด่นที่สุด (เช่น คงเหลือสุทธิ)
- หลีกเลี่ยง legend ยาวซ้ำซ้อน และข้อความอธิบายที่บังคับผู้ใช้ตีความหลายชั้น
- ใช้เส้นกริดบาง / tick สั้น / spacing โปร่ง อ่านบนมือถือได้

## สัดส่วนและหมวด

- สัดส่วนรับ-จ่าย: ใช้ donut/ring ขนาดเล็ก + ค่า % และมูลค่ากำกับ
- หมวดรายรับ/รายจ่าย: แสดง Top 5 + `อื่นๆ` เป็นค่าเริ่มต้น
- หากมี “ดูทั้งหมด” ให้เป็น progressive disclosure ไม่ยัดยาวตั้งแต่แรก

## Empty + Loading

- ห้ามใช้ข้อความ `กำลังโหลด...` แบบลอยเดี่ยว ให้ใช้ skeleton ที่สะท้อน layout จริง
- Empty state ต้องมี CTA ใช้งานต่อได้ทันที (เช่น “+ เพิ่มรายการแรก”)


================================================================================
### .cursor/rules/dashboard-mobile-filter-icon.mdc
================================================================================

---
description: ฟอร์มกรองข้อมูลบนมือถือให้ย่อเป็นปุ่มไอคอน และเปิดตัวกรองแบบแผง/โมดัล
alwaysApply: true
---

# Mobile filter pattern (dashboard modules)

- เมื่อมี **ฟอร์มกรองข้อมูล** (เช่น วันที่, ห้องเรียน, สถานะ, keyword) ในหน้าแดชบอร์ด:
  - บนจอเล็ก (`< sm` หรือ breakpoint โมดูล) ให้แสดงเป็น **ปุ่มไอคอนตัวกรอง** (เช่น funnel/sliders) แทนการโชว์ฟอร์มเต็มแถว
  - เมื่อกดไอคอน ให้เปิดแผงกรอง (`sheet` / `popover` / `modal`) เพื่อแก้ค่า filter
- บนจอใหญ่ (`sm+`) ให้แสดงฟอร์มกรองเต็มรูปแบบได้ตามปกติ
- ปุ่มไอคอนต้องมี `aria-label` ชัดเจน เช่น `"เปิดตัวกรอง"` และมีขนาดแตะง่ายอย่างน้อย `min-h-[40px]`
- ควรแสดงสถานะว่ามีการกรองอยู่ (badge จุด/ตัวเลข/สีปุ่ม) เพื่อให้ผู้ใช้มือถือรู้ว่าฟิลเตอร์กำลังทำงาน
- ใช้ pattern นี้กับโมดูล `educare` และโมดูลใหม่ในอนาคตที่มี list/report/filter ลักษณะเดียวกัน
- ถ้ามีปุ่ม **เพิ่มรายการ** คู่กับไอคอนกรองบนหัวการ์ด — ดูกฎ **`dashboard-mobile-list-header-actions.mdc`** (แถวเดียว หัวข้อซ้าย · กรอง+เพิ่มขวา, มือถือเพิ่มเป็นไอคอน)

## Example pattern

```tsx
<button
  type="button"
  aria-label="เปิดตัวกรอง"
  className="sm:hidden min-h-[40px] rounded-xl px-3"
  onClick={() => setFilterOpen(true)}
>
  <FilterIcon aria-hidden />
</button>

<div className="hidden sm:grid">{/* full filter form on desktop */}</div>
```


================================================================================
### .cursor/rules/dashboard-mobile-list-header-actions.mdc
================================================================================

---
description: หน้ารายการ CRUD — มือถือให้หัวการ์ดเป็นแถวเดียว ปุ่มเพิ่มเป็นไอคอน + ไอคอนกรองมุมขวา
alwaysApply: true
---

# Mobile list header — add + filter on card top-right (dashboard modules)

ใช้กับหน้า **รายการ** ที่มี `AppDashboardSection` + `AppSectionHeader` + ปุ่ม **เพิ่มรายการ** และ **เปิดตัวกรอง** (ไอคอน) เช่น ทรัพย์สิน, รายการอื่นที่โครงเดียวกัน

## บังคับบนมือถือ

- **เลย์เอาต์หัวการ์ด**: หัวข้อ (`title`) **ซ้าย** · กลุ่มปุ่ม **ขวาบน** — ไม่ให้ `AppSectionHeader` ซ้อนเป็น `flex-col` จนปุ่มหล่นไปใต้หัวข้อ
  - ส่ง `className` ให้ `AppSectionHeader` เช่น  
    `className="flex flex-row items-start justify-between gap-3 sm:items-center"`
  - ส่ง `actionWrapClassName` เช่น  
    `actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"`
- **ปุ่มเพิ่ม (primary)**:
  - **ก่อน `sm`**: แสดง **ไอคอนอย่างเดียว** (เช่น `+`) พร้อม `aria-label` ชัดเจน (เช่น `"เพิ่มทรัพย์สิน"`)
  - **`sm+`**: แสดง **ข้อความ** (เช่น `+ เพิ่มทรัพย์สิน`) — หลีกเลี่ยงไอคอน `+` ซ้ำกับข้อความที่มี `+` อยู่แล้ว
  - ขนาดแตะ: `min-h-[40px]` และบนมือถือควร `min-w-[40px]` เมื่อเป็นไอคอนล้วน
- **ปุ่มกรอง**:
  - แสดงเฉพาะมือถือ (`sm:hidden`) ตามกฎ `dashboard-mobile-filter-icon.mdc`
  - วางในกลุ่ม `action` **ก่อน** ปุ่มเพิ่ม (ปุ่มเพิ่มอยู่ **ขวาสุด**)
  - ใช้ `gap-1.5 sm:gap-2` ระหว่างปุ่มในกลุ่ม

## Pattern อ้างอิง

`src/systems/asset/components/AssetAssetsClient.tsx` — หัวข้อ "ทรัพย์สิน" + ไอคอนกรอง + ไอคอนเพิ่ม (มือถือ)

```tsx
<AppSectionHeader
  className="flex flex-row items-start justify-between gap-3 sm:items-center"
  actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
  action={
    <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
      <button type="button" className="... sm:hidden" aria-label="เปิดตัวกรอง">
        <FilterIcon />
      </button>
      <button type="button" aria-label="เพิ่ม…" className="app-btn-primary ... min-w-[40px] sm:min-w-0">
        <IconPlus className="h-5 w-5 sm:hidden" aria-hidden />
        <span className="hidden sm:inline">+ เพิ่ม…</span>
      </button>
    </div>
  }
/>
```

นำไปใช้กับโมดูลรายการอื่นที่มีฟอร์มกรองย่อบนมือถือ + ปุ่มสร้างรายการใหม่


================================================================================
### .cursor/rules/dashboard-mobile-module-dashboard-quick-links.mdc
================================================================================

---
description: หน้าแดชบอร์ดโมดูล — มือถือให้ลิงก์ทางลัด (จัดการ / รายงาน) เป็นไอคอนมุมขวาของการ์ดหัว
alwaysApply: true
---

# Mobile module dashboard — quick action links as icons (top-right of hero card)

ใช้กับ **หน้าแดชบอร์ดหลักของโมดูล** (เช่น `/dashboard/asset`) ที่มี `AppDashboardSection` + `AppSectionHeader` และ **`action` เป็น `<Link>`** ไปยังหน้าย่อยหลัก (จัดการข้อมูล, รายงาน, ฯลฯ)

## บังคับบนมือถือ

- **หัวการ์ด**: หัวข้อซ้าย · กลุ่มลิงก์ขวาบน — ส่ง `className` ให้ `AppSectionHeader` เช่น  
  `className="flex flex-row items-start justify-between gap-3 sm:items-center"`  
  และ `actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"`
- **แต่ละลิงก์**:
  - **ก่อน `sm`**: แสดง **ไอคอนอย่างเดียว** + `aria-label` ชัดเจน (ชื่อเดียวกับข้อความบนเดสก์ท็อป)
  - **`sm+`**: แสดง **ข้อความ** (`hidden sm:inline`) — ซ่อนไอคอน (`sm:hidden`) เพื่อไม่ให้ซ้ำกับข้อความ
  - ขนาดแตะ: `min-h-[40px] min-w-[40px]` บนมือถือ · `sm:min-w-0 sm:px-4` (หรือเทียบเท่า) บนเดสก์ท็อป
- **กลุ่มลิงก์**: `flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2` — หลีกเลี่ยง `flex-wrap` ที่ดันลิงก์ลงบรรทัดใหม่บนมือถือ
- ลำดับลิงก์: คงลำดับเดิมของโมดูล (เช่น จัดการก่อน · รายงานหลัง — รายงานอยู่ขวาสุด)

## Pattern อ้างอิง

`src/app/(dashboard)/dashboard/asset/page.tsx` — การ์ด "สรุปทรัพย์สิน" + ลิงก์จัดการทรัพย์สิน / ดูรายงาน

```tsx
<AppSectionHeader
  className="flex flex-row items-start justify-between gap-3 sm:items-center"
  actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
  action={
    <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
      <Link href="..." aria-label="จัดการ…" className="app-btn-primary ... min-w-[40px] sm:min-w-0">
        <IconPrimary className="h-5 w-5 sm:hidden" aria-hidden />
        <span className="hidden sm:inline">จัดการ…</span>
      </Link>
      <Link href="..." aria-label="ดูรายงาน" className={cn(appTemplateOutlineButtonClass, "...")}>
        <IconReport className="h-5 w-5 sm:hidden" aria-hidden />
        <span className="hidden sm:inline">ดูรายงาน</span>
      </Link>
    </div>
  }
/>
```

ใช้กับโมดูลแดชบอร์ดอื่นที่มี Quick links ในการ์ดหัวแบบเดียวกัน


================================================================================
### .cursor/rules/dashboard-mobile-report-refresh-icon.mdc
================================================================================

---
description: หน้ารายงาน — ปุ่มรีเฟรชบนมือถือเป็นไอคอนมุมขวาของการ์ด
alwaysApply: true
---

# Mobile refresh on report cards (dashboard modules)

เมื่อหน้า **รายงาน** หรือแผงสรุปที่มีปุ่ม **รีเฟรช / โหลดข้อมูลใหม่** คู่กับ `AppSectionHeader` ภายใน `AppDashboardSection`:

- **มือถือ (`default`, ก่อน `sm`)**: แสดงเฉพาะ **ไอคอนรีเฟรช** ที่มุมขวาบนของการ์ด — จัดแถวเดียวกับหัวข้อ (`title` ซ้าย / ปุ่มขวา) ไม่ให้ปุ่มข้อความยาวกินพื้นที่
- **เดสก์ท็อป (`sm+`)**: แสดง **ไอคอน + ข้อความ** เช่น `รีเฟรช` หรือข้อความเทียบเท่า
- ปุ่มต้องมี **`aria-label`** ชัดเจน (เช่น `"รีเฟรชข้อมูลรายงาน"`) เพราะบนมือถือไม่มี visible label
- ขนาดแตะง่าย: **`min-h-[40px]`** และบนมือถือควรมี **`min-w-[40px]`** เมื่อเป็นไอคอนล้วน
- ขณะโหลด: **`disabled`** และ/หรือ **`aria-busy`** + สปินไอคอน (`animate-spin`) ตามดีไซน์โมดูล
- เลย์เอาต์หัวการ์ด: ส่ง **`className`** ให้ `AppSectionHeader` เป็นแนวนอนบนมือถือ เช่น  
  `className="flex flex-row items-start justify-between gap-3 sm:items-center"`  
  และ **`actionWrapClassName="shrink-0 self-start …"`** เพื่อให้ปุ่มชิดขวาบนเทียบกับหัวข้อ

## Pattern อ้างอิง

ดู `src/systems/asset/components/AssetReportsClient.tsx` — ปุ่มรีเฟรชภาพรวมทรัพย์สิน

```tsx
<AppSectionHeader
  className="flex flex-row items-start justify-between gap-3 sm:items-center"
  actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
  action={
    <button
      type="button"
      aria-label="รีเฟรชข้อมูลรายงาน"
      className="... min-h-[40px] min-w-[40px] sm:min-w-0 ..."
    >
      <RefreshIcon className="h-5 w-5 sm:mr-1.5" aria-hidden />
      <span className="hidden sm:inline">รีเฟรช</span>
    </button>
  }
/>
```

ใช้ pattern เดียวกับโมดูลรายงานอื่นในอนาคต (educare, POS, ฯลฯ) เมื่อมีปุ่มรีเฟรชในการ์ดสรุป


================================================================================
### .cursor/rules/dashboard-module-car-wash-barber-reference.mdc
================================================================================

---
description: แผนที่ไฟล์และแพทเทิร์นคู่ขนาน — คาร์แคร์ · ร้านตัดผม · ซักผ้า — อ้างอิงตอนสร้างโมดูลแดชบอร์ดใหม่
globs:
  - "**/systems/car-wash/**"
  - "**/systems/barber/**"
  - "**/systems/laundry/**"
  - "**/app/**/dashboard/car-wash/**"
  - "**/app/**/dashboard/barber/**"
  - "**/app/**/dashboard/laundry/**"
  - "**/components/layout/DashboardShell.tsx"
  - "**/components/dashboard/DashboardPagesShell.tsx"
---

# โมดูลแดชบอร์ด — อ้างอิงคู่ขนาน (คาร์แคร์ × ร้านตัดผม × ซักผ้า)

ใช้เมื่อสร้างโมดูลใหม่หรือทำให้ UX/UI / โครงสร้างไฟล์ใกล้เคียงแม่แบบ

**หลักการทั่วทั้งโปรเจกต์:** `.cursor/rules/dashboard-ux-car-wash-baseline.mdc` (`alwaysApply`)

**QR hub + FormModal:** `.cursor/rules/shop-qr-hub-popup-pattern.mdc`

**ซักผ้า — การ์ดสถิติแดชบอร์ด + QR:** `.cursor/rules/laundry-dashboard-ui.mdc`

**ความกว้าง PageContainer / gutter:** `.cursor/rules/dashboard-page-width.mdc`

---

## 1) โครงสร้างไฟล์ — เปรียบเทียบหน้าที่

| หัวข้อ | คาร์แคร์ | ร้านตัดผม |
|--------|----------|-----------|
| **หน้าหลักโมดูล (Server)** | `src/app/(dashboard)/dashboard/car-wash/page.tsx` | หลายหน้าใต้ `.../dashboard/barber/*/page.tsx` |
| **เลย์เอาต์โมดูล + guard + trial label** | (ไม่มี `layout.tsx` ระดับโมดูล — trial ส่งจาก page เข้า client) | `src/app/(dashboard)/dashboard/barber/layout.tsx` → `requireBarberSection` + `getActiveTrialBanner` + `DashboardDataLoadError` |
| **Client shell / chrome** | `CarWashDashboard.tsx` (หัวแก้ว + แท็บเดสก์ท็อป + แท็บล่างมือถือ + เนื้อหาตาม tab) | `BarberModuleShell.tsx` → `BarberLayoutChrome.tsx` + `BarberModuleHeader.tsx` (dock / desktop nav แยกไฟล์) |
| **โทเคนมุมมน / การ์ด** | ค่าในไฟล์ client (ดู `rounded-[2.5rem]` ใน `CarWashDashboard`) | `src/systems/barber/components/barber-ui-tokens.ts` |
| **พื้นที่แดชบอร์ดหลัก** | `DashboardShell` — แถบบน / sidebar / main โค้ง `rounded-[2.5rem]` | เหมือนกัน + `DashboardPagesShell` ลด gutter เมื่อ path barber **หรือ laundry** |
| **หน้าพนักงาน / kiosk** | `/dashboard/car-wash/staff` — `CarWashDashboard` + `layoutVariant="staff_lane"` | `/dashboard/barber/staff` — ซ่อน chrome โมดูล + เต็มจอ (`BarberModuleShell` / `DashboardPagesShell`) |
| **แถบทดลองสีแดง** | ส่ง `isTrialSandbox` / `trialSessionId` เข้า logic ลิงก์ — แถบแดงใช้ร่วมกันผ่าน `TrialSandboxStrip` ในเลย์เอาต์ที่เกี่ยวข้อง | `trialExpiresLabel` จาก `barber/layout.tsx` → `BarberLayoutChrome` → `TrialSandboxStrip` |
| **โมดัลลอยเหนือ dock** | `FormModal` (portal), z สูง | เพิ่ม `BarberModalPortal` เมื่อต้องลอยเหนือ dock มือถือ |

---

## 2) พฤติกรรมที่ควรทำซ้ำในโมดูลใหม่

1. **หัวแก้วชั้นนอก:** `rounded-[2.5rem]`, glass gradient, `backdrop-blur-2xl`, `border-white/50`, เงา inset ขาว — เทียบบล็อกหัวใน `CarWashDashboard` และ `BarberLayoutChrome` (`barberModuleGlassShellClass`)
2. **เมนูมือถือ:** แถบล่าง `fixed`, `rounded-[2.5rem]`, `inset-x-4`, safe-area — เทียบ dock คาร์แคร์และ `BarberModuleMobileDock`
3. **เมนูเดสก์ท็อป:** แถบใต้เส้นแบ่งในการ์ดหัว — แท็บคาร์แคร์ใช้ `rounded-xl`; บาร์เบอร์ใช้ `rounded-xl` ใน `barberNavLinkClass`
4. **หน้า plain inner:** หลีกเลี่ยงการ์ดกระจกซ้อนซ้ำ — บาร์เบอร์ใช้ flag `plainInnerContent` ใน `BarberLayoutChrome` (finance / packages / qr / staff)
5. **โหมดทดลอง:** URL พนักงาน/porter — ใส่ query `t=` เมื่อ sandbox (ดู `isTrialSandbox && trialSessionId` ในทั้งสองระบบ)
6. **ปุ่มแนวคาร์แคร์ในโมดัล:** `cw-btn` + ไอคอน + `cw-btn-label` (`globals.css`)

---

## 3) เช็กลิสต์โมดูลใหม่ (สั้น)

- [ ] มีหัวแก้ว + เมนูเดสก์ท็อป + dock ล่างมือถือ (หรือเหตุผลที่ไม่ใช้ dock)
- [ ] โค้งชั้นนอก `2.5rem` สอดคล้อง `DashboardShell` และโมดูลย่อย
- [ ] Gutter ไม่ซ้ำกับ `PageContainer` / `DashboardPagesShell` (ดู `dashboard-page-width.mdc`)
- [ ] หน้า staff/kiosk แยก UX — ไม่บังคับเมนูหลักโมดูลเต็มชุด
- [ ] Trial / sandbox — ลิงก์ภายนอก + แถบ `TrialSandboxStrip` หรือข้อความใน client สอดคล้องกัน

---

## 4) รับฝากซักผ้า — ไฟล์อ้างอิง

| บทบาท | ไฟล์ |
|--------|------|
| เลย์เอาต์ + guard + แถบทดลอง | `src/app/(dashboard)/dashboard/laundry/layout.tsx` → `requireLaundrySection` + `LaundryModuleShell` |
| Shell / chrome client | `src/systems/laundry/components/LaundryModuleShell.tsx`, `LaundryLayoutChrome.tsx` |
| แดชบอร์ด + dock + FormModal | `src/systems/laundry/LaundryDashboard.tsx` |
| Guard โมดูล | `src/systems/laundry/lib/guard.ts` |
| Staff kiosk | `/dashboard/laundry/staff` — `layoutVariant="staff_lane"`; ซ่อนแถบ MAWELL หลักเหมือน barber staff |

พฤติกรรม UX เทียบคาร์แคร์ (หัวแก้ว + แท็บเดสก์ท็อป + dock) และ **การ์ดสถิติ overview + ศูนย์ QR** — ดู **`.cursor/rules/laundry-dashboard-ui.mdc`** และ **`shop-qr-hub-popup-pattern.mdc`**


================================================================================
### .cursor/rules/dashboard-module-professional-polish.mdc
================================================================================

---
description: Professional polish standard for dashboard modules
globs: src/{app/(dashboard),systems}/**/*.{ts,tsx}
alwaysApply: false
---

# Dashboard Module Professional Polish

ใช้กฎนี้กับโมดูลถัดไปเพื่อให้ UX/UI ดูเป็นเครื่องมือมืออาชีพ

## Insight + Filter + Sticky Summary

- มี insight chips อัตโนมัติจากข้อมูลฝั่ง client (ไม่บังคับแก้ API)
- มี quick range chips: `7 วัน`, `30 วัน`, `ไตรมาส`, `ปีนี้`, `กำหนดเอง`
- บนมือถือควรมี sticky summary bar (รับ/จ่าย/คงเหลือ) ระหว่างเลื่อนดูรายการ

## Export / Print

- รองรับ `ส่งออก CSV` ตามช่วงที่กรอง
- รองรับ `พิมพ์/ส่งออก PDF` โดยใช้ `openPrintableHtml` จาก `@/components/app-templates`

## Data-entry Productivity

- ฟอร์มเพิ่มรายการควรมี smart suggestions จากรายการเดิมในช่วงล่าสุด
- รองรับ keyboard shortcuts อย่างน้อย:
  - `n` = เพิ่มรายการ
  - `f` = โฟกัสตัวกรอง/ค้นหา
  - `Esc` = ปิด modal

## Financial UX Features

- มี monthly budget card (ต่อหมวดหลัก) พร้อม progress และสีเตือน 80%/100%
- หน้าประวัติรองรับ batch actions (เลือกหลายรายการแล้วลบ/จัดการพร้อมกัน)
- มี density preset: `กระชับ` / `สบายตา`

## Visual Language

- จุดข้อมูลสำคัญใช้ semantic pastel (emerald/rose) เท่านั้น
- พื้นการ์ดหลักใช้ neutral glass เพื่อคุมภาพรวมให้สะอาด
- ค่าหลักใช้รูปแบบกระชับ เช่น `฿ 42,180` (คำว่า “บาท” ใช้เฉพาะที่จำเป็น)
- รองรับ icon mapping ตามหมวด เพื่อ scan เร็วโดยไม่เพิ่ม noise


================================================================================
### .cursor/rules/dashboard-page-width.mdc
================================================================================

---
description: ความกว้างและ gutter หน้าแดชบอร์ดให้สม่ำเสมอ — ห้ามซ้อน max-width หรือ padding แนวนอนคนละชุดโดยไม่จำเป็น
alwaysApply: true
---

# Dashboard layout — ความกว้าง container ให้เท่ากัน

- หน้าใต้ `src/app/(dashboard)/dashboard/` ถูกห่อด้วย `PageContainer` ใน `dashboard/layout.tsx` แล้ว — ใช้ **`max-w-6xl`** และ **`PAGE_GUTTER_X`** (`px-4 sm:px-6`) เป็นชั้นเดียวสำหรับจำกัดความกว้างและระยะขอบจากขอบ viewport
- **ห้าม** ใส่ `max-w-6xl mx-auto` ซ้ำใน layout/shell ของโมดูลย่อย ยกเว้นมีเหตุผลชัด (เช่น หน้าเต็มจอที่ไม่อยู่ใต้ PageContainer)
- โมดูลที่มีหลายหน้า ให้ยึดแบบเดียวกับ **รายรับ-รายจ่าย** (`*Shell` = หัวข้อ + แถบเมนู) หรือ **POS ร้านอาหาร** (`BuildingPosShell` = การ์ดหัว glass **รวม** แท็บหลัก/ย่อย hub แบบคาร์แคร์ — ดู `building-pos-dashboard-template.mdc`) — **ห้าม** ห่อ `children` ทั้งหน้าด้วยการ์ดใหญ่ `rounded-3xl border` อีกชั้น; เนื้อหาไหลต่อใต้ `PageContainer` โดยแต่ละการ์ดย่อยใช้ `app-surface` / border ตามจุดได้
- ถ้าจำเป็นต้องจัด padding แนวนอนชั้นในเพิ่ม ใช้ **`PAGE_INNER_GUTTER_X`** จาก `@/components/ui/page-container` ให้สม่ำเสมอ ไม่ให้เมนูกับเนื้อหาหลุดจังหวะ
- เมื่อเพิ่มหน้า/โมดูลแดชบอร์ดใหม่ ให้เช็คว่าไม่ทำให้ content แคบหรือกว้างกว่าหน้าอื่นที่ใช้ `PageContainer` อย่างผิดลิขสิทธิ์


================================================================================
### .cursor/rules/dashboard-row-action-icon-buttons.mdc
================================================================================

---
description: ปุ่มแก้ไข/ลบในแถวรายการ — ใช้ไอคอน + aria-label + โทเค็นคลาสมาตรฐาน
alwaysApply: true
---

# Row action buttons — edit / delete as icons (dashboard lists)

เมื่อมีปุ่ม **แก้ไข** และ **ลบ** (หรือ **ปิดการใช้งาน** / soft delete) ใน **แถวของรายการ** ภายใน `AppDashboardSection` หรือ list ลักษณะเดียวกัน:

## บังคับ

- แสดงเป็น **ไอคอนล้วน** (ไม่ใช้ข้อความ "แก้ไข" / "ลบ" บนปุ่ม) เพื่อประหยัดความกว้างแถวทั้งมือถือและเดสก์ท็อป
- ทุกปุ่มต้องมี **`aria-label`** ชัดเจน ระบุการกระทำ + บริบท (เช่น ชื่อรายการ / รหัส) เพื่อผู้ใช้ screen reader
- แนะนำ **`title`** เดียวกับคำอธิบายสั้น ๆ เพื่อ tooltip บนเดสก์ท็อป
- ขนาดแตะง่าย: **`min-h-[40px] min-w-[40px]`** อย่างน้อย
- **แก้ไข**: ไอคอนดินสอ/แผ่น — โทนกลาง `border-white/60 bg-white/80 text-[#4d47b6]`
- **ลบ / ปิดใช้งาน**: ไอคอนถังขยะ — โทนเตือน `border-rose-200 bg-rose-50 text-rose-600` (หรือเทียบเท่าตามโมดูล)
- ไอคอนภายในปุ่มใส่ **`aria-hidden`** (เพราะมี `aria-label` ที่ปุ่มแล้ว)
- ใช้โทเค็นร่วมเมื่อเป็นโมดูลเดียวกัน — อ้างอิง `src/systems/asset/components/AssetRowActionIcons.tsx`:
  - `IconRowEdit`, `IconRowRemove`
  - `assetRowEditIconButtonClass`, `assetRowRemoveIconButtonClass`

## Pattern อ้างอิง

```tsx
import {
  assetRowEditIconButtonClass,
  assetRowRemoveIconButtonClass,
  IconRowEdit,
  IconRowRemove,
} from "@/systems/asset/components/AssetRowActionIcons";

<div className="flex shrink-0 items-center gap-1">
  <button
    type="button"
    className={assetRowEditIconButtonClass}
    aria-label={`แก้ไข ${row.name}`}
    title="แก้ไข"
  >
    <IconRowEdit className="h-4 w-4" />
  </button>
  <button
    type="button"
    className={assetRowRemoveIconButtonClass}
    aria-label={`ลบ ${row.name}`}
    title="ลบ"
  >
    <IconRowRemove className="h-4 w-4" />
  </button>
</div>
```

โมดูลอื่น (educare, POS, ฯลฯ) ให้คัดลอกโทเค็น/ไอคอนไปที่ `app-templates` หรือโฟลเดอร์โมดูลกลาง หากใช้ซ้ำหลายที่ — **ห้าม** คัดลอกบล็อก SVG ซ้ำในหลายไฟล์ถ้าจะขยายเป็นมาตรฐานโปรเจกต์


================================================================================
### .cursor/rules/dashboard-ux-car-wash-baseline.mdc
================================================================================

---
description: แม่แบบ UX/UI แดชบอร์ดโมดูล — เมนูมือถือล่างโค้งมน การ์ดมุมมน เฉดสีไอคอนตัวอักษร อ้างอิงระบบคาร์แคร์
alwaysApply: true
---

# แม่แบบ UX/UI โมดูลแดชบอร์ด (ถือคาร์แคร์เป็นแม่แบบ)

เมื่อออกแบบหรือทำระบบแดชบอร์ดโมดูลใหม่ใน repo นี้ ให้ยึด **ระบบคาร์แคร์** เป็นต้นแบบหลักด้าน UX/UI — โมดูลอื่น (เช่น ร้านตัดผม) เป็นแบบอ้างอิงว่าลงโค้ดอย่างไรให้ใกล้เคียง

---

## 1) เมนูบนมือถือ — อยู่ด้านล่าง และโค้งมน

- แถบนำทางหลักของโมดูลบน viewport แคบ (**มือถือ / แท็บเล็ตแนวตั้งตาม breakpoint โปรเจกต์**) ต้องเป็น **แถบลอยด้านล่าง** (`fixed` / `sticky bottom`) — **ไม่** ใช้แถบบนหรือ hamburger แทนฐานนำทางหลักของโมดูล
- **ความโค้งมน** ของ dock / pill ลอย: ใช้โทนเดียวกับแม่แบบ เช่น **`rounded-[2rem]`–`rounded-[2.5rem]`** + **`backdrop-blur`** + เส้นขอบโปร่ง
- รองรับ **safe area** ด้านล่าง: `env(safe-area-inset-bottom)` บนแถบเมนูหรือ padding ของมัน
- **พื้นที่เลื่อนเนื้อหา** ต้องมี padding-bottom เพื่อไม่ให้ถูก dock บัง (ดูแม่แบบในโค้ดจริง)
- **อ้างอิงโค้ด:** `src/systems/car-wash/CarWashDashboard.tsx` (แท็บล่าง / สลับโซน), `src/systems/barber/components/BarberLayoutChrome.tsx`, `BarberModuleMobileDock` / `BarberModuleHeader.tsx`

---

## 2) ความโค้งมนของการ์ด (ลำดับชั้น)

ใช้ความโค้งสัมพันธ์กับระดับการ์ด — **ชั้นในห้ามโหดกว่าชั้นนอกโดยไม่จำเป็น**

| ระดับ | แนวทาง |
|--------|--------|
| เปลือกโมดูล / การ์ดห่อใหญ่ | `rounded-[2.5rem]` (มือถือบางจุดลดเป็น `rounded-2xl` ตามแม่แบบ) |
| การ์ด hub / การ์ดคู่ใหญ่ (เช่นเลือก QR) | `rounded-[2.5rem]` + glass / เงานุ่ม |
| การ์ดย่อย / แผงในเนื้อหา | `rounded-[2rem]` หรือ `rounded-2xl` / `rounded-[1.25rem]` ตามความหนาแน่นของ UI |
| ปุ่ม / chip / input ในการ์ด | โค้งย่อยลงอีกขั้นให้สมดุล (เช่น `rounded-xl`) |

- **โมดูลร้านตัดผม:** ใช้ token จาก `src/systems/barber/components/barber-ui-tokens.ts` (`barberCardSurfaceRadiusClass` ฯลฯ) เป็นตัวเลขมาตรฐาน
- **แถบหัวภาพรวมโปรเจกต์:** `src/components/layout/DashboardShell.tsx` — แถบบน (sticky), **sidebar** เดสก์ท็อป และ `<main>` ใช้ **`rounded-[2.5rem]`** ให้สอดคล้อง drawer มือถือ (`rounded-[2.5rem]`) และเปลือกโมดูลคาร์แคร์/บาร์เบอร์

---

## 3) เฉดสี ไอคอน ตัวอักษร (ความสวยงามและสม่ำเสมอ)

- **พื้น glass:** ไล่โปร่ง `from-white/50 via-… to-…`, **`backdrop-blur-2xl`**, ขอบ `border-white/40–55`, แหวน inset ขาวอ่อนบางจุด — อย่าให้พื้นทึบทับทั้งโมดูลโดยไม่จำเป็น
- **หัวข้อสำคัญ:** `font-black tracking-tight`, สีตัวอักษรเข้ม `#1e1b4b` / โทนม่วงแบรนด์ — **ไล่สีข้อความ** (`bg-gradient-to-r` + `bg-clip-text text-transparent`) ใช้เฉพาะจุดเน้น ไม่ทั้งย่อหน้า
- **ข้อความรอง:** contrast ชัด ใช้โทนเทา–ม่วงอ่อน (`#66638c`, `#5f5a8a`) ไม่แข่งกับหัวข้อ
- **ไอคอน:** จัดคู่ปุ่มและการ์ดคำอธิบาย ขนาดสม่ำเสมอ มี **`aria-label`** หรือข้อความ visible ที่ชัด — ติด **`aria-hidden`** เมื่อเป็น purely decorative คู่ข้อความ
- **ปุ่มแถบเครื่องมือในโมดัล (สายคาร์แคร์):** คลาส **`cw-btn`** + **`cw-btn-icon`** + **`cw-btn-label`** (`src/app/globals.css`) — บนจอแคบซ่อนป้าย เหลือไอคอน

---

## 4) ระบบคาร์แคร์เป็นแม่แบบ UX/UI

- ก่อนทำหน้า/โฟลว์ใหม่ ให้ดู **`src/systems/car-wash/CarWashDashboard.tsx`** และพาแนลที่เกี่ยวข้อง (แท็บ, **`FormModal`**, QR, ปุ่ม **`cw-btn`**, การจัดการ์ด)
- กฎเชิงลึกเฉพาะคาร์แคร์: **`.cursor/rules/car-wash-dashboard-ui.mdc`**
- การนำแม่แบบไปโมดูลอื่น (dock, token การ์ด, plain inner): **`.cursor/rules/barber-module-dashboard-template.mdc`**
- Hub QR การ์ดคู่ + ป๊อปอัป: **`.cursor/rules/shop-qr-hub-popup-pattern.mdc`**
- **แผนที่ไฟล์คู่ขนาน (คาร์แคร์ × ร้านตัดผม):** **`.cursor/rules/dashboard-module-car-wash-barber-reference.mdc`**

เมื่อแม่แบบคาร์แคร์กับโมดูลใหม่ขัดกันเรื่องโดเมน ให้คง **โครงสร้าง UX** (เมนูล่าง, มุมมน, glass, โมดัล) แล้วปรับสีคัดลอก/ข้อความให้เข้าธีมโดเมน


================================================================================
### .cursor/rules/dormitory-cards-ui.mdc
================================================================================

---
description: การ์ดห้องพักหอพัก — โทน UI และตัวหนังสือให้สอดคล้องกับ dorm-ui
globs:
  - "src/systems/dormitory/**/*.{ts,tsx}"
  - "src/app/(dashboard)/dashboard/dormitory/**/*.tsx"
alwaysApply: false
---

# การ์ดและตัวหนังสือโมดูลหอพัก

เมื่อเพิ่มหรือแก้ **หน้าแดชบอร์ดผังห้อง**, **รายการห้อง**, หรือการ์ด/กล่องข้อมูลห้องในโมดูลหอพัก:

1. **ใช้คลาสจาก** `@/systems/dormitory/dorm-ui` — ห้ามคิดสไตล์การ์ดห้องใหม่แยก ถ้ามีโทเคนอยู่แล้ว (`dormCard`, `dormRoomTile`, `dormRoomListCard`, `dormRoomFloorPill`, `dormRoomCardDivider`, `dormRoomFieldLabel`, `dormRoomOccLine`, `dormRoomTypeHint`, `dormRoomStatRow`, `dormRoomStatValue`, `dormRoomCardCta`, `dormBtnPrimary` / `dormBtnSecondary` ฯลฯ)  
   - ถ้าต้องการรูปแบบใหม่ที่ใช้ซ้ำ — **ขยาย `dorm-ui.ts`** แล้วใช้จากที่เดียว

2. **ลำดับชั้นข้อความในการ์ด**  
   - ป้ายกำกับจิ๋วภาษาไทย (`dormRoomFieldLabel`) คู่กับค่าหลัก (เลขห้อง, สถานะ, ประเภท)  
   - เลขห้องใช้ `dormRoomNumberHero` (ผัง) หรือ `dormRoomNumberList` (รายการ)  
   - ชั้นใช้ `dormRoomFloorPill` บนผัง; บนรายการใช้บรรทัดชัดแยกจากประเภทห้อง

3. **ภาษาไทย** — **ห้ามใช้ `uppercase`** กับข้อความไทยในป้าย/การ์ด (ไม่สวยและไม่จำเป็น)

4. **`RoomBillingStatusBadge`**  
   - ผังห้อง (การ์ดแคบ): `size="compact"`  
   - การ์ดรายการห้อง (คอลัมน์ขวา): `size="compactWide"`  
   - ที่เหลือ: `default`

5. **ตัวเลข** — ค่าเช่า/ยอดเงินใช้ `tabular-nums` และ `toLocaleString("th-TH", …)` ให้สอดคล้องหน้าอื่น

6. **การ์ดรายการห้อง** — แถว **ผู้พัก** / **ค่าเช่า** ใช้ `dormRoomStatRow` + ป้าย + `dormRoomStatValue`; ลิงก์ท้ายการ์ดใช้ `dormRoomCardCta`

7. **ผังห้อง** — ห้องที่มีค้างชำระงวดเก่า ต่อท้ายคลาสการ์ดด้วย `dormRoomTileOverdueHint` (จุดส้ม) ให้สอดคล้องแดชบอร์ด


================================================================================
### .cursor/rules/laundry-dashboard-ui.mdc
================================================================================

---
description: รับฝากซักผ้า — แดชบอร์ดการ์ดสถิติ (เทียบคาร์แคร์) และศูนย์ QR แบบ Hub
globs:
  - "**/systems/laundry/**"
  - "**/app/**/dashboard/laundry/**"
---

# Laundry — แดชบอร์ด & การ์ดสถิติ & QR

**แม่แบบ UX ระดับโมดูล:** เทียบ **`CarWashDashboard`** (`overview`) และ **`shop-qr-hub-popup-pattern.mdc`**

**แม่แบบโครงสร้างโมดูลทั้งก้อน:** **`dashboard-module-car-wash-barber-reference.mdc`**

---

## มือถือ — หนึ่งการ์ดต่อแถว

บน viewport **ต่ำกว่า `sm` (default Tailwind)** — กริด **`laundryDashboardCardGridClass`** (งานค้าง · การเงิน — ประวัติรายรับ) และการ์ดเลือกแพ็กเกจใน **`LaundryRecordOrderModal`** ใช้ **`grid-cols-1`** (**หนึ่งการ์ดเต็มความกว้างต่อแถว**) · **`sm+`** — **`grid-cols-2`** · **แถวสถิติวันนี้** ใช้ **`laundryDashboardStatsGridClass`** แยกต่างหาก (**`grid-cols-2`** ตลอด = **2×2** สำหรับการ์ดสถิติ 4 ใบ) · **แท็บ «แพ็กเกจ»** **`laundryPackageTabListGridClass`** (**`grid-cols-1` ตลอด**) — ไม่นับเมนูแท็บ/FAB

---

## การ์ดสถิติหน้าแดชบอร์ด (overview)

ให้ใช้ **โครงเดียวกับคาร์แคร์** — แถวสถิติและกริดรายการแยกค่าคงที่ตามด้านล่าง:

1. **ห่อชั้นนอก** — `rounded-[2.5rem] border border-white/55 bg-white/28 p-3 shadow-[0_18px_40px_-24px_rgba(30,27,75,0.35)] backdrop-blur-xl sm:p-5`
2. **หัวแถว** — `สถิติวันนี้` · มือถือกระชับขึ้น: `text-[9px] tracking-[0.18em] sm:text-[10px] sm:tracking-[0.2em]` + เส้น `h-px flex-1 bg-white/65`
3. **กริดการ์ดสถิติ (`LaundryStat` × 4)** — ใช้ **`laundryDashboardStatsGridClass`** จาก `src/systems/laundry/laundry-dashboard-layout.ts` — **`grid grid-cols-2 gap-2 sm:gap-3`** (**สองคอลัมน์ต่อแถวทุกขนาดจอ** · สี่การ์ด = สองแถว)
4. **กริดการ์ดงาน (overview / คิว / การเงิน — ประวัติรายรับ)** — ใช้ **`laundryDashboardCardGridClass`** — **`grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3`**
   - **มือถือ** — **หนึ่งการ์ดต่อแถว** (`grid-cols-1`) สำหรับ **`LaundryOrderCard`**
   - **`sm+` (คอม)** — **สองคอลัมน์ต่อแถว** (`sm:grid-cols-2`)
5. **แท็บ «แพ็กเกจ» — รายการแพ็กเกจ** — `<ul>` ใช้ **`laundryPackageTabListGridClass`** — **`grid grid-cols-1 gap-2 sm:gap-3`** (**หนึ่งการ์ดต่อแถวทุกขนาดจอ** รวมคอม) · **ไม่** ใช้ `laundryDashboardCardGridClass` ที่นี่ · **`LaundryPackageCard`** ตั้ง **`packagesTabRowLayout`** เพื่อบน **`sm+`** จัดเนื้อหาหลักเป็น **แถวแนวนอน** (ชื่อ · เวลา · ตะกร้าเป็น `<ul>` ข้อความ **`flex-wrap`** · ขวาเมตาข้อความ + ราคา + ปุ่ม · รูป **`sm:h-[4rem] sm:w-[4rem]`**) · **ไม่** ใช้กล่อง/pill ภายในการ์ด
6. **รายการงานบนแดชบอร์ด** — ห่อด้วย **`<ul className={cn(laundryDashboardCardGridClass, "list-none p-0")} aria-label="…">`** · แต่การ์ดอยู่ใน **`<li className="min-w-0">`** — **ไม่** ใช้ `HomeFinanceList` แบบคอลัมน์เดียวเมื่อเป็นรายการบนแดชบอร์ดหลัก

### `LaundryStat` — มือถือกระชับ / เดสก์ท็อปเต็ม

- มุมมนเล็กลงบนมือถือ: `rounded-[1.35rem] sm:rounded-[2rem]`
- Padding: `p-3 sm:p-5 lg:p-6` (ไม่ใช้ `p-5` เต็มบนมือถือ)
- หัวข้อการ์ด: `text-[8px] leading-tight tracking-[0.12em] sm:text-[10px] sm:tracking-widest`
- ตัวเลข: `text-lg sm:text-2xl lg:text-3xl` · `mt-2 sm:mt-4`
- ไอคอนมุมขวา: `scale-[0.85] sm:scale-100`
- โคลง gradient / hover เทียบ **`CarWashStat`** (`CarWashDashboard.tsx`)

**Implementation:** `LaundryStat` + overview + กริดรายการใน `src/systems/laundry/LaundryDashboard.tsx`

**ระยะห่างแนวตั้ง:** บล็อกสถิติกับเนื้อหาด้านล่างใช้ `space-y-4 sm:space-y-6`

**ไม่มีการ์ดทางลัด QR บนแดชบอร์ด** — เข้าศูนย์ QR ผ่านแท็บเมนู **QR** เท่านั้น

---

## เมนูการเงิน (`finance`)

แท็บ **การเงิน** ใน **`LaundryDashboard`** ให้สอดคล้อง **`CarWashDashboard`** แท็บ **`finance`** และ **`CarWashSalesPanel`**:

1. **โครงรวม** — **`LaundryFinancePanel`** (`src/systems/laundry/components/LaundryFinancePanel.tsx`): หัว «ภาพรวมการเงิน» · ตัวกรองปี / เดือน / วัน / ค้นหา (เดสก์ท็อป **`grid-cols-2`** สองฟิลด์ต่อแถว · มือถือ **`FormModal`**) · การ์ดสามใบ **รายได้ · รายจ่าย · กำไร** เป็น **`grid-cols-2`** โดยการ์ดกำไร **`col-span-2`** (แถวล่างเต็มความกว้าง) · แถวกราฟ + โดนัต **`lg:grid-cols-2`** · **`AppRevenueCostColumnChart`** เปรียบเทียบรายได้กับรายจ่ายรายวัน (คีย์วันที่โซน **Asia/Bangkok**) · การ์ดโดนัตสัดส่วนรายได้ตามชื่อแพ็กเกจ
2. **รายรับ** — ประวัติการให้บริการ = รายการ **`LaundryOrder`** ในช่วงที่กรอง · กริด **`laundryDashboardCardGridClass`** + **`LaundryOrderCard`** (`showOrderedAt`) · มีตัวกรองสถานะงานภายในแท็บ · **ไม่นับยอดเข้ารายได้** (กราฟ / การ์ดยอดรวม / โดนัต) เมื่อสถานะ **`CANCELLED`**
3. **รายจ่าย / ต้นทุน** — **`LaundryCostPanel`** (`src/systems/laundry/components/LaundryCostPanel.tsx`) เทียบ **`CarWashCostPanel`**: จัดการหมวด · บันทึก / แก้ไข / ลบรายการ · แนบสลิปผ่าน **`uploadLaundrySessionImage`** · รายการที่ส่งเข้าแผงจะถูกกรองตามช่วงวันที่และคำค้นแล้วจาก **`LaundryFinancePanel`**
4. **API และข้อมูล** — `GET`/`POST` **`/api/laundry/session/cost-categories`** · `PATCH`/`DELETE` **`…/cost-categories/[id]`** · `GET`/`POST` **`/api/laundry/session/cost-entries`** · `PATCH`/`DELETE` **`…/cost-entries/[id]`** — ตาราง **`laundry_cost_categories`** / **`laundry_cost_entries`** (คีย์ `trial_session_id` เดียวกับออเดอร์) · client ใช้ **`LaundryRepository`** ใน **`laundry-service.ts`** (`listCostCategories`, `createCostEntry`, …)

**การโหลดแดชบอร์ด:** เรียก **`listCostCategories`** และ **`listCostEntries`** คู่กับแพ็กเกจและออเดอร์ใน **`loadAll`** เพื่อให้แท็บการเงินพร้อมใช้ทันที

---

## Responsive การ์ดรายการ (`LaundryOrderCard` / `LaundryPackageCard`)

เมื่อแสดงในกริดแดชบอร์ด (มือถือ = **หนึ่งการ์ดเต็มความกว้างต่อแถว**):

- **โครง**: `rounded-lg p-2 gap-2 sm:rounded-2xl sm:p-4 sm:gap-4`
- **Typography มือถือ**: หัวข้อแพ็กเกจ `text-[9px] sm:text-[10px]` · ชื่อหลัก `text-sm sm:text-lg` · เบอร์/ราคา/สถานะลดขั้นหนึ่งบน `max-sm`
- **คอลัมน์ขวา (ราคา/ปุ่ม)**: ใช้ **`min-w-[5.75rem] w-[30%] max-w-[8rem] sm:min-w-[9rem] sm:w-[9rem]`** เพื่อไม่แย่งพื้นที่ข้อความเมื่อกริดเป็น **หลายคอลัมน์ที่ `sm+`**
- **ที่อยู่**: `line-clamp-1 sm:line-clamp-2`
- **เวลารับงาน** (`showOrderedAt`): บนมือถือใช้รูปแบบสั้น (`day/month short` + เวลา) · `sm+` ใช้ `toLocaleString` เต็ม
- **`LaundryToolbarIconButton`**: `h-8 w-8 rounded-lg sm:h-9 sm:w-9 sm:rounded-xl` · ไอคอนย่อบนมือถือ
- **`LaundryOrderStatusIconStrip`**: `h-8 min-w-[2rem] rounded-lg sm:h-10 sm:min-w-[2.5rem] sm:rounded-xl` · glyph `15px → 18px` ที่ `sm`

**การ์ดแพ็กเกจ (`LaundryPackageCard`)** — แท็บแพ็กเกจส่ง **`packagesTabRowLayout`** · **ข้อความล้วน** — ไม่ pill/กล่องภายใน · เมตาขวาแถวเดียวคั่น **`·`** · ตะกร้าเป็น `<ul>` แถวข้อความ · **มือถือระยะแนวตั้งกระชับ** — ดูหัวข้อ **«`LaundryPackageCard` — มือถือ (ระยะห่าง)»** ด้านล่าง

---

## คำบรรยาย (subtitle)

- **กระชับ** — ประมาณหนึ่งบรรทัดหรือสั้นกว่า (ไม่ซ้ำความที่หัวข้อบอกแล้ว)
- **มือถือ** — **ไม่แสดง** คำบรรยายใต้หัวข้อหลัก / ใต้หัวแผง / ใน **`FormModal`** (`hidden sm:block` ใน `AppSectionHeader` และ `FormModal`)
- โมดูลซักผ้า: ข้อความช่วยใต้หัวแพ็กเกจ · หัวคิวงาน · โหมดพนักงาน — ใช้ **`hidden sm:block`** และข้อความสั้นบน `sm+` เท่านั้น

---

## แผง «งานที่กำลังดำเนินการ» (คิวงาน)

เทียบ **`CarWashServiceLanePanel`** (`headerRow` + `onRefresh` / `onRecordVisit`):

1. **อย่าวางปุ่มรีเฟรชที่หัวกระจกโมดูล** (`laundryGlassShellClass`) — คาร์แคร์ไม่มีรีเฟรชที่หัวการ์ดหลัก; รีเฟรชอยู่ที่แผงลาน/คิว
2. **หัวแผง** — `flex` + ซ้าย: ไอคอนในกล่องมุมมน (`rounded-2xl border …`) + `h2` ชื่อแผง + คำอธิบายบรรทัดเดียว (`text-xs text-[#66638c]` · **`hidden sm:block`**); ขวา: ปุ่ม **`cw-btn`** คู่ **รีเฟรช** (`app-btn-soft`) + **บันทึกรายการ** (`app-btn-primary`) พร้อม `cw-btn-icon` / `cw-btn-label`
3. **มือถือ (`max-width: 639px`)** — `globals.css` บังคับ `.cw-btn` เป็นปุ่มสี่เหลี่ยมไอคอนอย่างเดียวและซ่อน `.cw-btn-label` — พฤติกรรมเดียวกับคาร์แคร์เมื่อใช้ชุดปุ่มเดียวกัน
4. **เส้นแบ่งใต้หัว** — `border-b border-[#ecebff] pb-3`
5. **โหมดพนักงาน (`staff_lane`)** — ใช้หัวแผงชุดเดียวกัน (รีเฟรช + บันทึกในกล่องม่วง); หัวกระจกด้านบนมีแค่ชื่อเรื่อง — **ไม่** ใส่ปุ่มรีเฟรชซ้ำ

**Implementation:** `LaundryActiveOrdersPanelHeader` ใน `LaundryDashboard.tsx`

### การ์ดแต่ละรายการ (`LaundryOrderCard`)

เทียบ **การ์ดคิวลานล้าง** ใน `CarWashServiceLanePanel` (ทะเบียน/แพ็ก/ราคา แยกคอลัมน์ · `border-2` · `ring-1` · พื้นหลังตามสถานะ):

1. **โครงกล่อง** — `rounded-lg border-2 · sm:rounded-2xl` · `p-2 sm:p-4` · `ring-1` · `shadow-sm` · `hover:shadow-md` · พื้น/ขอบตาม `laundryOrderCardToneClasses(status)` ใน `src/systems/laundry/laundry-order-card-tone.ts` (amber / sky / violet / cyan / indigo / teal / emerald / slate / rose ตามสายงาน)
2. **แถบไฮไลต์ซ้าย** — `absolute` แถบ `w-1` `bg-gradient-to-b` ตาม `ribbonGradient` · ขยายเมื่อ `group-hover/item` (เทียบแพ็กเหมาคาร์แคร์)
3. **แบ่งซ้าย–ขวา** — `flex` · `gap-2 sm:gap-4`
   - **ซ้าย (`flex-1`)** — หัว `แพ็กเกจ` ตัวพิมพ์เล็ก uppercase · **ชื่อบรรทัดหลัก** จาก `laundryOrderCardPackageLines(package_name, service_type)` — ถ้า `service_type` เป็นแค่ชื่อแพ็กเกจ + คำขยาย เช่น `(ตะกร้า S)` ให้แสดง **บรรทัดเดียว** (`service_type` เต็ม) · แสดงบรรทัดรองเฉพาะเมื่อสองฟิลด์ไม่เกี่ยวข้องกัน · gradient เดิม (`bg-clip-text`) · แถวข้อความ **ขนาด** (ไม่ใช้แคปซูลมีขอบ) · เบอร์ · ชื่อ · เวลา · ที่อยู่ (ตามกฎซ่อน placeholder)
   - **ขวา** — คอลัมน์ย่อบนมือถือ (`min-w-[5.75rem] w-[30%] max-w-[8rem] sm:min-w-[9rem] sm:w-[9rem]`) — ข้อความสถานะ (สีตามขั้น · **ไม่** ใช้แคปซูล) · `#id` · ราคา · กลุ่มปุ่มดู/แก้ไข/ลบ — **ไม่** ใช้ `border-l` / พื้นหลังแถบปุ่ม (แยกด้วย `gap` / `pt`)
4. **อัปเดตสถานะ (คิวงาน)** — **ไม่ใช้ `<select>`** — ใช้ **`LaundryOrderStatusIconStrip`** แถบเลื่อนแนวนอน · ปุ่ม **`h-8 min-w-[2rem]` บนมือถือ** · `sm:` ขยายเป็น ~40px · ไอคอนรายสถานะ + **`aria-label` / `title`** เป็นชื่อไทย (`laundryOrderStatusLabelTh`) · สถานะปัจจุบัน `aria-current="true"` + ขอบ/วงแหวนเน้น · แถบมี **`role="toolbar"`** + **`aria-label`** ระบุเลขรายการ · ซ่อนหัวข้อความรอง «อัปเดตสถานะ» บนมือถือ (`hidden sm:block`) — แก้สถานะในโมดัลแก้ไขออเดอร์ยังใช้ dropdown ได้ตามฟอร์ม · **บล็อกนี้ยังใช้ `border-t-2` + `dividerStrong` + `dimHorizontalStripRidge`** จาก `laundryDashboardCardDividerClasses` เพื่อคั่นจากเนื้อหาด้านบน (ส่วนเดียวที่มีเส้นคั่นแนวนอนในการ์ด)

---

## บันทึกรายการแบบ POS (`LaundryRecordOrderModal`)

เทียบ flow **เลือกเมนูเป็นการ์ดมีรูป** (`BuildingPosCustomerOrderClient` / `MenuDishCardGrid`):

- **ตำแหน่งโมดัล:** ใช้ **`FormModal` + `mobileCentered`** ทั้งโมดัลหลัก (เลือกแพ็กเกจ / ข้อมูลลูกค้า) และโมดัลจัดการแพ็กเกจ — ให้แผงอยู่ **กึ่งกลางจอบนมือถือ** (`items-center` + `p-3`) และมุมการ์ด `rounded-[2rem]` ไม่ใช้แบบชิดขอบล่าง (`items-end`)

1. **ปุ่มบันทึกรายการ** → โมดัลขั้น **เลือกแพ็กเกจ** — กริดการ์ดรูปสูง `aspect-[4/3]` + ชื่อ + ช่วงราคา · **มือถือ `grid-cols-1` (หนึ่งการ์ดต่อแถว)** · `sm+` เป็น `grid-cols-3` · แตะเลือกมี overlay เช็ค (โทน indigo เดียวกับ POS template)
2. **ปุ่มเฟือง** มุมการ์ด → โมดัลย่อย **จัดการ** — อัปโหลดรูป (`uploadLaundrySessionImage`) / URL รูป · แก้ชื่อ โมเดลราคา ราคาฐาน · **แถวตะกร้า × ราคา** (หลายขนาด)
3. ถ้ามี `basket_tiers` — แสดงชิปเลือกขนาดใต้กริดก่อนไปขั้นถัดไป
4. ขั้น **ข้อมูลลูกค้า** — เฉพาะ **เบอร์โทร** และ **ชื่อ** (ไม่บังคับ) · ที่อยู่/น้ำหนัก/หมายเหตุไม่มีในฟอร์ม — ระบบเก็บที่อยู่เป็น `-` และชื่อว่างเป็น `ลูกค้า` ที่ API

**รายการงานบนแดชบอร์ด:** แต่ละแถวมีกลุ่มปุ่มไอคอน **ดู / แก้ไข / ลบ** (`LaundryToolbarIconButton`) — ดูรายละเอียด · แก้ชื่อ เบอร์ สถานะ หมายเหตุ (`LaundryOrderEditModal`) · ลบหลังยืนยัน

ข้อมูลแพ็กเกจเก็บ `image_url` + `basket_tiers` (JSON) ในตาราง `laundry_packages` — แท็บ **แพ็กเกจ** มีปุ่ม **เพิ่มแพ็กเกจ** (`LaundryPackageEditorModal` โหมดสร้าง) + รายการสรุป · **ดู / แก้ไข / ลบ** เป็นไอคอนชุดเดียวกับรายการงาน · แก้เต็มที่ผ่าน `LaundryPackageEditorModal` และจัดการจากโมดัลย่อยในโฟลว์ POS (ปุ่มเฟืองบนการ์ดแพ็กเกจ)

### การ์ดแพ็กเกจรายการ (`LaundryPackageCard`)

- **ที่ใช้ในแดชบอร์ด:** เฉพาะแท็บ **«แพ็กเกจ»** (`LaundryDashboard.tsx`) — ส่ง **`packagesTabRowLayout`** คู่กับ **`laundryPackageTabListGridClass`** บน `<ul>`
- **สไตล์หลัก — ข้อความล้วน (ไม่ใช้กล่องภายใน)** — **ไม่** ใช้ pill/badge พื้นสี · **ไม่** ใช้แถบเวลาแบบมี `bg`/`ring` · **ไม่** ใช้การ์ดย่อยรอบแต่ละตะกร้า — ใช้แค่ **`border`** เบาบน **`article`**, gradient แถบซ้าย, รูปสี่เหลี่ยมมน, และตัวอักษรจัดแถว
- **เปลือกการ์ด** — **`rounded-xl sm:rounded-2xl`** · **`border border-indigo-200/70`** · **`bg-white/90`** · **ไม่** ใช้เงาหนัก · **`p-2.5 sm:p-4`** — มือถือ padding แนวตั้งรัดกว่า
- **รูป** — **`rounded-lg sm:rounded-xl`** · **`bg-slate-100`** เมื่อว่าง · **ไม่** `ring` รอบรูป · **`packagesTabRowLayout`**: **`sm:h-[4rem] sm:w-[4rem]`**
- **`labelKicker`** — **`text-[10px] sm:text-[11px]`** · **`font-semibold`** · **`uppercase`** · **`tracking-[0.14em]`** · **`text-slate-500`** — เฉพาะหัว **แพ็กเกจ** · **ไม่** แสดงหัวข้อ «ขนาดตะกร้า» ในการ์ด (ประหยัดพื้นที่) — รายการราคาตามขนาดใช้ **`aria-label="ราคาตามขนาดตะกร้า"`** บน `<ul>` แทน
- **ชื่อ** — gradient **`from-indigo-700 to-violet-600`** · **`line-clamp-2`** · **`font-bold`** · คำอธิบาย **`text-slate-600`** **`leading-relaxed`**
- **เวลาประมาณ + `basket_tiers`** — ชุด **`detailRowClass`** · **`text-[9px] sm:text-[10px]`** · **`leading-[1.45]`** · ซ้าย **`font-semibold text-slate-600`** · ขวา **`font-semibold tabular-nums text-slate-700`** · ห่อรวม **`flex flex-col gap-y-1 sm:gap-y-2`** — มือถือระยะแนวตั้งชิดกว่า · เส้นคั่นบน **`pt-1.5 sm:pt-2`** · **`packagesTabRowLayout`** **`sm:pt-0`** + **`border-l`**
- **ขวา** — แถวเมตา **ข้อความเดียว** คั่นด้วย **`·`** (สีจาง **`text-slate-300`**, **`aria-hidden`**) — โมเดล · สถานะ · **`#id`** · บรรทัดถัดไปราคาฐาน **`font-bold`** **`tabular-nums`** **`text-emerald-700`** (**ไม่** badge) · **`packagesTabRowLayout`**: กลุ่มขวา **`sm:flex-row`** กับปุ่ม · **มือถือ**: คอลัมน์เมตา **`gap-y-0.5`** **`pb-1.5`** · แถวปุ่ม **`pt-1.5`** ( **`sm:`** ห่างขึ้นตามโค้ด)

#### `LaundryPackageCard` — มือถือ (ระยะห่างกระชับ)

เป้าหมาย: **บนจอ `< sm` ใช้ระยะแนวตั้งและ padding น้อยกว่า `sm+`** เพื่อประหยัดพื้นที่ — ค่าอ้างอิงใน **`src/systems/laundry/components/LaundryPackageCard.tsx`**:

1. **เปลือก `article`** — **`p-2.5`** · **`sm:p-4`**
2. **แถบไฮไลต์ซ้าย** — **`top-2 bottom-2`** · **`sm:top-3 sm:bottom-3`**
3. **แถวหลัก (รูป + เนื้อหา + ขวา)** — **`gap-2`** · **`sm:gap-5`**
4. **แถวรูป + คอลัมน์ข้อความ** — **`gap-2`** · **`sm:gap-4`**
5. **คอลัมน์ข้อความ (หัวแพ็กเกจ / คำอธิบาย / บล็อกเวลา+ตะกร้า)** — **`space-y-1.5`** · **`sm:space-y-2`** · เมื่อ **`packagesTabRowLayout`**: **`sm:space-y-1.5`**
6. **ระยะใต้ป้าย «แพ็กเกจ» ถึงชื่อ** — **`mt-px`** · **`sm:mt-0.5`**
7. **บล็อกเวลา + ตะกร้า (`detailStackClass`)** — **`gap-y-1`** ระหว่างแถว · **`sm:gap-y-2`** · ใต้ **`border-t`** — **`pt-1.5`** · **`sm:pt-2`** · เมื่อ **`packagesTabRowLayout`** — **`sm:border-l`** **`sm:pt-0`** **`sm:pl-4`**
8. **คอลัมน์ขวา (เมตา + ปุ่ม)** — **`pt-0`** · **`sm:pt-0.5`** · แถวเมตา/ราคา **`gap-y-0.5`** **`sm:gap-y-1`** · **`pb-1.5`** **`sm:pb-3`** · แถว **`LaundryToolbarIconButton`** **`pt-1.5`** **`sm:pt-3`**

**ห้าม** ขยายระยะมือถือให้เท่าเดสก์ท็อปโดยไม่ตั้งใจ — ถ้าเพิ่มบล็อกใหม่ในการ์ด ให้ใช้ **`max-sm:`** / ค่าเริ่มต้นแคบแล้วค่อย **`sm:`** ขยาย

**โมดัลดูข้อมูล (`LaundryPackageViewModal`)** — บล็อก **ตะกร้า × ราคา** ใช้รายการแถวเดียวกับการ์ด (ไม่รวมบรรทัดด้วย middot)

---

## ปุ่มเพิ่มข้อมูล / `+` กับหัวข้อ

- **มือถือและเดสก์ท็อป** — ปุ่มเพิ่ม (หรือไอคอน `+` เมื่อ `cw-btn` ซ่อนข้อความ) อยู่ **แถวเดียวกับหัวข้อรายการ** — ซ้าย = ชื่อหัวข้อ (`HomeFinanceListHeading` ฯลฯ) · ขวา = ปุ่ม · ใช้ **`flex flex-row items-center justify-between gap-2`** ไม่ใช้ `flex-col` แล้วให้ปุ่มหล่นไปใต้หัวบนมือถือ
- หัวข้อในแถวเดียวกับปุ่มใช้ **`mb-0`** (override `mb-2` ของ `HomeFinanceListHeading`) เพื่อไม่เว้นบรรทัดเกิน
- มี **`aria-label`** ที่ปุ่มเมื่อบนมือถือเหลือแค่ไอคอน

---

## กลุ่มปุ่มรายการ (ดู / แก้ไข / ลบ)

- **รายการออเดอร์** (งานค้าง · การเงิน — ประวัติรายรับ) และ **รายการแพ็กเกจ** — มุมขวาของการ์ด/แถว ใช้ปุ่มสี่เหลี่ยมมน **`LaundryToolbarIconButton`** ขนาด ~36px:
  1. **ดูข้อมูล** — ไอคอนตา (`LaundryIconEye`) → โมดัลอ่านอย่างเดียว
  2. **แก้ไข** — ไอคอนดินสอ (`LaundryIconPencil`) → โมดัลแก้ไข (ออเดอร์: ชื่อ เบอร์ สถานะ หมายเหตุ · แพ็กเกจ: `LaundryPackageEditorModal`)
  3. **ลบ** — ไอคอนถัง (`LaundryIconTrash`) · `variant="danger"` → `window.confirm` แล้วเรียก `repo.deleteOrder` / `repo.deletePackage`
- ทุกปุ่มต้องมี **`aria-label`** และ **`title`** (`label` prop เดียวกันในคอมโพเนนต์)

---

## ศูนย์ QR (แท็บ QR)
- **`LaundryQrHubClient`** — การ์ดคู่ + `FormModal` (violet / amber) ตาม **`shop-qr-hub-popup-pattern.mdc`**
- **ไม่** แผงโปสเตอร์ยาวใต้การ์ด — เนื้อหา QR อยู่ในโมดัลเท่านั้น
- ลิงก์ลูกค้า: `/laundry/pickup/[ownerId]` (+ `t` ใน sandbox); พนักงาน: `/dashboard/laundry/staff` (+ `t`)

---

## เช็กลิสต์เมื่อแก้ UI ซักผ้า

- [ ] การ์ดสถิติ overview ใช้ **`laundryDashboardStatsGridClass`** (`grid-cols-2` ตลอด) — รายการงานยัง **`laundryDashboardCardGridClass`** (`sm:grid-cols-2`)
- [ ] แผงงานค้างใช้ `LaundryActiveOrdersPanelHeader` — รีเฟรชไม่อยู่หัวกระจกโมดูล
- [ ] แท็บ QR ยังเป็น Hub การ์ดคู่ + modal เท่านั้น — **ไม่** เพิ่มการ์ดทางลัด QR กลับไปที่แดชบอร์ด overview
- [ ] ปุ่มแถวเครื่องมือในโมดัล QR ใช้ `cw-btn` ชุดเดียวกับคาร์แคร์
- [ ] โฟลว์บันทึกรายการยังเป็น POS สองขั้น (`LaundryRecordOrderModal`) — การ์ดแพ็กเกจ + จัดการรูป/ตะกร้า · แล้วเบอร์/ชื่อเล่น — โมดัลใช้ **`mobileCentered`** ให้อยู่กลางจอบนมือถือ · กริดเลือกแพ็กเกจสอดคล้องแดชบอร์ด：**มือถือ `grid-cols-1` · `sm+` `grid-cols-3`** (ไม่ขยาย 4 คอลัมน์ที่คอม)
- [ ] **`LaundryPackageCard`** — แท็บแพ็กเกจ: **`laundryPackageTabListGridClass`** + **`packagesTabRowLayout`** · **ข้อความล้วน** · เมตาขวา **`·`** · **มือถือระยะกระชับ** (`p-2.5` · `gap-2` · `space-y-1.5` · `detailStackClass` **`gap-y-1 sm:gap-y-2`** · `pt-1.5` ใต้เส้นคั่น · ฯลฯ ตามหัวข้อย่อย **มือถือ (ระยะห่าง)** ในกฎ) · **`LaundryPackageViewModal`** สอดคล้องเมื่อแตะดู
- [ ] แท็บ **การเงิน** — **`LaundryFinancePanel`** + **`LaundryCostPanel`** สอดคล้อง **`CarWashSalesPanel`** / **`CarWashCostPanel`** (กราฟคู่ · โหลด cost ใน `loadAll`)
- [ ] รายการงาน (คิว + การเงิน) ใช้ **`LaundryOrderCard`** — ข้อความแพ็กเกจไม่ซ้ำ (`laundry-order-package-lines.ts`) · คิวงานอัปเดตสถานะด้วย **`LaundryOrderStatusIconStrip`** ไม่ใช้ dropdown บนการ์ด
- [ ] คำบรรยาย subtitle / `FormModal` **สั้น** และ **ซ่อนบนมือถือ** (ตามกฎด้านบน)


================================================================================
### .cursor/rules/laundry-usage-guide-modal.mdc
================================================================================

---
description: คู่มือการใช้งานโมดูลซักผ้าในหัวการ์ด (แนวเดียวกับคาร์แคร์)
globs:
  - "src/systems/laundry/LaundryDashboard.tsx"
---

# Laundry usage guide modal

เมื่อแก้ `LaundryDashboard` ให้คงแพทเทิร์นคู่มือการใช้งานแบบเดียวกับคาร์แคร์:

1. มีปุ่ม `คู่มือการใช้งาน` บริเวณหัวการ์ดโมดูล (ปุ่มไอคอน `?` + label บน `sm+`)
2. ใช้ `AppUsageGuideModal` จาก `@/components/app-templates`
3. โครง modal:
   - `title`: "คู่มือการใช้งาน — ระบบรับฝากซักผ้า"
   - `subtitle`: คำอธิบายสั้น 1 บรรทัด
   - มี sections ครอบคลุมอย่างน้อย:
     - ลำดับเริ่มต้นแนะนำ
     - เมนู: แดชบอร์ด
     - เมนู: การเงิน
     - เมนู: แพ็กเกจ
     - เมนู: QR
4. เนื้อหาใช้ bullet/ordered list ภาษาไทย อ่านง่าย และเน้นวิธีใช้งานจริง
5. หาก refactor header ห้ามลบปุ่มคู่มือโดยไม่ใส่ทางเข้าใหม่ที่เทียบเท่า


================================================================================
### .cursor/rules/module-chrome-no-branding.mdc
================================================================================

---
description: โมดูลย่อยใต้แดชบอร์ด — ห้ามซ้ำ MAWELL / โลโก้ / หัวบริษัท
alwaysApply: true
---

# Module chrome under dashboard

เมื่อสร้างหรือแก้ **ระบบ/โมดูลย่อย** ที่อยู่ภายใต้ `(dashboard)` และมี `DashboardShell` หรือ header หลักของแอปอยู่แล้ว:

- **ห้าม** ใส่ `MawellLogo` หรือแถบแบรนด์ซ้ำ (MAWELL, หจก.มาเวล, wordmark) ใน layout/header เฉพาะโมดูล
- ให้เหลือเฉพาะเมนู/เนื้อหาของโมดูลนั้น — แบรนด์อยู่ที่ shell หลักพอแล้ว


================================================================================
### .cursor/rules/prisma-db-seed-after-demo-data.mdc
================================================================================

---
description: หลังแก้ Prisma seed / ข้อมูล demo Building POS — ต้องรัน npm run seed ทุกครั้ง
globs: prisma/seed.ts,src/lib/trial/seed-building-pos.ts
alwaysApply: false
---

# รัน DB seed หลังแก้ข้อมูลตัวอย่าง

เมื่อแก้ไฟล์ใดไฟล์หนึ่งต่อไปนี้ (หรือเพิ่มข้อมูล demo ที่อิง `seed.ts`):

- `prisma/seed.ts`
- `src/lib/trial/seed-building-pos.ts`

**ข้อบังคับ:** ให้รันคำสั่ง seed ในโปรเจกต์ **ทุกครั้ง** หลังจบการแก้ เพื่อให้ฐานข้อมูล local / สภาพแวดล้อมที่ใช้ `DATABASE_URL` เดียวกันสะท้อนการเปลี่ยนแปลง

```bash
npm run seed
```

ทางเลือกเทียบเท่า: `npx prisma db seed` (ต้องตั้งค่า seed command ใน Prisma แล้ว)

**บัญชี demo POS (`user@mawell.local`, `user@mawell.local.com`):** ทุกครั้งที่รัน `npm run seed` ระบบจะ **ล้างข้อมูล Building POS ใน scope `prod`** ของ user เหล่านั้นแล้วแทรกชุดเมนู 20 รายการ + ออเดอร์/ต้นทุนตัวอย่างใหม่ (ดู `deleteBuildingPosScopeData` + `seedBuildingPosProdDemoForOwner` ใน `seed-building-pos.ts`)

**Trial sandbox:** ยังสร้างชุดใหม่ตอนเริ่มทดลองเท่านั้น — ไม่ถูก seed ซ้ำจาก `prisma/seed.ts`

**Building POS demo:** เมนูตัวอย่างคงที่ **5 หมวด × 4 เมนู = 20 เมนู** — ดูค่าคงที่ `BUILDING_POS_SEED_MENU_TOTAL` / `BUILDING_POS_SEED_MENUS_PER_CATEGORY` ใน `seed-building-pos.ts`


================================================================================
### .cursor/rules/prisma-schema-generate.mdc
================================================================================

---
description: Prisma — หลังแก้ schema หรือ migration ต้องรัน prisma generate ทุกครั้ง
globs:
  - "prisma/schema.prisma"
  - "prisma/migrations/**"
  - "prisma/**/*.sql"
---

# Prisma — generate หลังปรับฐานข้อมูล

เมื่อแก้ไฟล์ใน **`prisma/`** ที่มีผลต่อโครงฐานข้อมูลหรือ client:

1. **`npx prisma generate`** — **รันทุกครั้ง** หลังแก้ **`schema.prisma`** หรือ **`migrations`** (ไม่ว่าจะใช้ `migrate dev`, `migrate deploy`, หรือแก้ SQL ด้วยมือ) — เพื่อให้ `src/generated/prisma` และ delegate บน `PrismaClient` ตรงกับ schema ล่าสุด
2. **รีเฟรช Next** — ลบ **`.next`** แล้วรีสตาร์ท dev server เมื่อมีการเปลี่ยน client (กันค้าง bundle)
3. **`src/lib/prisma.ts`** — ถ้าเพิ่มโมเดลใหม่ที่ต้องบังคับ singleton ใหม่ ให้ตรวจ **`prismaClientHasExpectedDelegates`** และ bump **`PRISMA_SINGLETON_VERSION`** ตามคอมเมนต์ในไฟล์

รายละเอียดการรันคำสั่งเอง: **`run-commands-proactively.mdc`**


================================================================================
### .cursor/rules/run-commands-proactively.mdc
================================================================================

---
description: ทำงานให้จบ — รันเทอร์มินัลเอง ไม่ส่งต่อให้ผู้ใช้รัน
alwaysApply: true
---

# ทำให้จบ — รันคำสั่งให้เลย

- **เป้าหมาย:** จบงานในเทิร์น / ในเซสชันที่สมเหตุสมผล — **อย่าจบด้วยรายการให้ผู้ใช้ไปรันเอง** (`migrate`, `seed`, `build`, `lint`, ทดสอบสคริปต์ ฯลฯ) ถ้าเอเจนต์รันในโปรเจกต์นี้ได้
- เมื่องานต้องใช้ **เทอร์มินัล** (เช่น `npm run db:seed`, `npx prisma migrate deploy`, `npx prisma generate`, `npm run lint`, `npx tsc --noEmit`, `npm run build`, ทดสอบสคริปต์) — **ให้รันด้วยเครื่องมือรันคำสั่งเอง** อย่าขอให้ผู้ใช้รันแทน และอย่าถามว่า “ให้รันไหม” ถ้าการรันเป็นขั้นตอนที่สมเหตุสมผลของงานนั้น
- ถ้าคำสั่งล้มเหลว — ลองแก้หรือทางเลือกอื่น (เช่น permission, path, ปิด process ที่ล็อกไฟล์) **หลายรอบตามสมควร** ก่อนสรุปให้ผู้ใช้
- ไม่ต้องรอคำว่า “รันให้หน่อย” — ถือว่าผู้ใช้อนุญาตให้รันในโปรเจกต์นี้เมื่อจำเป็นต่อการทำงานให้จบ
- **ถ้าทำได้:** ยืนยันผลด้วยคำสั่งที่เกี่ยวข้อง (เช่น `lint` / `tsc` / ทดสอบที่มี) หลังแก้โค้ดหลัก — ไม่ทิ้งไว้แค่ “น่าจะผ่าน”
- **ข้อยกเว้น (ค่อยส่งต่อผู้ใช้):** ต้องใช้ **รหัส / 2FA / บัญชีภายนอกที่เอเจนต์ไม่มี**, การกดยืนยันบนอุปกรณ์จริง, หรือการแก้ **บนเซิร์ฟเวอร์/DB production** ที่สภาพแวดล้อม agent เข้าไม่ถึง — ระบุสั้น ๆ ว่าติดตรงไหนและทางเลือกที่ปลอดภัย

## หลังปรับฐานข้อมูล (Prisma) — **บังคับ `prisma generate` ทุกครั้ง**

- เมื่อมีการ **ปรับฐานข้อมูล** — ได้แก่ แก้ **`prisma/schema.prisma`**, เพิ่ม/แก้ **`prisma/migrations`** (หรือ SQL ที่เกี่ยวกับโครงตาราง), หรือแตะโค้ดที่ต้องใช้ **delegate / โมเดล Prisma ใหม่** — **ทุกครั้งที่จบขั้น schema/migration** ต้องรันที่รากโปรเจกต์: **`npx prisma generate`** **ก่อนถือว่างานสมบูรณ์** (ไม่ข้าม — client เก่าจะทำให้ `undefined.findMany` / ValidationError ตอนรัน API)
- หลัง generate แนะนำ **`rm -rf .next`** (หรือลบโฟลเดอร์ `.next` บน Windows) แล้วรีสตาร์ท **`next dev`** — กัน Next/Webpack ค้าง bundle หรือ Prisma client เก่า
- ถ้า **`prisma generate` ล้มเหลวด้วย EPERM** (ไฟล์ DLL ถูกล็อก) — ให้หยุดเซิร์ฟเวอร์ที่รันอยู่แล้วรัน generate ใหม่
- ถ้าผู้ใช้บอกเรื่องคอลัมน์ MySQL / schema ไม่ตรง DB — รัน **`npx prisma migrate deploy`** (หรือ `migrate dev`) เมื่อมี DB ต่ออยู่ หรือชี้ไปที่ **`prisma/repair-user-columns.sql`** ตามบริบท — **แล้วยังต้อง `prisma generate` หลัง migration เสมอ**


================================================================================
### .cursor/rules/shop-customer-qr-portal.mdc
================================================================================

---
description: หน้าลิงก์ QR ลูกค้า (พอร์ทัลสาธารณะ) — เทียบคาร์แคร์ · เปลือก glass · ปุ่มไอคอน · การ์ดคอลัมน์เดียว
alwaysApply: false
globs:
  - "**/systems/car-wash/CarWashCustomerPortalClient.tsx"
  - "**/systems/barber/components/BarberCustomerPortalClient.tsx"
  - "**/systems/laundry/components/LaundryPickupPublicClient.tsx"
  - "**/app/car-wash/check-in/**"
  - "**/app/m/**"
  - "**/app/laundry/pickup/**"
---

# พอร์ทัลลูกค้า (หลังสแกน QR ลูกค้า)

อ้างอิง canonical: **`CarWashCustomerPortalClient`** (`src/systems/car-wash/CarWashCustomerPortalClient.tsx`) — เส้นทาง `/car-wash/check-in/[ownerId]`

## เปลือกและเลย์เอาต์

1. **`AppPublicCheckInGlassPage`** + คอลัมน์กลาง **`max-w-md`** + `space-y-4` (หรือ flex column เทียบเท่าสำหรับหน้ามี fixed footer)
2. **Hero หัวกลาง (บังคับ):** ก่อน `<h1>` / ชื่อโมดูล — กล่องไอคอนกึ่งกลางคัดลอกจากคาร์แคร์ (`CarWashCustomerPortalClient` บล็อก comment `header logo / title`):
   - เปลือก: `mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-[1.25rem] border border-white/70 bg-gradient-to-br from-white/80 to-violet-100/60 shadow-[0_8px_24px_-8px_rgba(91,97,255,0.35)] backdrop-blur-xl ring-1 ring-inset ring-white/70`
   - SVG ด้านใน: `h-7 w-7 text-[#5b61ff]` (หรือไอคอนโดเมนโทนใกล้เคียง — บาร์เบอร์ใช้กล่องเดียวกัน)
   - ลำดับ: **กล่องไอคอน → หัวข้อย่อย/โมดูล (ถ้ามี) → `<h1>` เข้ม → บรรทัดบรรยาย** (`text-sm text-[#6b6894]`)
   - หน้าที่มี fixed footer / hero ยาว (เช่น ซักผ้า) — ยังวางกล่องไอคอนนี้ในส่วนหัวคอลัมน์เดียวกับชื่อร้าน
3. **การ์ดหลัก**: `appPublicCheckInGlassCardClass` · `px-5 py-5 sm:px-6`

## แถวค้นหา (เบอร์ / ทะเบียน / query)

- **`flex items-stretch gap-2`** — ช่อง `flex-1 min-w-0` + **ปุ่มค้นหาเป็นสี่เหลี่ยมไอคอนอย่างเดียว** `h-[52px] w-[52px] shrink-0 rounded-2xl` gradient ม่วง · `aria-label="ค้นหาข้อมูล"` (โหลด: `aria-label` ระบุกำลังค้นหา)
- ช่องป้อน: class เดียวกับคาร์แคร์ (`rounded-2xl border border-white/70 bg-white/60 ...`)

## ปุ่มดำเนินการหลัก (ชำระ / ยืนยันใช้บริการ / ส่งคำขอ)

- **ไอคอนอย่างเดียว** ในแถบปุ่มใหญ่ (`min-h-[52px]`) · **`aria-label`** อธิบายการทำงาน (ภาษาไทย)
- สถานะโหลด: `animate-spin` แทนข้อความบนปุ่ม

## รายการการ์ด / ประวัติ

- **`grid-cols-1` เท่านั้น** — ห้าม `sm:grid-cols-2` สำหรับการ์ดเลือกแพ็ก / รายการในโฟลว์เดียวกัน (ให้เหมือนมือถือบนจอใหญ่)
- รายการในโมดัล (เช่นประวัติ): จัด **คอลัมน์เดียว** — หลีกเลี่ยง `flex-wrap` ที่ทำให้สามคอลัมน์บนเดสก์ท็อป

## แถบเครื่องมือรอง (ประวัติ · อัปโหลดสลิป · ติดตาม)

- ปุ่มทุติยภูมิ = **`h-10 w-10 rounded-xl`** + **`aria-label`** (ดู `.cursor/rules/shop-staff-lane-toolbar.mdc` โทนขอบ)

## การเชื่อมใน repo

| โมดูล | คอมโพเนนต์ | เส้นทางตัวอย่าง |
|--------|------------|------------------|
| คาร์แคร์ | `CarWashCustomerPortalClient` | `/car-wash/check-in/[ownerId]` |
| บาร์เบอร์ | `BarberCustomerPortalClient` | `/m/[ownerId]` |
| ซักผ้า | `LaundryPickupPublicClient` | `/laundry/pickup/[ownerId]` |

โมดูลใหม่ที่มี QR ลูกค้า — คัดลอกโครงจาก `CarWashCustomerPortalClient` แล้วปรับข้อความ/ไอคอนตามโดเมน

## ความสัมพันธ์กับ QR ในแดชบอร์ด

การ์ด hub / โปสเตอร์ QR ลูกค้าในแดชบอร์ด → `.cursor/rules/shop-qr-hub-popup-pattern.mdc` — **ไม่สับสนกับ** พอร์ทัลสาธารณะนี้


================================================================================
### .cursor/rules/shop-qr-hub-popup-pattern.mdc
================================================================================

---
description: แพทเทิร์นมาตรฐานหน้า Hub QR (การ์ดคู่ + FormModal กระจก) — ใช้ซ้ำคาร์แคร์ บาร์เบอร์ และโมดูล QR อื่น
globs:
  - "**/systems/car-wash/**"
  - "**/systems/barber/**"
  - "**/systems/laundry/**"
  - "**/components/qr/**"
  - "**/components/ui/FormModal.tsx"
---

# Hub QR — การ์ดคู่ + ป๊อปอัป (`FormModal`)

เมื่อมีหน้าแดชบอร์ดที่รวม **QR ลูกค้า** และ **QR พนักงาน** (หรือบทบาทคู่ที่คล้ายกัน) ให้ทำแบบเดียวกันทุกระบบ เพื่อไม่ต้องแก้ทีละโมดูล

## UX มาตรฐาน

1. **การ์ดใหญ่คู่** (`rounded-[2.5rem]`, glass gradient, hover lift) — การ์ดหนึ่งต่อหนึ่งบทบาท
2. **คลิกการ์ด** → เปิด **`FormModal`** เท่านั้น — **ไม่** แสดงแผงเนื้อหายาวใต้การ์ด (inline tab panel)
3. เปิดการ์ดหนึ่งแล้วเปิดอีกการ์ด → **ปิดโมดัลอื่นก่อน** (`setShowOther(false)` แล้วค่อย `setShow(true)`)
4. **`FormModal`**
   - `size="lg"`
   - `appearance="glass"`
   - `glassTint="violet"` สำหรับลูกค้า / พอร์ทัลลูกค้า
   - `glassTint="amber"` สำหรับพนักงาน / สตาฟ
   - **`mobileCentered`** — บนมือถือให้แผงอยู่กึ่งกลางจอ (ไม่ชิดขอบล่าง); โมดูลที่มีฟอร์ม/กรองหลายจุดใช้ครบทุกโมดัล — เทียบ **`laundry-dashboard-ui.mdc`** / **`building-pos-dashboard-template.mdc`**
5. **`footer`** — ปุ่มหลัก **ปิด** (ไอคอน X + ข้อความ) ชิดขวา; มีปุ่ม X มุมขวาบนของโมดัลอยู่แล้วจาก `FormModal`
6. **เนื้อหาในโมดัล** — ใช้คอมโพเนนต์เดิมที่เรนเดอร์ QR / โปสเตอร์ / ดาวน์โหลด อย่าเขียน UI ซ้ำใน Hub — **โมดัล QR พนักงาน** ให้ใช้ **`ShopStaffQrPanel`** (ดู `.cursor/rules/shop-staff-qr-panel.mdc`)

## แสดง/ซ่อนลิงก์ในโมดัล

ในโมดัลให้มีพฤติกรรมเดียวกับคาร์แคร์:

- ปุ่ม **แสดงลิงก์ / ซ่อนลิงก์** คู่กับ **คัดลอกลิงก์**
- เมื่อซ่อน: ข้อความ dashed box แจ้งว่าลิงก์ถูกซ่อน (ผู้ใช้ยังคัดลอกได้)

Implement ด้วย prop เช่น **`compactForModal`** บนคอมโพเนนต์โปสเตอร์/QR ของโมดูลนั้น:

- ซ่อนหัวการ์ดซ้ำกับ `title` ของโมดัล (เหลือแค่บรรทัดชื่อร้าน/shop label ถ้าจำเป็น)
- เปิดใช้ปุ่มแสดง/ซ่อนลิงก์ + บล็อกแสดง URL

## แถบปุ่มในโมดัล (เทียบคาร์แคร์)

- **QR ลูกค้า / พอร์ทัลลูกค้า** — ใช้คลาส **`cw-btn`** + **`cw-btn-icon`** + **`cw-btn-label`** จาก `src/app/globals.css` — บนมือถือ (`max-width: 639px`) แสดง**เฉพาะไอคอน** บน `sm+` แสดงไอคอน + ข้อความ
- จำนวน **4 ปุ่ม** ต่อโมดัล: คัดลอกลิงก์ · แสดง/ซ่อนลิงก์ · ดาวน์โหลด PDF (A4) · ดาวน์โหลด PNG (ไม่ใส่ A5 ในโมดัล **ลูกค้า**)
- **QR พนักงาน** — ไม่เขียนแถบปุ่มเอง — ใช้ **`ShopStaffQrPanel`** (มือถือ / เดสก์ท็อป / `<details>` / PDF A5 ตามโมดูล) ตาม `.cursor/rules/shop-staff-qr-panel.mdc`
- หลังคัดลอกสำเร็จ: แถบข้อความสั้น (เช่น "คัดลอกลิงก์แล้ว") แบบคาร์แคร์ — สำคัญเมื่อมือถือซ่อนป้ายบนปุ่ม

## โค้ดอ้างอิงใน repo

| ส่วน | ไฟล์ |
|------|------|
| คาร์แคร์ Hub + modal | `src/systems/car-wash/CarWashDashboard.tsx` (แท็บ `qr`, `showQrModal` / `showStaffQrModal`) |
| บาร์เบอร์ Hub + modal | `src/systems/barber/components/BarberQrHubClient.tsx` |
| **ซักผ้า Hub + modal** | **`src/systems/laundry/components/LaundryQrHubClient.tsx`** |
| **เทียบโครงสร้างโมดูลทั้งก้อน** | **`.cursor/rules/dashboard-module-car-wash-barber-reference.mdc`** |
| โปสเตอร์ลูกค้า + `compactForModal` | `src/systems/barber/components/BarberQrPosterClient.tsx` |
| พนักงาน + `compactForModal` | `src/systems/barber/components/BarberStaffQrDashboardSection.tsx` (ภายในใช้ `ShopStaffQrPanel`) |
| **QR พนักงานมาตรฐาน (คาร์แคร์ UX)** | `src/components/qr/shop-staff-qr-panel.tsx` — `.cursor/rules/shop-staff-qr-panel.mdc` |
| เทมเพลตวาดโปสเตอร์/QR | `src/components/qr/shop-qr-template.ts` |
| โมดัล | `src/components/ui/FormModal.tsx` |

## เช็กลิสต์โมดูล QR ใหม่

- [ ] หน้า Hub = แค่การ์ดคู่ + state โมดัลสองตัว
- [ ] ไม่มีแผง `tabpanel` ใต้การ์ด
- [ ] คอนเทนต์ QR **พนักงาน** ในโมดัล = **`ShopStaffQrPanel`** (ไม่คัดลอก JSX ชุดใหม่)
- [ ] คอนเทนต์ QR **ลูกค้า** อยู่ใน `FormModal` พร้อม `compactForModal` (หรือเทียบเท่า)
- [ ] ทดสอบ ESC, คลิก overlay, ปุ่มปิด footer
- [ ] แถบเครื่องมือโมดัล **ลูกค้า** = `cw-btn` สี่ปุ่ม (A4 เท่านั้น) + แจ้งเตือนหลังคัดลอก


================================================================================
### .cursor/rules/shop-staff-lane-toolbar.mdc
================================================================================

---
description: โหมดพนักงาน / staff lane / หน้า QR พนักงาน — แถบเครื่องมือไอคอนอย่างเดียว ไม่มีคำบรรยายใต้หัวข้อแผง
alwaysApply: false
globs:
  - "**/systems/car-wash/**"
  - "**/systems/barber/**"
  - "**/systems/laundry/**"
  - "**/systems/building-pos/**"
  - "**/components/qr/staff-qr-landing-shell.tsx"
  - "**/app/**/staff/**"
---

# แถบเครื่องมือพนักงาน (staff lane / หลังสแกน QR พนักงาน)

ใช้แพทเทิร์นเดียวกับ **`CarWashServiceLanePanel`** เมื่อ `staffLayout` — อ้างอิง `staffCardToolbar` ใน `src/systems/car-wash/CarWashServiceLanePanel.tsx`

## ปุ่มหลักในแผง (รีเฟรช · เพิ่มรายการ · ฯลฯ)

1. **แสดงเฉพาะไอคอน** — ขนาดทัช ~40px (`h-10 w-10`), `rounded-xl`, ไม่มี `<span>` ข้อความบนปุ่ม
2. **ต้องมี `aria-label`** ภาษาไทยสั้น ชัด (เช่น `"รีเฟรช"`, `"บันทึกรายการ"`, `"เพิ่มคิว"`)
3. **โทนปุ่ม**
   - ทุติยภูมิ (รีเฟรช): ขอบ `#dcd8f0`, พื้นขาว/โปร่ง — เทียบปุ่มรีเฟรชในลานคาร์แคร์
   - หลัก (บันทึก/เพิ่ม): gradient `from-[#5b61ff] to-[#6a63ff]`, ไอคอนขาว — เทียบปุ่มบันทึกในลานคาร์แคร์
4. **สถานะโหลด** — ไอคอนรีเฟรชใช้ `animate-spin` เมื่อกำลังรีเฟรช; `aria-label` ระบุ `"กำลังรีเฟรช"` เมื่อ disabled/โหลด

อย่าใช้ชั้น `cw-btn` + `cw-btn-label` ในโหมดนี้บนจอใหญ่ — class นั้นซ่อนข้อความเฉพาะ `< sm` แต่โหมดพนักงานต้องการ **ไอคอนอย่างเดียวทุก breakpoint**

## คำบรรยายใต้หัวข้อแผง

ในโหมดพนักงาน QR / staff lane:

- **ไม่แสดง** `<p>` บรรยายใต้หัวข้อแผง (เช่น «เลือกสถานะ · รีเฟรชเมื่อหลายเครื่อง»)
- **`AppSectionHeader`** — ไม่ส่ง `description` (หรือส่ง `undefined`)
- **`StaffQrLandingShell`** — `subtitle` เป็นทางเลือก; ถ้าไม่ต้องการบรรทัดบรรยายใต้ชื่อหน้า **ไม่ส่ง** `subtitle`
- หัวข้อหลัก (`title` / `<h2>`) **เก็บได้** เพื่อบอกบริบทสั้น ๆ

## การอ้างอิงใน repo

| พื้นที่ | การใช้งาน |
|---------|------------|
| คาร์แคร์ staff lane | `CarWashServiceLanePanel` + `StaffQrLandingShell` (ไม่มี subtitle) |
| ซักผ้า staff | `LaundryActiveOrdersPanelHeader` + `iconOnlyToolbar` |
| บาร์เบอร์ staff | `BarberBookingsClient` / `BarberCheckInClient` + `staffQrLanding` · แถว «คิวตามวัน» = `flex-nowrap`: หัวข้อ \| `input[type=date]` (`aria-label="วันที่"`) \| ปุ่มเพิ่มไอคอน |

โมดูลใหม่ที่มี «หน้าพนักงานแคบ» — ให้ทำตามกฎนี้และ `.cursor/rules/staff-qr-landing-page.mdc`


================================================================================
### .cursor/rules/shop-staff-qr-panel.mdc
================================================================================

---
description: UX/UI มาตรฐาน QR พนักงาน (พอร์ทัลพนักงาน) — ให้เหมือนคาร์แคร์ · ใช้ ShopStaffQrPanel
alwaysApply: false
globs:
  - "**/components/qr/shop-staff-qr-panel.tsx"
  - "**/systems/car-wash/**"
  - "**/systems/barber/**"
  - "**/systems/laundry/**"
---

# QR พนักงาน — UX/UI เดียวกับคาร์แคร์

อ้างอิง implementation: `src/components/qr/shop-staff-qr-panel.tsx` (`ShopStaffQrPanel`). โมดูลที่มีลิงก์/ป๊อปอัป QR พนักงาน (เช่น คาร์แคร์ ซักผ้า ร้านตัดผม) **ต้องใช้คอมโพเนนต์นี้** แทนการคัดลอก JSX ชุดใหม่ เพื่อให้มือถือ / เดสก์ท็อป / ข้อความ / `<details>` สอดคล้องกัน

## โครงสร้าง UX (ห้ามแหวกโดยไม่ปรับทั้งคอมโพเนนต์กลาง)

1. **มือถือ (`max-sm`)**
   - แถบข้อความ indigo (`mobileBannerText`) — `sm:hidden`
   - รูป QR จาก data URL — `max-w-[min(92vw,320px)]`, พื้นขาว + ขอบ — `sm:hidden`
   - ปุ่มหลักเต็มความกว้าง `app-btn-primary` min-h 52px — `location.assign(pageUrl)` — `sm:hidden`
   - คอลัมน์: คัดลอกลิงก์เต็มความกว้าง → กริด 2 ช่อง **แสดง/ซ่อนลิงก์** + **เปิดหน้า** (ข้อความปุ่มผ่าน props)
   - `<details>` หัวข้อ **「ดาวน์โหลดและโปสเตอร์」**: PDF A4 → (ถ้ามี) PDF A5 → PNG → พื้นที่พรีวิวโปสเตอร์ในกล่อง scroll

2. **เดสก์ท็อป (`sm+`)**
   - แถวปุ่ม flex-wrap: คัดลอก · แสดงลิงก์ · PDF A4 · (A5 ถ้ามี) · PNG — class `cw-btn` / `app-btn-primary` / `app-btn-soft` ตามคาร์แคร์
   - แถบคัดลอกสำเร็จ (emerald) เมื่อมี `copyMsg`
   - แถบลิงก์ (แสดง URL หรือ dashed hint)
   - พรีวิวโปสเตอร์กว้างคงที่ ~340px ในกล่อง `overflow-x-auto` + inset shadow — **`hidden sm:block`**

3. **โทเค็นร่วม**
   - `posterTintClass`: ส่งเงาโทนโมดูล (เช่น `shadow-amber-950/10`, `shadow-indigo-950/10`)
   - ข้อความปุ่มเปิดหน้า: โมดูลที่เป็น «ลาน» ใช้ **เปิดหน้าลาน** — อื่น ๆ ใช้ **เปิดหน้าพนักงาน**

4. **PDF A5**
   - ถ้าโมดูลรองรับเท่านั้น — ส่ง `onDownloadPdfA5` เพื่อแสดปุ่มในมือถือและเดสก์ท็อป (คาร์แคร์ / ซักผ้าไม่ส่ง)

5. **โหมดทดลอง**
   - `trialExportBlocked` ส่งเข้า panel เพื่อ disable ปุ่มดาวน์โหลด — แถบเตือนโหมดทดลองวาง **ด้านนอก** panel ใน FormModal ได้ (ดูซักผ้า / บาร์เบอร์)

## การเชื่อมในโปรเจกต์ปัจจุบัน

- คาร์แคร์: `CarWashDashboard` — FormModal QR พนักงาน
- ซักผ้า: `LaundryQrHubClient` — FormModal QR พนักงาน (+ แถบทดลองด้านบนเมื่อจำเป็น)
- ร้านตัดผม: `BarberStaffQrDashboardSection` — แผงในหน้า/modal

โปสเตอร์สร้างจาก `createShopQrPosterDataUrl` / ดาวน์โหลดจาก `shop-qr-template` เหมือนเดิม — panel รับเฉพาะ data URL และ callbacks

หน้าปลายทางหลังสแกนลิงก์พนักงาน → `.cursor/rules/staff-qr-landing-page.mdc` (`StaffQrLandingShell`) · แถบเครื่องมือพนักงาน → `.cursor/rules/shop-staff-lane-toolbar.mdc`

หน้าปลายทางหลังสแกน **QR ลูกค้า** (พอร์ทัลสาธารณะ check-in) → `.cursor/rules/shop-customer-qr-portal.mdc`

## เกี่ยวกับการ์ด hub คู่

ดู `.cursor/rules/shop-qr-hub-popup-pattern.mdc` — การ์ดเปิดป๊อปอัปยังแยกลูกค้า/พนักงานได้ แต่ **เนื้อใน QR พนักงาน** ต้องผ่าน `ShopStaffQrPanel`


================================================================================
### .cursor/rules/staff-qr-landing-page.mdc
================================================================================

---
description: หน้าเป้าหมายหลังสแกน QR พนักงาน — UX/UI เดียวกับคาร์แคร์ staff lane · ใช้ StaffQrLandingShell
alwaysApply: false
globs:
  - "**/components/qr/staff-qr-landing-shell.tsx"
  - "**/systems/car-wash/**"
  - "**/systems/barber/**"
  - "**/systems/laundry/**"
  - "**/app/**/staff/page.tsx"
---

# หน้าพนักงาน (หลังเข้าตามลิงก์ QR พนักงาน)

อ้างอิง canonical: คาร์แคร์ `layoutVariant="staff_lane"` (`/dashboard/car-wash/staff`) — พื้นหลัง **AppPublicCheckInGlassPage** · ไอคอนกลางในกล่องขอบขาว/violet · หัวเรื่องเข้ม · คำบรรยายเทา · ชื่อร้าน (`shopLabel`) · การ์ดเนื้อหา **`appPublicCheckInGlassCardClass`** + padding `px-5 py-5 sm:px-6`

## คอมโพเนนต์กลาง

ใช้ **`StaffQrLandingShell`** (`src/components/qr/staff-qr-landing-shell.tsx`) แทนการจัดเลย์เอาต์ใหม่:

- `variant`: `"car-wash"` | `"laundry"` | `"barber"` — เลือกไอคอนหัวข้อให้สอดคล้องโมดูล (โทนและขนาดเดียวกับคาร์แคร์)
- `title` — ภาษาไทย สั้น ชัด
- `subtitle` — **ทางเลือก**; โหมดพนักงานแบบย่อไม่ส่ง (ไม่มีบรรทัดบรรยายใต้ชื่อหน้า) — ดู `.cursor/rules/shop-staff-lane-toolbar.mdc`
- `shopLabel` — จาก `getBusinessProfile` (หรือสตริงว่าง)
- `loading` / `error` — ถ้ามี state ระดับหน้า (เช่นโหลดข้อมูลก่อนแสดงแผง)
- `children` — งานจริงของโมดูล **ภายในการ์ดเดียว** (อย่าซ้อน shell แบบพอร์ทัลแยกจากคาร์แคร์)

## แถบเครื่องมือและคำบรรยายแผง

ปุ่มในแผงพนักงาน = **ไอคอนอย่างเดียว** + ไม่มีคำบรรยายใต้หัวข้อแผง — **`.cursor/rules/shop-staff-lane-toolbar.mdc`**

## รายการในการ์ด (จอใหญ่)

บนหน้าพนักงาน QR **ให้รายการเป็นแบบมือถือ**: หนึ่งการ์ดต่อแถว (`grid-cols-1` เท่านั้น) — อย่าใช้ `sm:grid-cols-2` / `sm:flex` แยกซ้าย–ขวาสำหรับการ์ดคิวในโหมดนี้ (ดู `laundryStaffQrLandingCardGridClass`, props `staffQrLanding` ใน `BarberBookingsClient` / `BarberCheckInClient`)

## การเชื่อมในโปรเจกต์

| โมดูล | เส้นทาง | หมายเหตุ |
|--------|---------|----------|
| คาร์แคร์ | `(staff-lane)/dashboard/car-wash/staff` | `CarWashDashboard` + `StaffQrLandingShell` variant `car-wash` |
| ซักผ้า | `(dashboard)/dashboard/laundry/staff` | `LaundryDashboard` early-return เมื่อ `staff_lane` |
| บาร์เบอร์ | `(dashboard)/dashboard/barber/staff` | Server page ใช้ `StaffQrLandingShell` variant `barber` |

## ความสัมพันธ์กับ QR พนักงานในแดชบอร์ด

- ป๊อปอัป/แผง **สร้าง QR พนักงาน** → กฎ `shop-staff-qr-panel.mdc` (`ShopStaffQrPanel`)
- **หน้าปลายทางหลังสแกน** → กฎไฟล์นี้ (`StaffQrLandingShell`)

อย่าปนสองชั้น UX ที่ไม่ตรงกัน (เช่น header แบบแดชบอร์ดเต็ม + พื้นหลังไม่ glass บนหน้าพนักงาน QR)


================================================================================
### .cursor/rules/village-dashboard-mobile-stats-grid.mdc
================================================================================

# Village dashboard mobile stats grid

เมื่อปรับหน้า `src/systems/village/components/VillageDashboardClient.tsx` ส่วนการ์ดสถิติด้านบน (เช่น บ้านที่ใช้งาน, ผู้พักในระบบ, สลิปรอตรวจ):

## บังคับ

1. บนมือถือ (`base` ก่อน `sm`) ให้แสดง **2 คอลัมป์** (`grid-cols-2`)
2. ถ้าจำนวนการ์ดเป็นเลขคี่ การ์ดใบสุดท้ายต้องแสดงเดี่ยวเต็มแถว (`col-span-2`) เพื่อไม่ให้เลย์เอาต์ลอย
3. บนจอ `sm` ขึ้นไป ให้กลับไปเลย์เอาต์เดสก์ท็อปปกติของโมดูล (`sm:grid-cols-3` หรือค่าที่ทีมกำหนด)
4. ห้าม hard-code เงื่อนไขเฉพาะจำนวนการ์ด 3 ใบ; ให้ใช้เงื่อนไขทั่วไปแบบ “odd tail”

## แนวทางอ้างอิง

- ใช้แพทเทิร์น `arr.length % 2 === 1 && idx === arr.length - 1`
- กำหนดคลาสแบบ responsive: `col-span-2 sm:col-span-1`


================================================================================
### .cursor/rules/village-finance-single-card-layout.mdc
================================================================================

# Village Finance pages — ใช้การ์ดหลักเดียว

เมื่อปรับหน้าในโมดูลหมู่บ้านกลุ่มการเงิน:
- `/dashboard/village/fees`
- `/dashboard/village/slips`
- `/dashboard/village/costs`
- `/dashboard/village/annual`

## บังคับ

1. แต่ละหน้าต้องมี **การ์ดหลักเดียว** (`VillagePanelCard`) สำหรับเนื้อหาหลักของหน้านั้น  
   - ส่วนหัวหน้า (title/description/action) + ส่วนควบคุม (filter/form/buttons) + รายการ/ตาราง/กราฟ อยู่ในการ์ดเดียวกัน
2. ห้ามแยก “การ์ดฟิลเตอร์” กับ “การ์ดรายการ” เป็นคนละกล่องซ้อนกันในหน้าเดียวกันของเมนูการเงิน
3. ถ้าต้องแบ่งช่วงเนื้อหาในกล่องเดียว ให้ใช้ `border-t`, spacing, หรือ section heading ภายในการ์ด แทนการสร้าง `VillagePanelCard` เพิ่ม
4. modal/dialog (เช่น `FormModal`) แยกได้ตามปกติ แต่ไม่นับเป็นการ์ดหลักของหน้า
5. `VillageFinanceQuickTabs` ต้องวางบนสุดของหน้า แล้วตามด้วยการ์ดหลักเดียว

## เป้าหมาย UX

- มือถือและเดสก์ท็อปเห็นโครงเหมือนกัน: “หนึ่งหน้า หนึ่งการ์ดหลัก”
- ลดช่องว่างซ้ำซ้อน ทำให้เนื้อหาอ่านต่อเนื่องและดูเป็นระบบเดียวกัน
