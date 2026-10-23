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
- **Shared layout classes:** `src/systems/chat/personal-ai-chat-shell.ts` — do not duplicate Tailwind strings between `chat-ai-client` skeleton and `PersonalAiChat`.

Details: `CHAT_AI_CODE_FOR_REVIEW.md` §1.1.

---

## .cursor/rules


================================================================================
### .cursor/rules/admin-hub-dashboard-template.mdc
================================================================================

---
description: ศูนย์แอดมิน — รายการเป็นการ์ด (แบบระบบทั้งหมด) · ตัดคำอธิบายหัวข้อ · Export Excel · gutters
globs: src/systems/admin/**/*.tsx,src/systems/activity-logs/**/*.tsx,src/components/admin/**/*.tsx,src/app/(dashboard)/dashboard/admin/**/*
alwaysApply: false
---

# ศูนย์แอดมิน — การ์ดรายการ · คำอธิบาย · Excel

เมื่อทำหรือแก้หน้าใต้ `/dashboard/admin/*` ให้ยึดแพทเทิร์นเดียวกับ **ลิงก์ทดลอง / ผู้ใช้ / หน้าระบบทั้งหมด**

## 1) ตัดคำอธิบายหัวข้อ (บังคับ)

- **ห้าม**ใส่ `description` บน `AppSectionHeader` ของหน้าแอดมินรายการ
- **ห้าม**ใส่ย่อหน้าคำอธิบายยาวใต้หัวข้อฮีโร่ (`h1`) — เหลือชื่อหัวข้อ (+ ไอคอน) พอ
- รายละเอียดวิธีใช้ถ้าจำเป็น: ซ่อนหลังปุ่มคู่มือ / แผงกรอง — ไม่โชว์ใต้หัวตลอดเวลา

## 2) รายการเป็นกริดการ์ด (ไม่ใช้ตารางเดสก์ท็อปคู่กับมือถือแยก)

| Viewport | กริด |
|----------|------|
| มือถือ | `grid-cols-1 gap-3` |
| `sm+` | `sm:grid-cols-3 sm:gap-5` |
| **กิจกรรม** | **`grid-cols-1 gap-3` เสมอ** (ข้อความสรุปยาว — ไม่ใช้ 3 คอลัมน์) |

การ์ดรายการแอดมิน — **2 แถว (บังคับ)** ชื่อ/ข้อมูลต้องไม่อยู่แถวเดียวกับรูปหรือปุ่ม (กริด `sm:grid-cols-3` แคบ — ชื่อจะอ่านไม่ออก):

```
rounded-xl border border-white/70 bg-white/85 p-3 shadow-sm
flex flex-col gap-2

แถว 1: flex justify-between gap-2
  [รูปย่อ 44×44 rounded-2xl ซ้าย]  [ปุ่มแอ็กชัน shrink-0 ขวา]

แถว 2: min-w-0 เต็มความกว้างการ์ด
  [ชื่อ — break-words text-sm font-black]
  [บรรทัดรอง — slug break-all · คำอธิบาย break-words]
```

**ห้าม** ใช้เลย์เอาต์แถวเดียว `flex items-start gap-3` ที่วาง `[รูป][ชื่อ flex-1][ปุ่ม]` คู่กัน — ชื่อจะถูกบีบระหว่างรูปกับปุ่ม

**มือถือ — เห็นข้อความเต็ม:** ห้าม `truncate` / `line-clamp` บนชื่อ·อีเมล·slug·คำอธิบายในการ์ดรายการ  
ใช้ `break-words` / `break-all` (อีเมล·slug) · ข้อความหลายบรรทัดอยู่แถวล่างเต็มความกว้าง  
หน้าภาพรวมศูนย์แอดมิน: กริด `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` (ไม่บีบ 2 คอลัมน์บนมือถือจนตัดคำ)

- **รูปการ์ดโมดูล / ลิงก์ทดลอง:** ใช้ `resolveModuleCardDisplayImageUrl` (หรือรูปอัปโหลดที่ปลอดภัย)
- **ผู้ใช้:** ใช้ `avatarUrl` (`/uploads/…` หรือ `https://`) — ไม่มีรูปใช้ตัวอักษรย่อ
- **ปลดล็อค / กิจกรรม / MQTT events:** ไอคอนในกรอบ `h-11 w-11 rounded-2xl` แทนรูปถ้าไม่มีรูป

**ห้าม** คงเลย์เอาต์คู่ `hidden md:table` + `md:hidden` การ์ดคนละแบบ — รวมเป็นกริดเดียวทุก breakpoint

## 3) ตัวกรอง

- ปุ่มซ่อน/แสดงตัวกรองมุมขวาหัวการ์ด (`aria-label` ชัด · จุดสีเมื่อกรองอยู่)
- ตาม `dashboard-mobile-filter-icon.mdc` / แพทเทิร์นลิงก์ทดลอง

## 4) Export Excel (บังคับบนหน้ารายการ)

หน้าที่มีรายการส่งออกได้ (อย่างน้อย): **รูปการ์ด · ปลดล็อค · กิจกรรม · MQTT (events)** — และหน้ารายการอื่นที่สมเหตุสมผล

- ใช้ **`downloadAdminExcel`** จาก `@/lib/admin/export-excel` (SpreadsheetML `.xls` — ไม่ต้องติดตั้ง `xlsx`)
- ปุ่มในกลุ่ม `action` ของ `AppSectionHeader`: ไอคอนบนมือถือ · ข้อความ `Excel` บน `sm+`
- Export **แถวที่กำลังแสดงหลังกรอง** (ไม่บังคับทั้งฐานถ้าหน้าเป็น pagination — อย่างน้อยหน้าปัจจุบัน + ระบุในชื่อไฟล์)

```ts
import { downloadAdminExcel } from "@/lib/admin/export-excel";

downloadAdminExcel({
  filename: "admin-module-cooldowns",
  sheetName: "ปลดล็อค",
  headers: ["Email", "ผู้ใช้", "ระบบ", ...],
  rows: filtered.map((r) => [r.email, r.username, ...]),
});
```

## 5) ระยะขอบซ้าย–ขวา

ชุดเดียวกับสนามฟุตบอลใน `DashboardPagesShell`:

`size="full"` + `max-w-none !px-3 sm:!px-4 lg:!px-6`

**มือถือ / เดสก์ท็อป — ขอบซ้าย–ขวาเท่าแถบ header ม่วง:**  
`DashboardPagesShell` สำหรับ `/dashboard/admin` ใช้ `!px-0` (ชุด wide module) · ขอบนอกมาจาก `DashboardShell` `px-3 sm:px-4` เท่านั้น · การ์ด chrome/เนื้อหาใช้ `p-3` / `px-3` ด้านใน

รายละเอียดชั้น gutter: `.cursor/rules/dashboard-page-width.mdc`  
ยุบหัวศูนย์แอดมิน: `.cursor/rules/dashboard-nav-menu-groups.mdc` §5

## 6) ไฟล์อ้างอิง

| หน้า | คอมโพเนนต์ |
|------|------------|
| ลิงก์ทดลอง | `ModuleTryLinksAdmin.tsx` |
| ผู้ใช้ | `UsersAdmin.tsx` |
| รูปการ์ด | `ModuleCardImagesAdmin.tsx` |
| ปลดล็อค | `ModuleCooldownAdminClient.tsx` |
| กิจกรรม | `ActivityLogsClient.tsx` |
| MQTT | `MqttHealthClient.tsx` |
| Export | `src/lib/admin/export-excel.ts` |

## เช็กลิสต์หน้าแอดมินใหม่

- [ ] ไม่มี `description` บนหัวข้อรายการ / ไม่มีย่อหน้าใต้ฮีโร่
- [ ] กริดการ์ด `grid-cols-1 sm:grid-cols-3` (กิจกรรมใช้ `grid-cols-1` อย่างเดียว) — ไม่แยกตารางเดสก์ท็อป
- [ ] การ์ดรายการ 2 แถว: แถวบน = รูป/ไอคอน + ปุ่ม · แถวล่าง = ชื่อ/ข้อมูลเต็มความกว้าง (`break-words`)
- [ ] มีปุ่ม Export Excel ผ่าน `downloadAdminExcel` (ถ้ารายการส่งออกได้)
- [ ] gutter ผ่าน `DashboardPagesShell` ชุด admin/football


================================================================================
### .cursor/rules/agent-finish-checkpoint.mdc
================================================================================

---
description: จบงานให้ครบ — prisma generate, migrate, tsc, dev · git commit + push checkpoint
alwaysApply: true
---

# จบงานให้ครบ + บันทึกย้อนกลับได้

ใช้คู่กับ `run-commands-proactively.mdc` · **`agent-verify-before-done.mdc`** (ตรวจ UI/กฎให้ครบก่อนจบ — ห้ามให้ผู้ใช้สั่งแก้ซ้ำหลายรอบ)

หลังแก้โค้ด/สคีมา **อย่าจบเทิร์นแค่สรุป** ถ้ายังไม่รันขั้นตอนด้านล่างที่เกี่ยวข้อง

## Checklist ก่อนถือว่างานจบ (รันเอง ไม่ส่งต่อผู้ใช้)

| สถานการณ์ | คำสั่งที่ต้องรัน (ที่รากโปรเจกต์) |
|-----------|-----------------------------------|
| แก้ `prisma/schema.prisma` หรือ `prisma/migrations/**` | `npx prisma migrate deploy` (หรือ `migrate dev` ถ้าสร้าง migration ใหม่) → **`npx prisma generate`** |
| แตะ API/โค้ดที่ใช้โมเดล Prisma ใหม่ | **`npx prisma generate`** (แม้ไม่มี migration) |
| แก้ TypeScript/React หลัก | **`npx tsc --noEmit`** — แก้จนกว่าผ่าน |
| เปลี่ยน env / schema / route สำคัญ | รีสตาร์ท **`npm run dev`** หรือยืนยันว่า dev ยังรันและ HMR โหลดได้ |
| `prisma generate` EPERM (Windows) | หยุด process ที่ล็อก `query_engine-windows.dll.node` (มักคือ `next dev`) → generate ใหม่ → เปิด dev ใหม่ |
| หลัง generate + แก้ schema | ลบ `.next` แล้วรัน dev ใหม่ถ้าเจอ client เก่า / API 404 แปลก ๆ |

## Dev server

- ถ้า **ไม่มี** `next dev` รันอยู่และงานต้องทดสอบบนเบราว์เซอร์ — **เปิด `npm run dev` ใน background** หลัง generate/migrate
- ถ้า dev รันอยู่แล้วหลัง schema change — **รีสตาร์ท** dev หนึ่งรอบ (หยุดแล้วรันใหม่) ดีกว่าคาดหวัง HMR อย่างเดียว

## Git checkpoint — commit + push ทุกครั้งที่แก้โค้ดจบช่วงงาน

หลังจบชุดการแก้ที่ **สมบูรณ์ในบริบทงาน** (feature/fix ย่อย หรือจบเทิร์น):

1. `git status` + `git diff` — อย่า commit `.env`, `.next`, credentials · **อย่า** `git add .` แบบไม่กรอง (uploads/log/`.bak`)
2. **สร้าง commit** ด้วยข้อความสั้น ชัด (ภาษาไทยหรืออังกฤษตามสไตล์ repo) — **ไม่ต้องรอผู้ใช้บอก "commit"** ในโปรเจกต์นี้
3. **`git push`** ขึ้น remote ของ branch ปัจจุบัน (มัก `git push origin HEAD`) — **ไม่ต้องรอผู้ใช้บอก "push"** เมื่อ commit สำเร็จและมี remote
4. **อย่า** commit ไฟล์ build/cache (`.next/**`) · uploads ทดสอบ · log · secret

**ข้อยกเว้นไม่ commit/push:** งานค้างกลางทางชัดเจน (โค้ดพัง / tsc ไม่ผ่าน / migration ล้มเหลว) — แก้ให้ผ่าน checklist ก่อน

**ข้อยกเว้น commit แต่ยังไม่ push:**

- push ล้มเหลวเพราะ **auth / 2FA / credential** ที่ agent ไม่มี — สรุปให้ผู้ใช้ push เอง
- branch **ไม่มี remote** หรือต้อง `--force` / rebase ที่ทำลายประวัติ — **ห้าม** force push `main`/`master` โดยไม่ขอชัดเจน
- ผู้ใช้สั่งชัดว่า **อย่า push** ในเทิร์นนั้น

## ลำดับมาตรฐานหลังแก้ schema

```
npx prisma migrate deploy   # ถ้ามี migration ใหม่
npx prisma generate
npx tsc --noEmit
# หยุด dev ถ้าจำเป็น → ลบ .next ถ้าจำเป็น → npm run dev
git add <ไฟล์ที่เกี่ยวข้อง>
git commit -m "..."
git push origin HEAD
```

## ห้ามพลาดซ้ำ

- อย่าจบด้วย "รัน prisma generate เองนะ" หลังแก้ schema
- อย่าทิ้ง diff ค้างหลายเทิร์นโดยไม่ commit/push เมื่องานย่อยนั้นจบแล้ว
- อย่าจบด้วย "push เองนะ" ถ้า push ได้ในเครื่องนี้
- อย่า commit เฉพาะ rule/doc โดยไม่ generate/tsc เมื่องานนั้นแตะ Prisma หรือ TS


================================================================================
### .cursor/rules/agent-reporting-brief.mdc
================================================================================

---
description: รายงานผลงานให้ผู้ใช้แบบสั้น เน้นสิ่งสำคัญ
alwaysApply: true
---

# การรายงานให้ผู้ใช้

เมื่อสรุปงาน แจ้งผล หรือตอบหลังทำเสร็จ:

## บังคับ

- **สั้น** — ไม่ยืด ไม่เล่าขั้นตอนทีละคำสั่ง ไม่ทวนบริบทที่ผู้ใช้รู้อยู่แล้ว
- **เน้นสิ่งสำคัญ** — ผลลัพธ์ · สิ่งที่เปลี่ยน · ปัญหาที่เหลือ (ถ้ามี) · ขั้นต่อไปที่ต้องตัดสินใจ
- **ลำดับความสำคัญ** — ขึ้นต้นด้วยสรุป 1–2 ประโยค แล้วค่อยรายละเอียดจำเป็น (bullet สั้น ๆ)

## หลีกเลี่ยง

- ย่อหน้ายาว อธิบายซ้ำ หรือ list ไฟล์ทุกบรรทัดที่แก้
- ปิดท้ายด้วยคำชวนทำต่อทุกครั้ง — ถามเฉพาะเมื่อมีทางเลือกจริงหรือผู้ใช้ต้องตัดสินใจ

## ตัวอย่างโครงสรุป

```
[ผลลัพธ์หลัก 1 ประโยค]

- เปลี่ยนอะไร (สั้น ๆ)
- รันทดสอบแล้วหรือยัง (ถ้าเกี่ยว)
- ค้าง / ต้องทำต่อ (ถ้ามี)
```


================================================================================
### .cursor/rules/agent-run-scripts-no-confirm.mdc
================================================================================

---
description: อนุญาตถาวรให้เอเจนต์รันสคริปต์/เทอร์มินัลในโปรเจกต์นี้โดยไม่ต้องถามยืนยัน
alwaysApply: true
---

# อนุญาตรันสคริปต์ — ไม่ต้องถามยืนยัน

ผู้ใช้อนุญาต**ถาวร**ในโปรเจกต์นี้แล้ว — เอเจนต์**รันได้เลย** ไม่ต้องถามก่อน และไม่ต้องรอคำว่า “รันให้หน่อย / โอเคไหม”

## รันเองได้ทันที (ตัวอย่าง)

- `npm` / `npx` / `pnpm` / `yarn` (รวม `dev`, `build`, `lint`, `test`, สคริปต์ใน `package.json`)
- Prisma: `migrate`, `generate`, `db:seed`, `studio` (เมื่อจำเป็นต่องาน)
- `tsc`, สคริปต์ใน `scripts/`, เชลล์ PowerShell/bash ที่เกี่ยวกับงานใน repo
- Git: `status`, `diff`, `add`, `commit`, **`push`** (หลัง commit จบช่วงงาน — ดู **`agent-finish-checkpoint.mdc`**) — ไม่ต้องถามยืนยัน
- หยุด/รีสตาร์ท `next dev`, ลบ `.next` เมื่อจำเป็นหลัง generate / client ค้าง

## บังคับ

- **ห้าม**ถามว่า “ให้รันไหม” / “ขออนุญาตก่อนรัน” สำหรับคำสั่งในโปรเจกต์นี้ที่สมเหตุสมผลกับงาน
- **ห้าม**จบงานด้วยรายการให้ผู้ใช้ไปรันเอง ถ้ารันในสภาพแวดล้อมนี้ได้
- ถ้าคำสั่งล้มเหลว — แก้แล้วรันใหม่ตามสมควร ก่อนสรุปให้ผู้ใช้

## ข้อยกเว้น (ค่อยส่งต่อ / ถาม)

- รหัสผ่าน · 2FA · บัญชีภายนอกที่เอเจนต์ไม่มี
- กดยืนยันบนอุปกรณ์จริง
- แก้ **production** / DB / เซิร์ฟเวอร์ที่ agent เข้าไม่ถึง
- คำสั่งทำลายข้อมูลถาวรระดับนอกโปรเจกต์ (เช่น ลบโฟลเดอร์ระบบ) ที่ไม่เกี่ยวกับงาน

คู่กับ: **`run-commands-proactively.mdc`** · **`agent-finish-checkpoint.mdc`**


================================================================================
### .cursor/rules/agent-verify-before-done.mdc
================================================================================

---
description: ตรวจงานให้ครบก่อนจบเทิร์น — ห้ามให้ผู้ใช้สั่งแก้ UI/กฎซ้ำหลายรอบ
alwaysApply: true
---

# ตรวจให้เรียบร้อยก่อนจบ — ห้ามโยนให้แก้หลายรอบ

ผู้ใช้**ไม่ต้องการ**สั่งแก้ซ้ำหลังเอเจนต์บอกว่างานเสร็จ — ต้อง**ตรวจเอง**ให้ครบตามกฎแม่แบบก่อนถือว่าจบ

## บังคับก่อนสรุป / commit

1. **อ่านกฎที่เกี่ยวข้อง** ของโมดูลหรืองานนั้น (เช่น `*-module-dashboard-template.mdc` · `dashboard-primary-secondary-menu-tabs.mdc` · `dashboard-module-list-filter.mdc` · laundry-first) — อย่าเดา layout
2. **เทียบกับโค้ดจริง** ว่าทำครบตามกฎ (ไม่ใช่แค่ “น่าจะได้”)
3. **UI ที่แตะเมนู / ปุ่ม / กรอง / มือถือ** — เช็ค checklist ด้านล่างทุกข้อที่เกี่ยว
4. รัน `tsc` (และ checklist ใน `agent-finish-checkpoint.mdc`) แล้วค่อย commit/push

## Checklist UI แดชบอร์ด (เมื่อแตะหัวหน้า · แท็บ · ปุ่มเพิ่ม/กรอง)

| ตรวจ | ถูก |
|------|-----|
| ปุ่มกรอง / เพิ่ม | **แถวเดียวกับเมนู** (เดสก์ท็อป) — ไม่หลุดไปแถวอื่น / ไม่ถูก `min-w-0` บีบจนหาย |
| มือถือ · แท็บหลัก ≥2 | **dropdown (`<select>`)** ตามกฎ — ปุ่มแอ็กชันยังเห็นได้ |
| เมนูย่อยภายใน | **ปุ่ม** สไตล์เดียวกับแถบหัว · **แถวเดียวกับปุ่มหัวข้อ/กรอง/เพิ่ม** · คั่น**เส้นบาง**ระหว่างปุ่ม · **ห้าม** วางในเนื้อหา / ข้อความล้วนใต้หัว |
| ชิปกรองสถานะ (ในแผงรายการ) | ตามโทเค็นโมดูล (รปภ. = ข้อความล้วน) — คนละชั้นกับเมนูย่อยภายใน |
| ไม่ซ้ำหัวข้อ | ไม่โชว์ชื่อโมดูล/แท็บซ้ำใต้ chrome |

## ห้าม

- จบด้วย “ลองรีเฟรชดู” ทั้งที่ยังไม่ได้เทียบกฎ / ยังเห็นชัดว่า layout ผิด
- ปิด `mobileSelect` / บังคับ pill บนมือถือทั้งที่กฎโมดูลกำหนด dropdown
- เคลียร์ state (เช่น toolbar) แล้วไม่ลงทะเบียนใหม่จนปุ่มหาย — ตรวจ flow สลับแท็บ
- ส่งงานที่ต้องให้ผู้ใช้ไล่จับบั๊ก UI หลายรอบ

## คู่กับ

- `agent-finish-checkpoint.mdc` (tsc · generate · commit/push)
- `agent-reporting-brief.mdc` (สรุปสั้นหลังตรวจแล้ว)
- แม่แบบโมดูลที่เกี่ยวข้อง


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

1. ใช้ `AppImageThumb` / `AppSlipImageThumb` / **`AppLabeledImageThumb`** + `AppImageLightbox` + `useAppImageLightbox` จาก `@/components/app-templates` เท่านั้น (สลิปบนการ์ดรายการ → `AppLabeledImageThumb` · ดู **`app-templates-media.mdc`**)
2. `AppImageLightbox` ต้อง render ผ่าน `createPortal(..., document.body)` เพื่อไม่ให้ตำแหน่งเพี้ยนจาก parent layout
3. Overlay ต้องกึ่งกลางจอจริงเสมอ (`fixed inset-0`, `items-center justify-center`)
4. รูปต้องไม่ล้นจอ: ใช้ `object-contain` และจำกัด `max-h/max-w` ตาม viewport (`dvh/dvw`)
5. ชั้นครอบต้องกันล้น (`overflow-hidden`) และรองรับ safe-area มือถือ
6. ปิดได้ 3 ทาง: ปุ่มปิด, คลิกพื้นหลัง, กด `Esc`
7. ห้ามสร้าง lightbox แบบ ad-hoc ในโมดูลย่อย; ถ้าต้องเพิ่มพฤติกรรม ให้ขยายใน `AppImageLightbox`

ตัวอย่าง pattern:
- Thumb: `<AppImageThumb src={url} onOpen={() => lb.open(url)} />`
- สลิปมีป้าย: `<AppLabeledImageThumb src={url} kind="slip" alt="…" onOpen={() => lb.open(url)} />`
- Lightbox: `<AppImageLightbox src={lb.src} onClose={lb.close} />`


================================================================================
### .cursor/rules/app-templates-central.mdc
================================================================================

---
description: บังคับให้ใช้ template กลาง @/components/app-templates ก่อนสร้าง UI ซ้ำ — ตรวจทุกครั้งที่แตะฟีเจอร์ที่มีในแพ็กเกจนี้
alwaysApply: true
---

# Template กลาง — ตรวจก่อนเขียน UI

ก่อนเพิ่มหรือแก้ UI ที่เกี่ยวกับ **รูป / lightbox / แดชบอร์ด / กราฟแท่ง / พิมพ์เอกสาร / ใบเสร็จสลิป / อัปโหลดสลิป / กล้องถ่ายรูป**:

## บังคับ

1. **เปิดหรือค้น** `src/components/app-templates/index.ts` และโฟลเดอร์ `src/components/app-templates/` — ดูว่ามีคอมโพเนนต์ ฟังก์ชัน หรือโทเค็น (`appTemplate*`, `App*`) ที่ตรงงานหรือไม่
2. **Import จาก** `@/components/app-templates` (barrel) — ห้ามคัดลอกบล็อก JSX/CSS จาก `home-finance`, `building-pos` หรือโมดูลอื่นมาเป็นของใหม่ถ้าหน้าที่เดียวกันมีใน template แล้ว
3. **ถ้ายังไม่มี** สิ่งที่ต้องการ — **ขยายที่ `app-templates`** (คอมโพเนนต์ใหม่ / prop เพิ่ม / โทเค็นใน `dashboard-tokens`) แล้ว export ใน `index.ts` แทนการผูกเฉพาะหน้าเดียว

## หมวดที่ครอบคลุม (สรุป)

- รูปย่อ + ดูเต็มจอ → `AppImageThumb`, **`AppLabeledImageThumb`** (สลิป+ป้าย · **`app-templates-slip-labeled-thumb.mdc`**), `AppSlipImageThumb` (legacy ไม่มีป้าย), `AppImageLightbox`, `useAppImageLightbox` (รายละเอียด **`app-templates-media.mdc`**)
- **YouTube** → `AppYoutubeLightbox` / `AppSecureYoutubePlayer` (รายละเอียด **`app-templates-youtube.mdc`** — ห้ามคัดลอกลิงก์ · ไอคอนเต็มจอ · CSS FS บน iOS)
- การ์ดแดชบอร์ด / หัวข้อ / ว่าง → `AppDashboardSection`, `AppSectionHeader`, `AppEmptyState`, โทเค็น `appDashboard*`
- กราฟแท่งเปรียบเทียบ / แท่งรายวัน / แท่งคู่ต่อช่วง / รายได้เทียบต้นทุนรายวัน → `AppCompareBarList`, `AppColumnBarSparkChart`, `AppColumnBarDualSparkChart`, `AppRevenueCostColumnChart`, เลย์เอาต์ `AppSparkChartPanel`, `AppSparkChartsTwoColumnGrid` (รายละเอียดกฎ `app-templates-spark-charts.mdc`)
- พิมพ์ HTML / ย่อรูปก่อนอัปโหลด → `openPrintableHtml`, `printPrintableHtmlInHiddenIframe`, `prepareImageFileForUpload`
- **อัปโหลดรูป / สลิป / แกลเลอรี (ย่อ+ชื่อ+หลายรูป)** → กฎ **`app-templates-image-upload.mdc`**
- **ใบเสร็จ / สลิปขนาดโปรไฟล์** → `printAppReceiptSlip` · `printAppOrderTicketSlip` · `useAppSlipPaperSize` · `AppSlipPaperSizeToolbar` · **ตั้งค่าต่อโมดูล:** `AppSlipPaperSizeSettingsField` + `slipPaperSize` (รายละเอียด `app-templates-slip-receipt.mdc`)
- สลิป เลือกรูป ถ่ายกล้อง → `AppGalleryCameraFileInputs`, `AppImagePickCameraButtons`, `AppPickGalleryImageButton`, `AppTakePhotoButton`, `AppCameraCaptureModal`
- **เวลา 24 ชม. ในฟอร์ม** → `AppTime24Input` (ดู `module-thailand-timezone.mdc`)

## ข้อยกเว้น

- โมดูลที่ **ไม่เกี่ยวกับแพทเทิร์นข้างต้น** ไม่ต้องบังคับใช้ template — แต่ถ้าจะทำฟีเจอร์เดียวกันในอนาคต ให้ย้ายมาใช้กลางแทน


================================================================================
### .cursor/rules/app-templates-image-upload.mdc
================================================================================

---
description: Template กลาง — อัปโหลดรูป / สลิป / แกลเลอรี ต้องย่อ+ตั้งชื่อก่อนส่ง และรองรับหลายรูปเมื่อเป็นแกลเลอรี
alwaysApply: true
---

# อัปโหลดรูป · สลิป · แกลเลอรี (บังคับก่อนส่งเซิร์ฟเวอร์)

ใช้เมื่อมี **เพิ่มรูป · แนบสลิป · แกลเลอรี · โลโก้ · หลักฐานโอน · รูปแลกรางวัล** จาก client

คู่กับ: `app-templates-media.mdc` (thumb/lightbox) · `app-templates-central.mdc` · รายละเอียดชื่อไฟล์เซิร์ฟเวอร์: `football-turf-module-dashboard-template.mdc` §9

---

## 1) ย่อ / แปลงก่อนอัปโหลด (บังคับ)

| กรณี | ฟังก์ชัน | จาก |
|------|---------|-----|
| สลิป · โลโก้ · รูปทั่วไป · หลักฐาน | **`prepareImageFileForUpload(file)`** | `@/components/app-templates` |
| ต้องการ data URL ชั่วคราวก่อน persist | **`prepareImageFileAsDataUrl(file)`** | เดียวกัน |
| รูป+PDF | **`prepareUploadFile(file)`** | เดียวกัน |
| โดเมนบังคับ WebP (เช่นแกลเลอรีกิจกรรมชมรม) | helper โมดูลที่ **ย่อ+ตั้งชื่อ** แล้ว (เช่น `prepareClubEventGalleryWebp`) — ห้ามส่งไฟล์ดิบ |

**ลำดับ:**

1. ได้ `File` จาก `<input type="file">` / กล้อง / `useAppCameraCapture`
2. **`await prepare*(file)`** (หรือ helper โมดูลที่เทียบเท่า)
3. ใส่ `FormData` → `POST` endpoint อัปโหลดโมดูล
4. เก็บ **path** ที่ API คืน (`/uploads/…`) ใน DB — ห้ามเก็บ data URL ยาวใน `VarChar` สั้น

```tsx
// ✅
const prepared = await prepareImageFileForUpload(file);
const fd = new FormData();
fd.set("file", prepared);
await fetch("/api/…/upload", { method: "POST", body: fd });

// ❌ ส่ง File ดิบจาก input โดยไม่ย่อ
fd.set("file", file);
```

---

## 2) ชื่อไฟล์

- **บนดิสก์ (server):** ให้ `saveModuleUpload` / `buildStoredUploadFileName` / `saveOwnerModuleUploadImage` สร้างชื่อมาตรฐาน — อย่าพึ่งชื่อจากเครื่องลูกค้าเป็นความจริง
- **ฝั่ง client หลัง prepare:** ชื่อที่ helper คืน (เช่น `….jpg` / `club-event-gallery-{ts}-{rand}.webp`) ใช้ส่งต่อได้
- **ชื่อที่แสดงใน UI/DB** (ถ้ามีฟิลด์แยก): ให้ผู้ใช้ตั้งเองได้ — ห้ามบังคับใช้ชื่อไฟล์จากเครื่อง

---

## 3) UI เลือกไฟล์ / กล้อง

- แกลเลอรี + ถ่าย: **`AppGalleryCameraFileInputs`** + **`AppImagePickCameraButtons`** (+ **`useAppCameraCapture`**)
- ปุ่มเดี่ยว: **`AppPickGalleryImageButton`** / **`AppTakePhotoButton`**
- **ห้าม** ผูกปุ่มถ่ายไป `input.capture.click()` อย่างเดียวเมื่อมี `useAppCameraCapture`

---

## 4) หลายรูปพร้อมกัน (แกลเลอรี)

เมื่อ UX คือ **เพิ่มรูปหลายใบ** (แกลเลอรีกิจกรรม · แกลเลอรีพอร์ทัล · อัลบั้ม):

1. `<input type="file" accept="image/*" multiple />` หรือ `AppGalleryCameraFileInputs` + **`galleryMultiple`**
2. วนแต่ละไฟล์ → **prepare ทีละไฟล์** → อัปโหลดทีละไฟล์ (หรือ batch ที่ API รองรับ)
3. เคารพโควต้า/แพ็กเกจ — ตัดส่วนเกินแล้วแจ้งผู้ใช้
4. สลิป/หลักฐานชำระ **ปกติทีละรูป** — ไม่บังคับ `multiple` เว้นโดเมนชัดเจน

---

## 5) แสดงผลหลังอัปโหลด

- ย่อทั่วไป: **`AppImageThumb`** · **สลิป (รายการ/การ์ด/พรีวิว):** **`AppLabeledImageThumb` `kind="slip"`** (ป้ายมุมล่างรูป · ดู **`app-templates-slip-labeled-thumb.mdc`**) · สลิปไม่มีป้าย (legacy): `AppSlipImageThumb`
- เต็มจอ: **`AppImageLightbox`** + **`useAppImageLightbox`**
- แถวการเงิน: สลิป**เฉพาะเมื่อมี URL** — ดู `dashboard-finance-detail-tabs.mdc`

---

## ห้าม

- อัปโหลดรูป/สลิปโดยไม่ผ่าน `prepareImageFileForUpload` (หรือเทียบเท่าโมดูล)
- คัดลอก canvas ย่อรูปใหม่ในโมดูลโดยไม่ใช้ helper กลาง / helper โมดูลที่มีอยู่แล้ว
- เก็บ data URL ดิบยาวในคอลัมน์สั้น
- สร้าง lightbox / ปุ่มแกลเลอรี-กล้อง เองทั้งที่ `app-templates` มีแล้ว

## เช็กลิสต์

- [ ] ก่อน `FormData` มี `prepare*`
- [ ] ใช้ปุ่ม/input จาก `app-templates` เมื่อเป็นแกลเลอรี+กล้อง
- [ ] แกลเลอรีหลายรูป → `multiple` + วน prepare
- [ ] API คืน path ใต้ `/uploads/…` · แสดงสลิปด้วย **`AppLabeledImageThumb` `kind="slip"`** (+ lightbox)


================================================================================
### .cursor/rules/app-templates-media.mdc
================================================================================

---
description: Template กลาง app-templates — รูป/lightbox, สลิป+ป้าย (AppLabeledImageThumb), แดชบอร์ด, กราฟ, พิมพ์, อัปโหลด (กล้อง/แกลเลอรี)
alwaysApply: true
---

# Template กลาง — รูปแนบ / สลิป / ดูรูปเต็ม

เมื่อทำฟีเจอร์ที่มี **รูปย่อคลิกดูใหญ่**, **สลิป**, **หลักฐานโอน**, หรือ lightbox แบบเดียวกับรายรับ–รายจ่าย:

## บังคับ

- Import จาก **`@/components/app-templates`** เท่านั้น:
  - **`AppImageThumb`** — ปุ่มรูปย่อ (ค่าเริ่ม 64×64 · `object-cover`) + `onOpen`
  - **`AppSlipImageThumb`** — สลิป**ไม่มีป้าย** (กรณีพิเศษเท่านั้น) — **รายการ/การ์ด/พรีวิวสลิปมาตรฐานใช้ `AppLabeledImageThumb`** ดู **`app-templates-slip-labeled-thumb.mdc`**
  - **`AppLabeledImageThumb`** — รูปย่อ + **ป้ายมุมล่างบนรูป** (`slip` = «สลิป» · `product` = «สินค้า» · `photo` = «รูป») — **บังคับ** ทุกรายการ/การ์ด/ประวัติ/การเงิน/จอง และ**พรีวิวหลังอัปโหลดสลิป** (ต้นแบบ ecommerce)
  - **`AppImageLightbox`** — overlay ดูรูปเต็ม
  - **`useAppImageLightbox()`** — `{ src, open, close }` คู่กับ Lightbox
  - **`AppYoutubeLightbox`** + **`useAppYoutubeLightbox()`** — เล่น YouTube ในป๊อปอัป + เต็มจอ (ไอคอนล้วน · ไม่มีลิงก์ watch)
  - **`AppSecureYoutubePlayer`** — เล่น YouTube **ในหน้า** แบบ LMS (controls ปิด · ไอคอน · CSS fullscreen บน iOS)
- **กฎ YouTube เต็ม:** **`app-templates-youtube.mdc`** — ห้ามคัดลอกลิงก์ / เปิดบน YouTube บน UI ผู้ใช้ปลายทาง
- **แกลเลอรีหลายรูป + สไลด์โชว์ + กริดวิดีโอ:** ดูกฎ **`dashboard-module-media-gallery-slideshow.mdc`** (ต้นแบบชมรม)
- **ห้าม** คัดลอก/เลียนแบบ `HomeFinanceImageLightbox` หรือ `HomeFinanceThumb` เป็นไฟล์ใหม่ในโมดูลอื่น
- **ห้าม** สร้าง lightbox ใหม่ด้วย `fixed inset-0` + `img` เองถ้าเป้าหมายคือ “ดูรูปแนบแบบเดียวกับระบบเดิม” — ขยายที่ `AppImageLightbox` ถ้าต้องการพฤติกรรมเพิ่ม (แล้วได้ทุกหน้าพร้อมกัน)
- **ห้าม** สร้าง iframe/โมดัล YouTube เองเมื่อมี `AppYoutubeLightbox` / `AppSecureYoutubePlayer`
- **ห้าม** วาดป้าย «สลิป» ใต้รูป/ข้างชื่อเอง (กินที่ · ทับชื่อ) — ใช้ **`AppLabeledImageThumb`**

## แพทเทิร์นมาตรฐาน

```tsx
import {
  AppImageLightbox,
  AppImageThumb,
  AppLabeledImageThumb,
  AppSlipImageThumb,
  useAppImageLightbox,
} from "@/components/app-templates";

const lb = useAppImageLightbox();

{/* รูปทั่วไป / แกลเลอรี / โลโก้ */}
<AppImageThumb src={url} alt="คำอธิบาย" onOpen={() => url && lb.open(url)} />

{/* พรีวิวอัปโหลด / รายการ — มีป้าย «สลิป» */}
<AppLabeledImageThumb
  src={slipUrl}
  kind="slip"
  alt="สลิปชำระเงิน"
  onOpen={() => slipUrl && lb.open(slipUrl)}
  className="h-20 w-20"
/>

{/* รายการ/การ์ด — ป้าย «สลิป» ทับมุมล่างรูป · ชื่ออยู่ข้างรูป (gap-3) */}
<div className="flex min-w-0 items-start gap-3">
  <AppLabeledImageThumb
    src={slipUrl}
    kind="slip"
    alt={personName}
    onOpen={() => lb.open(slipUrl)}
  />
  <div className="min-w-0 flex-1 space-y-0.5">
    <p className="truncate text-sm font-black text-[#1e1b4b]">{personName}</p>
    {/* เบอร์ · ยอด · เมตา */}
  </div>
</div>

<AppImageLightbox src={lb.src} onClose={lb.close} alt="คำอธิบาย" />
```

## AppImageThumb — กรอบคงที่ รูปพอดีกรอบ (template มาตรฐาน)

เมื่อแก้หรือเพิ่ม **`AppImageThumb`** (`src/components/app-templates/AppImageThumb.tsx`) หรือเลียนแบบรูปแบบเดียวกัน:

1. **กำหนดขนาดที่ wrapper** (`<button>` / กรอบคลิก) — เช่น `h-16 w-16` + `overflow-hidden` + `rounded-xl` + `ring-2` — ไม่ใช่กำหนดแค่ที่ `<img>` อย่างเดียว เพื่อไม่ให้กรอบกับรูปคนละขนาด
2. **`<img>`** ใช้ **`object-cover`** (ค่าเริ่ม) สำหรับแกลเลอรี/โลโก้/รูปโปรไฟล์ — หรือส่ง **`objectFit="contain"`** เมื่อต้องเห็นรูปครบ
3. **สถานะไม่มีรูป** (`emptyLabel`) — ใช้ **ขนาดเดียวกับมีรูป** (`h-16 w-16` ฯลฯ) + `ring` สอดคล้องกรอบมีรูป
4. **ขนาดอื่น** — ส่ง **`className`** ให้ `AppImageThumb` / `AppSlipImageThumb` / `AppLabeledImageThumb` เพื่อ override ขนาดกรอบ เช่น `className="h-20 w-20"`
5. **Lightbox ทับโมดัล** — `AppImageLightbox` ใช้ **`z-[240]`** เหนือ `FormModal` (`z-[200]`) และ `AppCameraCaptureModal` (`z-[220]`) — ถ้าแก้ z-index โมดัล ต้องเช็คลำดับซ้อนกับ lightbox

## AppSlipImageThumb — สลิปไม่มีป้าย (legacy / กรณีพิเศษ)

**รายการ · การ์ด · พรีวิวหลังอัปโหลดสลิปมาตรฐาน → ใช้ `AppLabeledImageThumb` `kind="slip"`**  
ดูกฎเต็ม: **`app-templates-slip-labeled-thumb.mdc`**

`AppSlipImageThumb` คงไว้เฉพาะเมื่อ**ตั้งใจไม่มีป้าย** — ห้ามใช้ในแถวการเงิน/ออเดอร์/จองใหม่

## AppLabeledImageThumb — สลิป/สินค้าพร้อมป้าย (บังคับในรายการ)

ไฟล์: `src/components/app-templates/AppLabeledImageThumb.tsx`

ใช้เมื่อ**การ์ดรายการ**ต้องแยกรูปสลิปจากรูปอื่น หรือให้รู้ทันทีว่าเป็นหลักฐานโอน:

| `kind` | ป้าย | ใช้เมื่อ |
|--------|------|----------|
| `slip` | สลิป (เขียว) | หลักฐานโอน · คำตอบลิงก์ชำระ · ค่าบำรุง · ออเดอร์ |
| `product` | สินค้า (ม่วง) | รูปสินค้าคู่สลิปในรายการออเดอร์ |
| `photo` | รูป (เทา) | รูปทั่วไปที่ต้องมีป้ายสั้น |

### บังคับ

1. Import **`AppLabeledImageThumb`** จาก `@/components/app-templates` — **ห้าม** คัดลอก badge ทับรูปเองในโมดูล
2. เลย์เอาต์การ์ด: **`flex items-start gap-3`** — thumb (`shrink-0`) ซ้าย · ชื่อ/เมตา (`min-w-0 flex-1`) ขวา
3. ป้ายอยู่ **`absolute` มุมล่างของรูป** (`pointer-events-none`) — **ห้าม** วางข้อความ «สลิป» ใต้รูปหรือใต้ชื่อจนทับ/ดันเนื้อหา
4. `kind="slip"` ค่าเริ่ม **`objectFit="contain"`** — เห็นใบเสร็จครบ
5. ขนาดค่าเริ่ม `h-14 w-14` · `sm:h-16 sm:w-16` · `rounded-lg` (override ด้วย `className` ได้)
6. ถ้ามีทั้งสลิปและรูปสินค้าในแถวเดียว — ใช้ **`AppLabeledImageThumb` คู่กัน** (`slip` + `product`) ใน `flex gap-1.5`

### อ้างอิงที่ทำแล้ว

| โมดูล | ไฟล์ |
|-------|------|
| ร้านออนไลน์ | `EcommerceOrdersClient` · wrapper เก่า `EcommerceLabeledImageThumb` → re-export กลาง |
| ชมรม | `ClubEventLinkSubmissionsView` (คำตอบรายคน) · `ClubEventDuesStatusPanel` |

### ห้าม

- ป้าย «สลิป» เป็นข้อความใต้ thumb ในคอลัมน์แคบ (ทับชื่อ)
- Hardcode `absolute … bg-emerald-600` ซ้ำนอก `AppLabeledImageThumb`
- ใช้ `EcommerceLabeledImageThumb` ใหม่ในโมดูลอื่น — ใช้ `AppLabeledImageThumb` โดยตรง

## ความเข้ากันได้

- ชื่อเก่า `HomeFinanceImageLightbox` / `HomeFinanceThumb` ยัง re-export ได้ — โค้ดใหม่ให้ใช้ **`AppImage*`** จาก `app-templates` โดยตรง
- `EcommerceLabeledImageThumb` = wrapper บาง ๆ ไปที่ `AppLabeledImageThumb` (legacy import ร้านออนไลน์)
## แดชบอร์ด / กราฟ / พิมพ์ / อัปโหลดรูป

โมดูลรายรับ–รายจ่าย, POS, หรือรายงานที่ต้องการ UI สอดคล้องกัน:

- **`AppDashboardSection`** + **`appDashboardSectionSlateClass` / `appDashboardSectionVioletClass`** — การ์ดหลัก
- **`AppSectionHeader`** — หัวข้อ + คำอธิบาย + ปุ่มขวา (`tone`: `slate` | `violet`)
- **`AppEmptyState`** — กล่องว่างเส้นประ
- **`AppCompareBarList`** — กราฟแท่งแนวนอนเปรียบเทียบหลายแถว
- **`AppColumnBarSparkChart`** — กราฟแท่งแนวตั้งเลื่อนแนวนอน (ยอดรายวัน ฯลฯ)
- **`openPrintableHtml` / `printPrintableHtmlInHiddenIframe`** — เอกสาร HTML เต็มฉบับสำหรับ `window.print()` (บิล/สลิป/รายงาน)
- **`prepareImageFileForUpload`** — ย่อ/บีบ JPEG ก่อนอัปโหลด (**บังคับทุกครั้ง** — รายละเอียดเต็ม: **`app-templates-image-upload.mdc`**)
- **`AppPickGalleryImageButton`** / **`AppTakePhotoButton`** — ปุ่มเดี่ยว (คลาส: `appTemplatePickGalleryImageButtonClass`, `appTemplateTakePhotoButtonClass`)
- **`AppGalleryCameraFileInputs`** + **`AppImagePickCameraButtons`** — แถวปุ่มคู่ (คู่กับ **`AppCameraCaptureModal`** — `getUserMedia`; สำรอง `input capture`) · แกลเลอรีหลายรูปใช้ **`galleryMultiple`**
- **ปุ่มถ่ายรูป:** ใช้ **`useAppCameraCapture()`** → `openCamera(onFile)` + render `cameraModal` — ห้ามผูก `onPickCamera` ไป `input.capture.click()` อย่างเดียวเมื่อมี hook กลางนี้ (ลิงก์ลูกค้าโรงแรม / แผงชำระแดชบอร์ด)
- **`appTemplateOutlineButtonClass`** — ปุ่มขอบ (เช่น เลือกขนาดกระดาษพิมพ์)
- **`AppWindowPrintButton`** — พิมพ์หน้าปัจจุบัน (`window.print()`)

หลีกเลี่ยงการคัดลอกบล็อก JSX เดิมจาก POS / home-finance — ขยายที่ `app-templates` แทน

## อัปโหลดรูป / สลิป (สรุป)

1. ได้ไฟล์ → **`prepareImageFileForUpload`** (หรือเทียบเท่า) → `FormData` → API
2. แกลเลอรีหลายใบ → `multiple` / `galleryMultiple` + วน prepare ทีละไฟล์
3. แสดง → `AppImageThumb` / `AppSlipImageThumb` / **`AppLabeledImageThumb`** (รายการที่มีป้ายสลิป) + lightbox — **ห้าม**ส่งไฟล์ดิบโดยไม่ย่อ

รายละเอียดบังคับ: **`.cursor/rules/app-templates-image-upload.mdc`**
รายละเอียดป้ายสลิปบนการ์ด: **§ AppLabeledImageThumb** ด้านบน · ไฟล์ `AppLabeledImageThumb.tsx`


================================================================================
### .cursor/rules/app-templates-safe-area.mdc
================================================================================

# Safe-area กลาง — หัว / ล่าง มือถือ·ไอแพดแนวตั้ง · ทางลัดหน้าจอ · พอร์ทัลสาธารณะ

เมื่อพูด **มือถือ** ให้รวม **ไอแพดแนวตั้ง** — `dashboard-mobile-viewport.mdc`

เมื่อทำหรือแก้ **หัวหน้าเว็บสาธารณะ** · **แถบสถานะ iPhone/iPad** · **ทางลัดหน้าจอโฮม** · **dock ล่าง** · **แถบหัวแดชบอร์ด** · **โมดัลเต็มจอ**:

## บังคับ

1. Import จาก **`@/components/app-templates`** (หรือ `safe-area-tokens`) — **ห้าม** คัดลอก `env(safe-area-inset-*)` / `var(--mawell-safe-*)` กระจายในโมดูล
2. เลือกโทเค็นตามบทบาท:

| บทบาท | โทเค็น |
|-----|-----|
| หัวพอร์ทัล absolute ทับแบนเนอร์ | `appSafeAreaPortalHeaderClass` |
| หัว sticky สาธารณะ | `appSafeAreaStickyPublicHeaderClass` / `appSafeAreaStickyHeaderPadClass` |
| Hero ใต้หัว absolute | `appSafeAreaPortalHeroTopPadClass` |
| แถบหัวแดชบอร์ดเต็มขอบ | `appDashboardHeaderBarClass` (+ inner / icon button) |
| แถบม่วงแดชบอร์ด (legacy pad) | `appSafeAreaDashboardHeaderPadClass` — ใช้ในโทเค็นหัวแล้ว |
| Landing / หัวสาธารณะใหญ่ | `appSafeAreaLandingHeaderPadClass` |
| หน้าแก้ว | รวมใน `AppPublicCheckInGlassPage` / `appSafeAreaGlassPage*PadClass` |
| Dock / CTA ล่าง | `appSafeAreaBottomPadClass` · แถบคงที่ `appSafeAreaFixedBottomBarPadClass` (+ `AppMobileDockShell`) |
| โมดัลเต็มจอ | `appSafeAreaOverlayPadYClass` / `Compact` / `PadAll` · หัวขยาย `appSafeAreaOverlayExpandedHeaderPadClass` |

3. ต้องการ spacer แยกใน sticky header → `AppSafeAreaTopSpacer`
4. CSS vars ต้นทาง: `--mawell-safe-top/bottom` ใน `globals.css`

## ห้าม

- เขียน `pt-[env(safe-area-inset-top)]` ใหม่ในพอร์ทัล / ลิงก์เว็บ / หน้าทางลัด
- บวกช่องว่างล่างเกิน home indicator บน dock (ใช้ `appSafeAreaBottomPadClass` อย่างเดียว)

## อ้างอิง

- `src/components/app-templates/safe-area-tokens.ts`
- `AppSafeAreaTopSpacer.tsx` · `mobile-dock-tokens.ts`


================================================================================
### .cursor/rules/app-templates-slip-labeled-thumb.mdc
================================================================================

---
description: สลิป+ป้าย label แบบ ecommerce — บังคับ AppLabeledImageThumb ในรายการ/การ์ด/พรีวิวหลังอัปโหลด
alwaysApply: false
globs:
  - "**/components/app-templates/AppLabeledImageThumb.tsx"
  - "**/components/app-templates/AppSlipImageThumb.tsx"
  - "**/components/app-templates/AppPaymentMethodPanel.tsx"
  - "**/systems/**/*Finance*"
  - "**/systems/**/*Cost*"
  - "**/systems/**/*Sales*"
  - "**/systems/**/*History*"
  - "**/systems/**/*Orders*"
  - "**/systems/**/*Booking*"
  - "**/systems/**/*Payment*"
  - "**/systems/**/*Slip*"
  - "**/systems/**/*Purchases*"
  - "**/systems/ecommerce-store/**"
  - "**/systems/club-event/**"
---

# สลิป + ป้าย (เทมเพลตกลาง — แบบร้านออนไลน์)

**ต้นแบบ:** `EcommerceOrdersClient` / `EcommerceFinanceClient`  
**คอมโพเนนต์:** `AppLabeledImageThumb` จาก `@/components/app-templates` · `kind="slip"`  
**ห้าม** ใช้ `EcommerceLabeledImageThumb` ในโมดูลใหม่ (legacy re-export เท่านั้น)

## เมื่อไหร่บังคับ

| บริบท | ใช้ |
|--------|-----|
| รายการ / การ์ด / ประวัติ / การเงิน / จอง / คิว / คำขอ | **`AppLabeledImageThumb` `kind="slip"`** |
| พรีวิวหลังอัปโหลดในแผงชำระ / ฟอร์มแนบสลิป | **`AppLabeledImageThumb` `kind="slip"`** (หรือ `className="h-20 w-20"`) |
| Lightbox เต็มจอ | `AppImageLightbox` + `useAppImageLightbox` |

**`AppSlipImageThumb`:** สงวนกรณีพิเศษที่**ตั้งใจไม่มีป้าย**เท่านั้น — รายการ/การ์ด/พรีวิวสลิปมาตรฐาน**ห้าม**ใช้

## เลย์เอาต์ (บังคับ)

```tsx
<div className="flex min-w-0 items-start gap-3">
  <AppLabeledImageThumb
    src={slipUrl}
    kind="slip"
    alt={personOrRefName}
    onOpen={() => lb.open(slipUrl)}
  />
  <div className="min-w-0 flex-1 space-y-0.5">
    {/* ชื่อ · เบอร์ · ยอด · เมตา */}
  </div>
</div>
```

- ป้าย «สลิป» อยู่**มุมล่างบนรูป** (`absolute`) — **ห้าม** ข้อความ «สลิป» ใต้รูปหรือข้างชื่อ
- สลิปใช้ `objectFit` ค่าเริ่ม `contain`
- ขนาดค่าเริ่ม `h-14 w-14` · `sm:h-16 sm:w-16` · พรีวิวอัปโหลดใหญ่กว่าได้ `className="h-20 w-20"`
- มีทั้งสลิป+รูปสินค้าในแถวเดียว: `flex gap-1.5` ของ `AppLabeledImageThumb` คู่กัน (`slip` + `product`)

## ห้าม

- `<img>` / `AppImageThumb` เปล่าสำหรับสลิปในรายการ/การ์ด
- Hardcode badge `bg-emerald-600` นอก `AppLabeledImageThumb`
- ป้าย «สลิป» เป็นข้อความใต้ thumb ในคอลัมน์แคบ

## เช็กลิสต์ migrate

- [ ] Import `AppLabeledImageThumb` จาก `@/components/app-templates`
- [ ] แทนที่ `AppImageThumb` / `AppSlipImageThumb` / raw `<img>` ที่แสดงสลิปในรายการ
- [ ] เลย์เอาต์ `flex … gap-3` · ชื่ออยู่ข้างรูป
- [ ] มี `AppImageLightbox` คู่กัน
- [ ] ลบข้อความ «สลิป» ซ้ำใต้รูป

คู่กับ: `app-templates-media.mdc` · `app-templates-image-upload.mdc` · `dashboard-finance-detail-tabs.mdc`


================================================================================
### .cursor/rules/app-templates-slip-receipt.mdc
================================================================================

---
description: Template กลางใบเสร็จ/สลิป — ใช้ slip-print + ขนาดกระดาษจากโปรไฟล์ทุกโมดูล
globs: "**/slip-print.ts,**/AppSlipPaperSizeToolbar.tsx,**/AppSlipPaperSizeSettingsField.tsx,**/useAppSlipPaperSize.ts,**/*Settings*,**/*receipt*,**/*slip*print*,**/pos-*-print.ts,**/*order-ticket-print*"
alwaysApply: false
---

# ใบเสร็จ / สลิปพิมพ์ — template กลาง

## บังคับ

1. **ใบเสร็จลูกค้า (มีราคา · หัวร้าน · ที่อยู่ · เลขภาษี · เบอร์)**  
   → `printAppReceiptSlip` / `buildAppReceiptSlipInnerHtml` จาก `@/components/app-templates`  
   **ห้าม** คัดลอก HTML ใบเสร็จในโมดูลย่อย

2. **สลิปครัว / คิว (โต๊ะเด่น · ไม่เน้นราคา)**  
   → `printAppOrderTicketSlip` (`variant: "kitchen"`)

3. **ขนาดกระดาษ**  
   - **แหล่งความจริงต่อโมดูล:** `slipPaperSize` บนโปรไฟล์ร้านของโมดูล (หรือ `defaultPaperSize` ของหอพัก)  
   - **ตั้งค่า:** `AppSlipPaperSizeSettingsField` ในหน้าตั้งค่าโมดูล — บันทึกร่วมฟอร์มร้าน  
   - พิมพ์: ส่ง `paper` จากตั้งค่าโมดูล — **ห้าม** hardcode `SLIP_80`  
   - ค่า fallback: `DEFAULT_APP_SLIP_PAPER_SIZE` (`SLIP_58`)

4. **เลย์เอาต์ใบเสร็จ (บังคับ)**  
   - **58 mm** → กึ่งกลาง (`buildAppReceiptSlipCenteredHtml`)  
   - **80 mm / A4** → ชิดซ้ายแบบใบเสร็จทางการ (`buildAppReceiptSlipFormalLeftHtml`)  
   - เรียก `printAppReceiptSlip` / `buildAppReceiptSlipInnerHtml` จาก `@/components/app-templates` เท่านั้น

5. ปุ่มเลือกขนาดชั่วคราวตอนพิมพ์: `AppSlipPaperSizeToolbar`  
   - `AppModuleShopSettingsClient` มีช่องขนาดสลิปในตัว (`showSlipPaperSizeSettings`)

## แพทเทิร์น

```ts
import { printAppReceiptSlip, useAppSlipPaperSize } from "@/components/app-templates";

const { paper } = useAppSlipPaperSize(); // หรือจาก bootstrap พนักงาน

printAppReceiptSlip({
  shopLabel, logoUrl, address, taxId, contactPhone,
  orderRef, printedAt, items: [{ name, qty, unitPrice }],
  grandTotal, paymentMethodLabel,
  paper, // จากโปรไฟล์
});
```

## ชื่อเก่า

- `printAppShortReceiptSlip` / `buildAppShortReceiptSlipInnerHtml` = alias ของ receipt กลาง (ยังใช้ได้)
---


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

## ขนาดกราฟ / ความกว้างแท่ง (บังคับเมื่ออยู่หน้าเดียวกัน)

เมื่อมีหลายกราฟแท่งบน**หน้าการเงิน / ยอดขาย** เดียวกัน:

1. ใช้โหมด **`compact`** ชุดเดียวกันทั้งหน้า — **ห้าม** ผสม `compact` กับ non-compact ในแถวเดียวกัน
2. ความสูงโซนแท่ง `compact` ต้องเท่ากันระหว่าง `AppRevenueCostColumnChart` กับ `AppColumnBarSparkChart` (`h-32` / `sm:h-40` + min-height ตาม template)
3. ความกว้างแท่ง `compact` ของ `AppColumnBarSparkChart` ใช้ขนาดเดียว (`max-w-[11px] sm:max-w-[12px]`) — **อย่า** สลับ `pairedLayout` / `evenDistribution` เพียงเพื่อให้แท่งหนา-บางต่างกันในหน้าเดียวกัน
4. ในหน้าเดียวกัน: ถ้าไม่จำเป็นต้องจัดคู่ dual chart — ใช้ `compact` ล้วน (ไม่ใส่ `pairedLayout`) เพื่อให้เส้นแท่งเท่ากันทุกรูป

อ้างอิงหน้า: building-pos `BuildingPosSalesAnalytics` · drink-pos `DrinkPosSalesClient`

## ขยาย

ถ้าต้องการพฤติกรรมใหม่ (เช่น stacked bar) — **เพิ่มที่ `src/components/app-templates/`** แล้ว export ใน `index.ts` อย่าคัดลอก CSS ไปโมดูลเดียว


================================================================================
### .cursor/rules/app-templates-youtube.mdc
================================================================================

---
description: YouTube ในแอป — ห้ามคัดลอกลิงก์ · ไอคอนล้วน · เต็มจอแบบ LMS (AppSecureYoutubePlayer / AppYoutubeLightbox)
globs:
  - "src/components/app-templates/**/*Youtube*"
  - "src/systems/**/**/*Youtube*"
  - "src/systems/**/**/*youtube*"
  - "src/lib/youtube-url.ts"
alwaysApply: false
---

# YouTube ในแอป — แม่แบบ LMS

ใช้เมื่อเล่นวิดีโอ YouTube ในแดชบอร์ด · พอร์ทัล · ทดลองโมดูล · ห้องเรียน

**คู่กับ:** `app-templates-media.mdc` · `dashboard-module-media-gallery-slideshow.mdc`

---

## เลือกคอมโพเนนต์

| กรณี | ใช้ |
|------|-----|
| เล่น **ในหน้า** (ห้องเรียน · บทเรียน · ฝังยาว) | **`AppSecureYoutubePlayer`** จาก `@/components/app-templates` |
| เล่นจาก **การ์ด thumb → ป๊อปอัป** | **`AppYoutubeLightbox`** + **`useAppYoutubeLightbox`** (ภายใน = `AppSecureYoutubePlayer` — ห้าม iframe ดิบ) |
| แปลง URL → embed ปลอดภัย | **`secureYoutubeEmbedUrl`** / **`normalizeSecureYoutubeEmbedUrl`** ใน `@/lib/youtube-url` |

`LmsSecureYoutubePlayer` = re-export ของ `AppSecureYoutubePlayer` (อย่าคัดลอกไฟล์ LMS)

---

## บังคับ — UX แบบ LMS

1. **ห้าม** โชว์ลิงก์ `youtube.com/watch` / ปุ่ม «เปิดบน YouTube» / ปุ่มคัดลอกลิงก์ บน UI ผู้เรียน/ลูกค้า  
2. **ห้าม** สร้าง iframe YouTube ดิบ + โมดัลเองเมื่อเป้าหมายคือเล่นคลิปในแอป — รวมถึง lightbox ต้องห่อด้วย `AppSecureYoutubePlayer`  
3. ปุ่มควบคุมผู้เล่น / lightbox: **ไอคอนล้วน** (`aria-label` + `title`) — ไม่ใส่ข้อความ «เต็มจอ» / «ย่อ» ข้างไอคอน  
4. **เต็มจอ:**  
   - **iOS / iPad (และ Mac touch):** ขยายด้วย **CSS** (`fixed` / `100dvh`) — **ห้าม** พึ่ง `requestFullscreen` บน wrapper รอบ iframe เป็นหลัก  
   - เดสก์ท็อปอื่น: native fullscreen ได้ ถ้าใช้ได้ ไม่เช่นนั้น fallback CSS  
   - โหมดเต็มจอมือถือ: **cover เต็ม visualViewport** ซ้าย–ขวา–บน–ล่าง (ครอปขอบถ้าจอไม่ใช่ 16:9) · portal ไป `document.body`  
5. Embed ใช้พารามิเตอร์ secure (`controls:0`, `modestbranding`, `playsinline`, `rel:0`, `fs:0`, …) + **ชั้นทับ iframe** กันแตะโลโก้/เปิดแอป YouTube  
6. แปลง URL → embed: **`secureYoutubeEmbedUrl`** / **`normalizeSecureYoutubeEmbedUrl`** ใน `@/lib/youtube-url`

---

## แพทเทิร์น

```tsx
import {
  AppSecureYoutubePlayer,
  AppYoutubeLightbox,
  useAppYoutubeLightbox,
} from "@/components/app-templates";

// inline
<AppSecureYoutubePlayer youtubeUrl={url} title={title} onProgress={…} />

// grid → popup
const yt = useAppYoutubeLightbox();
yt.open(url, title);
<AppYoutubeLightbox youtubeUrl={yt.youtubeUrl} title={yt.title} onClose={yt.close} />
```

---

## อนุญาตลิงก์ watch

- **ฟอร์มแอดมิน** วาง URL ตอนบันทึก — ได้  
- **เก็บ/แปลงเป็น embed ใน DB** — ได้  
- **แสดง/เปิดภายนอกให้ผู้ใช้ปลายทางคัดลอก** บนเครื่องเล่น — **ห้าม**

---

## ห้าม

- คัดลอก `LmsSecureYoutubePlayer` เป็นไฟล์ใหม่ในโมดูลอื่น  
- ปุ่ม «YouTube» ใน `AppYoutubeLightbox`  
- `window.open(watchUrl)` จากกริดวิดีโอโปรโมทเมื่อมี video id แล้ว  
- ข้อความเต็มจอบนปุ่ม (ใช้ไอคอน Maximize/Minimize อย่างเดียว)

## เช็กลิสต์

- [ ] เล่นในหน้า → `AppSecureYoutubePlayer`
- [ ] ป๊อปอัป → `AppYoutubeLightbox` (ไม่มีลิงก์ watch)
- [ ] ไอคอนเต็มจอ + CSS FS บน iOS
- [ ] ไม่มีปุ่มคัดลอก / เปิดบน YouTube บน UI ผู้ใช้ปลายทาง


================================================================================
### .cursor/rules/app-usage-guide-modal.mdc
================================================================================

---
description: โมดัลคู่มือการใช้งาน — กึ่งกลางจอบนมือถือ (FormModal mobileCentered)
globs: "**/app-templates/AppUsageGuideModal.tsx,**/*Shell.tsx,**/*Dashboard.tsx"
alwaysApply: false
---

# คู่มือการใช้งาน (`AppUsageGuideModal`)

ปุ่ม **คู่มือ** / **คู่มือการใช้งาน** ในแดชบอร์ดโมดูล → เปิด **`AppUsageGuideModal`** จาก `@/components/app-templates` เท่านั้น

## บังคับ

1. **ห้าม** เขียน overlay เอง (`fixed inset-0` + `items-end` บนมือถือ) — component กลางใช้ **`FormModal`** จาก `@/components/ui/FormModal`
2. **`mobileCentered`** — บนมือถือแผงอยู่ **กึ่งกลางจอ** (`items-center` + `p-3`) · **ไม่** ชิดขอบล่างแบบ bottom sheet (`items-end`)
3. **`size="lg"`** (หรือ `xl` ถ้าเนื้อหายาวมาก) — ความกว้างสูงสุดเทียบ `max-w-2xl`
4. **`rounded-[2rem]`** บนมือถือเมื่อ `mobileCentered` (มาจาก FormModal อัตโนมัติ)
5. ปิดด้วย ESC / คลิกพื้นหลัง / ปุ่ม X หัวโมดัล / ปุ่ม **ปิด** ใน footer
6. โครงเนื้อหา: `title` + `subtitle` (optional → `description` ของ FormModal) + `sections[]` (`title` + `content` ReactNode)
7. **`AppUsageGuideModal` แนบท้ายอัตโนมัติ** (ค่าเริ่มเปิด):
   - มือถือ · ไอแพดแนวตั้ง · แถบหัว (dock / ยุบหัว / โทเคน)
   - **สร้างแอปบนหน้าจอโฮม (iOS และ Android)** — จาก `app-usage-guide-shared.tsx`
   - ปิดได้ด้วย `includeChromeGuide={false}` / `includeHomeScreenGuide={false}` ถ้าคู่มือกำหนดเองแล้ว
8. คู่มือเฉพาะโมดูล (เช่น `BarberUsageGuideModal`) ที่ไม่ใช้ `AppUsageGuideModal` — **ต้อง** ใส่ `APP_USAGE_GUIDE_HOME_SCREEN_SECTION` (+ chrome) เอง

## แพทเทิร์น

```tsx
import { AppUsageGuideModal } from "@/components/app-templates";

const [usageGuideOpen, setUsageGuideOpen] = useState(false);

<AppUsageGuideModal
  open={usageGuideOpen}
  onClose={() => setUsageGuideOpen(false)}
  title="คู่มือการใช้งาน — ชื่อโมดูล"
  subtitle="คำอธิบายสั้นหนึ่งบรรทัด (ถ้ามี)"
  sections={[
    { title: "เริ่มต้น", content: <>…</> },
  ]}
/>
```

## อ้างอิง

- Implementation: `src/components/app-templates/AppUsageGuideModal.tsx`
- ส่วนท้ายร่วม: `src/components/app-templates/app-usage-guide-shared.tsx`
- โมดัลฟอร์มทั่วไป: `.cursor/rules/dashboard-add-form-modal.mdc`
- โมดัลกึ่งกลางมือถือ (QR / ซักผ้า): `.cursor/rules/shop-qr-hub-popup-pattern.mdc` (`mobileCentered`)

## ข้อยกเว้น

- โมดูลที่มีคู่มือเฉพาะมาก (เช่น บาร์เบอร์ `BarberUsageGuideModal`) อาจใช้ portal ของโมดูล — ถ้า refactor ให้ยึด **`mobileCentered`** / กึ่งกลางจอบนมือถือเช่นกัน · และต้องมีขั้นตอนติดตั้งแอปหน้าจอโฮม


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

## ปุ่ม + hover (บังคับ)

ทุก `<button>` / `<Link>` ที่กดได้ในโมดูลเช็คอิน — **ห้าม** ทิ้งสไตล์นิ่ง ๆ ไม่มี feedback เมื่อเมาส์ชี้ (เดสก์ท็อป):

1. **โทเค็นพื้นฐาน** — ใช้จาก `attendance-ui.ts` เท่านั้น ห้ามคัดลอกสตริง hover ซ้ำในหน้า:
   - `attendanceInteractiveHoverClass` — ปุ่มทั่วไป: `hover:-translate-y-px` · `hover:shadow-md` · `active:scale-[0.97]`
   - `attendanceChipButtonHoverClass` — chip/pill ที่เป็น `<button>` (กรอง · สลับสถานะ)
   - `attendanceTextLinkBtnClass` — ลิงก์ข้อความกดได้ (เช่น ล้างกรอง)

2. **ปุ่มมาตรฐานโมดูล** — ต่อท้ายโทเค็นเดิม (มี hover ในตัวแล้ว):
   - `attendancePrimaryBtnClass` · `attendanceSecondaryBtnClass` · `attendanceOutlineBtnClass` · `attendanceLinkActionBtnClass`
   - `attendanceFilterChipClass(active)` — ชip กรองสถานะ
   - `attendanceRosterMetaBtn*` — ปุ่มย่อยในการ์ดรายชื่อ (อัปโหลด · ถ่าย · ลบรูป)
   - `attendanceRowEditIconButtonClass` · `attendanceRowRemoveIconButtonClass` — ไอคอนแถว

3. **ชip สลับสถานะในการ์ด** — `<span>` แสดงอย่างเดียวใช้ `attendanceZoneChipFaceClass` / `FpClass` ฯลฯ · **`<button>` สลับ** ใช้ `attendanceZoneChipActiveBtnClass` / `attendanceZoneChipInactiveBtnClass` (อย่าใช้คลาส span กับปุ่ม)

4. **ปุ่มจาก template กลาง** — เช่น `appTemplateOutlineButtonClass` · `app-btn-primary` ต้อง **ซ้อน** `attendanceInteractiveHoverClass` (หรือใช้โทเค็นโมดูลแทน) เพื่อให้ lift/active สอดคล้องกัน

5. **`disabled`** — โทเค็นพื้นฐานปิด pointer + opacity แล้ว — อย่า override ให้ hover ยังทำงาน

## อ้างอิงโค้ด

- แพทเทิร์นการ์ดรายชื่อพนักงาน: `src/systems/attendance/components/AttendanceRosterClient.tsx`


================================================================================
### .cursor/rules/barber-module-dashboard-template.mdc
================================================================================

---
description: เทมเพลตแดชบอร์ดโมดูลร้านตัดผม — gutter เต็มความกว้าง มุมมน 1.5/2.0 dock ยุบหัว ชำระเงินเหมือนโรงแรม
globs:
  - "**/systems/barber/**"
  - "**/app/**/dashboard/barber/**"
---

# ร้านตัดผม (Barber) — เทมเพลตแดชบอร์ด & UI

**หลักการโปรเจกต์:** `dashboard-ux-car-wash-baseline.mdc` · **อ้างอิงโรงแรม:** `hotel-resort-module-dashboard-template.mdc`

**จองคิว + ตารางช่าง (ย้ายไปโมดูลอื่น):** `module-booking-staff-schedule-template.mdc` — แพ็กก่อนสล็อต · แดชบอร์ด=พอร์ทัล · ห้ามจองอดีต · วันที่รับบริการ+ชั่วโมง

## 1) ระยะขอบ · ความกว้าง

| ชั้น | ค่า |
|------|-----|
| `DashboardPagesShell` | `WIDE_MODULE` — `size="full"` + `max-w-none !px-3 sm:!px-4 lg:!px-6` |
| `DashboardShell` main | `px-3 sm:px-4` (ไม่ใช้ compact) |
| `BarberModuleShell` | ไม่ซ้อน `PageContainer` ซ้ำ — chrome เท่านั้น |
| เนื้อหา | หุ้มด้วย `barberModuleContentShellClass` (ยกเว้น staff / finance / qr ที่ plain) |

## 2) ความโค้งมน (§9)

| ระดับ | ค่า |
|-------|-----|
| เปลือกหัว / section | `rounded-[2rem]` (`barberGlassShellClass` · `barberSectionRadiusClass`) |
| การ์ดย่อย / hub / dock pill | `rounded-[1.5rem]` |
| ปุ่ม / input | `rounded-[1rem]` |

## 3) ยุบหัว + เมนู

- `barber-module-nav.tsx` — `BARBER_NAV_ITEMS` · collapse key/event
- ซ่อนการ์ดหัวทั้งใบเมื่อยุบ → `BarberHeaderBarNav` ใน `DashboardShell`
- มือถือ: `AppMobileDockUnifiedBar` + `barberDockPillClass`
- แท็บ: แดชบอร์ด · การเงิน · แพ็กเกจ · **ลิงก์** · ตั้งค่า
- **หน้าตั้งค่าร้าน** — แถบ 4 หมวด (พื้นฐาน · การเงิน · เว็ปลิงค์ลูกค้า · เวลาเปิดร้าน): **`dashboard-module-shop-settings-tabs.mdc`** · `BarberShopSettingsClient.tsx`

## 4) ชำระเงิน

- `lib/payment-method.ts` + `BarberPaymentPanel` — CASH / PROMPTPAY / TRANSFER / CREDIT_CARD
- QR: `POST /api/barber/promptpay-qr` · สลิป: `/api/barber/cash-receipt/upload` (ทางเลือก)
- ใช้ในเช็คอินเงินสด + ขายแพ็กเกจ

## 5) ปุ่ม · ชิป · ขนาดแตะ

- ปุ่มหลักใช้โทนม่วงแบรนด์ (`app-btn-primary` หรือ token บาร์เบอร์) — ข้อความหนา `font-semibold`–`font-bold`
- ปุ่มรอง/ปุ่มนุ่ม ใช้พื้นขาวหรือม่วงอ่อน (`app-btn-soft`) + ขอบโปร่ง ไม่แย่งจุดเด่นจาก primary
- ปุ่มเสี่ยง/ลบ ใช้โทน `rose` ชัดเจน ห้ามใช้สีเดียวกับปุ่มหลัก
- ปุ่มไอคอนล้วนต้องมี `aria-label` และขนาดแตะอย่างน้อย `min-h-[40px] min-w-[40px]`
- ปุ่มในโมดัล/ฟอร์มหลักใช้ความสูง `min-h-[48px]` เป็นฐาน
- กลุ่มชิป/แท็บ/ตัวเลือกพนักงาน ใช้ `rounded-2xl` หรือ `rounded-xl` และมี 2 state ชัด:
  - active = ม่วงทึบ/ม่วงอ่อน + ring
  - inactive = ขาว/ม่วงอ่อนจาง + border โปร่ง
- ชิปวันรับบริการ: เปิด = สี primary, ปิด = ตัวอักษร muted + พื้นจาง

## 6) การ์ด · แถวรายการ · โมดัล

- การ์ดหลักของ section ใช้พื้น glass/white โปร่ง ขอบอ่อน และเงานุ่ม ไม่ใช้พื้นทึบแข็งทั้งหน้า
- แถวรายการในลิสต์ (`barberListRowCardClass`) ต้องอ่านง่ายบนมือถือ: `flex-wrap` ได้, ช่องไฟ `gap-2` ถึง `gap-3`, action toolbar ชิดขวา
- การ์ดเมนูบริการ/แพ็กเกจต้อง:
  - รูปเป็นสี่เหลี่ยมจัตุรัส `aspect-square`
  - เนื้อหาด้านล่างสั้น กระชับ (`line-clamp-2`)
  - state ที่ถูกเลือกเห็นชัดด้วย `ring` + พื้น primary tint
- การ์ดเลือกช่าง/พนักงานเป็น pill card ขนาดกดง่าย มี avatar และชื่อในแถวเดียวกัน
- โมดัลใช้หัวชัด (`title` + `subtitle`) ปุ่มปิดมุมขวาบน และ body เว้นระยะ `px-5 py-5` แบบเดียวกับบาร์เบอร์
- รูปตัวอย่าง/พรีวิวในโมดัลใช้กรอบโค้งเดียวกับการ์ด (`barberCardSurfaceRadiusClass`) ไม่ใช้กรอบคนละภาษา

## 7) สี · ตัวอักษร · feedback state

- โทนหลักของบาร์เบอร์ = ม่วงคราม/indigo (`#4d47b6`, `#5b61ff`, `#1e1b4b`) + พื้นม่วงอ่อน/ขาวอมม่วง
- ข้อความหลักเข้มมาก (`#1e1b4b` / `#2e2a58`), ข้อความรอง muted (`#66638c`, `#7a7699`, `#8b87ad`)
- เส้นขอบพื้นฐานใช้โทนอ่อนเช่น `#ecebff`, `border-white/70`, `border-[#e8e6f4]`
- สถานะเตือน availability/จองไม่ได้ ใช้กลุ่ม `amber` (ไม่ใช้แดงถ้าไม่ใช่ error จริง)
- error form/API ใช้ `rose`/`red` แยกจาก warning ให้ชัด
- disabled state ต้องลด opacity และคง contrast พออ่านได้

## 8) ฟอร์ม · การเลือกข้อมูล

- ฟอร์มเวลาใช้ `AppTime24Input` เท่านั้น เมื่อเกี่ยวกับเวลาไทยหรือเวลาเปิด–ปิด/รับคิว
- ฟอร์มค้นหาเบอร์/สมาชิกใช้ input สูง `h-12` หรือ `min-h-[48px]` เพื่อให้ตรงกับปุ่ม action ข้างกัน
- ถ้ามี dependency ของการกรอก ให้บังคับลำดับใน UI ชัดเจน เช่น:
  - เลือกบริการก่อนเวลา
  - เลือกช่างก่อนโหลดสล็อต
  - ถ้าวันนั้นไม่รับบริการ ให้ขึ้น notice แทนกริดสล็อต
- ข้อความ helper ให้สั้นและ actionable เช่น “เลือกบริการก่อนจึงเลือกช่วงเวลาได้”

## 9) คำอธิบาย UI

- `AppSectionHeader`: **ห้าม** `description` — ใส่คู่มือแทน

## ไฟล์หลัก

| บทบาท | ไฟล์ |
|--------|------|
| Nav / collapse | `barber-module-nav.tsx` · `BarberHeaderBarNav.tsx` |
| Shell | `BarberLayoutChrome.tsx` · `BarberModuleShell.tsx` |
| Dock / desktop nav | `BarberModuleHeader.tsx` |
| Tokens | `barber-ui-tokens.ts` |
| ชำระ | `BarberPaymentPanel.tsx` · `lib/payment-method.ts` |


================================================================================
### .cursor/rules/building-pos-dashboard-template.mdc
================================================================================

---
description: เทมเพลตแดชบอร์ด POS ร้านอาหาร (building-pos) — เมนู · ความมน · ออร์เดอร์ · คิว SSE
globs:
  - "**/dashboard/building-pos/**"
  - "**/systems/building-pos/**"
  - "**/api/building-pos/**"
  - "**/app/building-pos/**"
---

# Building POS — เทมเพลตแดชบอร์ด

**หลักการ UX ระดับโปรเจกต์:** `dashboard-ux-car-wash-baseline.mdc` — เมนูหลักมือถือล่าง · หัว glass · ไอคอน/สี `#5b61ff`

**คู่ขนาน POS:** `drink-pos-module-dashboard-template.mdc` (ยุบหัว · gutter · dock · ออร์เดอร์ · คิว SSE) · **ลิงก์ลูกค้า** `pos-customer-order-link-ux.mdc` · **สะสมคะแนน** `pos-loyalty-points.mdc`

---

## Layout ชั้นนอก (`layout.tsx`)

- **`requireBuildingPosSection()`** + `BuildingPosShell` — **ห้าม** `shopQrTemplatePageBgClass` / พื้นเทาเต็มแผงในเลย์เอาต์นี้
- ความกว้าง: `DashboardPagesShell` — `size="full"` + **`max-w-none !px-3 sm:!px-4 lg:!px-6`** — ดู `dashboard-page-width.mdc`

---

## เมนูหลัก (ลำดับบังคับ)

ลำดับใน `BUILDING_POS_MAIN_TABS` (`building-pos-nav.ts`) + dock + header bar:

1. **แดชบอร์ด** (ซ้ายสุด) → `/dashboard/building-pos`
2. **ออร์เดอร์** → `/dashboard/building-pos/order`
3. **คิวออเดอร์** → `/dashboard/building-pos/orders`
4. **การเงิน** → `?tab=finance`
5. **เมนู** → `?tab=menu`
6. **QR** → `?tab=qr`
7. **ตั้งค่า** → `/dashboard/building-pos/settings`

---

## ความมนการ์ด (บังคับ — อย่าทำให้มนเกิน)

| ระดับ | คลาส | ใช้กับ |
|--------|------|--------|
| เปลือกโมดูล / dock pill / hub QR นอก | `rounded-[2.5rem]` (มือถือบางจุด `rounded-2xl`) | `BuildingPosShell` · dock · `buildingPosQrHubOuterClass` |
| **การ์ดเนื้อหาทุกเมนู** (แดชบอร์ด · ออร์เดอร์ · คิว · การเงิน · เมนู · QR แผงใน · ตั้งค่าแผง) | **`rounded-[1.25rem]`** | สถิติ · โต๊ะ · คอลัมน์คิว · list · content panel · แผงออร์เดอร์ซ้าย/ขวา · ประวัติขาย · ต้นทุน |
| ปุ่ม / chip / input | `rounded-xl` ~ `rounded-2xl` / `rounded-full` (chip) | ตามโทเค็นที่มี |

**ห้าม** ใช้ `rounded-[2rem]` กับการ์ดย่อย/สถิติ/โต๊ะในโมดูลนี้

**โทเค็น:** `buildingPosInnerCardRadiusClass` · `buildingPosStatCard*Class` · `buildingPosContentPanelClass` ใน `components/building-pos-ui-tokens.ts`

---

## หน้าแดชบอร์ด

- การ์ดสถิติ: `grid-cols-2` มือถือ · `sm:grid-cols-3` (การ์ดคี่ใบสุดท้าย `col-span-2 sm:col-span-1`)
- การ์ดโต๊ะค้าง: **`lg:grid-cols-3`** · ความมน `rounded-[1.25rem]`
- ปุ่มออเดอร์บนหัวแผงโต๊ะ → ลิงก์ `/order` (ไม่เปิดโมดัลสั่ง)
- ฟัง SSE `/api/building-pos/session/orders/board/stream` แล้ว `loadAll()` เมื่อคิวเปลี่ยน (โต๊ะค้างอัปเดตร่วมกับคิว)

---

## หน้าออร์เดอร์ (`/order`) — คู่ขนาน drink-pos

- **เดสก์ท็อป (`lg+`):** กริด `lg:grid-cols-[minmax(280px,380px)_minmax(0,1fr)]`
  - **ซ้าย:** ช่องทางสั่ง · โต๊ะ/ชื่อ · รายการที่เลือก + ส่งออเดอร์
  - **ขวา:** ชิปหมวด + กริดเมนู (`buildingPosProductGridClass`)
- **มือถือ — กริดเมนูบังคับ 3 คอลัมน์:** คลาส `bp-order-menu-grid` ใน `globals.css` (`grid-template-columns: repeat(3, …) !important`) · ใช้ใน `BuildingPosOrderClient` — ไม่พึ่ง utility Tailwind อย่างเดียว
- **เลื่อนอิสระแยกคอลัมน์เมื่อเกินขอบล่าง** (แดชบอร์ด `/order` — บังคับ · แบบ drink-pos):
  - **เชนความสูง (เดสก์ท็อป `lg+` เท่านั้น):** `DashboardShell` → `PageContainer` → `BuildingPosShell` → `BuildingPosOrderClient` = `h/max-h` + `overflow-hidden` ใต้หัวโมดูล
  - กริด: `lg:grid-rows-1` + `lg:overflow-hidden` + `lg:h-full`
  - **ซ้าย** `lg:h-full` + `overflow-y-auto` ทั้งคอลัมน์ (meta + รายการ + ส่งออเดอร์) — ขอบล่างคอลัมน์ชิดกรอบ ไม่หายใต้จอ
  - **ขวา** `lg:h-full` + `overflow-hidden` · หมวด `shrink-0` · กริดเมนู `lg:overflow-y-auto`
  - **ห้าม** `max-h-[calc(100dvh-…)]` บนคอลัมน์โดยไม่มีเชนความสูง — คอลัมน์อยู่ใต้หัวโมดูลแล้วสูงเกินจอ ทำให้ส่วนล่าง «หาย»
  - **ห้าม** ล็อก `h-[100dvh]` ทั้ง `DashboardShell` ทุกหน้า — เฉพาะ path `/order` + `lg:`
  - โค้ด: `BuildingPosOrderClient.tsx` · `BuildingPosShell.tsx` · `DashboardShell` (`onPosOrderPage`)
- **มือถือแดชบอร์ดออเดอร์:** ยังไม่ปรับเลย์เอาต์สกอลล์ (รอกำหนด) — เมนูเต็มจอ · สรุปในสล็อต dock · ยืนยันใน `FormModal`
- **ห้าม** ใช้เลย์เอาต์หน้าลูกค้าเต็มจอ (`BuildingPosCustomerOrderClient` แบบ portal) เป็นหน้าแดชบอร์ดออร์เดอร์
- คู่กฎ drink-pos: `.cursor/rules/drink-pos-module-dashboard-template.mdc` § เดสก์ท็อปออเดอร์

---

## หน้าคิวออเดอร์ + แผนกครัว/จัดส่ง (บังคับ)

### UI

- **ห้าม** ส่วนหัวชื่อร้าน / หัวข้อ «คิวออเดอร์» / ปุ่มรีเฟรชแยกบนหัวกระดาน — เหลือเฉพาะคอลัมน์สถานะ
- คอมโพเนนต์เดียว: `BuildingPosStationBoardClient`
  - แดชบอร์ด: `mode="dashboard"` → `/dashboard/building-pos/orders`
  - ครัว: `mode="station"` `role="kitchen"` → `/building-pos/kitchen/[ownerId]`
  - จัดส่ง: `mode="station"` `role="serve"` → `/building-pos/serve/[ownerId]`
- คอลัมน์: รับออเดอร์ (`NEW`) · กำลังทำ (`PREPARING`) · จัดส่ง (`SERVED`) — ความมนคอลัมน์ `rounded-[1.25rem]`

### SSE realtime (แบบ drink-pos — ผู้เกี่ยวข้องทั้งหมด)

ไฟล์กลาง:

| ไฟล์ | บทบาท |
|------|--------|
| `lib/order-board-bus.ts` | pub/sub ในโปรเซสตาม `ownerUserId` |
| `lib/order-board-sse.ts` | `createBuildingPosOrderBoardSseResponse` · `notifyBuildingPosOrderBoard` |

สตรีม:

| ผู้ฟัง | URL |
|--------|-----|
| แดชบอร์ดคิว + โต๊ะค้าง (session) | `GET /api/building-pos/session/orders/board/stream` |
| ครัว / จัดส่ง (สาธารณะ) | `GET /api/building-pos/public/station/orders/stream?ownerId=…` |

พฤติกรรม client (`BuildingPosStationBoardClient`):

- เปิด `EventSource` → `onmessage` แล้วโหลดคิวใหม่
- สำรอง: SSE หลุด → โพลทุก 3 วินาที · SSE ติด → โพลเบาทุก 20 วินาที

**บังคับเรียก `notifyBuildingPosOrderBoard(ownerId)` หลัง** สร้าง / เปลี่ยนสถานะ / ลบออเดอร์ ใน:

- `session/orders` (POST · PATCH · DELETE)
- `public/orders` (POST — ลูกค้า QR / พนักงานสั่งผ่าน public)
- `public/station/orders` (PATCH)
- `staff/orders` (PATCH)
- `session/seed-demo` (หลังใส่ข้อมูลตัวอย่าง)

**ห้าม** พึ่งพาแค่ polling ช้าบนหน้าคิวเมื่อมี SSE ของโมดูลอยู่แล้ว

---

## Hub อื่น

- **การเงิน (ต้นแบบข้ามโมดูล):** **`dashboard-finance-module-template.mdc`** — สรุปบนสุด (รายรับ emerald · รายจ่าย rose) · กรองชิป pill เล็กไม่เต็มจอ · กราฟคนละปุ่มซ่อน · แท็บประวัติ/รายจ่าย · สลิปเฉพาะเมื่อมี · **ประวัติ/รายรับทุกแถวแก้ไข+ลบ** · ลบยืนยันด้วย `useAppNoticePopup` · ฟอร์มรายจ่าย 5 ช่อง
- กฎย่อย: **`dashboard-finance-page-layout.mdc`** · **`dashboard-finance-filter-charts-toggle.mdc`** · **`dashboard-finance-detail-tabs.mdc`** · **`dashboard-expense-cost-categories.mdc`**
- **กราฟ (แนวตั้ง ตาม `app-templates-spark-charts.mdc`):** สถิติ 3 การ์ด → `AppRevenueCostColumnChart` → ยอดขาย `AppColumnBarSparkChart` → เปรียบเทียบหมวด/โต๊ะเป็น **แท่งแนวตั้ง** · ย่อ/ขยายได้ · **`lg+` 2 คอลัมน์** · `compact` ล้วน · CTA รายจ่ายอยู่ที่แท็บรายจ่ายเท่านั้น (ไม่ใส่แถว «สรุปช่วงที่กรอง» / «+ รายจ่าย» เหนือกราฟ)
- **รายจ่าย:** แท็บใน `BuildingPosSalesHistoryPanel` → `BuildingPosCostsPanel` (embedded · **ต้นแบบฟอร์ม**) — แก้ไข/ลบ + `notice.confirm`
- URL เก่า `?fin=costs` / `tab=ingredients|purchases` → เปิดแท็บรายจ่ายในหน้าการเงินเดียวกัน
- **แท็บย่อย hub:** `BuildingPosHubSubTabs.tsx` — **QR เท่านั้น** · เมนู/การเงินไม่มี hub sub-tab
- **หมวดหมู่เมนู:** ปุ่ม «หมวดหมู่» → popup + ชิปกรอง — **`dashboard-menu-categories-popup.mdc`**

---

## ยุบ/ขยายหัวโมดูล (แบบ drink-pos)

สถานะ: `localStorage` + `CustomEvent` (`BUILDING_POS_HEADER_COLLAPSE_*`)

| สถานะ | มือถือ | เดสก์ท็อป (`lg+`) |
|-------|--------|-------------------|
| **หัวเปิด** | การ์ดหัว · คู่มือ · ปุ่มซ่อน · dock | การ์ดหัว + แท็บกริด |
| **หัวยุบ** | โทเคน + ปุ่มขยายใน header ม่วง | `BuildingPosHeaderBarNav` + ปุ่มขยาย |

จุดต่อ `DashboardShell.tsx`: `showBuildingPosHeaderBar`

มือถือ: `BuildingPosMobileBottomProvider` ห่อ shell — dock รวมสล็อตร่างบิล

## `FormModal`

- ทุกโมดัลใส่ **`mobileCentered`**

## Shell

- **`BuildingPosShell`:** การ์ด glass · `hidden` เมื่อยุบหัว
- **`BuildingPosUnifiedMenuBar`:** `embedded` · `hidden lg:block`
- **ห้าม** ซ้อนการ์ด glass รอบเมนูใน client หลัก
- **ห้าม** ย่อหน้ายาวใต้ `h1` ของ shell (ใช้คู่มือ)

## โทเค็น UI

- `components/building-pos-ui-tokens.ts`

## เช็กลิสต์

- [ ] ลำดับเมนู: แดชบอร์ดซ้ายสุด
- [ ] การ์ดเนื้อหา**ทุกเมนู** = `rounded-[1.25rem]` (ไม่ใช้ `2rem` · ปุ่มยัง `xl`/`2xl` ได้ · hub QR นอกยัง `2.5rem`)
- [ ] แดชบอร์ดโต๊ะ `lg:grid-cols-3`
- [ ] ออร์เดอร์ซ้าย–ขวาบนคอม + สล็อตมือถือ
- [ ] ออร์เดอร์มือถือกริดเมนู **3 คอลัมน์** (`buildingPosProductGridClass`)
- [ ] คิวออเดอร์ไม่มีส่วนหัวซ้ำ
- [ ] SSE + `notifyBuildingPosOrderBoard` ครบทุกจุดสร้าง/แก้/ลบออเดอร์
- [ ] ครัว/จัดส่ง/คิวแดชบอร์ด/โต๊ะค้างอัปเดตร่วมกัน
- [ ] ยุบหัว + sync `DashboardShell`
- [ ] `FormModal` มี `mobileCentered`
- [ ] หมวดหมู่ผ่าน popup
- [ ] การเงิน: กรอง+กราฟการ์ดเดียว คนละปุ่มซ่อน/แสดง


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

- ใช้ **`@/components/qr/shop-qr-template`**: `QRCode.toDataURL` → **`createShopQrPosterDataUrl`** (พรีวิวโปสเตอร์) / **`createShopQrPosterCanvas`** + **`downloadPosterPng`** / **`downloadPosterPdf`** — **ห้าม** โชว์ QR ดิบในแผง (ดู `shop-qr-poster-template.mdc`)
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
| โปสเตอร์ QR | `@/components/qr/shop-qr-template` (`createShopQrPosterDataUrl`, `createShopQrPosterCanvas`, …) · กฎ `shop-qr-poster-template.mdc` · แผง UI แสดงโปสเตอร์อย่างเดียว (`ShopStaffQrPanel`) |
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
description: Chat AI — เลย์เอาต์แชทเต็มจอ (ไม่มีแถบ digest) โครง DOM และ shell
globs: "**/systems/chat/**/*,**/dashboard/chat-ai/**/*,**/personal-ai-chat-shell.ts"
alwaysApply: true
---

# Chat AI — แชทอย่างเดียว (ไม่มีแถบซ้าย digest)

- **แหล่งคลาสเดียว**: ปรับ layout นอก/การ์ดแชทที่ `src/systems/chat/personal-ai-chat-shell.ts` เท่านั้น — ห้ามคัดลอกสตริงคลาสซ้ำไปไฟล์อื่นโดยไม่จำเป็น
- **โครง DOM ที่คาดหวัง**: `PERSONAL_AI_CHAT_ROOT_CLASS` ห่อ **`PERSONAL_AI_CHAT_CARD_SHELL_CLASS`** เท่านั้น — **ไม่มี** `aside#personal-ai-digest` และไม่มีแถบสรุปรายวันด้านข้าง
- **สเกเลตัน** `chat-ai-client.tsx`: ต้องโครงเดียวกับ `PersonalAiChat` (root + การ์ด) เพื่อไม่ให้ hydrate/layout กระตุก
- **`PERSONAL_AI_CHAT_ROOT_CLASS`**: คง **`min-h-0`**, **`flex-1`**, **`overflow-hidden`** ให้เลื่อนอยู่ในการ์ดแชท ไม่ล้น parent flex

ถ้ามี PR ที่เพิ่ม `aside#personal-ai-digest` หรือ duplicate คลาส layout นอก shell — ให้ปฏิเสธหรือรวมที่ `personal-ai-chat-shell.ts` ตามกฎนี้


================================================================================
### .cursor/rules/club-event-portal-website-template.mdc
================================================================================

---
description: เว็บสาธารณะชมรม (/club/[slug]) — กริดกิจกรรม · รายละเอียด · หัวไม่มีกล่อง · กฎ/ติดต่อ headerAction
globs:
  - "**/systems/club-event/components/ClubEventPublic*.tsx"
  - "**/systems/club-event/components/ClubEventPortal*.tsx"
  - "**/systems/club-event/lib/portal-media.ts"
  - "**/systems/club-event/lib/portal-link-icons.tsx"
  - "**/systems/club-event/lib/ui-tokens.ts"
  - "**/app/club/**"
  - "**/lib/club-event/load-public-portal.ts"
alwaysApply: false
---

# เว็บสาธารณะชมรม — พอร์ทัลลูกค้า

คู่กับ: `laundry-module-portal-website-template.mdc` · `dashboard-module-media-gallery-slideshow.mdc` · `app-templates-media.mdc` · `dashboard-mobile-header-bar.mdc` (แถบสีหน้ารายละเอียด)

**ต้นแบบโค้ด:** `ClubEventPublicClient` · `ClubEventPortalSection` · `ClubEventPortalEventCardGrid` · `ClubEventPublicEventDetailClient` · `portal-link-icons.ts` · `portal-media.ts`

---

## 1) โครงหน้าพอร์ทัลหลัก `/club/[slug]` (บังคับ)

```
AppPublicCheckInGlassPage (!px-0 !pt-0)
├── header (absolute · appSafeAreaPortalHeaderClass)
│   ├── ซ้าย: โลโก้ (+ ชื่อบน sm+) — ไม่มีกล่องเม็ด
│   └── ขวา: nav เดสก์ท็อป — ไม่มีกล่อง (clubEventPortalHeaderNavOnLight*)
│       └── สมาชิก / คณะกรรมการ = ปุ่มเปิด popup
├── hero แบนเนอร์โทนสว่าง + ชื่อทับภาพ + CTA
└── main (max-w-6xl · space-y-12 sm:space-y-14)
    ├── กำหนดการ — กริดการ์ด
    ├── ย้อนหลัง — กริดการ์ดเดียวกัน
    ├── แกลเลอรีพอร์ทัล
    ├── กฎระเบียบ — ClubEventPortalSection + headerAction ลิงก์เดี่ยว
    └── ติดต่อ — ClubEventPortalSection + headerAction ปุ่มโทร/LINE/FB/แผนที่
```

### ห้าม

- ส่วนลิงก์แยกยาว / คณะกรรมการเป็นรายการยาวใน `main` / ค้นหาสมาชิกเป็นส่วนยาวใน `main`
- ห่อโลโก้+ชื่อด้วย `clubEventPortalHeaderBrandPillClass` หรือกล่องขาวบนหัว
- ห่อแถบเมนูด้วยพื้น/ขอบ/เงา (`border` · `bg-white/95` · `shadow` บน shell nav)

### บังคับ — ส่วนกฎระเบียบ / ติดต่อ

| ส่วน | หัวข้อ | ด้านขวา (`headerAction`) | เนื้อหาใต้เส้นบาง |
|------|--------|--------------------------|-------------------|
| กฎระเบียบ | ไอคอน + «กฎระเบียบ» | ลิงก์ไม่มี `eventId` (กลุ่มไลน์ · ค่าบำรุง ฯลฯ) — `ClubEventPortalStandaloneLinks` `variant="cta"` · **`flex-nowrap`** ไม่ขึ้นแถว 2 | `rulesMarkdown` (ถ้ามี) |
| ติดต่อ | ไอคอน + «ติดต่อ» | ปุ่ม โทร · LINE · Facebook · แผนที่ · **`flex-nowrap` ชิดขวา** | ที่อยู่ · เบอร์ · LINE **พร้อมไอคอน** (`MapPin` · `Phone` · `MessageCircle`) |

- ใช้ `ClubEventPortalSection` + prop **`headerAction`** — ห้ามวางปุ่มลิงก์ใต้หัวข้อแยกแถวเมื่อต้องการชิดหัวข้อ
- CTA ลิงก์กฎ: `clubEventPortalLinkCtaClass(type, { compact: true })`
- ลิงก์ที่ไม่มี `eventId` อยู่ที่กฎระเบียบเท่านั้น — ไม่ใช่ใต้กำหนดการ

### อื่น ๆ

- คณะกรรมการ = **ปุ่ม** → `ClubEventCommitteePopup`
- ค้นหาสมาชิก = **ปุ่มด้านบน** → `ClubEventMemberSearchPopup` เมื่อเปิด `portalShowMembers`
- ตั้งค่า: `portalShowCommittee` · `portalMemberFields` ในแท็บตั้งค่าเว็บไซต์ · QR/คัดลอกลิงก์ในแท็บ **ลิงก์** (`?tab=link`)
- API ค้นหา: `GET /api/club-event/public/[slug]/members/search?q=`

---

## 2) กริดกิจกรรม (กำหนดการ + ย้อนหลัง)

| Breakpoint | คอลัมน์ |
|---|---|
| มือถือ | **2** |
| แท็บเล็ต `sm` | **3** |
| เดสก์ท็อป `lg+` | **6** |

1. แสดง **2 แถว** ต่อหน้า → ขนาดหน้า = คอลัมน์ × 2 (เดสก์ท็อป **12** ใบ)
2. เกินแล้วมี **ก่อนหน้า / ถัดไป**
3. ค่าคงที่ใน `portal-media.ts`: `CLUB_EVENT_PORTAL_EVENT_*`
4. โทเค็นกริด: `clubEventPortalEventCardGridClass`
5. **ปกการ์ด** = รูปแรกจากแกลเลอรีกิจกรรม (`coverImageUrl`) · ไม่มีรูป = placeholder ไอคอน
6. **คลิกปก/ชื่อ/วันที่** → `/club/[slug]/events/[eventId]`
7. ชิปลิงก์ RSVP/ชำระ/สำรวจ ที่ `config.eventId` ตรง — **อยู่ในกรอบการ์ด** · ไอคอนตามประเภท (`portal-link-icons`) · ไม่ซ้อน `<a>` ใน `<a>`

### แกลเลอรีพอร์ทัล

1. รวมรูปจาก **ตั้งค่าแกลเลอรีชมรม** + **แกลเลอรีกิจกรรมย้อนหลัง** (dedupe · สูงสุด `CLUB_EVENT_PORTAL_GALLERY_MAX`)
2. กริด: **มือถือ 3 · คอม 8** (`clubEventGalleryCardGridClass`) · 2 แถวต่อหน้า + แบ่งหน้า
3. คลิก → `AppImageLightbox` / `openGallery`

---

## 3) หัวพอร์ทัล + แบนเนอร์

- แบนเนอร์โทน**สว่าง** — ค่าเริ่ม `CLUB_EVENT_PORTAL_SAMPLE_BANNER`
- Overlay อ่อนขาว · **ชื่อในแบนเนอร์ไม่มีกล่อง** (ข้อความโปร่ง + drop-shadow)
- **โลโก้หัว:** ไม่มีเม็ดขาว · มือถือ**โลโก้อย่างเดียว** · `sm+` แสดงชื่อ (`clubEventPortalShopNameClass`)
- **แถบเมนู:** `clubEventPortalHeaderNavOnLightShellClass` = flex ล้วน · `clubEventPortalHeaderNavOnLightLinkClass` = ข้อความโทน `#3f3a6a` · hover สีแบรนด์ — **ไม่มีพื้น/ขอบ/เงา**

---

## 4) หน้ารายละเอียดกิจกรรม `/club/[slug]/events/[eventId]`

**ไฟล์:** `ClubEventPublicEventDetailClient`

### ห้าม

- `ClubEventPageSubNav` / glass panel / การ์ดโทนแถวหุ้มทั้งหน้า
- แยกหัวข้อ «รายละเอียด» เป็น section ของตัวเอง
- เม็ดแบรนด์ขาว / nav «กลับเว็บชมรม» แบบกล่องบนหัว

### บังคับ — Header

```
appDashboardHeaderBarClass (ไล่ม่วงแบรนด์เต็มขอบ + safe-area)
└── appDashboardHeaderBarInnerClass · justify-between
    ├── ซ้าย: โลโก้ + ชื่อ (ลิงก์กลับพอร์ทัล · ไม่มีกล่อง · ข้อความขาว)
    └── ขวา: ปุ่มกลับ appDashboardHeaderIconButtonClass
            · มือถือไอคอนอย่างเดียว · sm+ ไอคอน + «กลับ»
```

### บังคับ — เนื้อหา

```
main (max-w-6xl · space-y-12 sm:space-y-14)
├── หัวข้อกิจกรรม (บล็อกเดียว)
│   ├── ซ้าย: ป้ายกำหนดการ/ย้อนหลัง · h1 · วันเวลา · คำอธิบาย (ถ้ามี)
│   └── ขวา: ปุ่มลิงก์กิจกรรม clubEventPortalLinkCtaClass — ชิดขวา
├── วิดีโอ — ClubEventPortalSection (titleIcon youtube) + เส้นบาง
└── แกลเลอรี — ClubEventPortalSection (titleIcon gallery) + เส้นบาง
```

- คำอธิบายรวมใต้ชื่อ/วัน — **ไม่** ใช้หัวข้อ «รายละเอียด»
- ส่วนวิดีโอ/แกลเลอรีใช้เส้นบาง `clubEventPortalPageBodyClass` ผ่าน `ClubEventPortalSection`
- โทเค็นลิงก์: `clubEventPortalLinkCtaClass` · `clubEventPortalLinkTileClass` · `clubEventPortalLinkChipClass`

---

## 5) โทเค็น / คอมโพเนนต์สำคัญ

| ชิ้น | ที่มา |
|------|------|
| ส่วนหัว–เนื้อหา + `headerAction` | `ClubEventPortalSection` |
| ลิงก์เดี่ยวใต้กฎ | `ClubEventPortalStandaloneLinks` (`variant="cta"` \| `"tile"`) |
| สี/ไอคอนลิงก์ตามประเภท | `portal-link-icons.tsx` |
| แถบหัวรายละเอียด | `appDashboardHeaderBar*` จาก `@/components/app-templates` |
| เส้นบางใต้หัวข้อ | `clubEventPortalPageBodyClass` / `clubEventPortalSectionDividerClass` |

---

## 6) เช็กลิสต์

### พอร์ทัล `/club/[slug]`

- [ ] หัว: โลโก้ไม่มีกล่อง · มือถือโลโก้อย่างเดียว · nav ไม่มีกล่อง
- [ ] กริดกิจกรรม 2 / 3 / 6 + แบ่งหน้า 2 แถว · ปกจากแกลเลอรี
- [ ] คลิกการ์ด → หน้ารายละเอียดจริง
- [ ] ลิงก์ผูกกิจกรรมอยู่ในกรอบการ์ด + ไอคอนประเภท
- [ ] กฎระเบียบ: ลิงก์เดี่ยว CTA แถวเดียวกับหัวข้อด้านขวา · `nowrap`
- [ ] ติดต่อ: ปุ่มโทร/LINE/FB/แผนที่แถวเดียวกับหัวข้อ · ที่อยู่/เบอร์/LINE มีไอคอน
- [ ] คณะกรรมการ / สมาชิก = popup จากปุ่มหัว (ไม่ลิสต์ใน main)
- [ ] แบนเนอร์โทนสว่าง

### รายละเอียด `/club/.../events/[id]`

- [ ] Header ม่วงแบรนด์ · ซ้ายโลโก้+ชื่อ · ขวากลับ (มือถือไอคอน)
- [ ] คำอธิบายรวมในหัวข้อ · ไม่มี section «รายละเอียด»
- [ ] ลิงก์กิจกรรม CTA ด้านขวาหัวข้อ
- [ ] วิดีโอ / แกลเลอรี = `ClubEventPortalSection` + เส้นบาง


================================================================================
### .cursor/rules/customer-portal-no-description-copy.mdc
================================================================================

---
description: หน้าลูกค้า (QR/พอร์ทัล) — ห้ามคำอธิบายยาว ใช้หัวข้อสั้นที่สื่อความหมายพอ
globs:
  - "**/systems/building-pos/BuildingPosCustomer*.tsx"
  - "**/systems/building-pos/components/BuildingPosCustomer*.tsx"
  - "**/app/building-pos/order/**"
  - "**/systems/**/*PortalClient*.tsx"
  - "**/systems/**/*CustomerOrder*.tsx"
alwaysApply: false
---

# หน้าลูกค้า — ไม่ใส่คำอธิบาย (หัวข้อพอ)

เมื่อทำหรือแก้ **หน้าสาธารณะของลูกค้า** (ลิงก์ QR สั่งอาหาร · พอร์ทัล · เช็คอิน ฯลฯ):

## บังคับ

1. **ห้าม** ข้อความอธิบายใต้หัวข้อ / คำโปรยยาว / คำใบ้ขั้นตอน เช่น «กรอกแล้วสะสมอัตโนมัติ…», «ตรวจสอบเมนูแล้วกดยืนยัน», «จากยอดสั่งจริง»
2. ใช้ **หัวข้อหรือป้ายสั้น** ที่สื่อความหมายพอ: `ข้อมูล` · `สั่งอาหาร` · `ออเดอร์` · `คะแนน` · `โต๊ะ` · `เบอร์โทร`
3. ป้ายฟิลด์ **ไม่ต่อท้าย** `(ไม่บังคับ)` / คำอธิบายยาวใน label — ถ้าไม่บังคับก็แค่ไม่ validate
4. ข้อความสถานะสั้นได้เมื่อจำเป็นจริง (เช่น ผิดพลาด · ส่งสำเร็จ · ว่าง) — **หนึ่งประโยคสั้น** ไม่เล่า workflow
5. คู่มือยาว / กฎสะสมคะแนน อยู่ที่ **หน้าตั้งค่าร้านหรือคู่มือในแดชบอร์ด** — ไม่โชว์บนหน้าลูกค้า

## ตัวอย่าง

| ผิด | ถูก |
|-----|-----|
| หัวข้อ + «กรอกโต๊ะและเบอร์ก่อนสั่ง» | หัวข้อ `ข้อมูล` อย่างเดียว |
| `เบอร์โทรศัพท์ (ไม่บังคับ)` + บรรทัดกฎคะแนน | `เบอร์โทร` |
| `สรุปรายการก่อนส่ง` + «ตรวจสอบแล้วกดยืนยัน» | `สรุปรายการ` |

## อ้างอิงโค้ด

- `src/systems/building-pos/BuildingPosCustomerOrderClient.tsx`
- `src/systems/building-pos/components/BuildingPosCustomerLoyaltyPanel.tsx`


================================================================================
### .cursor/rules/dashboard-add-form-modal.mdc
================================================================================

---
description: ปุ่มเพิ่มรายการ/หมวด/สินค้าในแดชบอร์ด — เปิด FormModal ไม่ใช้ฟอร์ม inline
globs: "**/dashboard/**/*.tsx,**/systems/**/*Client.tsx,**/systems/**/*Panel.tsx"
alwaysApply: false
---

# แดชบอร์ด — เพิ่มข้อมูล / หมวด ผ่าน popup

เมื่อหน้าแดชบอร์ดมีปุ่ม **เพิ่มรายการ**, **เพิ่มสินค้า**, **เพิ่มหมวดหมู่**, **เพิ่มลูกค้า** (หรือเทียบเท่า) ภายใน `AppDashboardSection`:

## บังคับ

1. **ห้าม** วางฟอร์มกรอกเต็มแถว/กล่อง dashed ถาวรใต้หัวการ์ด — ให้เหลือ **รายการ + สรุป** บนหน้าหลัก
2. ปุ่มเพิ่มใน `AppSectionHeader` `action` (หรือปุ่มรองในส่วนหมวด) → **`setShowAddModal(true)`** เปิด **`FormModal`** เท่านั้น
3. ใช้ **`FormModal`** จาก `@/components/ui/FormModal`
   - `mobileCentered` (ค่าเริ่มของ component)
   - `size="md"` สำหรับฟอร์มสั้น · `size="lg"` ถ้ามีหลายช่อง/อัปโหลดรูป
   - `footer` = ยกเลิก + บันทึก/เพิ่ม
   - ค่าเริ่ม: **`FormModalFooterActions`**
   - **ข้อยกเว้นโมดูลที่มีปุ่ม template `h-9`:** ใช้ footer คู่ outline/primary ของโมดูล (เช่น ร้านออนไลน์ `ProductFormModalFooter` + `ecommerceStoreOutlineButtonClass` / `ecommerceStorePrimaryButtonClass`) — ดู **`ecommerce-store-module-dashboard-template.mdc`**
4. ปิดโมดัล (`onClose` / ยกเลิก) → **รีเซ็ต state ฟอร์ม** เพื่อไม่ให้ค่าค้างรอบถัดไป
5. หลังบันทึกสำเร็จ → ปิดโมดัล → `reload()` รายการ

## แพทเทิร์น

```tsx
const [showAddModal, setShowAddModal] = useState(false);

<AppSectionHeader
  action={
    <button type="button" onClick={() => setShowAddModal(true)} className="app-btn-primary ...">
      <span className="sm:hidden">+</span>
      <span className="hidden sm:inline">+ เพิ่ม…</span>
    </button>
  }
/>

<FormModal
  open={showAddModal}
  onClose={() => { setShowAddModal(false); resetForm(); }}
  title="เพิ่ม…"
  description="คำอธิบายสั้น"
  size="md"
  footer={
    <FormModalFooterActions
      onCancel={() => { setShowAddModal(false); resetForm(); }}
      onSubmit={handleAdd}
      submitLabel="เพิ่ม"
      submitDisabled={!name.trim()}
      loading={busy}
    />
  }
>
  {/* ช่องกรอกในโมดัล */}
</FormModal>
```

## ข้อยกเว้น

- **แก้ไขแถว** (inline select / +/- สต๊อก / ไอคอนแถว) ไม่ต้องเป็นโมดัล — เฉพาะ **การสร้างรายการใหม่** หรือ **สร้างหมวดใหม่**
- ฟิลเตอร์/ค้นหาบนหน้ารายการ — แสดง inline หรือ sheet ตาม `dashboard-mobile-filter-icon.mdc`
- **ร้านออนไลน์ — ฟอร์มสินค้า:** แบ่งแผง plain (`ecommerceStorePanelClass`) · ติ๊กแสดงบนเว็บไซต์ · รูปปก+มุมอื่น · footer ปุ่มโมดูล — **`ecommerce-store-module-dashboard-template.mdc`**

## อ้างอิง

- `src/components/ui/FormModal.tsx`
- `src/systems/ecommerce-store/components/EcommerceProductsClient.tsx` (สินค้า + หมวด · footer template โมดูล)
- คาร์แคร์: `CarWashDashboard.tsx` (โมดัลฟอร์มหลายจุด)


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
### .cursor/rules/dashboard-expense-cost-categories.mdc
================================================================================

---
description: หมวดหมู่รายจ่าย/ต้นทุน — CRUD + ฟอร์ม 5 ช่อง + สลิป (ต้นแบบร้านอาหาร) ใช้ซ้ำทุกโมดูล
globs:
  - "**/systems/**/**Finance*"
  - "**/systems/**/**Sales*"
  - "**/systems/**/*Cost*"
  - "**/systems/**/BuildingPosInventory*"
  - "**/app/api/**/cost-categories/**"
  - "**/app/api/**/costs/**"
alwaysApply: false
---

# หมวดหมู่รายจ่าย (Cost categories) — มาตรฐานข้ามโมดูล

ใช้เมื่อโมดูลมี **บันทึกรายจ่าย / ต้นทุน** และต้องให้ผู้ใช้ **เพิ่ม · แก้ไข · ลบ หมวดหมู่** เอง

**แม่แบบการเงินครบชุด:** **`dashboard-finance-module-template.mdc`**

**อ้างอิงที่ทำแล้ว:** hotel-resort · drink-pos · building-pos (รายจ่ายทั่วไป) · คาร์แคร์/บาร์เบอร์ (หมวดต้นทุนเดิม)

คู่กับ: `dashboard-finance-page-layout.mdc` · `dashboard-finance-filter-charts-toggle.mdc` · `dashboard-finance-detail-tabs.mdc` · `dashboard-row-action-icon-buttons.mdc` · `hotel-resort-finance.mdc` · `dashboard-menu-categories-popup.mdc`

---

## 1) ข้อมูล (Prisma)

| ชิ้น | แนวทาง |
|------|--------|
| หมวด | `XxxCostCategory` — `ownerUserId` (+ `trialSessionId` ถ้าโมดูลมี sandbox) · `name` · `sortOrder` |
| รายการ | `XxxCostEntry` — `categoryId` · `label` · `amountBaht` · `spentAt` · **`paymentSlipUrl`** (ว่างได้ · `VarChar` พอสำหรับ URL อัปโหลด) · `note` optional |
| ลบหมวด | `onDelete: SetNull` ที่รายการ **หรือ** ปฏิเสธใน API ถ้ายังมีรายการ (แนะนำ **409** ให้ย้าย/ลบรายการก่อน) |

Migration: สร้างตารางหมวด → เพิ่ม `category_id` → backfill หมวด «ทั่วไป» ต่อ owner ที่มีรายการเก่า → FK  
หลัง migrate: **`npx prisma generate`** เสมอ

---

## 2) API

| Method | Path (ตัวอย่าง) |
|--------|----------------|
| GET / POST | `/api/{module}/cost-categories` |
| PATCH / DELETE | `/api/{module}/cost-categories/[id]` หรือ `?id=` (session style) |
| GET / POST | `/api/{module}/costs` |
| PATCH / DELETE | `/api/{module}/costs/[id]` — รวมอัปเดต `paymentSlipUrl` |
| POST รายจ่าย | ต้องส่ง `categoryId` / `category_id` — ไม่มีหมวด → 400 |

ลบหมวดที่มีรายการอยู่ → **409** + ข้อความชัด  
finance-summary (ถ้ามี) ควรคืน `paymentSlipUrl` ในรายการ costs ด้วย

---

## 3) UI (บังคับ)

อยู่ที่ **แท็บรายจ่าย** ของหน้าการเงิน (ไม่ใช่หน้าแยกเป็นทางหลัก) — ดู `dashboard-finance-detail-tabs.mdc`

1. ปุ่ม **หมวดหมู่** คู่กับปุ่ม **+ รายจ่าย / บันทึกต้นทุน** — popup จัดการตาม **`dashboard-menu-categories-popup.mdc`** (`FormModal` + `mobileCentered`)
2. **แถบชิปกรองหมวด** ใต้หัว: **ทั้งหมด** + แต่ละหมวด (เลื่อนแนวนอนมือถือ · `aria-pressed`)
3. โมดัลจัดการหมวด: รายการ + **ไอคอนแก้ไข/ลบ** · หลังบันทึกหมวดกลับหน้ารายการใน popup
4. ฟอร์มบันทึก/แก้ไขรายจ่าย — **ลำดับบังคับ (ต้นแบบร้านอาหาร):**
   1. หมวด  
   2. รายละเอียดรายการ  
   3. จำนวนเงิน (บาท)  
   4. หมายเหตุ (ไม่บังคับ)  
   5. รูปสลิป (ไม่บังคับ)  
   - คอมโพเนนต์ต้นแบบ: **`BuildingPosCostsPanel`**  
   - เครื่องดื่ม: `DrinkPosCostsPanel` · โรงแรม: ฟอร์มใน `HotelResortFinanceClient` — โครงฟิลด์เดียวกัน  
   - อัปโหลด: `AppGalleryCameraFileInputs` + `AppImagePickCameraButtons` + `prepareImageFileForUpload`  
   - ดูตัวอย่างในฟอร์ม: **`AppLabeledImageThumb` `kind="slip"`** + lightbox · `FormModal` + **`mobileCentered`**
5. **ในแถวรายการ:**
   - มีสลิป → **`AppLabeledImageThumb` `kind="slip"`** กดเปิด lightbox · ไม่มี → **ไม่แสดงช่องสลิป**  
   - เลย์เอาต์: `[สลิป?] [เนื้อหา flex-1] [ราคาขวา text-rose-600 + ไอคอนแก้ไข/ลบ]`  
   - มือถือห้ามให้ราคาหล่นซ้ายเพราะ `flex-wrap`  
   - กฎเต็ม: **`dashboard-finance-detail-tabs.mdc`** §2 · **`app-templates-media.mdc`**
6. แถวมี **แก้ไข / ลบ** เป็นไอคอนตาม `dashboard-row-action-icon-buttons.mdc`  
   - **ลบต้องยืนยัน** ด้วย **`useAppNoticePopup().confirm`** จาก `@/components/app-templates` — **ห้าม** `window.confirm`  
   - เรนเดอร์ `{notice.popup}` ในแผง · ลบหมวดในโมดัลหมวดก็ใช้ confirm เดียวกัน  
   - ดู **`dashboard-finance-module-template.mdc`** §6b
7. ยังไม่มีหมวด → เปิดโมดัลหมวดก่อนบันทึกรายจ่าย

**building-pos:** `BuildingPosCostsPanel` — ไม่โชว์ฟอร์มซื้อวัตถุดิบหลายบรรทัดบนแท็บต้นทุนการเงิน

**ห้าม** วางปุ่ม «+ รายจ่าย» เหนือกราฟในการ์ดการเงิน · ลบโดยไม่ยืนยัน · ใช้ `window.confirm`

---

## 4) โมดูลอ้างอิง

| โมดูล | หมวด | รายการ |
|-------|------|--------|
| hotel-resort | `HotelResortCostCategory` | `HotelResortCostEntry` + `paymentSlipUrl` |
| drink-pos | `DrinkPosCostCategory` | `DrinkPosCostEntry` + `paymentSlipUrl` · UI `DrinkPosCostsPanel` |
| building-pos | `BuildingPosCostCategory` | `BuildingPosCostEntry` + สลิป · `BuildingPosCostsPanel` (**ต้นแบบ**) |
| car-wash / barber / … | `*CostCategory` | `*CostEntry` + สลิปตามมาตรฐาน |

โมดูลใหม่: คัดลอกแพทเทิร์น building-pos (หมวด + สลิป + lightbox + ฟอร์ม 5 ช่อง) — ห้าม lightbox ad-hoc

## เช็กลิสต์

- [ ] Schema หมวด + categoryId + **paymentSlipUrl** บนรายจ่าย
- [ ] GET/POST + PATCH/DELETE หมวด · ลบมีรายการ = 409
- [ ] GET/POST + PATCH/DELETE รายจ่าย (รวม paymentSlipUrl)
- [ ] UI หมวดหมู่ + ฟอร์ม 5 ช่องตามต้นแบบร้านอาหาร
- [ ] แถว: สลิปเฉพาะเมื่อมี · ราคาขวา rose · ไอคอนแก้ไข/ลบ
- [ ] ลบรายจ่าย/หมวดใช้ `useAppNoticePopup().confirm` — ห้าม `window.confirm`
- [ ] CTA อยู่แท็บรายจ่าย · ไม่เหนือกราฟ


================================================================================
### .cursor/rules/dashboard-finance-detail-tabs.mdc
================================================================================

---
description: หน้าการเงิน — แท็บประวัติ/รายรับ · รายจ่าย · สลิปเฉพาะเมื่อมี · ราคาขวา emerald/rose · ฟอร์มรายจ่ายต้นแบบร้านอาหาร
globs:
  - "**/systems/**/**Finance*"
  - "**/systems/**/**Sales*"
  - "**/systems/building-pos/**Sales*"
  - "**/systems/drink-pos/**Sales*"
  - "**/systems/hotel-resort/**Finance*"
  - "**/dashboard/**/finance/**"
  - "**/dashboard/**/sales/**"
alwaysApply: false
---

# การเงิน — แถบเมนูรายละเอียด (ประวัติ / รายรับ · รายจ่าย)

**แม่แบบครบชุด:** **`dashboard-finance-module-template.mdc`**  
**โครงหน้าจอเต็ม:** **`dashboard-finance-page-layout.mdc`**

**คู่กับ:** `dashboard-finance-filter-charts-toggle.mdc` · `dashboard-expense-cost-categories.mdc` · `app-templates-media.mdc` · `app-templates-spark-charts.mdc` · `dashboard-row-action-icon-buttons.mdc` · `useAppNoticePopup` / `AppNoticePopup`

**ต้นแบบโมดูล:** ร้านอาหาร (`BuildingPosSalesHistoryPanel` + `BuildingPosCostsPanel`) — เครื่องดื่ม / โรงแรมต้องจัดแถบ + ฟอร์มรายจ่าย + เลย์เอาต์แถวให้ใกล้เคียง

---

## 1) แถบเมนู 2 แท็บ (บังคับ · ทุกโมดูล)

แถบอยู่**ในการ์ดการเงินใบเดียว** กับกรอง/กราฟ — ใต้แผงกรองและกราฟ (คั่น `border-t`) — **ห้าม**แยกเป็น `AppDashboardSection` คนละใบ

| แท็บ | เนื้อหา |
|------|---------|
| **ประวัติ / รายรับ** | รายการธุรกรรม·ออเดอร์·เข้าพัก ตามช่วงกรอง |
| **รายจ่าย** | ต้นทุน/รายจ่าย + หมวดหมู่ |

ลำดับ: **ประวัติ/รายรับ → รายจ่าย**

### UI แถบ (ให้เหมือนกันข้ามโมดูล)

- `<nav>` · `role="tablist"` / `tab` / `tabpanel` · `aria-selected` · `aria-controls`
- โทเค็นเปลือก: `*FinanceSubTabShellClass` (rounded-[1.25rem] + gradient inset)
- ปุ่ม: `min-h-[44px]` · `flex-1` · `font-black` · active = `*NavActiveClass` + ring · idle = `*NavIdleClass`
- **เครื่องดื่ม** ต้องมีแถบนี้ด้วย (อย่าเหลือแค่รายการขายใต้กราฟอย่างเดียว)

อ้างอิง: building-pos / hotel-resort / drink-pos (`drinkPosFinanceSubTabShellClass`)

---

## 2) รูปสลิป — แสดงเฉพาะเมื่อมี (บังคับ)

| เงื่อนไข | พฤติกรรม |
|----------|----------|
| **มี URL สลิป** (แถวการเงิน · การ์ด · พรีวิว) | **`AppLabeledImageThumb` `kind="slip"`** · กดเปิด **`AppImageLightbox`** — ป้าย «สลิป» มุมล่างรูป · ดู **`app-templates-slip-labeled-thumb.mdc`** |
| **ไม่มีสลิป** | **ไม่แสดง** ช่องว่าง / empty / ข้อความ «ไม่มีสลิป» |

ใช้กับทั้งแท็บ **ประวัติ / รายรับ** และ **รายจ่าย**

### เลย์เอาต์แถว (มือถือ + เดสก์ท็อป)

แถวหลักใช้ **`flex items-start gap-2`** (หรือ `gap-3`) — **หลีกเลี่ยง `flex-wrap`** ที่ดันราคาลงบรรทัดใหม่บนมือถือ:

```
[สลิปย่อ+ป้าย ถ้ามี]  [เนื้อหา min-w-0 flex-1]  [ราคา shrink-0 text-right]  [ไอคอนแก้ไข · ลบ]
```

### สีราคาในแถว (บังคับ)

| แท็บ | สีราคา |
|------|--------|
| ประวัติ / รายรับ | `text-emerald-700` · `font-black` · `tabular-nums` · แนะนำ `text-lg` |
| รายจ่าย | `text-rose-600` · `font-black` · `tabular-nums` |

- สลิปอยู่ซ้ายหรือชิดเนื้อหา — ไม่แทรกกลางจนราคาหล่น
- Import จาก `@/components/app-templates` เท่านั้น

```tsx
{slipUrl ? (
  <AppLabeledImageThumb src={slipUrl} kind="slip" alt={label} onOpen={() => lb.open(slipUrl)} />
) : null}
```

**ห้าม**

- แสดง placeholder สลิปเมื่อไม่มีรูป
- lightbox / `<img>` เต็มจอ ad-hoc
- `window.open` เป็นทางหลักเมื่อมี lightbox แล้ว
- แสดงเฉพาะลิงก์ข้อความโดยไม่มีรูปย่อ (อนุญาตเป็นทางสำรองเพิ่มจาก thumb ได้)
- ยอดรายรับเป็นม่วง/`slate-900` เป็นสีหลัก
- วางป้าย «สลิป» เป็นข้อความใต้รูปจนทับชื่อ — ใช้ `AppLabeledImageThumb`
- ใช้ `AppSlipImageThumb` / `AppImageThumb` เปล่าในแถวการเงินมาตรฐาน
---

## 2b) แท็บ **ประวัติ / รายรับ** — แก้ไข + ลบ (บังคับ)

**ห้าม** ทำให้แท็บประวัติ/รายรับเป็นรายการอ่านอย่างเดียว

| | บังคับ |
|--|--------|
| **แก้ไข** | ไอคอนดินสอทุกแถว · `FormModal` · PATCH ตามโดเมน · **รวมสลิป** (ดูย่อ · ลบ · อัปโหลด/ถ่ายใหม่ ด้วย **`AppLabeledImageThumb` `kind="slip"`** + gallery/camera จาก app-templates) |
| **ลบ** | ไอคอนถังทุกแถว · **`await notice.confirm(...)`** ก่อน DELETE |
| **วางปุ่ม** | ขวาสุดคู่ราคา · `dashboard-row-action-icon-buttons.mdc` · `aria-label` |
| **สีราคา** | `text-emerald-700` |

แท็บ **รายจ่าย** ต้องมีแก้ไข+ลบเช่นกัน (ฟอร์ม 5 ช่อง · สลิป · ราคา rose)

### ยืนยันก่อนลบ — template กลาง

```tsx
import { useAppNoticePopup } from "@/components/app-templates";

const notice = useAppNoticePopup();
// render: {notice.popup}

const ok = await notice.confirm(`ลบรายการ «${label}» ใช่หรือไม่?`);
if (!ok) return;
```

| บังคับ | ห้าม |
|--------|------|
| `useAppNoticePopup().confirm` ก่อนลบรายรับ · รายจ่าย · หมวด | `window.confirm` / `confirm()` / `alert` |
| `{notice.popup}` ในหน้า/แผง | แถวประวัติไม่มีแก้ไขหรือไม่มีลบ |
| error → `notice.error` หรือข้อความใน UI | ลบทันทีโดยไม่ถาม |

รายละเอียดเต็ม + ตารางโดเมน: **`dashboard-finance-module-template.mdc`** §6b

---

## 3) พฤติกรรมแท็บ

1. CTA **+ รายจ่าย / + เพิ่มรายจ่าย** และปุ่ม **หมวดหมู่** อยู่ที่แท็บรายจ่ายเท่านั้น — ไม่เปิดหน้าแยก · **ไม่วางเหนือกราฟ**
2. รายการกรองตามช่วงเวลาของแผงกรองในการ์ดเดียวกัน
3. URL เก่า `?fin=costs` → เปิดแท็บรายจ่ายในหน้าเดิมได้

---

## 4) แท็บรายจ่าย — ฟอร์มต้นแบบร้านอาหาร

ฟอร์มบันทึก/แก้ไขรายจ่าย **ต้องเหมือนร้านอาหาร** (`BuildingPosCostsPanel`):

1. หมวดหมู่  
2. รายละเอียดรายการ  
3. จำนวนเงิน (บาท)  
4. หมายเหตุ (ไม่บังคับ)  
5. รูปสลิป (ไม่บังคับ) — gallery/camera + preview thumb + ลบสลิป  

- `FormModal` + **`mobileCentered`**
- แถวรายการ: สลิป (ถ้ามี) · เนื้อหา · **ราคาขวาโทน rose** · ไอคอนแก้ไข/ลบ  
- ลบรายการ/หมวด: **`await notice.confirm(...)`** ก่อนเรียก API  
- ชิปกรองหมวด · ปุ่มหมวดหมู่ — ตาม **`dashboard-expense-cost-categories.mdc`**

| โมดูล | คอมโพเนนต์ / จุดอ้างอิง |
|-------|-------------------------|
| ร้านอาหาร | `BuildingPosCostsPanel` (**ต้นแบบ**) |
| เครื่องดื่ม | `DrinkPosCostsPanel` |
| โรงแรม | ฟอร์มใน `HotelResortFinanceClient` (โครงเดียวกับต้นแบบ) |

---

## 5) อ้างอิงสลิปตามโดเมน

| โมดูล | รายรับ | รายจ่าย |
|-------|--------|---------|
| POS ร้านอาหาร | `payment_slip_url` บนออเดอร์ | `BuildingPosCostEntry.paymentSlipUrl` |
| POS เครื่องดื่ม | `DrinkPosSale.paymentSlipUrl` | `DrinkPosCostEntry.paymentSlipUrl` |
| โรงแรม | `HotelResortBooking.paymentSlipUrl` | `HotelResortCostEntry.paymentSlipUrl` |

## เช็กลิสต์

- [ ] ตาม `dashboard-finance-page-layout.mdc` / แม่แบบครบชุด
- [ ] แถบ 2 แท็บ UI เดียวกัน (รวมเครื่องดื่ม)
- [ ] สลิป: มีถึงแสดง + กดดู · ไม่มีไม่โชว์
- [ ] แถว: ราคาขวา emerald/rose · ไม่ flex-wrap หลุดบนมือถือ
- [ ] **ประวัติ / รายรับ:** ทุกแถวมีแก้ไข + ลบ (ห้ามอ่านอย่างเดียว)
- [ ] รายจ่าย: มีแก้ไข + ลบ
- [ ] ลบใช้ `useAppNoticePopup().confirm` — ห้าม `window.confirm`
- [ ] ฟอร์มรายจ่ายครบ 5 ช่องตามต้นแบบร้านอาหาร
- [ ] CTA รายจ่ายอยู่แท็บรายจ่ายเท่านั้น
- [ ] **`AppLabeledImageThumb` `kind="slip"`** + `AppImageLightbox` จาก `app-templates` (ดู **`app-templates-slip-labeled-thumb.mdc`**)


================================================================================
### .cursor/rules/dashboard-finance-filter-charts-toggle.mdc
================================================================================

---
description: หน้าการเงิน — กรองช่วงเวลา (ชิป pill เล็ก) + กราฟ คนละปุ่มซ่อน · ไม่มี placeholder
globs:
  - "**/systems/building-pos/**Sales*"
  - "**/systems/drink-pos/**Sales*"
  - "**/systems/home-finance/**"
  - "**/systems/hotel-resort/**Finance*"
  - "**/dashboard/**/finance/**"
  - "**/dashboard/**/sales/**"
alwaysApply: false
---

# การเงิน — กรอง + กราฟ (คนละปุ่มซ่อน)

**แม่แบบครบชุด:** **`dashboard-finance-module-template.mdc`**  
**โครงหน้าเต็ม:** **`dashboard-finance-page-layout.mdc`**

เมื่อมีทั้งตัวกรองช่วงเวลาและกราฟสรุป:

---

## 1) โครงบังคับ

1. กรองและกราฟอยู่**ในการ์ดเดียวกับรายละเอียด** — ห้ามแยกเป็นสอง `AppDashboardSection` เพียงเพื่อแยกกรองกับรายการ
2. หัวการ์ดมีปุ่มแยก:
   - **`แสดงกรอง` / `ซ่อนกรอง`** — `aria-expanded` · `aria-controls` · badge จุดเมื่อมีเงื่อนไขกรองค้าง (แม้แผงซ่อน)
   - **`แสดงกราฟ` / `ซ่อนกราฟ`** — ซ่อน**เฉพาะแผนภูมิ** คนละปุ่ม
   - **รีเฟรช** (ถ้ามี) — ตาม `dashboard-mobile-report-refresh-icon.mdc`
3. ค่าเริ่มแนะนำ: **กรองซ่อน** · **กราฟซ่อน** · ช่วง **เดือนนี้** (`MONTH`)
4. **ขณะซ่อนกรอง / ซ่อนกราฟ — ไม่แสดงข้อความ placeholder** (ไม่มีกล่อง dashed / «ถูกซ่อนไว้»)
5. **ตัวเลขสรุปอยู่ด้านบนสุดของหน้า** (นอกการซ่อนกราฟ) — สีตาม `dashboard-finance-page-layout.mdc` §2

---

## 2) แผงกรอง — ชิปช่วงเวลา (บังคับเป็นปุ่มเล็ก)

| ค่า | ป้าย |
|-----|------|
| `TODAY` | วันนี้ |
| `MONTH` | เดือนนี้ |
| `YEAR` | ปีนี้ |
| `CUSTOM` | กำหนดเอง |

```
คอนเทนเนอร์: flex flex-wrap gap-2 · role="group" · aria-label="กรองช่วงเวลาการเงิน"
ปุ่ม: h-10 shrink-0 rounded-full px-3.5 · ตามความยาวข้อความ · aria-pressed
```

| ทำ | ห้าม |
|----|------|
| pill ตามความยาวข้อความ | `grid-cols-2 sm:grid-cols-4` + `w-full` บนชิป |
| `flex flex-wrap gap-2` | บังคับความกว้างเท่ากันทั้งแถว / เต็มจอ |
| active = gradient แบรนด์หรือ chip active ของโมดูล | select ปี/เดือน/วัน แทนชิป |

ต้นแบบชิป: `DrinkPosSalesClient` (`FinanceRangeChip`) · ร้านอาหาร/โรงแรมต้องโครงเดียวกัน

---

## 3) แผงกรอง — ช่องพิมพ์

| ชิ้น | เมื่อไหร่ | มาตรฐาน |
|------|----------|---------|
| ตั้งแต่วันที่ / ถึงวันที่ | เฉพาะ `CUSTOM` | `type="date"` · label มองเห็น · `min-h-[44px]` |
| ค้นหา | เมื่อเปิดแผงกรอง | placeholder ตามโดเมน · `min-h-[44px]` |
| **รีเซ็ต · เดือนนี้** | **เฉพาะเมื่อมีเงื่อนไขกรองค้าง** | สูงเท่าช่องพิมพ์ · รีเซ็ตช่วงเป็น MONTH + ล้างวันที่/คำค้น |

**เลย์เอาต์ช่องพิมพ์**

- มือถือ: `flex-col gap-3` ได้
- **`sm+`:** `flex-row flex-wrap items-end` — วันที่ + ค้นหา + รีเซ็ต **แถวเดียวกัน**
- ความสูงเท่ากันทุกช่องในแถว (`h-11` / `min-h-[44px]`)
- ข้อความสถานะสั้นใต้แผงได้ เช่น `กำลังดู: {financeRangeLabel}`

**เงื่อนไข «กรองค้าง» แนะนำ:** ช่วง ≠ `MONTH` หรือมี `dateFrom`/`dateTo` หรือมีคำค้นไม่ว่าง

---

## 4) กราฟ (เมื่อเปิด)

- ใช้ `AppRevenueCostColumnChart` / `AppColumnBarSparkChart` / เลย์เอาต์จาก `@/components/app-templates` — **`app-templates-spark-charts.mdc`**
- **ห้าม** แถวสรุปช่วง + ปุ่มเพิ่มรายจ่าย **เหนือกราฟ** — CTA อยู่แท็บรายจ่าย

---

## 5) ห้าม (สรุป)

- แยกการ์ดกรอง/กราฟ กับรายละเอียด
- ปุ่มเดียวสลับทั้งกรองและกราฟ
- ซ่อนสรุปรายรับ/รายจ่าย/สุทธิ เมื่อซ่อนกราฟ
- ข้อความ/กล่อง dashed บอกว่ากรองหรือกราฟถูกซ่อน
- ตัวกรองปี/เดือน/วันแบบ select แยกชั้น
- ชิปช่วงเวลาเต็มจอ / กว้างเท่ากันทั้งแถว
- โชว์ปุ่มรีเซ็ตตลอดแม้ยังไม่มีการกรอง
- ช่องพิมพ์คนละความสูงในแถวเดสก์ท็อปโดยไม่จำเป็น

---

## อ้างอิง

- `BuildingPosSalesAnalytics.tsx` · `HotelResortFinanceClient.tsx` · `DrinkPosSalesClient.tsx`
- แถบรายละเอียด: **`dashboard-finance-detail-tabs.mdc`**

## เช็กลิสต์

- [ ] กรอง+กราฟ+รายละเอียดการ์ดเดียว
- [ ] ชิปเป็นปุ่ม pill เล็ก · `flex-wrap` · ไม่เต็มจอ
- [ ] ช่องพิมพ์สูงเท่ากัน · `sm+` แถวเดียว · รีเซ็ตเฉพาะเมื่อกรองค้าง
- [ ] คนละปุ่มซ่อนกรอง / กราฟ · ซ่อนแล้วไม่มี placeholder
- [ ] สรุปตัวเลขบนสุด เห็นเมื่อซ่อนกราฟ
- [ ] ไม่มี CTA รายจ่ายเหนือกราฟ


================================================================================
### .cursor/rules/dashboard-finance-module-template.mdc
================================================================================

---
description: แม่แบบหน้าการเงินแดชบอร์ดครบชุด (สรุป·กรอง·กราฟ·แท็บ·สลิป·รายจ่าย·สีราคา) — ใช้เมื่อสร้างหรือปรับโมดูลอื่น
globs:
  - "**/systems/**/**Finance*"
  - "**/systems/**/**Sales*"
  - "**/systems/**/*Cost*"
  - "**/systems/building-pos/**Sales*"
  - "**/systems/drink-pos/**Sales*"
  - "**/systems/hotel-resort/**Finance*"
  - "**/dashboard/**/finance/**"
  - "**/dashboard/**/sales/**"
  - "**/app/api/**/finance-summary/**"
  - "**/app/api/**/costs/**"
  - "**/app/api/**/cost-categories/**"
alwaysApply: false
---

# แม่แบบหน้าการเงิน — มาตรฐานข้ามโมดูล (Golden Template)

ใช้เมื่อ **สร้างหน้าการเงิน/ยอดขายใหม่** หรือปรับโมดูลเดิมให้ตรงชุดที่ทำแล้ว

**ต้นแบบ UX/UI ล่าสุด (บังคับยึด):** **รับฝากซักผ้า** `LaundryFinancePanel.tsx` · เทียบเคียงร้านออนไลน์ `EcommerceFinanceClient.tsx`  
**ต้นแบบโดเมน/ฟอร์มรายจ่าย:** ร้านอาหาร `BuildingPosSalesAnalytics` + `BuildingPosCostsPanel` · เครื่องดื่ม · โรงแรม

**กฎย่อย (อ่านคู่กัน):**

| หัวข้อ | ไฟล์กฎ |
|--------|--------|
| โครงหน้า | `dashboard-finance-page-layout.mdc` |
| กรอง + กราฟ | `dashboard-finance-filter-charts-toggle.mdc` |
| แท็บ + สลิป + แถวรายการ | `dashboard-finance-detail-tabs.mdc` |
| หมวดรายจ่าย + ฟอร์ม | `dashboard-expense-cost-categories.mdc` |
| กราฟแท่ง | `app-templates-spark-charts.mdc` |
| สลิป / lightbox / อัปโหลด | `app-templates-media.mdc` · `app-templates-central.mdc` |
| สรุปมือถือ 2 คอลัมน์ | `dashboard-mobile-summary-stat-grid.mdc` |
| รีเฟรชหัวการ์ด | `dashboard-mobile-report-refresh-icon.mdc` |
| ไอคอนแก้ไข/ลบ | `dashboard-row-action-icon-buttons.mdc` |
| ยืนยันก่อนลบ | `AppNoticePopup` / `useAppNoticePopup` จาก `@/components/app-templates` |
| โมดูลซักผ้า (chrome · ปุ่ม · มน) | `laundry-module-dashboard-template.mdc` |

---

## 0) เป้าหมาย UX (สั้น)

ผู้ใช้เห็น **ตัวเลขสรุปทันที** → กรองช่วงเวลาได้ → เปิดกราฟเมื่อต้องการ → สลับ **ประวัติ/รายรับ · รายจ่าย** ในหน้าเดียว → แนบ/ดูสลิปได้ → บันทึกรายจ่ายครบหมวด

**ห้าม** แยกหน้าต้นทุนเป็นทางหลัก · แยกการ์ดกรองกับรายละเอียด · ชิปช่วงเวลาเต็มจอ · placeholder เมื่อซ่อนกรอง/กราฟ · แสดงช่องสลิปว่าง · ใช้ `AppDashboardSection` glass/`rounded-2xl` แทนแผงโมดูล plain

---

## 0b) ความโค้งมน · ปุ่ม · แผง (บังคับ — ยึดซักผ้า)

| ชั้น | ความมน | โทเค็นตัวอย่าง |
|------|--------|----------------|
| **แผงการเงินหลัก** | `rounded-xl` · ขอบ `border-slate-200/90` · พื้นขาว · ไม่ glass | `laundryPanelClass` / `ecommerceStorePanelClass` |
| **การ์ดสรุปตัวเลข** | `rounded-lg` | `*StatInlineClass` |
| **แถวรายรับ/รายจ่าย** | `rounded-lg` · ขอบ slate · พื้นขาว | `laundry` list row / `ecommerceStoreFinanceListRowClass` |
| **กรอบกราฟ** | `rounded-lg` · `border-slate-200/90` · `bg-slate-50/50` | `ecommerceStoreFinanceChartPanelClass` |
| **ปุ่มหัว / กรอง / รีเฟรช / แท็บ** | **`h-9` · `rounded-lg`** · ชุด `*InlineSubNavBtnClass` / `*OutlineButtonClass` | ห้าม `rounded-2xl` / `rounded-full` บนปุ่มเครื่องมือ |
| **ชิปช่วงเวลา · ชิปหมวดรายจ่าย** | **ชุดปุ่ม template เดียวกัน** (`*PrimaryButtonClass` / `*OutlineButtonClass` · **`h-9` · `rounded-lg`**) | `*FinanceRangeChipClass` / `*FilterChipClass` — ห้าม pill glass `px-4 py-2` คนละชุด |

**หัวแผง (ลำดับขวา):** แท็บรายรับ|รายจ่าย → CTA ตามแท็บ (รายจ่ายเพิ่ม / หมวด / ลิงก์ออเดอร์) → เส้นแบ่ง → **ซ่อนกรอง · ซ่อนกราฟ · รีเฟรช** ใน `*InlineSubNavShellClass` เดียวกัน

**ห้าม**

- ห่อทั้งหน้าด้วย `AppDashboardSection` โทน violet/`app-surface`/`rounded-2xl` เป็นแผงหลักการเงิน
- แถวรายการ glass `rounded-[1.25rem]` + gradient ทับแผง plain
- ปุ่มรีเซ็ต/เครื่องมือที่ใช้ความสูงหรือมนคนละชุดกับปุ่มโมดูล (`h-9` / `rounded-lg`)

---

## 1) ลำดับหน้าจอ (บังคับ)

```
[1] แผงการเงินใบเดียว (*PanelClass · rounded-xl)
      ├─ หัว: แท็บรายรับ|รายจ่าย · CTA · กรอง · กราฟ · รีเฟรช
      ├─ สรุปตัวเลข (รายรับ/ช่องทาง · รายจ่าย · สุทธิ)
      ├─ แผงกรอง (ซ่อนได้ · ค่าเริ่มซ่อน)
      ├─ แผงกราฟ (ซ่อนได้ · ค่าเริ่มซ่อน)
      └─ โซนรายการ (คั่น border-t) — ประวัติหรือรายจ่ายตามแท็บ
```

| ชั้น | บังคับ |
|------|--------|
| สรุป | **รายรับ · รายจ่าย · สุทธิ** (หรือแยกช่องทางขายได้) · `grid-cols-2` มือถือ · การ์ดคี่ใบสุดท้าย `col-span-2 sm:col-span-1` · `sm:grid-cols-3` (หรือ 4 ถ้ามีช่องทาง) |
| การ์ดหลัก | กรอง + กราฟ + รายละเอียด **ใบเดียว** — ห้ามสองแผงหลัก |
| ค่าเริ่ม | ช่วง **เดือนนี้** · **กรองซ่อน** · **กราฟซ่อน** |

---

## 2) สีราคา / สีตัวเลข (บังคับ)

| จุด | สี |
|-----|-----|
| **รายรับ / ยอดขาย / ราคาออเดอร์ในประวัติ** | `text-emerald-700` (+ `font-black` / `tabular-nums`) |
| **การ์ดสรุปรายรับ** | ตัวเลข `text-emerald-700` (หรือ emerald-800 ตาม token โมดูล) |
| **รายจ่าย / ต้นทุนในแถวและสรุป** | `text-rose-600` |
| **สุทธิ** | บวก → `#1e1b4b` (หรือโทนเข้ม) · ลบ → `text-rose-800` |
| **ห้าม** | ยอดรายรับเป็นม่วง `#4d47b6` / `#0000BF` / `text-slate-900` เป็นสีหลักของราคา |

ใช้กับ: การ์ดสรุป · แถวประวัติ · แถวรายจ่าย · ยอดรวมในโมดัลชำระ (ถ้าอยู่ในโมดูลเดียวกัน)

---

## 3) แผงกรองช่วงเวลา

### ชิป (บังคับเป็นปุ่มเล็ก)

| ค่า | ป้าย |
|-----|------|
| `TODAY` | วันนี้ |
| `MONTH` | เดือนนี้ (default) |
| `YEAR` | ปีนี้ |
| `CUSTOM` | กำหนดเอง |

- คอนเทนเนอร์: `flex flex-wrap gap-2` · `role="group"` · `aria-label`
- ปุ่ม: **ชุดปุ่ม template โมดูล** (`*FilterChipClass` / primary·outline · **`h-9` · `rounded-lg`**) · ความกว้างตามข้อความ · `aria-pressed`
- **ห้าม** `grid-cols-2 sm:grid-cols-4` + `w-full` บนชิป (ไม่เต็มจอ / ไม่บังคับกว้างเท่ากัน)
- **ห้าม** `h-10` / `h-11` หรือ pill glass คนละชุดกับปุ่มโมดูล

### ช่องพิมพ์

| ชิ้น | เมื่อไหร่ | หมายเหตุ |
|------|----------|----------|
| ตั้งแต่วันที่ / ถึงวันที่ | เฉพาะ `CUSTOM` | `type="date"` · label มองเห็นได้ |
| ค้นหา | เสมอเมื่อเปิดกรอง | placeholder ตามโดเมน · label มองเห็นได้ |
| **รีเซ็ต · เดือนนี้** | **เฉพาะเมื่อมีเงื่อนไขกรองค้าง** (ช่วง ≠ เดือนนี้ หรือมีวันที่/คำค้น) | ห้ามโชว์ตลอด |

- ความสูงช่องพิมพ์ = ปุ่มโมดูล: **`h-9` · `rounded-lg`** (`*FieldClass`)
- **`sm+`:** วันที่ + ค้นหา + รีเซ็ต **แถวเดียวกัน** (`flex-row flex-wrap items-end`)
- มือถือ: เรียงแนวตั้งได้
- ข้อความสถานะสั้นได้ เช่น `กำลังดู: เดือนนี้`
- **ห้าม** select ปี/เดือน/วัน แยกชั้นแทนชิป
- ปุ่มรีเซ็ตใช้ `*OutlineButtonClass` / `*CompactOutlineButtonClass` — **ห้าม** คลาสคนละชุดกับปุ่มโมดูล

### ซ่อนกรอง / ซ่อนกราฟ

- คนละปุ่มที่หัวแผง (`aria-expanded` · `aria-controls`) — คู่กับรีเฟรชใน shell เดียวกัน
- ปุ่มกรองมี **badge จุด** ได้เมื่อมีเงื่อนไขค้าง
- **ขณะซ่อน — ไม่มี** กล่อง dashed / ข้อความ «ตัวกรองถูกซ่อน» / «กราฟถูกซ่อน»

รายละเอียดเพิ่ม: **`dashboard-finance-filter-charts-toggle.mdc`**

---

## 4) กราฟ (เมื่อเปิดแผง)

ลำดับแนะนำ (ร้านอาหารต้นแบบ):

1. `AppRevenueCostColumnChart` — รายรับเทียบรายจ่าย · `compact`
2. `AppColumnBarSparkChart` — ยอดขายรายช่วง · `variant="brand"` · `compact`
3. เปรียบเทียบหมวด/โต๊ะ (ถ้ามี) — แท่งแนวตั้ง · `lg+` สองคอลัมน์ได้ · `AppSparkChartsTwoColumnGrid` / `AppSparkChartPanel`

- Import จาก `@/components/app-templates` เท่านั้น — **`app-templates-spark-charts.mdc`**
- **ห้าม** แถว «สรุปช่วงที่กรอง» หรือปุ่ม «+ รายจ่าย» **เหนือกราฟ** — CTA รายจ่ายอยู่ที่แท็บรายจ่ายเท่านั้น

---

## 5) แถบรายละเอียด 2 แท็บ

| ลำดับ | แท็บ | เนื้อหา |
|-------|------|---------|
| 1 | **ประวัติ / รายรับ** | ออเดอร์ · ขาย · เข้าพัก ตามกรอง |
| 2 | **รายจ่าย** | ต้นทุน + หมวด + ฟอร์ม |

- แท็บอยู่ที่**หัวแผง** (คู่เครื่องมือ) — แผงเนื้อหาอยู่ใต้กรอง/กราฟ คั่น `border-t`
- `<nav role="tablist">` · ปุ่ม `role="tab"` · แผง `role="tabpanel"` · `aria-selected` · `aria-controls`
- เปลือก: `*InlineSubNavShellClass` · ปุ่ม `*InlineSubNavBtnClass` (`h-9` · `rounded-lg`) — **ห้าม** แท็บเต็มความกว้าง `min-h-[44px] flex-1` ถ้าโมดูลใช้ชุดซักผ้าแล้ว
- URL เก่า (เช่น `?fin=costs`) → เปิดแท็บรายจ่ายในหน้าเดิมได้

รายละเอียด: **`dashboard-finance-detail-tabs.mdc`**

---

## 6) สลิป + เลย์เอาต์แถวรายการ

| มี URL สลิป | ไม่มี |
|-------------|-------|
| **`AppLabeledImageThumb` `kind="slip"`** + `AppImageLightbox` | **ไม่แสดง**ช่องว่าง / empty / «ไม่มีสลิป» |

เลย์เอาต์แถวหลัก (มือถือ+เดสก์ท็อป):

```
[สลิปย่อ+ป้าย?]  [เนื้อหา min-w-0 flex-1]  [ราคา shrink-0 text-right]  [ไอคอนแก้ไข/ลบ]
```

- ใช้ `flex items-start gap-2` — **หลีกเลี่ยง `flex-wrap`** ที่ดันราคาลงบรรทัดใหม่
- ราคาขวาสุดของบล็อคเนื้อหา · สีตาม §2
- Import จาก `@/components/app-templates` เท่านั้น — กฎเต็ม: **`app-templates-slip-labeled-thumb.mdc`**

---

## 6b) แก้ไข / ลบ — แท็บ **ประวัติ / รายรับ** (บังคับ · ห้ามข้าม)

แท็บ **ประวัติ / รายรับ** ต้องไม่ใช่รายการอ่านอย่างเดียว

| บังคับ | รายละเอียด |
|--------|------------|
| **แก้ไข** | ทุกแถวรายรับมีปุ่มไอคอนดินสอ · เปิด `FormModal` แก้ฟิลด์ที่โดเมนอนุญาต · **รวมรูปสลิป** (ดูตัวอย่าง · ลบสลิป · อัปโหลด/ถ่ายใหม่) · PATCH/API · รีเฟรช |
| **ลบ** | ทุกแถวมีปุ่มไอคอนถัง · **ยืนยันด้วย `useAppNoticePopup().confirm` ก่อน** · แล้ว DELETE |
| **วางปุ่ม** | ชิดขวากับราคา (`shrink-0`) · ไอคอนตาม **`dashboard-row-action-icon-buttons.mdc`** · มี `aria-label` |
| **สีราคา** | รายรับ `text-emerald-700` |

### สลิปในฟอร์มแก้ไขรายรับ (บังคับเมื่อโดเมนมีสลิป)

ฟอร์มแก้ไขรายรับต้องมีบล็อกสลิปเหมือนรายจ่าย:

1. ถ้ามี URL เดิม → แสดง **`AppLabeledImageThumb` `kind="slip"`** + ปุ่ม **ลบสลิป** (เคลียร์ URL ในฟอร์ม)  
2. ปุ่ม gallery/camera จาก `AppGalleryCameraFileInputs` + `AppImagePickCameraButtons` + `prepareImageFileForUpload`  
3. บันทึกส่ง `paymentSlipUrl` / `payment_slip_url` (ว่าง = ลบออกจากรายการ)  
4. Import media จาก `@/components/app-templates` เท่านั้น

### ตัวอย่างฟิลด์แก้ไขตามโดเมน (อย่างน้อยหนึ่งชุด — ต้องโหลดข้อมูลครบแล้วแก้ได้)

ฟอร์มแก้ไขรายรับต้อง **ดึงข้อมูลเดิมครบ** แล้วให้แก้/เพิ่ม/ลบตามโดเมน — ห้ามเหลือแค่ชื่อ+ยอดหรือหมายเหตุอย่างเดียว

| โมดูล | แก้ได้ (ขั้นต่ำ) | ลบ |
|-------|------------------|-----|
| ร้านอาหาร | ลูกค้า · โต๊ะ · **เบอร์โทร** · **วัน–เวลา** · สถานะ · **เมนู (เพิ่ม/ลดจำนวน/ลบ)** · หมายเหตุ · **สลิป** | ออเดอร์ |
| เครื่องดื่ม | **เบอร์โทร** · **วัน–เวลา** · **รายการสินค้า (เพิ่ม/ลด/ลบ + ขนาด)** · ช่องทางชำระ · หมายเหตุ · **สลิป** | บิลขาย (`/api/drink-pos/sales/[id]`) |
| โรงแรม | ชื่อแขก · เบอร์ · **ห้อง** · **เช็คอิน/เช็คเอาท์** · สถานะ · ช่องทางชำระ · ยอดรวม/ชำระ · หมายเหตุ · **สลิป** | การจอง |
| สนามฟุตบอล (ประวัติการเงิน) | จอง / สิทธิ์โปร (เปิดโมดัลเดิม · สลิปตามโมดัลจอง) | จอง / โปร / รายจ่าย |

### ยืนยันลบ — template กลางเท่านั้น

```tsx
const notice = useAppNoticePopup();
// ใน JSX ราก: {notice.popup}
const ok = await notice.confirm(`ลบรายการ «${label}» ใช่หรือไม่?`);
if (!ok) return;
await deleteApi(...);
```

| ทำ | ห้าม |
|----|------|
| `await notice.confirm("…")` ก่อนลบรายรับ · รายจ่าย · หมวด | `window.confirm` / `confirm()` / `alert` |
| `{notice.popup}` ในต้นไม้คอมโพเนนต์ | แถวประวัติไม่มีปุ่มแก้ไขหรือไม่มีปุ่มลบ |
| error → `notice.error(…)` หรือข้อความใน UI | ลบทันทีโดยไม่ถาม |

แท็บ **รายจ่าย** ก็ต้องแก้ไข+ลบเช่นกัน (ดู §7 + `dashboard-expense-cost-categories.mdc`)

---

## 7) แท็บรายจ่าย — ฟอร์มต้นแบบร้านอาหาร

ลำดับฟิลด์ใน `FormModal` + **`mobileCentered`**:

1. หมวดหมู่  
2. รายละเอียดรายการ  
3. จำนวนเงิน (บาท)  
4. หมายเหตุ (ไม่บังคับ)  
5. รูปสลิป (ไม่บังคับ) — gallery/camera · preview thumb · ลบสลิป  

- ปุ่ม **หมวดหมู่** + **+ รายจ่าย** อยู่ที่แท็บรายจ่าย (ไม่เหนือกราฟ)
- ชิปกรองหมวด: ทั้งหมด + แต่ละหมวด
- Schema/API: **`dashboard-expense-cost-categories.mdc`** (`paymentSlipUrl` บน cost entry)

| โมดูล | คอมโพเนนต์ |
|-------|------------|
| ร้านอาหาร | `BuildingPosCostsPanel` (**ต้นแบบ**) |
| เครื่องดื่ม | `DrinkPosCostsPanel` |
| โรงแรม | ฟอร์มใน `HotelResortFinanceClient` |

---

## 8) API / ข้อมูล (แนวทางโมดูลใหม่)

| ชิ้น | แนวทาง |
|------|--------|
| สรุปช่วง | `GET /api/{module}/finance-summary?range=TODAY\|MONTH\|YEAR\|CUSTOM&from=&to=` (หรือเทียบเท่า) |
| เขตเวลา | กรองวันที่ตาม **Asia/Bangkok** |
| รายรับ | เก็บ `paymentSlipUrl` ได้เมื่อมีสลิปชำระ |
| หมวดรายจ่าย | `XxxCostCategory` · CRUD |
| รายจ่าย | `XxxCostEntry` + `categoryId` + `paymentSlipUrl` · POST/PATCH/DELETE |
| ลบหมวดที่มีรายการ | **409** |

หลังแก้ schema: `npx prisma migrate deploy` → **`npx prisma generate`** ตาม `agent-finish-checkpoint.mdc`

---

## 9) หัวแผง — ปุ่มเครื่องมือ

จัดแถวเดียวขวาสุดของหัวแผง (ไม่บังคับ `AppSectionHeader` — ซักผ้าใช้ `h2` + กลุ่มปุ่ม):

1. แท็บ **รายรับ | รายจ่าย**  
2. CTA ตามแท็บ (เช่น รายจ่ายเพิ่ม · หมวดหมู่ · ลิงก์ออเดอร์)  
3. แสดง/ซ่อนกรอง (มี badge เมื่อกรองค้าง)  
4. แสดง/ซ่อนกราฟ  
5. รีเฟรช — มือถือไอคอน · `sm+` ไอคอน+ข้อความ · `aria-label`

คลาสปุ่ม: ชุดโมดูล `*InlineSubNavBtnClass` / `*OutlineButtonClass` — **`h-9` · `rounded-lg`** · มือถือซ่อนข้อความยาวด้วย `hidden sm:inline`

---

## 10) อ้างอิงไฟล์ที่ทำแล้ว

| โมดูล | ไฟล์หลัก |
|-------|----------|
| **ซักผ้า (UX chrome)** | `LaundryFinancePanel.tsx` · `LaundryCostPanel` · `LaundryRevenuePanel` |
| **ร้านออนไลน์** | `EcommerceFinanceClient.tsx` · `EcommerceCostsPanel` |
| POS ร้านอาหาร | `BuildingPosSalesAnalytics.tsx` · `BuildingPosCostsPanel.tsx` |
| POS เครื่องดื่ม | `DrinkPosSalesClient.tsx` · `DrinkPosCostsPanel.tsx` |
| โรงแรมรีสอร์ท | `HotelResortFinanceClient.tsx` |

โดเมนโรงแรมเพิ่มเติม: `hotel-resort-finance.mdc`

---

## 11) เช็กลิสต์โมดูลใหม่ / ปรับให้ตรงแม่แบบ

### โครง + สรุป + chrome
- [ ] แผงหลัก `rounded-xl` plain — ไม่ใช่ `AppDashboardSection` glass/`rounded-2xl`
- [ ] สรุปตัวเลข · สีราคาตาม §2 · กริดมือถือ 2 คอลัมน์ · การ์ดสรุป `rounded-lg`
- [ ] แถวรายการ `rounded-lg` · กราฟในกรอบ `rounded-lg`
- [ ] ปุ่มเครื่องมือ/แท็บ/รีเซ็ตชุด `h-9` · `rounded-lg`

### กรอง
- [ ] ชิป วันนี้/เดือนนี้/ปีนี้/กำหนดเอง เป็น **pill `h-9`** (`flex-wrap`) ไม่เต็มจอ
- [ ] default เดือนนี้ · กรองซ่อน · กราฟซ่อน
- [ ] วันที่เฉพาะ CUSTOM · ค้นหา · รีเซ็ตเฉพาะเมื่อกรองค้าง
- [ ] ช่องพิมพ์สูงเท่าปุ่มโมดูล · `sm+` แถวเดียว
- [ ] คนละปุ่มซ่อนกรอง/กราฟ · ซ่อนแล้วไม่มี placeholder

### กราฟ + แท็บ
- [ ] กราฟจาก `app-templates` · `compact` · ไม่มี CTA รายจ่ายเหนือกราฟ
- [ ] แท็บประวัติ/รายรับ · รายจ่าย ที่หัวแผง + a11y tablist

### สลิป + แถว
- [ ] สลิปเฉพาะเมื่อมี URL · lightbox จาก app-templates
- [ ] ราคาขวาสุด · ไม่ wrap หลุดบนมือถือ · สี emerald/rose

### แก้ไข / ลบ
- [ ] **แท็บประวัติ / รายรับ:** ทุกแถวมีปุ่มแก้ไข + ลบ (ห้ามอ่านอย่างเดียว)
- [ ] ฟอร์มแก้ไขโหลดข้อมูลโดเมนครบ (ห้อง/วันที่ · เมนู/สินค้า · เบอร์ · ฯลฯ) ไม่ใช่แค่ยอด/หมายเหตุ
- [ ] ฟอร์มแก้ไขรายรับมีสลิป: ดูย่อ · ลบ · อัปโหลด/ถ่ายใหม่
- [ ] **แท็บรายจ่าย:** มีแก้ไข + ลบ (+ สลิปในฟอร์ม)
- [ ] ลบทุกรายการใช้ `useAppNoticePopup().confirm` — ห้าม `window.confirm`
- [ ] ไอคอนตาม `dashboard-row-action-icon-buttons.mdc` · มี `{notice.popup}`
- [ ] ราคาประวัติรายรับเป็น emerald · รายจ่ายเป็น rose

### รายจ่าย
- [ ] ฟอร์ม 5 ช่องตามร้านอาหาร · หมวด CRUD · `paymentSlipUrl`
- [ ] ชิปกรองหมวด


================================================================================
### .cursor/rules/dashboard-finance-page-layout.mdc
================================================================================

---
description: หน้าการเงินแดชบอร์ด — ตัวเลขสรุปบนสุด · กรอง+กราฟ+รายละเอียดการ์ดเดียว · สีราคา emerald/rose
globs:
  - "**/systems/**/**Finance*"
  - "**/systems/**/**Sales*"
  - "**/systems/building-pos/**Sales*"
  - "**/systems/drink-pos/**Sales*"
  - "**/systems/hotel-resort/**Finance*"
  - "**/dashboard/**/finance/**"
  - "**/dashboard/**/sales/**"
alwaysApply: false
---

# การเงิน — โครงหน้ามาตรฐาน (ข้ามโมดูล)

เมื่อโมดูลมีหน้า **การเงิน / ยอดขาย / รายงานการเงิน**:

**แม่แบบครบชุด (อ่านก่อนทำโมดูลใหม่):** **`dashboard-finance-module-template.mdc`**

**คู่กับ:** `dashboard-finance-filter-charts-toggle.mdc` · `dashboard-finance-detail-tabs.mdc` · `dashboard-expense-cost-categories.mdc` · `app-templates-spark-charts.mdc` · `app-templates-media.mdc` · `dashboard-mobile-summary-stat-grid.mdc`

---

## 1) ลำดับหน้าจอ (บังคับ)

```
[1] ตัวเลขสรุป — ด้านบนสุด (นอกหรือก่อนการ์ดหลัก)
[2] การ์ดเดียว «การเงิน» — กรอง · กราฟ(ซ่อนได้) · รายละเอียด
```

| ชั้น | เนื้อหา | หมายเหตุ |
|------|---------|----------|
| **บนสุด** | การ์ด/แถวสรุป **รายรับ · รายจ่าย · สุทธิ** (หรือรายได้·ต้นทุน·กำไร) | **ไม่** ถูกปุ่มซ่อนกราฟ · `grid-cols-2` มือถือ · การ์ดคี่ใบสุดท้าย `col-span-2 sm:col-span-1` · `sm:grid-cols-3` |
| **การ์ดหลักใบเดียว** | หัวการ์ด (แสดง/ซ่อนกรอง · แสดง/ซ่อนกราฟ · รีเฟรช) → แผงกรอง → แผงกราฟ → **แถบรายละเอียด + รายการ** | ห้ามแยกกรอง/กราฟ กับรายละเอียดเป็นคนละ `AppDashboardSection` |

**ค่าเริ่ม:** ช่วง **เดือนนี้** · กรอง**ซ่อน** · กราฟ**ซ่อน**

**ห้าม**

- แยกการ์ด «ช่วงเวลาและกราฟ» กับ «ประวัติ/รายละเอียด» เป็นสองใบเมื่อเป็นหน้าการเงินเดียวกัน
- ซ่อนตัวเลขสรุปเมื่อกดซ่อนกราฟ
- แยกหน้าต้นทุน/รายจ่ายเป็น hub sub-tab หรือ URL คนละหน้าเป็นทางหลัก
- แถว «สรุปช่วงที่กรอง» / ปุ่ม «+ รายจ่าย» เหนือกราฟ (CTA อยู่แท็บรายจ่าย)

---

## 2) สีตัวเลขสรุปและราคา (บังคับ)

| ชนิด | คลาสแนะนำ |
|------|-----------|
| รายรับ / ยอดในประวัติ | `text-emerald-700` + `font-black tabular-nums` |
| รายจ่าย / ต้นทุน | `text-rose-600` + `font-black tabular-nums` |
| สุทธิ ≥ 0 | `#1e1b4b` (หรือโทนเข้มโมดูล) |
| สุทธิ < 0 | `text-rose-800` |

**ห้าม** ใช้ม่วงแบรนด์ (`#4d47b6` / `#0000BF`) หรือ `text-slate-900` เป็นสีหลักของ**ยอดเงินรายรับ**

---

## 3) ในกร์ดหลัก

1. **กรอง + กราฟ** — ตาม `dashboard-finance-filter-charts-toggle.mdc`  
   - ชิปช่วงเวลาเป็น **ปุ่ม pill เล็ก** ไม่เต็มจอ  
   - คนละปุ่มซ่อน · กราฟซ่อนเฉพาะแผนภูมิ · ไม่มี placeholder เมื่อซ่อน  
2. **รายละเอียด** — แถบ **ประวัติ / รายรับ · รายจ่าย** ตาม `dashboard-finance-detail-tabs.mdc` (อยู่**ใต้**กรอง/กราฟ · คั่น `border-t` ได้)
3. **สลิป** — แสดงเฉพาะเมื่อมี URL · กดดู lightbox (`app-templates`)
4. **แท็บประวัติ / รายรับ** — ทุกแถว **แก้ไข + ลบ** (ไอคอน · `useAppNoticePopup` ก่อนลบ) — ห้ามรายการอ่านอย่างเดียว · ดู `dashboard-finance-module-template.mdc` §6b
5. **แท็บรายจ่าย** — แก้ไข + ลบ เช่นกัน
6. ปุ่ม CTA รายจ่ายอยู่แท็บรายจ่าย — ไม่ `Link` ไปหน้าแยก

ชื่อหัวการ์ดแนะนำ: **การเงิน**

---

## 4) อ้างอิงที่ทำแล้ว

| โมดูล | ไฟล์ |
|-------|------|
| POS ร้านอาหาร | `BuildingPosSalesAnalytics.tsx` · `BuildingPosCostsPanel.tsx` |
| โรงแรมรีสอร์ท | `HotelResortFinanceClient.tsx` |
| POS เครื่องดื่ม | `DrinkPosSalesClient.tsx` · `DrinkPosCostsPanel.tsx` |
| สนามฟุตบอล | `FootballTurfDashboard.tsx` (ประวัติรายรับจอง/โปร + รายจ่าย) |

โมดูลใหม่: ทำตาม **`dashboard-finance-module-template.mdc`** เช็กลิสต์ท้ายไฟล์

## เช็กลิสต์

- [ ] ตัวเลขสรุปอยู่ด้านบนสุด · สี emerald / rose ตาม §2 · เห็นได้แม้ซ่อนกราฟ
- [ ] กรอง + กราฟ + รายละเอียดอยู่ `AppDashboardSection` ใบเดียว
- [ ] แถบประวัติ/รายรับ · รายจ่าย (2 แท็บ)
- [ ] สลิปเฉพาะเมื่อมี + lightbox
- [ ] **ประวัติ / รายรับ:** แก้ไข + ลบทุกแถว · ลบผ่าน `useAppNoticePopup().confirm`
- [ ] รายจ่าย: แก้ไข + ลบเช่นกัน
- [ ] ไม่มีหน้า/hub sub-tab ต้นทุนแยกเป็นทางหลัก
- [ ] ไม่มี CTA รายจ่ายเหนือกราฟ


================================================================================
### .cursor/rules/dashboard-history-card-grid.mdc
================================================================================

---
description: รายการแดชบอร์ดแบบการ์ด (ประวัติ / ช่องจอด ฯลฯ) — มือถือ 1 คอลัมน์ เดสก์ท็อป 2 คอลัมน์
globs:
  - "src/systems/parking/**/*.{ts,tsx}"
  - "src/app/**/dashboard/**/parking/**/*.tsx"
alwaysApply: false
---

# กริดการ์ดรายการแดชบอร์ด (ประวัติ / ช่องจอด — card grid)

ใช้กับ **รายการที่แสดงเป็นการ์ดในกริด** เช่น ประวัติการจอดรถ (`ParkingHistorySessionList`) และ **รายการช่องจอด** (`ParkingSpotsGridList`) — โทนเดียวกับแผงรายการคาร์แคร์

## บังคับ — breakpoint

| Viewport | พฤติกรรม |
|----------|----------|
| **มือถือ / แคบ** (`default`, ก่อน `md`) | **`grid-cols-1`** — หนึ่งการ์ดต่อแถว (แนวตั้งคอลัมน์เดียว) |
| **เดสก์ท็อป / แท็บเล็ตแนวนอน** (`md` ขึ้นไป) | **`md:grid-cols-2`** — **สองคอลัมน์** (สองการ์ดต่อแถว) |

## ห้าม (ยกเว้นผู้ใช้ระบุชัด)

- **ห้าม** ใส่ `xl:grid-cols-3` หรือเพิ่มคอลัมน์ที่ 3 ในรายการแบบนี้โดยไม่ได้ร้องขอ — ค่าเริ่มต้นโปรเจกต์คือ **2 คอลัมน์บนจอใหญ่** เพื่อให้การ์ดอ่านง่ายและสอดคล้องที่จอดรถ / คาร์แคร์

## เทมเพลต Tailwind (รายการห่อ `ul`)

```tsx
<ul className="grid grid-cols-1 gap-3 p-1 md:grid-cols-2 md:gap-4" aria-label="…">
```

- ระยะห่าง: `gap-3` มือถือ · `md:gap-4` จอใหญ่
- **ไม่ใช้** `divide-y` เป็นหลักเมื่อเป็นกริดการ์ด — ใช้ **`gap`** แทน

## เปลือกเลื่อน (scroll shell) คู่กับกริด

- มือถือ: อาจมี `max-h-[…] overflow-y-auto` + กรอบ glass (`rounded-2xl border-white/55 bg-white/35 backdrop-blur-xl`) เหมือน `CarWashSalesPanel`
- ตั้งแต่ `md`: ถอดกรอบซ้ำของเปลือก (`md:border-0 md:bg-transparent md:max-h-none md:overflow-visible`) ให้การ์ดอยู่ใต้ `AppDashboardSection` โดยไม่การ์ดซ้อนการ์ด

## อ้างอิงโค้ด

- `src/systems/parking/components/ParkingHistorySessionList.tsx`
- `src/systems/parking/components/ParkingSpotsGridList.tsx`

## หมายเหตุ (OpenClaw / agent อื่น)

ไฟล์นี้อยู่ใน `.cursor/rules/` — แก้เฉพาะเมื่อเปลี่ยนสัญญากริดประวัติโมดูลนี้หรือคัดลอกแพทเทิร์นไปโมดูลใหม่


================================================================================
### .cursor/rules/dashboard-menu-categories-popup.mdc
================================================================================

---
description: หมวดหมู่ในหน้าเมนูแดชบอร์ด — ปุ่ม popup จัดการ + ชิปกรองตามหมวด (แบบ drink-pos)
globs:
  - "**/systems/building-pos/**"
  - "**/systems/drink-pos/**"
  - "**/dashboard/**/menu/**"
alwaysApply: false
---

# หมวดหมู่เมนู — ปุ่ม + popup + กรองชิป (มาตรฐาน)

เมื่อหน้า**เมนู / รายการสินค้า** มีการจัดการหมวดหมู่:

## 1) ปุ่ม + popup จัดการ

1. **ห้าม** แยกแท็บย่อย «หมวดหมู่» เป็นหน้าเต็มอีกหน้า — รวมไว้ในหน้าเมนูหลัก
2. มีปุ่ม **`หมวดหมู่`** ที่หัวการ์ดเมนู (คู่กับปุ่มเพิ่มเมนู) — กดแล้วเปิด **`FormModal`** (`mobileCentered`)
3. ใน popup ต้องทำได้ครบ:
   - **ดูรายการ** หมวดทั้งหมด (เลื่อนได้ถ้ายาว)
   - **เพิ่ม** — ปุ่มใน footer → สลับเป็นฟอร์มในโมดัลเดียวกัน
   - **แก้ไข** — ไอคอนแก้ไขแถวขวา → ฟอร์มในโมดัลเดียวกัน
   - **ลบ** — ไอคอนลบแถวขวา + ยืนยัน
4. หลังบันทึกเพิ่ม/แก้ไข — **กลับหน้ารายการใน popup** (อย่าปิด popup ทั้งก้อนเว้นแต่ผู้ใช้กดปิด)
5. URL เก่า `?menu=categories` / `?tab=categories` ให้ redirect ไปหน้าเมนูหลัก

## 2) กรองรายการตามหมวด (บังคับ — แบบร้านเครื่องดื่ม)

1. ใต้หัวการ์ดเมนู มีแถบ **ชิปหมวด** เลื่อนแนวนอนบนมือถือ (`overflow-x-auto` + `w-max` + `gap-2`)
2. ชิปแรก = **ทั้งหมด** · ตามด้วยชื่อหมวดทุกอัน
3. ชิปที่เลือกใช้โทเค็น active ของโมดูล (เช่น `buildingPosChipActiveClass` / `drinkPosChipActiveClass`) · ชิปอื่น = idle
4. กรองรายการเมนู/สินค้าตาม `category_id` ของชิปที่เลือก — ค่าว่าง/ทั้งหมด = แสดงทุกรายการ
5. ว่างหลังกรอง: `AppEmptyState` ข้อความชัด (เช่น «ไม่มีเมนูในหมวดนี้»)
6. ลบหมวดที่กำลังกรองอยู่ → รีเซ็ตชิปเป็น **ทั้งหมด**
7. ชิปมี `aria-pressed` และกลุ่มมี `aria-label` เช่น `กรองตามหมวดหมู่`

## อ้างอิงโค้ด

- POS ร้านอาหาร: `BuildingPosDashboardClient.tsx` — `openCatManage` · `filterCat` · ชิปกรอง
- POS เครื่องดื่ม: `DrinkPosDashboardClient.tsx` — `filterCat` + แถบชิปใต้หัวการ์ด

## เช็กลิสต์

- [ ] ปุ่ม «หมวดหมู่» บนหน้าเมนู
- [ ] popup รายการ + เพิ่ม/แก้ไข/ลบ
- [ ] ชิปกรอง «ทั้งหมด» + แต่ละหมวด
- [ ] ไม่มีหน้า/แท็บย่อยหมวดแยก
- [ ] `FormModal` มี `mobileCentered`


================================================================================
### .cursor/rules/dashboard-mobile-compact-wrap.mdc
================================================================================

---
description: มือถือแดชบอร์ด — ย่อขนาดมาตรฐาน + แถวที่ล้นให้ขึ้นบรรทัดถัดไป (ห้ามยัดเลื่อนแนวนอนเป็นหลัก)
globs:
  - "**/systems/**/*Dashboard*.tsx"
  - "**/systems/**/components/**/*.tsx"
  - "**/app/(dashboard)/**/*.tsx"
  - "**/components/app-templates/**"
alwaysApply: true
---

# มือถือแดชบอร์ด — ขนาดมาตรฐาน · ห่อแถวเมื่อล้น

ใช้กับหัวการ์ด · แท็บย่อย · ชิปกรอง · ปุ่มไอคอนแอ็กชัน ในโมดูลแดชบอร์ด (สนามฟุตบอลเป็นต้นแบบ)

## บังคับ — ลดขนาดอัตโนมัติบนมือถือ (`default` / ก่อน `sm`)

ใช้ขนาดกระชับตามมาตรฐาน UI มือถือ (ไม่ใช้ปุ่ม/ตัวอักษรใหญ่เกินจำเป็นบนจอแคบ):

| องค์ประกอบ | มือถือ | `sm+` |
|------------|--------|-------|
| ปุ่มไอคอนหัวการ์ด | `h-9 w-9` (36px) · ไอคอน `h-4 w-4` | `min-h-10` · ขยายมีข้อความได้ |
| แท็บ / pill | `min-h-8` · `text-[11px]` · `px-2` · `rounded-lg` | `min-h-9` · `text-xs` · `px-3.5` |
| ชิปกรองสถานะ | `min-h-8` · `text-[11px]` | `min-h-9` · `text-xs` |
| หัวข้อแผง | `text-base`–`text-lg` (อย่าบังคับ `text-xl`+ บนมือถือ) | ตามโทนโมดูล |
| การ์ดรายการ | padding `p-3` · มุม `rounded-[1.25rem]` | `p-4`/`p-5` · `rounded-[1.5rem]` |
| ช่องว่างแถว | `gap-1.5` | `gap-2` |

โทเค็นสนามฟุตบอล: `footballTurfHeaderIconButtonClass` · `footballTurfMobileFilterIconButtonClass` · `footballTurfSubTabPillClass` · `footballTurfPanelCardClass`

## บังคับ — ข้อความ/ไอคอนเกินแถว → ขึ้นแถวถัดไป

1. **ห้าม** ยัดทุกอย่างในแถวเดียวด้วย `flex-nowrap` + `overflow-x-auto` เป็นทางแก้หลักเมื่อเนื้อหาล้น  
2. **ใช้** `flex-wrap` (หรือ `content-start`) ให้รายการที่เกิน **ขึ้นบรรทัดใหม่** โดยอัตโนมัติ  
3. แถวหัวการ์ด: `footballTurfHeaderActionRowClass` (= wrap บนมือถือ · `sm:flex-nowrap` เมื่อพื้นที่พอ)  
4. แถบแท็บ: `footballTurfSubTabShellClass` / `footballTurfCourtTabShellClass` (= `flex-wrap`)  
5. ชิปกรอง: `footballTurfChipWrapRowClass`  
6. ลำดับความสำคัญเมื่อแคบ: **หัวข้อซ้าย** · **ปุ่มแอ็กชันขวา** · ถ้าแท็บยาว → **แถวถัดไปเต็มความกว้าง** (`footballTurfSubTabMobileRowClass`)

```tsx
{/* ✅ ห่อเมื่อล้น */}
<div className={footballTurfHeaderActionRowClass}>
  <nav className={footballTurfSubTabShellClass}>…</nav>
  <button className={footballTurfMobileFilterIconButtonClass}>…</button>
  <button className={footballTurfHeaderIconButtonClass}>…</button>
</div>

{/* ❌ บังคับแถวเดียวแล้วเลื่อนแนวนอนเป็นหลัก */}
<div className="flex flex-nowrap overflow-x-auto">…</div>
```

## ข้อยกเว้นเลื่อนแนวนอน

อนุญาต `overflow-x-auto` เฉพาะเมื่อเป็น **แกนเลื่อนของเนื้อหา** จริง (เช่น กราฟแท่งรายวัน `AppColumnBarSparkChart`, แกลเลอรีรูป) — ไม่ใช้กับเมนูแท็บ/ชิป/ปุ่มหัวการ์ด

## ข้อยกเว้นภาพรวมสนามฟุตบอล (มือถือ)

แถบเลือกสนาม + กรองสถานะใน **ตารางเวลาจองรายสนาม** → **dropdown** ไม่ใช่ wrap — ดูกฎ `football-turf-overview-mobile-dropdown.mdc`

## ตรวจก่อนจบงาน UI มือถือ

- [ ] แท็บ/ชิป/ปุ่มหัวการ์ดใช้ขนาดมือถือย่อตามตาราง  
- [ ] แถวแอ็กชัน + แท็บห่อ (`flex-wrap`) เมื่อล้น — **ยกเว้น** ภาพรวมตาราง (dropdown)  
- [ ] ไม่มีแถบเลื่อนแนวนอนซ่อนเป็นทางแก้หลักของเมนู  
- [ ] ปุ่มมี `aria-label` เมื่อเป็นไอคอนล้วน  

## อ้างอิง

- `src/systems/football-turf/lib/ui-tokens.ts`
- `FootballTurfDashboard.tsx` — โปรโมชัน · ลูกค้า · ตั้งค่า · ตารางเวลาจอง  
- คู่กับ: `dashboard-module-settings-single-row-tabs.mdc` · `dashboard-mobile-filter-icon.mdc` · `football-turf-overview-mobile-dropdown.mdc`


================================================================================
### .cursor/rules/dashboard-mobile-filter-icon.mdc
================================================================================

---
description: ฟอร์มกรองบนมือถือเป็นไอคอน + ต้องมีปุ่มแสดง/ซ่อนกรองทุก breakpoint (ดูกฎ list filter)
alwaysApply: true
---

# Mobile filter pattern (dashboard modules)

**กฎเต็ม (รายการ · แสดง/ซ่อน · ชิป · ค้นหา):** **`dashboard-module-list-filter.mdc`**  
หน้าการเงิน: **`dashboard-finance-filter-charts-toggle.mdc`**

เมื่อมี **ฟอร์ม/แผงกรองข้อมูล** ในหน้าแดชบอร์ด:

## บังคับ

1. มีปุ่ม **แสดงกรอง / ซ่อนกรอง** ควบคุมแผงด้วย `filterOpen` — **ทุกขนาดจอ** (ห้ามเดสก์ท็อปโชว์แผงถาวรโดยไม่มีปุ่มซ่อน)
2. **มือถือ:** ไอคอน funnel อย่างเดียว · `aria-label` เช่น `"แสดงตัวกรอง"` / `"ซ่อนตัวกรอง"` · `min-h-[40px]` (แนะนำ `min-w-[40px]`)
3. **`sm+`:** ไอคอน + ข้อความ `แสดงกรอง` / `ซ่อนกรอง`
4. เมื่อกดแล้วสลับแผงกรอง (`block` / `hidden`) — ไม่บังคับ `sm:block` ให้แผงเปิดค้าง
5. Badge จุดบนปุ่มเมื่อ**มีการกรองค้าง** และแผงถูกซ่อน
6. ถ้ามีปุ่ม **เพิ่มรายการ** คู่กัน — ดูกฎ **`dashboard-mobile-list-header-actions.mdc`** (กรองก่อน · เพิ่มขวาสุด)

## ตัวอย่างปุ่ม

```tsx
<button
  type="button"
  aria-expanded={filterOpen}
  aria-controls="…-filter-panel"
  aria-label={filterOpen ? "ซ่อนตัวกรอง" : "แสดงตัวกรอง"}
  className={cn(
    appTemplateOutlineButtonClass,
    "relative inline-flex min-h-[40px] min-w-[40px] items-center justify-center gap-1.5 sm:min-w-0 sm:px-3",
    filterOpen && "border-[#0000BF]/45 bg-[#0000BF]/10 ring-2 ring-[#0000BF]/20",
    filtersActive && !filterOpen && "border-amber-300/80 bg-amber-50/90",
  )}
  onClick={() => setFilterOpen((o) => !o)}
>
  <FilterIcon className="h-5 w-5" aria-hidden />
  <span className="hidden sm:inline">{filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}</span>
  {filtersActive ? <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full …" aria-hidden /> : null}
</button>

<div id="…-filter-panel" className={cn("space-y-3", filterOpen ? "block" : "hidden")}>
  {/* ชิป + ช่องค้นหา */}
</div>
```

## ห้าม

```tsx
{/* ❌ เดสก์ท็อปโชว์แผงตลอด โดยไม่มีปุ่มซ่อน */}
<div className={cn(filterOpen ? "block" : "hidden", "sm:block")}>…</div>

{/* ❌ ปุ่มกรองเฉพาะมือถือ */}
<button className="sm:hidden" … />
```


================================================================================
### .cursor/rules/dashboard-mobile-header-bar.mdc
================================================================================

---
description: แถบหัวแดชบอร์ดบนมือถือ/ไอแพดแนวตั้ง — ไอคอน · พื้นเต็มขอบ · ไม่ซ้อนกล่อง
globs:
  - "**/DashboardShell.tsx"
  - "**/dashboard-header-tokens.ts"
  - "**/AppMobileDockShell.tsx"
alwaysApply: true
---

# แถบเมนูส่วนหัว — มือถือ / ไอแพดแนวตั้ง

เมื่อพูด **มือถือ** ให้รวม **ไอแพดแนวตั้ง** ด้วย — `dashboard-mobile-viewport.mdc`

## บังคับ

1. **พื้นหลังชั้นเดียว** ชิดขอบ **ซ้าย · ขวา · บน** (รวม safe-area) — **ห้าม** ซ้อนกล่องโค้งมนในแถบหัว
2. **สีแถบ:** ไล่ม่วงแบรนด์ (`from-[#4f2f9a] via-[#5b3ac2] to-[#ec4899]`) · ไอคอน/ข้อความขาว
3. ปุ่มในหัวเป็น **ไอคอน** · ไม่มีกล่องซ้อน
4. Import จาก **`@/components/app-templates`**: `appDashboardHeaderBarClass` · `appDashboardHeaderBarInnerClass` · `appDashboardHeaderIconButtonClass`

## ห้าม

- `rounded-*` + `border` + `shadow` เป็นกล่องเมนูซ้อนในหัวบนมือถือ
- ชั้นแก้วขาวเต็มจอ + กล่องม่วงด้านใน (สองชั้น)

## อ้างอิง

- `src/components/layout/DashboardShell.tsx`
- `src/components/app-templates/dashboard-header-tokens.ts`
- แถบล่างคู่ขนาน: `mobile-dock-tokens.ts`


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
### .cursor/rules/dashboard-mobile-summary-stat-grid.mdc
================================================================================

---
description: การ์ดสรุปตัวเลขหน้าแดชบอร์ดโมดูล — มือถือ 2 คอลัมน์เสมอ (ไม่ stack คอลัมน์เดียว)
alwaysApply: true
---

# Dashboard — การ์ดสถิติหน้าแดชบอร์ดบนมือถือ (2 คอลัมน์)

ใช้กับแถวการ์ดสรุปแบบ `parkingStatCardClass` / CarWash-style stat / ตัวเลขยอดรวม·จำนวน·รายการ (เช่น **ธนาคารโรงเรียน** `SchoolBankDashboardClient`, **สหกรณ์ชุมชน** `CommunityCoopDashboardClient`)

## บังคับ

1. **ก่อน `sm` (มือถือ viewport แคบ)** ห้ามใช้ `grid-cols-1` สำหรับแถวการ์ดสรุป — ใช้ **`grid-cols-2`** และ `gap-3` (หรือใกล้เคียง) ให้การ์ดเรียง 2 คอลัมน์สม่ำเสมอ
2. **จำนวนการ์ดเป็นเลขคี่ (เช่น 3 ใบ)** — การ์ด**ใบสุดท้าย**ต้อง **`col-span-2 sm:col-span-1`** (หรือเทียบเท่าตาม breakpoint ถัดไป) เพื่อไม่ให้การ์ดลอยค้างคอลัมน์เดียวแปลก ๆ
3. **จำนวนการ์ดคู่ (เช่น 4 ใบ)** — ใช้ `grid-cols-2` ล้วนได้ (ได้กริด 2×2) ไม่ต้อง `col-span` พิเศษ
4. บน **`sm+`** คงเลย์เอาต์เดสก์ท็อปของโมดูล (เช่น `sm:grid-cols-3` สำหรับ 3 การ์ด · `lg:grid-cols-4` สำหรับ 4 การ์ด)

## อ้างอิงเพิ่ม

- แพทเทิร์นเดียวกับ `village-dashboard-mobile-stats-grid.mdc` (หมู่บ้าน — การ์ดคี่ + tail full width)

## ห้ามพลาดซ้ำ

- อย่ากลับไปใช้ `grid-cols-1` บน base สำหรับแถว stat สรุปโมดูลนี้ — ผู้ใช้ต้องการความหนาแน่น 2 คอลัมน์บนมือถือตามแนวคาร์แคร์/แดชบอร์ดอื่นใน repo


================================================================================
### .cursor/rules/dashboard-mobile-viewport.mdc
================================================================================

---
description: คำว่า «มือถือ» ในโปรเจกต์นี้รวมไอแพด/แท็บเล็ตแนวตั้ง — breakpoint เดียวกับ dock
alwaysApply: true
---

# มือถือ = โทรศัพท์ + ไอแพดแนวตั้ง

เมื่อผู้ใช้หรือกฎพูดว่า **มือถือ** / **บนมือถือ** / **mobile** ในงาน UX/UI แดชบอร์ดของ repo นี้:

## บังคับ — ความหมาย

| คำพูด | ครอบคลุม |
|-------|----------|
| มือถือ | **โทรศัพท์** และ **ไอแพด / แท็บเล็ตแนวตั้ง** |
| เดสก์ท็อป | จอแนวนอนกว้าง — โดยทั่วไป **`lg+`** |

**อย่า** ตีความว่ามือถือ = เฉพาะโทรศัพท์แล้วข้ามไอแพดแนวตั้ง

## Breakpoint โปรเจกต์

- โครมมือถือ (dock ล่าง · ซ่อน sidebar · แถบหัวเต็มขอบ): ใช้ **`lg:hidden` / `max-lg:`** หรือเทียบเท่าที่โปรเจกต์ใช้อยู่แล้วสำหรับ dock
- เดสก์ท็อป: **`lg:`** ขึ้นไป

## คู่กับ

- แถบล่าง: `mobile-dock-tokens.ts` · `dashboard-mobile-header-bar.mdc`
- กฎ UX อื่นที่เขียน «มือถือ» — ถือว่าหมายถึง viewport แคบรวมไอแพดแนวตั้งด้วย


================================================================================
### .cursor/rules/dashboard-module-car-wash-barber-reference.mdc
================================================================================

---
description: แผนที่ไฟล์และแพทเทิร์นคู่ขนาน — คาร์แคร์ · ร้านตัดผม · ซักผ้า · สนามฟุตบอล · POS เครื่องดื่ม — อ้างอิงตอนสร้างโมดูลแดชบอร์ดใหม่
globs:
  - "**/systems/car-wash/**"
  - "**/systems/barber/**"
  - "**/systems/laundry/**"
  - "**/systems/football-turf/**"
  - "**/systems/drink-pos/**"
  - "**/app/**/dashboard/car-wash/**"
  - "**/app/**/dashboard/barber/**"
  - "**/app/**/dashboard/laundry/**"
  - "**/app/**/dashboard/football-turf/**"
  - "**/app/**/dashboard/drink-pos/**"
  - "**/components/layout/DashboardShell.tsx"
  - "**/components/dashboard/DashboardPagesShell.tsx"
---

# โมดูลแดชบอร์ด — อ้างอิงคู่ขนาน (คาร์แคร์ × ร้านตัดผม × ซักผ้า × สนามฟุตบอล × POS เครื่องดื่ม)

ใช้เมื่อสร้างโมดูลใหม่หรือทำให้ UX/UI / โครงสร้างไฟล์ใกล้เคียงแม่แบบ

**หลักการทั่วทั้งโปรเจกต์:** `.cursor/rules/dashboard-ux-car-wash-baseline.mdc` (`alwaysApply`)

**QR hub + FormModal:** `.cursor/rules/shop-qr-hub-popup-pattern.mdc`

**ก่อนออกแบบโมดูลใหม่ (บังคับ):** `.cursor/rules/dashboard-module-design-check-laundry-first.mdc` → `.cursor/rules/laundry-module-dashboard-template.mdc`

**ซักผ้า — แม่แบบโมดูลครบชุด (layout · ชำระเงิน · พิมพ์ · popup · กรอง · กราฟ · พอร์ทัล):** `.cursor/rules/laundry-module-dashboard-template.mdc`

**ซักผ้า — การ์ดสถิติแดชบอร์ด + QR:** `.cursor/rules/laundry-dashboard-ui.mdc`

**สนามฟุตบอล — ตัวอย่างโมดูลครบชุด (เลย์เอาต์ · สี · ปุ่ม · QR · อัปโหลด · ยืนยัน · ซ่อม · พอร์ทัล · คู่มือ):** `.cursor/rules/football-turf-module-dashboard-template.mdc`

**POS เครื่องดื่ม — หัวยุบ / ออเดอร์ / กริด 3 คอลัมน์ / แต้มตั้งค่าได้ / การเงินช่วงเวลา:** `.cursor/rules/drink-pos-module-dashboard-template.mdc`

**หน้าการเงินข้ามโมดูล (สรุป · กรอง · กราฟ · แท็บ · สลิป · แก้ไข/ลบ + `useAppNoticePopup` · รายจ่าย):** `.cursor/rules/dashboard-finance-module-template.mdc`

**ความกว้าง PageContainer / gutter:** `.cursor/rules/dashboard-page-width.mdc`

---

## 1) โครงสร้างไฟล์ — เปรียบเทียบหน้าที่

| หัวข้อ | คาร์แคร์ | ร้านตัดผม | สนามฟุตบอล |
|--------|----------|-----------|------------|
| **หน้าหลักโมดูล (Server)** | `.../dashboard/car-wash/page.tsx` | หลายหน้าใต้ `.../dashboard/barber/*` | `.../dashboard/football-turf/page.tsx` |
| **Client shell / chrome** | `CarWashDashboard.tsx` (หัวแก้ว + แท็บ + dock) | `BarberModuleShell` → `BarberLayoutChrome` | `FootballTurfDashboard.tsx` (sidebar `lg` + dock มือถือ) |
| **เมนูแท็บ** | ในแดชบอร์ด | `BarberModuleHeader` | `football-turf-module-nav.tsx` |
| **พอร์ทัลสาธารณะ** | check-in / customer portal | staff / packages ตามหน้า | `/football-turf/book|check-in/[ownerId]` |
| **ยืนยันลบ/ตั้งค่า** | ตามโมดูล | ตามโมดูล | **`useAppNoticePopup` เท่านั้น** (ไม่ toast หลังยืนยัน) |
| **โทเคนมุมมน / การ์ด** | ในไฟล์ client | `barber-ui-tokens.ts` | ใช้ `app-templates` + คลาสในแดชบอร์ด |
| **Guard / trial** | trial ใน page/client | `barber/layout.tsx` | trial query `t=` บนลิงก์สาธารณะ |

---

## 2) พฤติกรรมที่ควรทำซ้ำในโมดูลใหม่

1. **หัวแก้วชั้นนอก:** `rounded-[2.5rem]`, glass gradient, `backdrop-blur-2xl`, `border-white/50`, เงา inset ขาว — เทียบบล็อกหัวใน `CarWashDashboard` และ `BarberLayoutChrome` (`barberModuleGlassShellClass`)
2. **เมนูมือถือ:** แถบล่าง `fixed`, `rounded-[2.5rem]`, safe-area — เทียบ dock คาร์แคร์ / `BarberModuleMobileDock` / สนามฟุตบอล (pill เลื่อนได้เมื่อแท็บเยอะ)
3. **เมนูเดสก์ท็อป:** แท็บในการ์ดหัว **หรือ** sidebar ซ้ายแบบสนามฟุตบอล (`lg:grid-cols-[264px_…]`) **หรือ** แท็บหัว + ยุบขึ้น header ม่วงแบบ POS เครื่องดื่ม
4. **หน้า plain inner:** หลีกเลี่ยงการ์ดกระจกซ้อนซ้ำ — บาร์เบอร์ใช้ flag `plainInnerContent`
5. **โหมดทดลอง:** URL สาธารณะ/พนักงาน — ใส่ query `t=` เมื่อ sandbox
6. **ปุ่มแนวคาร์แคร์ในโมดัล:** `cw-btn` + ไอคอน + `cw-btn-label` (`globals.css`)
7. **ยืนยันก่อนลบ/ตั้งค่าสำคัญ:** `useAppNoticePopup().confirm` — **ห้าม** toast สำเร็จหลังยืนยัน และห้าม `window.confirm` (ดูกฎสนามฟุตบอล)
8. **เส้น accent หัวการ์ด:** หลัง `h-1.5` gradient bar ต้องมี **`mt-5`** ก่อนไอคอน/ปุ่ม/ข้อความ
9. **มือถือในโมดูล:** ซ่อนเมนูหลักแดชบอร์ดล่าง — ใช้ dock โมดูลอย่างเดียว (`DashboardShell` + `isModuleWorkspacePath`)
10. **POS / ออเดอร์:** ตะกร้ามือถือ = สล็อตเหนือ dock + `FormModal` · กริด `grid-cols-3` · การเงิน default เดือนนี้ · แต้มตั้งค่าได้ (ดูกฎ drink-pos)

---

## 3) เช็กลิสต์โมดูลใหม่ (สั้น)

- [ ] มีหัวแก้ว + เมนูเดสก์ท็อป + dock ล่างมือถือ (หรือเหตุผลที่ไม่ใช้ dock)
- [ ] โค้งชั้นนอก `2.5rem` สอดคล้อง `DashboardShell` และโมดูลย่อย
- [ ] Gutter ไม่ซ้ำกับ `PageContainer` / `DashboardPagesShell` (ดู `dashboard-page-width.mdc`)
- [ ] หน้า staff/kiosk แยก UX — ไม่บังคับเมนูหลักโมดูลเต็มชุด
- [ ] Trial / sandbox — ลิงก์ภายนอก + แถบ `TrialSandboxStrip` หรือข้อความใน client สอดคล้องกัน
- [ ] ไอคอน sidebar + (ถ้าในแคตตาล็อก) รูปปก landing
- [ ] ยืนยันลบผ่าน `AppNoticePopup` · ข้อมูลลง DB/API จริงถ้าไม่ใช่ preview

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

---

## 5) สนามฟุตบอล — ไฟล์อ้างอิง

| บทบาท | ไฟล์ |
|--------|------|
| แดชบอร์ด + sidebar + dock + ฟอร์ม | `src/systems/football-turf/FootballTurfDashboard.tsx` |
| แท็บ / ไอคอนเมนู | `src/systems/football-turf/football-turf-module-nav.tsx` |
| Client repo + API | `src/systems/football-turf/football-turf-service.ts` · `lib/*` |
| พอร์ทัลจอง / เช็กอิน | `FootballTurfBookingPortalClient.tsx` · `FootballTurfCheckInClient.tsx` |
| ป๊อปอัปยืนยันกลาง | `@/components/app-templates` → `AppNoticePopup` / `useAppNoticePopup` |

รายละเอียด UI + เช็กลิสต์เต็ม: **`.cursor/rules/football-turf-module-dashboard-template.mdc`**

---

## 6) POS ร้านเครื่องดื่ม — ไฟล์อ้างอิง

| บทบาท | ไฟล์ |
|--------|------|
| Shell + ยุบหัว + คู่มือ | `src/systems/drink-pos/components/DrinkPosShell.tsx` |
| Nav / collapse localStorage | `src/systems/drink-pos/lib/drink-pos-module-nav.ts` |
| แท็บใน header ม่วง (เดสก์ท็อปเมื่อยุบ) | `DrinkPosHeaderBarNav.tsx` |
| Dock + สล็อตสรุปบิล | `DrinkPosMobileBottomChrome.tsx` · `DrinkPosMobileDock.tsx` |
| ออเดอร์ (คอมแผงซ้าย · มือถือ popup) | `DrinkPosOrderClient.tsx` |
| การเงิน (วันนี้/เดือนนี้/ปีนี้) | `DrinkPosSalesClient.tsx` · `api/drink-pos/finance-summary` |
| สะสมแต้มตั้งค่าได้ | `DrinkPosShopSettingsClient.tsx` · `lib/loyalty-rule.ts` |
| โทเค็น UI / กริด 3 คอลัมน์ | `src/systems/drink-pos/lib/ui-tokens.ts` |

รายละเอียด UI + เช็กลิสต์เต็ม: **`.cursor/rules/drink-pos-module-dashboard-template.mdc`**


================================================================================
### .cursor/rules/dashboard-module-design-check-laundry-first.mdc
================================================================================

---
description: ก่อนออกแบบหรือทำ UI โมดูลแดชบอร์ด ใหม่ — อ่านแม่แบบรับฝากซักผ้าก่อนเสมอ
alwaysApply: true
---

# ก่อนออกแบบโมดูลใหม่ — ดูแม่แบบซักผ้าก่อน

เมื่อจะ **สร้างโมดูลแดชบอร์ด ใหม่** · **เพิ่มหน้า/แท็บโมดูล** · **ออกแบบ layout การ์ด ปุ่ม ชำระเงิน พิมพ์ popup เมนู กรอง กราฟ** หรือ **refactor chrome โมดูล**:

## บังคับ — ลำดับการอ่าน

1. **`.cursor/rules/laundry-module-dashboard-template.mdc`** — แผนที่ไฟล์ · เมนู 4 รายการ · tokens · กรอง · กราฟ · ชำระเงิน · พิมพ์ · popup · พอร์ทัล · **ไอคอน/โทนการ์ดรายการ**  
2. **`.cursor/rules/laundry-module-portal-website-template.mdc`** — เว็บลูกค้า flat section · สีแบรนด์ · compact hero · lookup (เมื่อทำพอร์ทัล)  
3. **`.cursor/rules/dashboard-module-list-card-icon-tones.mdc`** — การ์ดรายการ: เส้นซ้าย · พื้น pastel · ไอคอน tile (เมื่อทำ/ปรับรายการ)  
4. **`.cursor/rules/dashboard-module-page-menu-icons.mdc`** — ไอคอนหัวข้อหน้า + แท็บเมนูย่อย  
5. **`.cursor/rules/dashboard-module-media-gallery-slideshow.mdc`** — กริดวิดีโอ 2/6 · แกลเลอรี 3/8 · สไลด์ป๊อปอัปเต็มจอ (เมื่อมี YouTube/แกลเลอรี)  
6. **`src/systems/laundry/lib/ui-tokens.ts`** — โทเค็นกล่อง/แท็บ/segment ที่ใช้จริง  
7. **`@/components/app-templates`** (`index.ts`) — กราฟ · รูป · พิมพ์ · lightbox · signature · usage guide  
8. กฎโปรเจกต์ที่ซักผ้าใช้แล้ว:  
   - `dashboard-ux-car-wash-baseline.mdc` (dock ล่าง · มุมมน)  
   - `dashboard-module-list-filter.mdc` · `dashboard-mobile-filter-icon.mdc`  
   - `app-templates-spark-charts.mdc` · `app-templates-media.mdc`  
   - `dashboard-page-width.mdc` · `dashboard-row-action-icon-buttons.mdc`  

## บังคับ — อย่าเริ่มจากศูนย์ถ้ามี pattern แล้ว

| งาน | เปิดดูก่อน (ซักผ้า) |
|-----|---------------------|
| Shell + dock + ยุบหัว | `LaundryModuleChrome.tsx` · `laundry-module-nav.tsx` |
| ปุ่มแถบหัว / แถวการ์ด | `lib/ui-tokens.ts` (§ ปุ่ม) · `LaundryDashboardHeaderToolbar` · `LaundryToolbarIconButton` · กฎ §6 ใน `laundry-module-dashboard-template.mdc` |
| หน้าการเงิน + กรอง + กราฟ | `LaundryFinancePanel.tsx` |
| รายการ + กรอง + ปุ่มเพิ่ม | `LaundryPurchasesClient.tsx` · `LaundryPackagesClient.tsx` |
| การ์ดรายการไอคอน + สี | `laundry-order-card-tone.ts` · `LaundryOrderCard` · **ชมรม** `club-event/lib/card-tones.ts` · กฎ **`dashboard-module-list-card-icon-tones.mdc`** |
| ไอคอนหัวข้อเมนู / แท็บ | `LaundryPageSubNav` · **ชมรม** `page-menu-icons.tsx` · กฎ **`dashboard-module-page-menu-icons.mdc`** |
| YouTube / แกลเลอรี / สไลด์ | **ชมรม** `ClubEventEventDetailClient` · `ClubEventSlideshow` · กฎ **`dashboard-module-media-gallery-slideshow.mdc`** |
| ชำระเงิน + สลิป | `LaundryPaymentPanel.tsx` · `LaundryPublicPaymentPanel.tsx` |
| พิมพ์ใบเสร็จ/ใบกำกับ | `lib/laundry-print-docs.ts` · `LaundrySellPackageModal.tsx` |
| Popup แจ้งเตือน | `useAppNoticePopup` ใน portal/pickup/finance |
| เว็บลูกค้า | `LaundryPortalPublicClient.tsx` · `LaundryPickupPublicClient.tsx` · **`laundry-module-portal-website-template.mdc`** |
| คู่มือ | `LaundryUsageGuideModal.tsx` |
| QR hub | `LaundryQrHubClient.tsx` (แท็บตั้งค่า `link` — บล็อกสายรายวันทีเดียว · อย่าใส่ลิงก์ในแท็บตั้งค่าเว็บไซต์) |
| **ร้านออนไลน์ (สินค้า · หน้าร้าน · ฟอร์ม)** | **`ecommerce-store-module-dashboard-template.mdc`** · `EcommerceProductsClient` · `EcommerceStorefrontClient` |
| **โชว์รูมรถมือสอง** | **`used-car-showroom-module-dashboard-template.mdc`** · Manage กรอง+FormModal · Settings 5 แท็บ · พอร์ทัล `/car/[slug]` |
| **ธุรกิจ รปภ.** | **`smart-guard-tour-module-dashboard-template.mdc`** · กรองในแถวเมนูย่อย · ชิปสถานะ**ข้อความล้วน** · `/guard/[slug]` |
| **Smart Police (สำนวน)** | **`smart-police-module-dashboard-template.mdc`** · วิซาร์ดสำนวนแรก · day1 checklist · priority · ส่งอัยการ · **แม่แบบราชการใหม่:** overflow เพิ่มหน้า + ไม่ใส่หมายเหตุ + ไม่โชว์รหัสฟอร์ม + **อักษร `BODY` 15pt** + ลงชื่อหลายคนแบ่ง 2 คอลัมน์ (ห้าม 3 ช่องแถวเดียว · จนท.ท้ายสุดอยู่ขวา) + หัวสถานที่บันทึกหรือสถานีตำรวจ/วันที่ชิดขวาช่องที่ 3 ตาม `smart-police-statement-form-template.mdc` §บังคับทุกครั้ง / §ลงชื่อ 2 คอลัมน์ — ไม่รอให้สั่ง |

## หลังออกแบบ

- สร้าง **`lib/ui-tokens.ts`** ในโมดูลใหม่ — **อย่า** copy-paste class กระจายหลายไฟล์  
- เพิ่ม sidebar icon ใน `dashboard-nav-icons.tsx`  
- เพิ่ม path ใน `DashboardPagesShell` (gutter wide module)  
- ถ้าโมดูล ใหญ่พอ — เพิ่ม `*UsageGuideModal` + ปุ่ม `?` ในหัว chrome  
- **รายการจัดการ:** ทุกแท็บย่อยต้องมี **แสดง/ซ่อนกรอง** + **+ เพิ่ม FormModal** (ดูซักผ้า Packages/Purchases · โชว์รูม `UsedCarShowroomManageClient`)  
- **ตั้งค่า:** ตาม `dashboard-module-shop-settings-tabs.mdc` — พื้นฐาน · การเงิน (ภาษี·PIN·สลิป) · เว็บ (แบนเนอร์·แกลเลอรี) · เวลา · ลิงก์  

## ห้าม

- ออกแบบ UI โมดูล ใหม่โดยไม่อ่าน `laundry-module-dashboard-template.mdc`  
- ทำพอร์ทัลลูกค้าโดยไม่อ่าน **`laundry-module-portal-website-template.mdc`**
- ทำหน้าร้านขายสินค้า / กริดแคตตาล็อก โดยไม่อ่าน **`ecommerce-store-module-dashboard-template.mdc`** (เมื่อโดเมนเป็นร้านออนไลน์หรือเทียบเท่า)
- สร้างกราฟ/กรอง/lightbox/พิมพ์เอง ทั้งที่ `app-templates` มีแล้ว  
- ใช้ `window.confirm` / inline error banner ใน flow ใหม่ ขณะที่แม่แบบใช้ `useAppNoticePopup` แล้ว  
- ทำรายการจัดการแบบช่อง inline ไม่มีกรอง/โมดัลเพิ่ม  
- ใส่ `px-*` / `max-w-*` ซ้ำรอบเนื้อหาโมดูล wide จนกล่องไม่เต็มขอบ  

**แม่แบบรอง (โครงสร้างเทียบ):** คาร์แคร์/บาร์เบอร์ `dashboard-module-car-wash-barber-reference.mdc` · สนามฟุตบอล `football-turf-module-dashboard-template.mdc` · **ร้านออนไลน์** `ecommerce-store-module-dashboard-template.mdc` · **โชว์รูมรถ** `used-car-showroom-module-dashboard-template.mdc` · **ธุรกิจ รปภ.** `smart-guard-tour-module-dashboard-template.mdc` · **Smart Police** `smart-police-module-dashboard-template.mdc` · แม่แบบราชการใหม่ทำ overflow/ไม่ใส่หมายเหตุ/**อักษร 15pt** ตาม `smart-police-statement-form-template.mdc` โดยไม่รอสั่ง — ใช้เมื่อโดเมนต่าง แต่ **UX ชุดล่าสุด (กรอง · popup · finance page แยก · ตั้งค่าครบ)** ให้ยึด **ซักผ้า** เป็นหลัก (ยกเว้นกฎเฉพาะในแม่แบบโมดูลนั้น เช่น ชิปกรองข้อความล้วนของ รปภ.)


================================================================================
### .cursor/rules/dashboard-module-list-card-icon-tones.mdc
================================================================================

---
description: การ์ดรายการแดชบอร์ด — ไอคอนมุมซ้าย + โทนสี (เส้นซ้าย · พื้นอ่อน) ตามแม่แบบซักผ้า/ชมรม
globs: src/systems/**/components/**/*.{tsx,ts}
alwaysApply: false
---

# การ์ดรายการ — ไอคอน + สีสัน (มาตรฐานโมดูล)

ใช้เมื่อทำหรือปรับ **รายการในการ์ด** (กิจกรรม · สมาชิก · การเงิน · ทรัพย์สิน · ออเดอร์ ฯลฯ) ให้มี **ไอคอน** และ **โทนสี** อ่านง่าย ไม่เป็นกล่องขาวเรียบทั้งหน้า

**คู่กับ:** `laundry-module-dashboard-template.mdc` · `laundry-dashboard-ui.mdc` · `dashboard-module-design-check-laundry-first.mdc` · `dashboard-finance-module-template.mdc` (สีราคา emerald/rose)

---

## 0) หลักคิด

1. **ทุกแถวรายการมีสัญญาณภาพ** — ไอคอน (หรือรูปจริง) + สีขอบ/พื้นตามชนิดหรือสถานะ  
2. **โทเค็นรวมในโมดูล** — ไฟล์ `lib/card-tones.ts` หรือเทียบเท่า — **ห้าม** คัดลอกสตริง Tailwind โทนซ้ำกระจายหลายไฟล์  
3. **มีความหมาย** — สีสื่อโดเมน (รายรับเขียว · รายจ่ายชมพู · พร้อมใช้เขียว · ชำรุดชมพู · อดีตเทา) ไม่สุ่มสีสวยอย่างเดียวโดยไม่มีกฎ  
4. **รูปมีแล้วใช้รูป** — มี thumb/สลิป → โชว์ `AppImageThumb` / สลิปในรายการที่ต้องมีป้าย → **`AppLabeledImageThumb`** `kind="slip"` · **ไม่มีรูป** → กล่องไอคอนโทนสีแทนกล่อง dashed เทาเปล่า  
   (รายละเอียดป้ายสลิป: **`app-templates-media.mdc`** § AppLabeledImageThumb)  

---

## 1) โครงสร้างการ์ดรายการ (บังคับ)

```
[เส้นซ้าย 3px สีโทน] + [พื้น pastel อ่อน]
├── [ไอคอน tile / รูป]  [เนื้อหา flex-1]  [ราคา? + ไอคอนแก้ไข/ลบ]
```

| ชิ้น | แนวทาง |
|-----|--------|
| เปลือก | `border` บาง · **`border-l-[3px]`** · พื้น `*-50/45–80` · `rounded-lg` · `shadow-sm` · hover เงาโทนเบาได้ |
| ไอคอน tile | `h-10 w-10` หรือ `h-14/16` เมื่อแทนรูป · `rounded-xl` · `ring-1` · พื้น `*-100` · สีไอคอน `*-700` |
| เนื้อหา | หัวข้อเข้ม `#1e1b4b` · เมตา `#66638c` |
| แอ็กชันแถว | ไอคอนแก้ไข/ลบ ตาม `dashboard-row-action-icon-buttons.mdc` |

---

## 2) ชุดโทนมาตรฐาน (ชื่อ + ความหมาย)

ใช้ชื่อโทนเดียวกันข้ามโมดูลเมื่อเป็นไปได้:

| โทน | ใช้เมื่อ (ตัวอย่าง) |
|-----|---------------------|
| `emerald` | รายรับ · พร้อมใช้ · สำเร็จ |
| `rose` | รายจ่าย · ชำรุด · ติดลบ · อันตราย |
| `sky` / `cyan` | กิจกรรมถัดไป · กำลังใช้ · ข้อมูลทั่วไป |
| `violet` / `indigo` / `fuchsia` | สมาชิก · กรรมการ · หมวดโปร / สลับสีรายการ |
| `amber` | รอ · ยังไม่ยินยอม · เตือนอ่อน |
| `slate` | อดีต · ปิดใช้งาน · เลิกใช้ · เป็นกลาง |

**การเงิน — การ์ดสรุป:** เส้นซ้าย + พื้นโทน + **ไอคอนคู่ป้าย** (เช่น ลูกศรรับ/จ่าย · ตาชั่งคงเหลือ) — ราคาตาม `dashboard-finance-module-template.mdc` §2  

**รายรับ/รายจ่ายในแถว:** โทน `emerald` / `rose` ทั้งแถว · ไม่ใช้ม่วงแบรนด์เป็นสียอดเงิน  

---

## 3) แหล่งโค้ดอ้างอิง

| แบบ | ไฟล์ | ใช้เมื่อ |
|-----|------|---------|
| **รายการทั่วไป + ไอคอน tile** (ต้นแบบคัดลอก) | `src/systems/club-event/lib/card-tones.ts` · `ClubEventDashboardClient` · `ClubEventFinanceClient` · `ClubEventManageClient` | โมดูลใหม่ที่รายการไม่ผูก status pipeline ยาว |
| **คิวงานตามสถานะ** | `src/systems/laundry/laundry-order-card-tone.ts` · `LaundryOrderCard` · `laundry-dashboard-ui.mdc` | โดเมนมีหลายสถานะสายงาน (ซักผ้า · คิวบริการ) |
| **สถิติ overview** | `LaundryOverviewPanel` (`LaundryStat` + icon + `border-l`) | การ์ดสรุปตัวเลขคลิกกรองได้ |

### API แนะนำ (เลียนแบบชมรม)

```ts
// lib/card-tones.ts ของโมดูล
export type XxxCardTone = "sky" | "violet" | "emerald" | "rose" | …;
export function xxxCardToneClasses(tone: XxxCardTone): { leftBorder; bg; iconBg; iconText; hoverShadow; label };
export function xxxTonedRowCardClass(tone: XxxCardTone): string;
export function xxxCardIconTileClass(tone: XxxCardTone, size?: "md" | "lg"): string;
```

---

## 4) ไอคอน

- ใช้ **lucide-react** (หรือชุดเดียวกับโมดูล) — ขนาดใน tile ~`h-5`–`h-7` · `strokeWidth` ~2.1–2.25  
- ใส่ **`aria-hidden`** บน tile/ไอคอนตกแต่งเมื่อมีข้อความหัวข้อแล้ว  
- สถิติ: ไอคอนเล็กข้างป้ายตัวพิมพ์เล็ก uppercase  
- **ห้าม** ใส่ emoji เป็นไอคอนหลักของการ์ด  

ตัวอย่าง pairing: ปฏิทิน→กิจกรรม · ผู้ใช้→สมาชิก · กล่อง→ทรัพย์สิน · กระเป๋า/ลูกศร→การเงิน · UserCog→กรรมการ  

---

## 5) ห้าม

- แถวรายการขาวเรียบทั้งหน้าโดยไม่มีเส้นซ้าย/ไอคอนเมื่อรายการเป็นหลักของหน้า  
- กล่อง «ไม่มีรูป» เทา dashed เป็นค่าเริ่ม — ใช้ **ไอคอนโทน** แทน  
- Hardcode `border-l-emerald-500 bg-emerald-50…` ซ้ำหลายไฟล์โดยไม่มี `card-tones` / tone helper  
- สุ่มสีทุกแถวโดยไม่ผูกชนิด/สถานะ/ลำดับที่อธิบายได้  
- ให้สีราคาขัดกับกฎการเงิน (รายรับต้อง emerald · รายจ่าย rose)  

---

## 6) เช็กลิสต์โมดูลใหม่ / ปรับรายการ

- [ ] มี `lib/card-tones.ts` (หรือเทียบเท่า) + ฟังก์ชันเปลือกแถว + ไอคอน tile  
- [ ] รายการหลักทุกหน้า: โทน + ไอคอน (หรือรูป)  
- [ ] ไม่มีรูป → ไอคอนโทน ไม่ใช่ dashed ว่าง  
- [ ] การเงิน: สรุปมีไอคอน · แถวรับ/จ่ายโทน emerald/rose  
- [ ] สถานะโดเมน (ถ้ามี) map เป็นโทนคงที่  
- [ ] ไม่คัดลอก class โทนซ้ำนอกไฟล์ tones  

---

## 7) อ้างอิงเพิ่ม

- แม่แบบโมดูลทั้งก้อน: `laundry-module-dashboard-template.mdc` § การ์ดรายการ (ไอคอน · สี)  
- คิวซักผ้าละเอียด: `laundry-dashboard-ui.mdc`  
- สีราคา/สรุปการเงิน: `dashboard-finance-module-template.mdc`


================================================================================
### .cursor/rules/dashboard-module-list-filter.mdc
================================================================================

---
description: รายการแดชบอร์ด — ส่วนกรองบังคับมีปุ่มแสดง/ซ่อนกรอง · ชิปสถานะ · ค้นหา · badge เมื่อกรองค้าง
alwaysApply: true
---

# รายการโมดูล — ส่วนการกรอง (แสดง / ซ่อน)

ใช้เมื่อหน้า/แท็บมี **รายการ** ที่ควรกรองได้ (แพ็กเกจ · เหมาจ่าย/สมาชิก · จอง · ประวัติ ฯลฯ)

คู่กับ: `dashboard-mobile-filter-icon.mdc` · `dashboard-mobile-list-header-actions.mdc`  
หน้าการเงิน (กรอง+กราฟ): `dashboard-finance-filter-charts-toggle.mdc`

---

## 1) บังคับ — ปุ่มแสดง / ซ่อนกรอง

1. มีปุ่ม **`แสดงกรอง` / `ซ่อนกรอง`** ทำงาน**ทุก breakpoint** — ห้ามเดสก์ท็อปโชว์แผงกรองถาวรโดยไม่มีปุ่มซ่อน
2. สถานะ: `filterOpen` (หรือชื่อเทียบเท่า) · `aria-expanded` · `aria-controls` ชี้แผง
3. **มือถือ (`default`):** ไอคอน funnel อย่างเดียว + `aria-label` / `title` ชัด · `min-h-[40px] min-w-[40px]`
4. **`sm+`:** ไอคอน + ข้อความ `แสดงกรอง` / `ซ่อนกรอง` (`hidden sm:inline` สำหรับข้อความ)
5. เมื่อ**มีการกรองค้าง** และแผงถูกซ่อน — แสดง **badge จุด** บนปุ่ม (โทนแบรนด์/amber ตามโมดูล)
6. ขณะซ่อนแผง — **ห้าม** กล่อง dashed / ข้อความ «ถูกซ่อนไว้»
7. ค่าเริ่มแนะนำ: **เปิดแผงกรอง** (`filterOpen = true`) บนหน้า list ที่กรองเป็นหลัก

---

## 2) แผงกรอง (เมื่อเปิด)

ลำดับแนะนำในการ์ดเดียวกับรายการ:

1. หัวการ์ด / แท็บหลัก · ปุ่มกรอง · ปุ่มเพิ่ม (ถ้ามี)
2. **แผงกรอง** (`filterOpen ? block : hidden`)
3. รายการ / empty state

| ชิ้น | รายละเอียด |
|------|------------|
| ชิปสถานะ | `role="tablist"` · นับจำนวนต่อสถานะ · โทเค็นชิปของโมดูล (เช่น `carWashFilterChipClass`) |
| ค้นหา | keyword ตามโดเมน · `min-h-[44px]` · ฟิลด์โทเค็นโมดูล |
| ล้างกรอง | **เฉพาะเมื่อมีเงื่อนไขค้าง** |
| สรุปสั้น | เช่น `แสดง N/M` |

**ตัวอย่างสถานะ**

| โดเมน | ชิป |
|--------|-----|
| แพ็กเกจบริการ | ทั้งหมด · เปิดใช้ · ปิด |
| เหมาจ่าย / สมาชิกแพ็ก | ทั้งหมด · พร้อมใช้ · หมดสิทธิ์ · ปิด (หรือ ACTIVE/EXHAUSTED/…) |
| จองคิว | ตามสถานะจองของโมดูล |

Empty เมื่อกรองไม่ตรง: ข้อความแยกจาก «ยังไม่มีรายการเลย»

---

## 3) ตำแหน่งปุ่ม

- อยู่ในแถวหัวการ์ด / กลุ่ม action ขวา — **ก่อน**ปุ่มเพิ่มเมื่ออยู่คู่กัน (`dashboard-mobile-list-header-actions.mdc`)
- ใช้ `appTemplateOutlineButtonClass` (หรือ segment ของโมดูล) + ไฮไลต์เมื่อแผงเปิด

---

## 4) ห้าม

- โชว์แผงกรองบน `sm+` ตลอดโดยไม่มีปุ่มซ่อน
- มือถือมีไอคอนเปิดอย่างเดียว แต่เดสก์ท็อปไม่มีปุ่มซ่อน/แสดง
- ซ่อนแผงแล้วยังเหลือ placeholder
- ลืม badge เมื่อกรองค้างแต่แผงปิด
- คัดลอกสตริง Tailwind ชิป/ฟิลด์ซ้ำหลายหน้า — ใช้ `*-ui-tokens` ของโมดูล

---

## อ้างอิงโค้ด

- คาร์แคร์แพ็ก/เหมา: `CarWashDashboard.tsx` (แท็บ `offers` · `offersFilterOpen`)
- คาร์แคร์การเงิน: `CarWashSalesPanel.tsx`
- บาร์เบอร์สมาชิกแพ็ก: `BarberPurchasesClient.tsx`
- โรงแรมจอง: `hotel-resort-booking-filters.mdc`

## เช็กลิสต์

- [ ] ปุ่มแสดง/ซ่อนกรองทุก breakpoint
- [ ] มือถือไอคอน · `sm+` มีข้อความ
- [ ] แผงผูก `filterOpen` — ไม่ `sm:block` บังคับเปิด
- [ ] ชิปสถานะ + ค้นหา + ล้างเมื่อค้าง
- [ ] badge เมื่อกรองค้างและแผงซ่อน
- [ ] ไม่มี placeholder ตอนซ่อน


================================================================================
### .cursor/rules/dashboard-module-media-gallery-slideshow.mdc
================================================================================

---
description: แกลเลอรีรูป + วิดีโอ YouTube บนหน้ารายละเอียด — กริดการ์ด · lightbox · สไลด์ป๊อปอัปเต็มจอ (ต้นแบบชมรม)
globs:
  - "src/systems/**/components/**/*.{tsx,ts}"
  - "src/components/app-templates/**/*.{ts,tsx}"
alwaysApply: false
---

# สื่อกิจกรรม — กริดวิดีโอ / แกลเลอรี / สไลด์โชว์

ใช้เมื่อโมดูลมี **วิดีโอ YouTube** และ/หรือ **แกลเลอรีรูป** บนหน้ารายละเอียดหรือแก้ไข (ต้นแบบ: **ชมรมกิจกรรม**)

**คู่กับ:** `app-templates-media.mdc` · `app-templates-youtube.mdc` · `app-image-lightbox-centered.mdc` · `dashboard-module-design-check-laundry-first.mdc`

**อ้างอิงโค้ด:**

| ชิ้น | พาธ |
|------|-----|
| หน้ารายละเอียด | `ClubEventEventDetailClient.tsx` |
| สไลด์ป๊อปอัป | `ClubEventSlideshow.tsx` |
| YouTube lightbox | `AppYoutubeLightbox` + `useAppYoutubeLightbox` (ไม่มีลิงก์ watch · ไอคอนเต็มจอ) |
| YouTube ฝังในหน้า | `AppSecureYoutubePlayer` (แม่แบบ LMS) |
| รูปเดี่ยว / เลื่อน | `AppImageLightbox` + `useAppImageLightbox` |
| โทเค็นกริด | `clubEventYoutubeCardGridClass` · `clubEventGalleryCardGridClass` ใน `club-event/lib/ui-tokens.ts` |
| คลิปตัวอย่างทดลอง | `CLUB_EVENT_TRIAL_SAMPLE_YOUTUBE_VIDEOS` ใน `club-event/lib/youtube.ts` |

---

## 1) กริดวิดีโอ YouTube (บังคับ)

| Breakpoint | คอลัมน์ |
|------------|---------|
| มือถือ (`default`) | **2** |
| คอม (`lg+`) | **6** |

1. แสดงเป็น **การ์ด thumb** (aspect-video + ปุ่ม Play ทับ) — **ห้าม** ฝัง iframe เล่นตรงในรายการยาวทั้งหน้า  
2. **คลิกการ์ด** → เปิด **`AppYoutubeLightbox`** (ป๊อปอัปเล่น)  
3. ใน lightbox: ใช้ **`AppSecureYoutubePlayer`** ภายใน (ไม่ฝัง iframe ดิบ) · ปุ่มเต็มจอไอคอน · iOS CSS · **ห้าม** ลิงก์/เปิดแอป YouTube (ดู **`app-templates-youtube.mdc`**)  
4. โทเค็นกริดรวมใน `lib/ui-tokens.ts` ของโมดูล — อย่า copy `grid-cols-*` กระจายหลายไฟล์  

```tsx
<ul className={clubEventYoutubeCardGridClass}>
  {videos.map((v) => (
    <YoutubeThumbCard key={v.id} onPlay={() => ytLb.open(v.youtubeUrl, v.title)} />
  ))}
</ul>
<AppYoutubeLightbox youtubeUrl={ytLb.youtubeUrl} title={ytLb.title} onClose={ytLb.close} />
```

### บัญชีทดลอง / ฟรี

- เมื่อ **ยังไม่มีคลิปจริง** บนหน้ารายละเอียด — โชว์ **ตัวอย่าง ~6 คลิป** (ป้าย «ตัวอย่าง») ให้เห็นเลย์เอาต์กริดเต็มแถว  
- คลิปตัวอย่างเล่นใน lightbox ได้ · **ไม่** นับเป็นโควต้าบันทึก  
- มีคลิปจริงแล้ว → โชว์ของจริงเท่านั้น  

---

## 2) กริดแกลเลอรีรูป (บังคับ)

| Breakpoint | คอลัมน์ |
|------------|---------|
| มือถือ (`default`) | **3** |
| คอม (`lg+`) | **8** |

1. Thumb กด → `AppImageLightbox` / `openGallery` (เลื่อนรูปได้)  
2. ใช้ `aspect-square` + `object-cover` ให้กริดสม่ำเสมอ  
3. โทเค็น: เช่น `clubEventGalleryCardGridClass`  

---

## 3) รับชมสไลด์ (บังคับเมื่อมีแกลเลอรี ≥ 1)

1. ปุ่ม **«รับชมสไลด์»** ที่หัวบล็อกแกลเลอรี (มือถือไอคอน · `sm+` มีข้อความ)  
2. เปิด **ป๊อปอัปสไลด์** (portal `document.body` · พื้นมืด · Esc / คลิกพื้นหลังปิด)  
3. ต้องมีอย่างน้อย: เล่นอัตโนมัติ / หยุด · ก่อน-ถัดไป · thumb strip · ปุ่ม **เต็มจอ** (`requestFullscreen` บน stage)  
4. ต้นแบบโมดูล: `ClubEventSlideshow` — โมดูลใหม่คัดลอกหรือย้ายเข้า `app-templates` ถ้าใช้ซ้ำ ≥ 2 โมดูล  

```tsx
<button type="button" onClick={() => setSlideshowOpen(true)} aria-label="รับชมสไลด์">
  …รับชมสไลด์
</button>
<ClubEventSlideshow open={slideshowOpen} onClose={…} slides={…} title={…} />
```

---

## 4) ห้าม

- ฝัง YouTube iframe เต็มความกว้างเป็นรายการยาวบนหน้ารายละเอียดแทนกริดการ์ด  
- กริดวิดีโอมือถือ 1 คอลัมน์ หรือเดสก์ท็อปไม่ถึง 6 เมื่อต้องการแถวตัวอย่างทดลอง  
- กริดรูปมือถือ 2 / เดสก์ท็อป 4 เป็นค่าเริ่มเมื่อทำโมดูลใหม่ตามแม่แบบนี้ (ใช้ 3 / 8)  
- สไลด์เต็มจอแบบ `fixed inset-0` โดยไม่มีปุ่ม **เต็มจอ** ของเบราว์เซอร์ และไม่มีโหมดป๊อปอัป  
- สร้าง lightbox YouTube / รูป เอง ทั้งที่ `AppYoutubeLightbox` / `AppImageLightbox` มีแล้ว  
- โชว์ลิงก์ watch / «เปิดบน YouTube» / คัดลอกลิงก์ บน lightbox หรือเครื่องเล่นผู้ใช้ปลายทาง  

---

## 5) เช็กลิสต์

- [ ] YouTube: การ์ด · `grid-cols-2 lg:grid-cols-6` · คลิก → `AppYoutubeLightbox` + เต็มจอ  
- [ ] ทดลองว่าง: ตัวอย่าง ~6 คลิป + ป้ายตัวอย่าง  
- [ ] แกลเลอรี: `grid-cols-3 lg:grid-cols-8` · คลิก → `AppImageLightbox`  
- [ ] ปุ่มรับชมสไลด์ + ป๊อปอัป + เต็มจอ  
- [ ] โทเค็นกริดใน `ui-tokens` ของโมดูล


================================================================================
### .cursor/rules/dashboard-module-page-menu-icons.mdc
================================================================================

---
description: หัวข้อเมนูหน้าโมดูล + แท็บย่อยต้องมีไอคอน (tile/คู่ป้าย) — แม่แบบซักผ้า/ชมรม
globs: src/systems/**/components/**/{*PageSubNav*,*Dashboard*,*Settings*,*Manage*,*Finance*}*.{tsx,ts}
alwaysApply: false
---

# หัวข้อเมนู — ไอคอน (มาตรฐานโมดูล)

ใช้เมื่อทำหรือปรับ **หัวข้อหน้า** (`PageSubNav` / การ์ดหัวแผง) และ **แท็บเมนูย่อย** ของโมดูลแดชบอร์ด

**คู่กับ:** `laundry-module-dashboard-template.mdc` · `dashboard-module-list-card-icon-tones.mdc` · `dashboard-module-design-check-laundry-first.mdc`

---

## 0) บังคับ

1. **หัวข้อหน้าหลัก** (เช่น แดชบอร์ด · การเงิน · การจัดการ · ตั้งค่า) ต้องมี **ไอคอนในกล่อง tile** ข้างชื่อ — ไม่เหลือข้อความล้วน  
2. **แท็บเมนูย่อย** ทุกตัวควรมี **ไอคอนเล็ก** คู่ป้าย (lucide หรือชุดเดียวกับโมดูล)  
3. รวมไอคอนในไฟล์ helper ของโมดูล (เช่น `lib/page-menu-icons.tsx`) — **ห้าม** คัดลอก JSX ไอคอนกระจายหลายหน้า  
4. ไอคอนตกแต่งใส่ **`aria-hidden`** เมื่อมีข้อความหัวข้อ/ป้ายแท็บแล้ว  

---

## 1) หัวข้อหน้า (`titleIcon`)

| ชิ้น | แนวทาง |
|-----|--------|
| ตำแหน่ง | ซ้ายของ `<h2>` ชื่อเมนู |
| กล่อง | `h-9 w-9` · `rounded-xl` · พื้น pastel + `ring-1` ตามโทนหน้า (sky/emerald/violet/indigo…) |
| ไอคอน | ~`h-4 w-4` · `strokeWidth` ~2.25 |
| API | prop `titleIcon` (+ `titleTone` ถ้าโมดูลมีโทนการ์ด) บน `*PageSubNav` |

**อ้างอิง:**  
- ชมรม: `ClubEventPageSubNav` · `club-event/lib/page-menu-icons.tsx`  
- ซักผ้า (template): `LaundryPageSubNav` prop `titleIcon`

---

## 2) แท็บย่อย (`items[].icon`)

| ชิ้น | แนวทาง |
|-----|--------|
| ขนาด | `h-3.5`–`h-5` ในปุ่มแท็บ |
| คู่ข้อความ | ไอคอน + ป้าย · มือถืออาจเหลือป้ายสั้น + ไอคอน |
| ตัวอย่าง | กำหนดการ=ปฏิทิน · ย้อนหลัง=History · สมาชิก=User · ทรัพย์สิน=Package · ตั้งค่าเว็บ=Globe |

---

## 3) หัวข้อบล็อกในเนื้อหา (ถ้ามี)

บล็อกย่อยใต้เส้นแบ่ง (`*PageBlock`) ถ้ามีหัวข้อ — ใส่ไอคอนเล็กในกล่อง `h-7 w-7` คู่ชื่อ (เช่น รายละเอียด · ยูทูป · แกลเลอรี)

---

## 4) ห้าม

- หัวข้อหน้าหลักไม่มีไอคอนเมื่อโมดูลอื่นในชุดเดียวกันมีแล้ว  
- Hardcode SVG/lucide ซ้ำในทุก `*Client.tsx` โดยไม่มี helper  
- ใช้ emoji เป็นไอคอนเมนู  
- ไอคอนใหญ่แข่งกับชื่อหัวข้อ (เกิน ~`h-5` ในแท็บ / เกิน tile `h-9` ที่หัวหน้า)  

---

## 5) เช็กลิสต์

- [ ] `*PageSubNav` รองรับ `titleIcon`  
- [ ] ทุกหน้าหลักส่ง `titleIcon` (+ โทนถ้ามี)  
- [ ] แท็บย่อยทุก key มี `icon`  
- [ ] helper รวมที่ `lib/page-menu-icons.tsx` (หรือเทียบเท่า)  
- [ ] บล็อกเนื้อหาที่มีหัวข้อ — มีไอคอนเมื่อเหมาะสม  

---

## 6) อ้างอิงโค้ด

| โมดูล | ไฟล์ |
|-------|------|
| ชมรม | `page-menu-icons.tsx` · `ClubEventPageSubNav` · Dashboard/Finance/Manage/Settings/Detail/Editor |
| ซักผ้า | `LaundryPageSubNav.tsx` (`titleIcon` + `items[].icon`) |


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
### .cursor/rules/dashboard-module-settings-single-row-tabs.mdc
================================================================================

---
description: หน้าตั้งค่า / ลูกค้า / โปรโมชันโมดูล — แถวเดียว + แถบเมนูย่อย (แท็บ) ไม่ใช้คอลัมน์คู่ซ้าย–ขวา
globs:
  - "**/systems/football-turf/**"
  - "**/systems/**/components/**Settings*.tsx"
  - "**/systems/**/*Settings*.tsx"
  - "**/systems/**/*Dashboard*.tsx"
alwaysApply: false
---

# หน้าตั้งค่า / ลูกค้า / โปรโมชัน — แถวเดียว · แถบเมนูย่อย

ใช้เมื่อออกแบบหรือปรับ **แท็บตั้งค่า** · **หน้าลูกค้า (โปร)** · หรือ **โปรโมชัน/แพ็ก** ของโมดูลแดชบอร์ด (สนามฟุตบอลเป็นต้นแบบ)

**ตั้งค่าร้านแบบบริการ (คาร์แคร์ / บาร์เบอร์ — 4 หมวดมาตรฐาน):** **`.cursor/rules/dashboard-module-shop-settings-tabs.mdc`**

## บังคับ

1. **เลย์เอาต์แถวเดียว** — เนื้อหาอยู่ใน **คอลัมน์เดียวเต็มความกว้าง**  
   - **ห้าม** `xl:grid-cols-2` / สองคอลัมน์ ฟอร์มซ้าย · พรีวิวขวา เป็นโครงหลัก  
   - พรีวิวตั้งค่า = สแตกแนวตั้ง (`space-y-3`) ไม่กริด 2 คอลัมน์
2. **แยกหมวดด้วยแถบเมนูย่อย (sub-tabs)** — pill ห่อบรรทัดเมื่อล้น (`flex-wrap` · ดูกฎ `dashboard-mobile-compact-wrap.mdc`)  
   - **เดสก์ท็อป (`sm+`):** แท็บอยู่ในแถวหัวการ์ด คู่ปุ่มมุมขวา (`AppSectionHeader.action`)  
   - **มือถือ:** แถว 1 = หัวข้อ + ไอคอนกรอง/เพิ่ม · แถว 2 = แท็บเต็มความกว้าง (`footballTurfSubTabMobileRowClass`) ป้ายสั้น · ขนาดย่อมาตรฐาน  
   - ใช้โทเค็น: `footballTurfSubTabShellClass` + `footballTurfHeaderActionRowClass` + `footballTurfMobileFilterIconButtonClass`
3. **ตัวกรองมือถือ:** ไอคอน `SlidersHorizontal` ในหัวการ์ด → แผงค้นหาย่อ · เดสก์ท็อปใช้ `FilterToolbar` (ปุ่มเปิดกรองเป็นไอคอนบนมือถือถ้ายังใช้ toolbar)
4. **ARIA:** `role="tablist"` / `role="tab"` / `role="tabpanel"` + `aria-selected` + `aria-controls`
5. **แผงเนื้อหา** — glass `footballTurfPanelCardClass` · ฟิลด์ `footballTurfFieldClass` · ปุ่มมี `footballTurfInteractiveButtonClass` (hover)
6. **ปุ่มบันทึก (ตั้งค่า)** — อยู่ขวาสุดของแถวหัว · แท็บคะแนน/ตัวอย่างซ่อนปุ่มบันทึกหัว
7. **แผงย่อยซ้อน** (เช่น loyalty) — ส่ง `embedded` เพื่อ **ไม่ห่อ `AppDashboardSection` ซ้ำ**

## หน้าลูกค้า (โปร)

| แท็บเมนู | กรองรายการ |
|----------|------------|
| ทั้งหมด | ทุกคน (+ จำนวน) |
| ใช้งาน | `isActive` |
| ปิดใช้งาน | ไม่ active |
| ใบกำกับ | `taxInvoiceEnabled` |
| มีคะแนน | มี balance / earned |

- ค้นหา keyword คู่กับเมนูได้ · รีเซ็ตตัวกรอง = ล้างค้นหา + กลับแท็บทั้งหมด  
- **ห้าม** แถวการ์ดสถิติแยกนอกเมนูเมื่อมีแถบเมนูนับจำนวนแล้ว (เลี่ยงซ้ำ)

## หน้าตั้งค่า

| จอ | UI สลับหมวด |
|----|-------------|
| มือถือ | **dropdown อย่างเดียว** (`footballTurfMobileSelectClass` · `sm:hidden`) + ป้าย «กรุณาเลือกหมวดตั้งค่า» |
| `sm+` | แถบหลัก pill (`footballTurfPrimaryTabShellClass`) ใน wrapper `hidden sm:block` |

### มือถือ — บังคับซ่อนแถบเมนู

เมื่อมี dropdown เลือกหมวดตั้งค่าแล้ว:

1. **ซ่อนแถบเมนู pill ทั้งก้อน** (`hidden` ก่อน `sm`) — **ห้าม** โชว์คู่กับ dropdown  
2. อย่าใส่ `hidden` บน element เดียวกับคลาสที่มี `inline-flex` / `flex` ใน shell (twMerge อาจชน) — ห่อด้วย `<div className="hidden sm:block">` แทน  
3. หัวการ์ด: ชื่อ «ตั้งค่า» + ปุ่มบันทึกเท่านั้น (ไม่ยัดแท็บใน `action`)

| แท็บ | เนื้อหา |
|------|---------|
| ข้อมูลสนาม | ชื่อ · ติดต่อ · ที่อยู่ |
| รับโอน / จอง | พร้อมเพย์ · บัญชี · โหมดชำระลิงก์ลูกค้า |
| เอกสาร · สลิป | เลขผู้เสียภาษี · หมายเหตุ · ขนาดสลิป |
| คะแนน | สะสมคะแนน / รางวัล (`embedded`) |
| ตัวอย่าง | พรีวิวข้อมูล — **สแตกแถวเดียว** |

- หมวดตั้งค่า = **แถบหลักของหน้า** (เดสก์ท็อป) / dropdown (มือถือ) — ดูกฎ `dashboard-primary-secondary-menu-tabs.mdc`

## หน้าโปร / ลูกค้า (`tab=offers`)

เมนูหลักรวมเป็นแท็บเดียว **โปร / ลูกค้า** — **ดูกฎเต็ม:** `dashboard-primary-secondary-menu-tabs.mdc`

| ระดับ | สิ่งที่แสดง | โทเค็น |
|-------|------------|--------|
| **การ์ดเดียว** | หัวข้อ + ปุ่มแอ็กชัน + แถบหลัก + กรอง + รายการ | `AppDashboardSection` ห่อทั้งหมด |
| **แถบหลัก** | โปรโมชัน \| ลูกค้า | `footballTurfPrimaryTabShellClass` + `footballTurfPrimaryTabPillClass` |
| **แถบย่อย (กรอง)** | แพ็กโปร / ถือสิทธิ์ · สถานะสิทธิ์ · กรองลูกค้า | `footballTurfFilterChipShellClass` + `footballTurfFilterChipClass` |

- **ห้าม** แยกแถบหลักโปร/ลูกค้าไว้นอกการ์ด  
- **ห้าม** ให้แถบกรองย่อยใช้ขนาดเท่าแถบหลักโปร/ลูกค้า  
- **ห้าม** แยกเมนูหลัก `offers` กับ `customers` ใน dock/sidebar อีก  
- ปุ่มหัวการ์ดสลับตามหมวด: โปร = เพิ่ม/ขาย · ลูกค้า = เพิ่มลูกค้า  
- การ์ดรายการใช้ `footballTurfPanelCardClass` + accent bar

## ห้าม

- วางพรีวิวเป็นคอลัมน์ข้างฟอร์มแบบถาวรบนเดสก์ท็อป  
- ยัดทุกหมวดในหน้าเดียวยาวโดยไม่มีแถบเมนูเมื่อหมวด ≥ 3  
- คัดลอกสตริงคลาสแถบแท็บซ้ำ — รวมที่ `lib/ui-tokens` ของโมดูล  
- บนมือถือยัดแท็บยาว + ปุ่มข้อความในแถวเดียวจนล้นโดยไม่ห่อ — ใช้ wrap / แยกแถวแท็บ / ไอคอน (ดู `dashboard-mobile-compact-wrap.mdc`)

## อ้างอิงโค้ด

- `FootballTurfDashboard.tsx` — `settingsMenu` · `crmSection` · `customersMenu` · `offersMenu`
- `src/systems/football-turf/lib/ui-tokens.ts` — `footballTurfPrimaryTab*` · `footballTurfFilterChip*` · `footballTurfSubTab*`
- `FootballTurfLoyaltySettingsPanel` — prop `embedded`
- แถบหลัก/รอง: `dashboard-primary-secondary-menu-tabs.mdc`


================================================================================
### .cursor/rules/dashboard-module-shop-settings-tabs.mdc
================================================================================

---
description: หน้าตั้งค่าร้านโมดูล — พื้นฐาน · การเงิน · ตั้งค่าเว็บไซต์ (เฉพาะตั้งค่า) · ลิงก์ (เว็บ+พนักงาน บล็อกสายรายวันทีเดียว) · เวลาเปิดร้าน
globs:
  - "**/systems/**/*Settings*.tsx"
  - "**/systems/**/**Settings*.tsx"
  - "**/dashboard/**/settings/**"
  - "**/systems/car-wash/CarWashSettings*.tsx"
  - "**/systems/barber/**/BarberShopSettings*.tsx"
  - "**/systems/laundry/**/LaundrySettings*.tsx"
  - "**/systems/ecommerce-store/**/*Settings*.tsx"
  - "**/systems/**/*QrHub*.tsx"
alwaysApply: false
---

# เมนูตั้งค่าร้าน — แถบหมวดมาตรฐาน

ใช้เมื่อทำหรือปรับ **หน้าตั้งค่าร้าน** ของโมดูลบริการ (คิว / จอง / พอร์ทัลลูกค้า / ร้านออนไลน์)

**เลย์เอาต์มือถือ/เดสก์ท็อป (dropdown vs pill):** `dashboard-module-settings-single-row-tabs.mdc` · `dashboard-primary-secondary-menu-tabs.mdc`  
**Hub ลิงก์/QR:** `shop-qr-hub-popup-pattern.mdc`

---

## 1) แถบเมนูบังคับ (เมื่อมีครบโดเมน)

| ลำดับ | แท็บ (ข้อความ UI) | `?tab=` | เนื้อหา |
|------|-------------------|---------|--------|
| 1 | **ตั้งค่าพื้นฐาน** | `basic` | ชื่อร้าน · โลโก้ · คำโปรย/สโลแกน · เบอร์ · ที่อยู่ (ถ้ามี) |
| 2 | **ตั้งค่าเกี่ยวกับการเงิน** | `finance` | ช่องทางชำระ · **อัปโหลดรูป QR พร้อมเพย์** (ทางเลือก — ถ้ามีรูปใช้แทนสร้างจากเบอร์) · ขนาดสลิป · ปุ่มลัดยอด/PIN พนักงาน (ถ้ามี) |
| 3 | **ตั้งค่าเว็บไซต์** | `portal` | **เฉพาะตั้งค่า** — แบนเนอร์ · แกลเลอรี · **LINE** · Facebook · แผนที่ · โดเมน · Sale Page / โหมดพอร์ทัล |
| 4 | **ลิงก์** | `link` | **ลิงก์เว็บไซต์ + พนักงาน** (การ์ดคู่) — ห่อ **`ModuleQrMonthlyGate` ครั้งเดียว** |
| 5 | **ตั้งค่าเวลาเปิดร้าน** | `hours` | เวลาเริ่ม/สิ้นสุด · วันเปิดประจำ · สล็อต (ถ้ามีโดเมน) |

### แท็บพื้นฐาน — พิกัดร้าน (เมื่อโมดูลใช้แผนที่/ตำแหน่ง)

เมื่อโดเมนต้องการพิกัดร้าน (แผนที่พอร์ทัล · คำนวณระยะ · ฯลฯ) ใส่ในแท็บ **พื้นฐาน** หรือ **ตั้งค่าเว็บไซต์** ตามแม่แบบโมดูล — ต้องมี:

| ฟิลด์ | แนวทาง |
|------|--------|
| ละติจูด / ลองจิจูด | ช่องตัวเลข · บันทึกบน shop profile |
| **ดึงพิกัดจากเครื่อง** | `navigator.geolocation.getCurrentPosition` → กรอกช่อง · ผู้ใช้กดบันทึก |

ต้นแบบ: ซักผ้า (`shopLat`/`shopLng` ในพอร์ทัล) · โชว์รูมรถ (`shopLat`/`shopLng` ในแท็บพื้นฐาน)

### แท็บการเงิน — QR พร้อมเพย์ (บังคับเมื่อมี PromptPay)

1. ฟิลด์เบอร์/บัญชีผ่าน **`AppModuleShopPaymentFields`** (หรือเทียบเท่า)
2. บล็อก **อัปโหลดรูป QR พร้อมเพย์** คู่กัน — `prepareImageFileForUpload` → upload API ของโมดูล · พรีวิว · ลบรูป
3. ถ้ามี `promptPayQrImageUrl` → หน้าชำระแสดงรูปนี้แทนสร้าง QR จากเบอร์
4. เก็บฟิลด์ `promptPayQrImageUrl` บน shop profile

ต้นแบบ: `LaundrySettingsClient` · `EcommerceSettingsClient` · `UsedCarShowroomSettingsClient` · `AppModuleShopSettingsClient` (`showPromptPayQrUpload`)

### บังคับแยก — ตั้งค่าเว็บ ≠ ลิงก์

| แท็บ | ใส่ได้ | ห้าม |
|------|--------|------|
| **ตั้งค่าเว็บไซต์ (`portal`)** | ฟิลด์ตั้งค่าเนื้อหา/โดเมน/สื่อ | คัดลอก/เปิดลิงก์สาธารณะ · QR ลูกค้า · QR/ลิงก์พนักงาน · `ModuleQrMonthlyGate` |
| **ลิงก์ (`link`)** | การ์ดคู่ลิงก์เว็บไซต์ + พนักงาน · โมดัลคัดลอก/QR | ฟอร์มตั้งค่า LINE/โดเมน/แบนเนอร์ยาว |

เหตุผล: สายรายวันต้อง **บล็อกที่เดียว** ที่แท็บลิงก์ — อย่ากระจายเกตไปแท็บตั้งค่าเว็บหรือแท็บพนักงานแยก

- อยู่ใน **`AppDashboardSection` / การ์ดเดียว** — หัวข้อ «ตั้งค่าร้าน» → แถบเมนู → แผงตามแท็บ  
- **มือถือ:** `<select>` + ป้าย «กรุณาเลือกหมวดตั้งค่า» · **ซ่อน** แถบ pill (`hidden sm:block` ที่ wrapper)  
- **`sm+`:** แถบหลัก pill · `role="tablist"` / `tab` / `tabpanel` · `aria-selected` / `aria-controls`  
- Deep-link: `?tab=basic|finance|portal|link|hours` — map ค่าเก่า `staff` → `link` เมื่อมี

โมดูลที่**ไม่มี**พอร์ทัล/ชั่วโมง — เหลือแท็บที่มีจริงเท่านั้น (**พื้นฐาน** + **การเงิน**) อย่าสร้างแท็บว่าง  
โมดูลที่มีพอร์ทัลแต่ยังไม่มี staff link — แท็บลิงก์เหลือการ์ดเว็บไซต์อย่างเดียวได้ แต่ยังห่อ `ModuleQrMonthlyGate`

---

## 2) แท็บลิงก์ — Hub การ์ดคู่

1. ห่อทั้งแผงด้วย **`ModuleQrMonthlyGate`** **หนึ่งครั้ง** (อย่าเกตทีละการ์ด/ทีละโมดัลซ้ำ)  
2. UI ตาม **`shop-qr-hub-popup-pattern.mdc`** — การ์ดคู่ → `FormModal` (เว็บไซต์ `violet` · พนักงาน `amber` + `size="full"`)  
3. เนื้อหาพนักงานในโมดัล = **`ModuleStaffTokenQrPanel`** / `ShopStaffQrPanel` + `planGateAllowed` (เกตอยู่ข้างนอกแล้ว)  
4. **ห้าม** แยกแท็บ «พนักงาน» เป็นเมนูตั้งค่าหลักคู่กับ «ลิงก์เว็บ» อีกชั้น

ต้นแบบร้านออนไลน์: `EcommerceQrHubClient` · ซักผ้า: `LaundryQrHubClient` (แท็บ `link`)

---

## 3) โทเค็น UI

สร้างคู่ใน `*-ui-tokens` ของโมดูล (ห้ามคัดลอกสตริง Tailwind ซ้ำหลายหน้า):

| บทบาท | ตัวอย่าง |
|-------|---------|
| Shell pill | `carWashPrimaryTabShellClass` · `ecommerceStoreSettingsHeaderTabShellClass` |
| Pill active/idle | `*PrimaryTabPillClass(active)` / `*SettingsTabPillClass` |
| Dropdown มือถือ | `*MobileSelectClass` |

---

## 4) การบันทึกข้อมูล

| แท็บ | แนวทาง |
|------|--------|
| พื้นฐาน / การเงิน | `ModuleShop` branding **หรือ** shop-profile ของโมดูล |
| ตั้งค่าเว็บไซต์ | ฟิลด์บน **shop profile** (`portalBannerUrl` · `contactLine` · `facebookUrl` · `mapUrl` · โดเมน · Sale Page) — **ห้าม** ยัดลิงก์คัดลอกลงแท็บนี้ |
| ลิงก์ | ไม่บันทึกฟอร์มร้าน — แค่สร้าง/แสดงลิงก์+QR (ซ่อนปุ่มบันทึกหัวการ์ดได้) |
| เวลาเปิดร้าน | shop profile hours / day-schedule API |

---

## 5) ห้าม

- ยัดลิงก์คัดลอก/QR ลงแท็บตั้งค่าเว็บไซต์  
- แยกแท็บพนักงานออกจากแท็บลิงก์ (ทำให้เกตสายรายวันสองจุด)  
- โชว์ pill + dropdown พร้อมกันบนมือถือ  
- คัดลอก UI สื่อพอร์ทัลใหม่ทั้งก้อน — เลียนแบบ `*PortalMediaSettings`

---

## 6) อ้างอิงที่ทำแล้ว

| โมดูล | ไฟล์ |
|-------|------|
| ร้านออนไลน์ | `EcommerceSettingsClient` · `EcommerceQrHubClient` · `EcommercePortalMediaSettings` |
| ซักผ้า | `LaundrySettingsClient` · `LaundryQrHubClient` · `LaundryPortalMediaSettings` |
| คาร์แคร์ / บาร์เบอร์ | Settings + QrHub ตามโดเมน |
| UX พอร์ทัลลูกค้า | `module-customer-booking-website-portal.mdc` · `laundry-module-portal-website-template.mdc` |

## เช็กลิสต์

- [ ] แท็บตั้งค่าเว็บไซต์ไม่มีปุ่มคัดลอกลิงก์/QR  
- [ ] แท็บลิงก์ = การ์ดคู่ + `ModuleQrMonthlyGate` ครั้งเดียว  
- [ ] ไม่มีแท็บ `staff` แยก (หรือ map → `link`)  
- [ ] มือถือ dropdown · `sm+` pill · ไม่โชว์คู่  
- [ ] โทเค็นอยู่ใน `*-ui-tokens` ของโมดูล  
- [ ] แท็บการเงินมีอัปโหลดรูป QR พร้อมเพย์เมื่อรองรับ PromptPay  
- [ ] พิกัดร้าน (ถ้ามีโดเมน) + ปุ่มดึงพิกัด  
- [ ] แท็บพอร์ทัลมี LINE · Facebook · แผนที่ (ไม่ใส่ลิงก์คัดลอก)


================================================================================
### .cursor/rules/dashboard-nav-menu-groups.mdc
================================================================================

---
description: เมนูแดชบอร์ด — sidebar เมนูหลักแบบรายการเดียว · โมเดลเมนูโมดูลใน sidebar · ซ่อนเมนูหลักล่างเมื่อเข้าโมดูล/แอดมิน · ย่อ sidebar เมื่อเข้าโมดูล
alwaysApply: true
---

# เมนูแดชบอร์ด — sidebar / ซ่อนแถบนำทาง

## 1) Sidebar ซ้าย (เดสก์ท็อป)

| สิ่ง | รายละเอียด |
|-----|------------|
| หน้าแกนระบบ | **เฉพาะกลุ่ม `basic` (เมนูหลัก)** เป็นรายการลิงก์แบน (`SidebarNavLink`) |
| **ห้าม** | ใส่กลุ่มย่อยพับได้ (finance / services / property / admin) ใน sidebar ซ้าย |
| โมดูลที่สมัคร | เข้าผ่านหน้า «ระบบทั้งหมด» / ลิงก์อื่น — ไม่โชว์เป็นกลุ่มใน sidebar แบบเก่า |
| **โมเดลใหม่ (เมนูโมดูล)** | เมื่อ `usesModuleWorkspaceSidebar(pathname)` — sidebar แสดง **เมนูของโมดูลนั้น** แทนเมนูหลัก · ขนาดอ้างอิง BOTProject — ดูกฎ **`dashboard-profile-module-sidebar.mdc`** (เริ่ม Smart Police) |

## 2) Drawer มือถือ

- หน้าแกน: ใช้ `NavCollapsibleGroup` กับ **`mainNavGroups` (basic)** — สอดคล้อง sidebar
- โมดูลใน registry เมนูโมดูล: drawer แสดงเมนูโมดูลชุดเดียวกับ sidebar (`DashboardProfileModuleMenu` variant `drawer`)
- โทนแก้วม่วงของ drawer

## 3) ซ่อน / แสดงแถบเมนูซ้ายทั้งแท่ง

| สถานะ | พฤติกรรม |
|--------|----------|
| ปุ่มใน header | สลับ `sidebarCollapsed` · จำ `mawell-dashboard-sidebar-collapsed` |
| เข้า `/dashboard` | **บังคับแสดง** sidebar |
| เข้าโมดูลใน registry (`usesModuleWorkspaceSidebar`) | **บังคับแสดง** sidebar เป็นเมนูโมดูล (ไม่ย่อ) |
| เข้าโมดูลงานอื่น (`isModuleWorkspacePath` แต่ไม่อยู่ registry) | **ย่อ sidebar** อัตโนมัติ (ยังกดเปิดได้) |

`isModuleWorkspacePath` ไม่รวม: หน้าบ้าน · chat-ai · profile · plans · chat · modules · **admin**

## 4) ซ่อนเมนูหลักล่างมือถือ (`MobileBottomNav`)

ซ่อนเมื่อ:

1. staff kiosk  
2. `isModuleWorkspacePath`  
3. **ศูนย์แอดมิน** `/dashboard/admin/*` — ใช้ dock แอดมินแทน  

## 5) ยุบหัวโมดูล / หัวศูนย์แอดมิน (กลุ่มเมนูส่วนหัว)

แยกจาก sidebar — ซ่อน/แสดง **การ์ดหัว + แถบเมนูในหัว** (dock มือถือยังอยู่)

| พื้นที่ | localStorage / event | ซ่อนที่ | เมื่อยุบแล้วเมนูไปอยู่ |
|--------|----------------------|---------|------------------------|
| สนามฟุตบอล | `mawell-football-turf-header-collapsed` · `FOOTBALL_TURF_HEADER_COLLAPSE_*` | `FootballTurfShell` | `FootballTurfHeaderBarNav` ใน header ม่วง `DashboardShell` |
| drink-pos | `*DRINK_POS_HEADER_COLLAPSE*` | `DrinkPosShell` | `DrinkPosHeaderBarNav` |
| **หอพัก** | `mawell-dormitory-module-header-collapsed` · `DORMITORY_HEADER_COLLAPSE_*` | `DormLayoutChrome` | `DormitoryHeaderBarNav` |
| **ศูนย์แอดมิน** | `mawell-admin-hub-header-collapsed` · `ADMIN_HUB_HEADER_COLLAPSE_*` ใน `admin-hub-nav.ts` | `AdminHubChrome` (การ์ดหัว + กริดแท็บ) | `AdminHubHeaderBarNav` / `AdminHubHeaderExpandButton` ใน `DashboardShell` |

- ปุ่มซ่อนชิดขวาสุดของหัว · จำค่าใน `localStorage` · sync ผ่าน `CustomEvent` + `storage`
- มือถือเมื่อยุบ: แถบม่วงแสดงโทเคน + ปุ่มขยาย · เดสก์ท็อป: แท็บในแถบม่วง + ปุ่มขยาย
- ขอบซ้าย–ขวาของหน้าแอดมิน: ชุดเดียวกับสนามฟุตบอล — `dashboard-page-width.mdc`
- รายการหน้าแอดมิน (การ์ด · ตัดคำอธิบาย · Export Excel): `.cursor/rules/admin-hub-dashboard-template.mdc`

## อ้างอิง

- `DashboardShell.tsx` — `mainMenuItems` · `moduleWorkspaceSidebar` · `hideMainMobileBottomNav` · `showAdminHubHeaderBar`
- เมนูโมดูลใน sidebar: **`dashboard-profile-module-sidebar.mdc`** · `src/lib/dashboard/module-profile-sidebar.ts`
- `AdminHubChrome.tsx` · `AdminHubHeaderBarNav.tsx` · `src/lib/admin-hub-nav.ts`
- ขอบซ้าย–ขวา: `dashboard-page-width.mdc`
- เทมเพลตรายการแอดมิน: `admin-hub-dashboard-template.mdc`


================================================================================
### .cursor/rules/dashboard-new-module-sidebar-icon.mdc
================================================================================

---
description: โมดูลแดชบอร์ดใหม่ — ต้องเพิ่มไอคอน sidebar ใน dashboard-nav-icons ทุกครั้ง
alwaysApply: true
---

# โมดูลใหม่ — ไอคอน sidebar (บังคับ)

เมื่อเพิ่มหรือเปิดใช้ **โมดูลแดชบอร์ดใหม่** (เมนูใน `buildDashboardNavGroups` / ลิงก์ `/dashboard/...` / slug ใน `dashboard-nav.ts`):

## บังคับ

1. **เพิ่มเงื่อนไขไอคอน** ใน `src/components/layout/dashboard-nav-icons.tsx` ฟังก์ชัน `dashboardNavIconForHref(href)` ให้ครอบคลุม **พาธจริงที่ sidebar ส่งเข้ามา** (หลัง `resolveDashboardNavLinkHref` + `canonicalDashboardModuleLinkHref` — มักเป็น `/dashboard/{slug}` หรือตามที่ map ใน `src/lib/dashboard-nav.ts`)
2. ใช้ `<Svg>...</Svg>` ชุดเดียวกับรายการอื่นในไฟล์: `stroke="currentColor"`, `strokeWidth="2"` (หรือใกล้เคียง), **ไม่** hardcode สี fill ยกเว้นจุดเล็ก decorative ที่ใช้ `currentColor`
3. วางเงื่อนไข **ก่อน** บล็อก fallback `href.startsWith("/dashboard/modules/")` และ **ก่อน** `return` ท้ายไฟล์ (วงกลม +) — ไม่ให้โมดูลใหม่ตกไปไอคอนกริดหรือไอคอน default โดยไม่ตั้งใจ
4. เลือกไอคอนที่ **ไม่ซ้ำ** โมดูลใกล้เคียง (เช่น คลังสต็อก vs ทรัพย์สิน vs คลังรหัสผ่าน)
5. ถ้าโมดูลอยู่ในแคตตาล็อกหลัก — **เพิ่มรูปปก** ใน `src/app/landing/landing-module-showcase-data.ts` (หรือ map ที่ `getDefaultModuleCoverImageUrl` อ่านได้) เพื่อให้การ์ดแดชบอร์ดได้รูปเดียวกับ landing; รูป Unsplash ต้องผ่าน `isTrustedUnsplashModuleCoverUrl` (โฮสต์ `images.unsplash.com` เท่านั้น)

## อ้างอิง

- ไฟล์ไอคอน: `src/components/layout/dashboard-nav-icons.tsx`
- รูปปกค่าเริ่ม (เดียวกับ landing): `src/lib/modules/dashboard-module-cover-images.ts` + `src/app/landing/landing-module-showcase-data.ts`
- ลิงก์ canonical โมดูล: `src/lib/dashboard-nav.ts` (`subscribedModuleHrefForSlug` / `VAULT_MODULE_SLUG` แบบเดียวกัน)

ถ้าเพิ่มโมดูลแล้วยังไม่แตะ `dashboard-nav-icons.tsx` — **ถือว่างานยังไม่ครบ**


================================================================================
### .cursor/rules/dashboard-page-width.mdc
================================================================================

---
description: ความกว้างและ gutter (ขอบซ้าย–ขวา) หน้าแดชบอร์ด — ชั้น DashboardShell · PageContainer · โมดูล — ห้ามซ้อน padding คนละชุด
alwaysApply: true
---

# Dashboard layout — ความกว้าง + ระยะขอบซ้ายขวา

หน้าใต้ `src/app/(dashboard)/dashboard/` ถูกห่อหลายชั้น — **ต้องรู้ว่าขอบซ้าย–ขวามาจากชั้นไหน** อย่าใส่ `px-*` / `max-w-*` ซ้ำจนเนื้อหาแคบหรือไม่เท่าการ์ด

## ชั้นระยะขอบ (นอก → ใน)

| ชั้น | ไฟล์ | ขอบซ้าย–ขวา (ค่าเริ่ม) | หมายเหตุ |
|------|------|------------------------|----------|
| 1. แถวเนื้อหาใต้ header | `DashboardShell.tsx` ห่อ `main` | **`px-3 sm:px-4`** ทุกหน้า (ยกเว้น staff kiosk) | ช่องว่างระหว่างขอบจอกับการ์ดหลัก — **แถบหัวเต็มขอบไม่ใส่ px นอก** (`dashboard-mobile-header-bar.mdc`) |
| 2. `PageContainer` | `DashboardPagesShell` → `page-container.tsx` | ค่าเริ่ม **`PAGE_GUTTER_X`** · หน้าบ้าน/โมดูล wide/dock **`!px-0`** (ห้ามซ้อนกับชั้น 1) · **`PAGE_GUTTER_Y`** = `pt-2 pb-5 sm:pt-3 sm:pb-7` | ระยะใต้ Header ม่วงแนวตั้ง · แนวนอนให้ Shell อย่างเดียว |
| 3. Shell / การ์ดโมดูล | เช่น `FootballTurfShell` | padding ในหัว `px-4 sm:px-8` — **ห้าม** ห่อ `children` ด้วย `px-*` ซ้ำทั้งหน้า | เนื้อหาไหลใต้ PageContainer |
| 4. ชั้นในของการ์ด | เนื้อหาในการ์ด | ถ้าต้อง gutter ใน: **`PAGE_INNER_GUTTER_X`** = `px-4 sm:px-6 md:px-8` | ให้หัวข้อกับการ์ดเส้นตั้งเดียวกัน |

**ค่าคงที่กลาง:** `@/components/ui/page-container` — `PAGE_GUTTER_X` · `PAGE_GUTTER_Y` · `PAGE_INNER_GUTTER_X`

## ตารางโมดูล / หน้า — override ใน `DashboardPagesShell`

| พาธ | `size` | class เพิ่ม (ขอบซ้าย–ขวา / ความกว้าง) |
|-----|--------|----------------------------------------|
| หน้าปกติ (ไม่ wide) | `default` (`max-w-6xl`) | `PAGE_GUTTER_X` — หลีกเลี่ยง; ใส่ path ใน WIDE แทน |
| **โมดูลงาน** (`WIDE_MODULE_PREFIXES` รวมซักผ้า · นวด · คาร์แคร์ · จอดรถ ฯลฯ) | `full` | **`max-w-none !px-0`** — ไม่ซ้อนกับ `DashboardShell` |
| หน้าบ้าน / ระบบทั้งหมด / โปรไฟล์ / แพ็กเกจ / แชท | `full` | **`max-w-[1680px] !px-0`** — ขอบนอกเดียวกับ header · ไม่ซ้อน `PAGE_GUTTER_X` |
| staff kiosk | `full` | `!px-0 !py-0 !max-w-none` |

**ศูนย์แอดมินเพิ่มเติม:** ซ่อน `MobileBottomNav` หลัก · ยุบหัว+กลุ่มเมนูส่วนหัวได้เหมือนสนามฟุตบอล (`ADMIN_HUB_HEADER_COLLAPSE_*` · `dashboard-nav-menu-groups.mdc` §5)

## บังคับ / ห้าม

- **หน้าแดชบอร์ดหลัก** `dashboard/page.tsx` — ห้ามห่อ root ด้วย `max-w-7xl` / `max-w-*` / `mx-auto` / `pb-*` ซ้ำกับ `PageContainer` · ห้าม `px-2` ad-hoc ที่หัวข้อจนไม่เท่าขอบการ์ด · ใช้ `PAGE_INNER_GUTTER_X` ถ้าต้องการ gutter ชั้นใน
- **ห้าม** ใส่ `max-w-6xl mx-auto` ซ้ำใน layout/shell โมดูลย่อย (ยกเว้นหน้าเต็มจอที่ไม่อยู่ใต้ PageContainer)
- **ห้าม** ห่อ `children` ทั้งหน้าด้วยการ์ดใหญ่ `rounded-3xl border` + `px-*` อีกชั้น — เนื้อหาไหลต่อใต้ PageContainer · การ์ดย่อยใช้ `app-surface` ตามจุด
- โมดูลหลายหน้า: แบบรายรับ–รายจ่าย / Building POS / **สนามฟุตบอล** — Shell = หัว+เมนู · เนื้อหาไม่ซ้ำขอบ
- เข้าโมดูลงาน → ย่อ sidebar (`isModuleWorkspacePath`) — **ยกเว้น** โมดูลใน registry เมนูโมดูล (`usesModuleWorkspaceSidebar` เช่น Smart Police) → **แสดง** sidebar เป็นเมนูโมดูล — ดูกฎ `dashboard-profile-module-sidebar.mdc` · **แอดมิน / โปรไฟล์ / modules ไม่ถือเป็นโมดูลงาน** (อยู่ใน basicPrefixes)

## ตัวอย่างสนามฟุตบอล (ครบชั้น)

1. `DashboardShell` แถว main: `px-3 sm:px-4` (ไม่ compact) — **ขอบเดียวกับแถบ header ม่วง**
2. `DashboardPagesShell`: `size="full"` + `max-w-none !px-0` (ห้ามซ้อน px)
3. `FootballTurfShell` หัว: `px-4 sm:px-8` · เนื้อหา **ไม่มี** `px` ซ้ำทั้งหน้า
4. ล่างมือถือ: `pb-24` (`footballTurfMainPaddingBottomClass`) ให้พ้น dock — **ไม่เกี่ยวกับ** ขอบซ้ายขวา

รายละเอียดเต็ม: `.cursor/rules/football-turf-module-dashboard-template.mdc` §2b

## เช็กลิสต์เมื่อเพิ่มโมดูล

- [ ] เลือกชุด gutter ใน `DashboardPagesShell` (คัดลอก football/drink หรือ barber)
- [ ] ไม่ใส่ `px-*` ซ้ำใน Shell รอบ `children`
- [ ] หัวข้อกับการ์ดชิดขอบเดียวกัน — ใช้ `PAGE_INNER_GUTTER_X` ถ้าต้องชั้นใน
- [ ] มือถือมี dock → มี `pb-24` (หรือเทียบเท่า) ที่เนื้อหา


================================================================================
### .cursor/rules/dashboard-primary-secondary-menu-tabs.mdc
================================================================================

---
description: แถบเมนูหลัก vs แถบเมนูรอง (กรอง) ในหน้าแดชบอร์ดโมดูล — ขนาด·ลำดับชั้น·การ์ดเดียว
globs:
  - "**/systems/**/*Dashboard*.tsx"
  - "**/systems/**/lib/ui-tokens.ts"
  - "**/systems/football-turf/**"
  - "**/app/(dashboard)/dashboard/**/*.tsx"
alwaysApply: true
---

# แถบเมนูหลัก · แถบเมนูรอง (กรอง)

ใช้เมื่อหน้าโมดูลมีทั้ง **สลับหมวดหลัก** (เช่น โปรโมชัน | ลูกค้า) และ **กรองรายการย่อย** (เช่น แพ็ก / สิทธิ์ / สถานะ)

สนามฟุตบอล (`tab=offers` · โปร / ลูกค้า) เป็นต้นแบบ

## ลำดับชั้น (บังคับ)

| ระดับ | บทบาท | ตัวอย่าง | ขนาด / ลักษณะ |
|-------|--------|---------|----------------|
| **แถบหลัก (primary)** | สลับหมวดใหญ่ของหน้า | โปรโมชัน \| ลูกค้า | ใหญ่ · `min-h-10`–`11` · `text-sm`+ · gradient เมื่อ active |
| **แถบรอง (secondary / filter)** | กรองภายในหมวด | แพ็กโปร · ถือสิทธิ์ · ทั้งหมด/ใช้งาน/ใบกำกับ | เล็ก · `min-h-7`–`8` · `text-[10px]`–`11px` · โทนชิปอ่อน |

1. **แถบหลักต้องเด่นกว่าแถบรองชัดเจน** — ห้ามใช้คลาส/ขนาดเดียวกัน  
2. **อยู่ใน `AppDashboardSection` การ์ดเดียว** กับหัวข้อ · ปุ่มแอ็กชัน · รายการ — ห้ามวางแถบหลักนอกการ์ดแยกชั้น  
3. ลำดับใน DOM: หัวการ์ด → **แถบหลัก** → **แถบรอง** → แผงค้นหา (ถ้ามี) → รายการ

## โทเค็น (สนามฟุตบอล)

| ระดับ | Shell | Pill / Chip |
|-------|-------|-------------|
| หลัก | `footballTurfPrimaryTabShellClass` | `footballTurfPrimaryTabPillClass(active)` |
| รอง | `footballTurfFilterChipShellClass` | `footballTurfFilterChipClass(active)` |

โมดูลอื่น: สร้างคู่โทเค็นเทียบเท่าใน `lib/ui-tokens` ของโมดูล — **ห้าม** คัดลอกสตริง Tailwind ซ้ำในหลายหน้า

## ARIA

- ทั้งสองระดับ: `role="tablist"` / `role="tab"` / `aria-selected`  
- แผงเนื้อหา: `role="tabpanel"` + `aria-controls` / `aria-labelledby` เมื่อสลับหมวดหรือกรองมีแผงแยก

## ไอคอนเมนูโมดูล (dock / sidebar)

เมื่อรวมสองหมวดเป็นแท็บเดียว (เช่น โปร + ลูกค้า):

- ใช้ **ไอคอนเดียวที่อ่านง่าย** (เช่น ผู้ใช้คู่)  
- **ห้าม** ซ้อน path ของสองไอคอนทับกันใน SVG เดียวกัน

## ข้อยกเว้น — dropdown บนมือถือ

เมื่อแถบหลักมีหลายตัวเลือกจนห่อเพี้ยน (เช่น ตั้งค่า 5 หมวด · เลือกสนาม/กรองสถานะภาพรวม):

- มือถือ: `<select>` เต็มขอบ (`footballTurfMobileSelectClass`)  
- `sm+`: แถบหลัก / pill ตามปกติ  
- **หน้าตั้งค่ามือถือ:** มี dropdown แล้ว **ต้องซ่อนแถบเมนู pill ทั้งก้อน** — ห้ามโชว์คู่กัน  
- ซ่อนด้วย wrapper `hidden sm:block` รอบ `<nav>` — **ห้าม** `cn(shellHavingInlineFlex, "hidden sm:…")` บน element เดียว (อาจชน twMerge แล้ว pill โผล่บนมือถือ)

อ้างอิง: `football-turf-overview-mobile-dropdown.mdc` · หน้าตั้งค่าใน `FootballTurfDashboard.tsx`

## ห้าม

- ให้แถบกรองย่อยสูง/ใหญ่เท่าแถบหลัก  
- วางแถบหลักนอกการ์ด แล้วเปิดการ์ดเนื้อหาแยกตามหมวด  
- แยกเป็นสองรายการใน dock เมื่อรวมเป็นหน้าเดียวแล้ว (เช่น แยก «โปร» กับ «ลูกค้า» ในเมนูล่าง)  
- ใช้ `overflow-x-auto` เป็นทางแก้หลักของแถบเมนู — ห่อ (`flex-wrap`) หรือ dropdown ตามข้อยกเว้นด้านบน  
- บนมือถือโชว์แถบเมนูตั้งค่าสองชั้น (หัวการ์ด + แถบห่อเพี้ยน) พร้อมกัน  

## อ้างอิง

- `FootballTurfDashboard.tsx` — `crmSection` · `settingsMenu` · แถบหลัก/รองใน `AppDashboardSection`  
- `src/systems/football-turf/lib/ui-tokens.ts` — `footballTurfPrimaryTab*` · `footballTurfFilterChip*` · `footballTurfMobileSelectClass`  
- `football-turf-module-nav.tsx` — แท็บ `offers` = «โปร / ลูกค้า»  
- คู่กับ: `dashboard-module-settings-single-row-tabs.mdc` · `dashboard-mobile-compact-wrap.mdc`


================================================================================
### .cursor/rules/dashboard-profile-module-sidebar.mdc
================================================================================

---
description: โมเดลใหม่ — sidebar ซ้ายแสดงเมนูของโมดูลนั้น (เริ่ม Smart Police) · ขนาดอ้างอิง BOTProject
alwaysApply: true
---

# Sidebar ซ้าย = เมนูโมดูล (แทนเมนูหลัก)

โมเดลใหม่สำหรับโมดูลงาน: **โครง sidebar ซ้ายเหมือนเดิม** แต่เนื้อหาเป็น **เมนูของระบบนั้น** ไม่ใช่เมนูหลักแดชบอร์ด (`basic`)

**เริ่มใช้แล้ว:** Smart Police เท่านั้น — ขยายโมดูลอื่นผ่าน registry  
**อ้างอิงขนาด:** `D:\BOTProject\frontend\src\layout\Shell.tsx` (`w-64` · `h-8` · `text-xs` · `py-1.5`)

คู่กับ: `dashboard-nav-menu-groups.mdc` (ข้อยกเว้นย่อ sidebar)

---

## 1) พฤติกรรม

| จอ | พฤติกรรม |
|----|----|
| **เดสก์ท็อป `md+`** | Sidebar ซ้าย = เมนูโมดูล · ท้ายแถบเหลือ username + ออกจากระบบ · **ห้าม** ปุ่ม «หน้าแรกแดชบอร์ด» ซ้ำ (ไปผ่าน popup โปรไฟล์ / เมนูหลัก) · **บังคับแสดง** sidebar ตอนเข้า (ไม่ย่ออัตโนมัติ) |
| **มือถือ** | Dock ล่างของโมดูลตามเดิม · drawer (แฮมเบอร์เกอร์) = เมนูโมดูลชุดเดียวกัน + ลิงก์กลับหน้าแรก |
| **รูปโปรไฟล์ (ทุกจอ)** | คลิกเปิด popup **เมนูหลัก** (ชุดเดียวกับ sidebar หน้าแกน: แดชบอร์ด · ระบบทั้งหมด · โปรไฟล์ · …) + ออกจากระบบ — ไม่ใช่เมนูโมดูล |

| สถานะ path | Sidebar ซ้าย |
|------------|--------------|
| หน้าแกน (`/dashboard` · profile · modules · …) | เมนูหลัก `basic` |
| โมดูลใน registry (`usesModuleWorkspaceSidebar`) | **เมนูโมดูล** |
| โมดูลอื่น (ยังไม่ลงทะเบียน) | ย่อ sidebar อัตโนมัติตามกฎเดิม |

---

## 2) ขนาดบังคับ (BOTProject)

| ชิ้น | ค่า |
|-----|-----|
| ความกว้าง | `w-64` |
| เปลือก sidebar (โมดูล) | `rounded-lg` · `border-slate-200/90` · `shadow-sm` — **เท่าการ์ดขวา** (ไม่ใช้ `rounded-[1.15rem]`) |
| ระยะแถวเนื้อหา | `p-2` · `gap-2` — บน=ล่าง=ซ้าย=ขวา=ช่องกลาง เท่ากัน · สูงกล่องซ้าย=ขวา (`items-stretch` · `h-full`) |
| หัวแถบ | `px-3 pb-2 pt-3` · ชื่อ `text-[10px] uppercase tracking` · badge `h-5 text-[10px]` |
| โซนรายการ | `gap-1` · `px-2.5 pb-2 pt-1` |
| รายการเมนู | `px-2.5 py-1.5` · `gap-2` · `text-xs font-black` · `rounded-xl` |
| ไอคอน | กล่อง `h-8 w-8 rounded-lg ring-1` · glyph `h-4 w-4` |
| idle | `border border-[#e8e6fc]/70` + gradient ขาว/ชมพูอ่อน (แบบ BOT) |
| active | `appDashboardBrandGradientFillClass` + ตัวอักษรขาว |
| ท้ายแถบ | ปุ่มกลับ `text-[11px] py-1.5` · username `text-[11px]` · logout `text-xs` |

**ห้าม** กลับไปใช้ขนาดเก่า (`w-[264px]` · `h-9` · `py-2.5` · `text-[13px]` · `gap-2` ระหว่างรายการ) ในโมเดลนี้

---

## 3) Chrome โมดูล

เมื่อโมดูลใช้โมเดลนี้แล้ว:

- **ห้าม** ใส่แถบหัวชื่อโมดูลซ้ำใน Shell (เช่น การ์ด «Smart Police») — ชื่อ/เมนูอยู่ sidebar แล้ว
- **ห้าม** ปุ่มลิงก์ไปหน้าเมนูซ้ายซ้ำในการ์ดเนื้อหา (เช่น ตั้งค่า / คดี บนภาพรวม) — เหลือเฉพาะ CTA ที่ไม่ซ้ำ (เช่น สำนวนแรก)
- เหลือ **dock มือถือ** ตามเดิม
- ไม่ต้องพึ่งยุบหัว + `*HeaderBarNav` สำหรับโมดูลนี้
- **เนื้อหาคอลัมน์ขวา:** ยืดเต็มความกว้าง·สูงที่เหลือ (`max-w-none` · ลด gutter) — ใช้พื้นที่จอให้คุ้ม · เลื่อนใน `main` บนเดสก์ท็อป
- **ความมน·ระยะห่าง:** sidebar ซ้าย = การ์ดขวา — `rounded-lg` · `border-slate-200/90` · `shadow-sm` · ช่องกลาง/ขอบนอก `gap-2` · `px-2` เท่ากัน (อย่าใช้ `rounded-[1.15rem]` คนละชั้นกับแผงโมดูล)

---

## 4) ขยายโมดูลใหม่ — เช็กลิสต์

1. [ ] เพิ่มใน `getModuleProfileSidebar()` — `src/lib/dashboard/module-profile-sidebar.ts`
2. [ ] ไอคอนใน `ModuleWorkspaceNavIcon` — `DashboardProfileModuleMenu.tsx`
3. [ ] ลบแถบเมนูเดสก์ท็อปใน Shell โมดูล
4. [ ] ตรวจ `usesModuleWorkspaceSidebar` → sidebar **เปิด** อัตโนมัติ · ไม่ย่อ
5. [ ] ขนาดรายการตรงตาราง §2
6. [ ] มือถือ: dock + drawer เป็นเมนูโมดูล

`DashboardShell` อ่าน registry อยู่แล้ว — ไม่ต้อง hardcode path ซ้ำถ้า registry ครบ

---

## 5) ไฟล์หลัก

| บทบาท | พาธ |
|-----|-----|
| Registry | `src/lib/dashboard/module-profile-sidebar.ts` |
| รายการเมนู (sidebar / drawer / popup) | `src/components/layout/DashboardProfileModuleMenu.tsx` |
| Shell หลัก | `src/components/layout/DashboardShell.tsx` |
| ต้นแบบโมดูล | `src/systems/smart-police/` · `smart-police-nav.ts` · `SmartPoliceShell.tsx` |
| อ้างอิงขนาดภายนอก | `D:\BOTProject\frontend\src\layout\Shell.tsx` |


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

## 1) เมนูบนมือถือ / ไอแพดแนวตั้ง — อยู่ด้านล่าง

เมื่อพูด **มือถือ** ให้รวม **ไอแพดแนวตั้ง** — ดู `dashboard-mobile-viewport.mdc`

- แถบนำทางหลักของโมดูลบน viewport แคบ (**มือถือ / ไอแพดแนวตั้ง · `lg:hidden`**) ต้องเป็น **แถบล่าง** (`fixed` / `sticky bottom`) — **ไม่** ใช้แถบบนหรือ hamburger แทนฐานนำทางหลักของโมดูล
- **แถบล่าง:** ชั้นเดียวเต็มขอบ · ไม่ซ้อนกล่อง pill — `mobile-dock-tokens.ts` · เลือกแล้วเน้นสีไอคอน
- **แถบหัว:** ชั้นเดียวชิดขอบซ้าย–ขวา–บน · ไอคอน · ไม่ซ้อนกล่อง — `dashboard-mobile-header-bar.mdc`
- รองรับ **safe area** บน/ล่างผ่านโทเค็นกลาง (`safe-area-tokens` / dock / header)
- **พื้นที่เลื่อนเนื้อหา** ต้องมี padding-bottom เพื่อไม่ให้ถูก dock บัง
- **อ้างอิงโค้ด:** `AppMobileDockShell` · `DashboardShell` header · `src/systems/car-wash/…`
- **แถวการ์ดสรุปตัวเลข (stat) บนมือถือ:** ต้องเป็น **2 คอลัมน์** (`grid-cols-2`) — ห้ามปล่อย `grid-cols-1` บน viewport แคบ — รายละเอียดการ์ดคี่/คู่: **`.cursor/rules/dashboard-mobile-summary-stat-grid.mdc`**
- **รายการที่กรองได้ (แพ็กเกจ · เหมา · จอง ฯลฯ):** ต้องมีปุ่ม **แสดง/ซ่อนกรอง** — **`.cursor/rules/dashboard-module-list-filter.mdc`** · มือถือไอคอน: **`.cursor/rules/dashboard-mobile-filter-icon.mdc`**

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
- **แถบหัวภาพรวมโปรเจกต์:** `src/components/layout/DashboardShell.tsx` — แถบบน sticky **เต็มขอบ** (ไม่ซ้อน pill) · **sidebar** เดสก์ท็อป และ `<main>` ใช้มุมมนตามแม่แบบโมดูล

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
- **จองบริการ + ตารางพนักงาน** (แพ็กก่อนสล็อต · พอริตีแดชบอร์ด/พอร์ทัล · ห้ามจองอดีต · วันที่รับบริการ): **`.cursor/rules/module-booking-staff-schedule-template.mdc`** (ต้นแบบร้านตัดผม)
- **ตั้งค่าร้าน — แถบเมนูมาตรฐาน** (พื้นฐาน · การเงิน · เว็ปลิงค์ลูกค้า · เวลาเปิดร้าน): **`.cursor/rules/dashboard-module-shop-settings-tabs.mdc`**
- Hub QR การ์ดคู่ + ป๊อปอัป: **`.cursor/rules/shop-qr-hub-popup-pattern.mdc`**
- **แผนที่ไฟล์คู่ขนาน (คาร์แคร์ × ร้านตัดผม):** **`.cursor/rules/dashboard-module-car-wash-barber-reference.mdc`**

เมื่อแม่แบบคาร์แคร์กับโมดูลใหม่ขัดกันเรื่องโดเมน ให้คง **โครงสร้าง UX** (เมนูล่าง, มุมมน, glass, โมดัล) แล้วปรับสีคัดลอก/ข้อความให้เข้าธีมโดเมน

- **สนามฟุตบอล (ตัวอย่างโมดูลครบชุด — UX/UI · ขอบซ้ายขวา · อัปโหลด · QR · ปุ่ม · ซ่อม):** `.cursor/rules/football-turf-module-dashboard-template.mdc`
- **หน้าการเงินข้ามโมดูล (สรุป · กรองชิป pill · กราฟ · แท็บ · สลิป · แก้ไข/ลบ + `useAppNoticePopup` · รายจ่าย · สีราคา):** `.cursor/rules/dashboard-finance-module-template.mdc`
- **โรงแรม / รีสอร์ท (ระยะขอบ · ซ่อนหัว · ความโค้งมน `1.5rem` · dock · ชำระเงินสด/พร้อมเพย์/โอน):** `.cursor/rules/hotel-resort-module-dashboard-template.mdc` · ชำระเงิน: `.cursor/rules/hotel-resort-payment-methods.mdc`
- **เว็บไซต์จองลูกค้า (template ทุกโมดูล — แบนเนอร์เต็มจอ · ค้นหา/เลือกทรัพยากร · มัดจำ/QR/สลิป · รีวิว · รายละเอียดหลังจองแบบโรงแรม · จอดรถ/ร้านอาหาร/สนาม):** `.cursor/rules/module-customer-booking-website-portal.mdc`
- **ผังห้อง (เตือน amber/rose · ผู้จองต่อ · ไม่มีแบนเนอร์บน):** `.cursor/rules/hotel-resort-room-grid-occupancy.mdc`
- **ศูนย์แอดมิน (การ์ดรายการ · ตัดคำอธิบาย · Export Excel):** `.cursor/rules/admin-hub-dashboard-template.mdc`
- **ความกว้าง / gutter ซ้าย–ขวา (ทุกชั้น):** `.cursor/rules/dashboard-page-width.mdc`
- **ซ่อน/แสดงกลุ่มเมนู · ซ่อนเมนูหลักล่าง · ย่อ sidebar:** `.cursor/rules/dashboard-nav-menu-groups.mdc`
- **โมเดลใหม่ — sidebar = เมนูโมดูล (Smart Police ก่อน · ขนาด BOTProject):** `.cursor/rules/dashboard-profile-module-sidebar.mdc`


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
### .cursor/rules/drink-pos-module-dashboard-template.mdc
================================================================================

---
description: แพทเทิร์น UI/UX ครบชุด POS ร้านเครื่องดื่ม — อ้างอิงเมื่อสร้าง/ปรับโมดูลแดชบอร์ดอื่น (หัวยุบ, dock, ออเดอร์, กริด, แต้ม, การเงิน)
globs:
  - "**/systems/drink-pos/**"
  - "**/app/**/dashboard/drink-pos/**"
  - "**/app/drink-pos/**"
  - "**/app/api/drink-pos/**"
  - "**/systems/general-store-pos/**"
  - "**/systems/building-pos/**"
alwaysApply: false
---

# POS ร้านเครื่องดื่ม (drink-pos) — เทมเพลตโมดูลสำหรับนำไปใช้ต่อ

ใช้เมื่อสร้างหรือปรับโมดูลแดชบอร์ดใหม่ (โดยเฉพาะ **POS / ออเดอร์ / กริดสินค้า / สะสมแต้ม / การเงิน**) ให้ใกล้เคียงชุดล่าสุดของ **POS ร้านเครื่องดื่ม**

**หลักการโปรเจกต์:** `dashboard-ux-car-wash-baseline.mdc` · `app-templates-central.mdc` · `module-chrome-no-branding.mdc` · `dashboard-new-module-sidebar-icon.mdc` · `dashboard-page-width.mdc` · `dashboard-mobile-summary-stat-grid.mdc`

**คู่ขนาน:** `dashboard-module-car-wash-barber-reference.mdc` · สนามฟุตบอล `football-turf-module-dashboard-template.mdc` · QR hub `shop-qr-hub-popup-pattern.mdc` · **ลิงก์ลูกค้า** `pos-customer-order-link-ux.mdc` · **สะสมคะแนน** `pos-loyalty-points.mdc`

---

## 1) โครงไฟล์มาตรฐาน

| บทบาท | ไฟล์ |
|--------|------|
| Layout + guard | `src/app/(dashboard)/dashboard/drink-pos/layout.tsx` → `DrinkPosShell` |
| Shell (หัว + ยุบหัว + คู่มือ + provider เมนูล่าง) | `components/DrinkPosShell.tsx` |
| เมนู / collapse state | `lib/drink-pos-module-nav.ts` |
| แท็บใน header ม่วงเมื่อยุบหัว (เดสก์ท็อป) | `DrinkPosHeaderBarNav.tsx` · `DrinkPosHeaderExpandButton` |
| Dock มือถือ + สล็อตสรุปบิล | `DrinkPosMobileBottomChrome.tsx` · `DrinkPosMobileDock.tsx` |
| หน้าออเดอร์ | `DrinkPosOrderClient.tsx` · `/order` |
| คิวออเดอร์ + ลิงก์แผนก | `DrinkPosOrdersClient.tsx` · `/orders` · `DrinkPosOrderBoardClient` |
| แผนกทำ / เสิร์ฟ (สาธารณะ) | `/drink-pos/kitchen/[ownerId]` · `/drink-pos/serve/[ownerId]` |
| สถานะออเดอร์ | `lib/fulfillment-status.ts` · `RECEIVED` → `MAKING` → `DONE` (พร้อมรับ) → `SERVED` (ส่งมอบแล้ว · ออกจากกระดาน) |
| หน้าสินค้า / draft | `DrinkPosDashboardClient.tsx` |
| การเงิน (ช่วงเวลา + กราฟ + แท็บประวัติ/รายจ่าย) | `DrinkPosSalesClient.tsx` · `DrinkPosCostsPanel.tsx` · `GET /api/drink-pos/finance-summary` |
| หมวดรายจ่าย / บันทึกต้นทุน | `DrinkPosCostsPanel` · `DrinkPosCostCategory` · `paymentSlipUrl` บน `DrinkPosCostEntry` · กฎ `dashboard-expense-cost-categories.mdc` |
| สมาชิก / QR hub | `DrinkPosLoyaltyHubClient` · `DrinkPosLoyaltyBar` · `DrinkPosQrPosterClient` · เมนู «ลิงก์» (QR ลูกค้า · **QR พนักงาน** · ค้นหา · แผนกทำ/เสิร์ฟ) — ลิงก์พนักงานทั้งชุด: **`.cursor/rules/module-staff-token-link-portal.mdc`** |
| ตั้งค่าร้าน + สะสมแต้ม | `DrinkPosShopSettingsClient.tsx` · `PATCH /api/drink-pos/profile` |
| กฎแต้ม (ข้อความ) | `lib/loyalty-rule.ts` (`formatDrinkPosLoyaltyRule`) |
| โทเค็น UI | `lib/ui-tokens.ts` |
| พอร์ทัลสาธารณะ | `DrinkPosPortalClient.tsx` · `/drink-pos/[ownerId]` |

โมดูลใหม่: แยก **nav + shell + dock chrome + หน้า client + api** — อย่าผูก logic ยาวใน `page.tsx`

---

## 2) เลย์เอาต์แดชบอร์ด + ความกว้าง + เมนูหลักระบบ

| โซน | มือถือ | เดสก์ท็อป (`lg+`) |
|-----|--------|-------------------|
| เมนูโมดูล | **dock ล่าง** (`AppMobileDockUnifiedBar`) · safe-area | **แท็บแนวนอน** ในการ์ดหัวโมดูล |
| หัวชื่อโมดูล | การ์ดแก้ว `drinkPosGlassShellClass` | เหมือนกัน (ยุบได้) |
| เนื้อหา | `pb-24` (`drinkPosMainPaddingBottomClass`) | `lg:pb-0` |
| ความกว้างหน้า | เต็มช่วงโมดูล | `DashboardPagesShell`: `max-w-none lg:!px-6` (คู่สนามฟุตบอล) |

**ห้าม** ใส่ `MawellLogo` / แบรนด์ซ้ำใน chrome โมดูล

**เข้าโมดูล → ย่อ sidebar หลัก** (`DashboardShell` + `isModuleWorkspacePath`) — ยังกดปุ่มเปิด sidebar ได้

**มือถือเข้าโมดูล → ซ่อน `MobileBottomNav` หลัก** (`hideMainMobileBottomNav = moduleStaffKiosk \|\| isModuleWorkspacePath`) — เหลือแค่เมนูโมดูลล่าง

**เส้น accent หัวการ์ด:** หลัง `h-1.5` gradient bar ต้องมี **`mt-5`** ก่อนไอคอน/ปุ่ม/ข้อความ

---

## 3) ยุบ/ขยายหัวโมดูล

สถานะ: `localStorage` + `CustomEvent` จาก `drink-pos-module-nav.ts`  
(`DRINK_POS_HEADER_COLLAPSE_KEY` / `DRINK_POS_HEADER_COLLAPSE_EVENT`)

| สถานะ | มือถือ | เดสก์ท็อป |
|-------|--------|----------|
| **หัวเปิด** | การ์ดหัว · ปุ่มคู่มือ · **ปุ่มซ่อนชิดขวาสุด** · **ไม่มีแท็บในหัว** (ใช้ dock) | การ์ดหัว + แท็บกริด · **ปุ่มซ่อนชิดขวาสุด** (หลังคู่มือ) |
| **หัวยุบ** | **ห้าม** แท็บใน header ม่วง — โทเคน + **ปุ่มขยายชิดขวา** | แท็บใน `DrinkPosHeaderBarNav` · ชื่อโมดูลข้อความล้วน (ไม่มีกรอบ pill) ชิดขวา · **ปุ่มขยายขวาสุด** |

จุดต่อ `DashboardShell.tsx`:

- `showDrinkPosHeaderBar = onModule && collapsed`
- มือถือ: เฉพาะ `DrinkPosHeaderExpandButton` + บรรทัดโทเคน — **ไม่** render แถบแท็บ
- `lg+`: `DrinkPosHeaderBarNav` เต็ม

โมดูลอื่น: คัดลอก key/event แยกต่อ slug — อย่าซ้ำแท็บกับ dock บนมือถือ

---

## 4) ออเดอร์ / ตะกร้า

อ้างอิง `DrinkPosOrderClient.tsx` (+ draft ใน `DrinkPosDashboardClient.tsx`)

### มือถือ

1. กริดเมนูเต็มความกว้าง · สมาชิกอยู่เหนือกริด
2. มีรายการในบิล → สรุปใน **สล็อตเหนือ dock** (`useDrinkPosMobileDraftSlot`)
3. แตะสรุป → **`FormModal` «สรุปรายการ»** (แก้จำนวน / ลบ / บันทึก)
4. **ห้าม** แผงตะกร้าสูงถาวรทับเมนูถ้ามีแพทเทิร์นนี้แล้ว

### เดสก์ท็อป (`lg+`)

- 2 คอลัมน์: **ซ้าย** สมาชิก + รายการ + ชำระ · **ขวา** กริด — แผงซ้าย `hidden lg:flex`
- **เลื่อนอิสระแยกคอลัมน์เมื่อเกินขอบล่าง** (หน้า `/order` แดชบอร์ด — บังคับ):
  - **เชนความสูง (เดสก์ท็อป `lg+` เท่านั้น):** `DashboardShell` (`onPosOrderPage`) → `PageContainer` → `DrinkPosShell` → `DrinkPosOrderClient`
  - กริด: `lg:grid-rows-1` + `overflow-hidden` · **ซ้าย/ขวา** `lg:h-full` + สกอลล์ในคอลัมน์
  - **ห้าม** `max-h-[calc(100dvh-…)]` บนคอลัมน์อย่างเดียว — อยู่ใต้หัวโมดูลแล้วล้นขอบล่างจอ (ส่วนล่าง «หาย»)
  - **ห้าม** ล็อก `h-[100dvh]` ทั้ง `DashboardShell` ทุกหน้า — เฉพาะ `/order` + `lg:`
  - คู่ขนานร้านอาหาร: `BuildingPosOrderClient` · `.cursor/rules/building-pos-dashboard-template.mdc` § หน้าออร์เดอร์
- **มือถือแดชบอร์ดออเดอร์:** ยังไม่ปรับ (รอกำหนด) — เลื่อนทั้งหน้าตามเดิม
- **ลิงก์พนักงาน** (`layout="staffPortal"`):
  - เดสก์ท็อป: ซ้าย/ขวาเลื่อนอิสระใน `h-dvh`
  - มือถือ: แท็บเมนูล่าง · หัวคงที่ · สกอลล์รวมเบอร์โทร+เมนู
  - รายละเอียดเต็ม → **`.cursor/rules/module-staff-token-link-portal.mdc`** (§3 เดสก์ท็อป · §4 มือถือ)

### Draft หน้าสินค้า

- เดสก์ท็อป: แผงลอย `drinkPosDraftPanelClass`
- มือถือ: สล็อต dock + `FormModal` เหมือนออเดอร์

### ช่องทางชำระ (บิล)

- ทางเลือก: **เงินสด · พร้อมเพย์ · โอนเงิน** — `DrinkPosPaymentPanel` + `lib/payment-method.ts`
- พร้อมเพย์: QR จาก `POST /api/drink-pos/promptpay-qr` (เบอร์จากตั้งค่าร้าน)
- โอน: แสดงธนาคาร/เลขบัญชีจากโปรไฟล์ร้าน · แนบสลิป (อัปโหลด `/api/drink-pos/upload`)
- พร้อมเพย์/โอนเมื่อยอด > 0 **แสดงช่องแนบสลิปได้ (ไม่บังคับ)** (`paymentMethod` · `paymentSlipUrl` บน `DrinkPosSale`)
- มือถือ: ปุ่ม dock «ชำระ / บันทึก» เปิดโมดัลสรุป (เลือกช่องทางที่นั่น)

---

## 5) กริดสินค้า (ภาพรวมหนาแน่น)

| Viewport | คอลัมน์ | ช่องว่าง |
|----------|---------|----------|
| มือถือ | **`grid-cols-3`** | `gap-1.5` |
| `sm`–`md` | 3–4 | `gap-2` |
| ออเดอร์ `lg`→`2xl` | 4 → 6 → 8 | `drinkPosProductGridClass` |
| จัดการสินค้า `lg+` | **8** | `lg:gap-2` |

ย่อมือถือ: ฟอนต์/padding การ์ดเล็กลง · `rounded-lg` · ป้ายจำนวน/แนะนำเล็กลง  
โทเค็น: `drinkPosProductCardClass` · `drinkPosProductGridClass`

---

## 6) สะสมคะแนน (บาท → คะแนน)

ดูรายละเอียดบังคับที่ **`pos-loyalty-points.mdc`** (กฎแต้ม · รายการแลก · รูปกำหนดเอง · ย่อรูปก่อนอัปโหลด)

| รายการ | ค่า / ที่อยู่ |
|--------|----------------|
| Schema | `DrinkPosLoyaltySettings` · `DrinkPosLoyaltyReward` (+ `imageUrl` เมื่อไม่ผูกสินค้า) |
| API | `GET/PATCH /api/drink-pos/session/loyalty` · `…/loyalty/rewards` |
| UI ตั้งค่า | `/dashboard/drink-pos/settings` — `DrinkPosLoyaltySettingsClient` |
| ข้อความกฎ | `formatDrinkPosLoyaltyEarnRule(baht, points)` |
| แสดงผล | `DrinkPosLoyaltyBar` · hub สมาชิก · ลิงก์ลูกค้า / พอร์ทัล |

**ห้าม** hardcode ข้อความกฎใน UI — อ่านจาก settings เสมอ

สมาชิก / QR: การ์ดคู่ + `FormModal` ตาม `shop-qr-hub-popup-pattern.mdc`

---

## 7) การเงิน — ช่วงเวลา (ค่าเริ่มต้นเดือนนี้)

อ้างอิง `DrinkPosSalesClient.tsx` + `GET /api/drink-pos/finance-summary?range=`

**แม่แบบข้ามโมดูล (บังคับ):** **`dashboard-finance-module-template.mdc`**  
กฎย่อย: `dashboard-finance-page-layout.mdc` · `dashboard-finance-filter-charts-toggle.mdc` · `dashboard-finance-detail-tabs.mdc` · `dashboard-expense-cost-categories.mdc`

| ช่วง | `range` | กราฟ |
|------|---------|------|
| วันนี้ | `TODAY` | รายวัน (1 แท่ง) |
| **เดือนนี้ (default)** | `MONTH` | รายวัน 1…วันนี้ |
| ปีนี้ | `YEAR` | **รายเดือน** |
| กำหนดเอง | `CUSTOM` + `from`/`to` | รายวันในช่วง |

UI:

1. **ตัวเลขสรุปด้านบนสุด** — รายได้ `emerald-700` / ต้นทุน `rose-600` / กำไร (ไม่ถูกซ่อนกราฟ)
2. **การ์ดการเงินใบเดียว** — แสดง/ซ่อนกรอง · แสดง/ซ่อนกราฟ · รีเฟรช · แผงกรอง · กราฟ
3. **ชิปช่วงเวลา** เป็นปุ่ม pill เล็ก (`flex-wrap`) — **ห้าม**เต็มจอ / `grid-cols-4`
4. ช่องพิมพ์สูงเท่ากัน · `sm+` แถวเดียว · **รีเซ็ตเฉพาะเมื่อกรองค้าง** · ซ่อนกรอง/กราฟแล้วไม่มี placeholder
5. **แถบแท็บ** `drinkPosFinanceSubTabShellClass` — **ประวัติ / รายรับ** · **รายจ่าย**
6. ประวัติ: สลิปเฉพาะเมื่อมี · ราคาขวา emerald · **ทุกแถวแก้ไข+ลบได้** · ลบยืนยันด้วย `useAppNoticePopup` · รายจ่าย: `DrinkPosCostsPanel` (ฟอร์ม 5 ช่องต้นแบบร้านอาหาร · ราคา rose · แก้ไข/ลบ + `notice.confirm`)

API response: `buckets` · `totalRevenue` · `totalCost` · `rangeLabel` · (คง `totalRevenue7d`/`totalCost7d` alias ได้)

Timezone วัน: **Asia/Bangkok** (`en-CA` YYYY-MM-DD)

---

## 8) โทนสี / การ์ด / ปุ่ม

- Brand: `#0000BF` → violet → pink (`appDashboardBrandGradientFillClass` / `BarClass`)
- หัวข้อ: `font-black` · `#1e1b4b` · รอง `#66638c` / `#4d47b6`
- CTA / chip active / nav active: gradient fill
- สถิติมือถือ: **`grid-cols-2`** (+ การ์ดคี่ `col-span-2 lg:col-span-1`)
- แก้ไข/ลบแถว: `AssetRowActionIcons` + `aria-label`
- **`AppSectionHeader`**: `title` (+ `action`) — **ห้าม** `description` ยาวใต้หัว
- คู่มือ: `AppUsageGuideModal`

---

## 9) พฤติกรรมที่ต้องทำซ้ำในโมดูล POS / ออเดอร์ใหม่

1. Shell + layout ห่อทุกหน้าใต้ `/dashboard/{slug}`
2. Dock มือถือ = เมนูหลักโมดูล · ซ่อนเมนูหลักแดชบอร์ดล่างเมื่ออยู่ path โมดูล
3. หัวยุบได้ · sync header ม่วงบนเดสก์ท็อปเท่านั้น · มือถือไม่โชว์แท็บใน header
4. ปุ่มซ่อน/ขยายหัว **ชิดขวาสุด** ของแถบที่เกี่ยวข้อง
5. ตะกร้ามือถือ = สล็อต dock + `FormModal`
6. กริดสินค้ามือถือ **3 คอลัมน์** + การ์ดย่อ
7. ความกว้างเต็มเมื่อต้องการพื้นที่กริด/ตาราง
8. ไม่มีแบรนด์ซ้ำใน chrome โมดูล
9. สะสมแต้มตั้งค่าได้ (ถ้ามี loyalty) — ไม่ hardcode จำนวน
10. การเงินมี วันนี้/เดือนนี้/ปีนี้ · **default เดือนนี้**

---

## 10) เช็กลิสต์คัดลอกไปโมดูลอื่น

- [ ] `*Shell` + `*module-nav` (href / active / collapse key+event)
- [ ] `*MobileBottomProvider` + dock · สล็อต draft ถ้ามีตะกร้า
- [ ] `DashboardShell` ต่อ collapse (มือถือไม่โชว์แท็บใน header · ปุ่มขยายขวา)
- [ ] `hideMainMobileBottomNav` / `isModuleWorkspacePath` ครอบ path ใหม่
- [ ] `DashboardPagesShell` gutter ถ้าต้องการเต็มความกว้าง
- [ ] ไอคอน sidebar + รูปปก landing
- [ ] `ui-tokens` แยกโมดูล
- [ ] ออเดอร์: มือถือ popup สรุป · เดสก์ท็อปแผงซ้าย
- [ ] กริดสินค้ามือถือ `grid-cols-3` + การ์ดย่อ
- [ ] (ถ้ามีแต้ม) settings: `stampsPerReward` + `rewardTitle` + ข้อความกฎไดนามิก
- [ ] (ถ้ามีการเงิน) chip วันนี้/เดือนนี้/ปีนี้ · default **MONTH** · API `?range=`


================================================================================
### .cursor/rules/ecommerce-store-module-dashboard-template.mdc
================================================================================

---
description: ร้านออนไลน์ (ecommerce-store) — แดชบอร์ดสินค้า · ฟอร์ม · หน้าร้านกริด/รายละเอียด/รีวิว ตาม template ซักผ้า
globs:
  - "**/systems/ecommerce-store/**"
  - "**/app/**/dashboard/ecommerce-store/**"
  - "**/app/api/ecommerce-store/**"
  - "**/app/shop/**"
alwaysApply: false
---

# ร้านออนไลน์ — แม่แบบโมดูล (สินค้า · หน้าร้าน · รีวิว)

ยึด UX ซักผ้า (plain panel · ปุ่ม `h-9` · `rounded-lg`) + กฎกลางที่เกี่ยวข้อง  
คู่กับ: **`ecommerce-store-settings-links-template.mdc`** · **`ecommerce-storefront-category-scroll.mdc`** · **`dashboard-add-form-modal.mdc`**

**โทเค็น:** `src/systems/ecommerce-store/lib/ui-tokens.ts`

---

## 1) แผนที่ไฟล์

| งาน | ไฟล์ |
|-----|------|
| รายการสินค้าแดชบอร์ด | `EcommerceProductsClient.tsx` |
| หน้าร้านสาธารณะ | `EcommerceStorefrontClient.tsx` · `EcommerceProductCard.tsx` |
| ตะกร้า / ชำระเงิน | `EcommerceCartClient.tsx` · `EcommerceCheckoutClient.tsx` |
| โมดัลดูสินค้า | `EcommerceProductDetailModal.tsx` |
| รีวิวลูกค้า | `EcommerceStorefrontReviewPanel.tsx` · API `public/[storeId]/reviews` |
| รูปปก + มุมอื่น | `galleryImagesJson` · `lib/ecommerce/product-images.ts` |
| แสดงบนเว็บ | `isActive` (ติ๊ก «แสดงบนเว็บไซต์») |

---

## 2) หน้าร้าน (`/shop/[storeId]`)

### กริดสินค้า

| Viewport | คอลัมน์ |
|----------|---------|
| มือถือ | **3** |
| คอม (`lg+`) | **8** |

- โทเค็น: `ecommerceStorePortalProductGridClass` (= `grid-cols-3` · `lg:grid-cols-8` · `auto-rows-fr` · `items-stretch`)
- การ์ด **สูงเท่ากันในแถว** — wrapper `h-full` · ปุ่มการ์ด `h-full flex flex-col` · ราคา `mt-auto`
- มุมการ์ด: `rounded-xl` · พื้น **ขาว** · ขอบ `border-slate-200/90`

### การ์ดสินค้า

1. รูปปก `aspect-square` · ป้ายแนะนำ/ขายดี/ตะกร้า · จำนวนรูปถ้ามีหลายมุม  
2. ชื่อ `line-clamp-2` + ความสูงขั้นต่ำคงที่  
3. **รายละเอียด** `line-clamp-2` (ว่างแสดง `—` เพื่อความสูงเท่ากัน)  
4. ราคา + คะแนนรีวิว (ถ้ามี)  
5. **คลิกการ์ด** → เปิด `EcommerceProductDetailModal` (ไม่ใส่ตะกร้าจากการ์ดโดยตรง)

### โมดัลรายละเอียดสินค้า

- `FormModal` **`appearance="default"`** (พื้นขาว) — **ห้าม** `glass`  
- `mobileCentered` · มุมโมดัลตาม FormModal (`rounded-[2rem]`)  
- แผงใน: `rounded-xl border … bg-white shadow-sm`  
- รูปหลัก + แถบมุมอื่น · แตะเปิด `AppImageLightbox` / `openGallery`  
- ใส่ตะกร้าใน footer โมดัล  
- แสดงรีวิวสินค้า (GET reviews by productId)

### รีวิวลูกค้า

- ส่วน «รีวิวสินค้า» บนหน้าร้าน: ค้น **รหัสออเดอร์/ติดตาม + เบอร์** (ออเดอร์ `SHIPPED` เท่านั้น)  
- **สินค้า 1 ชิ้น / เบอร์ 1 ครั้ง** (unique `storeId + productId + customerPhone`)  
- API: `reviews/lookup` · `reviews` POST  

### แถบหมวด

ดู **`ecommerce-storefront-category-scroll.mdc`** — แถวเดียวเลื่อนแนวนอน ห้าม wrap

### ตะกร้า / ชำระเงิน / สรุปรายการ (`/cart` · `/checkout` · `/order/[code]`)

| ชั้น | ค่า |
|------|-----|
| ความกว้าง | `max-w-6xl` · `px-4 sm:px-6` (`ecommerceStorePortalPageInnerClass`) |
| พื้น | `#faf9ff` · หัว sticky ขาว (`ecommerceStorePortal*`) |
| มือถือ | เนื้อหา 1 คอลัมน์ · **dock ล่าง** ยอด + CTA (`ecommerceStorePortalBottomDockClass` · `lg:hidden`) · `pb-28` |
| คอม (`lg+`) | **2 คอลัมน์** — รายการ/ฟอร์มซ้าย · สรุป(+QR/สลิป) ขวาสติ๊กกี้ · ซ่อน dock |

- แผง: `ecommerceStorePanelClass`  
- **checkout:** การ์ดเดียว — ที่อยู่จัดส่ง + แนบสลิป (ห้ามหัวข้อซ้ำ «ข้อมูลจัดส่ง» / «แนบสลิป» เมื่อมีหัวหน้า «ชำระเงิน» แล้ว)  
- **สรุปรายการ:** สถานะ+รายการ+ที่อยู่ซ้าย · ยอด/สลิปขวา (`lg`) · dock «ติดตาม / ซื้อต่อ» บนมือถือ  
- ช่องกรอก: `ecommerceStoreFieldClass` / `ecommerceStoreTextareaClass`  
- ปุ่ม: outline/primary โมดูล · สลิปผ่าน `AppImagePickCameraButtons` + `prepareImageFileForUpload`
- **รายการออเดอร์แดชบอร์ด:** รูปสลิป/สินค้าใช้ **`AppLabeledImageThumb`** (`kind="slip"` / `"product"`) — ป้ายมุมล่างรูป · `flex items-start gap-3` กับรหัสออเดอร์ — **ห้าม** ป้ายข้อความใต้รูปทับชื่อ · ดู **`app-templates-media.mdc`** · wrapper เก่า `EcommerceLabeledImageThumb`  
- **หลังยืนยันออเดอร์:** `router.push(/shop/{storeId}/order/{trackingCode})` — หน้าสรุปรายการ (`EcommerceOrderSummaryClient`) ห้ามค้างที่ checkout  
- อ้างอิง: `EcommerceCartClient.tsx` · `EcommerceCheckoutClient.tsx` · `EcommerceOrderSummaryClient.tsx`

---

## 3) แดชบอร์ด — เมนูสินค้า

### รายการ

- ติ๊ก **«เว็บไซต์»** ต่อแถว = `isActive` (เขียวเมื่อเปิด · ซ่อนเมื่อปิด → ป้าย «ซ่อนเว็บ»)  
- กรองชิป: ทั้งหมด · ใกล้หมด · หมด · **ซ่อนเว็บ**  
- ปุ่มแก้ไข/ลบ = ไอคอนแถว (`AssetRowActionIcons`)  
- ± สต๊อก = `ecommerceStoreRowIconButtonClass` (`h-7`)

### ฟอร์มเพิ่ม / แก้ไข (`FormModal` size `lg`)

**โครงสร้างแผง (บังคับ):**

| แผง | เนื้อหา |
|-----|---------|
| ข้อมูลพื้นฐาน | ชื่อ · ราคา · สต๊อก · SKU · หมวด · รายละเอียด |
| การแสดงบนเว็บไซต์ | ติ๊กแสดงบนเว็บ · เด่น · แนะนำ · ขายดี |
| รูป | รูปปก + `AppImagePickCameraButtons` · รูปมุมอื่น (สูงสุด 11) |

- แผง: `ecommerceStorePanelClass` + `p-3 sm:p-3.5`  
- ช่องกรอก: `ecommerceFieldClass` / `ecommerceStoreTextareaClass` (`h-9` · `rounded-lg`)  
- ป้ายฟิลด์: `text-xs font-semibold text-[#4d47b6]`  
- แถวติ๊ก: `rounded-lg border … bg-slate-50/80` ความสูงใกล้ `min-h-9`

### ปุ่มฟอร์ม (บังคับ — โทเค็นโมดูล)

| ปุ่ม | คลาส |
|-----|------|
| ยกเลิก / เพิ่มมุมรูป / เลือกรูป | `ecommerceStoreOutlineButtonClass` |
| บันทึก / เพิ่มสินค้า | `ecommerceStorePrimaryButtonClass` |
| ลบมุมรูปบน thumb | `ecommerceStoreRowIconButtonClass` + โทน rose |

- ใช้ footer แบบ `ProductFormModalFooter` ใน `EcommerceProductsClient` (outline + primary `h-9`)  
- **อนุญาต** ไม่ใช้ `FormModalFooterActions` ถ้าต้องการสูง/มนให้เท่าแถบหัวซักผ้า — แต่ต้องคู่ outline/primary ของโมดูล  
- `AppImagePickCameraButtons` ส่ง `buttonClassName={ecommerceStoreOutlineButtonClass}`  
- ก่อนอัปโหลด: **`prepareImageFileForUpload`**

### ความหมาย `isActive`

| ติ๊ก «แสดงบนเว็บไซต์» | พฤติกรรม |
|----------------------|----------|
| เปิด | รวมใน `/shop` (`isActive: true` + มีสต๊อก) |
| ปิด | ซ่อนจากเว็บ — ยังเห็น/แก้ในแดชบอร์ดได้ |

---

## 4) สคีมา / API ที่เกี่ยว

- `EcommerceProduct.galleryImagesJson` — JSON `string[]` มุมอื่น (ไม่รวมปก)  
- `parseEcommerceProductImageUrls` / `serializeEcommerceGalleryImages`  
- `EcommerceProductReview` — unique ต่อเบอร์+สินค้า  
- Session products GET/POST/PATCH ส่ง/รับ `galleryImageUrls` · `description` · `isActive`

---

## 5) ห้าม

- กริดหน้าร้านเป็น 2/4 คอลัมน์แบบเก่าโดยไม่ตั้งใจ  
- ห่อ cart/checkout ด้วย `max-w-lg` ทั้งหน้า (ให้ใช้ `max-w-6xl` เท่าหน้าร้าน)  
- การ์ดสูงไม่เท่ากันเพราะไม่มีช่องรายละเอียดคงที่  
- โมดัลดูสินค้าเป็น `appearance="glass"`  
- ฟอร์มสินค้ากระจาย checkbox/ปุ่ม ad-hoc ไม่ใช้แผง + โทเค็น `h-9`  
- ซ่อนสินค้าจากเว็บด้วย soft-delete ทั้งแถวแทน `isActive`  
- อัปโหลดรูปโดยไม่ `prepareImageFileForUpload`

## เช็กลิสต์

- [ ] กริด 3 / 8 + การ์ดสูงเท่า + คำอธิบายบนการ์ด  
- [ ] คลิก → โมดัลขาว + แกลเลอรีหลายมุม + ใส่ตะกร้า  
- [ ] รีวิว: lookup ออเดอร์จัดส่งแล้ว · 1 ครั้ง/สินค้า/เบอร์  
- [ ] ฟอร์ม 3 แผง · footer outline/primary  
- [ ] ติ๊กแสดงบนเว็บไซต์ (ฟอร์ม + แถวรายการ)  
- [ ] รูปปก + มุมอื่นในแอดมิน


================================================================================
### .cursor/rules/ecommerce-store-settings-links-template.mdc
================================================================================

---
description: ร้านออนไลน์ (ecommerce-store) — ตั้งค่าเว็บไซต์ vs แท็บลิงก์ (เว็บ+พนักงาน) บล็อกสายรายวันทีเดียว
globs:
  - "**/systems/ecommerce-store/**"
  - "**/app/**/dashboard/ecommerce-store/**"
  - "**/app/api/ecommerce-store/**"
  - "**/app/shop/**"
alwaysApply: false
---

# ร้านออนไลน์ — ตั้งค่าเว็บไซต์ vs ลิงก์

ยึดกฎกลาง: **`dashboard-module-shop-settings-tabs.mdc`** · **`shop-qr-hub-popup-pattern.mdc`**  
แม่แบบสินค้า/หน้าร้าน/ฟอร์ม: **`ecommerce-store-module-dashboard-template.mdc`**

## แท็บตั้งค่า (`EcommerceSettingsClient`)

| `?tab=` | ชื่อ UI | เนื้อหา |
|---------|---------|--------|
| `basic` | ตั้งค่าพื้นฐาน | ชื่อ · โลโก้ · สโลแกน · เบอร์ · ที่อยู่ · สต๊อก |
| `finance` | ตั้งค่าเกี่ยวกับการเงิน | พร้อมเพย์ · โอน · สลิป · หมายเหตุ |
| `portal` | **ตั้งค่าเว็บไซต์** | LINE · Facebook · แผนที่ · โดเมน · Sale Page — **ไม่มี** คัดลอกลิงก์/QR |
| `link` | **ลิงก์** | `EcommerceQrHubClient` — การ์ด **ลิงก์เว็บไซต์** + **พนักงาน** |

- `?tab=staff` เดิม → map เป็น `link`
- แท็บ `link` ซ่อนปุ่มบันทึกหัวการ์ดได้ (ไม่มีฟอร์มร้าน)

## Hub ลิงก์

- ไฟล์: `EcommerceQrHubClient.tsx`
- ห่อ **`ModuleQrMonthlyGate` ครั้งเดียว**
- การ์ดคู่ → `FormModal` (เว็บไซต์ violet/`lg` · พนักงาน amber/`full` + `ModuleStaffTokenQrPanel` + `planGateAllowed`)

## ห้าม

- ใส่ลิงก์คัดลอกในแท็บตั้งค่าเว็บไซต์
- แยกแท็บพนักงาน + เกตสายรายวันซ้ำ
- เกต `ModuleQrMonthlyGate` ในแท็บ `portal`


================================================================================
### .cursor/rules/ecommerce-storefront-category-scroll.mdc
================================================================================

---
description: หน้าร้าน E-Commerce — แถบหมวดเลื่อนแนวนอน + กริด 3/8 · การ์ดสูงเท่า · รายละเอียด
globs: "**/ecommerce-store/storefront/**,**/shop/**/page.tsx,**/shop/**/layout.tsx"
alwaysApply: false
---

# หน้าลูกค้า (ร้านค้า) — หมวดเลื่อน + กริดสินค้า

ใช้กับ `/shop/[storeId]` และ `src/systems/ecommerce-store/storefront/`  
กฎเต็มโมดูล: **`ecommerce-store-module-dashboard-template.mdc`**

---

## แถบหมวดหมู่ (บังคับ)

1. **ห้าม** ให้ chip หมวด (`ทั้งหมด`, `แนะนำ`, `ขายดี`, ชื่อหมวด, `อื่นๆ`) **ขึ้นหลายบรรทัด** (`flex-wrap`) หรือย่อเป็น dropdown บนมือถือ  
2. แถบหมวด = **แถวเดียวเลื่อนแนวนอน** (`overflow-x-auto`) ใต้ช่องค้นหา  
3. ปุ่มหมวด: **`shrink-0`** · **`min-h-[40px]`** · `role="tab"` / `aria-selected` · `tablist` มี `aria-label`  
4. คอนเทนเนอร์: `flex flex-nowrap gap-2 overflow-x-auto` + ซ่อน scrollbar ตามต้องการ · `pb-1`  
5. กดหมวดแล้ว **กรองกริด** ด้านล่าง (ไม่เปลี่ยนหน้า)  
6. แถวแนะนำ/ขายดี (scroll แนวนอน) แยกจากแถบหมวด — อย่าแทนที่แถบหมวด  

อ้างอิง: `EcommerceStorefrontClient.tsx` — `CategoryChip`

---

## กริด + การ์ด (บังคับ)

| Viewport | คอลัมน์ |
|----------|---------|
| มือถือ | **3** |
| `lg+` | **8** |

- โทเค็น: `ecommerceStorePortalProductGridClass`  
- การ์ด **สูงเท่ากัน** (`h-full` · รายละเอียด `line-clamp-2` คงที่ · ราคา `mt-auto`)  
- พื้นขาว · `rounded-xl` · คลิกเปิด `EcommerceProductDetailModal` (default ขาว ไม่ glass)  
- แสดงรายละเอียดสินค้าบนการ์ดเมื่อมีค่า  

---

## ห้ามพลาด

- `flex-wrap` บนแถบหมวด  
- กริด 2/4 คอลัมน์แบบเก่า  
- การ์ดสูงไม่เท่ากันเพราะไม่มีช่องรายละเอียด  
- โมดัลดูสินค้าเป็น glass


================================================================================
### .cursor/rules/football-turf-module-dashboard-template.mdc
================================================================================

---
description: ตัวอย่างโมดูลแดชบอร์ดครบชุด (สนามฟุตบอล) — เลย์เอาต์ UX/UI สี ปุ่ม QR อัปโหลด ยืนยัน ซ่อมบั๊ก พอร์ทัลลูกค้า คู่มือ — อ้างอิงเมื่อสร้างหรือปรับโมดูลใหม่
globs:
  - "**/systems/football-turf/**"
  - "**/app/**/dashboard/football-turf/**"
  - "**/app/football-turf/**"
  - "**/app/api/football-turf/**"
  - "**/systems/**/components/*Shell*.tsx"
  - "**/lib/upload/**"
alwaysApply: false
---

# สนามฟุตบอล — ตัวอย่างโมดูลแดชบอร์ดแบบละเอียด (Golden Example)

ใช้เมื่อ **สร้างโมดูลแดชบอร์ดใหม่** หรือปรับโมดูลเดิมให้ครบมาตรฐานโปรเจกต์ — ยึดสนามฟุตบอลเป็นต้นแบบโครงสร้าง + UX/UI + อัปโหลด + QR + ปุ่ม + การซ่อม

**กฎโปรเจกต์ที่ต้องคู่ด้วย:**  
`dashboard-ux-car-wash-baseline.mdc` · `app-templates-central.mdc` · `app-templates-media.mdc` · `module-chrome-no-branding.mdc` · `dashboard-new-module-sidebar-icon.mdc` · `dashboard-page-width.mdc` · `dashboard-mobile-summary-stat-grid.mdc` · `dashboard-row-action-icon-buttons.mdc` · `shop-qr-hub-popup-pattern.mdc` · `shop-customer-qr-portal.mdc` · `module-customer-booking-website-portal.mdc` · `agent-finish-checkpoint.mdc`

**คู่ขนาน chrome:** `drink-pos-module-dashboard-template.mdc` (หัวยุบ · dock) · `dashboard-module-car-wash-barber-reference.mdc`

---

## 0) หลักคิดสั้น ๆ

1. **โครงสร้างไฟล์แยกชั้น** — shell/nav/dock ≠ เนื้อหาแดชบอร์ด ≠ service ≠ API ≠ พอร์ทัลสาธารณะ  
2. **UX มือถือ = dock ล่าง** · เดสก์ท็อป = แท็บหัว · ยุบหัวได้  
3. **ยืนยันทำลายข้อมูล = `AppNoticePopup` เท่านั้น** — ห้าม `window.confirm` / `alert`  
4. **อัปโหลดรูป = ฟังก์ชันกลาง** · ชื่อไฟล์บนดิสก์มาตรฐาน · ชื่อแสดงให้คนตั้งเอง  
5. **ห้ามซ้ำแบรนด์ / ห้ามซ้ำ `max-w-*` / `px-*`** กับ `PageContainer` — ดู §2b ขอบซ้าย–ขวา  
6. **หัวข้อการ์ดห้าม `description` ยาว** — ย้ายไปคู่มือการใช้งาน  

---

## 1) แผนที่ไฟล์ (คัดลอกโครงนี้)

| บทบาท | พาธอ้างอิงสนามฟุตบอล |
|--------|---------------------|
| Layout + guard | `src/app/(dashboard)/dashboard/football-turf/layout.tsx` → `FootballTurfShell` |
| หน้า server บาง | `.../football-turf/page.tsx` → client dashboard |
| Shell (หัวแก้ว · ยุบหัว · คู่มือ · dock) | `components/FootballTurfShell.tsx` |
| Nav keys / collapse storage | `football-turf-module-nav.tsx` |
| แท็บเมื่อหัวยุบ (เดสก์ท็อป) | `FootballTurfHeaderBarNav.tsx` · `FootballTurfHeaderExpandButton` |
| Dock มือถือ | `FootballTurfMobileBottomChrome.tsx` · `FootballTurfMobileDock.tsx` |
| เนื้อหาทุกแท็บ + ฟอร์ม | `FootballTurfDashboard.tsx` |
| Client repo (API / public / local) | `football-turf-service.ts` |
| Server helpers | `lib/api-auth.ts` · `guard.ts` · `server-repo.ts` · `persist-slip.ts` · `mappers.ts` · `types.ts` · `time-queue.ts` · `ui-tokens.ts` |
| API เจ้าของ | `GET/POST /api/football-turf/state` · `action` · `promptpay-qr` |
| API สาธารณะ | `/api/football-turf/public/state` · `action` |
| พอร์ทัลลูกค้า | `/football-turf/book/[ownerId]` · `/football-turf/check-in/[ownerId]` |
| อัปโหลดกลาง | `src/lib/upload/*` · `prepareUploadFile` / `prepareImageFileForUpload` ใน `app-templates` |

**โมดูลใหม่:** แยก **nav + shell + dock + dashboard client + service + `lib/` + API + พอร์ทัล** — อย่ายัดเมนู/เลย์เอาต์ยาวใน `page.tsx`

---

## 2) เลย์เอาต์แดชบอร์ด · ความกว้าง · เมนูหลักระบบ

| โซน | มือถือ | เดสก์ท็อป (`lg+`) |
|-----|--------|-------------------|
| เมนูโมดูล | **dock ล่าง** (`AppMobileDockUnifiedBar`) · `rounded-[2.5rem]` · safe-area · เลื่อนแนวนอนถ้าแท็บเยอะ | **แท็บแนวนอน** ในการ์ดหัว (ไม่ใช้ sidebar ซ้ายของโมดูล) |
| หัวชื่อโมดูล | การ์ดแก้ว `footballTurfGlassShellClass` | เหมือนกัน (ยุบได้) |
| เนื้อหา | `pb-24` (`footballTurfMainPaddingBottomClass`) | `lg:pb-0` |
| การ์ดสถิติสรุป | **`grid-cols-2`** เสมอ | `sm:` / `xl:` ตามจำนวน |
| ความกว้างหน้า | เต็มช่วงโมดูล | `DashboardPagesShell`: `max-w-none lg:!px-6` |

**บังคับใน `DashboardShell`:**  
- เข้าโมดูล → ย่อ sidebar หลัก (`isModuleWorkspacePath`)  
- มือถือ → **ซ่อน** `MobileBottomNav` หลัก — เหลือแค่ dock โมดูล  

**บังคับ:** ห้าม `MawellLogo` / wordmark ใน chrome โมดูล  

**เส้น accent:** หลังแถบ `h-1.5` gradient ต้องมี **`mt-5`** ก่อนไอคอน/ปุ่ม/ข้อความ  

**จุดต่อหัวยุบ:** `DashboardShell` — `showFootballTurfHeaderBar` คู่กับ drink-pos  

---

## 2b) ระยะขอบซ้าย–ขวา (บังคับบันทึกเมื่อคัดลอกโมดูล)

ขอบซ้ายขวา **ไม่ได้อยู่ชั้นเดียว** — ดูตารางเต็มใน `dashboard-page-width.mdc`

### ลำดับชั้นของสนามฟุตบอล / drink-pos

| # | ชั้น | คลาสขอบซ้าย–ขวา | ไฟล์ |
|---|------|-----------------|------|
| 1 | ห่อ `main` ใน `DashboardShell` | `px-3 sm:px-4` | ไม่ใช้ `moduleDashboardCompact` (ต่างจากบาร์เบอร์ที่ใช้ `max-md:px-2`) |
| 2 | `PageContainer` ผ่าน `DashboardPagesShell` | `size="full"` + **`max-w-none !px-3 sm:!px-4 lg:!px-6`** | `DashboardPagesShell.tsx` — เงื่อนไข `footballTurfModule \|\| drinkPosModule` |
| 3 | การ์ดหัว Shell | `px-4 py-4 sm:px-8 sm:py-6` | `FootballTurfShell.tsx` |
| 4 | เนื้อหาใต้หัว (`children`) | **ห้าม** ห่อด้วย `px-*` / `max-w-*` ซ้ำทั้งหน้า | ไหลตรงจาก PageContainer |
| 5 | การ์ดย่อยในแท็บ | padding ในการ์ดเอง (`p-4` / `px-5` ฯลฯ) | `FootballTurfDashboard.tsx` |
| 6 | พอร์ทัลสาธารณะ (นอกแดชบอร์ด) | คอลัมน์ `max-w-md` + gutter ของหน้า public | `book` / `check-in` — ไม่ใช้ PageContainer แดชบอร์ด |

### ค่าคงที่กลาง (`@/components/ui/page-container`)

| โทเค็น | ค่า | ใช้เมื่อ |
|--------|-----|---------|
| `PAGE_GUTTER_X` | `px-4 sm:px-6` | ขอบมาตรฐาน PageContainer |
| `PAGE_GUTTER_Y` | `py-6 sm:py-8` | ขอบบน–ล่างหน้า |
| `PAGE_INNER_GUTTER_X` | `px-4 sm:px-6 md:px-8` | ชั้นในภายใต้ PageContainer ให้เมนูกับเนื้อหาเส้นตรงกัน |

### เทียบโมดูลอื่น (อย่าสลับชุดโดยไม่ตั้งใจ)

| โมดูล | Shell นอก (มือถือ) | PageContainer |
|-------|-------------------|---------------|
| สนามฟุตบอล · drink-pos | `px-3 sm:px-4` | `full` + `max-w-none !px-3 sm:!px-4 lg:!px-6` |
| บาร์เบอร์ · ซักผ้า · นวด · จอด | `max-md:px-2 sm:px-4` | `max-md:!px-3 sm:!px-6` |
| ศูนย์แอดมิน | `px-3 sm:px-4` | `full` + `max-w-none !px-3 sm:!px-4 lg:!px-6` |
| หน้าบ้าน / modules / plans | ตาม Shell ปกติ | `full` + `max-w-[1680px] lg:!px-8` |

### ห้ามพลาดเรื่องขอบ

- อย่าใส่ `px-2` / `px-4` ที่หัวข้อ section จน **หัวข้อไม่เท่าขอบการ์ด**
- อย่าซ้อน `max-w-6xl mx-auto` ใน Shell โมดูล
- อย่าลด/เพิ่มแค่ชั้นเดียวแล้วลืมคู่ใน `DashboardPagesShell` + `DashboardShell`
- มือถือ: ขอบซ้ายขวาแคบลงได้ (บาร์เบอร์) แต่สนามฟุตบอลตั้งใจ **กว้างเต็ม** + `lg:!px-6`

---

## 3) ยุบ / ขยายหัวโมดูล

สถานะ: `localStorage` + `CustomEvent`  
(`FOOTBALL_TURF_HEADER_COLLAPSE_KEY` / `FOOTBALL_TURF_HEADER_COLLAPSE_EVENT` ใน `football-turf-module-nav.tsx`)

| สถานะ | มือถือ | เดสก์ท็อป |
|-------|--------|----------|
| **หัวเปิด** | การ์ดหัว · คู่มือ · ปุ่มซ่อนขวาสุด · **ไม่มีแท็บในหัว** (ใช้ dock) | การ์ดหัว + กริดแท็บ · ปุ่มซ่อนหลังคู่มือ |
| **หัวยุบ** | โทเคน + **ปุ่มขยาย** — ห้ามแท็บใน header ม่วง | `FootballTurfHeaderBarNav` · ชื่อโมดูลข้อความล้วน · ปุ่มขยายขวาสุด |

โมดูลใหม่: คัดลอก key/event **แยกต่อ slug** — อย่าให้แท็บซ้ำกับ dock บนมือถือ

---

## 4) สี · โทเค็น · ตัวอักษร · ความโค้ง

**ไฟล์โทเค็น:** `lib/ui-tokens.ts`

| โทเค็น | ใช้ทำอะไร |
|--------|-----------|
| `footballTurfGlassShellClass` | เปลือกหัวโมดูล — `rounded-[2.5rem]` · glass · `backdrop-blur-2xl` · เงานุ่ม |
| `footballTurfAccentBarClass` | แถบไล่สีหัว (`appDashboardBrandGradientBarClass`) |
| `footballTurfNavActiveClass` | แท็บ active = `appDashboardBrandGradientFillClass` + ข้อความขาว |
| `footballTurfNavIdleClass` | แท็บ idle = slate + hover ขาวโปร่ง |
| `footballTurfMainPaddingBottomClass` | `pb-24 lg:pb-0` |

**หน้าตั้งค่า:** แถวเดียว + แถบเมนูย่อย — ดู **`.cursor/rules/dashboard-module-settings-single-row-tabs.mdc`** (`footballTurfSubTabShellClass` · `settingsMenu`)

**แถบเมนูหลัก vs รอง (กรอง):** ดู **`.cursor/rules/dashboard-primary-secondary-menu-tabs.mdc`** (`footballTurfPrimaryTab*` · `footballTurfFilterChip*` · หน้าโปร/ลูกค้า)
**สีข้อความมาตรฐานโปรเจกต์**  
- หัวข้อเข้ม: `#1e1b4b` / `text-slate-900` · `font-black tracking-tight`  
- รอง: `#66638c` / `#5f5a8a` / `text-slate-500`  
- เน้นแบรนด์: `#4d47b6` · `#5b61ff` · gradient จาก `appDashboardBrandGradient*`  
- สถานะ: emerald (ว่าง/สำเร็จ) · amber (รอ) · rose (ยกเลิก/ลบ) · violet (โปร/สิทธิ์) · cyan (ลิงก์จอง)

**ลำดับความโค้ง**  
| ชั้น | คลาส |
|------|------|
| เปลือกโมดูล / การ์ดใหญ่ | `rounded-[2.5rem]` (มือถือบางจุด `rounded-2xl`) |
| การ์ดย่อย / แผง | `rounded-[2rem]` / `rounded-[1.25rem]` / `rounded-2xl` |
| ปุ่ม / input / chip | `rounded-xl` ~ `rounded-2xl` |

**พื้น:** glass `from-white/… via-violet/indigo อ่อน to-…` — อย่าพื้นทึบทั้งโมดูล  

**ไอคอน:** `stroke="currentColor"` · คู่ปุ่มมี `aria-label` · decorative = `aria-hidden`

---

## 5) การ์ดสรุป · กริด · รายการ

### สถิติมือถือ
- แถวสรุปตัวเลข: **`grid-cols-2`** ห้าม `grid-cols-1`  
- จำนวนคี่: การ์ดสุดท้าย `col-span-2 sm:col-span-1`  
- กฎเต็ม: `dashboard-mobile-summary-stat-grid.mdc`

### หัวการ์ดรายการ
- `AppDashboardSection` + `AppSectionHeader` — **ห้าม** ส่ง `description` อธิบายฟีเจอร์  
- มือถือ: หัวข้อซ้าย · ปุ่มขวา (`flex-row` + `actionWrapClassName="shrink-0 self-start…"`)  
- เพิ่ม / กรอง / รีเฟรช: ไอคอนบนมือถือ · ข้อความบน `sm+` — ดูกฎ `dashboard-mobile-*`

### แถวรายการ + แก้ไข/ลบ
- ปุ่ม **ไอคอนล้วน** · `min-h/w-[40px]` · `aria-label` + `title`  
- ใช้ `assetRowEditIconButtonClass` / `assetRowRemoveIconButtonClass` (+ `IconRowEdit` / `IconRowRemove`)  
- กลุ่มปุ่ม `gap-2` · ลบผ่าน `notice.confirm`  

---

## 6) ปุ่ม — แบบที่ต้องทำตาม

| ชนิด | รูปแบบ |
|------|--------|
| Primary ในโมดูล | gradient แบรนด์ / `app-btn-primary` · `min-h-[40px]`–`52px` · `rounded-xl`/`2xl` · `font-black` |
| Soft / secondary | `app-btn-soft` · ขอบขาวโปร่ง · ข้อความ `#5b61ff` / `#4d47b6` |
| แถบในโมดัลแนวคาร์แคร์ | `cw-btn` + `cw-btn-icon` + `cw-btn-label` — มือถือซ่อนป้าย |
| แก้/ลบในแถว | ไอคอนอย่างเดียว (ข้อ 5) |
| ยืนยัน/ยกเลิกโมดัล | `FormModalFooterActions` |
| คู่มือในหัว | ปุ่มวงกลม/แคบมือถือ · ข้อความ `hidden sm:inline` |
| พอร์ทัลลูกค้า CTA | ปุ่มใหญ่ `min-h-[52px]` · บางจุดไอคอนอย่างเดียว + `aria-label` |

**ห้าม:** ปุ่มข้อความยาวบนมือถือในแถวแคบ · ปุ่มไม่มี `aria-label` เมื่อไม่มีข้อความ visible  

---

## 7) โมดัล · ฟอร์ม · ตัวกรอง

- ใช้ **`FormModal`** — `size` ตามงาน · `appearance="glass"` / `glassTint` เมื่อเป็น hub QR  
- มือถือแนะนำ **`mobileCentered`** (แผงกลางจอ ไม่ชิดล่าง)  
- ฟิลด์: `rounded-2xl` · `border-white/70` · `bg-white/85` · ข้อความ `font-bold`  
- ตัวกรอง: แถบไล่สี + **`mt-5`** + ไอคอนกรอง · มือถือยุบ/ขยายได้  
- หลังบันทึกฟอร์มปกติ: ปิดโมดัล + `refresh()` — **ไม่** เด้ง toast สำเร็จซ้ำถ้ามีป๊อปอัปยืนยันแล้ว  

---

## 8) แจ้งเตือน / ยืนยัน (ซ่อมบั๊กที่พบบ่อย)

ใช้ **`useAppNoticePopup()` + `AppNoticePopup`** จาก `@/components/app-templates` เท่านั้น

| กรณี | ทำอย่างไร |
|------|-----------|
| ลบจอง / ลบลูกค้า / ลบโปร / ลบรายจ่าย / ยกเลิกจอง | `await notice.confirm("…?", { … })` |
| บันทึกตั้งค่าสนาม | `confirm` ก่อนบันทึก |
| บันทึกฟอร์มทั่วไป | ไม่ต้อง confirm — ปิดโมดัล + refresh |
| error ในฟอร์ม | ข้อความใน UI / `console.error` — ไม่ใช้ `alert` |

**ห้าม:** `window.confirm` · `window.alert` · toast สำเร็จหลัง confirm ที่ผู้ใช้กดไปแล้ว  

---

## 9) อัปโหลดรูป / สลิป / เอกสาร (มาตรฐานกลาง)

### Client
| ฟังก์ชัน | เมื่อใช้ |
|----------|---------|
| `prepareImageFileForUpload` | ย่อรูป → JPEG · ขอบยาวสูงสุด 1600 · ~1.85MB |
| `prepareImageFileAsDataUrl` | โมดูลเก็บสลิปเป็น data URL ชั่วคราว (เช่นจอง/ขายโปรฟุตบอล) ก่อน persist |
| `prepareUploadFile` | รูป+PDF: รูปย่อ · PDF ส่งตรง (ตรวจขนาด) |
| `normalizeUploadDisplayName` | ทำความสะอาดชื่อที่แสดง |

ไฟล์: `src/components/app-templates/prepareImageFileForUpload.ts` · `prepareUploadFile.ts`

### Server
| ฟังก์ชัน | เมื่อใช้ |
|----------|---------|
| `saveModuleUpload` | บันทึกไฟล์มาตรฐานทุกโมดูล |
| `buildStoredUploadFileName` | ชื่อบนดิสก์ |
| `saveOwnerModuleUploadImage` | โลโก้/รูปโมดูล (ห่อ `saveModuleUpload`) |

ไฟล์: `src/lib/upload/save-module-upload.ts` · `stored-filename.ts` · `upload-segments.ts` · `display-name.ts`

### รูปแบบชื่อไฟล์บนดิสก์ (บังคับ)
```
/uploads/{module}/{user}/{module}-{user}-[{kind}-]{timestamp}-{rand}.{ext}
```
ตัวอย่าง: `/uploads/football-turf/cmn1…/football-turf-cmn1…-slip-1722…-a1b2c3.jpg`

- **ชื่อที่แสดง** (UI/DB เช่น `attachmentName` / `title`) = **ให้ผู้ใช้ตั้งเอง** — ห้ามบังคับใช้ชื่อไฟล์จากเครื่องลูกค้า  
- สนามฟุตบอล: `persistFootballTurfSlipUrl` แปลง data URL → ไฟล์ใต้ `public/uploads/football-turf/{user}/…` — **ห้าม** เก็บ data URL ยาวในคอลัมน์ `VarChar` สั้น  

### แสดงรูป
- ย่อ: **`AppImageThumb`** · เต็มจอ: **`AppImageLightbox` + `useAppImageLightbox`**  
- ห้ามคัดลอก lightbox เอง  

---

## 10) QR · ลิงก์ · พอร์ทัลสาธารณะ

### ในแดชบอร์ด (แท็บ QR / ลิงก์)
- กรองมุมมอง: ทั้งหมด · เฉพาะลูกค้า · เฉพาะพนักงาน  
- การ์ดลิงก์จอง / เช็กอิน: คัดลอกลิงก์ · เปิดหน้า · (ถ้ามี) โปสเตอร์/QR  
- Hub แบบการ์ดคู่ + `FormModal`: ตาม `shop-qr-hub-popup-pattern.mdc` · พนักงานใช้ `ShopStaffQrPanel` เมื่อเป็นแพทเทิร์นนั้น  
- Trial: ลิงก์สาธารณะใส่ query `t=` เมื่อ sandbox  

### พอร์ทัลลูกค้า — จอง (`/football-turf/book/[ownerId]`)
- เปลือก: `AppPublicCheckInGlassPage` + `appPublicCheckInGlassCardClass` · กว้าง `max-w-6xl` (โฟลว์สนาม × วัน × สล็อต — ไม่ต้องเป็นเว็บไซต์ marketing แบบโรงแรมเต็มชุด)
- เลือกวัน · สนาม · สล็อตว่างที่ **ยังไม่ผ่านเวลา**
- ฟอร์ม: ชื่อ · เบอร์ · ทีม · **จำนวนผู้เล่นว่างให้กรอกเอง** (ห้าม default เช่น 10)
- ชำระ: `TRANSFER` | `ONSITE`
  - **โอน:** แสดง **QR พร้อมเพย์** จาก `POST /api/football-turf/public/promptpay-qr` + บัญชีธนาคาร · แนบสลิปด้วย `useAppCameraCapture` + `AppGalleryCameraFileInputs` / `AppImagePickCameraButtons` · ย่อด้วย `prepareImageFileAsDataUrl` · ข้อความบังคับ: `กรุณาอัปโหลดสลิป เพื่อเป็นหลักฐานการชำระเงินจอง` · รูปย่อ `AppImageThumb` + lightbox
  - **หน้าสนาม:** ไม่บังคับสลิป
- หลังจองสำเร็จ: `router.push` → `/football-turf/book/[ownerId]/booking/[bookingId]?phone=&t=` (`footballTurfPublicBookingUrl`)
- URL helpers: `src/lib/football-turf/public-url.ts` · gate: `isFootballTurfPortalOpenForOwner`
- กฎ UX พอร์ทัล QR กะทัดรัด: `shop-customer-qr-portal.mdc` · แพทเทิร์นชำระ/สลิป/หน้ารายละเอียดเทียบโรงแรม: `module-customer-booking-website-portal.mdc` §สื่อ/สลิป + §หน้ารายละเอียดหลังจอง

### พอร์ทัลลูกค้า — รายละเอียดหลังจอง (`/football-turf/book/.../booking/[bookingId]`)
- `FootballTurfPortalBookingClient` + `GET /api/football-turf/public/booking`
- แสดง **ยอดจอง** · **ชำระแล้ว** (+ สถานะ) · **คงเหลือ** · วิธีชำระ
- มีสลิป → `AppImageThumb` กดดู lightbox

### พอร์ทัลลูกค้า — เช็กอิน (`/football-turf/check-in/[ownerId]`)
- ค้นหาด้วยเบอร์โทรตัวเลขล้วน  
- การ์ดสรุป: คิวที่ใช้ได้ · **สิทธิ์ที่ใช้ได้ = รวม `remainingUses`** (ไม่ใช่นับจำนวนแพ็กโปร) · เบอร์ที่ค้นหา  
- รายการโปร: แสดง `เหลือ X/Y สิทธิ์`  
- ใช้สิทธิ์กับคิวที่ยังไม่หมดเวลาและยังไม่ผูกโปร — ตัด 1 ต่อ 1 คิว  
- คิวหมดเวลา / ผูกโปรแล้ว → ปิดปุ่มใช้สิทธิ์  

---

## 11) แท็บเนื้อหา (โดเมนสนาม — แพทเทิร์นที่โมดูลอื่นเทียบได้)

| แท็บ | สิ่งที่ต้องมี / เทียบ |
|------|----------------------|
| ภาพรวม | สถิติ · สนามตามเวลาปัจจุบัน · นอกชั่วโมง → สนามปิด · คิวถัดไป · ว่างมี **จอง + เช็กอิน** (ไม่มีปุ่มบนหัว) · ตารางว่างมีปุ่มจอง |
| จอง | รายการแบบโรงแรม · กรองชิปวัน/ต้องปิดงาน · สถานะ จอง/เช็กอิน/เช็กเอาท์ · + เพิ่มการจอง |
| จัดการสนาม | เพิ่ม · แก้ไข · ลบ · รูปปก · เวลา · รอบ · ราคา |
| การเงิน | สรุปรายรับ/จ่าย · กรองช่วง · **ดูกราฟ** · ประวัติรายรับ (จอง/โปร) **แก้ไข+ลบ** · รายจ่ายลบด้วย `useAppNoticePopup` · ขายโปร+สลิป |
| โปรโมชั่น | CRUD แพ็ก · จำนวนสิทธิ์ · ขาย/ตัดใช้ |
| ลูกค้า | เบอร์+ชื่อ · ค้นหาเชื่อมจอง/โปร |
| QR / ลิงก์ | ลิงก์จอง · เช็กอิน · คู่มือพนักงาน |
| ตั้งค่า | ชื่อสนาม · พร้อมเพย์/บัญชี · **ชำระลิงก์ลูกค้า NONE/มัดจำ/เต็ม** · ติดต่อ — ยืนยันก่อนบันทึก |

**กราฟ:** ห้ามเขียนแท่งใหม่ — ใช้ `AppRevenueCostColumnChart` / `AppSparkChartPanel` ตาม `app-templates-spark-charts.mdc`

---

## 12) API · ข้อมูล · Prisma

1. เจ้าของ: `GET state` รวมข้อมูลหน้า · `POST action` แยกชนิดงาน  
2. สาธารณะ: `public/state` + `public/action` — scope ตาม `ownerId` (+ trial) · gate `portal-access`  
3. PromptPay เจ้าของ: `/api/football-turf/promptpay-qr` · **ลูกค้า:** `/api/football-turf/public/promptpay-qr`  
4. รายละเอียดจองสาธารณะ: `GET /api/football-turf/public/booking?ownerId&bookingId&phone&t=`  
5. แตะ schema → **`npx prisma migrate deploy` (ถ้ามี) → `npx prisma generate`** ทุกครั้ง (`agent-finish-checkpoint.mdc`)  
6. สลิป: persist เป็น path ใต้ `/uploads/…` ก่อนใส่ DB  

---

## 13) คู่มือการใช้งานในโมดูล

- ปุ่มในหัว shell → **`AppUsageGuideModal`**  
- เนื้อหาต้อง **ละเอียดรายแท็บ** + ลำดับเริ่มต้น + ลิงก์ลูกค้า + ความหมายตัวเลขสิทธิ์ + สลิป + เคล็ดลับหน้างาน  
- อ้างอิงตัวอย่างยาว: `FootballTurfShell.tsx` sections ของคู่มือ  
- **ห้าม** ใส่คำอธิบายฟีเจอร์ยาวใน `AppSectionHeader.description` — ย้ายมาที่คู่มือ  

---

## 14) การซ่อม / บั๊กที่เคยเจอ (checklist ซ่อม)

| อาการ | สาเหตุที่พบบ่อย | แก้แบบมาตรฐาน |
|--------|----------------|----------------|
| สิทธิ์สรุปเป็น 1 แต่การ์ดโปรเหลือ 10 | นับจำนวนแพ็ก ไม่ใช่รวม `remainingUses` | `reduce` รวม `remainingUses` ของโปร ACTIVE |
| จำนวนผู้เล่นเต็ม 10 ตลอด | state เริ่มต้น `"10"` | เริ่ม `""` · validate ก่อน submit |
| สลิปใหญ่ / DB พัง / คอลัมน์สั้น | เก็บ data URL ดิบ | `prepare*` + `persist*` เป็นไฟล์ path |
| ล้อเลื่อนหน้าไม่ได้ตรงกลาง | `overflow-y-auto` บน main โดยไม่มีความสูงจริง | อย่าดัก scroll ที่ main โดยไม่จำเป็น — ดู `appModuleShellMainScrollClass` |
| เมนูหลักแดชบอร์ดทับ dock โมดูล | ไม่ซ่อน `MobileBottomNav` | `hideMainMobileBottomNav` เมื่อ `isModuleWorkspacePath` |
| หัวโมดูลชิดแถบสี | ลืม `mt-5` หลัง accent bar | ใส่ `mt-5` เสมอ |
| ยืนยันลบแล้วเด้งแปลก | ใช้ `window.confirm` / toast ซ้อน | `useAppNoticePopup` อย่างเดียว |
| Prisma `undefined.findMany` | ไม่ `generate` หลัง schema | รัน `prisma generate` (+ ลบ `.next` ถ้าค้าง) |
| ไอคอน sidebar เป็นกริดเปล่า | ไม่เพิ่มใน `dashboard-nav-icons.tsx` | เพิ่มเงื่อนไขก่อน fallback modules |
| รูปสลิปคนละขนาดใน UI | ไม่ใช้ `AppImageThumb` | ใช้ template กลาง |

---

## 15) เช็กลิสต์โมดูลใหม่ (คัดลอกจากสนามฟุตบอล)

- [ ] เลือกชุด gutter ซ้าย–ขวาใน `DashboardPagesShell` + ไม่ซ้ำ `px` ใน Shell (ดู §2b)
- [ ] `layout` → Shell · guard/trial  
- [ ] Shell: หัวแก้ว · accent+`mt-5` · คู่มือละเอียด · ยุบหัว · dock มือถือ  
- [ ] Nav keys + localStorage collapse แยก slug  
- [ ] ต่อ `DashboardShell` / `DashboardPagesShell` (ความกว้าง · ซ่อนเมนูหลักมือถือ · header bar เมื่อยุบ)  
- [ ] ไอคอน sidebar + รูปปก landing ถ้าอยู่ในแคตตาล็อก  
- [ ] สถิติมือถือ `grid-cols-2` · ปุ่มแถวเป็นไอคอน · ไม่มี `description` บนหัวข้อ  
- [ ] `useAppNoticePopup` สำหรับลบ/ตั้งค่าสำคัญ  
- [ ] อัปโหลดผ่าน `prepare*` / `saveModuleUpload` · ชื่อไฟล์ module-user · ชื่อแสดงให้คนตั้ง  
- [ ] พอร์ทัลสาธารณะใช้ `AppPublicCheckInGlassPage` (+ trial `t=`)  
- [ ] กราฟจาก app-templates เท่านั้น  
- [ ] `tsc` ผ่าน · schema แล้ว `prisma generate` · commit ตาม checkpoint เมื่องานจบ  

---

## 16) ไฟล์อ่านก่อนลงมือโมดูลใหม่

1. `FootballTurfShell.tsx` — chrome + คู่มือ  
2. `football-turf-module-nav.tsx` — แท็บ + collapse  
3. `FootballTurfDashboard.tsx` — แท็บเนื้อหา · ฟิลเตอร์ · โมดัล · QR · ยืนยัน  
4. `FootballTurfBookingPortalClient.tsx` · `FootballTurfCheckInClient.tsx` — พอร์ทัล  
5. `lib/ui-tokens.ts` · `lib/persist-slip.ts`  
6. `src/lib/upload/save-module-upload.ts` · `prepareUploadFile.ts`


================================================================================
### .cursor/rules/football-turf-overview-mobile-dropdown.mdc
================================================================================

---
description: หน้าภาพรวมสนามฟุตบอลมือถือ — เลือกสนาม/กรองสถานะเป็น dropdown เต็มความกว้างอย่างเดียว (ห้ามโชว์ pill คู่กัน)
globs:
  - "**/systems/football-turf/**"
  - "**/dashboard/football-turf/**"
alwaysApply: false
---

# ภาพรวม (มือถือ) — dropdown อย่างเดียว · เต็มขอบ

ใช้กับ **หน้าภาพรวม** · **ตารางเวลาจองรายสนาม** ก่อน breakpoint `sm` เท่านั้น

## บังคับ

### 1) เลือกสนาม

- มือถือ: **มีแค่** `<select>` เลือกสนาม (`footballTurfMobileSelectClass`)  
  - **เต็มความกว้าง** ของการ์ด (`w-full` · วางใต้หัวข้อ ไม่ยัดในมุมขวากับวัน/ปุ่ม)  
  - **ห้าม** โชว์ป้ายวันที่ + แถบ pill สนาม A/B/C คู่กับ dropdown  
- `sm+`: ป้ายวันที่ + แถบ pill ตามเดิม (ซ่อน dropdown)

### 2) กรองสถานะช่วงเวลา

- มือถือ: **มีแค่** `<select>` เต็มความกว้าง (รวมตัวเลือกทั้งหมด + `NEEDS_CLOSE`)  
- `sm+`: ชิปปุ่มตามเดิม (ซ่อน dropdown ด้วย `sm:hidden`)

### 3) การซ่อน/แสดง

- อย่าพึ่ง `cn(shellClassHavingInlineFlex, "hidden sm:…")` อย่างเดียวถ้า conflict แล้ว pill โผล่บนมือถือ  
- มือถือ: wrapper `sm:hidden` รอบ select · เดสก์ท็อป: `actionWrapClassName="hidden … sm:block"` รอบวัน+pill

## ห้าม

- มือถือโชว์ dropdown กับ pill พร้อมกัน  
- จำกัด `max-w-[…]` จน dropdown แคบไม่เต็มขอบการ์ด  
- เปลี่ยนเดสก์ท็อปเป็น dropdown โดยไม่จำเป็น  

## อ้างอิง

- `FootballTurfDashboard.tsx` — `ft-overview-schedule-court` · `ft-overview-schedule-status`  
- `footballTurfMobileSelectClass` ใน `lib/ui-tokens.ts`


================================================================================
### .cursor/rules/general-store-pos-dashboard.mdc
================================================================================

---
description: POS ร้านทั่วไป — shell เมนู คำอธิบาย คู่มือ แนะภาพสินค้า
globs: src/systems/general-store-pos/**/*
alwaysApply: false
---

# POS ร้านทั่วไป (`general-store-pos`)

## Shell / เมนูเดสก์ท็อป (`GeneralStorePosShell.tsx`)

- **หัวการ์ด:** แสดงเฉพาะหัวข้อ **POS ร้านทั่วไป** — **ห้าม** ใส่ย่อหน้าโปรโมท/คำอธิบายยาวใต้หัวข้อ (ใช้ **คู่มือการใช้งาน** แทน)
- **เมนูหลัก (md+):** แบบคาร์แคร์ — `<nav>` + `<ul className="flex gap-1">` + แต่ละ `<li className="min-w-0 flex-1">` + ลิงก์ **`w-full`** จัดกึ่งกลาง มีไอคอนคู่ข้อความ
- **ปุ่มคู่มือ:** มุมขวาของแถวหัว (เดียวกับ Building POS) — `AppUsageGuideModal` + สถานะ `usageGuideOpen` ใน shell

## คำอธิบายในโมดูล

- **ห้าม** ใส่ `description` ยาวใน `AppSectionHeader` / `FormModal` เพื่ออธิบายฟีเจอร์ — ย้ายไปคู่มือหรือใช้ `aria-label` / placeholder สั้น ๆ
- ข้อความบนการ์ดสินค้า: **ห้าม** ใส่คำแนะนำการแตะแบบยาว (เช่น +1/+2) ใน UI — เก็บในโมดัลคู่มือได้

## แนะภาพตัวอย่าง (`lib/suggest-stock-image.ts`)

- ปุ่มในโมดัล: สินค้าใช้ข้อความ **แนะภาพตามสินค้า** (อิง `name` + `categoryName`); หมวดใช้ **แนะภาพตามหมวด**
- ลำดับการจับคู่: **จับจากชื่อสินค้าและหมวดรวมกัน** — กฎเฉพาะ (กาแฟ ขนมปัง อิเล็กทรอนิกส์ ฯลฯ) มาก่อน กฎกว้าง (อาหาร เครื่องดื่ม) ทีหลัง สุดท้ายคือ default ร้านค้า
- URL เป็น Unsplash ตัวอย่างเท่านั้น — ไม่บันทึกอัตโนมัติลงเซิร์ฟเวอร์

## เลย์เอาต์ / scroll

- เนื้อหาใต้ header ใช้ **`min-h-0 flex-1 overflow-y-auto`** ใน shell (คู่กับ layout `flex min-h-0 flex-1 flex-col`)

## อ้างอิง

- คู่มือ: `AppUsageGuideModal` จาก `@/components/app-templates`
- แม่แบบปุ่มคู่มือ: `src/systems/building-pos/components/BuildingPosShell.tsx`


================================================================================
### .cursor/rules/hotel-resort-booking-filters.mdc
================================================================================

---
description: โรงแรมรีสอร์ท — ตัวกรองรายการจอง (วันนี้/เดือน/ปี/ช่วง) ซ่อนกรอง และเตือนเลยเวลาปิดงาน
globs:
  - "**/systems/hotel-resort/**Bookings*"
  - "**/systems/hotel-resort/lib/booking-filters*"
  - "**/app/**/dashboard/hotel-resort/bookings/**"
alwaysApply: false
---

# โรงแรม / รีสอร์ท — ตัวกรองการจอง + เตือนเลยเวลา

ใช้เมื่อทำหรือแก้ **หน้ารายการจอง** (`HotelResortBookingsClient`)

คู่กับ: `dashboard-finance-filter-charts-toggle.mdc` (แนวซ่อน/แสดงกรอง) · `dashboard-mobile-filter-icon.mdc` · `hotel-resort-module-dashboard-template.mdc`

---

## 1) ตัวกรองช่วงเวลา (บังคับ)

1. ชิปด่วน: **วันนี้ · เดือนนี้ · ปีนี้ · ช่วงเวลา · ทั้งหมด**
2. **ช่วงเวลา (CUSTOM):** ช่อง `จากวันที่` + `ถึงวันที่` (`type="date"`)
3. กรองโดย **ช่วงพักซ้อนกับตัวกรอง** (`checkInAt`–`checkOutAt` overlapping) — logic ที่ `lib/booking-filters.ts`
4. ค่าเริ่มต้นแนะนำ: **เดือนนี้**
5. รวมตัวกรองอื่นในแผงเดียวกัน: สถานะ · คำค้น · ชิป **ต้องปิดงาน** (รายการเลยเวลา)

## 2) แสดง / ซ่อนกรอง (บังคับ)

1. ปุ่มหัวการ์ด **แสดงกรอง / ซ่อนกรอง** ทำงานทุก breakpoint (`aria-expanded` · `aria-controls`)
2. ค่าเริ่มต้น: **กรองเปิด**
3. ขณะซ่อน: ข้อความสั้นว่าตัวกรองถูกซ่อน
4. ถ้ายังมีเงื่อนไขกรอง (ไม่ใช่ค่าเริ่มเดือนนี้+ว่างสถานะ+ว่างคำค้น) — **badge/จุด** บนปุ่มกรอง
5. มือถือ: ยังใช้ไอคอนกรองในกลุ่ม action ได้ แต่ต้องสอดคล้องกับสถานะ `filterOpen` เดียวกัน

## 3) เตือนเลยเวลา / ปิดงาน (บังคับ)

1. **จองแล้ว (`RESERVED`)** และถึง/เลย **เวลาเช็คอินจากตั้งค่าที่พัก** (หรือเลยวันเช็คอิน) → ต้องปิดงาน (ไม่มา / ยกเลิก)
2. **เข้าพัก (`CHECKED_IN`)** และถึง/เลย **เวลาเช็คเอาต์จากตั้งค่าที่พัก** ในวันเช็คเอาต์ → ต้องปิดงาน (เช็คเอาต์)
3. แสดง **เครื่องหมายเตือน** บนการ์ด (ไอคอน + ข้อความสั้น) — สีเตือน `amber`/`rose`
4. เปิดจัดการแล้วเลือกสถานะปิดงานได้ตาม `HOTEL_BOOKING_ALLOWED` (เช่น ไม่มา · ยกเลิก · เช็คเอาต์)
5. Logic: `hotelResortBookingNeedsClose` ใน `lib/booking-filters.ts` (อิง `hotelResortBookingOverdueBlocking` / เวลาจากโปรไฟล์)

## 3.1) ชำระบางส่วน + สลิปมัดจำ (บังคับ)

เมื่อการจองมี `amountPaidBaht > 0` และ/หรือ `paymentSlipUrl` (เช่น จองจากลิงก์ลูกค้าโหมดมัดจำ):

1. การ์ดรายการ: แสดง **ชำระแล้ว / ค้าง** + `AppImageThumb` ของสลิป **กดดู lightbox**
2. โมดัลจัดการ: แสดงยอดชำระแล้ว · คงเหลือ · สลิปมัดจำ/ชำระกดดูได้
3. ใช้ template กลางเท่านั้น — `AppImageThumb` · `AppImageLightbox` · `useAppImageLightbox`
4. คู่กับ `hotel-resort-payment-methods.mdc` · ลิงก์ลูกค้า: `module-customer-booking-website-portal.mdc`

## 4) ห้าม

- ซ่อนกรองได้เฉพาะมือถือแต่เดสก์ท็อปโชว์ถาวรโดยไม่มีปุ่มซ่อน
- ใช้ช่วงกรองแบบตัดเฉพาะวันเช็คอินโดยไม่ document — ถ้าเปลี่ยนเกณฑ์ให้แก้ที่ `booking-filters.ts` + อัปเดตกฎนี้
- ซ่อนสลิปเมื่อลูกค้าชำระบางส่วนแล้วอัปโหลดแล้ว

## เช็กลิสต์

- [ ] ชิปวันนี้ · เดือนนี้ · ปีนี้ · ช่วงเวลา · ทั้งหมด
- [ ] ปุ่มแสดง/ซ่อนกรอง + badge เมื่อกรองค้าง
- [ ] เตือนเลยเวลาบนการ์ดจอง
- [ ] ปิดงานผ่านสถานะ NO_SHOW / CANCELLED / CHECKED_OUT ตามอนุญาต
- [ ] ชำระบางส่วน: ยอดชำระ/ค้าง + สลิปกดดูได้ (รายการ + โมดัล)


================================================================================
### .cursor/rules/hotel-resort-finance.mdc
================================================================================

---
description: โรงแรมรีสอร์ท — หน้าการเงิน (โดเมนเฉพาะ · ยึดแม่แบบกลางการเงินครบชุด)
globs:
  - "**/systems/hotel-resort/**Finance*"
  - "**/app/**/dashboard/hotel-resort/finance/**"
  - "**/app/api/hotel-resort/finance-summary/**"
  - "**/app/api/hotel-resort/costs/**"
  - "**/app/api/hotel-resort/cost-categories/**"
alwaysApply: false
---

# โรงแรมรีสอร์ท — หน้าการเงิน

**กฎกลาง (บังคับ · อ่านแม่แบบครบชุดก่อน):**

- แม่แบบครบ → **`dashboard-finance-module-template.mdc`**
- โครงหน้า → **`dashboard-finance-page-layout.mdc`**
- กรอง/กราฟ → **`dashboard-finance-filter-charts-toggle.mdc`**
- แถบรายละเอียด → **`dashboard-finance-detail-tabs.mdc`**
- หมวดรายจ่าย → **`dashboard-expense-cost-categories.mdc`**

คู่กับ: `hotel-resort-module-dashboard-template.mdc`

---

## โดเมนเฉพาะ

| ชั้น | โรงแรม |
|------|--------|
| สรุปบนสุด | รายได้ (emerald) · ต้นทุน (rose) · กำไรโดยประมาณ |
| แท็บ | ประวัติ / รายรับ · รายจ่าย — สลิปเฉพาะเมื่อมี + lightbox · ราคาขวาสุด · **ทุกแถวประวัติ/รายรับมีแก้ไข+ลบ** · ลบยืนยันด้วย `useAppNoticePopup` |
| API | `GET /api/hotel-resort/finance-summary?range=&from=&to=` (รวม `paymentSlipUrl` ใน stays/costs) |
| กรอง | ชิป pill วันนี้·เดือนนี้·ปีนี้·กำหนดเอง (ไม่เต็มจอ) + ค้นหาแขก/ห้อง + รีเซ็ตเมื่อกรองค้าง |
| รายจ่าย | ฟอร์มต้นแบบร้านอาหาร (หมวด·รายละเอียด·ยอด·หมายเหตุ·สลิป) · หมวด CRUD · PATCH/DELETE `/api/hotel-resort/costs/[id]` · ลบผ่าน `notice.confirm` |

โค้ด: `HotelResortFinanceClient.tsx`

## เช็กลิสต์

- [ ] ตาม `dashboard-finance-module-template.mdc`
- [ ] ชิปช่วงเวลาเป็นปุ่มเล็ก · รีเซ็ตเฉพาะเมื่อกรองค้าง
- [ ] **ประวัติ / รายรับ:** ทุกแถวแก้ไข + ลบได้
- [ ] แถว: ราคาขวา emerald/rose · สลิปเฉพาะเมื่อมี
- [ ] ลบใช้ `useAppNoticePopup().confirm` — ห้าม `window.confirm`
- [ ] ฟอร์มรายจ่ายครบตามต้นแบบร้านอาหาร
- [ ] API/ค้นหาแขกตามโดเมนโรงแรม


================================================================================
### .cursor/rules/hotel-resort-module-dashboard-template.mdc
================================================================================

---
description: แพทเทิร์น UI/UX โรงแรมรีสอร์ท — ระยะขอบ ซ่อนหัว ความโค้งมน dock แท็บ (อ้างอิงเมื่อปรับหรือคัดลอกโมดูล)
globs:
  - "**/systems/hotel-resort/**"
  - "**/app/**/dashboard/hotel-resort/**"
  - "**/app/hotel-resort/**"
  - "**/app/api/hotel-resort/**"
alwaysApply: false
---

# โรงแรม / รีสอร์ท (hotel-resort) — เทมเพลตโมดูลแดชบอร์ด

ใช้เมื่อ **ปรับหรือคัดลอก** โมดูลโรงแรมรีสอร์ท หรือโมดูลที่ต้องการโครงเดียวกับชุดล่าสุดนี้ (ระยะขอบ · ซ่อนส่วนหัว · มุมมน · dock)

**หลักการโปรเจกต์:** `dashboard-ux-car-wash-baseline.mdc` · `app-templates-central.mdc` · `module-chrome-no-branding.mdc` · `dashboard-page-width.mdc` · `dashboard-mobile-summary-stat-grid.mdc`

**คู่ขนาน:** drink-pos `drink-pos-module-dashboard-template.mdc` · สนามฟุตบอล `football-turf-module-dashboard-template.mdc`

---

## 1) โครงไฟล์มาตรฐาน

| บทบาท | ไฟล์ |
|--------|------|
| Layout + guard | `src/app/(dashboard)/dashboard/hotel-resort/layout.tsx` → `HotelResortShell` |
| Shell (หัว + ยุบหัว + คู่มือ + provider เมนูล่าง) | `components/HotelResortShell.tsx` |
| เมนู / collapse state | `hotel-resort-module-nav.ts` |
| แท็บใน header ม่วงเมื่อยุบหัว (เดสก์ท็อป) | `HotelResortHeaderBarNav.tsx` · `HotelResortHeaderExpandButton` |
| Dock มือถือ | `HotelResortMobileBottomChrome.tsx` · `HotelResortMobileDock.tsx` |
| หน้าหลัก / จอง / เช็คอิน / ห้องพัก / การเงิน / ลูกค้า / ตั้งค่า | `HotelResort*Client.tsx` + หน้าใต้ `dashboard/hotel-resort/` |
| พอร์ทัลลูกค้า + **QR พนักงาน** | `HotelResortGuestPortalHubClient` · `ModuleStaffTokenQrPanel` · ปลายทาง `/hotel-resort/staff/{ownerId}?t=&k=` (`HotelResortStaffClient`) |
| แท็บแรก | **แดชบอร์ด** (`HOTEL_RESORT_BASE`) — สถิติ + ผังห้อง · ปุ่ม **เช็คอิน** บนการ์ดห้องว่าง/จอง |
| แท็บห้องพัก | จัดการ **อาคาร/ตึก** (หลายอาคาร) · ประเภทห้อง · CRUD ห้อง — `/dashboard/hotel-resort/rooms` |
| โทเค็น UI (มุมมน · glass · gutter ล่าง) | `lib/ui-tokens.ts` |
| พอร์ทัลสาธารณะ | `HotelResortPortalClient.tsx` · `/hotel-resort/[ownerId]` |

โมดูลใหม่: แยก **nav + shell + dock + client + api** — อย่าผูกเมนูยาวใน `page.tsx`

---

## 2) ระยะขอบซ้าย–ขวา (บังคับ)

ชุดเดียวกับ drink-pos / สนามฟุตบอล:

| # | ชั้น | คลาส | ไฟล์ |
|---|------|------|------|
| 1 | ห่อ `main` ใน `DashboardShell` | `px-3 sm:px-4` | ไม่ใช้ `moduleDashboardCompact` |
| 2 | `PageContainer` ผ่าน `DashboardPagesShell` | `size="full"` + **`max-w-none !px-3 sm:!px-4 lg:!px-6`** | เงื่อนไข `hotelResortModule` |
| 3 | การ์ดหัว Shell | `px-4 py-4 sm:px-8 sm:py-6` | `HotelResortShell.tsx` |
| 4 | เนื้อหาใต้หัว (`children`) | **ห้าม** ห่อด้วย `px-*` / `max-w-*` ซ้ำทั้งหน้า | ไหลตรงจาก PageContainer |
| 5 | การ์ดย่อย | padding ในการ์ดเอง | client แต่ละหน้า |

**ห้าม** ซ้อน `max-w-6xl mx-auto` ใน Shell · **ห้าม** `MawellLogo` ใน chrome โมดูล

---

## 3) ยุบ / ขยายหัวโมดูล

สถานะ: `localStorage` + `CustomEvent`  
(`HOTEL_RESORT_HEADER_COLLAPSE_KEY` / `HOTEL_RESORT_HEADER_COLLAPSE_EVENT` ใน `hotel-resort-module-nav.ts`)

| สถานะ | มือถือ | เดสก์ท็อป (`lg+`) |
|-------|--------|-------------------|
| **หัวเปิด** | การ์ดหัว · คู่มือ · **ปุ่มซ่อนขวาสุด** · **ไม่มีแท็บในหัว** (ใช้ dock) | การ์ดหัว + กริดแท็บ · ปุ่มซ่อนหลังคู่มือ |
| **หัวยุบ** | โทเคน + **ปุ่มขยาย** — **ห้าม** แท็บใน header ม่วง | `HotelResortHeaderBarNav` · ชื่อโมดูลข้อความล้วน · ปุ่มขยายขวาสุด |

จุดต่อ `DashboardShell.tsx`:

- `showHotelResortHeaderBar = onHotelResortModule && hotelResortHeaderCollapsed`
- มือถือ: เฉพาะ `HotelResortHeaderExpandButton` + บรรทัดโทเคน
- `lg+`: `HotelResortHeaderBarNav` เต็ม

**เส้น accent:** หลังแถบ `h-1.5` gradient ต้องมี **`mt-5`** ก่อนไอคอน/ปุ่ม/ข้อความ (`hotelResortAccentBarClass`)

---

## 4) ความโค้งมน (มาตรฐานโมดูลนี้ — บังคับ)

**รัศมีหลัก: `1.5rem`** (`rounded-[1.5rem]`) — ใช้โทเค็นใน `lib/ui-tokens.ts`  
ชั้นในห้ามโหดกว่าชั้นนอก

| ระดับ | โทเค็น / คลาส | ค่า |
|-------|----------------|-----|
| เปลือกหัวโมดูล | `hotelResortGlassShellClass` | **`rounded-[1.5rem]`** |
| การ์ดหลัก `AppDashboardSection` | `hotelResortSectionRadiusClass` | **`!rounded-[1.5rem]`** ทับ default `rounded-2xl` ของ template |
| ห่อสถิติ / hub QR | `hotelResortStatsShellClass` · hub cards | **`rounded-[1.5rem]`** |
| การ์ดย่อย / รายการ / สถิติใบ | `hotelResortContentCardClass` · stat card | **`rounded-xl`** |
| ปุ่ม / input / chip | ตามจุด | `rounded-xl` (หรือ `rounded-full` สำหรับ chip) |
| Dock pill มือถือ | `hotelResortDockPillClass` ผ่าน `pillClassName` | **`!rounded-[1.5rem]`** |

**บังคับเมื่อเพิ่มหน้าใหม่ในโมดูลนี้:**

1. `AppDashboardSection` ต้องส่ง `className={hotelResortSectionRadiusClass}`
2. อย่า hardcode `rounded-[2.5rem]` / `rounded-2xl` / `rounded-[1.25rem]` บนเปลือกหรือการ์ดหลัก — ใช้โทเค็น `1.5rem`
3. ชั้นในใช้ `rounded-xl` (ต่ำกว่าเปลือก `1.5rem`)

---

## 5) เมนูมือถือ / เดสก์ท็อป

| โซน | พฤติกรรม |
|-----|----------|
| มือถือ | **dock ล่าง** (`AppMobileDockUnifiedBar`) · safe-area · `pb-24` (`hotelResortMainPaddingBottomClass`) |
| เดสก์ท็อป | แท็บกริดในการ์ดหัว (เมื่อหัวเปิด) หรือแถบม่วงเมื่อหัวยุบ |
| เข้าโมดูล | ย่อ sidebar หลัก · **ซ่อน** `MobileBottomNav` หลัก |

เมนูรวมศูนย์ที่ `HOTEL_RESORT_NAV_ITEMS` — shell / dock / header bar อ่านชุดเดียวกัน

---

## 6) สถิติบนมือถือ

แถวสรุปตัวเลข: **`grid-cols-2`** เสมอ · การ์ดคี่ใบสุดท้าย `col-span-2 sm:col-span-1`  
ดู `hotelResortStatsGridClass` / `hotelResortFinanceStatsGridClass` + `dashboard-mobile-summary-stat-grid.mdc`

---

## 7) ช่องทางชำระ (เช็คอิน / บิล) — เหมือนร้านอาหาร

**รายละเอียดเต็ม:** `hotel-resort-payment-methods.mdc`

| ทางเลือก | ค่า `paymentMethod` | สลิป (แดชบอร์ดเช็คอิน/เอาต์) |
|---------|---------------------|------|
| เงินสด | `CASH` | ไม่ต้อง |
| พร้อมเพย์ | `PROMPTPAY` | ทางเลือก (แผงมีช่องแนบ) |
| โอนเงิน | `TRANSFER` | ทางเลือก (แผงมีช่องแนบ) |
| บัตรเครดิต | `CREDIT_CARD` | ไม่ต้อง |

- UI: `HotelResortPaymentPanel` + `lib/payment-method.ts` · ถ่ายสลิปด้วย `useAppCameraCapture`
- QR / บัญชี: `POST /api/hotel-resort/promptpay-qr` (`amountBaht`) จากโปรไฟล์ที่พัก
- สลิป: อัปโหลด `/api/hotel-resort/upload` → เก็บ `paymentSlipUrl` บน `HotelResortBooking`
- **ลิงก์ลูกค้า (มัดจำ/เต็ม):** บังคับสลิป + QR สาธารณะ — `module-customer-booking-website-portal.mdc`
- **รายการจอง:** เมื่อชำระบางส่วน ต้องโชว์ยอดชำระ/ค้าง + สลิปกดดู lightbox

---

## 8) รายการจอง — ตัวกรอง + เตือนเลยเวลา + สลิปมัดจำ

**รายละเอียดเต็ม:** `hotel-resort-booking-filters.mdc`

- ชิป: วันนี้ · เดือนนี้ · ปีนี้ · ช่วงเวลา · ทั้งหมด (+ ต้องปิดงาน)
- ปุ่ม **แสดงกรอง / ซ่อนกรอง** ทุก breakpoint + badge เมื่อกรองค้าง
- เลยเวลาเช็คอิน (`RESERVED`) / เลยเวลาเช็คเอาต์ (`CHECKED_IN`) ตามตั้งค่าที่พัก → เตือนบนการ์ดให้ปิดงาน
- Logic: `lib/booking-filters.ts` · เวลาอิง `checkInTime` / `checkOutTime`
- ชำระบางส่วน + สลิป: แสดงบนการ์ดและโมดัลจัดการ — กดดูได้

---

## 8.1) ผังห้องแดชบอร์ด — สถานะวันนี้ + ซ่อนกรอง

**รายละเอียดเต็ม:** `hotel-resort-room-grid-occupancy.mdc`

- ปุ่ม **แสดงกรอง / ซ่อนกรอง** ที่มุมขวาหัวการ์ด คู่รีเฟรช
- **ห้าม** กรองช่วงเวลาบนผัง — อ้างอิง**วันนี้**เสมอ (กรองวันอยู่ที่หน้าการจอง)
- แผงกรอง: ค้นหา · สถานะ · ต้องปิดงาน · อาคาร · ประเภทห้อง
- สถานะการ์ดจากช่วงพัก · เตือนคนละสี: **amber** ไม่มาเช็คอิน · **rose** ต้องเช็คเอาต์
- **ห้าม** แบนเนอร์สรุปด้านบนผัง — โชว์ผู้จองเช็คอินต่อบนการ์ด
- Logic: `lib/room-occupancy.ts` · เวลาจากตั้งค่าที่พัก · `GET .../rooms?asOf=วันนี้`

---

## 8.2) การเงิน — กรอง + กราฟ + แถบเมนู

**รายละเอียดเต็ม:** `hotel-resort-finance.mdc` · กฎกลาง `dashboard-finance-filter-charts-toggle.mdc`

- การ์ดเดียว «ช่วงเวลาและกราฟ» — แสดง/ซ่อนกรอง · แสดง/ซ่อนกราฟ
- **แถบเมนูในการ์ดรายละเอียดใบเดียว:** ประวัติผู้เข้าพัก · รายรับ · รายจ่าย
- แท็บรายจ่าย: CRUD **หมวดหมู่** + บันทึกรายจ่ายผูกหมวด
- `HotelResortFinanceClient` · `GET .../finance-summary` · `.../cost-categories`

---

## 9) คำอธิบายใน UI (ตัดตามกฎ)

- **`AppSectionHeader`**: `title` (+ `action`) — **ห้าม** `description` อธิบายฟีเจอร์ / นับรายการใต้หัว
- คำอธิบายยาว → **คู่มือการใช้งาน** (`AppUsageGuideModal`) เท่านั้น
- แบนเนอร์/hint บนหน้า: สั้น (เช่น ชื่อห้อง) — ไม่เล่า workflow
- พอร์ทัลลูกค้า: หัวข้อสั้นพอ — ดู `customer-portal-no-description-copy.mdc`
- **เว็บไซต์จองลูกค้า (แบนเนอร์ · ค้นหา · มัดจำ · QR พร้อมเพย์ · สลิป · รายละเอียดหลังจอง):** `.cursor/rules/module-customer-booking-website-portal.mdc`

---

## 10) Checklist ตอนคัดลอกโมดูล

- [ ] `DashboardPagesShell` — เพิ่มเงื่อนไข module + gutter `max-w-none !px-3 sm:!px-4 lg:!px-6`
- [ ] `DashboardShell` — collapse event + header bar เมื่อยุบหัว
- [ ] Shell: accent + `mt-5` + ปุ่มซ่อนหัว + ไม่ใส่แบรนด์ซ้ำ
- [ ] โทเค็นมุมมนตาม §4 · section ใช้ `!rounded-[1.5rem]`
- [ ] Dock pill `rounded-[1.5rem]` · เนื้อหา `pb-24 lg:pb-0`
- [ ] Nav keys แยกไฟล์ต่อ slug — ไม่ซ้ำแท็บกับ dock บนมือถือ
- [ ] ช่องทางชำระ CASH / PROMPTPAY / TRANSFER / CREDIT_CARD + สลิปตาม §7 · ลิงก์ลูกค้าตาม `module-customer-booking-website-portal.mdc`
- [ ] รายการจอง: ตัวกรองช่วง + ซ่อนกรอง + เตือนเลยเวลา + สลิปมัดจำกดดูได้ ตาม §8
- [ ] ผังห้อง: เตือนคนละสี + ผู้จองต่อ + ไม่มีแบนเนอร์บน ตาม §8.1
- [ ] ไม่มี `description` บน `AppSectionHeader` ตาม §9


================================================================================
### .cursor/rules/hotel-resort-payment-methods.mdc
================================================================================

---
description: โรงแรมรีสอร์ท — ช่องทางชำระเงินสด พร้อมเพย์ โอน บัตรเครดิต + สลิปมัดจำจากลิงก์ลูกค้า
globs:
  - "**/systems/hotel-resort/**"
  - "**/app/**/dashboard/hotel-resort/**"
  - "**/app/api/hotel-resort/**"
alwaysApply: false
---

# โรงแรม / รีสอร์ท — ช่องทางชำระเงิน

ใช้เมื่อทำหรือแก้ **การรับชำระตอนเช็คอิน / บิลจอง / สลิปมัดจำจากลิงก์ลูกค้า** ในโมดูล hotel-resort  
แพทเทิร์นเดียวกับร้านอาหาร (drink-pos): **เงินสด · พร้อมเพย์ · โอนเงิน · บัตรเครดิต**

อ้างอิง drink-pos: `DrinkPosPaymentPanel` · `drink-pos/lib/payment-method.ts` · §ช่องทางชำระใน `drink-pos-module-dashboard-template.mdc`  
ลิงก์ลูกค้าเว็บจอง: `module-customer-booking-website-portal.mdc`

---

## บังคับ (แดชบอร์ด)

1. **สี่ช่องทาง** (ค่าเก็บใน DB เป็นสตริง):
   - `CASH` — เงินสด
   - `PROMPTPAY` — พร้อมเพย์
   - `TRANSFER` — โอนเงิน
   - `CREDIT_CARD` — บัตรเครดิต
2. **UI เลือกช่องทาง** ใช้ `HotelResortPaymentPanel` — ห้ามทำปุ่ม QR / อัปโหลดสลิปแยกแบบ ad-hoc บนหน้าเช็คอินถ้าเป้าหมายคือรับชำระแบบบิลร้านอาหาร
3. **Logic / label** รวมที่ `src/systems/hotel-resort/lib/payment-method.ts`
   - `hotelResortPaymentMethodLabel`
   - `isHotelResortPaymentMethod`
   - `hotelResortPaymentShowsSlipUpload(method, amountBaht)` — แสดงช่องแนบสลิปเมื่อ `PROMPTPAY` หรือ `TRANSFER` และ **ยอดที่ชำระ > 0** (บัตรเครดิต / เงินสดไม่โชว์ช่องสลิป)
   - `hotelResortPaymentRequiresSlip` — **ไม่บังคับสลิปแล้ว** บนแดชบอร์ดเช็คอิน/เอาต์ (คืน `false` เสมอ; คงชื่อไว้เพื่อความเข้ากันได้)
4. **ฟิลด์บน `HotelResortBooking`**: `paymentMethod` · `paymentSlipUrl` (สลิปชำระเพิ่มตอนเช็คอิน/เอาต์) · `depositSlipUrl` (สลิปมัดจำ/ชำระตอนจองจากลิงก์ลูกค้า) · `amountPaidBaht` · `paymentStatus` · `depositAmountBaht`
5. **API** `POST` / `PATCH` `/api/hotel-resort/bookings` รับสลิปได้แต่**ไม่บังคับ** บนแดชบอร์ด — ใช้ยอด `amountPaidBaht` ร่วมกับแผงชำระ · **ห้าม** ทับ/ลบ `depositSlipUrl` เมื่ออัปเดต `paymentSlipUrl` หรือเลือก CASH / CREDIT_CARD
6. **พร้อมเพย์ (แดชบอร์ด):** QR จาก `POST /api/hotel-resort/promptpay-qr` body `{ amountBaht }` — เบอร์จาก `HotelResortProfile.promptPayPhone`
7. **โอน**: แสดงธนาคาร / เลขบัญชี / ชื่อบัญชีจากโปรไฟล์ที่พัก (ผ่าน response ของ promptpay-qr เดียวกัน)
8. **สลิป (แดชบอร์ด):** อัปโหลด `/api/hotel-resort/upload` ผ่าน `AppGalleryCameraFileInputs` + `AppImagePickCameraButtons` ใน `HotelResortPaymentPanel` — ปุ่มถ่ายใช้ **`useAppCameraCapture`** (`AppCameraCaptureModal`) — **ไม่บังคับ** สลิปตอนเช็คอิน/เอาต์ · เก็บใน `paymentSlipUrl`
9. เงินสด / บัตรเครดิต: ล้าง `paymentSlipUrl` ได้ · **ไม่** ล้าง `depositSlipUrl` · ไม่บังคับสลิป

---

## ลิงก์ลูกค้า (เว็บจอง — เมื่อ `payDueBaht > 0`)

1. ช่องทางเฉพาะ `PROMPTPAY` \| `TRANSFER` (ไม่มี CASH / CREDIT_CARD บนพอร์ทัลเมื่อเก็บเงิน — ชำระหน้าเว็บด้วยโอน/พร้อมเพย์)
2. **พร้อมเพย์:** แสดง QR จาก `POST /api/hotel-resort/public/portal/promptpay-qr` — gate `isHotelResortPortalOpenForOwner`
3. **ถ่ายสลิป:** `useAppCameraCapture` เหมือนแผงแดชบอร์ด
4. **บังคับแนบสลิป** ก่อนยืนยันจอง + ข้อความ:
   - มัดจำ: `กรุณาอัปโหลดสลิป เพื่อเป็นหลักฐานการมัดจำการจอง`
   - เต็ม: `กรุณาอัปโหลดสลิป เพื่อเป็นหลักฐานการชำระเงินจอง`
5. บันทึกยอดชำระบางส่วน/เต็มลง `amountPaidBaht` + `depositSlipUrl` (สลิปตอนจอง) — `paymentSlipUrl` ว่างไว้สำหรับสลิปชำระเพิ่มตอนเช็คอิน
6. รายละเอียดเต็ม UI/API: `module-customer-booking-website-portal.mdc`

---

## แสดงสลิปเมื่อชำระบางส่วน (บังคับ)

เมื่อจองมี `amountPaidBaht > 0` และ/หรือ `depositSlipUrl` / `paymentSlipUrl`:

| พื้นผิว | ต้องแสดง |
|--------|----------|
| หน้ารายละเอียดลูกค้าหลังจอง | ชำระแล้ว · คงเหลือ · สลิปมัดจำ (`depositSlipUrl`) และสลิปชำระเพิ่ม (`paymentSlipUrl`) แยกกัน กด lightbox |
| รายการจองแดชบอร์ด | ยอดชำระแล้ว/ค้าง + สลิปทั้งสองกดดูได้บนการ์ด |
| โมดัลจัดการการจอง | ยอดชำระแล้ว/คงเหลือ + สลิปมัดจำ + สลิปชำระเพิ่มกดดูได้ |

ใช้ `AppImageThumb` + `AppImageLightbox` + `useAppImageLightbox` จาก `@/components/app-templates` เท่านั้น

---

## หน้าเช็คอิน

- ยอดรวม + ยอดที่ชำระแล้วก่อนหน้า + **ยอดต้องชำระเพิ่ม** (หรือยอดชำระตอนนี้เมื่อเช็คอินจากการจอง)
- แสดงสลิปมัดจำ (`depositSlipUrl`) อ่านอย่างเดียวเมื่อมี
- แผง `HotelResortPaymentPanel` ผูกกับยอดที่ชำระครั้งนี้ → เก็บใน `paymentSlipUrl` แยกจากมัดจำ
- ปุ่มยืนยันเช็คอิน — สลิปพร้อมเพย์/โอนเป็นทางเลือก ไม่บล็อกเมื่อไม่มีรูป
- **ห้าม** ใส่สลิปมัดจำลง state ของแผงชำระเพิ่ม หรือส่ง PATCH ที่ลบ `depositSlipUrl`

---

## หน้าเช็คเอาต์ (แดชบอร์ดผังห้อง)

- ห้องสถานะ **เข้าพัก (`OCCUPIED`)** แสดงปุ่ม **เช็คเอาต์** — **ห้าม** ปุ่ม「ดูการจอง」บนการ์ดผัง
- โมดัล `HotelResortCheckOutModal`: รายการเพิ่ม (ผ้าขนหนู · มินิบาร์ ฯลฯ) + สรุปยอด + ยอดชำระตอนนี้ + `HotelResortPaymentPanel`
- บันทึก: `PATCH` จอง → `status: CHECKED_OUT` · บวก extras เข้า `totalBaht` · เพิ่ม `amountPaidBaht` · extras เก็บใน `note` บล็อก `[HR_EXTRAS]…` (`lib/checkout-extras.ts`)
- สลิปพร้อมเพย์/โอนเป็นทางเลือกเมื่อยอดชำระตอนนี้ > 0 — ไม่บังคับแนบรูป

---

## ห้ามพลาด

- อย่าเพิ่มช่องทางใหม่โดยไม่ขยาย `HOTEL_RESORT_PAYMENT_METHODS` + แผง + schema ความหมาย
- อย่าตรวจสลิปจาก `totalBaht` เมื่อยังไม่มีการชำระ (`amountPaidBaht === 0`)
- อย่าบล็อก `PATCH` เปลี่ยนสถานะอย่างเดียวด้วยกฎสลิป ถ้าไม่ได้แตะฟิลด์ชำระ
- อย่าบวกรายการ extras จาก note ซ้ำเข้า `totalBaht` อีกครั้งตอนเปิดโมดัล
- อย่าทำพร้อมเพย์บนลิงก์ลูกค้าโดยไม่แสดง QR (`public/portal/promptpay-qr`)
- อย่าผูกปุ่มถ่ายสลิปกับ `input capture` อย่างเดียว — ใช้ `useAppCameraCapture`
- อย่าซ่อนสลิปมัดจำ/ชำระบางส่วนบนรายการจองหรือหน้ารายละเอียดลูกค้า
- อย่าทับสลิปมัดจำ (`depositSlipUrl`) ด้วยสลิปเช็คอิน หรือล้างเมื่อเลือกเงินสด / บัตรเครดิต
- อย่าใส่สลิปมัดจำลง `paymentSlipUrl` ตอนเช็คอิน — เก็บแยกทั้งสองเสมอ


================================================================================
### .cursor/rules/hotel-resort-room-grid-occupancy.mdc
================================================================================

---
description: โรงแรมรีสอร์ท — ผังห้องแดชบอร์ด สถานะวันนี้ + กรองสถานะ/ค้นหา (ไม่มีกรองช่วงเวลา)
globs:
  - "**/systems/hotel-resort/**RoomGrid*"
  - "**/systems/hotel-resort/HotelResortDashboard*"
  - "**/systems/hotel-resort/lib/room-occupancy*"
  - "**/app/api/hotel-resort/rooms/**"
  - "**/app/api/hotel-resort/dashboard-summary/**"
alwaysApply: false
---

# โรงแรม / รีสอร์ท — ผังห้องแดชบอร์ด

ใช้เมื่อทำหรือแก้ **ผังห้อง** บนแดชบอร์ด (`HotelResortRoomGrid` · `HotelResortDashboardClient`)

คู่กับ: `hotel-resort-booking-filters.mdc` (กรองช่วงเวลาอยู่ที่**หน้าการจอง**เท่านั้น) · `hotel-resort-module-dashboard-template.mdc`

---

## 1) สถานะห้อง = ปัจจุบันเสมอ (บังคับ)

1. แดชบอร์ดโหลดด้วย `asOf` = **วันนี้** ทุกครั้ง (รีเฟรชคำนวณวันใหม่)
2. **ห้าม** ชิปวันนี้/เดือนนี้/ปีนี้/ช่วงเวลา หรือช่องเลือกวันที่บนผังห้อง
3. กรองช่วงเวลาของการจองอยู่ที่ `/dashboard/hotel-resort/bookings` เท่านั้น
4. ห้อง **จอง / เข้าพัก** จากช่วง `[เช็คอิน, เช็คเอาต์)` ของวันนี้ · จองล่วงหน้า = ว่าง + hint
5. **ผู้จองวันถัดไป** — ถ้ามีจองเช็คอินพรุ่งนี้ (หรือพักครอบคลุมพรุ่งนี้ คนละรายการกับวันนี้) แสดงบนการ์ดเสมอ แม้ห้องมีผู้เข้าพักวันนี้ (`nextDayGuestLabel`)
6. เลยเวลาแล้วยังไม่ปิดงาน → `needsClose` + เตือน · Logic: `lib/room-occupancy.ts`
   - **เข้าพัก:** เตือนเมื่อถึง/เลย **เวลาเช็คเอาต์** ของที่พักในวันเช็คเอาต์ — ห้ามเตือนตั้งแต่เช้าก่อนถึงเวลา
   - **จอง:** เตือนเมื่อถึง/เลย **เวลาเช็คอิน** ของที่พักในวันเช็คอิน (หรือเลยวันเช็คอินแล้ว)

## 2) แสดง / ซ่อนกรอง — ตำแหน่งปุ่ม (บังคับ)

1. ปุ่ม **แสดงกรอง / ซ่อนกรอง** ที่ **มุมขวาหัวการ์ด** คู่ **รีเฟรช**
2. `aria-controls="hotel-resort-room-filter-panel"` · ค่าเริ่มเปิด
3. ขณะซ่อน: ข้อความสั้น + badge เมื่อกรองค้าง

## 3) โครงแผงกรอง (บังคับ)

**ไม่มีแถวเงื่อนไขเวลา** — เหลือแค่:

| โซน | เนื้อหา |
|-----|---------|
| หัวแผง | จำนวนห้องที่แสดง · ล้างตัวกรอง |
| แถวหลัก (`lg` แนวนอน) | ค้นหา · ชิปสถานะ · ต้องปิดงาน · อาคาร · ประเภทห้อง |

## 5) เตือนพ้นเวลา / เคลียร์ห้อง (บังคับ)

1. จองถึง/เลยเวลาเช็คอินแล้วยังไม่มา หรือเข้าพักถึง/เลยเวลาเช็คเอาต์ → `needsClose` + ไอคอนเตือนบนการ์ด + เรียงขึ้นก่อน
2. **สีคนละโทน (บังคับ):**
   - `NO_SHOW` (ยังไม่เช็คอิน) → **amber** (วงแหวน · ไอคอนมุม · กล่องข้อความ)
   - `CHECKOUT` (ต้องเช็คเอาต์) → **rose**
3. **ห้าม** แบนเนอร์สรุปด้านบนผังห้อง — เตือนอยู่บนการ์ด + ชิปกรอง「ต้องเคลียร์」+ สถิติพอ
4. พ้นเช็คอิน: ปุ่ม **ไม่มา · เปิดห้อง** · พ้นเช็คเอาต์: **เช็คเอาต์ · เคลียร์**
5. ข้อความ: `hotelResortNeedsCloseLabel` — เน้นแจ้งลูกค้าเช็คอิน/เช็คเอาต์
6. **เช็คอินต่อ** — แสดงผู้จองถัดไปบนการ์ดเสมอเมื่อมี (`nextDayGuestLabel` / `nextDayIsContinuous`)

## 6) เช็คเอาต์จากผังห้อง (บังคับ)

1. ห้อง **เข้าพัก** → ปุ่ม **เช็คเอาต์** (ไม่มีปุ่มดูการจองบนการ์ด)
2. โมดัล extras + `HotelResortPaymentPanel` — `hotel-resort-payment-methods.mdc`

## เช็กลิสต์

- [ ] ไม่มีตัวกรองช่วงเวลาบนแดชบอร์ด
- [ ] สถานะผังอ้างอิงวันนี้เสมอ
- [ ] ซ่อนกรองอยู่หัวการ์ดคู่รีเฟรช
- [ ] มีเครื่องหมายเตือนคนละสี (amber ไม่มา / rose เช็คเอาต์) บนการ์ด · ไม่มีแบนเนอร์บน
- [ ] แสดงผู้จองเช็คอินต่อบนการ์ด
- [ ] ห้องเข้าพักมีปุ่มเช็คเอาต์


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

**แม่แบบ UX ระดับโมดูล:** เทียบ **`CarWashDashboard`** และ **`shop-qr-hub-popup-pattern.mdc`**

**แม่แบบโครงสร้างโมดูลทั้งก้อน (อัปเดต):** **`laundry-module-dashboard-template.mdc`** — ก่อนออกแบบโมดูลใหม่ อ่าน **`dashboard-module-design-check-laundry-first.mdc`**

**แผนที่คู่ขนานคาร์แคร์/บาร์เบอร์:** **`dashboard-module-car-wash-barber-reference.mdc`**

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

1. **โครงกล่อง** — `rounded-lg border-2 · sm:rounded-2xl` · `p-2 sm:p-4` · `ring-1` · `shadow-sm` · `hover:shadow-md` · พื้น/ขอบตาม `laundryOrderCardToneClasses(status)` ใน `src/systems/laundry/laundry-order-card-tone.ts` (amber / sky / violet / cyan / indigo / teal / emerald / slate / rose ตามสายงาน) — **มาตรฐานข้ามโมดูล (รายการทั่วไป + ไอคอน tile):** **`dashboard-module-list-card-icon-tones.mdc`**
2. **แถบไฮไลต์ซ้าย** — `absolute` แถบ `w-1` `bg-gradient-to-b` ตาม `ribbonGradient` · ขยายเมื่อ `group-hover/item` (เทียบแพ็กเหมาคาร์แคร์)
3. **แบ่งซ้าย–ขวา** — `flex` · `gap-2 sm:gap-4`
   - **ซ้าย (`flex-1`)** — หัว `แพ็กเกจ` ตัวพิมพ์เล็ก uppercase · **ชื่อบรรทัดหลัก** จาก `laundryOrderCardPackageLines(package_name, service_type)` — ถ้า `service_type` เป็นแค่ชื่อแพ็กเกจ + คำขยาย เช่น `(ตะกร้า S)` ให้แสดง **บรรทัดเดียว** (`service_type` เต็ม) · แสดงบรรทัดรองเฉพาะเมื่อสองฟิลด์ไม่เกี่ยวข้องกัน · gradient เดิม (`bg-clip-text`) · แถวข้อความ **ขนาด** (ไม่ใช้แคปซูลมีขอบ) · เบอร์ · ชื่อ · เวลา · ที่อยู่ (ตามกฎซ่อน placeholder)
   - **ขวา** — คอลัมน์ย่อบนมือถือ (`min-w-[5.75rem] w-[30%] max-w-[8rem] sm:min-w-[9rem] sm:w-[9rem]`) — ข้อความสถานะ (สีตามขั้น · **ไม่** ใช้แคปซูล) · `#id` · ราคา · **ลิงก์เปิด Google Maps ใต้ราคา** (เมื่อมีพิกัด) · กลุ่มปุ่มพิมพ์/ดู/แก้ไข/ลบ — **ไม่** ใช้ `border-l` / พื้นหลังแถบปุ่ม (แยกด้วย `gap` / `pt`)
4. **อัปเดตสถานะ (คิวงาน)** — **ไม่ใช้ `<select>`** — ใช้ **`LaundryOrderStatusIconStrip`** แถบเลื่อนแนวนอน · ปุ่ม **`h-7 min-w-[1.75rem]` มือถือ** · `sm:h-8 sm:min-w-[2rem]` · ไอคอนรายสถานะ + **`aria-label` / `title`** เป็นชื่อไทย (`laundryOrderStatusLabelTh`) · สถานะปัจจุบัน `aria-current="true"` + ขอบ/วงแหวนเน้น · แถบมี **`role="toolbar"`** + **`aria-label`** ระบุเลขรายการ · ซ่อนหัวข้อความรอง «อัปเดตสถานะ» บนมือถือ (`hidden sm:block`) — แก้สถานะในโมดัลแก้ไขออเดอร์ยังใช้ dropdown ได้ตามฟอร์ม · **บล็อกนี้ยังใช้ `border-t-2` + `dividerStrong` + `dimHorizontalStripRidge`** จาก `laundryDashboardCardDividerClasses` เพื่อคั่นจากเนื้อหาด้านบน (ส่วนเดียวที่มีเส้นคั่นแนวนอนในการ์ด)
5. **พิกัดรับผ้า** — ตัดบรรทัด `พิกัด GPS:…` ออกจากที่อยู่ซ้าย · ใช้ `laundryResolveOrderPickupCoords` / `laundryGoogleMapsUrl` (`lib/order-pickup-coords.ts`) · แสดงลิงก์ใต้ราคาเท่านั้น

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

## กลุ่มปุ่มรายการ (พิมพ์ / ดู / แก้ไข / ลบ)

- **รายการออเดอร์** (งานค้าง · การเงิน — ประวัติรายรับ) และ **รายการแพ็กเกจ** — มุมขวาของการ์ด/แถว ใช้ **`LaundryToolbarIconButton`** กับ **`laundryRowIconButtonClass` (`h-7 w-7`)** — **เล็กกว่า** ปุ่มแถบหัว (`h-10`)
  1. **พิมพ์** (ถ้ามี) — `LaundryIconPrint`
  2. **ดูข้อมูล** — ไอคอนตา (`LaundryIconEye`) → โมดัลอ่านอย่างเดียว
  3. **แก้ไข** — ไอคอนดินสอ (`LaundryIconPencil`) → โมดัลแก้ไข (ออเดอร์: ชื่อ เบอร์ สถานะ หมายเหตุ · แพ็กเกจ: `LaundryPackageEditorModal`)
  4. **ลบ** — ไอคอนถัง (`LaundryIconTrash`) · `variant="danger"` → ยืนยันแล้วเรียก `repo.deleteOrder` / `repo.deletePackage`
- ทุกปุ่มต้องมี **`aria-label`** และ **`title`** (`label` prop เดียวกันในคอมโพเนนต์)
- **ห้าม** ใช้ `laundryIconButtonClass` (`h-10`) ในแถวการ์ด — สงวนไว้แถบหัว/รีเฟรช

---

## ศูนย์ QR (แท็บ QR)
- **`LaundryQrHubClient`** — การ์ดคู่ + `FormModal` (violet / amber) ตาม **`shop-qr-hub-popup-pattern.mdc`**
- **ไม่** แผงโปสเตอร์ยาวใต้การ์ด — เนื้อหา QR อยู่ในโมดัลเท่านั้น
- ลิงก์ลูกค้า: `/laundry/pickup/[ownerId]` (+ `t` ใน sandbox); พนักงาน: `/dashboard/laundry/staff` (+ `t`)

---

## หน้าตั้งค่าร้าน (`LaundrySettingsClient`)

เทียบ **`dashboard-module-shop-settings-tabs.mdc`** · **`dashboard-module-settings-single-row-tabs.mdc`**

### มือถือ — dropdown แล้วซ่อนแถบ pill

| จอ | UI |
|----|-----|
| **`< md`** | dropdown เต็มความกว้าง (`laundryMobileSelectClass` · `md:hidden`) + ป้าย «กรุณาเลือกหมวดตั้งค่า» |
| **`md+`** | แถบ pill คู่ปุ่ม **บันทึก** แถวเดียวกัน (มุมขวาหัวการ์ด) |

**บังคับ**

1. เมื่อมี dropdown บนมือถือ — **ห้าม** โชว์แถบ pill แท็บพร้อมกัน  
2. ซ่อน pill ด้วย **wrapper** `<div className="hidden md:block">` ห่อ `<nav>` — **ห้าม** ใส่ `hidden md:inline-flex` บน element เดียวกับ shell ที่มี `inline-flex` (twMerge อาจทำให้ pill โผล่คู่ dropdown)  
3. หัวแถวมือถือ: **ชื่อ + ปุ่มบันทึก** เท่านั้น — แท็บอยู่แถว dropdown ด้านล่าง  
4. ปุ่มรอง/อัปโหลดในฟอร์ม: **`laundryOutlineButtonClass`** (สูง `h-10` · outline slate) — alias เก่า `laundryCompactOutlineButtonClass`

**Implementation:** `src/systems/laundry/components/LaundrySettingsClient.tsx` · โทเค็น `src/systems/laundry/lib/ui-tokens.ts`

---

## รูปตัวอย่างพอร์ทัล / แพ็กเกจ (Unsplash)

- **แหล่งความจริง:** `src/systems/laundry/lib/portal-media.ts` — ห้าม hardcode URL Unsplash ซ้ำใน component/seed
- **ก่อน commit URL ใหม่:** ตรวจ HTTP ว่าไม่ 404 (เช่น `curl -I` หรือเปิดในเบราว์เซอร์)
- **URL ที่เคย 404:** ใช้ `laundryRepairSampleImageUrl` / `laundryRepairPortalGallery` ตอน **อ่าน API** และ `repairLaundryBrokenSampleImagesDb` ใน seed เพื่อซ่อมข้อมูลเก่าใน DB

---

## เช็กลิสต์เมื่อแก้ UI ซักผ้า

- [ ] การ์ดสถิติ overview ใช้ **`laundryDashboardStatsGridClass`** (`grid-cols-2` ตลอด) — รายการงานยัง **`laundryDashboardCardGridClass`** (`sm:grid-cols-2`)
- [ ] แผงงานค้างใช้ `LaundryActiveOrdersPanelHeader` — รีเฟรชไม่อยู่หัวกระจกโมดูล
- [ ] แท็บ QR ยังเป็น Hub การ์ดคู่ + modal เท่านั้น — **ไม่** เพิ่มการ์ดทางลัด QR กลับไปที่แดชบอร์ด overview
- [ ] ปุ่มแถวเครื่องมือในโมดัล QR ใช้ `cw-btn` ชุดเดียวกับคาร์แคร์
- [ ] โฟลว์บันทึกรายการยังเป็น POS สองขั้น (`LaundryRecordOrderModal`) — การ์ดแพ็กเกจ + จัดการรูป/ตะกร้า · แล้วเบอร์/ชื่อเล่น — โมดัลใช้ **`mobileCentered`** ให้อยู่กลางจอบนมือถือ · กริดเลือกแพ็กเกจสอดคล้องแดชบอร์ด：**มือถือ `grid-cols-1` · `sm+` `grid-cols-3`** (ไม่ขยาย 4 คอลัมน์ที่คอม)
- [ ] **`LaundryPackageCard`** — แท็บแพ็กเกจ: **`laundryPackageTabListGridClass`** + **`packagesTabRowLayout`** · **ข้อความล้วน** · เมตาขวา **`·`** · **มือถือระยะกระชับ** (`p-2.5` · `gap-2` · `space-y-1.5` · `detailStackClass` **`gap-y-1 sm:gap-y-2`** · `pt-1.5` ใต้เส้นคั่น · ฯลฯ ตามหัวข้อย่อย **มือถือ (ระยะห่าง)** ในกฎ) · **`LaundryPackageViewModal`** สอดคล้องเมื่อแตะดู
- [ ] แท็บ **การเงิน** — **`LaundryFinancePanel`** + **`LaundryCostPanel`** สอดคล้อง **`CarWashSalesPanel`** / **`CarWashCostPanel`** (กราฟคู่ · โหลด cost ใน `loadAll`)
- [ ] **ตั้งค่าร้าน** — มือถือ dropdown **`md:hidden`** · pill ใน **`hidden md:block`** wrapper · **ไม่** โชว์ pill + dropdown พร้อมกัน
- [ ] รายการงาน (คิว + การเงิน) ใช้ **`LaundryOrderCard`** — ข้อความแพ็กเกจไม่ซ้ำ (`laundry-order-package-lines.ts`) · คิวงานอัปเดตสถานะด้วย **`LaundryOrderStatusIconStrip`** ไม่ใช้ dropdown บนการ์ด
- [ ] คำบรรยาย subtitle / `FormModal` **สั้น** และ **ซ่อนบนมือถือ** (ตามกฎด้านบน)


================================================================================
### .cursor/rules/laundry-module-dashboard-template.mdc
================================================================================

---
description: แม่แบบโมดูลแดชบอร์ดครบชุด (รับฝากซักผ้า) — กล่อง layout ปุ่ม ชำระเงิน สลิป พิมพ์ popup การ์ด เมนู ซ่อนเมนู คู่มือ กรอง กราฟ — อ้างอิงเมื่อสร้างหรือปรับโมดูลใหม่
globs:
  - "**/systems/laundry/**"
  - "**/app/**/dashboard/laundry/**"
  - "**/app/laundry/**"
  - "**/app/api/laundry/**"
  - "**/systems/**/components/*Shell*.tsx"
  - "**/systems/**/components/*Chrome*.tsx"
  - "**/lib/modules/**"
alwaysApply: false
---

# รับฝากซักผ้า — แม่แบบโมดูลแดชบอร์ด (Golden Example)

ใช้เมื่อ **สร้างโมดูลแดชบอร์ด ใหม่** หรือปรับโมดูลเดิมให้ครบมาตรฐาน UX/UI โปรเจกต์ — ยึด **ซักผ้า** เป็นต้นแบบโครงสร้าง + การ์ด + ชำระเงิน + พิมพ์ + พอร์ทัลลูกค้า + การเงิน/กราฟ

**กฎที่ต้องคู่ด้วย:**  
`dashboard-ux-car-wash-baseline.mdc` · `app-templates-central.mdc` · `app-templates-media.mdc` · `app-templates-spark-charts.mdc` · `module-chrome-no-branding.mdc` · `dashboard-new-module-sidebar-icon.mdc` · `dashboard-page-width.mdc` · `dashboard-mobile-summary-stat-grid.mdc` · `dashboard-row-action-icon-buttons.mdc` · `dashboard-module-list-filter.mdc` · `dashboard-mobile-filter-icon.mdc` · `dashboard-finance-module-template.mdc` · **`dashboard-module-list-card-icon-tones.mdc`** · **`dashboard-module-page-menu-icons.mdc`** · `module-package-deduct-signature.mdc` · `module-package-sell-tax-invoice-print.mdc` · `module-package-name-description-ui.mdc` · `shop-qr-hub-popup-pattern.mdc` · `module-customer-booking-website-portal.mdc` · **`laundry-module-portal-website-template.mdc`** · `module-thailand-timezone.mdc`

**ก่อนออกแบบโมดูลใหม่:** อ่าน **`dashboard-module-design-check-laundry-first.mdc`** ก่อนเสมอ

**คู่ขนาน chrome:** `football-turf-module-dashboard-template.mdc` · `dashboard-module-car-wash-barber-reference.mdc`

---

## 0) หลักคิดสั้น ๆ

1. **โครงสร้างไฟล์แยกชั้น** — shell/chrome/nav ≠ หน้าย่อย ≠ client panels ≠ service ≠ API ≠ พอร์ทัลสาธารณะ  
2. **UX มือถือ = dock ล่าง 4 รายการ** · เดสก์ท็อป = แท็บหัวในการ์ด · ยุบหัวได้  
3. **แจ้งเตือน/ยืนยัน = `useAppNoticePopup` + `AppNoticePopup`** — ห้าม inline banner แดง/เขียว · หลีกเลี่ยง `window.confirm` ใน flow ใหม่  
4. **UI token รวมที่ `ui-tokens.ts`** — ห้ามคัดลอกสตริง Tailwind ซ้ำหลายไฟล์  
5. **กราฟการเงิน = `compact` ชุดเดียวทั้งหน้า** — `AppRevenueCostColumnChart` + `AppColumnBarSparkChart`  
6. **หัวข้อการ์ดสั้น** — รายละเอียดยาว → คู่มือ `?` ใน `LaundryUsageGuideModal`  
7. **ห้ามซ้ำแบรนด์ / ห้ามซ้ำ gutter** กับ `PageContainer` — ดู §2b  

---

## 1) แผนที่ไฟล์

| บทบาท | พาธอ้างอิงซักผ้า |
|--------|------------------|
| Layout + guard | `src/app/(dashboard)/dashboard/laundry/layout.tsx` → `LaundryModuleShell` |
| หน้าแยก | `.../laundry/page.tsx` · `finance/` · `manage/` · `settings/` · `staff/` |
| Shell / Chrome | `components/LaundryModuleChrome.tsx` · `LaundryModuleShell.tsx` |
| Nav keys / collapse | `laundry-module-nav.tsx` — `LAUNDRY_HEADER_COLLAPSE_*` |
| แท็บเมื่อหัวยุบ | `LaundryHeaderBarNav.tsx` |
| Dock มือถือ | `AppMobileDockShell` ใน `LaundryModuleChrome` |
| แดชบอร์ด hub | `LaundryDashboardHubClient.tsx` · sub-nav `LaundryPageSubNav.tsx` |
| ภาพรวม / POS / คิว | `LaundryOverviewPanel` · `LaundryOrdersPosClient` · `LaundryOrderCard` |
| การเงิน | `LaundryFinancePageClient` · `LaundryFinancePanel` · `LaundryRevenuePanel` · `LaundryCostPanel` |
| จัดการ | `LaundryManageHubClient` · `LaundryPackagesClient` · `LaundryPurchasesClient` |
| ตั้งค่า | `LaundrySettingsClient` · `LaundryPortalMediaSettings` |
| QR / ลิงก์ hub | `LaundryQrHubClient` (แท็บ `link` — บล็อกสายรายวันทีเดียว) |
| คู่มือ | `LaundryUsageGuideModal.tsx` |
| พอร์ทัลลูกค้า | `/laundry/[ownerId]` · `LaundryPortalPublicClient` · `LaundryPortalPackageDetailModal` |
| รับ–ส่ง | `LaundryPickupPublicClient` · `/laundry/pickup/[ownerId]` |
| ชำระเงิน | `LaundryPaymentPanel` · `LaundryPublicPaymentPanel` |
| พิมพ์ | `lib/laundry-print-docs.ts` · `LaundryOrderPrintModal` · `LaundryMemberPrintModal` |
| UI tokens | `lib/ui-tokens.ts` |
| Service / SSE | `laundry-service.ts` · `lib/dashboard-sse.ts` · `lib/dashboard-bus.ts` |
| Staff PIN | `LaundryStaffClient` · `/api/laundry/staff/*` |

**โมดูลใหม่:** แยก **nav + chrome + dock + page clients + tokens + service + API + portal** — อย่ายัดทุกแท็บในไฟล์เดียว

---

## 2) เมนูหลักโมดูล (4 รายการ)

| key | ชื่อ | หน้า | sub-nav |
|-----|------|------|---------|
| `dashboard` | แดชบอร์ด | `/dashboard/laundry` | ภาพรวม · ออเดอร์ · คิวออนไลน์ |
| `finance` | การเงิน | `/dashboard/laundry/finance` | — |
| `manage` | การจัดการ | `/dashboard/laundry/manage` | แพ็กเกจ · สมาชิก |
| `settings` | ตั้งค่า | `/dashboard/laundry/settings` | พื้นฐาน · การเงิน · ตั้งค่าเว็บไซต์ · เวลา · ลิงก์ (QR) |

- **มือถือ:** dock ล่าง 4 คอลัมน์ · `rounded-[2.5rem]` · safe-area · `pb-24` เนื้อหา  
- **เดสก์ท็อป:** แท็บในการ์ดหัว (`laundryPrimaryTabShellClass` / pills)  
- **Sub-nav:** `LaundryPageSubNav` — segment shell (`laundryDashboardSegmentShellClass`) · **ไอคอนหัวข้อหน้า + แท็บ** ตาม **`dashboard-module-page-menu-icons.mdc`**  
- **Sidebar icon:** `dashboard-nav-icons.tsx` — href `/dashboard/laundry`  

---

## 3) ซ่อนเมนูหลักระบบ + ยุบหัวโมดูล

### ซ่อน MobileBottomNav / ย่อ sidebar

- เข้า `/dashboard/laundry/*` → `isModuleWorkspacePath` → **ย่อ sidebar** · **ซ่อน** `MobileBottomNav` หลัก  
- **Staff kiosk** `/dashboard/laundry/staff` → `DashboardPagesShell` ใช้ `!px-0 !py-0` · ไม่มี dock โมดูลเต็มรูปแบบ  

### ยุบหัวโมดูล

| รายการ | ค่า |
|--------|-----|
| localStorage | `mawell-laundry-module-header-collapsed` (`LAUNDRY_HEADER_COLLAPSE_KEY`) |
| event | `mawell-laundry-header-collapse` |
| ปุ่ม | มุมขวาบนการ์ดหัว · จำสถานะ |
| เมื่อยุบ | แท็บไป `LaundryHeaderBarNav` ในแถบม่วง `DashboardShell` |

---

## 4) กล่อง · การ์ด · อักษร (ui-tokens)

**แหล่งความจริง:** `src/systems/laundry/lib/ui-tokens.ts`

| โทเค็น | ใช้เมื่อ |
|--------|---------|
| `laundryPanelClass` | การ์ดหลักทุกแผง — `rounded-xl border slate shadow-sm` (plain inner ไม่ glass ซ้อน) |
| `laundryPanelSectionClass` | padding เนื้อหาในแผง |
| `laundrySectionHeadingClass` | หัวข้อการ์ด `text-sm font-bold #1e1b4b` |
| `laundrySubtitleClass` | คำอธิบายสั้น — **ซ่อนบนมือถือ** (`hidden sm:block`) |
| `laundryStatInlineClass` | สถิติเส้นซ้าย — กริด **2 คอลัมน์** มือถือ (`laundryDashboardStatsGridClass`) |
| `laundryBtnHeightClass` | ความสูงปุ่มมาตรฐาน — **`box-border h-9 min-h-9 max-h-9`** |
| `laundryOutlineButtonClass` / `laundryPrimaryButtonClass` | ปุ่มข้อความขาว / ไล่สีน้ำเงิน→ชมพู |
| `laundryIconButtonClass` | ปุ่มไอคอนล้วนสูงเท่าปุ่มข้อความ (`h-9 w-9`) — รีเฟรช · ปิดโมดัล |
| `laundryRowIconButtonClass` | ปุ่มไอคอน**ในแถวการ์ด** — **`h-7 w-7`** (เล็กกว่าแถบหัว) |
| `laundryToolbarRowClass` | แถวปุ่มหัวแดชบอร์ด/พนักงาน — `items-center gap-1` |
| `laundryHeaderActionBtnClass` | หักแพ็ก / ขายแพ็ก — ใช้ outline/primary ชุดเดียว |
| `laundryInlineSubNavBtnClass` / `laundryStaffNavTabClass` | แท็บแถบหัว — **คลาสเดียวกับ** outline/primary (สูงเท่ากัน) |
| `laundryFieldClass` | ช่องกรอกสูง/มนเท่าปุ่ม (`h-9` · `rounded-lg`) |
| `laundryPrimaryTabShellClass` / `laundryPrimaryTabPillClass` | แท็บหลัก / ตั้งค่า |
| `laundryDashboardSegmentShellClass` / `laundryDashboardSegmentBtnClass` | sub-tab ในเนื้อหา (compact `h-8`) |
| `laundryFilterChipClass` | ชิปสถานะกรอง |
| `laundryCompactOutlineButtonClass` | **deprecated** → `laundryOutlineButtonClass` |
| `laundryRefreshIconButtonClass` | **deprecated** → `laundryIconButtonClass` |
| `laundryPortalPrimaryBtnClass` | **deprecated** → `laundryPrimaryButtonClass` |
| `laundryPortalInsetPanelClass` | panel ย่อยในเว็บลูกค้า (flat) |
| `laundryPortalPageTitleClass` / `PageBodyClass` | หัวข้อส่วน + เส้น + เนื้อหา — ดู **`laundry-module-portal-website-template.mdc`** |
| `laundryPortalShopNameClass` | ชื่อร้าน gradient |
| `laundryStaffPlainPanelClass` | staff kiosk — ไม่มีขอบการ์ดหนัก |

**ห้าม:** สร้าง `rounded-3xl glass` ใหม่ในโมดูลอื่นโดยไม่ดูว่าซักผ้าใช้ plain panel + segment แทน

**หมายเหตุ `cn`:** โปรเจกต์นี้ **ไม่มี twMerge** — ห้ามซ้อนคลาสชนกัน (เช่น `px-4` แล้วตามด้วย `px-0` บน element เดียว) · ปุ่มไอคอนต้องประกอบจาก `laundryBtnBaseClass` **โดยไม่** สืบทอด `px` จาก outline

### การ์ดรายการ — ไอคอน + โทนสี (บังคับเมื่อมีรายการเป็นหลัก)

รายการในแผง (ออเดอร์ · สมาชิก · การเงิน · ฯลฯ) **ต้องมีสัญญาณภาพ** ไม่ปล่อยแถวขาวเรียบ:

| ชั้น | แนวทางซักผ้า / มาตรฐาน |
|------|-------------------------|
| **คิวงานตามสถานะ** | `laundryOrderCardToneClasses` ใน `laundry-order-card-tone.ts` + `LaundryOrderCard` — เส้นซ้าย · พื้น pastel · ไอคอนสถานะในแถบ (`laundry-dashboard-ui.mdc`) |
| **สถิติ overview** | `LaundryStat` — `border-l-[3px]` + **ไอคอน** คู่ป้าย + โทน slate/amber/sky/green |
| **รายการทั่วไป (โมดูลอื่น)** | คัดลอกแพทเทิร์น `lib/card-tones.ts` จากชมรม — `*TonedRowCardClass` + `*CardIconTileClass` · มีรูปใช้ `AppImageThumb` · ไม่มีรูปใช้ไอคอนโทน |

**กฎเต็ม (โทน · ไอคอน · เช็กลิสต์ · ห้าม dashed ว่าง):** **`dashboard-module-list-card-icon-tones.mdc`**

---

## 5) Layout · ขอบซ้าย–ขวา

| # | ชั้น | ซักผ้า |
|---|------|--------|
| 1 | `DashboardShell` main | `max-md:px-2 sm:px-4` |
| 2 | `DashboardPagesShell` | `WIDE_MODULE` → `max-w-none !px-0` (ยกเว้น staff) |
| 3 | `LaundryModuleChrome` หัว | padding ในหัว · **children ไม่ห่อ px ทั้งหน้า** |
| 4 | การ์ดย่อย | `laundryPanelSectionClass` / `p-3 sm:p-4` |

ดูเต็ม: `dashboard-page-width.mdc`

---

## 6) ปุ่ม · แถบหัว · แถวการ์ด

**แหล่งความจริง:** `src/systems/laundry/lib/ui-tokens.ts` · `LaundryDashboardHeaderToolbar` · `LaundryRefreshButton` · `LaundryToolbarIconButton`

### ลำดับชั้นขนาดปุ่ม (บังคับ)

| ชั้น | ความสูง | โทเค็น / คอมโพเนนต์ | ใช้เมื่อ |
|------|---------|---------------------|----------|
| **แถบหัว / CTA** | **`h-9`** | `laundryOutlineButtonClass` · `laundryPrimaryButtonClass` · `laundryIconButtonClass` | หักแพ็ก · ขายแพ็ก · แท็บแถบหัว · รีเฟรช · CTA ฟอร์ม · ช่องกรอกคู่ปุ่ม |
| **ไอคอนในแถวการ์ด** | **`h-7 w-7`** | `laundryRowIconButtonClass` → `LaundryToolbarIconButton` | พิมพ์ · ดู · แก้ไข · ลบ บนการ์ดออเดอร์/แพ็ก |
| **อัปเดตสถานะ** | **`h-7` / `sm:h-8`** | `LaundryOrderStatusIconStrip` | ชิปสถานะบนการ์ดคิว |
| **segment ในเนื้อหา** | **`h-8`** | `laundryDashboardSegmentBtnClass` | กรอง/แท็บย่อย**ในแผง** (ไม่ใช่แถบหัว) |

### แถบหัวแดชบอร์ด / พนักงาน (บังคับสูงเท่ากัน)

ลำดับ: **หักแพ็ก · ขายแพ็ก → แท็บย่อย → รีเฟรช**

1. ห่อด้วย **`laundryToolbarRowClass`**  
2. ทุกปุ่มในแถวใช้ **ชุด `h-9` เดียวกัน** — แท็บใช้ `laundryInlineSubNavBtnClass` / `laundryStaffNavTabClass` = outline/primary **ตรง ๆ**  
3. **ห้าม** ห่อแท็บด้วย shell `p-0.5` ที่ทำให้ความสูงภายนอกเพี้ยนจากปุ่มข้าง ๆ  
4. **`LaundryRefreshButton`** = `laundryIconButtonClass` (`h-9 w-9` ไอคอนล้วน) — **ห้าม** ย่อเป็น `h-8` คนละชุดกับหักแพ็ก  
5. หน้าพนักงาน: โทเค็นชุดเดียวกัน (`LaundryStaffClient`)

### ปุ่มหัวการ์ด (มือถือ)

- `AppSectionHeader` → `className="flex flex-row items-start justify-between gap-3 sm:items-center"`  
- `actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"`  
- **เพิ่มรายการ:** ไอคอน `+` มือถือ · ข้อความ `sm+` · ใช้ `laundryPrimaryButtonClass` (หรือเทียบเท่า `h-9`)  
- **กรอง:** ไอคอน funnel · `แสดงกรอง`/`ซ่อนกรอง` ที่ `sm+` · badge เมื่อกรองค้างและแผงปิด  
- **รีเฟรช:** `LaundryRefreshButton` — ไอคอนล้วน · สูงเท่าแถบหัว  

### แถว action ในการ์ด

- **พิมพ์ / ดู / แก้ไข / ลบ:** `LaundryToolbarIconButton` → **`laundryRowIconButtonClass` (`h-7`)** — **ห้าม** ใช้ `laundryIconButtonClass` (`h-9`) ในแถวการ์ด  
- **ลบ:** `variant="danger"` · `aria-label` + `title` ทุกปุ่ม  
- **สถานะออเดอร์:** `LaundryOrderStatusIconStrip` — แถบไอคอน compact  
- **พิกัดรับผ้า:** ลิงก์ **เปิด Google Maps** อยู่**ใต้ราคา** (คอลัมน์ขวา) — ตัดบรรทัด `พิกัด GPS:…` ออกจากที่อยู่ซ้าย (`order-pickup-coords.ts`)

### คู่มือ

- ปุ่ม **`?`** มุมขวาบนการ์ดหัว · `LaundryUsageGuideModal` · `AppUsageGuideModal`  
- เนื้อหาครบ: เริ่มต้น · เมนู 4 รายการ · แดชบอร์ด · การเงิน · จัดการ · ชำระ/พิมพ์ · ตั้งค่า (เว็บไซต์ vs ลิงก์) · QR hub · popup  

---

## 7) แสดง/ซ่อนกรอง (`filterOpen`)

**อ้างอิง:** `LaundryFinancePanel` · `LaundryPurchasesClient` · `LaundryPackagesClient`

1. `useState(true)` หรือ `false` ตามหน้า — รายการแนะนำเปิดเริ่มต้น  
2. ปุ่ม toggle **ทุก breakpoint** — ห้าม `sm:block` บังคับเปิด  
3. แผง: `filterOpen ? "block" : "hidden"`  
4. `aria-expanded` · `aria-controls` · `id` แผงกรอง  
5. ชิปสถานะ + ค้นหา + ล้างเมื่อค้าง  
6. จุด amber เมื่อ `filtersActive && !filterOpen`  

---

## 8) กราฟการเงิน

**ไฟล์:** `LaundryFinancePanel.tsx`

- **`AppRevenueCostColumnChart`** — รายรับ vs รายจ่ายรายวัน · `compact`  
- **`AppColumnBarSparkChart`** — รายได้ตามแพ็ก · `compact` · `variant="brand"`  
- **ห้ามผสม** compact / non-compact ในหน้าเดียว  
- วันที่ / กรอง — **`bangkokDateKey`** · `Asia/Bangkok`  
- ออเดอร์ **`CANCELLED`** ไม่นับรายได้  

---

## 9) ชำระเงิน · สลิป · QR

| ชั้น | ไฟล์ | พฤติกรรม |
|------|------|----------|
| แดชบอร์ด POS | `LaundryPaymentPanel` | เงินสด · พร้อมเพย์ · โอน · บัตร · preset ยอด |
| เว็บลูกค้า | `LaundryPublicPaymentPanel` | มัดจำ/เต็มตามตั้งค่า · QR · อัปโหลดสลิป |
| อัปโหลด | `AppImagePickCameraButtons` · `prepareImageFileForUpload` | กล้อง + แกลเลอรี |
| ดูสลิป | `AppImageThumb` + `useAppImageLightbox` | ห้าม lightbox เอง |
| PromptPay | `/api/laundry/promptpay-qr` · public route | |

**บังคับ:** มียอดชำระ + โอน/พร้อมเพย์ → ต้องมีสลิปก่อนบันทึก (validate + `useAppNoticePopup`)

---

## 10) พิมพ์ · ใบเสร็จ · ใบกำกับ

**ไฟล์:** `lib/laundry-print-docs.ts` · `LaundryOrderPrintModal` · `LaundryMemberPrintModal` · `LaundrySellPackageModal`

- ขนาดกระดาษ: `AppSlipPaperSizeSettingsField` + `useAppSlipPaperSize`  
- ขายแพ็ก: ติ๊กใบกำกับ → พิมพ์ **ใบกำกับอย่างเดียว** · ไม่ติ๊ก → **ใบเสร็จอย่างเดียว** (`module-package-sell-tax-invoice-print.mdc`)  
- พิมพ์ย้อนหลัง: โมดัลเลือก receipt / tax invoice  
- ใช้ `openPrintableHtml` / `printPrintableHtmlInHiddenIframe` จาก `app-templates`  

---

## 11) Popup · Modal · แจ้งเตือน

| ประเภท | ใช้ |
|--------|-----|
| สำเร็จ/ผิดพลาด/validate | `useAppNoticePopup()` |
| ฟอร์ม CRUD | `FormModal` |
| รายละเอียดแพ็ก เว็บ | `LaundryPortalPackageDetailModal` |
| QR โปสเตอร์ | `LaundryQrHubClient` + pattern hub popup |
| ขายแพ็ก / บันทึกออเดอร์ | `LaundrySellPackageModal` · `LaundryRecordOrderModal` |
| หักแพ็ก | `LaundryCheckInModal` + **`AppSignaturePad`** |

**ห้าม:** `<div className="bg-red-50">` แจ้ง error ด้านบนฟอร์มใน flow ใหม่ (portal/pickup ทำแล้ว)

---

## 12) เว็บลูกค้า · ขอบริการรับ-ส่ง

**กฎเต็ม (flat section · สีแบรนด์ · token):** **`laundry-module-portal-website-template.mdc`**

**ไฟล์:** `LaundryPortalPublicClient` · `LaundryPortalSection` · `LaundryPortalStatusLookup` · `LaundryPickupPublicClient` · `LaundryPortalPackageCard`

### โครงหน้า

1. `AppPublicCheckInGlassPage` (`!px-0 !pt-0`) · hero เต็มจอ · `main` `max-w-6xl space-y-12`  
2. **ทุกส่วนใน main:** `LaundryPortalSection` — **หัวข้อ → เส้นบาง → เนื้อหา** (flat ไม่ห่อการ์ดนอก)  
3. **ชื่อร้าน:** `laundryPortalShopNameClass` / `HeroClass` — gradient แบรนด์  
4. **ปุ่มหลัก:** `laundryPrimaryButtonClass` (หรือ alias `laundryPortalPrimaryBtnClass`) — ไล่สีแบรนด์ · สูง `h-9`  

### โฟลว์รับ-ส่ง

1. Hero + แถบ **compact** (`#pickup`) — ชื่อ · เบอร์ · ปุ่ม **ขอบริการรับ-ส่ง**  
2. ฟอร์มเต็ม **ซ่อนจนกด** compact CTA หรือ «ขอบริการ…» จาก modal แพ็ก  
3. `#pickup` ใน URL → scroll ถึง compact bar **ไม่** auto-expand  
4. คลิกการ์ดแพ็ก → **detail modal** ไม่ jump ตรง `#pickup`  
5. 3 ขั้นตอน embedded: ที่อยู่ → เลือกบริการ → รายการ/ติดตาม · segment pills  
6. **ติดตามสถานะ:** หัวข้ออย่างเดียว — **ห้าม** subtitle อธิบาย workflow (`customer-portal-no-description-copy.mdc`)  
7. **ติดต่อ:** flat — ไม่มีกล่อง border รอบทั้งส่วน  

---

## 13) แพ็กสมาชิก · ชื่อ · ลายเซ็น

- การ์ดเลือกแพ็ก: **ชื่อ + คำอธิบาย + เหลือครั้ง** (`module-package-name-description-ui.mdc`)  
- หักแพ็ก: **`AppSignaturePad`** ก่อนปุ่มหัก (`module-package-deduct-signature.mdc`)  
- ประวัติ: หัวข้อ `หักแพ็กเกจ · {ชื่อ}` / `ขายแพ็กเกจ · {ชื่อ}`  

---

## 14) เช็กลิสต์โมดูลใหม่ (คัดลอกจากซักผ้า)

- [ ] `laundry-module-nav.tsx` แบบ — nav keys + collapse storage + dock items  
- [ ] `*ModuleChrome` — หัว · คู่มือ `?` · ยุบหัว · dock  
- [ ] `lib/ui-tokens.ts` — panel · **ปุ่ม `h-9` แถบหัว** · **`h-7` แถวการ์ด** · tabs · segment · filter chip  
- [ ] **รายการหลักมีไอคอน + โทนสี** — `lib/card-tones.ts` หรือ `*CardToneClasses` · ดู **`dashboard-module-list-card-icon-tones.mdc`**  
- [ ] **หัวข้อเมนูมีไอคอน** — `titleIcon` บน `*PageSubNav` + ไอคอนแท็บย่อย · ดู **`dashboard-module-page-menu-icons.mdc`**  
- [ ] แถบหัว: หักแพ็ก/ขายแพ็ก/แท็บ/รีเฟรช **สูงเท่ากัน** (`laundryToolbarRowClass`)  
- [ ] หน้าแยก `/dashboard/{slug}/finance|manage|settings`  
- [ ] `DashboardPagesShell` + sidebar icon  
- [ ] Stat grid **`grid-cols-2`** มือถือ  
- [ ] กรอง **`filterOpen`** + ปุ่มแสดง/ซ่อนทุก breakpoint  
- [ ] กราฟ **`compact`** ชุดเดียว  
- [ ] ชำระเงิน + สลิป + PromptPay panel  
- [ ] พิมพ์ + ขนาดกระดาษ  
- [ ] `useAppNoticePopup` แทน inline banner  
- [ ] พอร์ทัลลูกค้า (ถ้ามี) — ดู **`laundry-module-portal-website-template.mdc`**: compact CTA · PortalSection flat · สีแบรนด์ · modal รายละเอียด  
- [ ] คู่มือ `AppUsageGuideModal` ครบเมนูจริง  
- [ ] ไม่มี `MawellLogo` ใน chrome โมดูล  

---

## 15) อ้างอิงเพิ่ม

- การ์ดสถิติ / กริดรายการ: `laundry-dashboard-ui.mdc`  
- **ไอคอน + โทนสีการ์ดรายการ:** `dashboard-module-list-card-icon-tones.mdc` (ต้นแบบคิว: `laundry-order-card-tone.ts` · ต้นแบบรายการทั่วไป: `club-event/lib/card-tones.ts`)  
- **ไอคอนหัวข้อเมนู / แท็บ:** `dashboard-module-page-menu-icons.mdc` (ต้นแบบ: `club-event/lib/page-menu-icons.tsx` · `LaundryPageSubNav`)  
- **วิดีโอ / แกลเลอรี / สไลด์:** `dashboard-module-media-gallery-slideshow.mdc` (ต้นแบบ: `ClubEventEventDetailClient` · `ClubEventSlideshow`)  
- คู่มือ modal: `laundry-usage-guide-modal.mdc`  
- Car wash คู่ขนาน: `dashboard-module-car-wash-barber-reference.mdc`


================================================================================
### .cursor/rules/laundry-module-portal-website-template.mdc
================================================================================

---
description: แม่แบบเว็บไซต์ลูกค้า (รับฝากซักผ้า) — flat section · สีแบรนด์ · compact hero · ขอบริการ · ติดตามสถานะ — อ้างอิงเมื่อออกแบบพอร์ทัลโมดูลถัดไป
globs:
  - "**/systems/laundry/components/LaundryPortal*.tsx"
  - "**/systems/laundry/components/LaundryPickupPublicClient.tsx"
  - "**/app/laundry/**"
  - "**/api/laundry/public/**"
  - "**/systems/**/components/*PortalPublicClient*.tsx"
  - "**/systems/**/components/*PortalSection*.tsx"
  - "**/systems/**/lib/ui-tokens.ts"
alwaysApply: false
---

# เว็บไซต์ลูกค้า — แม่แบบซักผ้า (Golden Example)

ใช้เมื่อทำหรือปรับ **หน้าเว็บสาธารณะของลูกค้า** ในโมดูลใหม่ — ยึด **รับฝากซักผ้า** เป็นต้นแบบเลย์เอาต์ flat · สีแบรนด์ · ส่วนหัว–เนื้อหา · ปุ่มหลัก · ชื่อร้าน

**กฎที่ต้องคู่ด้วย:**  
`module-customer-booking-website-portal.mdc` (URL · trial · glass shell · hero ทั่วไป) · `customer-portal-no-description-copy.mdc` · `app-templates-media.mdc` · `app-templates-central.mdc` · `module-thailand-timezone.mdc` · `laundry-module-dashboard-template.mdc` §12

**ก่อนออกแบบ:** อ่าน **`dashboard-module-design-check-laundry-first.mdc`** แล้วเปิดไฟล์ซักผ้าด้านล่าง

---

## 0) เมื่อไหร่ใช้แม่แบบนี้ vs กฎจองทั่วไป

| ชนิดเว็บ | แม่แบบหลัก |
|---------|------------|
| จองทรัพยากร · ห้อง · สนาม · จอดรถ · โต๊ะ | `module-customer-booking-website-portal.mdc` (โรงแรม/จอดรถ) |
| **ขอบริการ · รับ-ส่ง · หลายขั้นตอน · ติดตามสถานะ** | **กฎนี้ (ซักผ้า)** |
| QR เช็คอินสั้น | `shop-customer-qr-portal.mdc` |

โมดูลใหม่ที่มี hero + หลายส่วน + ฟอร์มยาว → คัดลอก **โครง flat section + token + component** จากซักผ้า แล้วปรับโดเมน

---

## 1) แผนที่ไฟล์ (ซักผ้า)

| บทบาท | พาธ |
|--------|-----|
| หน้าเว็บหลัก | `src/app/laundry/[ownerId]/page.tsx` → `LaundryPortalPublicClient` |
| ส่วนหัว–เนื้อหา | `LaundryPortalSection.tsx` |
| ติดตามสถานะ | `LaundryPortalStatusLookup.tsx` |
| ฟอร์มรับ-ส่ง | `LaundryPickupPublicClient.tsx` (embedded + standalone) |
| การ์ดแพ็ก | `LaundryPortalPackageCard.tsx` · `LaundryPortalPackageDetailModal.tsx` |
| โทเค็น UI | `lib/ui-tokens.ts` — คำนำหน้า `laundryPortal*` |
| API พอร์ทัล | `/api/laundry/public/portal` |
| ค้นหาสถานะเบอร์ | `/api/laundry/public/pickup-lookup` |
| สื่อตัวอย่าง | `lib/portal-media.ts` |

**โมดูลใหม่:** สร้าง `{Module}PortalSection` · `{module}Portal*` tokens · `{Module}PortalPublicClient` — **อย่า** copy-paste class Tailwind กระจายหลายไฟล์

---

## 2) โครงหน้า (บังคับ)

```
AppPublicCheckInGlassPage (!px-0 !pt-0)
├── header (absolute) — โลโก้ + ชื่อร้าน + nav เดสก์ท็อป
├── hero (เต็มความกว้าง) — แบนเนอร์ + overlay + compact CTA
└── main (max-w-6xl space-y-12)
    ├── ฟอร์มเต็ม (เมื่อ expand) — PortalSection
    ├── ติดตามสถานะ — PortalSection
    ├── แพ็กเกจ / แกลเลอรี — PortalSection
    └── ติดต่อ — PortalSection (flat ไม่มีกล่อง)
```

| ชั้น | ค่า |
|------|-----|
| ความกว้างเนื้อหา | `max-w-6xl` · `px-4 sm:px-6` |
| ระยะห่างส่วน | `space-y-12 sm:space-y-14` |
| Early return | `loading` / `loadErr` — glass แยก `!px-0 !pt-0` · ข้อความกลางจอ |
| Layout โมดูล | `app/{module}/layout.tsx` — **เต็มจอ** ห้าม `max-w-lg` ห่อทั้งโมดูล |

---

## 3) ส่วนหัว–เนื้อหา — `PortalSection` (บังคับ)

**ทุกส่วนใน `main`** ใช้ component แบบ `LaundryPortalSection`:

1. **หัวข้อ** (`h2`) — `{module}PortalPageTitleClass`
2. **เส้นบาง** — `{module}PortalSectionDividerClass` + padding บน (`PortalPageBodyClass`)
3. **เนื้อหา** — ฟอร์ม · รายการ · แกลเลอรี

```tsx
<section id={id} className="scroll-mt-16" aria-labelledby={headingId}>
  <h2 className={portalPageTitleClass}>{title}</h2>
  <div className={portalPageBodyClass}>
    {subtitle ? <p className={portalPageSubtitleClass}>{subtitle}</p> : null}
    {children}
  </div>
</section>
```

### ห้าม

- ห่อทั้งส่วนด้วยการ์ด glass / `rounded-2xl border shadow` ซ้อนนอก (ยกเว้นการ์ดรายการย่อย เช่น แพ็ก · ผลค้นหา)
- ใส่ **คำอธิบายยาว** ใต้หัวข้อเมื่อหัวข้อสื่อความหมายพอ — ดู `customer-portal-no-description-copy.mdc`  
  ตัวอย่างที่ตัดแล้ว: ~~«ค้นหาด้วยเบอร์โทรที่ใช้ส่งคำขอรับ-ส่ง»~~ → เหลือแค่ «ติดตามสถานะ»
- subtitle ใช้เฉพาะเมื่อจำเป็น (เช่น สรุปชื่อ·เบอร์ในฟอร์มขยาย)

---

## 4) Flat layout — แบ่งด้วยเส้น ไม่ซ้อนกล่อง (บังคับ)

| องค์ประกอบ | แนวทาง |
|-----------|--------|
| ส่วนใน `main` | **ไม่มี** การ์ดนอกรอบ — ใช้ `PortalSection` + เส้น `border-t border-slate-200/80` |
| แผงย่อยในฟอร์ม | `{module}PortalInsetPanelClass` — เส้นบน + `bg-slate-50/50` **ไม่มี** border รอบ |
| บล็อกฟอร์ม | `{module}PortalFlatBlockClass` = `space-y-4` |
| ติดต่อ | ข้อความ + ปุ่ม outline — **ห้าม** กล่อง dashed/border รอบทั้งส่วน |
| Hero compact | มือถือ: `border-t border-white/40` · `sm+`: การ์ดขาวบาง (`sm:border sm:bg-white/95`) |

**โทเค็นซักผ้า:** `laundryPortalSectionDividerClass` · `laundryPortalPageBodyClass` · `laundryPortalFlatBlockClass` · `laundryPortalInsetPanelClass`

---

## 5) สีแบรนด์ · ชื่อร้าน · ปุ่มหลัก (บังคับ)

### ปุ่ม CTA หลัก

- ใช้ **`appDashboardBrandGradientFillClass`** จาก `@/components/app-templates` (ไล่ `#0000BF` → violet → pink)
- ซักผ้า: **`laundryPrimaryButtonClass`** (= ความสูง **`h-9`** · `rounded-lg`) — alias เก่า `laundryPortalPrimaryBtnClass` / `laundryPaymentCtaClass`
- โมดูลใหม่: `{module}PrimaryButtonClass` ชุดเดียวกับแดชบอร์ด — **ห้าม** สร้าง CTA คนละความสูงกับปุ่มโมดูล
- ชิป/step active: gradient เดียวกับ CTA

### ชื่อร้าน

| ตำแหน่ง | โทเค็น |
|--------|--------|
| Header / ติดต่อ (พื้นอ่อน) | `{module}PortalShopNameClass` — gradient + `bg-clip-text text-transparent` |
| บน hero (พื้นมืด/รูป) | `{module}PortalShopNameHeroClass` — gradient + `drop-shadow` อ่านง่าย |

**ห้าม** ชื่อร้านเป็นสีเทา/plain เมื่อโมดูลอื่นต้องการความสม่ำเสมอกับแดชบอร์ด

---

## 6) Header · Nav (เดสก์ท็อป)

| รายการ | แนวทาง |
|--------|--------|
| โลโก้ | `h-10 w-10 rounded-full` — header absolute เท่านั้น |
| ชื่อร้าน header | truncate · `{module}PortalShopNameHeroClass` |
| Nav shell | `{module}PortalHeaderNavShellClass` — **`rounded-lg`** segment (ไม่ใช่ pill `rounded-full`) · glass บนแบนเนอร์ |
| ลิงก์ nav | anchor `#pickup` `#status` `#packages` `#gallery` `#contact` |
| มือถือ | nav ซ่อน (`hidden md:inline-flex`) — scroll ไปส่วนหรือ compact hero |

---

## 7) Hero · Compact CTA (บังคับ)

1. แบนเนอร์ **เต็มความกว้าง** · `min-h-[56vh] sm:min-h-[64vh]` · คลิกดูใหญ่ (`AppImageLightbox`)
2. Overlay: `from-[#1e1b4b]/20` + fade ล่าง → `#faf9ff`
3. บน hero: eyebrow โดเมน · **H1 ชื่อร้าน gradient** · tagline (ถ้ามี)
4. **Compact bar** (`#pickup`): ชื่อ · เบอร์ · ปุ่ม **ขอบริการ…** — submit แล้ว **expand** ฟอร์มเต็ม + scroll `#pickup-form`
5. **`#pickup` ใน URL** → scroll ถึง compact bar **เท่านั้น** — **ห้าม** auto-expand ฟอร์มเต็ม
6. คลิกการ์ดแพ็ก → **detail modal** · ปุ่มใน modal ค่อย seed แพ็ก + expand ฟอร์ม

---

## 8) ฟอร์ม embedded (หลายขั้นตอน)

**ไฟล์:** `LaundryPickupPublicClient.tsx` — `embeddedInPortal`

| รายการ | แนวทาง |
|--------|--------|
| Step nav | `{module}DashboardSegmentShellClass` + segment btn — 3 ขั้น: ที่อยู่ → บริการ → รายการ/ติดตาม |
| ไม่มีปุ่มย้อน «กลับหน้าร้าน» | อยู่ใน portal แล้ว |
| ฟิลด์ | `{module}PortalFieldClass` · `min-h-[44px]` · `rounded-xl` |
| Label | `{module}PortalLabelClass` — สั้น ไม่มี `(ไม่บังคับ)` ยาว |
| แจ้งเตือน | **`useAppNoticePopup`** — ห้าม inline banner แดง/เขียว |
| ชำระเงิน | `{Module}PublicPaymentPanel` · สลิป · QR · validate ก่อนบันทึก |

---

## 9) ติดตามสถานะ · Lookup

1. ส่วน `{Module}PortalStatusLookup` ห่อด้วย `PortalSection` — **ไม่มี subtitle อธิบาย workflow**
2. ช่องเบอร์ + ปุ่มค้นหา (primary gradient)
3. API แยก: `GET …/public/pickup-lookup?owner_id=&phone=` (+ trial `t=`)
4. ผลลัพธ์: รายการ flat — เส้นแบ่งระหว่างแถว (`PortalSectionDividerClass`) ไม่การ์ดซ้อน
5. คัดลอกลิงก์ติดตาม token ได้เมื่อมี

---

## 10) แพ็กเกจ · แกลเลอรี · ติดต่อ

| ส่วน | แนวทาง |
|------|--------|
| แพ็กเกจ | กริดการ์ดคลิกได้ → modal รายละเอียด · ชื่อ + คำอธิบาย + ราคา (`module-package-name-description-ui.mdc`) |
| แกลเลอรี | `LaundryPortalGallery` · `AppImageThumb` + lightbox ชุดรูป · กริด `2 / sm:3 / lg:4` · **คอม 2 แถวต่อหน้า** (8 รูป) แล้วแบ่งหน้า · สูงสุด 20 รูป |
| ติดต่อ | ชื่อร้าน gradient · ที่อยู่ · เวลาเปิด (**เวลาไทย**) · ปุ่ม outline โทร/LINE/Facebook/แผนที่ — **flat** |

---

## 11) โทเค็นที่ต้องมีใน `ui-tokens.ts` (โมดูลใหม่)

คัดลอกชุดจากซักผ้า แล้วเปลี่ยนคำนำหน้า:

| โทเค็น | ใช้เมื่อ |
|--------|---------|
| `{module}PortalShopNameClass` / `HeroClass` | ชื่อร้าน gradient |
| `{module}PrimaryButtonClass` (หรือ alias PortalPrimary) | CTA หลัก — สูงเท่าปุ่มแดชบอร์ด (`h-9`) |
| `{module}OutlineButtonClass` | ปุ่มขอบขาว |
| `{module}PortalPageTitleClass` | หัวข้อ section |
| `{module}PortalPageBodyClass` | เนื้อหาหลังเส้น |
| `{module}PortalSectionDividerClass` | เส้นแบ่ง |
| `{module}PortalFieldClass` / `LabelClass` | ฟอร์ม |
| `{module}PortalHeaderNavShellClass` / `NavLinkClass` | nav บน hero |
| `{module}PortalHeroCompactShellClass` | แถว compact บนแบนเนอร์ |
| `{module}PortalFlatBlockClass` / `InsetPanelClass` | ฟอร์ม flat |

---

## 12) เช็กลิสต์โมดูลใหม่ (คัดลอกจากซักผ้า)

- [ ] `{Module}PortalSection.tsx` — หัวข้อ → เส้น → เนื้อหา
- [ ] `{module}Portal*` tokens ใน `ui-tokens.ts`
- [ ] Hero เต็มจอ + compact CTA + ปุ่ม/ชื่อสีแบรนด์
- [ ] `main` flat — ไม่การ์ดนอกรอบแต่ละส่วน
- [ ] ไม่มีคำอธิบายยาวใต้หัวข้อ (`customer-portal-no-description-copy.mdc`)
- [ ] `useAppNoticePopup` ทุก flow
- [ ] `AppImageThumb` / `AppImageLightbox` สำหรับรูป
- [ ] Trial `?t=` + gate portal API
- [ ] เวลาเปิด/ปิดแสดง «เวลาไทย»
- [ ] ตั้งค่าสื่อในแดชบอร์ด (แบนเนอร์ · แกลเลอรี) — ไม่ hardcode URL ใน component

---

## 13) อ้างอิงโค้ด

- `LaundryPortalPublicClient.tsx` — hero · header · main sections
- `LaundryPortalSection.tsx` — shell ส่วน
- `LaundryPortalStatusLookup.tsx` — lookup ไม่มี subtitle
- `LaundryPickupPublicClient.tsx` — embedded steps flat
- `src/systems/laundry/lib/ui-tokens.ts` — บรรทัด `laundryPortal*`
- กฎจองทั่วไป: `module-customer-booking-website-portal.mdc`
- แดชบอร์ดโมดูล: `laundry-module-dashboard-template.mdc`


================================================================================
### .cursor/rules/laundry-usage-guide-modal.mdc
================================================================================

---
description: คู่มือการใช้งานโมดูลซักผ้าในหัวการ์ด (แนวเดียวกับคาร์แคร์)
globs:
  - "src/systems/laundry/components/LaundryUsageGuideModal.tsx"
  - "src/systems/laundry/components/LaundryModuleChrome.tsx"
---

# Laundry usage guide modal

เมื่อแก้ chrome หรือเนื้อหาคู่มือซักผ้า ให้คงแพทเทิร์นเดียวกับคาร์แคร์/สนามฟุตบอล:

1. มีปุ่ม **`?` คู่มือการใช้งาน** บริเวณหัวการ์ดโมดูล (`LaundryModuleChrome`) — ไอคอนมือถือ · label บน `sm+`
2. ใช้ **`AppUsageGuideModal`** จาก `@/components/app-templates` — กึ่งกลางจอบนมือถือ (`FormModal` + `mobileCentered`)
3. ไฟล์เนื้อหา: **`src/systems/laundry/components/LaundryUsageGuideModal.tsx`**
4. โครง modal:
   - `title`: "คู่มือการใช้งาน — ระบบรับฝากซักผ้า"
   - `subtitle`: ครอบคลุมแดชบอร์ด · การเงิน · การจัดการ · ตั้งค่า · พนักงาน · เว็บลูกค้า · QR
   - **sections ต้องสะท้อนเมนูจริง** (อัปเดตเมื่อเพิ่มแท็บ/flow):
     - ลำดับเริ่มต้นแนะนำ (ร้านใหม่)
     - เมนูหลักโมดูล (4 รายการ + dock + ยุบหัว)
     - แดชบอร์ด — ภาพรวม · ออเดอร์ · คิวออนไลน์ · SSE
     - การเงิน — กรอง · กราฟ compact · รายรับ/รายจ่าย/ประวัติ
     - การจัดการ — แพ็กเกจ · สมาชิก · ลายเซ็นหักแพ็ก · พิมพ์ขาย
     - ชำระเงิน · สลิป · พิมพ์
     - ตั้งค่าร้าน (5 แท็บ)
     - เว็บลูกค้า · **ขอบริการรับ-ส่ง** (compact bar · popup แพ็ก · 3 ขั้นตอน)
     - QR · พนักงาน · staff kiosk
     - แจ้งเตือน · popup กลางจอ
5. เนื้อหา bullet/ordered list ภาษาไทย — เน้นวิธีใช้จริง ไม่ copy ข้อความ UI ยาวจาก label
6. หาก refactor header ห้ามลบปุ่มคู่มือโดยไม่ใส่ทางเข้าเทียบเท่า
7. แม่แบบ UX โมดูล: **`laundry-module-dashboard-template.mdc`**


================================================================================
### .cursor/rules/mawell-module-promo-caption.mdc
================================================================================

---
description: ร่างแคปชันโพสโปรโมทโมดูล MAWELL ตามความสามารถจริงในโค้ด (เมื่อสั่งทำระบบอื่น)
alwaysApply: false
---

# แคปชันโพสโปรโมทโมดูล (ข้อความคัดลอกได้)

เมื่อผู้ใช้สั่งให้ **ร่างแคปชัน / โพสขาย / คำโปรโมทข้อความ** ของโมดูลแดชบอร์ดใด ๆ (เช่น «ร่างระบบ X ตามตัวอย่าง») — ใช้กฎนี้

**คู่กับภาพโปสเตอร์ Canva:** `.cursor/rules/mawell-module-promo-post-prompt.mdc`

## ค่าคงที่แบรนด์ (ห้ามเดาถ้าผู้ใช้ไม่แก้)

| รายการ | ค่า |
|--------|-----|
| แบรนด์ | `MAWELL` |
| ราคาเน้น | `วันละ 1 บาท` / `เพียง 1 บาท/วัน` |
| ลิงก์ทดลอง | `https://app.ma-well.com/try/{moduleSlug}` |
| โทร | `096-664-6914` |
| LINE | `@mawell` |

Slug จากแคตตาล็อกจริง เช่น `building-pos` · `ecommerce-store` · `club-event` · `laundry` — ตรวจใน `src/lib/modules/config.ts` / landing showcase

## บังคับก่อนเขียน

1. **อ่านความสามารถจริง** ของโมดูลในโค้ด — อย่างน้อย:
   - `*-module-nav` / เมนูหลัก
   - `lib/try-promo-content.ts` (ถ้ามี)
   - กฎ template โมดูล (`.cursor/rules/*-template.mdc`)
   - blurb ใน `landing-module-showcase-data.ts`
2. **เขียนฟีเจอร์ตามของที่มีจริง** — ห้ามแต่งฟีเจอร์ที่ระบบยังไม่มี
3. จำนวนข้อ **≥ 6 ได้** (หรือมากกว่า) ถ้าระบบมีหลายเมนู/โฟลว์ — ไม่บังคับตัดเหลือ 6
4. ถ้าผู้ใช้ส่ง **ตัวอย่างแคปชัน** (เช่น ร้านออนไลน์) — **คงโครงโทนเดียวกัน** แล้วแทนชื่อโมดูล + รายการฟังก์ชัน + ลิงก์ try

## โครงข้อความส่งผู้ใช้ (คัดลอกได้ทันที)

ส่งเป็นบล็อกเดียวใน code fence — พร้อมโพสได้เลย ไม่ต้องอธิบายยาว:

1. หัวข้อฮุคสั้น (มีอีโมจิได้ตามตัวอย่างผู้ใช้)
2. ย่อหน้าขาย 1–2 ประโยค
3. รายการตัวเลข `1. …` ชื่อฟังก์ชัน + คำอธิบายสั้น
4. บรรทัดราคา `วันละ 1 บาท`
5. ลิงก์ `https://app.ma-well.com/try/{slug}`
6. โทร + LINE
7. แฮชแท็กสั้น ๆ ที่เกี่ยวกับโดเมน + `#MAWELL` + `#วันละ1บาท`

## ห้าม

- เดาฟีเจอร์จากชื่อโมดูลอย่างเดียวโดยไม่เปิดโค้ด/กฎ
- ใส่ลิงก์ try ผิด slug
- ใส่เบอร์/ไลน์/ราคาอื่นนอกค่าคงที่ (เว้นผู้ใช้ระบุใหม่)
- ส่งแค่โครงว่างหรือรายการ bullet ที่ต้องไปเขียนต่อเอง — ต้องเป็นข้อความเต็มคัดลอกได้

## เมื่อผู้ใช้ขอแก้ทีละจุด

เก็บโครงเดิม แก้เฉพาะที่ขอ (เช่น ตัดข้อ · เปลี่ยนโทน · เปลี่ยน slug) — อย่าเขียนใหม่ทั้งก้อนจนหลุดราคา/ติดต่อ/ลิงก์ทดลอง


================================================================================
### .cursor/rules/mawell-module-promo-post-prompt.mdc
================================================================================

---
description: เขียนพรอมต์ภาพโพสโปรโมทโมดูล MAWELL (hero · ราคา · QR ทดลอง · โทร/ไลน์)
alwaysApply: false
---

# พรอมต์ภาพโพสโปรโมทโมดูล (MAWELL)

เมื่อผู้ขอให้ **เขียนพรอมต์ออกแบบภาพโพส** โมดูลแดชบอร์ด — ใช้โครงนี้เสมอ แล้วแทนชื่อโมดูล / จุดขาย / บรรยากาศภาพให้เข้าโดเมน

**แคปชันข้อความโพส (ไม่ใช่ภาพ):** `.cursor/rules/mawell-module-promo-caption.mdc`

## ค่าคงที่แบรนด์ (ห้ามเดาเองถ้าผู้ใช้ไม่แก้)

| รายการ | ค่า |
|--------|-----|
| แบรนด์ | `MAWELL` |
| ลิงก์ทดลอง (ใส่ใน QR) | `https://app.ma-well.com/try/{moduleSlug}` — slug จากแคตตาล็อกจริง |
| โทร | `096-664-6914` (เขียนในภาพได้เป็น `096-664-6914`) |
| LINE | `@mawell` |
| ราคาเน้น (ค่าเริ่มถ้าผู้ใช้พูดถึงแพ็กถูก) | `เพียง 1 บาท/วัน` / `เริ่มต้นวันละ 1 บาท!` |

ถ้าผู้ใช้ระบุลิงก์/เบอร์/ราคาใหม่ — **ทับค่าคงที่** ตามที่ผู้ใช้บอก

**โมดูลล็อกพรอมต์แล้ว (ส่งบล็อกคัดลอกจากกฎนั้นทันที — อย่าเขียนใหม่):**  
`mawell-used-car-showroom-promo-poster.mdc` → โชว์รูมรถมือสอง / `used-car-showroom`

## สเปกวภาพ

- อัตราส่วนเริ่ม: **1:1 (1080×1080)** — ถ้าขอ Stories ใช้ **9:16 (1080×1920)**
- องค์ประกอบ: **ภาพเดียวเต็มเฟรม** — ไม่คอลลาจ ไม่การ์ดหลายใบ ไม่ emoji / สติ๊กเกอร์ลอย
- สไตล์: โมเดิร์น พรีเมียม สะอาด อ่านบนมือถือชัด — ไม่ดู AI stock เกินไป
- หลีกเลี่ยงธีมม่วงล้วน / UI ม่วงทับภาพ (ยกเว้นผู้ใช้ขอโทนแบรนด์ชัด)

## ลำดับชั้นข้อความในภาพ

1. **ชื่อโมดูล** (หัวข้อใหญ่ ภาษาไทยตามชื่อสินค้า เช่น คาร์แคร์ · สนามฟุตบอล)
2. **ราคาเด่น** (ถ้ามี) — ตัวใหญ่รองจากชื่อ · เช่น `เพียง 1 บาท/วัน` — **ห้าม** ให้ราคารองแย่งจุดสนใจ
3. **บรรทัดรองสั้น** — ฟีเจอร์ 3–5 คำคั่น `·` (ไม่ใช่ย่อหน้า)
4. **CTA** — เช่น `ทดลองใช้ฟรี`
5. **แบรนด์** — `MAWELL` มุมล่างหรือจุดรอง

## บล็อกบังคับ: QR + ติดต่อ

ต้องระบุในพรอมต์ชัดเจน:

1. QR คม ดำบนขาว มี quiet zone — สแกนไป **ลิงก์ทดลองเท่านั้น** (ห้าม URL อื่น)
2. คำบรรยายใต้/ข้าง QR: `สแกนเข้าทดลองโมดูล{ชื่อโมดูล}`
3. ข้อความติดต่อ:
   - `สนใจโทร 096-664-6914`
   - `LINE @mawell`

เว้นพื้นที่ในภาพให้ QR + ติดต่ออ่านได้จริง ไม่วางทับจุดสำคัญของ hero

## สิ่งที่ต้องส่งผู้ใช้ทุกครั้ง

1. **พรอมต์หลัก** (ภาษาไทย ละเอียด)  
2. **พรอมต์สั้น** (ไทยหรืออังกฤษสั้น ๆ สำหรับโมเดลที่ชอบสั้น)  
3. **แคปชันโพส** คู่ภาพ — มีราคา (ถ้ามี) · ลิงก์ทดลอง · โทร · ไลน์

## แผนที่โดเมน → บรรยากาศภาพ + บรรทัดรอง (ตัวอย่าง)

| โมดูล | Hero ภาพ | บรรทัดรองตัวอย่าง |
|-------|----------|-------------------|
| คาร์แคร์ | ร้านล้างรถ · รถเงาสะอาด | คิวรถ · บริการ · ชำระเงิน · QR ลูกค้า |
| สนามฟุตบอล | สนามหญ้าเทียมเย็นไฟสนาม | จองคิว · เช็กอิน · การเงิน · ลิงก์ลูกค้า |
| โรงแรม/รีสอร์ท | ห้องพัก/ล็อบบี้พรีเมียม | จองห้อง · เช็กอิน · เช็กเอาท์ · พอร์ทัลลูกค้า |
| ร้านตัดผม | เก้าอี้ตัดผม · บรรยากาศร้าน | คิว · แพ็กเกจ · ชำระ · QR |
| drink-pos / building-pos | เคาน์เตอร์/เมนูเครื่องดื่มหรืออาหาร | สั่ง · คิวครัว · ชำระ · สมาชิก |
| โชว์รูมรถมือสอง | เต็นท์รถ · รถมือสองจอดขาย | สต็อก · จอง/นัด · ไฟแนนซ์ · โชว์รูมออนไลน์ |

โมดูลอื่น: สรุปฟีเจอร์หลัก 3–4 จุดจากโดเมนนั้น แล้วเขียนบรรทัดรองสั้นในรูปแบบเดียวกัน

โชว์รูมรถมือสอง: **ใช้พรอมต์ล็อกใน** `mawell-used-car-showroom-promo-poster.mdc` (A5 3:4 · พื้นหลังเต็นท์รถ · face lock)

## ห้าม

- ใส่ย่อหน้ายาว / รายการฟีเจอร์เต็มจอในภาพ
- ใส่ราคาอื่นที่แข่งกับ `1 บาท/วัน` (ถ้ามีจุดขายนี้)
- ใส่เบอร์/ไลน์/URL ที่ไม่ตรงค่าคงที่หรือที่ผู้ใช้กำหนด
- สร้าง QR ปลอมหรือลิงก์ placeholder

## เมื่อผู้ใช้ขอแก้ทีละจุด

เก็บโครงเดิม แล้วแก้เฉพาะที่ขอ (เช่น เพิ่มราคา · เปลี่ยนอัตราส่วน · เปลี่ยนลิงก์) — **อย่าเขียนพรอมต์ใหม่ทั้งก้อนโดยตัด QR/ติดต่อทิ้ง**


================================================================================
### .cursor/rules/mawell-used-car-showroom-promo-poster.mdc
================================================================================

---
description: พรอมต์โปสเตอร์ A5 โมดูลโชว์รูมรถมือสอง (คัดลอกได้ทันที · face lock · เต็นท์รถ)
alwaysApply: false
---

# โปสเตอร์โปรโมท — โชว์รูมรถมือสอง (ล็อกแล้ว)

เมื่อผู้ขอ **พรอมต์ภาพ / โปสเตอร์ / โพสโปรโมท** ของโมดูล `used-car-showroom` · โชว์รูมรถมือสอง · เต็นท์รถ · ระบบบริหารจัดการธุรกิจรถมือสอง — **ส่งบล็อกด้านล่างคัดลอกได้ทันที** อย่าเขียนใหม่ทั้งก้อนถ้าผู้ใช้ไม่ได้ขอแก้จุดใดจุดหนึ่ง

คู่กับ: `mawell-module-promo-post-prompt.mdc` · `mawell-module-promo-caption.mdc` · ฟีเจอร์จริงใน `try-promo-features.ts` (`used-car-showroom`)

## ค่าคงที่ (ห้ามเดา)

| รายการ | ค่า |
|--------|-----|
| ชื่อในภาพ | `ระบบบริหารจัดการธุรกิจรถมือสอง` |
| slug | `used-car-showroom` |
| ลิงก์ทดลอง / QR | `https://app.ma-well.com/try/used-car-showroom` |
| ราคา | `เริ่มต้นวันละ 1 บาท!` |
| โทร | `096-664-6914` |
| LINE | `@mawell` |
| แบรนด์ | `MAWELL` |
| อัตราส่วน | **A5 แนวตั้ง 3:4** (เช่น 1080×1440) |
| พื้นหลัง | **รูปเต็นท์รถมือสองมีรถขายจริง** — ห้ามพื้น UI/ไอคอนไอโซเมตริกแทน |
| พรีเซนเตอร์ | หน้าตาม **[Image 1]** รักษา likeness จริง |
| โลโก้ | มุมขวาบนจาก **[Image 2]** |

## สิ่งที่ต้องส่งทุกครั้ง (3 บล็อก code fence)

1. พรอมต์หลัก  
2. พรอมต์สั้น  
3. แคปชันโพส  

ถ้าผู้ใช้แนบรูป — เตือนสั้น ๆ ให้แนบ Image 1 (หน้า) + Image 2 (โลโก้) ตอนเจน

## เมื่อขอแก้ทีละจุด

เก็บโครงด้านล่าง แก้เฉพาะที่ขอ — **ห้าม** ตัด QR / โทร / LINE / ราคา / ชื่อระบบ

---

### พรอมต์หลัก (คัดลอก)

```
[Commercial marketing poster · Vertical A5 · aspect ratio 3:4 · 1080×1440 · ultra sharp 8k]

STYLE
Professional, clean, friendly, modern automotive commercial poster. Soft daylight, warm trustworthy tone, ample white space, crisp Thai typography, high contrast, printable quality. No clutter, no collage grid, no floating emoji stickers.

REFERENCE LOCK (CRITICAL)
- Presenter face: use EXACT face identity, skin tone, facial structure, eyes, nose, mouth, and expression from attached [Image 1]. Photorealistic face match. Do NOT beautify into a different person. Do NOT change ethnicity, age range, or facial proportions. Keep likeness as close to the real photo as possible.
- Company logo: place a small clean logo in the TOP-RIGHT corner based on attached [Image 2]. Keep logo proportions readable; do not distort.

PRESENTER
Friendly professional used-car consultant / dealer, smart-casual outfit (polo or light blazer + neat pants), confident warm smile, standing in the foreground slightly left or center-left, mid-shot to three-quarter body, looking toward camera. Hands natural (one open gesture toward headline/features is OK). Face must remain identical to [Image 1].

BACKGROUND (PHOTO-BASED)
Photorealistic Thai used-car dealership tent / outdoor car lot as the main background: white or light canopy tent, rows of used cars for sale parked neatly, banners and price tags faintly visible but not readable competing text, sunny soft daylight, shallow depth of field so cars are clear but not overpowering the text. Subtle soft glow / light tech accent only at edges — DO NOT cover the lot with isometric UI overlays or floating abstract icons. Slight dark-to-light gradient vignette behind text for legibility.

MAIN HEADLINE (TOP / CENTER)
Large prominent Thai headline with soft-bold rounded Thai typography and clean white outer outline stroke for contrast:
「ระบบบริหารจัดการธุรกิจรถมือสอง」

PRICE BADGE (HIGH VISIBILITY)
Cute bold promotional bubble/badge near headline:
「เริ่มต้นวันละ 1 บาท!」
Vibrant, clear, high contrast — secondary to the headline, not larger than it.

FEATURE HIGHLIGHTS (CENTER BODY)
3–4 neat rounded infographic cards with short Thai lines (icons OK as simple line icons, not emoji clutter):
1) สต็อก & ต้นทุนรถ · P&L รายคัน
2) จองรถ / นัดชม · มัดจำ + สลิป
3) ไฟแนนซ์ · คิดค่างวดแบบ flat
4) โชว์รูมออนไลน์ส่วนตัว · QR ลูกค้า

(Product capability context for accurate visual mood — do NOT print this full list as a wall of text:
ภาพรวมสต็อก, จัดการรถ+รูป/วิดีโอ+ต้นทุน, จองและนัดชม, เคสไฟแนนซ์/บริษัทไฟแนนซ์, คิดค่างวด flat, ลูกค้า·พนักงาน·โปรโมชัน, รายรับ–รายจ่าย+สลิป, เว็บโชว์รูม /car, ลิงก์/QR แชร์)

FOOTER / CTA
Clean contact strip at bottom with quiet space:
- โทร 096-664-6914
- LINE @mawell
- Sharp scannable QR code (black on white, quiet zone) linking to:
  https://app.ma-well.com/try/used-car-showroom
- Short label beside/under QR: 「สแกนเข้าทดลองโมดูลโชว์รูมรถมือสอง」
- Small brand wordmark 「MAWELL」 near footer

COMPOSITION
Dynamic but clean; text highly legible on mobile; leave breathing room around headline, badge, cards, QR, and phone/LINE. No overcrowding. No fake unreadable UI screens covering the cars.
```

### พรอมต์สั้น (คัดลอก)

```
A5 vertical 3:4 poster. Photorealistic Thai used-car tent lot background with used cars for sale. Friendly presenter with EXACT face from [Image 1], smart-casual dealer look. Small logo top-right from [Image 2]. Big Thai headline: ระบบบริหารจัดการธุรกิจรถมือสอง. Badge: เริ่มต้นวันละ 1 บาท! Four feature cards: สต็อก/ต้นทุน·P&L, จอง/นัดชม, ไฟแนนซ์·ค่างวด flat, โชว์รูมออนไลน์. Footer: 096-664-6914, LINE @mawell, scannable QR to https://app.ma-well.com/try/used-car-showroom. Clean commercial, high contrast Thai type, ample space.
```

### แคปชันโพส (คัดลอก)

```
🚗 ระบบบริหารจัดการธุรกิจรถมือสอง — ครบจบในระบบเดียว

สำหรับเต็นท์รถ / โชว์รูม ที่อยากคุมสต็อก จอง ไฟแนนซ์ และการเงิน ให้จบในที่เดียว พร้อมเว็บโชว์รูมให้ลูกค้าดูรถออนไลน์ได้

1. ภาพรวมสต็อก — ว่าง · จอง · ขาย · กำไร เห็นชัด
2. จัดการรถ — รูป วิดีโอ ต้นทุนต่อคัน
3. P&L รายคัน — รู้ต้นทุน–กำไรทีละคัน
4. จองรถออนไลน์ — มัดจำ + อัปโหลดสลิป
5. นัดชมรถ — ลูกค้านัดเข้ามาดูได้
6. ไฟแนนซ์ — บริษัทไฟแนนซ์ + เคสรออนุมัติ
7. คิดค่างวดแบบ flat — คำนวณง่าย เทียบราคาหน้าเต็นท์
8. ลูกค้า · พนักงาน · โปรโมชัน — จัดการครบ
9. การเงินโชว์รูม — รายรับ–รายจ่าย พร้อมสลิป
10. เว็บโชว์รูมออนไลน์ — แคตตาล็อกรถสาธารณะ + ลิงก์/QR แชร์ได้ทันที

วันละ 1 บาท
ทดลองใช้: https://app.ma-well.com/try/used-car-showroom
สนใจโทร 096-664-6914
LINE @mawell

#โชว์รูมรถมือสอง #เต็นท์รถ #ระบบรถมือสอง #MAWELL #วันละ1บาท
```


================================================================================
### .cursor/rules/module-booking-staff-schedule-template.mdc
================================================================================

---
description: แม่แบบจองบริการ + ตารางพนักงาน (ร้านตัดผมเป็นต้นแบบ) — แพ็ก/บริการก่อนสล็อต · แดชบอร์ด=พอร์ทัล · ห้ามจองอดีต · วันที่รับบริการ+ชั่วโมง · ผูก availability
alwaysApply: false
globs:
  - "**/systems/barber/**"
  - "**/app/**/dashboard/barber/**"
  - "**/app/barber/**"
  - "**/app/api/barber/**"
  - "**/systems/**/*Booking*.tsx"
  - "**/systems/**/*Portal*.tsx"
  - "**/systems/**/*Stylist*.tsx"
  - "**/systems/**/*Therapist*.tsx"
  - "**/systems/**/lib/*schedule*.ts"
  - "**/systems/**/lib/*booking-slot*.ts"
  - "**/app/api/**/bookings/**"
  - "**/app/api/**/public/portal/**"
  - "**/lib/trial/seed-barber.ts"
---

# จองบริการ + ตารางพนักงาน — แม่แบบจากร้านตัดผม

ใช้เมื่อโมดูลมี **จองคิว/สล็อต** + **เลือกพนักงาน/ช่าง/เทอราปิสต์** + **ลิงก์ลูกค้าสาธารณะ** — ยึด **ร้านตัดผม** เป็นต้นแบบลอจิก (UX แดชบอร์ดยังอิงคาร์แคร์)

**Canonical:** `src/systems/barber/` · API `src/app/api/barber/` · พอร์ทัล `/barber/[ownerId]?t=`

**คู่กับ:** `module-thailand-timezone.mdc` · `module-customer-booking-website-portal.mdc` / `shop-customer-qr-portal.mdc` · `barber-module-dashboard-template.mdc` · `agent-finish-checkpoint.mdc` · `app-templates-central.mdc` (`AppTime24Input`)

---

## 0) หลักคิด (บังคับเมื่อย้ายไปโมดูลอื่น)

1. **เลือกบริการ/แพ็กก่อน → ค่อยเลือกเวลา** — ระยะเวลากำหนดจำนวนสล็อต  
2. **แดชบอร์ด «เพิ่มคิว» = พอร์ทัลลูกค้า** — กฎเดียวกัน · API คู่ขนาน · ห้ามพอร์ทัลเข้มกว่าแดชบอร์ดหรือกลับกัน  
3. **ห้ามจองเวลาที่ผ่านไปแล้ว** — เทียบ `Asia/Bangkok` ทั้ง availability และ POST จอง  
4. **ตารางพนักงาน = วันที่รับบริการ + ช่วงชั่วโมง** — ห้ามเก็บเป็น «วันหยุด» เป็นหลัก (สากลกว่า = เลือกวันทำงาน)  
5. **availability + book ต้องอ่านตารางพนักงานจริง** — ห้ามกรองแค่เปิด–ปิดร้าน  
6. เวลาในฟอร์ม = **`AppTime24Input`** — ห้าม `<input type="time">` AM/PM  

---

## 1) แพ็ก / บริการ

| ชนิด | ความหมาย | ผลต่อจอง |
|------|----------|----------|
| รายครั้ง (`totalSessions = 1`) | เมนูบริการวันนั้น | เลือกก่อนโชว์สล็อต · ส่ง `packageId` |
| หลายครั้ง | สมาชิก/แพ็กสิทธิ์ | ใช้แทนรายครั้งได้หลังค้นหาเบอร์ |

- มี `durationMinutes` ต่อแพ็ก — คำนวณ `slotsNeeded` จาก `slotMinutes` ของร้าน  
- พอร์ทัลแยก UI เมนูรายครั้ง vs แพ็กหลายครั้ง  
- กริดการ์ดเมนูหนาแน่น (บาร์เบอร์: สูงสุด `lg:grid-cols-6`)  

**อ้างอิง:** `BarberBookingPortalClient` · `ensureBarberSingleVisitPackages` / seed ใน `seed-barber.ts` · `portal-media.ts`

---

## 2) พอริตีแดชบอร์ด ↔ พอร์ทัล

โฟลว์เดียวกันทั้งสองฝั่ง:

`วันที่ → พนักงาน (ถ้ามี) → บริการ/แพ็ก → เบอร์/สมาชิก → สล็อตติดกัน → ยืนยัน`

| ฝั่ง | Availability | Book |
|------|--------------|------|
| พอร์ทัล | `GET …/public/portal/availability` | `POST …/public/portal/book` |
| แดชบอร์ด | `GET …/bookings/availability` | `POST …/bookings` |

ตรวจซ้ำทั้งคู่: ชั่วโมงร้าน · สล็อตอดีต · ตารางพนักงาน · conflict คิวเดิม · `packageId` + ระยะเวลา  

**อ้างอิง UI:** `BarberBookingsClient` (โมดัลเพิ่มคิว) · `BarberBookingPortalClient`

---

## 3) ห้ามจองอดีต (Bangkok)

ใส่ helper ใน `lib/*booking-slots*` ของโมดูล:

- `*SlotStartIsPastBangkok(dateKey, startHm, now?)`  
- ใช้ตอนสร้างกริดสล็อต + ตอน validate ทุกสล็อตในรันจอง  

```ts
// ❌ BAD
new Date(`${date}T${hm}:00`).getTime() < Date.now()

// ✅ GOOD — เทียบนาฬิกาไทย
barberSlotStartIsPastBangkok(dateKey, startHm)
```

**อ้างอิง:** `src/systems/barber/lib/booking-slots.ts`

---

## 4) ตารางพนักงาน / ช่าง

### สคีมา (ต่อคน)

| ฟิลด์ | ความหมาย | ค่าเริ่ม |
|-------|----------|----------|
| `workStartTime` | เริ่มรับคิว `HH:mm` ไทย | `09:00` |
| `workEndTime` | เลิกรับคิว `HH:mm` ไทย (สล็อตต้องจบ ≤ นี้) | `20:00` |
| `workWeekdaysJson` | JSON `[0..6]` วันที่**รับบริการ** (0=อา … 6=ส Bangkok) | `[0,1,2,3,4,5,6]` |

**ห้าม** ใช้ `offWeekdays` เป็นโมเดลหลักของ UI/API ใหม่ — ถ้ามีของเก่า ให้ migrate เป็น `workWeekdays` (วันรับ = ทุกวัน − วันหยุดเดิม)

### Helper (`lib/*-schedule.ts`)

- `*Map*Schedule` · `*NormalizeWorkWeekdays` · `*WorksOnDate` / `*IsOffOnDate`  
- `*SlotWithinWorkHours` · `*AllowsSlot({ schedule, dateKey, startHm, slotMinutes })`  
- `*FormatWorkWeekdaysLabel` → `รับบริการทุกวัน` / `รับบริการ จ·อ·พ…` / `ไม่รับบริการ`  

**อ้างอิง:** `src/systems/barber/lib/stylist-schedule.ts`

### API พนักงาน

- GET/POST/PATCH ส่ง–รับ `workStartTime` · `workEndTime` · `workWeekdays` (array)  
- POST/PATCH: อย่างน้อย 1 วันรับบริการ · `workEnd > workStart`  

### UI เมนูพนักงาน

- ฟอร์มเพิ่ม/แก้: `AppTime24Input` คู่ + ชิปวันรับบริการ (`aria-pressed`)  
- ชิป**เปิด** = รับวันนั้น (โทน primary) · ปิด = ไม่รับ (โทนจาง)  
- แถวรายการโชว์ `รับคิว HH:mm–HH:mm · รับบริการ …`  

**อ้างอิง:** `BarberStylistsClient.tsx` · `/api/barber/stylists`

---

## 5) ผูกตารางเข้าจอง (บังคับ)

เมื่อมี `stylistId` / พนักงานที่เลือก:

1. **Availability** — ถ้าไม่รับวันนี้ → สล็อตว่างเปล่า + ธง `stylistDayOff` (หรือชื่อเทียบ) + ส่ง `stylistSchedule` สรุป  
2. กรองแต่ละสล็อตด้วย `*AllowsSlot` (วัน + ชั่วโมงพนักงาน) แล้วค่อย past / conflict  
3. **Book** — ปฏิเสธถ้าไม่รับวันนี้ หรือสล็อตใดในรันอยู่นอกชั่วโมงพนักงาน  
4. UI จอง: ใต้ปุ่มเลือกพนักงานโชว์ช่วงเวลา + ป้ายวันรับบริการ · วันไม่รับ → ข้อความ amber ชัด  

ข้อความแนะนำ: «ไม่รับบริการวันนี้ — เลือกวันอื่นหรือคนอื่น» (ไม่ใช้คำว่า «วันหยุด» เป็นหลัก)

---

## 6) พอร์ทัล / สื่อ / เดโม่

- รูปตัวอย่างพอร์ทัล: URL ที่โหลดได้จริง (Unsplash โฮสต์ที่อนุญาต) — ตรวจลิงก์เสีย  
- โลโก้บนพอร์ทัล: ไม่ใส่กรอบ/ring ของ thumb ถ้าไม่จำเป็น  
- Seed trial ใส่ตารางพนักงานตัวอย่าง (คนละช่วงวัน/ชั่วโมงได้)  

**อ้างอิง:** `portal-media.ts` · `seed-barber.ts` · `scripts/fill-barber-portal-demo.ts`

---

## 7) Checklist ย้ายไปโมดูลอื่น

- [ ] แพ็ก/บริการมี `durationMinutes` · จองบังคับเลือกก่อนสล็อต  
- [ ] Availability + Book คู่ (พอร์ทัล + แดชบอร์ด) กฎชุดเดียว  
- [ ] Past slot ใช้ helper Bangkok  
- [ ] โมเดลพนักงาน: `workStart` / `workEnd` / `workWeekdaysJson`  
- [ ] UI = วันที่รับบริการ (ไม่ใช่เลือกวันหยุด) + `AppTime24Input`  
- [ ] Availability/Book อ่านตารางพนักงาน  
- [ ] Migration + **`npx prisma generate`** (+ รีสตาร์ท `next dev` ถ้า EPERM บน Windows)  
- [ ] Seed มีตารางตัวอย่าง  

---

## 8) แผนที่ไฟล์ (บาร์เบอร์)

| บทบาท | พาธ |
|--------|-----|
| สล็อต / อดีต | `systems/barber/lib/booking-slots.ts` |
| ตารางช่าง | `systems/barber/lib/stylist-schedule.ts` |
| พอร์ทัลจอง | `systems/barber/components/BarberBookingPortalClient.tsx` |
| แดชบอร์ดจอง | `systems/barber/components/BarberBookingsClient.tsx` |
| เมนูช่าง | `systems/barber/components/BarberStylistsClient.tsx` |
| Avail สาธารณะ | `app/api/barber/public/portal/availability/route.ts` |
| Book สาธารณะ | `app/api/barber/public/portal/book/route.ts` |
| Avail แดชบอร์ด | `app/api/barber/bookings/availability/route.ts` |
| Book แดชบอร์ด | `app/api/barber/bookings/route.ts` |
| CRUD ช่าง | `app/api/barber/stylists/route.ts` · `[id]/route.ts` |
| Info พอร์ทัล | `app/api/barber/public/portal/info/route.ts` |
| Schema | `BarberStylist` ใน `prisma/schema.prisma` |

โมดูลใกล้เคียง (นวด ฯลฯ): คัดลอกชั้น lib + API คู่ · เปลี่ยนชื่อโมเดล/พาธ — **คงลำดับโฟลว์และกฎ Bangkok ตามกฎนี้**


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
### .cursor/rules/module-customer-booking-website-portal.mdc
================================================================================

---
description: Template เว็บไซต์จองลูกค้าสาธารณะ (ทุกโมดูล) — แบนเนอร์เต็มจอ · ค้นหา/เลือกทรัพยากร · มัดจำ/เต็ม · สลิป+QR · รีวิว · lookup · รายละเอียดหลังจองแบบโรงแรม
alwaysApply: false
globs:
  - "**/systems/hotel-resort/components/HotelResortPortal*.tsx"
  - "**/systems/hotel-resort/components/HotelResortGuestPortal*"
  - "**/systems/hotel-resort/components/HotelResortPortalMedia*"
  - "**/systems/hotel-resort/components/HotelResortReviews*"
  - "**/systems/hotel-resort/HotelResortBookingsClient.tsx"
  - "**/systems/hotel-resort/lib/portal-*.ts"
  - "**/app/hotel-resort/**"
  - "**/api/hotel-resort/public/portal/**"
  - "**/lib/hotel-resort/public-url.ts"
  - "**/lib/hotel-resort/portal-access.ts"
  - "**/systems/football-turf/FootballTurfBookingPortalClient.tsx"
  - "**/systems/football-turf/FootballTurfPortalBookingClient.tsx"
  - "**/app/football-turf/book/**"
  - "**/api/football-turf/public/**"
  - "**/lib/football-turf/public-url.ts"
  - "**/lib/football-turf/portal-access.ts"
  - "**/systems/building-pos/components/BuildingPosPortal*.tsx"
  - "**/systems/building-pos/components/BuildingPosPortalMedia*"
  - "**/systems/building-pos/components/BuildingPosBookingPayment*"
  - "**/app/building-pos/[ownerId]/**"
  - "**/api/building-pos/public/portal/**"
  - "**/lib/building-pos/public-url.ts"
  - "**/lib/building-pos/portal-*.ts"
  - "**/lib/building-pos/portal-booking.ts"
  - "**/systems/drink-pos/components/DrinkPosPortal*.tsx"
  - "**/systems/drink-pos/components/DrinkPosPortalMedia*"
  - "**/systems/drink-pos/components/DrinkPosBookingPayment*"
  - "**/app/drink-pos/[ownerId]/**"
  - "**/api/drink-pos/public/portal/**"
  - "**/lib/drink-pos/public-url.ts"
  - "**/lib/drink-pos/portal-*.ts"
  - "**/lib/drink-pos/portal-booking.ts"
  - "**/systems/parking/components/ParkingPortal*.tsx"
  - "**/systems/parking/components/ParkingReviews*"
  - "**/systems/parking/lib/portal-*.ts"
  - "**/systems/parking/parking-ui-tokens.ts"
  - "**/app/parking/[ownerId]/**"
  - "**/app/parking/layout.tsx"
  - "**/api/parking/public/portal/**"
  - "**/lib/parking/public-url.ts"
  - "**/lib/parking/portal-access.ts"
---

# Template — เว็บไซต์จองลูกค้าสาธารณะ (ทุกโมดูล)

**ใช้กฎนี้เป็นต้นแบบเมื่อทำ/แก้ลิงก์ลูกค้าแบบ “หน้าเว็บร้าน”** (แบนเนอร์ · แกลเลอรี · ค้นหา/เลือกทรัพยากร · จอง · ชำระ · รีวิว · รายละเอียดหลังจอง)

Canonical UI รายละเอียดหลังจอง: **โรงแรม** `HotelResortPortalBookingClient`  
Canonical เลย์เอาต์เว็บ + hero: **โรงแรม** `HotelResortPortalClient` · คู่ขนานครบ: **จอดรถ** `ParkingPortalClient` · **ร้านอาหาร** `BuildingPosPortalClient`

| ชนิด | กฎ | เมื่อไหร่ |
|------|-----|----------|
| **เว็บไซต์จอง (กฎนี้ = template)** | `module-customer-booking-website-portal.mdc` | โรงแรม · จอดรถ · สนาม · ที่พัก · จองโต๊ะ · โดเมนที่ต้อง “หน้าเว็บ” |
| **ขอบริการ · รับ-ส่ง · ติดตามสถานะ** | **`laundry-module-portal-website-template.mdc`** (ซักผ้า — flat section · สีแบรนด์) |
| เว็บร้าน + สั่งเลย (ไม่มีจอง) | กฎนี้ + `pos-customer-order-link-ux.mdc` | ร้านเครื่องดื่ม |
| พอร์ทัล QR กะทัดรัด | `shop-customer-qr-portal.mdc` | คาร์แคร์ · บาร์เบอร์ · เช็คอินสั้น |
| จองสล็อต + พนักงาน | `module-booking-staff-schedule-template.mdc` | บาร์เบอร์ · นวด |
| Staff token | `module-staff-token-link-portal.mdc` | คนละลิงก์ลูกค้า |
| Hub QR แดชบอร์ด | `shop-qr-hub-popup-pattern.mdc` | การ์ดคู่ลูกค้า/พนักงาน |
| คัดลอกสั้น | `customer-portal-no-description-copy.mdc` | ทุกหน้าสาธารณะลูกค้า |

---

## 0) หลักการ template (คัดลอกไปโมดูลใหม่)

1. **โครงเดียวกัน** — URL · glass shell · hero เต็มจอ · แถบค้นหากะทัดรัด · ส่วน `#gallery` `#reviews` `#contact` · lookup เบอร์ · หลังจอง → หน้ารายละเอียดแบบโรงแรม  
2. **โดเมนต่างกันแค่ทรัพยากร** — ห้อง / ช่องจอด / สนาม / โต๊ะ / เมนู — โฟลว์เลือก → กรอก → ชำระเหมือนกัน  
3. **Helpers แยกโฟลเดอร์โมดูล** — `src/lib/{module}/public-url.ts` · `portal-access.ts` · `systems/{module}/lib/portal-*.ts` · โทเค็น UI ใน `*-ui-tokens.ts`  
4. **เวลาไทย** — `bangkokDateKey` / `Asia/Bangkok` ทุกวันจอง · ช่วงวันแบบ exclusive end (เช็คเอาต์/วันสิ้นสุดไม่นับในจำนวนวัน) ตามโรงแรม/จอดรถ  
5. **ห้าม** ใช้พอร์ทัล QR `max-w-md` + ไอคอน hero แทนเว็บนี้เมื่อโดเมนต้องการแบนเนอร์/หลายส่วน

---

## 1) โครง URL (บังคับ)

| บทบาท | พาธ | หมายเหตุ |
|--------|------|----------|
| หน้าเว็บหลัก | `/{module}/[ownerId]?t=` | marketing + ค้นหา + จอง + lookup |
| รายละเอียดหลังจอง | `/{module}/[ownerId]/booking/[bookingId]?phone=&t=` | พิสูจน์เบอร์ · alias `p=` ได้ · **บังคับหลัง `POST …/book`** |
| พนักงาน (แยก) | `/{module}/staff/[ownerId]?t=&k=` | ไม่ปนลิงก์ลูกค้า |
| เช็คอิน QR กะทัดรัด (ถ้ามี) | `/{module}/checkin/[token]` | คนละหน้า — ห่อ `max-w-lg` ของตัวเองได้ |

**Layout โมดูลสาธารณะ:** `app/{module}/layout.tsx` ต้อง **เต็มจอ** (`min-h-[100dvh] w-full`) — **ห้าม** ห่อทั้งโมดูลด้วย `max-w-lg` (จะทำให้แบนเนอร์มี gutter ข้าง)

**ตัวสร้าง URL:** คัดลอกจาก `src/lib/hotel-resort/public-url.ts` / `src/lib/parking/public-url.ts`

- `{module}PublicPortalUrl(base, ownerId, trialSessionId)` — ใส่ `?t=` **เฉพาะเมื่อ trial ≠ `"prod"`**
- `{module}PublicBookingUrl(base, ownerId, bookingId, phone, trialSessionId)`

หลังจองสำเร็จ: `router.push(…PublicBookingUrl(…))` — **ห้าม** แค่ toast แล้วค้างหน้าเดิม

---

## 2) Trial / ขอบเขต / เปิดพอร์ทัล

1. `ownerId` สั้นหรือปิดพอร์ทัล → `notFound()`  
2. Trial: `?t=` / body `trialSessionId` — ว่าง → `"prod"` (`TRIAL_PROD_SCOPE`)  
3. ข้อมูลผูก `(ownerUserId, trialSessionId)`  
4. `is{Module}PortalOpenForOwner` บน **ทุก** public API — คัดลอก `lib/hotel-resort/portal-access.ts` / `lib/parking/portal-access.ts`  
5. **ห้าม** เปิดจองสาธารณะโดยไม่ gate แพ็ก/โมดูล

---

## 3) เปลือก UI (บังคับ)

1. **`AppPublicCheckInGlassPage`** จาก `@/components/app-templates`  
2. โทน **glass ขาว–ม่วงอ่อน** — ห้าม dark theme  
3. โทเค็น: `appPublicCheckInGlassPageClass` · `appPublicCheckInGlassCardClass`  
4. สี: หัว `#1e1b4b` · รอง `#66638c` · แบรนด์ `#4d47b6` / `#5b61ff`  
5. โทเค็นโมดูล: `{module}PortalContentCardClass` · `FieldClass` · `SectionTitleClass` · กริดทรัพยากร (เช่น `parkingPortalSpotGridClass`)

### เลย์เอาต์เว็บ (บังคับ)

| ส่วน | แนวทาง |
|------|--------|
| ความกว้างเนื้อหา | `max-w-6xl` (กว้างกว่า QR portal) |
| Early return | `busy` / `loadErr` คืน glass แยก (`!px-0 !pt-0`) |
| โลโก้ | **เฉพาะ** header absolute · `h-10 w-10 rounded-full` + ชื่อขาว — **ห้าม** โลโก้ใหญ่ข้าง H1 ใน hero |
| Nav เดสก์ท็อป | glass pill · `hidden md:flex` — จอง · ทรัพยากร · แกลเลอรี · รีวิว · ติดต่อ |
| Hero แบนเนอร์ | **เต็มความกว้าง** · `!px-0 !pt-0` · `min-h-[72vh]` / `sm:min-h-[80vh]` · `object-cover` — ห้ามแบนเนอร์สูงแคบในกล่องมี padding |
| Overlay | `from-[#1e1b4b]/25 via-…/5 to-[#faf9ff]/90` + fade ล่าง |
| บน hero | eyebrow + `h1` + tagline + ดาวรีวิว — **ไม่มี** โลโก้ข้างหัวข้อ |
| แถบค้นหาบน hero | **กะทัดรัด** · `sm:items-end` · ช่องสูงเท่าปุ่ม (`h-11`) — ห้ามฟอร์มยาวทับแบนเนอร์ |
| `main` | `max-w-6xl space-y-12` — ผลค้นหา · แกลเลอรี · รีวิว · ติดต่อ · lookup |
| หน้ารายละเอียดจอง | `max-w-md` compact (แบบโรงแรม) |

### กริดทรัพยากร / สินค้า

| โดเมน | มือถือ | คอม | ตัวอย่างโทเค็น |
|--------|--------|-----|----------------|
| เมนูร้านอาหาร | **3** | **6** | `buildingPosPortalMenuGridClass` |
| ช่องจอด | **2** | **8** | `parkingPortalSpotGridClass` |
| ห้องพัก / การ์ดใหญ่ | 1–2 | 3–4 | ตามโรงแรม |
| แกลเลอรี | 3 (หรือ 2) | 6 (หรือ 4) | สูงสุด ~8 |

การ์ดทรัพยากรกะทัดรัด: รหัส/ชื่อ · ราคา · ปุ่มเลือก — อย่าการ์ดสูงเกินจำเป็นบนมือถือ

---

## 4) โฟลว์จองตามโดเมน

| โดเมน | ขั้นบนเว็บ |
|--------|------------|
| **โรงแรม** | วันเข้า–ออกบน hero → การ์ดห้องว่าง → จอง/ชำระ |
| **จอดรถ** | วันเริ่ม–สิ้นสุด + ลาน → กริดช่องว่าง → รายละเอียดผู้จอง/ทะเบียน → ชำระ (ถ้ามียอด) |
| **ร้านอาหาร** | 1 เมื่อไหร่ → 2 ผู้จอง → 3 เมนู (พรีออเดอร์) → 4 ยืนยัน/ชำระ · ขั้น 3 **ซ่อน** `#menu` ปกติ |
| **สนาม / สล็อต** | วัน + สนาม/สล็อต → จอง (ดู football-turf portal) |
| **เครื่องดื่ม** | ไม่มีจองที่นั่ง — สั่งเลยในพอร์ทัล |

ค่าเริ่มวันที่: วันนี้→พรุ่งนี้ (หรือเทียบเท่า) + auto-load ช่วงว่างเมื่อโหลดหน้า  
ช่วงวัน: **exclusive end** (เช่น 30→31 = 1 วัน) — helper ใน `portal-booking.ts` ของโมดูล

---

## 5) หน้ารายละเอียดหลังจอง — บังคับเท่าโรงแรม

อ้างอิง: `HotelResortPortalBookingClient` · `ParkingPortalBookingClient`

หลัง `POST …/book` ต้อง `router.push` มาหน้านี้ และแสดงอย่างน้อย:

| บล็อก | เนื้อหา |
|-------|---------|
| หัว | โลโก้วงกลม (ถ้ามี) · ชื่อร้าน · **pill สถานะจอง** |
| แถวรายละเอียด | ผู้จอง · เบอร์ · ทรัพยากร (ห้อง/ช่อง/…) · วันเริ่ม · วันสิ้นสุด · (จำนวนวันถ้าเกี่ยว) |
| การเงิน | **ยอดจอง** · **ชำระแล้ว + paymentStatusLabel** · ช่องทาง (ถ้ามี) · **คงเหลือ** ถ้ายังไม่ครบ |
| สลิป | แยก **มัดจำ/ชำระตอนจอง** (`depositSlipUrl`) กับ **สลิปชำระเพิ่ม** (`paymentSlipUrl`) · `AppImageThumb` + lightbox · ข้อความ «กดรูปเพื่อดูขนาดใหญ่» |
| ติดต่อ | โทร · LINE · ที่อยู่ |
| CTA | ปุ่มใหญ่ **กลับหน้าหลัก** |

API `GET …/booking` (หรือเทียบเท่า): gate พอร์ทัล + ตรวจเบอร์ · คืน `property` + `booking` พร้อม `statusLabel` · `paymentStatusLabel` · `paymentMethodLabel` · สลิปทั้งสอง

**สลิปตอนจองผ่านพอร์ทัล:** บันทึกที่ **`depositSlipUrl`** (เหมือนโรงแรม) — แม้โหมด `FULL` — เพื่อให้ป้ายบนหน้ารายละเอียดเป็น «สลิปมัดจำ / ชำระตอนจอง»

---

## 6) สื่อ / สลิป / กล้อง / พร้อมเพย์

- รูปย่อ + lightbox → `AppImageThumb` · `AppImageLightbox` · `useAppImageLightbox`  
- **ถ่ายสลิป:** `useAppCameraCapture()` + `cameraModal` + `AppGalleryCameraFileInputs` — **ห้าม** ผูกปุ่มถ่ายกับ `input.capture` อย่างเดียว  
- ย่อก่อนอัปโหลด: `prepareImageFileForUpload`  
- **พร้อมเพย์:** เมื่อ `PROMPTPAY` ต้องโชว์ **รูป QR** จาก `POST …/promptpay-qr` — ห้ามเหลือแค่เบอร์  
- โอน: ธนาคาร / เลขบัญชี / ชื่อบัญชี  
- ข้อความแนบสลิป (1 บรรทัด · validate ใช้ข้อความเดียวกัน):  
  - มัดจำ: `กรุณาอัปโหลดสลิป เพื่อเป็นหลักฐานการมัดจำการจอง`  
  - เต็ม: `กรุณาอัปโหลดสลิป เพื่อเป็นหลักฐานการชำระเงินจอง`  
- คัดลอกอื่นบนหน้า: สั้น — `customer-portal-no-description-copy.mdc`

---

## 7) โหมดชำระพอร์ทัล

เก็บบน profile: `portalBookingPaymentMode` · `depositAmountBaht` / `depositPercent`

| โหมด | ความหมาย | สลิป |
|------|----------|------|
| `NONE` | จองอย่างเดียว | ไม่บังคับ |
| `DEPOSIT` | มัดจำคงที่หรือ % | บังคับเมื่อ `payDue > 0` → มัก `PARTIAL` |
| `FULL` | เก็บเต็ม | บังคับเมื่อมียอด |

Normalize ค่าไม่รู้จัก → `NONE`  
แดชบอร์ดเจ้าของชำระด้วย `CASH` \| `PROMPTPAY` \| `TRANSFER` — **คนละพื้นผิว** กับพอร์ทัล

บนรายการจองแดชบอร์ด: โชวยอดชำระแล้ว/ค้าง + สลิปกด lightbox ได้เมื่อมี

---

## 8) รีวิว (แนะนำครบชุด)

- โมเดล `*Review` · `isPublished` · scope owner+trial · รูปได้ (จำกัดจำนวน)  
- Public: `GET/POST …/reviews` · ฝังใน `GET …/info` (avg + count + รายการเผยแพร่)  
- Hero: ดาว/คะแนนเมื่อมีรีวิว  
- ส่วน `#reviews`: รายการ + ฟอร์มส่ง (ถ้าอนุญาต)  
- Owner: แผงคิวเรต/เผยแพร่ในแท็บตั้งค่าเว็ปลิงค์ลูกค้า  
- อ้างอิง: drink-pos / parking reviews + `ParkingReviewsSettings`

---

## 9) API สาธารณะ (แพทเทิร์นคัดลอก)

Prefix: `/api/{module}/public/portal/…` — ทุกเส้นทาง gate + trial

| Method | Path | หน้าที่ |
|--------|------|---------|
| GET | `…/info` | โปรไฟล์ · สื่อ · โหมดชำระ · โอน/พร้อมเพย์ · รีวิว · เมนู/ลาน (ตามโดเมน) |
| GET | `…/rooms` / `…/spots` / … | รายการว่าง + ราคา/`payDueBaht` |
| POST | `…/book` | สร้างจอง · บังคับสลิปถ้ามียอด · คืน id + phone → redirect |
| GET | `…/booking` (+ lookup) | รายละเอียดด้วยเบอร์ |
| POST | `…/upload-slip` | อัปโหลดสาธารณะ (rate limit + plan gate) |
| POST | `…/promptpay-qr` | QR + ข้อมูลโอน |
| GET/POST | `…/reviews` | เผยแพร่ / ส่งรีวิว |

แนะนำ: rate limit ต่อ IP · `assertOwnerPlanUpload` → 402

---

## 10) Schema / โปรไฟล์ที่ควรมี

| กลุ่ม | ฟิลด์ตัวอย่าง |
|-------|----------------|
| สื่อ | `portalBannerUrl` · `portalGalleryJson` · `logoUrl` |
| ติดต่อ | `address` · `contactPhone` · `lineId` · `facebookUrl` · `mapUrl` |
| เวลา | เปิด–ปิด หรือ `checkInTime` / `checkOutTime` |
| ชำระพอร์ทัล | `portalBookingPaymentMode` · มัดจำจำนวน/% |
| โอน | `promptPayPhone` · บัญชีธนาคาร |
| จอง | ยอด · `amountPaidBaht` · `paymentStatus` · `paymentMethod` · `depositSlipUrl` · `paymentSlipUrl` · เบอร์ลูกค้า · ผูกทรัพยากร (room/spot/…) |
| รีวิว | `*Review` · `isPublished` · `photoUrlsJson` (ถ้ามี) |

---

## 11) ตั้งค่าฝั่งเจ้าของ

แถบ **เว็ปลิงค์ลูกค้า** ตาม `dashboard-module-shop-settings-tabs.mdc`:

- คัดลอก/เปิดลิงก์สาธารณะ  
- แบนเนอร์ + แกลเลอรี (`*PortalMediaSettings`)  
- LINE · Facebook · แผนที่ · ที่อยู่  
- โหมดมัดจำ/เต็ม  
- รีวิว (เผยแพร่/ซ่อน)  
- Hub QR: `shop-qr-hub-popup-pattern.mdc` — **ห้าม** แบรนด์ซ้ำใต้ dashboard shell

---

## 12) แผนที่ไฟล์อ้างอิง

| บทบาท | โรงแรม | จอดรถ | ร้านอาหาร |
|--------|--------|-------|-----------|
| พอร์ทัล | `HotelResortPortalClient` | `ParkingPortalClient` | `BuildingPosPortalClient` |
| หลังจอง | `HotelResortPortalBookingClient` | `ParkingPortalBookingClient` | `BuildingPosPortalReservationClient` |
| Helpers | `hotel-resort/lib/portal-*.ts` | `parking/lib/portal-*.ts` | `lib/building-pos/portal-booking.ts` |
| URL / access | `lib/hotel-resort/public-url.ts` | `lib/parking/public-url.ts` | `lib/building-pos/public-url.ts` |
| Routes | `app/hotel-resort/[ownerId]` | `app/parking/[ownerId]` | `app/building-pos/[ownerId]` |
| Glass | `AppPublicCheckInGlassTemplate.tsx` | เดียวกัน | เดียวกัน |

สนาม: `FootballTurfBookingPortalClient` · เครื่องดื่ม: `DrinkPosPortalClient` (+ สั่งเลย)

---

## 13) Checklist โมดูลใหม่

- [ ] `app/{slug}/layout.tsx` เต็มจอ — ไม่ห่อ `max-w-lg` ทั้งโมดูล  
- [ ] Public: `/{slug}/[ownerId]` + `…/booking/[id]?phone=`  
- [ ] `public-url.ts` (omit `?t=` เมื่อ prod) + `is*PortalOpenForOwner`  
- [ ] Glass · hero เต็มจอ · แถบค้นหากะทัดรัด · `max-w-6xl` · โลโก้เฉพาะ header  
- [ ] โฟลว์เลือกทรัพยากรว่าง → กรอก → ชำระตามโดเมน  
- [ ] กริดหนาแน่นตามตาราง (§3) + โทเค็นใน `*-ui-tokens`  
- [ ] Profile: สื่อ · ติดต่อ · โหมดชำระ · เวลา  
- [ ] APIs: info · availability · book · booking detail · upload-slip · promptpay-qr · reviews  
- [ ] มียอด: QR พร้อมเพย์ · `useAppCameraCapture` · ข้อความหลักฐานมัดจำ/ชำระ  
- [ ] Book → `depositSlipUrl` · redirect หน้ารายละเอียดแบบโรงแรม (ยอด/ชำระแล้ว/คงเหลือ/สลิปแยก/ติดต่อ/กลับหน้าหลัก)  
- [ ] Lookup เบอร์ → ลิงก์รายละเอียด  
- [ ] Owner: สื่อ · ชำระ · รีวิว · QR hub  
- [ ] Bangkok dates · exclusive end days  
- [ ] แยก staff / check-in QR กะทัดรัด / พอร์ทัลสั่งอาหาร 1 คอลัมน์

---

## ห้ามพลาด

- อย่าใช้ `shop-customer-qr-portal` แทนเว็บนี้เมื่อต้องแบนเนอร์/หลายส่วน — หรือกลับกัน  
- อย่า dark theme · อย่าเปิด API สาธารณะโดยไม่ gate  
- อย่าผสมลิงก์พนักงานกับลูกค้า  
- อย่าเหลือพร้อมเพย์แค่เบอร์โดยไม่มี QR เมื่อมียอด  
- อย่าผูก「ถ่ายรูป」กับ `input.capture` อย่างเดียว  
- อย่าจบจองโดยไม่มีหน้ารายละเอียดแบบโรงแรม  
- อย่ายุบสลิปมัดจำกับสลิปเพิ่มเป็นก้อนเดียวโดยไม่มีป้ายแยก / lightbox  
- อย่าเก็บสลิปตอนจองพอร์ทัลไว้แค่ `paymentSlipUrl` เมื่อโรงแรมใช้ `depositSlipUrl` สำหรับป้าย「ชำระตอนจอง」  
- อย่าห่อ layout ทั้งโมดูลด้วย `max-w-lg`  
- อย่าใส่แบนเนอร์ในกล่องมี `px-*` หรือสูงแคบเมื่อกฎบังคับเต็มจอ  
- อย่าวางโลโก้ใหญ่ข้าง H1 ใน hero  
- อย่าฟอร์มยาวทั้งชุดทับแบนเนอร์ — แถบบน hero กะทัดรัด · ขั้นถัดไปใต้ hero  
- (ร้านอาหาร) อย่ากริดเมนู 2/4 — ต้อง 3/6 · พรีออเดอร์ได้เฉพาะขั้นเมนู  
- (เครื่องดื่ม) อย่าเพิ่มโฟลว์จองโต๊ะ — สั่งเลย  
- อย่าอ้างเวลาเช็คอิน/เอาต์คนละค่ากับตั้งค่าร้าน  
- อย่าลืม Asia/Bangkok กับจำนวนวัน exclusive end


================================================================================
### .cursor/rules/module-loyalty-points-template.mdc
================================================================================

---
description: แม่แบบระบบสะสม/แลกคะแนนโมดูล (คีย์=เบอร์ · earn เมื่อ PAID · พอร์ทัลลูกค้า · staff/session API) — ใช้เมื่อทำ loyalty ให้โมดูลใหม่
globs:
  - "**/systems/**/lib/loyalty*.ts"
  - "**/systems/**/components/**Loyalty*.tsx"
  - "**/app/api/**/loyalty/**"
  - "**/app/api/**/members/**"
  - "**/prisma/schema.prisma"
alwaysApply: false
---

# ระบบสะสมคะแนนโมดูล (แม่แบบ)

เมื่อเพิ่มหรือปรับ **สะสมคะแนน / แลกของรางวัล** ในโมดูลแดชบอร์ดใด ๆ ให้ยึดแพทเทิร์นนี้ (อ้างอิงหลัก: **POS ร้านอาหาร** · คู่ใกล้: drink-pos)

**คู่กับ:** `customer-portal-no-description-copy.mdc` (หน้าลูกค้าไม่ใส่คำอธิบายยาว) · `agent-finish-checkpoint.mdc` (หลังแตะ Prisma → `prisma generate`)

---

## 0) หลักคิดสั้น ๆ

1. **คีย์สมาชิก = เบอร์โทร** — เก็บตัวเลขล้วน (`normalize` ตัดอักษร) · ไม่บังคับกรอกถ้าลูกค้าไม่สะดวก  
2. **ขอบเขตข้อมูล** = `ownerUserId` + `trialSessionId` (หรือเทียบเท่า trial scope ของโมดูล)  
3. **สะสมเมื่อชำระสำเร็จ** — มักตอนสถานะออเดอร์/บิลเป็น **PAID** (ครั้งเดียวต่อออเดอร์)  
4. **กฎคำนวณบริสุทธิ์** อยู่ใน `lib/loyalty-rule.ts` (ใช้ client ได้) · เขียน DB ใน `lib/loyalty.ts` (server)  
5. **ตั้งค่าร้าน / แคตตาล็อกแลก** อยู่แดชบอร์ด · หน้าลูกค้าโชว์แค่หัวข้อสั้น + คะแนน + ปุ่มแลก  

---

## 1) โมเดลข้อมูล (Prisma — โครงมาตรฐาน)

ต่อโมดูลหนึ่งชุด (เปลี่ยน prefix ตามโมดูล เช่น `BuildingPos` / `DrinkPos`):

| โมเดล | หน้าที่ |
|--------|---------|
| `*LoyaltySettings` | `enabled`, `bahtPerPoint`, `pointsPerUnit` · unique `(owner, trial)` |
| `*LoyaltyMember` | `phone`, `pointsBalance`, `totalEarned`, `totalRedeemed` · unique `(owner, trial, phone)` |
| `*LoyaltyReward` | `title`, `pointsCost`, optional `menuItemId`, `isActive`, `sortOrder` |
| `*LoyaltyLedger` | `kind` = `EARN` \| `REDEEM`, `pointsDelta`, `balanceAfter`, optional `orderId` / `rewardId` |

บน **ออเดอร์/บิล** (ถ้ามี):

- `memberPhone` (varchar)  
- `pointsEarned` / `pointsRedeemed` (int, default 0) — กันให้คะแนนซ้ำ  

**เบอร์:** ความยาวเก็บ ~9–10 หลักหลัง normalize · ค้นหา staff อาจรองรับ 4 หลักท้ายผ่าน `parseLoyaltyPhoneQuery` (`@/lib/loyalty-stamp/member-qr`)

---

## 2) กฎสะสม (สูตร)

```
points = floor(ยอดชำระบาท / bahtPerPoint) * pointsPerUnit
```

- ถ้า `points <= 0` หรือไม่มีเบอร์ครบ → ไม่สร้างสมาชิก / ไม่ให้คะแนน  
- ให้คะแนนเฉพาะเมื่อ **เปลี่ยนเข้า PAID ครั้งแรก** (`previousPointsEarned === 0`)  
- อัปเดตสมาชิก + ledger + ติด `pointsEarned` บนออเดอร์ ใน **ธุรกรรมเดียว**

อ้างอิง: `src/systems/building-pos/lib/loyalty-rule.ts` · `applyBuildingPosLoyaltyEarnOnPaid` ใน `lib/loyalty.ts`

---

## 3) แลกคะแนน (Redeem)

1. ตรวจ `enabled` + เบอร์ครบ + คะแนนพอ + reward `isActive`  
2. หักคะแนน + ledger `REDEEM`  
3. **ลูกค้า self-serve:** สร้างออเดอร์ของแถม (ราคา 0) ในธุรกรรมเดียวถ้าเป็นไปได้ — ส่งเข้าครัว/คิว  
4. **พนักงาน/แดชบอร์ด:** แลกผูก `orderId` โต๊ะได้ หรือแค่หักคะแนนแล้วแจ้งพนักงาน  

อย่าหักคะแนนก่อนสร้างออเดอร์แล้วปล่อยค้างถ้าสร้างออเดอร์ล้ม — รวมใน `$transaction`

---

## 4) API ชั้น (บังคับแยกสิทธิ์)

| ชั้น | ใช้เมื่อ | ตัวอย่างพาธ (building-pos) |
|------|----------|---------------------------|
| **session** | เจ้าของล็อกอินแดชบอร์ด | `/api/{module}/session/loyalty` · `.../members` · `.../rewards` |
| **staff** | ลิงก์/QR พนักงาน (โทเค็น) | `/api/{module}/staff/loyalty` · `.../members` |
| **public** | ลูกค้า QR (ownerId + trial) | `/api/{module}/public/loyalty` (GET ดูคะแนน · POST แลก) |

- Public lookup: **เบอร์เต็ม 9–10** (ไม่เปิด suffix4 เพื่อลดการเดา)  
- Staff/session: ใช้ `parseLoyaltyPhoneQuery` ได้ (เต็ม หรือ 4 หลักท้าย)  
- PATCH สถานะออเดอร์เป็น PAID ต้องรับ `member_phone` optional แล้วเรียก earn  

แผง UI เดียวรองรับสองโหมด: ส่ง `staffAuth` → ยิง staff API · ไม่ส่ง → session (`credentials: "include"`)

อ้างอิง: `BuildingPosLoyaltyCheckoutPanel`

---

## 5) UX หน้าลูกค้า (QR สั่ง / พอร์ทัล)

เมื่อมีหลายแถบ:

| แถบ | เนื้อหา |
|------|---------|
| **ข้อมูล** (เปิดก่อน) | ชื่อ · โต๊ะ/อ้างอิง · **เบอร์โทรสะสมคะแนน** (ไม่บังคับ) |
| สั่ง / เมนู | … |
| ออเดอร์ | สถานะรายการ |
| **แลกคะแนน** (ขวาสุด · โชว์เมื่อ `enabled`) | คะแนนของเบอร์ที่กรอก + รายการแลก — **ไม่มีช่องเบอร์ซ้ำ** |

- กรอกเบอร์แล้ว → สั่งปกติ → ได้แต้มเมื่อร้านยืนยันชำระ  
- ไม่กรอก = สั่งได้ · ไม่สะสม  
- ข้อความ UI: หัวข้อสั้นเท่านั้น — ดู `customer-portal-no-description-copy.mdc`  
- จำเบอร์ใน `localStorage` ต่อร้านได้  

อ้างอิง: `BuildingPosCustomerOrderClient` · `BuildingPosCustomerLoyaltyPanel` (`hidePhoneInput`)

---

## 6) UX พนักงาน / แดชบอร์ด

- โมดัลโต๊ะ / ก่อนกด **ชำระแล้ว**: แผงค้นหาเบอร์ · ผูกเบอร์ · แลก · ส่ง `member_phone` ตอน PAID  
- หน้าสั่งของพนักงาน: ช่อง **เบอร์โทรสะสมคะแนน** ตอนสร้างออเดอร์ (ถ้าเปิดระบบ)  
- ตั้งค่ากฎ + แคตตาล็อกแลก: หน้า settings โมดูล (ไม่โชว์สูตรยาวบนพอร์ทัลลูกค้า)

อ้างอิง: `BuildingPosLoyaltySettingsClient` · `BuildingPosOpenTablesPanel` · `BuildingPosOrderClient` · `BuildingPosStaffClient`

---

## 7) Checklist โมดูลใหม่

1. Schema + migration + **`npx prisma generate`**  
2. `lib/loyalty-rule.ts` (สูตร + DTO) + `lib/loyalty.ts` (ensure / earn / redeem / map)  
3. API: session (settings+rewards+members) · public (lookup+redeem) · staff (ถ้ามีลิงก์พนักงาน)  
4. อัปเดต PATCH ออเดอร์ → earn on PAID  
5. UI ตั้งค่า · แผง checkout · พอร์ทัลลูกค้า (เบอร์ที่ข้อมูล · แถบแลกขวาสุด)  
6. ผ่าน `tsc` · ไม่ commit secret  

---

## 8) ไฟล์อ้างอิง (building-pos)

| บทบาท | พาธ |
|--------|-----|
| สูตร | `src/systems/building-pos/lib/loyalty-rule.ts` |
| Server | `src/systems/building-pos/lib/loyalty.ts` |
| Settings UI | `.../components/BuildingPosLoyaltySettingsClient.tsx` |
| Checkout staff/owner | `.../components/BuildingPosLoyaltyCheckoutPanel.tsx` |
| ลูกค้าแลก | `.../components/BuildingPosCustomerLoyaltyPanel.tsx` |
| Public API | `src/app/api/building-pos/public/loyalty/route.ts` |
| Session API | `src/app/api/building-pos/session/loyalty/**` |
| Staff API | `src/app/api/building-pos/staff/loyalty/**` |
| Normalize ร่วม | `src/lib/loyalty-stamp/member-qr.ts` |

drink-pos: `src/systems/drink-pos/lib/loyalty-rule.ts` + portal สมาชิก — โครงสร้างคล้ายกัน ปรับโดเมน (แสตมป์ vs คะแนนบาท) ให้เข้าธีมโมดูล แต่คง **คีย์เบอร์ + scope ร้าน + แยก public/session**


================================================================================
### .cursor/rules/module-package-deduct-signature.mdc
================================================================================

---
description: หักแพ็กสมาชิกต้องมีลงนามลูกค้า (AppSignaturePad) — ต้นแบบร้านตัดผม · ใช้กับซักผ้า/นวด/คาร์แคร์ และโมดูลใหม่
alwaysApply: true
---

# หักแพ็กสมาชิก — บังคับลงนามลูกค้า

เมื่อโมดูลมี **หักครั้งจากแพ็กเหมา / สมาชิก** (check-in · PACKAGE_USE) ให้ทำเหมือน **ร้านตัดผม** — ลูกค้าต้องลงชื่อก่อนหัก

**ต้นแบบ:** `BarberQueueCheckInModal` · `AppSignaturePad` · `uploadBarberSignatureBlob` · API `/api/barber/check-in` + `/api/barber/signature/upload`

**ซักผ้า (ทำแล้ว):** `LaundryCheckInForm` · `LaundryCheckInModal` · `uploadLaundrySignatureBlob` · `/api/laundry/check-in` + `/api/laundry/signature/upload`

---

## บังคับ (UI)

1. ใช้ **`AppSignaturePad`** จาก `@/components/app-templates` เท่านั้น — ห้ามวาด canvas ลงนามเอง
2. วาง pad **หลังเลือกแพ็ก** และ **ก่อนปุ่มหักครั้ง**
3. กดหักแล้วถ้า pad ว่าง → แสดง error ชัด เช่น «ให้ลูกค้าลงชื่อด้วยปากกาหรือนิ้วก่อนหักแพ็ก» — **ห้าม** หักโดยไม่มีลายเซ็น
4. ลำดับ: ตรวจ pad → `toPngBlob()` → อัปโหลด → POST check-in พร้อม `signatureImageUrl`
5. ขณะบันทึก: `disabled` pad + ปุ่มหัก

## บังคับ (API / DB)

1. ตาราง log การใช้บริการ (เช่น `*ServiceLog` / visit) ต้องมี **`signatureImageUrl`** (`VARCHAR(512)` nullable)
2. body หักแพ็ก: `subscriptionId` + **`signatureImageUrl`** (regex path อัปโหลดโมดูลนั้น เช่น `/uploads/laundry/` หรือ `/uploads/barber`)
3. มี route อัปโหลดลายเซ็นแยก (แนะนำ ` /api/{module}/signature/upload`) ใช้ `saveOwnerModuleUploadImage(..., "signatures", ownerId)`
4. helper ฝั่ง client: `upload{Module}SignatureBlob(blob)` ใน `systems/{module}/lib/upload-signature.ts`
5. บันทึกลง log ตอนสร้าง `PACKAGE_USE` — อย่าทิ้ง URL ทิ้งไว้โดยไม่ผูกแถว

## ห้าม

- หักแพ็กได้โดยไม่บังคับลายเซ็นบน UI แดชบอร์ด/staff
- คัดลอก pad / upload logic ซ้ำโดยไม่ใช้ `AppSignaturePad` + helper กลางของโมดูล
- รับ `data:` URL ยาว ๆ ใน body check-in — ต้องอัปโหลดไฟล์ก่อนแล้วส่ง path

## เช็กลิสต์เมื่อเพิ่มโมดูลใหม่

- [ ] คอลัมน์ `signature_image_url` + migration
- [ ] `/api/.../signature/upload`
- [ ] `upload*SignatureBlob` helper
- [ ] check-in schema รับ `signatureImageUrl` และบันทึก
- [ ] UI: `AppSignaturePad` ก่อนปุ่มหัก · ว่างแล้ว error


================================================================================
### .cursor/rules/module-package-name-description-ui.mdc
================================================================================

---
description: ขายแพ็ก / หักแพ็กต้องแสดงชื่อแพ็กเกจ + คำอธิบาย (และเมตาคร่าว ๆ) ทุกจุดเลือก/ประวัติ
alwaysApply: true
---

# แพ็กเกจสมาชิก — ชื่อ + คำอธิบายบน UI

เมื่อโมดูลมี **ขายแพ็กเหมา** หรือ **หักแพ็ก** (เช่น ซักผ้า · ร้านตัดผม):

## บังคับ

1. **การ์ด/รายการเลือกแพ็ก** (ขาย · หัก) ต้องแสดงชัดเจน:
   - **ชื่อแพ็กเกจ** (ไม่ truncate จนอ่านไม่ได้ — อนุญาต `line-clamp-2`)
   - **คำอธิบาย** ถ้ามีค่าที่มีความหมาย (ไม่ใช่ค่าว่าง / `-` / `n/a`) — อย่างน้อย `line-clamp-2`
   - เมตาที่เกี่ยวข้อง: ราคา · จำนวนครั้ง · เหลือครั้ง · ระยะเวลา (ถ้ามีในโมเดล)
2. **ปุ่มยืนยันหักแพ็ก** ควรระบุชื่อแพ็กที่เลือก (เช่น `หัก 1 ครั้ง — {ชื่อแพ็ก}`)
3. **ประวัติบริการ / การเงิน** สำหรับ `PACKAGE_USE` · `PACKAGE_SALE`:
   - หัวรายการต้องมี **ชื่อแพ็ก** (เช่น `หักแพ็กเกจ · ชื่อแพ็ก`)
   - ดึงจาก subscription→package หรือ `note` ที่บันทึกชื่อแพ็กตอนสร้าง log
4. ตอนสร้าง log หัก/ขาย — **บันทึกชื่อแพ็กใน `note`** (หรือฟิลด์เทียบเท่า) เพื่อไม่หายเมื่อ subscription ถูกลบ

## ห้าม

- โชว์แค่ป้าย «หักแพ็กเกจ» / «ขายแพ็กเกจ» โดยไม่มีชื่อแพ็ก
- ซ่อนคำอธิบายทั้งที่แพ็กมี `description` ในฐานข้อมูล
- ตัดชื่อแพ็กด้วย `truncate` บรรทัดเดียวในโมดัลเลือกแพ็กเมื่อพื้นที่พอแสดง 2 บรรทัด

## เช็กลิสต์ (ซักผ้า)

- [ ] `LaundrySellPackageModal` — ชื่อ · คำอธิบาย · ครั้ง · เวลา · สรุปแพ็กที่เลือก
- [ ] `LaundryCheckInForm` — ชื่อ · คำอธิบาย · เหลือครั้ง/ทั้งหมด · ระยะบริการ
- [ ] `/api/laundry/customers/search` ส่ง `packageDescription` · `totalSessions`
- [ ] `/api/laundry/history` ส่ง `packageName` · `packageDescription`
- [ ] check-in / subscriptions POST ใส่ `note` = ชื่อแพ็ก
---


================================================================================
### .cursor/rules/module-package-sell-tax-invoice-print.mdc
================================================================================

---
description: ขายแพ็กสมาชิก — ติ๊กใบกำกับภาษีแล้วพิมพ์เฉพาะใบกำกับ (ไม่พิมพ์ใบเสร็จ) · พิมพ์ย้อนหลังเลือกได้ทั้งสอง
alwaysApply: true
---

# ขายแพ็กสมาชิก — พิมพ์ใบเสร็จ vs ใบกำกับภาษี

เมื่อโมดูลมี **ขายแพ็กเหมา / สมาชิก** พร้อมตัวเลือก **ออกใบกำกับภาษี** และ **พิมพ์หลังบันทึก**

**ต้นแบบซักผ้า:** `LaundrySellPackageModal` · `printLaundryMemberDocs` · พิมพ์ย้อนหลัง `LaundryMemberPrintModal` / หน้าสมาชิกแพ็ก

---

## บังคับ — หลังบันทึกขายแพ็ก (auto-print)

| สถานะ | พิมพ์ทันทีหลังบันทึก |
|--------|----------------------|
| **ไม่**ติ๊กใบกำกับภาษี | พิมพ์ **ใบเสร็จ** อย่างเดียว (ขนาดตามตั้งค่าร้าน) |
| **ติ๊ก**ใบกำกับภาษี | พิมพ์ **ใบกำกับภาษี** อย่างเดียว (มัก A4) — **ห้าม** พิมพ์ใบเสร็จคู่กัน |

```ts
const wantTaxInvoice = taxForm.taxInvoiceEnabled;
if (printAfterSave && ...) {
  printMemberDocs({
    receipt: !wantTaxInvoice,
    taxInvoice: wantTaxInvoice,
    data: { ... },
  });
}
```

- ป้าย checkbox พิมพ์หลังบันทึกต้องสะท้อนโหมด: «พิมพ์ใบเสร็จ…» หรือ «พิมพ์ใบกำกับภาษี…»
- ถ้าปิด checkbox พิมพ์หลังบันทึก → ไม่พิมพ์อะไรทันที (ยังบันทึก tax fields ใน DB ตามปกติ)

## บังคับ — พิมพ์ย้อนหลัง

1. จาก **ข้อมูลสมาชิก / ประวัติขายแพ็ก** ต้องพิมพ์ซ้ำได้ทั้ง **ใบเสร็จ** และ **ใบกำกับภาษี** (เลือกอย่างใดอย่างหนึ่งหรือทั้งคู่)
2. ใช้โมดัลพิมพ์ย้อนหลังแยก (เช่น `*MemberPrintModal`) — ไม่บังคับพิมพ์คู่ตอนขาย
3. ข้อมูลใบกำกับ (ชื่อ · เลขผู้เสียภาษี · ที่อยู่) ต้องเก็บในลูกค้า/สมาชิกตอนขาย เพื่อดึงมาพิมพ์ภายหลัง

## ห้าม

- ตอนขายแพ็กที่ติ๊กใบกำกับแล้วส่งพิมพ์ `receipt: true` + `taxInvoice: true` พร้อมกัน
- ตัดฟีเจอร์พิมพ์ย้อนหลังใบเสร็จเพราะเคยออกใบกำกับแล้ว
- hardcode พิมพ์เฉพาะใบเสร็จโดยไม่ดู `taxInvoiceEnabled`

## เช็กลิสต์เมื่อเพิ่มโมดูลใหม่

- [ ] ขายแพ็ก: `receipt: !taxInvoiceEnabled` · `taxInvoice: taxInvoiceEnabled`
- [ ] UI ข้อความ checkbox ตามโหมดใบกำกับ
- [ ] บันทึกฟิลด์ใบกำกับในลูกค้า/สมาชิก
- [ ] โมดัลพิมพ์ย้อนหลังเลือกใบเสร็จและ/หรือใบกำกับได้


================================================================================
### .cursor/rules/module-staff-token-link-portal.mdc
================================================================================

---
description: ลิงก์พนักงานแบบโทเค็น — พอร์ทัลเต็มจอ · หัวคงที่ · เดสก์ท็อปซ้าย/ขวาเลื่อนอิสระ · มือถือแท็บล่าง + สกอลล์รวมเบอร์กับเมนู
alwaysApply: false
globs:
  - "**/components/qr/module-staff-token-qr-panel.tsx"
  - "**/components/qr/shop-staff-qr-panel.tsx"
  - "**/components/ui/FormModal.tsx"
  - "**/app/**/staff/**"
  - "**/api/**/staff/**"
  - "**/api/**/staff-link/**"
  - "**/systems/drink-pos/**Staff*"
  - "**/systems/drink-pos/DrinkPosOrderClient.tsx"
  - "**/systems/hotel-resort/**Staff*"
  - "**/systems/building-pos/**Staff*"
---

# ลิงก์พนักงาน (โทเค็น) — สร้าง + หน้าปลายทาง

ใช้เมื่อโมดูลมี **ลิงก์/QR พนักงานแบบลับ** (`?t=&k=`) ให้บันทึกงานโดยไม่ล็อกอินเจ้าของ — แยกจาก staff lane ที่ต้องล็อกอิน (คาร์แคร์ / บาร์เบอร์ → `staff-qr-landing-page.mdc`)

**แม่แบบอ้างอิง (ร้านเครื่องดื่ม):**  
`DrinkPosLoyaltyHubClient` → `ModuleStaffTokenQrPanel` → `/drink-pos/staff/{ownerId}?t=&k=` → `DrinkPosStaffClient` + `DrinkPosOrderClient layout="staffPortal"`

**แยกจากแดชบอร์ดเจ้าของ:** หน้า `/dashboard/…/order` เลื่อนทั้งหน้าแบบร้านอาหาร (`BuildingPosShell`) — **อย่า** เอาเชน `h-dvh` / คอลัมน์เลื่อนอิสระของพอร์ทัลไปใส่แดชบอร์ด

---

## 1) สร้าง / จัดการลิงก์ในแดชบอร์ด

| ข้อ | บังคับ |
|-----|--------|
| คอมโพเนนต์ | `ModuleStaffTokenQrPanel` หรือ `ShopStaffQrPanel` — ห้ามคัดลอก UI QR ใหม่ |
| โมดัล | `FormModal` **`size="full"`** · `appearance="glass"` · `glassTint="amber"` · `mobileCentered` |
| ห้าม | `size="lg"` / `md` สำหรับโมดัลสร้างลิงก์พนักงาน |
| API | `GET/POST /api/{module}/session/staff-link` (หรือเทียบเท่า) — โทเค็นเข้ารหัสตาม building-pos |

รายละเอียดแผง QR / ดาวน์โหลด → `.cursor/rules/shop-staff-qr-panel.mdc`  
แพทเทิร์นการ์ด hub คู่ → `.cursor/rules/shop-qr-hub-popup-pattern.mdc`

---

## 2) หน้าปลายทาง — โครงพอร์ทัล (บังคับ)

### เปลือกนอก

1. **เต็มจอซ้าย–ขวา** — `w-full` · **ห้าม** `max-w-7xl` / `max-w-6xl` / `mx-auto` ที่เหลือ gutter กว้าง
2. Wrapper นอก: `shopQrTemplatePageBgClass` + **`h-dvh max-h-dvh overflow-hidden`** + ขอบบาง `p-2 sm:p-3`
3. **การ์ดใบเดียว** ห่อทั้งหน้า (`h-full min-h-0 overflow-hidden` · มุมมน ~`rounded-[1.75rem]`–`rounded-[2rem]` · glass): **หัวร้าน + แท็บ + เนื้อหางาน** ในกรอบเดียวกัน
4. **ห้าม** `overflow-y-auto` ที่การ์ดทั้งใบ — จะทำให้หัวเลื่อนหาย

### ส่วนหัวคงที่ (`shrink-0`)

- แถบบทบาท เช่น `พนักงาน · บันทึกออเดอร์`
- ชื่อร้าน (`shopLabel`) จาก bootstrap
- **ปุ่มรีเฟรช** มุมขวา — bootstrap + โหลดเมนู/คิวใหม่ · `aria-label` · ข้อความ `รีเฟรช` / `…`
- **แท็บสลับ** `ออเดอร์` / `คิวออเดอร์`:
  - **เดสก์ท็อป `lg+`:** ใต้หัวในการ์ด
  - **มือถือ:** แถบล่าง (ดู §4) — **ห้าม** ใส่แท็บในหัวบนมือถือ
  - สลับแท็บแล้ว**คงตะกร้า** (ซ่อนด้วย `hidden` ไม่ unmount) · ปิด dock สรุปบิลตอนแท็บคิว (`enableMobileDraft={false}`)
- หัว **ไม่เลื่อนไปกับเนื้อหา** — อยู่บนสุดของการ์ดเสมอ

### โซนเนื้อหาใต้หัว

- `flex min-h-0 flex-1 flex-col overflow-hidden` + padding ใน (`px-2 py-3` ฯลฯ)
- กัน dock มือถือบัง: `drinkPosMainPaddingBottomClass` เสมอ (มีแท็บล่าง)

---

## 3) แท็บออเดอร์ — เดสก์ท็อป `lg+`: ซ้าย / ขวา เลื่อนอิสระ (บังคับ)

นี่คือ UX หลักของลิงก์พนักงานบนจอใหญ่ — **แม่แบบ = drink-pos staff**

### เชนความสูง (อย่าตัด)

```
h-dvh (นอก)
  └─ การ์ด h-full overflow-hidden
       ├─ header shrink-0
       └─ เนื้อหา min-h-0 flex-1 overflow-hidden
            └─ OrderClient: h-full overflow-hidden
                 └─ grid: min-h-0 flex-1 grid-rows-1 overflow-hidden
                      ├─ aside ซ้าย: h-full min-h-0 overflow-y-auto
                      └─ section ขวา: min-h-0 overflow-hidden
                           ├─ หมวด shrink-0
                           └─ กริดสินค้า: min-h-0 flex-1 overflow-y-auto
```

### คอลัมน์ซ้าย (สมาชิก · รายการ · ชำระ · ยอด · บันทึก)

- `lg:flex` · `h-full min-h-0 overflow-y-auto overscroll-contain`
- เลื่อน**ทั้งคอลัมน์** รวมแผง PromptPay / สลิป / ปุ่มบันทึก — **ห้าม** `overflow-hidden` ที่ตัดส่วนชำระโดยไม่มีสกอลล์คอลัมน์
- การ์ดรายการภายในเป็น `shrink-0` (สูงตามเนื้อหา) — ให้สกอลล์อยู่ที่ aside ไม่ใช่กล่องย่อยแยก

### คอลัมน์ขวา (หมวด + เมนู)

- หมวดหมู่แถบแนวนอน: `shrink-0` · เลื่อนแนวนอนได้ · **ไม่** เลื่อนแนวตั้งแทนเมนู
- กริดสินค้า: `min-h-0 flex-1 overflow-y-auto overscroll-contain` — **อิสระจากฝั่งซ้าย**
- กริดสินค้ากว้างขึ้นบนจอใหญ่ได้ (เช่น `xl:grid-cols-7`)

### ห้าม (เดสก์ท็อปพอร์ทัล)

- เลื่อนทั้งหน้า / ทั้งการ์ดแทนคอลัมน์
- ล็อกความสูงพอร์ทัลแล้วยังให้ parent ยืดตามเนื้อหาจน `overflow-y-auto` ของคอลัมน์ไม่ทำงาน
- คัดลอกเลย์เอาต์พอร์ทัลไปหน้าแดชบอร์ดเจ้าของ

### อ้างอิงโค้ด

| ส่วน | ไฟล์ / prop |
|------|-------------|
| พอร์ทัล | `DrinkPosStaffClient.tsx` |
| ออเดอร์ | `DrinkPosOrderClient` · `layout="staffPortal"` · `staffAuth` |
| กริดสองคอลัมน์ | `lg:grid-cols-[minmax(260px,22rem)_minmax(0,1fr)]` |

---

## 4) มือถือ (ลิงก์พนักงาน) — บังคับ

แม่แบบ = drink-pos staff บน viewport แคบ (ก่อน `lg`)

### โครงหน้า

| ชั้น | พฤติกรรม |
|------|----------|
| ส่วนหัวการ์ด | **คงที่** (`shrink-0`) — บทบาท · ชื่อร้าน · ปุ่มรีเฟรช เท่านั้น |
| แท็บ `ออเดอร์` / `คิวออเดอร์` | **แถบล่าง** ใน pill ของ `AppMobileDockUnifiedBar` — **ห้าม** วางในหัวบนมือถือ |
| สรุปบิล (เมื่อมีรายการ) | สล็อตเหนือ pill เมนู (dock เดิม) |
| เดสก์ท็อป `lg+` | แท็บกลับไปอยู่ใต้หัว · dock ซ่อน (`lg:hidden` จากโทเค็น dock) |

### สกอลล์แท็บออเดอร์ (บังคับ)

```
หัวร้าน (คงที่)
  └─ โซนเลื่อนเดียว (overflow-y-auto)
       ├─ แถบเบอร์โทร / สมาชิก (DrinkPosLoyaltyBar)
       ├─ ชิปหมวดหมู่
       └─ กริดเมนูอาหาร (สูงตามเนื้อหา — ไม่มี overflow-y แยก)
แถบเมนูล่าง (fixed dock)
```

- รวม **เบอร์โทร + หมวด + เมนู** ในสกอลล์เดียวใต้หัว
- หัวร้าน **ไม่** เลื่อนตาม
- **ห้าม** แยกสกอลล์เฉพาะเมนูจนเบอร์โทรค้างติดหัว
- คลาสอ้างอิง: `flex flex-col overflow-y-auto … lg:grid lg:overflow-hidden` ใน `DrinkPosOrderClient` `layout="staffPortal"`

### แท็บคิวออเดอร์

- หัวคงที่เหมือนกัน · แท็บล่างเหมือนกัน
- เนื้อหาคิวเลื่อนในโซนใต้หัว (board) · ไม่ใส่สรุปบิลใน dock (`enableMobileDraft={false}`)

### ชำระ / บันทึก

- ปุ่มจากสล็อต dock เปิด `FormModal` **`size="full"`**
- แผงชำระในโมดัลต้องเลื่อนถึงแนบสลิป + CTA ได้ครบ

### เว้นที่ + โทเค็น

- `drinkPosMainPaddingBottomClass` (`pb-24 lg:pb-0`) บนการ์ดพอร์ทัลเสมอ — กัน dock บังเนื้อหา
- แท็บล่างส่งผ่าน `DrinkPosMobileBottomProvider` prop **`staffFooterNav`**

### ห้าม (มือถือพอร์ทัล)

- แท็บออเดอร์/คิวในส่วนหัวบนมือถือ
- สกอลล์ซ้อน: เบอร์ตรึง + เมนูเลื่อนแยก
- เลื่อนทั้งการ์ดรวมหัวร้าน
- ลืม padding ก้นจนเมนูล่างบังรายการสุดท้าย

### อ้างอิงโค้ดมือถือ

| ส่วน | ที่อยู่ |
|------|--------|
| พอร์ทัล + แท็บล่าง | `DrinkPosStaffClient.tsx` → `staffFooterNav` |
| Dock / สล็อตบิล | `DrinkPosMobileBottomChrome.tsx` |
| สกอลล์รวมเบอร์+เมนู | `DrinkPosOrderClient` · `layout="staffPortal"` |

---

## 5) เนื้อหา + API

- **ใช้ UI งานจริงของโมดูล** เมื่อเป็นไปได้ — ห้ามสร้างตะกร้า/เมนูคนละชุดโดยไม่มีเหตุผลโดเมน
- เรียก `/api/{module}/staff/*` ด้วย `ownerId` + `t` + `k` · `credentials: "omit"`
- คิว: `GET/PATCH …/staff/orders/board` · SSE `…/board/stream` (ตรวจโทเค็น `k`)
- โมดัลชำระ: `FormModal size="full"` เมื่อมี QR + สลิป — ห้ามตัดส่วนล่าง

---

## 6) Checklist โมดูลใหม่

1. [ ] staff-link + migrate + `prisma generate`
2. [ ] API `session/staff-link` + `staff/bootstrap` + API งานที่จำเป็น
3. [ ] Hub: QR พนักงาน + `FormModal size="full"` + `ModuleStaffTokenQrPanel` / `ShopStaffQrPanel`
4. [ ] หน้า `/…/staff/[ownerId]?t=&k=` — เต็มจอ · การ์ดเดียว · หัวคงที่ · รีเฟรช · **เดสก์ท็อปซ้าย/ขวาเลื่อนอิสระ** · **มือถือแท็บล่าง + สกอลล์รวมเบอร์+เมนู**
5. [ ] เนื้อหา = UI งานจริง · คิวผ่าน board + API staff
6. [ ] มือถือครบตาม §4 (หัวคงที่ · แท็บล่าง · สกอลล์เดียว · dock สรุปบิล · `FormModal size="full"`)
7. [ ] ไม่ใส่แบรนด์ MAWELL ซ้ำใน chrome พอร์ทัล

---

## ความสัมพันธ์กับกฎอื่น

| หัวข้อ | กฎ |
|--------|-----|
| แผง QR / ดาวน์โหลดในโมดัล | `shop-staff-qr-panel.mdc` |
| Hub การ์ดคู่ลูกค้า–พนักงาน | `shop-qr-hub-popup-pattern.mdc` |
| Staff lane หลังล็อกอิน | `staff-qr-landing-page.mdc` |
| drink-pos แดชบอร์ด (เลื่อนทั้งหน้า) | `drink-pos-module-dashboard-template.mdc` |


================================================================================
### .cursor/rules/module-thailand-timezone.mdc
================================================================================

---
description: วันเวลาโมดูลต้องใช้ Asia/Bangkok (เวลาไทย) — ห้าม UTC จาก toISOString
alwaysApply: true
---

# เวลาไทย (Asia/Bangkok) — ทุกโมดูล

โปรเจกต์นี้เป็นธุรกิจไทย วัน/เวลาที่กระทบ **สถานะเปิด–ปิด · คิว · จอง · ราคาวันธรรมดา/เสาร์–อาทิตย์ · “วันนี้” · seed** ต้องอิง **`Asia/Bangkok`** ไม่ใช่ timezone ของเครื่องเซิร์ฟเวอร์หรือ UTC ของ `toISOString()`

## แหล่งความจริง

ใช้ helper กลางจาก `@/lib/time/bangkok`:

| ฟังก์ชัน | ใช้เมื่อ |
|---------|---------|
| `bangkokDateKey(d?)` | วันที่ปฏิทิน `YYYY-MM-DD` (“วันนี้”, กรองวัน, seed) |
| `bangkokNowMinutes(d?)` | นาทีจากเที่ยงคืน — เทียบสล็อต / เปิด–ปิด |
| `formatBangkokTimeHm(d?)` | แสดงนาฬิกา `HH:mm` บน UI |
| `formatBangkokDateTimeLong(iso)` | แสดงวันเวลาภาษาไทย |
| `isBangkokWeekend(d\|ymd)` | เลือกราคา จ–ศ / ส–อา |
| `bangkokMonthKey(d?)` | เดือน `YYYY-MM` |

โมดูลที่มีคิว/สล็อต (เช่น สนามฟุตบอล) ห่อซ้ำได้ใน `lib/time-queue.ts` ของโมดูล แต่ภายในต้องเรียก helper Bangkok ด้านบน

## ห้าม

```ts
// ❌ BAD — เลื่อนวันช่วงกลางคืนไทย / คนละโซนกับเครื่อง
new Date().toISOString().slice(0, 10)
date.getHours() * 60 + date.getMinutes()
new Date("2026-08-09").getDay()
new Date(iso).toLocaleString("th-TH") // ไม่ใส่ timeZone

// ✅ GOOD
bangkokDateKey()
bangkokNowMinutes()
isBangkokWeekend("2026-08-09")
new Date(iso).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })
```

## เก็บวันที่ปฏิทินใน DB

- อ่านเป็น `YYYY-MM-DD` ผ่าน `bangkokDateKey` / mapper ของโมดูล  
- parse วันอย่างเดียว: ใช้กลางวันไทย เช่น `` `${ymd}T12:00:00+07:00` `` — กันเลื่อนวันตอน serialize  
- ฟิลด์ “เวลาเปิด–ปิด” แบบ `HH:mm` = **เวลาไทยตามที่ร้านตั้ง** (ไม่แปลง timezone ตอนแสดง)

## UI

- ป้ายฟอร์ม/คำอธิบายเมนูที่เกี่ยวกับชั่วโมงเปิด: ระบุ **เวลาไทย** เมื่ออาจสับสน  
- สถานะสด (ว่าง / ปิด / เลยเวลา) เทียบด้วย `bangkokNowMinutes` + วันที่ `bangkokDateKey`  
- **ฟอร์มแก้ไขเวลา:** ใช้ **`AppTime24Input`** จาก `@/components/app-templates` (เลือก ชม./นาที 00–23) — **ห้าม** `<input type="time">` ที่โชว์ AM/PM ตาม OS

## อ้างอิงที่ทำแล้ว

- `src/lib/time/bangkok.ts`
- `src/components/app-templates/AppTime24Input.tsx`
- สนามฟุตบอล: `src/systems/football-turf/lib/time-queue.ts` · `lib/mappers.ts` · `FootballTurfDashboard.tsx`


================================================================================
### .cursor/rules/pos-customer-order-link-ux.mdc
================================================================================

---
description: ลิงก์ลูกค้า POS (ร้านอาหาร · เครื่องดื่ม) — เมนู 1 คอลัม / หมวดเลื่อนแนวนอน / ข้อความเบอร์
globs:
  - "**/systems/building-pos/BuildingPosCustomerOrderClient.tsx"
  - "**/systems/drink-pos/DrinkPosCustomerOrderClient.tsx"
  - "**/systems/**/CustomerLoyaltyPanel.tsx"
  - "**/app/building-pos/**"
  - "**/app/drink-pos/[ownerId]/**"
  - "**/app/drink-pos/order/**"
alwaysApply: false
---

# ลิงก์ลูกค้า POS — UX เมนู / เบอร์ / คะแนน

**แม่แบบหลัก:** ลิงก์ลูกค้า **ร้านอาหาร** (`BuildingPosCustomerOrderClient`)  
**ต้องตาม:** ลิงก์ลูกค้า **ร้านเครื่องดื่ม** (`DrinkPosCustomerOrderClient` ที่ `/drink-pos/[ownerId]`) และโมดูล POS ลูกค้าอื่นที่โครงเดียวกัน

---

## 1) สินค้าในหมวด — แถว 1 คอลัม (บังคับ)

- รายการใต้หัวหมวด (กาแฟ / อาหารจานเดียว ฯลฯ) ใช้ **`grid grid-cols-1 gap-1.5`**
- การ์ดแต่ละรายการเป็น **แถวแนวนอน**: รูปย่อซ้าย (~44×44) · ชื่อ + ราคา · ปุ่ม +/− ขวา
- **ห้าม** กริด 2–3 คอลัมน์ใต้หมวด
- **ห้าม** เลื่อนแนวนอนการ์ดสินค้าใต้หมวด (อย่าสับสนกับเมนูแนะนำ)

**อ้างอิงร้านอาหาร:** `MenuDishCardGrid` ใน `BuildingPosCustomerOrderClient.tsx`  
**อ้างอิงเครื่องดื่ม:** `DrinkProductRowCard` ใน `DrinkPosCustomerOrderClient.tsx`

## 2) เมนูแนะนำ / ขายดี — เลื่อนแนวนอนได้

- แถว **เมนูแนะนำ** (และขายดีถ้ามี) ใช้การ์ดกะทัดรัด + `overflow-x-auto` / `flex w-max` ได้ — แยกจากรายการใต้หมวด

## 3) ชิปหมวดหมู่ — แถวเดียวเลื่อนซ้ายขวา

- แถบ «ทั้งหมด» + ชื่อหมวด: **`flex-nowrap`** + `overflow-x-auto` + `shrink-0` + `whitespace-nowrap`
- **ห้าม** `flex-wrap` ให้ชิปขึ้นหลายบรรทัด

## 4) เบอร์สะสมคะแนน

- ป้ายช่องเบอร์ในแท็บข้อมูล: **`เบอร์โทรสะสมคะแนน`** (ไม่ใช่แค่ «เบอร์โทร»)
- เมื่อชำระครบแล้วล้างเบอร์/เซสชันตามกฎเดิม — **ห้าม** โชว์ข้อความอธิบายยาว เช่น «ชำระครบแล้ว — ล้างเบอร์แล้ว พร้อมสั่งรอบใหม่»

## 5) แลกคะแนน (ถ้ามี)

- ลิงก์ลูกค้า: **ดูคะแนน + รายการแลกอย่างเดียว** — ห้ามปุ่มแลกเอง · ข้อความแจ้งให้ยืนยันกับพนักงาน
- API public `POST …/loyalty` ต้องตอบ `403` / `REDEEM_STAFF_ONLY` (จนกว่าจะมี OTP)
- แลกจริงทำที่พนักงาน/แดชบอร์ดเท่านั้น
- รายการแลกเป็น **แถวเดียว** มีรูปย่อ — `LoyaltyRewardMenuCard` / `LoyaltyRewardMenuGrid`
- รูป: จากเมนู/สินค้าที่ผูก **หรือ** รูปอัปโหลดเองเมื่อไม่ผูก — รายละเอียด `pos-loyalty-points.mdc`

## 6) ชำระเงินบนลิงก์ลูกค้า (เครื่องดื่ม)

- ในสรุปรายการก่อนส่งออเดอร์ ต้องเลือกช่องทาง: **จ่ายที่ร้าน** · **พร้อมเพย์** · **โอนเงิน**
- พร้อมเพย์ / โอน: แสดง QR หรือบัญชี + **บังคับแนบสลิป** ก่อนยืนยัน
- API: `POST /api/drink-pos/public/promptpay-qr`, `POST /api/drink-pos/public/upload-slip`, `POST /api/drink-pos/public/orders` รับ `paymentMethod` + `paymentSlipUrl`
- UI ใช้ `DrinkPosPaymentPanel` `variant="public"`

---

## ห้ามพลาด

| ผิด | ถูก |
|-----|-----|
| กริด 2–3 คอลัมน์ใต้หมวดบนลิงก์ลูกค้าเครื่องดื่ม | `grid-cols-1` + การ์ดแถว |
| เลื่อนแนวนอนสินค้าใต้หมวด | เฉพาะแนะนำ/ขายดี |
| ชิปหมวด `flex-wrap` | แถวเดียว + scroll |
| ป้าย «เบอร์โทร» อย่างเดียว | «เบอร์โทรสะสมคะแนน» |


================================================================================
### .cursor/rules/pos-loyalty-points.mdc
================================================================================

---
description: สะสมคะแนน POS (ร้านอาหาร · เครื่องดื่ม) — กฎแต้ม รายการแลก รูปอัปโหลด ย่อรูปก่อนส่ง
globs:
  - "**/systems/building-pos/**/*oyalty*"
  - "**/systems/drink-pos/**/*oyalty*"
  - "**/systems/building-pos/lib/loyalty*"
  - "**/systems/drink-pos/lib/loyalty*"
  - "**/api/building-pos/**/loyalty/**"
  - "**/api/drink-pos/**/loyalty/**"
  - "**/DrinkPosLoyaltySettingsClient.tsx"
  - "**/BuildingPosLoyaltySettingsClient.tsx"
alwaysApply: false
---

# POS — ระบบสะสมคะแนน / แลกคะแนน

ใช้กับ **ร้านอาหาร** (`building-pos`) และ **ร้านเครื่องดื่ม** (`drink-pos`)  
ลิงก์ลูกค้า (เมนู · ป้ายเบอร์) → `pos-customer-order-link-ux.mdc`  
อัปโหลดรูปทั่วไป → `app-templates-media.mdc` · `football-turf-module-dashboard-template.mdc` §9

---

## 1) กฎสะสม (บาท → คะแนน)

| | เครื่องดื่ม | ร้านอาหาร |
|--|-------------|-----------|
| Settings | `DrinkPosLoyaltySettings` | `BuildingPosLoyaltySettings` |
| ฟิลด์หลัก | `enabled` · `baht_per_point` · `points_per_unit` | เหมือนกัน |
| ข้อความกฎ | `formatDrinkPosLoyaltyEarnRule` | `formatBuildingPosLoyaltyEarnRule` |
| UI ตั้งค่า | `/dashboard/drink-pos/settings` · `DrinkPosLoyaltySettingsClient` | settings ร้านอาหาร · `BuildingPosLoyaltySettingsClient` |

- ให้คะแนนเมื่อ**บิลชำระแล้ว** + มีเบอร์สมาชิกครบ
- **ห้าม** hardcode ข้อความกฎใน UI — อ่านจาก settings เสมอ

---

## 2) รายการแลกคะแนน

- ผูก **สินค้า/เมนู** ได้ (ไม่บังคับ) → แลกแล้วสร้างรายการฟรีเข้าคิว (ถ้าโมดูลรองรับ)
- **ไม่ผูกสินค้า** → กำหนดชื่อเองได้
- แสดงผลแลก: **แถวเดียว** + รูปย่อ — `LoyaltyRewardMenuCard` / `LoyaltyRewardMenuGrid` (`app-templates`)
- Popup พนักงาน: กระชับ — เบอร์+คะแนนบรรทัดเดียว · ไม่ซ้อนกรอบ/หัวข้อซ้ำ

### ใครแลกได้ (เฟสปัจจุบัน)

| ช่องทาง | แลกได้? |
|---------|---------|
| **ลิงก์ลูกค้า / public** (`POST …/public/loyalty`) | **ไม่ได้** — ดูคะแนน+รายการอย่างเดียว · แจ้งพนักงาน (`REDEEM_STAFF_ONLY`) |
| พนักงาน / แดชบอร์ด (session · staff) | **ได้** |

เฟสถัดไป: OTP SMS บนลิงก์ลูกค้า — ดูแผนในแชท / `src/lib/phone-otp/` (ยังไม่ทำ)

### รูปของรายการแลก

| กรณี | รูปที่ใช้ |
|------|----------|
| ผูกสินค้า/เมนู | รูปจากสินค้า/เมนูอัตโนมัติ |
| ไม่ผูก | **อัปโหลดรูปกำหนดเอง** (`image_url` บนตาราง reward) |

- เครื่องดื่ม: คอลัมน์ `DrinkPosLoyaltyReward.imageUrl` · API `image_url` ใน `POST/PATCH …/loyalty/rewards`
- แสดงผล: **รูปกำหนดเองก่อน** · ไม่มีค่อยใช้รูปสินค้า (`listDrinkPosLoyaltyRewards` / `enrichDrinkPosLoyaltyRewardImage`)
- ผูกสินค้าแล้ว → เคลียร์ `image_url` กำหนดเอง (ใช้รูปเมนู)

---

## 3) อัปโหลดรูป — **ต้องย่อก่อนส่ง (บังคับ)**

ใช่ — ตามมาตรฐานโปรเจกต์ **ทุกอัปโหลดรูปจาก client** (รวมรูปแลกคะแนน · สินค้า · สลิป · โลโก้):

1. Client: **`prepareImageFileForUpload(file)`** จาก `@/components/app-templates` ก่อนใส่ `FormData`
2. จากนั้น `POST` ไป endpoint อัปโหลดโมดูล (เช่น `/api/drink-pos/upload`)
3. UI ปุ่มแกลเลอรี/กล้อง: `AppGalleryCameraFileInputs` + `AppImagePickCameraButtons`

**ห้าม** ส่ง `File` ดิบจาก `<input type="file">` โดยไม่ผ่าน `prepareImageFileForUpload`

อ้างอิงโค้ด: `DrinkPosLoyaltySettingsClient` · `DrinkPosDashboardClient` · football-turf §9

---

## 4) สมาชิก / เบอร์

- ค้นหาเบอร์เต็มหรือ 4 หลักท้าย — ถ้าซ้ำโชว์รายการเลือกเบอร์เต็ม
- ป้ายช่องบนลิงก์ลูกค้า: **เบอร์โทรสะสมคะแนน**
- ชำระครบแล้วล้างเบอร์/เซสชันได้ — **ห้าม** toast อธิบายยาว

---

## ห้ามพลาด

| ผิด | ถูก |
|-----|-----|
| อัปโหลดรูปแลกโดยไม่ `prepareImageFileForUpload` | ย่อแล้วค่อย `fetch` upload |
| รายการแลกไม่มีรูปเมื่อไม่ผูกเมนู | ช่องอัปโหลด + เก็บ `image_url` |
| hardcode «ซื้อ 100 ได้ 1» | อ่านจาก settings |
| การ์ดแลกแบบกริดใหญ่ใน popup | แถว `LoyaltyRewardMenuCard` |


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
description: ทำงานให้จบ — รันเทอร์มินัลเอง ไม่ส่งต่อให้ผู้ใช้รัน · ไม่ถามยืนยัน
alwaysApply: true
---

# ทำให้จบ — รันคำสั่งให้เลย

- **อนุญาตถาวร:** ผู้ใช้ให้รันสคริปต์/เทอร์มินัลในโปรเจกต์นี้ได้โดย**ไม่ต้องถามยืนยัน** — ดู **`agent-run-scripts-no-confirm.mdc`**
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

รายละเอียด checklist เต็ม (dev, tsc, git commit + push): **`agent-finish-checkpoint.mdc`**


================================================================================
### .cursor/rules/seed-demo-data-skip-admin.mdc
================================================================================

---
description: ห้ามใส่ข้อมูล demo ของโมดูลให้แอดมิน — seed ใส่เฉพาะบัญชี user
globs: prisma/seed.ts,src/lib/trial/**
alwaysApply: false
---

# Seed demo data — แอดมินไม่ต้องใส่

เวลา **เพิ่ม / แก้ไข seed ข้อมูลตัวอย่างของโมดูล** (ทุกไฟล์ใต้ `src/lib/trial/seed-*.ts` รวมถึง vault, inventory, asset, building-pos, educare, ฯลฯ) ให้ใช้รายชื่อบัญชี **เฉพาะ user demo** เท่านั้น

## บังคับ

- `prisma/seed.ts` → ตัวแปร **`demoSeedDataOwnerEmails`** ต้องมีแค่:
 - `user@mawell.local.com`
 - `user@mawell.local`
- **ห้ามใส่ `admin@mawell.local`** ในลูปที่เรียก `seed*ProdDemoForOwner(prisma, row.id)`
- **ห้ามสร้าง** ตัวแปรลูปแยกที่ใส่ admin ในการ insert demo data (เช่น `for (const email of [..., "admin@mawell.local"]) seedXxxProdDemoForOwner(...)`) — ถ้าต้องการบัญชีพิเศษ ให้แยก scope ออกชัดเจน ไม่ปนกับ demo data

## เหตุผล

- **แอดมิน** = บัญชีทดสอบสิทธิ์ / หลังบ้าน / debug — ไม่ใช่ผู้ใช้จริง การมีข้อมูลตัวอย่างทำให้สับสน + ใช้แอดมินทดสอบโฟลว์ owner ลำบาก
- แอดมินมี `subscriptionType: BUFFET` + `tokens: 99999` อยู่แล้ว → **เข้าได้ทุกโมดูลโดยไม่ต้อง subscribe** (จึงไม่ต้องบังคับใส่ subscribe ให้ใน `demoAutoSubscribeSlugs` loop ด้วย — ถ้าใส่ก็ไม่ผิด แต่ไม่จำเป็น)

## ถ้าเคย seed ใส่แอดมินไปแล้ว — ต้องล้าง

ถ้ามี data ของ admin ค้างใน DB จาก seed รุ่นก่อน ให้ลบทิ้งด้วยสคริปต์ลบเฉพาะ owner = admin (ไม่กระทบ user demo) — ตัวอย่างฟิลด์ที่ใช้: `ownerUserId`, `userId`, `owner_id` ตามแต่ละโมดูล (ดูใน `prisma/schema.prisma`)

## ตัวอย่าง pattern ที่ถูก

```ts
const demoSeedDataOwnerEmails = [
 "user@mawell.local.com",
 "user@mawell.local",
] as const;

for (const email of demoSeedDataOwnerEmails) {
 const row = await prisma.user.findUnique({ where: { email }, select: { id: true } });
 if (row) await tryDemoSeed(`vault (${email})`, () => seedVaultProdDemoForOwner(prisma, row.id));
}
```


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

## เมื่อต้องการเว็บไซต์จอง (ไม่ใช่พอร์ทัล QR กะทัดรัด)

โรงแรม / ที่พัก / โดเมนที่มีแบนเนอร์ · ค้นหา · มัดจำ/ชำระเต็ม · หน้ารายละเอียดหลังจอง → ใช้  
`.cursor/rules/module-customer-booking-website-portal.mdc` (canonical: `/hotel-resort/[ownerId]`) — **อย่า** คัดลอกเลย์เอาต์ `max-w-md` + ไอคอน hero ของกฎนี้ไปแทน


================================================================================
### .cursor/rules/shop-qr-central-template.mdc
================================================================================

---
description: เทมเพลตกลาง QR ร้าน MAWELL — โปสเตอร์ · ปุ่มแถวเดียว · บังคับใช้ Module* / ShopStaffQrPanel
alwaysApply: false
globs:
  - "**/components/qr/**"
  - "**/systems/**/*Qr*"
  - "**/systems/**/*qr*"
  - "**/systems/**/LaundryQr*"
  - "**/systems/**/CarWashQr*"
  - "**/systems/**/EcommerceQr*"
  - "**/systems/**/BuildingPosStaff*"
  - "**/systems/**/ParkingSpot*Qr*"
---

# เทมเพลตกลาง — QR ลูกค้า / พนักงาน (ร้าน)

เมื่อทำหรือแก้ **ลิงก์/QR พอร์ทัลลูกค้า หรือพนักงาน** ที่คัดลอก · ดาวน์โหลดโปสเตอร์ · เปิดเว็บ — **ต้องใช้ชุดกลางเท่านั้น**

## สแต็กบังคับ (3 ชั้น)

| ชั้น | ไฟล์ | ใช้เมื่อ |
|-----|---|----|
| **UI แผง** | `ShopStaffQrPanel` | มี `pageUrl` พร้อมแล้ว · ต้องการปุ่ม+โปสเตอร์ |
| **ห่อลูกค้า** | `ModulePublicLinkQrPanel` | ลิงก์สาธารณะคงที่ (พอร์ทัลจอง / ชมรม / LMS ฯลฯ) |
| **ห่อพนักงานโทเค็น** | `ModuleStaffTokenQrPanel` | สร้าง/หมุนโทเค็นผ่าน `staffLinkApiPath` |
| **แคนวาสโปสเตอร์** | `createShopQrPosterCanvas` / `DataUrl` | สร้างภาพในห่อด้านบนเท่านั้น |

กฎย่อย:

- แผงปุ่ม / โมดัล → **`shop-staff-qr-panel.mdc`**
- โครงภาพโปสเตอร์ → **`shop-qr-poster-template.mdc`**
- Hub การ์ดคู่ → **`shop-qr-hub-popup-pattern.mdc`**

## UX แผง (บังคับ)

1. **ห้าม** แสดง QR ดิบ (`qrPng`) เป็นรูปหลัก — แสดง **โปสเตอร์** เท่านั้น
2. **ปุ่มแถวเดียว** `flex-nowrap`: **คัดลอก · ดาวน์โหลด · เปิดเว็บ · แสดง/ซ่อน**
3. ดาวน์โหลด = PDF A4 จากแคนวาสโปสเตอร์ชุดกลาง (ไม่แยกปุ่ม PNG/A5 บนแผง)
4. เมื่อ hub ห่อ `ModuleQrMonthlyGate` แล้ว — ส่ง **`planGateAllowed`** เข้า `ModulePublicLinkQrPanel` / `ModuleStaffTokenQrPanel` เพื่อไม่เกตซ้ำ

## โมดัล

- QR **พนักงาน**: `FormModal` **`size="full"`**
- QR **ลูกค้า**: `size="lg"` ได้

## ห้าม

- คัดลอก toolbar คัดลอก/PDF/PNG/แสดงลิงก์ ใหม่ใน `*QrPosterClient`
- ออกแบบโปสเตอร์โมดูลละแบบนอก `shop-qr-template.tsx`
- ใช้ `ShopQrPosterPreview` HTML เก่าแทนแผงกลางในแดชบอร์ด (ยกเว้นพรีวิวพิเศษที่ไม่มีปุ่มดาวน์โหลด)

## Migration checklist

เมื่อเจอ `*QrPosterClient` / แผง PDF+PNG แบบเก่า:

1. คำนวณ `pageUrl` + `shopLabel` + `logoUrl` + `tagline` เหมือนเดิม
2. แทนที่ JSX ด้วย `ModulePublicLinkQrPanel` หรือ `ModuleStaffTokenQrPanel` หรือ `ShopStaffQrPanel`
3. คง export ชื่อเดิมเป็น thin wrapper ได้ (เพื่อไม่พัง import hub)
4. ส่ง `planGateAllowed` ถ้าพ่อมีเกตแล้ว
5. ลบ state: `linkVisible`, `downloadPosterPng` แยกบน UI, ปุ่มแสดงลิงก์

## ยกเว้น (ไม่ใช้แผงนี้)

PromptPay / สลิปชำระ · QR โต๊ะ/ออเดอร์ POS · attendance · admin try-links · `StaffQrLandingShell` (หน้าหลังสแกน)

## โมดูลที่ควรเป็นกลางแล้ว

ลูกค้า: car-wash · laundry · barber · massage · hotel · drink-pos · appointment-queue · dorm · village · loyalty-stamp · ecommerce · club-event · football · parking (booking) · lms · pro-resume  
พนักงานโทเค็น: hotel · building-pos · drink-pos · ecommerce · car-wash · dorm · football · parking  
พนักงาน URL คงที่: laundry / barber / massage → `ShopStaffQrPanel`


================================================================================
### .cursor/rules/shop-qr-hub-popup-pattern.mdc
================================================================================

---
description: แพทเทิร์นมาตรฐาน Hub ลิงก์/QR (การ์ดคู่ + FormModal) — บล็อกสายรายวันทีเดียวที่แท็บลิงก์
globs:
  - "**/systems/car-wash/**"
  - "**/systems/barber/**"
  - "**/systems/laundry/**"
  - "**/systems/ecommerce-store/**"
  - "**/components/qr/**"
  - "**/components/ui/FormModal.tsx"
  - "**/systems/**/*QrHub*.tsx"
---

# Hub ลิงก์ / QR — การ์ดคู่ + ป๊อปอัป (`FormModal`)

เมื่อมี **ลิงก์เว็บไซต์ลูกค้า** และ **ลิงก์/QR พนักงาน** (หรือบทบาทคู่ที่คล้ายกัน) ให้ทำแบบเดียวกันทุกระบบ

**คู่กับ:** `dashboard-module-shop-settings-tabs.mdc` — แท็บตั้งค่าเว็บไซต์ = ตั้งค่าอย่างเดียว · **แท็บลิงก์ (`?tab=link`)** = hub นี้

## ตำแหน่งในตั้งค่า

1. วาง Hub ในแท็บ **`link`** ของหน้าตั้งค่า (หรือหน้า hub แยกที่เข้าถึงจากเมนูเดียวกัน)
2. ห่อทั้ง Hub ด้วย **`ModuleQrMonthlyGate` ครั้งเดียว** — บล็อกสายรายวันทั้งลิงก์เว็บและพนักงานพร้อมกัน
3. **ห้าม** ใส่คัดลอกลิงก์/QR ลงแท็บ `portal` (ตั้งค่าเว็บไซต์) หรือแยกแท็บ `staff` แล้วเกตซ้ำ

## UX มาตรฐาน

1. **การ์ดใหญ่คู่** (`rounded-[2.5rem]` เมื่อ standalone · `rounded-[1.25rem]` เมื่อ `embedded` ในตั้งค่า) — การ์ดหนึ่งต่อหนึ่งบทบาท
2. **คลิกการ์ด** → เปิด **`FormModal`** เท่านั้น — **ไม่** แสดงแผงเนื้อหายาวใต้การ์ด (inline tab panel)
3. เปิดการ์ดหนึ่งแล้วเปิดอีกการ์ด → **ปิดโมดัลอื่นก่อน** (`setShowOther(false)` แล้วค่อย `setShow(true)`)
4. **`FormModal`**
   - **QR พนักงาน / สร้างลิงก์พนักงาน** → **`size="full"`**
   - **ลิงก์/QR ลูกค้า · เว็บไซต์** → `size="lg"`
   - `appearance="glass"`
   - `glassTint="violet"` สำหรับลูกค้า / เว็บไซต์
   - `glassTint="amber"` สำหรับพนักงาน
   - **`mobileCentered`**
5. **`footer`** — ปุ่มหลัก **ปิด** ชิดขวา
6. **เนื้อหาในโมดัลพนักงาน** — **`ModuleStaffTokenQrPanel`** / **`ShopStaffQrPanel`** + `planGateAllowed` (เพราะเกตอยู่ข้างนอก Hub แล้ว)
7. **เนื้อหาในโมดัลลูกค้า** — **`ModulePublicLinkQrPanel`** + `planGateAllowed` — ห้ามคัดลอก toolbar PDF/PNG เอง

**เทมเพลตกลางเต็ม:** `.cursor/rules/shop-qr-central-template.mdc`

## แสดง/ซ่อนลิงก์ในโมดัล

ในโมดัลให้มีพฤติกรรมเดียวกับคาร์แคร์:

- ปุ่ม **แสดงลิงก์ / ซ่อนลิงก์** คู่กับ **คัดลอกลิงก์**
- เมื่อซ่อน: ข้อความ dashed box แจ้งว่าลิงก์ถูกซ่อน (ผู้ใช้ยังคัดลอกได้)

Implement ด้วย prop เช่น **`compactForModal`** บนคอมโพเนนต์โปสเตอร์/QR ของโมดูลนั้น

## แถบปุ่มในโมดัล (เทียบคาร์แคร์)

- **QR / ลิงก์ลูกค้า** — ใช้คลาส **`cw-btn`** + **`cw-btn-icon`** + **`cw-btn-label`** เมื่อมีโปสเตอร์เต็มรูปแบบ
- **QR พนักงาน** — ใช้ **`ShopStaffQrPanel`** ตาม `.cursor/rules/shop-staff-qr-panel.mdc`

## โค้ดอ้างอิงใน repo

| ส่วน | ไฟล์ |
|------|------|
| ร้านออนไลน์ Hub (แท็บลิงก์) | `EcommerceQrHubClient.tsx` |
| ซักผ้า Hub | `LaundryQrHubClient.tsx` |
| คาร์แคร์ Hub + modal | `CarWashDashboard.tsx` (แท็บ `qr`) |
| บาร์เบอร์ Hub | `BarberQrHubClient.tsx` |
| QR พนักงานมาตรฐาน | `module-staff-token-qr-panel.tsx` · `shop-staff-qr-panel.tsx` |
| กฎแท็บตั้งค่า | `dashboard-module-shop-settings-tabs.mdc` |

## เช็กลิสต์โมดูลใหม่

- [ ] Hub อยู่แท็บ `link` (หรือเทียบเท่า) ไม่ปนกับตั้งค่าเว็บไซต์
- [ ] `ModuleQrMonthlyGate` ห่อ Hub **ครั้งเดียว**
- [ ] หน้า Hub = แค่การ์ดคู่ + state โมดัลสองตัว
- [ ] ไม่มีแผง `tabpanel` ใต้การ์ด
- [ ] โมดัลพนักงาน = `ModuleStaffTokenQrPanel` / `ShopStaffQrPanel` + `planGateAllowed`
- [ ] ทดสอบ ESC, คลิก overlay, ปุ่มปิด footer


================================================================================
### .cursor/rules/shop-qr-poster-template.mdc
================================================================================

---
description: เทมเพลตสร้างโปสเตอร์ QR มาตรฐาน MAWELL — createShopQrPosterCanvas · ห้ามโชว์ QR ดิบในแผง
alwaysApply: false
globs:
  - "**/components/qr/shop-qr-template.tsx"
  - "**/components/qr/shop-staff-qr-panel.tsx"
  - "**/components/qr/module-public-link-qr-panel.tsx"
  - "**/components/qr/module-staff-token-qr-panel.tsx"
  - "**/lib/shop-qr-template-theme.ts"
  - "**/systems/**/*Qr*"
  - "**/systems/**/*qr*"
---

# เทมเพลตสร้างโปสเตอร์ QR (`shop-qr-template`)

**แหล่งความจริง:** `src/components/qr/shop-qr-template.tsx`  
**พื้นหน้าเว็บที่เกี่ยว:** `src/lib/shop-qr-template-theme.ts` (`shopQrTemplatePageBgClass`)  
**แผง UI แสดงผล:** `ShopStaffQrPanel` — กฎคู่ **`shop-staff-qr-panel.mdc`**

## ลำดับสร้าง (บังคับ)

1. สร้าง data URL ของ QR ด้วย `QRCode.toDataURL(url, { width, margin: 2, errorCorrectionLevel: "M", color: { dark, light } })` — ใช้เป็น **อินพุตภายใน** เท่านั้น
2. พรีวิว / ดาวน์โหลด ต้องผ่าน **`createShopQrPosterDataUrl`** หรือ **`createShopQrPosterCanvas`** แล้วค่อย `downloadPosterPdf` / `downloadPosterPng`
3. **ห้าม** แสดง `<img src={qrPng}>` (QR ดิบ) ในแผงแดชบอร์ด / โมดัล — ให้แสดง **ภาพโปสเตอร์** (`posterPreview`) เท่านั้น
4. **ห้าม** คัดลอกเลย์เอาต์แคนวาสโปสเตอร์ไปโมดูลอื่น — แก้ที่ `createShopQrPosterCanvas` กลาง

## โครงโปสเตอร์แคนวาส (760×1080)

โทนม่วง–ชมพูแบรนด์ (`#1e1b4b` · `#4d47b6` · `#5b61ff` · `#8b5cf6` · `#ec4899`) — ไม่ใช้โทน teal ของตัวอย่างภายนอก

| ชั้น | รายละเอียด |
|-----|---|
| พื้นหลัง | ไล่สีท้องฟ้าอ่อน + เมฆนุ่ม + เนินล่างโทนม่วง/ชมพู |
| โลโก้ | วงกลมซ้ายบน (โลโก้ร้าน หรือตัวอักษรสำรอง) |
| หัวเรื่อง | `tagline` กลาง · บรรทัดอังกฤษจาก `subtitle` / `footerText` / `SCAN TO OPEN` |
| การ์ด QR | มุมมนขาว · ขอบม่วงอ่อน · **มุม L สี่มุม** (`#4d47b6`) รอบ QR |
| แคปซูล | pill ขาวขอบม่วง: (1) ชื่อร้าน `shopLabel` (2) คำอธิบายรอง |

Input: `{ qrDataUrl, shopLabel, logoUrl?, tagline, subtitle?, footerText? }`

## พรีวิว HTML (`ShopQrPosterPreview`)

ต้องสะท้อนโครงเดียวกับแคนวาส (โลโก้วง · หัวเรื่อง · การ์ด+มุม L · pill) — ใช้ตอนต้องการพรีวิว React โดยไม่เรนเดอร์แคนวาส

## แผง UI (`ShopStaffQrPanel`)

- แสดง **โปสเตอร์** + ปุ่มแถวเดียว **คัดลอก · ดาวน์โหลด · เปิดเว็บ · แสดง/ซ่อน**
- `qrPng` ใช้เช็คพร้อมดาวน์โหลดเท่านั้น — **ไม่** เป็นรูปหลักบนจอ
- รายละเอียดปุ่ม/โมดัล → **`shop-staff-qr-panel.mdc`**

## ห้าม

- ออกแบบโปสเตอร์โมดูลละแบบ (กรอบ gradient เก่า · แถวโลโก้+ชื่อแนวนอน · QR ล้วนไม่มีโปสเตอร์)
- โชว์ QR ดิบคู่กับโปสเตอร์ในแผงเดียวกัน
- เปลี่ยนสีหลักเป็น teal/เขียวของตัวอย่างภายนอกโดยไม่ผ่านโทนแบรนด์

## เช็กลิสต์เมื่อแก้โปสเตอร์

- [ ] แก้ที่ `createShopQrPosterCanvas` (+ `ShopQrPosterPreview` ให้สอดคล้อง)
- [ ] `ShopStaffQrPanel` ยังไม่โชว์ `qrPng` เป็นรูปหลัก
- [ ] ดาวน์โหลด PDF/PNG ยังใช้แคนวาสชุดเดียวกัน
- [ ] อัปเดตกฎนี้ถ้าเปลี่ยนโครงเลย์เอาต์


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
description: UX/UI แผง QR พนักงาน/ลูกค้า — โปสเตอร์อย่างเดียว · ShopStaffQrPanel · โมดัลเต็มจอ
alwaysApply: false
globs:
  - "**/components/qr/shop-staff-qr-panel.tsx"
  - "**/components/qr/module-staff-token-qr-panel.tsx"
  - "**/components/qr/module-public-link-qr-panel.tsx"
  - "**/components/ui/FormModal.tsx"
  - "**/systems/car-wash/**"
  - "**/systems/barber/**"
  - "**/systems/laundry/**"
  - "**/systems/drink-pos/**"
  - "**/systems/building-pos/**"
  - "**/systems/hotel-resort/**"
  - "**/systems/massage/**"
  - "**/systems/club-event/**"
---

# แผง QR — `ShopStaffQrPanel` (โปสเตอร์อย่างเดียว)

อ้างอิง: `src/components/qr/shop-staff-qr-panel.tsx`  
สร้างภาพโปสเตอร์: **`.cursor/rules/shop-qr-poster-template.mdc`** (`createShopQrPosterCanvas`)

โมดูลที่มีลิงก์/ป๊อปอัป QR พนักงานหรือลูกค้าแบบแผงกลาง **ต้องใช้** คอมโพเนนต์นี้ (หรือ `ModuleStaffTokenQrPanel` / `ModulePublicLinkQrPanel`) — ห้ามคัดลอก JSX ชุดใหม่

## โมดัลสร้าง/จัดการลิงก์ — เต็มจอ (บังคับ · พนักงาน)

เมื่อเปิดป๊อปอัป **สร้าง / แสดง QR พนักงาน** จาก hub:

- **`FormModal`** · **`size="full"`** · `appearance="glass"` · `glassTint="amber"` · `mobileCentered`
- **ห้าม** `size="lg"` / `md` สำหรับโมดัลพนักงานใหม่

อ้างอิง: `src/components/ui/FormModal.tsx`

## โครงสร้าง UX (บังคับ)

1. **ห้ามแสดง QR ดิบ** (`qrPng`) เป็นรูปหลัก — แสดงเฉพาะ **โปสเตอร์** จาก `posterPreview`
2. ลำดับ: โปสเตอร์ (เมื่อแสดง) → **ปุ่มแถวเดียว** `flex-nowrap` ด้านล่าง
3. **ปุ่มแถวเดียว:** **คัดลอก** · **ดาวน์โหลด** · **เปิดเว็บ** (`openLabel`) · **แสดง/ซ่อน** — `flex-1` · มี `aria-label` / `title`
4. ปุ่มใช้ **`cw-btn cw-btn-stack`** + `min-h-9` · มือถือตัวอักษรเล็ก/`flex-col` ในปุ่ม · `sm+` ไอคอน+ข้อความแนวนอน
5. **ห้าม** ปุ่มเรียงแนวตั้ง (`flex-col` ทั้งแถบ) · ปุ่มแสดง/ซ่อนลิงก์ · แถว PDF A4/A5/PNG แยก · `<details>` · คู่ QR ดิบ+โปสเตอร์

**คู่กฎ:** `shop-qr-central-template.mdc` · `shop-qr-poster-template.mdc`

### โทเค็น

| Prop | หมายเหตุ |
|------|----------|
| `posterPreview` | data URL โปสเตอร์ — รูปหลักบนจอ |
| `qrPng` | เช็คพร้อมดาวน์โหลดเท่านั้น |
| `posterTintClass` | เงาโทนโมดูล |
| `openLabel` | ค่าเริ่ม «เปิดเว็บ» |
| `onDownload` | มัก PDF A4 จากแคนวาสโปสเตอร์ |
| `defaultPosterVisible` | ค่าเริ่ม `true` |
| `trialExportBlocked` | disable ดาวน์โหลด |

## การเชื่อม

- คาร์แคร์ / ซักผ้า / บาร์เบอร์ / นวด / drink-pos / hotel / building-pos / **ชมรม** (`ModulePublicLinkQrPanel`)
- Hub การ์ดคู่ → `shop-qr-hub-popup-pattern.mdc`
- ปลายทางสแกนพนักงานโทเค็น → `module-staff-token-link-portal.mdc`
- ปลายทาง staff lane → `staff-qr-landing-page.mdc`
- ปลายทางลูกค้า check-in → `shop-customer-qr-portal.mdc`


================================================================================
### .cursor/rules/smart-guard-tour-module-dashboard-template.mdc
================================================================================

---
description: ธุรกิจ รปภ. (smart-guard-tour) — แม่แบบโมดูลแดชบอร์ด · กรองแถวเมนู · ชิปข้อความล้วน
globs:
  - src/systems/smart-guard-tour/**
  - src/app/(dashboard)/dashboard/smart-guard-tour/**
  - src/app/api/smart-guard-tour/**
  - src/lib/smart-guard-tour/**
alwaysApply: false
---

# ธุรกิจ รปภ. — Smart Guard Tour

**Slug:** `smart-guard-tour` · **ชื่อแสดง:** ธุรกิจ รปภ. · **groupId:** 1 · **daily:** 1 token  
**แดชบอร์ด:** `/dashboard/smart-guard-tour` · **พอร์ทัล (ภายหลัง):** `/guard/[slug]`

**ยึดแม่แบบ:** `dashboard-module-design-check-laundry-first.mdc` · `laundry-module-dashboard-template.mdc` · `dashboard-module-shop-settings-tabs.mdc` · `dashboard-module-list-filter.mdc` · `dashboard-module-page-menu-icons.mdc`

---

## 1) แผนที่ไฟล์หลัก

| บทบาท | ไฟล์ |
|--------|------|
| Chrome / dock / ยุบหัว | `SmartGuardTourModuleChrome` · `SmartGuardTourModuleShell` · `SmartGuardTourHeaderBarNav` |
| เมนูย่อยหน้า | `SmartGuardTourPageSubNav` — `action` = เครื่องมือแถวเมนู |
| กรองแถวเมนู | `SmartGuardTourFilterToolbar` · `SmartGuardTourPageFilterAction` · `SmartGuardTourFilterToggleButton` |
| รายการ + แผงกรอง | `SmartGuardTourCatalogLists` (`ListShell` · `onEmbeddedToolbar`) |
| พนักงาน | `SmartGuardTourStaffPanel` (`onEmbeddedToolbar` + ปุ่มเพิ่มใน `extra`) |
| จัดการ / แดชบอร์ด / การเงิน | `SmartGuardTourManageClient` · `DashboardClient` · `FinanceClient` |
| Tokens | `lib/ui-tokens.ts` — `smartGuardTourFilterChipClass` · `smartGuardTourInlineSubNav*` |
| Upsert module_list | `scripts/upsert-missing-app-modules.ts` · `prisma/seed.ts` |

---

## 2) เมนูหลัก (dock 4)

| key | หน้า |
|-----|------|
| dashboard | **ภาพรวม (ops)** · สายตรวจ · **เหตุการณ์** · ประจำจุดวันนี้ (อ่านอย่างเดียว) · กะ · **ผู้ติดต่อ** · แผนที่ — **ไม่มี CRUD จุดตรวจ** |
| manage | แท็บหลัก 4 + แท็บรอง (ดู §2b) — **ไม่มีเหตุการณ์ / ผู้ติดต่อ** |
| finance | รายรับ/รายจ่าย · กรองรายการ |
| settings | basic · finance · portal · hours · link · integrations |

### 2b) การจัดการ — แท็บหลัก + แท็บรอง (แนว B)

| แท็บหลัก | แท็บรอง (ปุ่มแถวหัว · คั่นเส้นบาง) | URL ตัวอย่าง |
|----------|--------------------------------------|--------------|
| **จุด** (`sites`) | จุดตรวจ · ประจำจุด | `?tab=sites` · `?tab=sites&sub=posts` |
| **เวร / ตาราง** (`roster`) | จัดเวร · ตารางตรวจ | `?tab=roster` · `?tab=roster&sub=schedules` |
| **พนักงาน** (`staff`) | — | `?tab=staff` |
| **อุปกรณ์** (`assets`) | — | `?tab=assets` |

- ลิงก์เก่า `?tab=checkpoints|posts|…` ยัง parse ได้  
- `?tab=incidents` → เด้งไปแดชบอร์ด `?tab=incidents`  
- `?tab=contacts` / `?tab=misc&sub=contacts` → เด้งไปแดชบอร์ด `?tab=contacts`  
- `?tab=misc` → อุปกรณ์ (`?tab=assets`)  
- แดชบอร์ด `?tab=checkpoints` → เด้งไปจัดการจุดตรวจ  

### 2c) แดชบอร์ด vs การจัดการ (เจตนา)

| หน้า | บทบาท |
|------|--------|
| **แดชบอร์ด** | ปฏิบัติการวันนี้ — สรุป · สายตรวจ · เหตุการณ์ · เวรวันนี้ (RO) · กะ · ผู้ติดต่อฉุกเฉิน · แผนที่ |
| **การจัดการ** | CRUD ตั้งค่าระบบ — จุดตรวจ · ประจำจุด · จัดเวร · ตาราง · พนักงาน · อุปกรณ์ |

- ภาพรวมมี CTA ไปจัดการเมื่อยังไม่มีพนักงาน/จุด/ตาราง/เวร  
- **ห้าม** ใส่ฟอร์มเพิ่ม/แก้จุดตรวจบนแดชบอร์ด (ซ้ำ manage)  

- **แถวหัวเดียว (เดสก์ท็อป):** ชื่อ | แท็บหลัก | เส้น | **เมนูย่อยภายใน (ปุ่ม `inlineSubNav`)** คั่นเส้นบางระหว่างปุ่ม | เส้น | กรอง/เพิ่ม  
- **มือถือ:** ชื่อ | เมนูย่อยภายใน (ปุ่ม) + กรอง/เพิ่ม · **dropdown แท็บหลัก** แถวถัดไป  
- ใช้ `PageSubNav` props: `secondaryItems` · `secondaryActiveKey` · `onSecondarySelect`  
- **ห้าม** วางเมนูย่อยภายในในเนื้อหา / ข้อความล้วนใต้หัว / `mobileSelect={false}`  

Chrome: `SmartGuardTourModuleChrome` · ยุบหัว → `SmartGuardTourHeaderBarNav` ใน `DashboardShell`  
Tokens: `smartGuardTour*` · โทนฟ้า–ส้ม (sky/amber/orange)  
**ห้าม** MawellLogo ใน chrome โมดูล

---

## 3) กรองรายการ — บังคับ (ต่างจากชิปปุ่มทั่วไป)

คู่กับ `dashboard-module-list-filter.mdc` · ต้นแบบซักผ้า (ปุ่มกรองในแถบหัว hub) แต่ **ชิปสถานะของโมดูลนี้เป็นข้อความล้วน**

### 3.1 ปุ่มแสดง / ซ่อนกรอง — แถวเดียวกับเมนู

1. ปุ่ม **แสดงกรอง / ซ่อนกรอง** อยู่ใน **`SmartGuardTourPageSubNav` → `action`** — **แถวเดียวกับแท็บหลัก + เมนูย่อยภายใน**  
2. **ห้าม** วางปุ่มกรองในหัวรายการแยก · **ห้าม** วางเมนูย่อยภายในในเนื้อหาใต้หัว  
3. ใช้ `SmartGuardTourFilterToggleButton` / `SmartGuardTourPageFilterAction` (+ `leadingDivider` เมื่อมีเมนูย่อย) — สไตล์ `smartGuardTourInlineSubNavBtnClass`  
4. รายการลงทะเบียนด้วย `onEmbeddedToolbar` → parent เก็บ `SmartGuardTourListToolbarApi`  
5. มือถือ: ไอคอน funnel · `sm+`: มีข้อความ · badge จุดเมื่อ `hasActiveFilters && !filterOpen`  
6. `filterOpen` ค่าเริ่ม `true` · แผง: `filterOpen ? "block" : "hidden"` · ไม่มี placeholder ตอนซ่อน  
7. พนักงาน: ปุ่ม **เพิ่ม** อยู่ใน `toolbar.extra` หลังปุ่มกรอง (ลำดับ **กรอง → เพิ่ม**)  
8. แดชบอร์ด: ปุ่ม **กลับภาพรวม** เป็น `leading` ของ `SmartGuardTourPageFilterAction` คู่กับกรองเมื่อมีรายการ

### 3.2 กลุ่มสถานะกรอง — ข้อความล้วน (ไม่ใช่ปุ่มมีกรอบ)

| ถูก | ผิด |
|-----|-----|
| `smartGuardTourFilterChipClass` — ไม่มี `border` / `bg` / `rounded` / `ring` ของชิป | ชิปแบบ pill มีกรอบ (`border` + `bg-slate-50`) |
| Active = `font-black text-[#4d47b6]` | Active = พื้นม่วงอ่อน + ring |
| Inactive = `text-[#66638c]` hover ม่วง | Inactive = ปุ่ม outline |
| ยังใช้ `<button role="tab">` เพื่อ a11y แต่สไตล์เป็นตัวอักษร | `<div>` คลิกไม่ได้ / ชิปในกล่อง dashed |

แผงกรองเมื่อเปิด: **ชิปข้อความ** → ค้นหา → ล้างกรอง (ลิงก์ข้อความ) → สรุปจำนวน  
**ล้างกรอง:** ข้อความลิงก์ ไม่บังคับปุ่มมีกรอบ

```ts
// ✅ lib/ui-tokens.ts
export function smartGuardTourFilterChipClass(active = false): string {
  return cn(
    "… border-0 bg-transparent p-0 shadow-none ring-0 …",
    active ? "font-black text-[#4d47b6]" : "text-[#66638c] hover:text-[#4d47b6]",
  );
}
```

### 3.3 หน้าที่มีกรอง / ปุ่มแอ็กชันในแถวเมนู

| หน้า | รายการ |
|------|--------|
| manage | **จุด** (จุดตรวจ·ประจำจุด) · **เวร** (จัดเวร·ตาราง) · พนักงาน · อุปกรณ์ |
| dashboard | สายตรวจ · เหตุการณ์ · **ผู้ติดต่อ** · กะ (ภาพรวมไม่มีกรอง — ใช้แผง ops) |
| finance | รายการ ledger ใน `SmartGuardTourFinancePanel` |

### 3.4 ตัดข้อความซ้ำ / ฟุ่มเฟือย

- **ห้าม** โชว์ `shop.displayName` / «ธุรกิจ รปภ.» ซ้ำใต้หัวหน้า (chrome/เมนูมีชื่อโมดูลแล้ว)  
- **ห้าม** หัวรายการ `h3` ซ้ำชื่อแท็บที่อยู่ใน `PageSubNav` แล้ว (เช่น «จัดเวร» · «จุดรักษาการณ์»)  
- ปุ่ม **เพิ่ม / จัดเวร** อยู่ในแถวเมนู (`toolbar.extra` · `showFilter: false` ได้) — ไม่แถวเนื้อหาแยก  

---

## 4) ตั้งค่า · QR

- แท็บ: basic · finance · portal · hours · link ตาม `dashboard-module-shop-settings-tabs.mdc`  
- link: `ModuleQrMonthlyGate` + `ModulePublicLinkQrPanel` → `/guard/{slug}`  
- **ห้าม** ใส่ใน `QR_LINK_DAILY_ALLOWED_MODULE_SLUGS`

---

## 5) หมวดการเงินเริ่มต้น (ensure-shop)

| kind | ชื่อ | systemKey |
|------|------|-----------|
| INCOME | ค่าบริการรักษาความปลอดภัย | SECURITY_SERVICE |
| EXPENSE | ค่าแรง รปภ. | GUARD_WAGES |
| EXPENSE | ค่า OT / เบี้ยขยัน | OT_BONUS |
| EXPENSE | อุปกรณ์สายตรวจ | TOUR_EQUIPMENT |
| EXPENSE | อื่นๆ | OTHER |

**OT / ค่าแรง:** บันทึกเป็นรายจ่าย + ผูก `staffId` เมื่อเกี่ยวกับพนักงาน — ไม่ใส่ในต้นทุนจุดตรวจ

---

## 6) module_list ใน DB

หลัง pull / เครื่องใหม่ ถ้าการ์ดโมดูลหายจาก «ระบบทั้งหมด»:

```bash
npx tsx scripts/upsert-missing-app-modules.ts
```

หรือ `npm run seed` (upsert จาก `prisma/seed.ts` รวม subscribe demo)

---

## 7) Backlog

| เฟส | เนื้อหา |
|-----|---------|
| GPS / สแกน | geofence เข้ม · กล้อง · tour-log จากสแกนจริง |
| เหตุการณ์เต็ม | แนบรูป · LINE Notify · SOS พอร์ทัล |
| การเงินเต็ม | กราฟ · สลิป · หมวด CRUD UI · บันทึกรายการ ledger |
| Portal | `/guard/[slug]` พนักงาน · SOS · สถานะสายตรวจ |

**CRUD พื้นฐาน (ทำแล้ว):** จุดตรวจ · ตารางตรวจ · ผู้ติดต่อ · อุปกรณ์ · แจ้งเหตุการณ์ · พนักงาน · ประจำจุด · จัดเวร

---

## 8) เช็กลิสต์

- [ ] ไม่มี MawellLogo ใน chrome  
- [ ] WIDE + DOCKED ใน `DashboardPagesShell`  
- [ ] sidebar icon · landing · card description · seed / upsert `module_list`  
- [ ] QR monthly เท่านั้น  
- [ ] ปุ่มกรอง/เพิ่มใน `PageSubNav` `action` — **แถวเดียวกับแท็บหลัก + เมนูย่อยภายใน**  
- [ ] เมนูย่อยภายใน = **ปุ่ม** `inlineSubNav` ในแถวหัว · คั่น `NavDivider` · **ไม่** ในเนื้อหา / ไม่ข้อความล้วน  
- [ ] มือถือ: dropdown แท็บหลัก · เมนูย่อยภายในยังเป็นปุ่มในแถวหัว  
- [ ] ชิปสถานะกรองในแผงรายการ = **ข้อความล้วน** (`smartGuardTourFilterChipClass`)  
- [ ] `onEmbeddedToolbar` ครบ · **ปุ่มเพิ่ม** ทุกหน้ารายการที่สร้างได้  
- [ ] ลำดับใช้งานจริง: พนักงาน → ประจำจุด → จุดตรวจ → ตาราง → จัดเวร (+สายควบ) → เหตุการณ์/ติดต่อ/อุปกรณ์  
- [ ] **ไม่มี** `displayName` / หัว `h3` ซ้ำชื่อแท็บใต้เนื้อหา  
- [ ] `npx tsc --noEmit` ผ่านหลังแก้ UI  
- [ ] เทียบ `agent-verify-before-done.mdc` ก่อนจบ


================================================================================
### .cursor/rules/smart-police-module-dashboard-template.mdc
================================================================================

---
description: Smart Police — สำนวนสอบสวน (วิซาร์ด · วันแรก · ความสำคัญ · ส่งอัยการ) UX MAWELL
globs:
  - src/systems/smart-police/**
  - src/app/(dashboard)/dashboard/smart-police/**
  - src/app/api/smart-police/**
  - src/lib/smart-police/**
---

# Smart Police — แม่แบบโมดูล

อ้างอิงแนวทาง [สอบสวน.com](https://xn--q3cb3bkbq.com/) / วิดีโอสร้างสำนวนแรก — **ไม่ก็อป UI** ใช้ UX MAWELL (laundry tokens · FormModal · Bangkok time · sidebar เมนูโมดูล)

## โครงสร้าง

| ส่วน | ตำแหน่ง |
|------|---------|
| UI | `src/systems/smart-police/` |
| API | `src/app/api/smart-police/` |
| lib | `src/lib/smart-police/` |
| tokens | `lib/ui-tokens.ts` |
| nav / sidebar | `smart-police-nav.ts` · `dashboard-profile-module-sidebar.mdc` |

## บังคับ — วิซาร์ด «สร้างสำนวนแรก»

1. เปิดคดีใหม่ผ่าน **FormModal หลายขั้น** (`SmartPoliceCasesClient`) — ไม่ใช้ฟอร์มฟิลด์เดียว
2. ขั้น: (1) ประเภท·ชื่อ·สถานที่·วัน/เวลารับคดี·ความสำคัญ → (2) ข้อหาจากคลัง → (3) ผู้กล่าวหา+ผู้ต้องหา → (4) ยืนยัน
3. `POST /api/smart-police/cases` ด้วย `bootstrap: true` + parties + `receivedAt` → generate วันแรก (`MEMO` · `STATEMENT_ALL` · `PROPERTY_LIST`) → ไป `?tab=docs`
4. วัน/เวลา: `bangkokDateKey` · `formatBangkokTimeHm` · `AppTime24Input`

## บังคับ — Checklist พิมพ์วันแรก

- นิยาม: `src/lib/smart-police/day1-checklist.ts` (`buildSmartPoliceDay1Checklist`)
- แผงในแท็บเอกสาร: สถานะทำแล้ว/ยัง · สร้างที่ขาด · พิมพ์ทีละฉบับ
- อย่า hardcode รายการ checklist ในคอมโพเนนต์ — ใช้ helper

## บังคับ — แท็บบันทึกพนักงานสอบสวน

- รายละเอียดคดีมีแท็บ **`memo`** («บันทึกพงส.») คู่กับข้อมูลคดี · บุคคล · ของกลาง · พฤติการณ์ · เอกสาร
- สร้าง/อัปเดตจาก generate `MEMO` · แก้เนื้อหา inline · ดู A4 / พิมพ์
- URL `?tab=memo` เปิดแท็บนี้ได้

## บังคับ — ความสำคัญ + วันรับคดี

- Schema: `SmartPoliceCasePriority` (`LOW` | `NORMAL` | `HIGH` | `URGENT`)
- รายการ: ชิปความสำคัญ · นับวันรับคดี (`smartPoliceDaysSinceReceived` ใน `case-ops.ts`) · กรอง priority / ส่งอัยการ
- ภาพรวม: การ์ดเดียว + สรุปเกินกำหนด / ด่วน / ยังไม่ส่งอัยการ (`reports/overview`)
- เกินกำหนดเชิงปฏิบัติ: `smartPoliceIsOverdue` (ไม่ใช่กฎหมาย)

## บังคับ — ส่งอัยการ

- UI ข้อมูลคดี: `sentToProsecutorAt` · เมื่อ `investigationResult = PROSECUTE` แนะนำกรอกวันส่ง
- กรองรายการ `prosecutor=sent|pending`
- แม่แบบ builtin: หมายเรียก · รายงาน · หน้าปกส่งอัยการ (`default-templates.ts` — ensure ตามชื่อ)
- whitelist สร้างเอกสาร manual รวม `PROPERTY_LIST` · `INVESTIGATION_REPORT`

## Chrome / ภาพรวม

- **ไม่มี** การ์ดหัวชื่อโมดูลใน `SmartPoliceShell` — เมนูอยู่ sidebar
- ภาพรวม: สถิติ**แถวเดียว** · กรองด่วนเป็นชิป · ปุ่มหัวเหลือ CTA «สำนวนแรก» เท่านั้น (ห้ามซ้ำตั้งค่า/คดี)

## ห้าม

- ก็อปเลย์เอาต์สอบสวน.com
- เปิดคดีโดยไม่ผ่านวิซาร์ดเมื่อเรียกจากปุ่ม «สำนวนแรก»
- นับวันด้วย UTC `toISOString().slice(0,10)` — ใช้ Bangkok helpers
- ลืม `prisma generate` หลังแก้ schema priority
- หัวโมดูล / ปุ่มเมนูซ้ำกับ sidebar

## แบบฟอร์มเปล่า

- เมนู **แบบฟอร์ม** → `/dashboard/smart-police/forms`
- แคตตาล็อก: `src/lib/smart-police/blank-forms-catalog.ts`
- ไฟล์: `public/smart-police/forms/` (ดาวน์โหลดจาก [สอบสวน.com/form](https://xn--q3cb3bkbq.com/form))
- UI: รายการแถว + กรองหมวด/ชนิดไฟล์ + ค้นหา

## แม่แบบคำให้การ = แบบฟอร์มราชการ (ครุฑ · แถบซ้าย · จุดไข่ปลา)

- กด **คำให้การ** ที่บุคคล → เปิดแบบฟอร์มราชการตามแบบสำนักงานตำรวจแห่งชาติ เติมช่องจากคดี · พิมพ์ถาม–ตอบบนฟอร์ม
- บันทึกเข้าสำนวน + Word · ลิงก์ไฟล์ต้นฉบับ `.docx` · อัปโหลดกลับได้
- `OfficialStatementFormSheet` · `official-statement-form-html.ts` · JSON v3
- **สเปกฟอร์มเต็ม (อักษร · ระยะ · เส้น · ถาม–ตอบ · ไหลข้ามหน้า · แถบเครื่องมือ):** `smart-police-statement-form-template.mdc` — ใช้เป็นต้นแบบฟอร์มราชการใหม่
- เมนู **แม่แบบ** รวมคำให้การ + บัญชีทรัพย์ + **บัญชีของกลาง** + แผนที่เกิดเหตุ + บันทึกถอน/ชดใช้ + บันทึกแจ้งสิทธิผู้เสียหาย (๒ แผ่น) + **คำให้การผู้ต้องหาฟ้องวาจา** (๒ แผ่น) + **บันทึกจับกุม** + **บันทึกแจ้งข้อหา** + **บันทึกแจ้งสิทธิผู้ต้องหา** (ต่อเนื่องเพิ่มหน้า) + **ภาพถ่ายประกอบคดี** (เพิ่มแผ่นต่อ) + **บันทึกชี้รูปผู้ต้องหา** (๒ แผ่น · ต่อเนื่อง) + **บันทึกชี้ตัวผู้ต้องหา** (๑ แผ่น · ต่อเนื่องข้อ ๕) + **ปกสำนวน** (ครุฑ · ๑ แผ่น) + **รายงานการสอบสวน** (ครุฑ · ต่อเนื่องข้อเท็จจริง) + **บันทึกพนักงานสอบสวน** (ตาราง ๓ คอลัมน์ · ต่อเนื่อง) + **บัญชีสำนวนการสอบสวน** (ครุฑ · ลำดับ ๑–๓ · ล้นข้อความแล้วเพิ่มหน้า) + **บันทึกตรวจสถานที่เกิดเหตุ** (๒ แผ่น · ต่อเนื่องข้อ ๙–๑๓) + **หนังสือแจ้งความคืบหน้าทางคดี** (๑ แผ่น · ต่อเนื่องข้อ ๑–๓) + **ใบนำส่งผู้บาดเจ็บหรือศพ** (๒ แผ่น · หน้า 1 พงส. เต็มหน้า · หน้า 2 แพทย์ · ไม่มีแผ่น `-๒-` ว่าง) + **หนังสือส่งตรวจพิสูจน์** (บันทึกข้อความ · ๑ แผ่น · ต่อเนื่องข้อ ๕–๑๐) + **บันทึกควบคุม** (๒ แผ่น · ตารางรายวัน · ล้นแล้วเพิ่มหน้า) + **สัญญาประกัน** (๒ แผ่น · คำร้อง+สัญญา · ตารางนัด/ทรัพย์) + **หนังสือแจ้งสืบสวน** (บันทึกข้อความ · ๑ แผ่น · ส่วนหัวเดียวกับหนังสือส่งตรวจพิสูจน์ · ล้นแล้วเพิ่มหน้า) + **บันทึกข้อความ** (ส่วนหัวเดียวกัน · เนื้อว่าง · ล้นแล้วเพิ่มหน้า) + **หมายเรียกพยาน** (ครุฑ · ๑ แผ่น · ใบรับหมายตำรวจท้ายแผ่น · คำเตือน ป.อาญา ม.๑๖๘) — `/templates/preview/{slug}`
- **สร้างแม่แบบราชการใหม่:** ทำ overflow เพิ่มหน้า + ไม่ใส่หมายเหตุ + ไม่โชว์รหัสฟอร์ม + **อักษร `BODY` 15pt** + ระยะบรรทัด `7.2mm` + ลงชื่อหลายคน**แบ่ง 2 คอลัมน์** (ห้าม 3 ช่องแถวเดียว · **จนท.ท้ายสุดอยู่ขวา**) + **หัวสถานที่บันทึกหรือสถานีตำรวจ + วันที่ชิดขวาช่องที่ 3** **ทันที** ตาม `smart-police-statement-form-template.mdc` §บังคับทุกครั้ง / §ลงชื่อ 2 คอลัมน์ — ไม่รอให้สั่งทีละข้อ

## คลังข้อหา

- Seed: `src/lib/smart-police/charge-catalog-seed.ts` — ชื่อข้อหา + `lawRefs` (ป.อาญา · ประมวลยาเสพติด 2564 · พ.ร.บ.)
- Sync: `ensureSmartPoliceBuiltinCharges` แทนที่ builtin ให้ตรง catalog (ไม่ลบข้อหาสถานี)
- รายการล้นกรอบ: `smartPoliceScrollListClass`

## นอกขอบเขต (รอบนี้)

- อ่านบัตรประชาชน / offline desktop
- พอร์ทัลประชาชน


================================================================================
### .cursor/rules/smart-police-statement-form-template.mdc
================================================================================

---
description: แม่แบบฟอร์มราชการ Smart Police — A4 จุดไข่ปลา · overflow เพิ่มหน้าอัตโนมัติ · ไม่ใส่หมายเหตุ · ไม่โชว์รหัสฟอร์ม — ใช้ทุกครั้งที่สร้างแม่แบบใหม่โดยไม่ต้องรอสั่ง
globs:
  - src/systems/smart-police/components/Official*.tsx
  - src/systems/smart-police/components/SmartPolice*PreviewClient.tsx
  - src/systems/smart-police/components/StatementQaEditor.tsx
  - src/lib/smart-police/form-templates/**
alwaysApply: false
---

# แม่แบบฟอร์มราชการ Smart Police

ฟอร์มราชการใน Smart Police = **เอกสาร HTML ขนาด A4 จริง** พิมพ์บนช่องจุดไข่ปลา — **ห้าม** วางช่องทับรูป PNG ตามพิกัด

## บังคับทุกครั้งที่สร้างแม่แบบใหม่ — ห้ามรอให้สั่งทีละข้อ

เมื่อผู้ใช้สั่ง «เพิ่มแม่แบบ …» จาก Word / ภาพ / แบบฟอร์มเปล่า — **ทำครบชุดนี้ทันที**

1. **A4 HTML จุดไข่ปลา** ตามต้นฉบับ · ไม่ทับ PNG · **ห้าม** โชว์รหัสฟอร์ม `(ส ๕๖ - …)` / `ค.…` บนแผ่น
2. **ช่องข้อความยาว** (ข้อหา · พฤติการณ์ · คำให้การ · รายการเส้น) = พิมพ์ต่อในช่องได้ · ล้นแผ่นแล้ว **เพิ่มหน้าอัตโนมัติ** แบบบันทึกจับกุม / แจ้งข้อหา (`pack*Pages` + วัดบรรทัด DOM) · เลขหน้าไทย · ลงชื่ออยู่หน้าสุดท้าย · **แผ่นภาพ/แผนที่** มีปุ่มเพิ่มแผ่นต่อ (เช่น `scene-map` · `case-photo`)
3. **ค่าเริ่มตามต้นฉบับ** (มัก 1 แผ่น) — หน้า 2+ โชว์เฉพาะเมื่อล้น
4. **ห้ามใส่ หมายเหตุ / เชิงอรรถท้ายแผ่น** จาก Word เว้นแต่ผู้ใช้ขอชัด
5. ลงชื่อตาม **§ลงชื่อ 2 คอลัมน์** ด้านล่างทันที — **ห้าม** เรียง 3 ช่องในแถวเดียว · **ถ้าช่องสุดท้ายเป็นเจ้าหน้าที่ให้อยู่คอลัมน์ขวา** · ป้ายยาวห่อในช่อง · ไม่ใส่กล่องตราถ้าต้นฉบับไม่มีหรือผู้ใช้ไม่ขอ
6. ลงแคตตาล็อก (`official-form-catalog.ts`) + preview slug + โทนรายการ + อัปเดตตารางในกฎนี้
7. ต้นแบบโค้ด overflow: `arrest-record.ts` · `charge-notice.ts` · `rights-notice.ts`
8. **ส่วนหัว สถานที่บันทึก / สถานีตำรวจ + วันที่** — ต้องตาม §หัวสถานที่บันทึกด้านล่างทันที (อย่าเดาเลย์เอาต์ · อย่าวางกึ่งกลาง)
9. **อักษรมาตรฐาน `BODY` 15pt** TH Sarabun New ทั้งข้อความ ช่องกรอก **และตาราง** · ระยะบรรทัด `LINE = 7.2mm` · ลงชื่อ `SIGN_LINE = 6.7mm` · ชื่อแบบ `15pt` (หัวครุฑ/บันทึกข้อความ `18pt`) · คำให้การถาม–ตอบ `STMT_LINE = 9.0mm` · ตารางบันทึกพนักงานสอบสวน `8.2mm` · **ล้นแผ่น:** บีบช่องลงชื่อเป็น 2 คอลัมน์ก่อน แล้วให้ข้อความไหลหน้าถัดไป — ห้ามลดต่ำกว่า 15pt

## หัวสถานที่บันทึก / สถานีตำรวจ + วันที่ (บังคับเมื่อฟอร์มมีช่องนี้)

เมื่อแบบมีช่องที่อยู่ (**สถานที่บันทึก** · **สถานีตำรวจ** · **เขียนที่**) คู่กับ **วันที่ / เดือน / พ.ศ.** เป็นบล็อกหัว — **ต้อง** เป็นเลย์เอาต์นี้ทุกครั้ง (ต้นแบบ `OfficialPhotoIdSheet.tsx`)

แบ่งความกว้างแผ่นเป็น **กริด 3 ส่วนเท่ากัน** (`1fr 1fr 1fr`) · ช่อง 1–2 ว่าง · **ช่องที่ 3 (ขวาสุด) ชิดขวา** มี **2 แถว**:

| แถว | เนื้อหา |
|---|---|
| **1** | `สถานที่บันทึก` / `สถานีตำรวจ` / `เขียนที่` (ตามต้นฉบับ) + จุดไข่ปลาเต็มช่องที่ 3 |
| **2** | `วันที่` + จุด · `เดือน` + จุด · `พ.ศ.` + จุด — **แถวเดียว** ในช่องที่ 3 |

**ห้าม**

- รวมสถานที่/สถานีตำรวจ/เขียนที่กับวันที่ไว้แถวเดียวกัน
- แยกวันที่ / เดือน / พ.ศ. คนละแถว
- ให้สถานที่/สถานีตำรวจ/เขียนที่ยืดเต็มความกว้างแผ่น (ช่อง 1–3)
- วางบล็อกนี้ชิดซ้ายหรือกลางแผ่น

แล้วค่อยตามด้วยเนื้อหาข้อ ๑. ๒. … เต็มความกว้างตามต้นฉบับ

## ลงชื่อ 2 คอลัมน์ (บังคับเมื่อมีลงชื่อมากกว่า 1 คน)

กริดหัวสถานที่บันทึก 3 ส่วน **คนละเรื่อง** กับบล็อกลงชื่อ — ลงชื่อหลายคนต้อง **แบ่ง 2 ส่วน** (`gridTemplateColumns: 1fr 1fr`)

| กฎ | ทำ |
|---|---|
| แบ่งแผ่น | **2 คอลัมน์** ซ้าย/ขวา · `columnGap` พอไม่ให้ช่องติดกัน |
| เรียงลำดับ | คู่กรณี / ผู้เสียหาย / พยาน **ก่อน** แล้วจึงเจ้าหน้าที่ |
| เจ้าหน้าที่ท้ายสุด | ถ้าช่องสุดท้ายเป็นจนท. (`พงส./บันทึก/อ่าน` · `ผู้แจ้งสิทธิ/บันทึก/อ่าน` · `ผู้จับกุม/บันทึก/อ่าน`) **ให้อยู่คอลัมน์ขวา** — แถวบนเต็มแล้วให้ขึ้นแถวใหม่คอลัมน์ขวา (ซ้ายว่าง) |
| ช่องเดียว | จนท. คนเดียวชิดขวา ~62% ได้ |
| ป้ายยาว | `flexWrap: wrap` · ป้าย `flexShrink: 0` — ห้าม `nowrap` จนโดน `overflow: hidden` ตัด |

**ห้าม**

- เรียง 3 ช่องลงชื่อในแถวเดียว (`1fr 1fr 1fr`)
- ยืดช่องจนท. เต็มความกว้างแผ่นแล้วถือว่าชิดขวา
- สลับพยานไปอยู่หลังจนท.

ต้นแบบ: `OfficialVictimRightsSheet.tsx` (หน้า 1 ซ้ายผู้เสียหาย/ขวาจนท. · หน้า 2 ซ้ายผู้เสียหาย+ขวาพยาน แล้วจนท.ท้ายสุดคอลัมน์ขวา)

# แม่แบบฟอร์มคำให้การ (ต้นแบบ: คำให้การผู้กล่าวหา)

ฟอร์มใหม่ (บันทึกจับกุม · แจ้งข้อหา · แจ้งสิทธิ · ตรวจที่เกิดเหตุ ฯลฯ) ให้ใช้ค่าและพฤติกรรมชุดด้านบน + ตารางด้านล่าง

โครงฟอร์มคัดลอกจากผู้กล่าวหา — ต่างกันตามบทบาท:

| บทบาท | ชื่อแบบ (H1) | แถวท้ายหัวฟอร์ม | ข้อความนำถาม–ตอบ |
|---|---|---|---|
| ผู้กล่าวหา / พยาน | `SMART_POLICE_STATEMENT_FORM_TITLE` | เกี่ยวข้องเป็นอะไรกับคู่กรณี · ค่าเริ่ม «ไม่เกี่ยวข้อง สาบานตนแล้ว» | ขอให้ถ้อยคำ…สัตย์จริงว่า |
| **ผู้ต้องหา** | `SMART_POLICE_STATEMENT_SUSPECT_FORM_TITLE` («บันทึกคำให้การของผู้ต้องหา») | **เกิดแขวง/ตำบล · เขต/อำเภอ · จังหวัด** (ไม่ใช้แถวเกี่ยวข้อง) | `SMART_POLICE_STATEMENT_SUSPECT_PREAMBLE` («และเจ้าพนักงานได้แจ้ง…กระทำผิดว่า») |

คัดลอก Word: `node scripts/copy-statement-role-docx.mjs` (ช่อง «เป็น» + แพตช์หัวข้อ/แถวท้ายของผู้ต้องหา)

## บัญชีทรัพย์ถูกประทุษร้าย (ส ๕๖-๘)

ต้นแบบ Word `บัญชีทรัพย์ถูกประทุษร้าย.docx` (blankFormId `4`) — **ไม่**ใช้โครงคำให้การ

สำเนาโครงเดียวกัน เปลี่ยนเฉพาะชื่อแบบ:

| slug | ชื่อบนแผ่น | Word / blankFormId |
|---|---|---|
| `property-damaged` | บัญชีทรัพย์ถูกประทุษร้าย | `บัญชีทรัพย์ถูกประทุษร้าย.docx` · `4` |
| `property-damaged-recovered` | บัญชีทรัพย์ถูกประทุษร้ายได้คืน | `บัญชีทรัพย์ถูกประทุษร้ายได้คืน.docx` · `5` |
| `property-damaged-unrecovered` | บัญชีทรัพย์ถูกประทุษร้ายไม่ได้คืน | `บัญชีทรัพย์ถูกประทุษร้ายไม่ได้คืน.docx` · `6` |

| ชิ้น | ค่า |
|---|---|
| ชื่อ | `บัญชีทรัพย์ถูกประทุษร้าย` — **ห้าม** โชว์ `(ส ๕๖ - ๘)` บนแผ่น |
| หัว | สถานีตำรวจ/หน่วยงาน (เต็มแถว) · คดีที่ + ลงวันที่ · **คดีระหว่าง ปีกกา** (ชุดเดียวกับคำให้การผู้กล่าวหา · ป้ายผู้กล่าวหา/ผู้ต้องหาชิดขวา) · ข้อหา/ฐานความผิด + บรรทัดจุดไข่ปลาต่อ |
| ตาราง | ลำดับไทย ๑.๒.๓. · **15pt** ทั้งหัว/เซลล์ · **ระยะข้อชิด** (`minHeight 7.2mm` ไม่ยืด `%` เต็มแผ่น) · ช่องรายการ/`ของใคร`/`หมายเหตุ` **ห่อบรรทัดในเซลล์** (ห้ามล้นเส้น) · ไม่มีเส้นนอนในตัวตาราง · แถวรวม **ช่องเดียวเต็มแถว (`colspan`)** บนหน้า 1 · คำนวณอัตโนมัติ `รวม ๓ รายการ` + `ราคารวม ๑,๒๕๐.๐๐ บาท` (**รองรับเลขไทย ๐–๙ และเลขอารบิก** · ว่างเป็น ๐) |
| ท้ายหน้า 1 | คำรับรอง **ย่อหน้า 1 tab (12mm) ชิดซ้าย** (ห้ามกึ่งกลาง · ขึ้นบรรทัดใหม่ชิดซ้าย · บีบเป็นย่อหน้าเดียว) · ลงชื่อ 2 คอลัมน์: ผู้ต้องหา · ผู้กล่าวหา · พยาน · **พงส. / บันทึก / อ่าน** (ป้ายยาวห่อในช่อง ห้าม nowrap จนถูกตัด) |
| หน้า 2+ | **แสดงเฉพาะเมื่อรายการล้นหน้า 1** (กดเพิ่มรายการ) · เลขหน้าไทยกลาง · ตารางต่อ · ลงชื่อ พงส. / บันทึก / อ่าน ชิดขวา |
| slug | ตามตารางด้านบน · หน้า `/templates/preview/{slug}` |
| UI | `OfficialPropertyListSheet.tsx` · `SmartPolicePropertyListPreviewClient.tsx` |
| แคตตาล็อก | `official-form-catalog.ts` รวมกับแม่แบบคำให้การ |

ช่องในตารางใช้เส้นตารางทึบ (`0.55pt`) — **ห้าม**จุดไข่ปลาซ้ำในเซลล์ (ดู `globals.css` `.sp-a4-sheet table input.sp-word-field`)

## บัญชีของกลาง (ส ๕๖-๗)

ต้นแบบ Word `บัญชีของกลาง.docx` (blankFormId `13`) — ประยุกต์จากบัญชีทรัพย์ถูกประทุษร้าย · **ห้าม**โชว์ `(ส ๕๖ - ๗)` บนแผ่น

| ชิ้น | ค่า |
|---|---|
| ชื่อบนแผ่น | `บัญชีทรัพย์ของกลางคดีอาญา` — รายการแม่แบบใช้ `บัญชีของกลาง` |
| หัว | เลขที่บัญชีทรัพย์ของกลางลำดับที่ · ตามสำนวนการสอบสวนของสถานีตำรวจ · คดีที่ + ลงวันที่ · **คดีระหว่าง ปีกกา** · ข้อหา/ฐานความผิด + บรรทัดจุดไข่ปลาต่อ |
| ตาราง | ชุดเดียวกับบัญชีทรัพย์ — คอลัมน์ **ยึดจากใคร** (แทน ของใคร) · แถวรวม **ช่องเดียวเต็มแถว** คำนวณอัตโนมัติ `รวม … รายการ` + `ราคารวม … บาท` |
| ท้ายหน้า 1 | ข้าฯ ขอรับรองว่าทรัพย์สินของกลาง… **ย่อหน้า 1 tab (12mm) ชิดซ้าย** (ห้ามกึ่งกลาง · ขึ้นบรรทัดใหม่ชิดซ้าย · บีบเป็นย่อหน้าเดียว) · ลงชื่อ 2 คอลัมน์: ผู้ต้องหา · ผู้กล่าวหา · พยาน · **พงส. / บันทึก / อ่าน** (ป้ายยาวห่อในช่อง ห้าม nowrap จนถูกตัด) — **ห้าม**ใส่หมายเหตุ ๑–๒ |
| หน้า 2+ | **แสดงเฉพาะเมื่อรายการล้นหน้า 1** · เลขหน้าไทยกลาง · ตารางต่อ · ลงชื่อ พงส. / บันทึก / อ่าน ชิดขวา |
| slug | `exhibit-list` · `/templates/preview/exhibit-list` |
| UI | `OfficialExhibitListSheet.tsx` · `SmartPoliceExhibitListPreviewClient.tsx` |

## แผนที่เกิดเหตุ (ส ๕๖-๑๕)

ต้นแบบ Word `แผนที่เกิดเหตุ.docx` (blankFormId `7`) — **ไม่**ใช้โครงคำให้การ · โครงตามแบบราชการ «แผนที่สังเขปแสดงสถานที่เกิดเหตุ»

| ชิ้น | ค่า |
|---|---|
| ชื่อบนแผ่น | `แผนที่สังเขปแสดงสถานที่เกิดเหตุ` — รายการแม่แบบใช้ชื่อสั้น `แผนที่เกิดเหตุ` — **ห้าม** โชว์ `(ส ๕๖ - ๑๕)` บนแผ่น |
| หัว | คดีระหว่าง · ผู้กล่าวหา · ผู้ต้องหา · ฐานความผิด · ที่เกิดเหตุ/หมู่/ตรอกซอย/ถนน/ตำบล/อำเภอ/จังหวัด · เมื่อวันที่/เดือน/พ.ศ./เวลาประมาณ |
| ซ้าย | กล่องแผนที่ขอบทึบ + `↑เหนือ` มุมขวาบน · แทรกรูปแผนที่ได้ |
| ขวา | คำอธิบายแผนที่ (เส้นจุดไข่ปลา `0.5pt dotted`) · ลงชื่อ ผู้กล่าวหา / ผู้ต้องหา×๒ / พยาน×๒ / บันทึกอ่านผู้จัดทำ · `( )` · `(ตำแหน่ง)` |
| กระดาษ | **A4 แนวนอน** `297mm × 210mm` (คลาส `sp-a4-landscape`) — ไม่ใช้แนวตั้ง |
| หน้า 2+ | **แสดงเฉพาะเมื่อกด «+ เพิ่มหน้าแผนที่»** — ไม่บังคับโชว์ว่าง · เลขหน้าไทยกลาง · กล่องแผนที่ + คำอธิบาย (ไม่มีลงชื่อซ้ำ) · ลบได้ด้วย «ลบหน้าสุดท้าย» |
| slug | `scene-map` · `/templates/preview/scene-map` |
| UI | `OfficialSceneMapSheet.tsx` · `SmartPoliceSceneMapPreviewClient.tsx` · `SceneMapFields.extraPages` |

## บันทึกถอนคำร้องทุกข์ (ส ๕๖-๒๕)

ต้นแบบ Word `บันทึกถอนคำร้องทุกข์.docx` (blankFormId `8`) — A4 แนวตั้ง · ช่องจุดไข่ปลาตามต้นฉบับ

| ชิ้น | ค่า |
|---|---|
| ชื่อบนแผ่น | `บันทึกถอนการร้องทุกข์ความผิดอันยอมความได้` — รายการแม่แบบใช้ `บันทึกถอนคำร้องทุกข์` — **ห้าม** โชว์ `(ส ๕๖ - ๒๕)` บนแผ่น |
| หัวขวา | ที่ · วันที่ · เดือน · พ.ศ. |
| เนื้อ | ข้อความต้นฉบับครบ + ช่องชื่อผู้ถูกกล่าวหา · ความผิดฐาน · ป.จ.ว. ข้อ · เวลา/วันมอบคดี · ผู้ต้องหา · เนื่องจาก · จึงขอถอน · ได้รับแจ้งไว้แล้ว · ย่อหน้าเห็นว่า… |
| ท้าย | อ่านให้ฟังแล้ว รับว่าถูกต้อง · ลงชื่อ ผู้ถอนคำร้องทุกข์ / ผู้ต้องหา / พยาน / **พงส./บันทึก/อ่าน** + `( )` ตัวบรรจง · ตำแหน่ง |
| slug | `withdraw-complaint` · `/templates/preview/withdraw-complaint` |
| UI | `OfficialWithdrawComplaintSheet.tsx` · `SmartPoliceWithdrawComplaintPreviewClient.tsx` |

## บันทึกการชดใช้ค่าเสียหาย

ต้นแบบ Word `บันทึกการชดใช้ค่าเสียหาย.docx` (blankFormId `9`) — A4 แนวตั้ง · **ห้าม** โชว์รหัสแบบบนแผ่น

| ชิ้น | ค่า |
|---|---|
| ชื่อบนแผ่น | `บันทึกการตกลงชดใช้ค่าเสียหาย` — รายการแม่แบบใช้ `บันทึกการชดใช้ค่าเสียหาย` |
| หัวขวา | ตาม §หัวสถานที่บันทึก — กริด 3 ส่วน · ช่องที่ 3 ชิดขวา · สถานที่บันทึก 1 แถว · วันที่+เดือน+พ.ศ. แถวถัดไป |
| เนื้อ | วันนี้/เวลา · คู่กรณีฝ่ายที่ ๑–๒ · ผู้กล่าวหา · ผู้ต้องหา · ข้อหา · วันเวลาเกิดเหตุ · เส้นตกลงค่าเสียหาย ๗ บรรทัด · ย่อหน้า 1 tab (12mm) ชิดซ้าย **สองก้อน**: (1) ตกลงกันได้ + อนึ่งสมัครใจ **ย่อหน้าเดียว** (2) ได้อ่านให้ฟัง + จึงได้ลงลายมือชื่อไว้เป็นหลักฐาน **ย่อหน้าเดียว** |
| ท้าย | ลงชื่อ คู่กรณี๑–๒ / พยาน×๒ / **พงส./บันทึก/อ่าน** + `( )` |
| slug | `compensation-settlement` · `/templates/preview/compensation-settlement` |
| UI | `OfficialCompensationSettlementSheet.tsx` · `SmartPoliceCompensationSettlementPreviewClient.tsx` |

## บันทึกแจ้งสิทธิผู้เสียหาย

ต้นแบบ Word `บันทึกแจ้งสิทธิผู้เสียหาย.docx` (blankFormId `10`) — **สองแผ่น A4 แนวตั้ง** · **ห้าม** โชว์รหัสแบบบนแผ่น · หัวสถานที่บันทึกชิดขวาช่องที่ 3

| ชิ้น | ค่า |
|---|---|
| อักษร | **15pt** ทั้งสองหน้า (`BODY`) · ระยะบรรทัด `LINE = 7.2mm` · ชื่อแบบ 15pt ขีดเส้นใต้ — ห้าม `lineHeight` แบบ 1.28/1.4 ที่ทำให้อักษรดูเล็กกว่า 15pt |
| หน้า 1 | `บันทึกการแจ้งสิทธิ` + ชื่อ พ.ร.บ. ๒๕๔๔ · ช่องคดี/ผู้แจ้ง/ผู้เสียหาย · พฤติการณ์ · ติ๊กเกี่ยวข้อง/ไม่เกี่ยวข้อง · รายการสิทธิ ๑–๕ · ลงชื่อ**แบ่ง 2 คอลัมน์**: ซ้าย ผู้เสียหาย/ทายาทผู้เสียหาย · ขวา **ผู้แจ้งสิทธิ/บันทึก/อ่าน** · เชิงอรรถโทร ๑๑๑๑ |
| หน้า 2 | `บันทึกการแจ้งสิทธิของผู้เสียหาย` · **15pt / 7.2mm เท่าหน้า 1** · ช่องเวลา/ที่อยู่/ผู้ต้องหา · ย่อหน้า 1 tab (12mm) ชิดซ้าย **สองก้อน**: สิทธิค่าสินไหม ป.วิ.อาญา ม.๔๔/๑ · ได้รับทราบสิทธิแล้วจึงลงลายมือชื่อ · ลงชื่อ**แบ่ง 2 คอลัมน์**: แถว 1 ซ้ายผู้เสียหาย / ขวาพยาน · แถว 2 ซ้ายว่าง / ขวา **ผู้แจ้งสิทธิ/บันทึก/อ่าน ท้ายสุด** + ตำแหน่ง — ห้ามเรียง 3 ช่องแถวเดียว · หมายเหตุ |
| slug | `victim-rights` · `/templates/preview/victim-rights` |
| UI | `OfficialVictimRightsSheet.tsx` · `SmartPoliceVictimRightsPreviewClient.tsx` |

## คำให้การผู้ต้องหาฟ้องวาจา

ต้นแบบ Word `คำให้การผู้ต้องหาฟ้องวาจา.docx` (blankFormId `12`) — **สองแผ่น A4 แนวตั้ง** · ใช้ครุฑ/จุดไข่ปลา/แถวตัวตนจากคำให้การผู้ต้องหา · **ห้าม** โชว์รหัสแบบบนแผ่น · **ห้าม** แถบซ้ายคำให้การของ (โครงศาลแขวง ม.๒๐)

| ชิ้น | ค่า |
|---|---|
| ชื่อบนแผ่น | `บันทึกคำให้การรับสารภาพของผู้ต้องหา ตามมาตรา ๒๐` + บรรทัด พ.ร.บ.จัดตั้งศาลแขวง ฯ พ.ศ. ๒๔๙๙ — รายการแม่แบบใช้ `คำให้การผู้ต้องหาฟ้องวาจา` |
| หัว | ครุฑกลาง · ยศซ้าย · บัตรประชาชน/เลขที่/บันทึกขวา · สถานี/เขต/จังหวัด · วันที่/เดือน/พุทธศักราช ๒๕ · สอบสวนที่ · ชื่อ อายุ เชื้อชาติ สัญชาติ ศาสนา อาชีพ ที่อยู่ บิดามารดา เกิดที่ |
| หน้า 1 | ย่อหน้าแจ้งข้อกล่าวหา/สิทธิ · เหตุเกิด · **พฤติการณ์/ความผิดฐานห่อ ๑–๓ บรรทัด** · สิทธิผู้ต้องหา · **ถาม–ตอบเส้น** (`StatementQaEditor`) ค่าเริ่มข้อความหลักฟ้องวาจา |
| หน้า 2+ | `(๒)` · ถาม–ตอบเส้นต่อ · เพิ่มแถวได้ (Enter) · ล้นแล้วไหลหน้าใหม่ · **ท้ายต่อจากแถวถาม–ตอบสุดท้าย** อ่านให้ฟังแล้ว · ลงชื่อตามบทบาท (ผู้กล่าวหา / พยาน / ผู้ต้องหา) / **พงส./บันทึก/อ่าน** |
| slug | `oral-plea` · `/templates/preview/oral-plea` — **ไม่**ขึ้นต้น `statement-` (คนละ client กับคำให้การสามบทบาท) |
| UI | `OfficialOralPleaSheet.tsx` · `SmartPoliceOralPleaPreviewClient.tsx` |

## บันทึกการจับกุม (ส ๕๖-๒๗)

ต้นแบบ Word `บันทึกจับกุม.docx` (blankFormId `14`) — **สองแผ่น A4 แนวตั้ง** · **ห้าม** โชว์ `(ส ๕๖ - ๒๗)` บนแผ่น

| ชิ้น | ค่า |
|---|---|
| ชื่อบนแผ่น | `บันทึกการจับกุม` — รายการแม่แบบใช้ `บันทึกจับกุม` |
| หัวขวาหน้า 1 | ป.จ.ว. ข้อ · เวลา น. · คดีอาญาที่ · บัญชีของกลางลำดับที่ |
| หน้า 1 | สถานที่ทำการบันทึก · วันเดือนปีที่บันทึก/จับกุม · สถานที่จับกุม/ตำบล/อำเภอ/จังหวัด · เจ้าพนักงานผู้จับกุม · ได้ร่วมกันจับกุมตัว · ของกลาง · ตำแหน่งที่พบ · โดยกล่าวหาว่า · สิทธิผู้ถูกจับ ข้อ ๑–๓ |
| หน้า 2 | เลขหน้าไทย `๒` · สิทธิข้อ ๔ · คำให้การขณะจับกุม · เหตุเกิดที่ · เมื่อวันที่ · อนึ่งมิได้ทำให้เสียหาย · อ่านให้ฟังแล้ว · ลงชื่อผู้ถูกจับ / ผู้จับกุม (เพิ่ม–ลบแถวได้ · **ไม่มีช่องตำแหน่ง**) · ผู้จับกุม/บันทึก/อ่าน |
| ข้อความยาว | ช่องเส้น (ผู้จับ · ผู้ถูกจับ · ของกลาง · ข้อกล่าวหา · คำให้การ) **พิมพ์ต่อได้เรื่อย ๆ** · ห่อในช่อง · ล้นแผ่นแล้ว **เพิ่มหน้าอัตโนมัติ** · ลงชื่ออยู่หน้าสุดท้าย |
| slug | `arrest-record` · `/templates/preview/arrest-record` |
| UI | `OfficialArrestRecordSheet.tsx` · `SmartPoliceArrestRecordPreviewClient.tsx` |

## บันทึกการแจ้งข้อกล่าวหา (ส ๕๖-๒๕)

ต้นแบบ Word `บันทึกแจ้งข้อหา.docx` (blankFormId `15`) — **หนึ่งแผ่น A4 แนวตั้ง ค่าเริ่ม** · ล้นแล้วเพิ่มหน้า · **ห้าม** โชว์ `(ส ๕๖ - ๒๕)` บนแผ่น

| ชิ้น | ค่า |
|---|---|
| ชื่อบนแผ่น | `บันทึกการแจ้งข้อกล่าวหา` — รายการแม่แบบใช้ `บันทึกแจ้งข้อหา` |
| หัวหน้า 1 | ที่ · วันที่/เดือน/พ.ศ. · วันนี้ เวลา น. ตาม ป.จ.ว.ข้อ · ได้มี อายุ ปี · เชื้อชาติ สัญชาติ ที่อยู่ · หมู่ที่ ถนน ตำบล/แขวง · อำเภอ/เขต จังหวัด โทรศัพท์ · เป็นผู้ต้องหาในคดีที่ + ช่อง (ถูกเรียกมาพบ / ส่งตัวมาพบ / เข้าหา / มาอยู่ต่อหน้า) · พนักงานสอบสวน คือ / ตำแหน่ง |
| เนื้อหา | จึงได้แจ้งข้อกล่าวหาให้ทราบว่า · พฤติการณ์และการกระทำของผู้ต้องหาเป็นความผิดฐาน · สิทธิผู้ต้องหา · ได้ให้การ · ย่อหน้ารับตัว/ปล่อยตัว · อ่านให้ฟังแล้วรับว่าถูกต้อง · ลงชื่อชิดขวา (ไม่เต็มแถว · ไม่มีกล่องตรา) ผู้ต้องหา/ผู้มอบตัว/ผู้เข้าพบ · พยาน · แจ้งข้อกล่าวหา/บันทึก/อ่าน · ตำแหน่ง · ได้รับสำเนา |
| ข้อความยาว | ช่องเส้น (ข้อกล่าวหา · พฤติการณ์ · คำให้การ) **พิมพ์ต่อได้เรื่อย ๆ** · ห่อในช่อง · ล้นแผ่นแล้ว **เพิ่มหน้าอัตโนมัติ** · เลขหน้าไทย · ลงชื่ออยู่หน้าสุดท้าย |
| slug | `charge-notice` · `/templates/preview/charge-notice` |
| UI | `OfficialChargeNoticeSheet.tsx` · `SmartPoliceChargeNoticePreviewClient.tsx` |

## บันทึกการแจ้งสิทธิของผู้ถูกจับหรือผู้ต้องหา (ส ๕๖-๒๕)

ต้นแบบ Word `บันทึกแจ้งสิทธิ.docx` (blankFormId `16`) — **หนึ่งแผ่น A4 แนวตั้ง ค่าเริ่ม** · ล้นแล้วเพิ่มหน้า · **ห้าม** โชว์ `(ส ๕๖ - ๒๕)` / `ค.๑๘๕` · **ห้าม** ใส่ «หมายเหตุ»

| ชิ้น | ค่า |
|---|---|
| ชื่อบนแผ่น | `บันทึกการแจ้งสิทธิของผู้ถูกจับหรือผู้ต้องหา` — รายการแม่แบบใช้ `บันทึกแจ้งสิทธิผู้ต้องหา` |
| หัวหน้า 1 | ตาม §หัวสถานที่บันทึก (ช่องที่ 3 ชิดขวา) · วันนี้เวลา น. ข้าพเจ้า · ตำแหน่ง + ทราบถึงสิทธิตามกฎหมาย · ย่อหน้าญาติ/ควบคุม · ข้อ ๑–๔ · ชื่อ · เชื้อชาติ สัญชาติ อายุ |
| เนื้อหา | ถูกจับข้อหา (เส้นต่อเนื่อง) · เมื่อวันที่/เดือน/พ.ศ. ตาม ป.จ.ว. ข้อ · ได้รับทราบสิทธิแล้ว · อ่านให้ฟังแล้วรับว่าถูกต้อง · ลงชื่อ**แบ่ง 2 คอลัมน์** ผู้ต้องหา / พยาน แล้ว **ผู้แจ้งสิทธิ/บันทึก/อ่าน ท้ายสุดคอลัมน์ขวา** + ตำแหน่ง |
| ข้อความยาว | ช่องเส้นข้อหา **พิมพ์ต่อได้เรื่อย ๆ** · ล้นแผ่นแล้ว **เพิ่มหน้าอัตโนมัติ** · เลขหน้าไทย · ลงชื่ออยู่หน้าสุดท้าย |
| slug | `rights-notice` · `/templates/preview/rights-notice` — **คนละ** `victim-rights` (แจ้งสิทธิผู้เสียหาย) |
| UI | `OfficialRightsNoticeSheet.tsx` · `SmartPoliceRightsNoticePreviewClient.tsx` |

## ภาพถ่ายประกอบคดี

ต้นแบบ Word `ภาพถ่ายประกอบคดี.docx` (blankFormId `17`) — **หนึ่งแผ่น A4 แนวตั้ง ค่าเริ่ม** · เพิ่มแผ่นต่อได้ · **ห้าม** โชว์ `(ส ๕๖ - ๒๕)` · **ห้าม** ใส่ «หมายเหตุ»

| ชิ้น | ค่า |
|---|---|
| ชื่อบนแผ่น / รายการ | `ภาพถ่ายประกอบคดี` |
| หัวหน้า 1 | คดีที่ · สถานีตำรวจ · **คดีระหว่าง ปีกกา** (ชุดเดียวกับคำให้การ · ป้ายผู้กล่าวหา/ผู้ต้องหาชิดขวา) · ต้องหาว่า · วันเวลาที่เกิดเหตุ · เหตุเกิด |
| เนื้อหา | กรอบภาพถ่าย (คลิกแทรก/ถ่าย) · คำอธิบายเส้น · ขอรับรองภาพถ่าย · ได้ตรวจดูแล้ว · ลงชื่อชิดขวา ผู้ต้องหาที่ ๑–๒ · ผู้กล่าวหา · **พงส./บันทึก/อ่าน** · ตำแหน่ง |
| แผ่นต่อ | กด **+ เพิ่มหน้าภาพ** · เลขหน้าไทย · กรอบภาพ + คำอธิบาย · ลบหน้าสุดท้ายได้ |
| slug | `case-photo` · `/templates/preview/case-photo` |
| UI | `OfficialCasePhotoSheet.tsx` · `SmartPoliceCasePhotoPreviewClient.tsx` |

## บันทึกการชี้รูปผู้ต้องหา (ส ๕๖-๒๖)

ต้นแบบ Word `บันทึกชี้รูปผู้ต้องหา.docx` (blankFormId `19`) — **สองแผ่น A4 แนวตั้ง ค่าเริ่ม** · ล้นแล้วเพิ่มหน้า · **ห้าม** โชว์ `(ส ๕๖ - ๒๖)` / `(ส ๕๖ - ๒๕)` · **ห้าม** ใส่ «หมายเหตุ»

| ชิ้น | ค่า |
|---|---|
| ชื่อบนแผ่น | `บันทึกการชี้รูปผู้ต้องหา` — รายการแม่แบบใช้ `บันทึกชี้รูปผู้ต้องหา` |
| หน้า 1 | ตาม §หัวสถานที่บันทึก · ๑. ผู้อำนวยการชี้รูป · ๒. คดี/ข้อหา/ผู้ต้องหา/ผู้เข้าชี้รูป · ๓. คละรูป · จำนวนรูป · รายการรูป (๑)–(๘) · ๔. ผลการชี้รูป (เส้นต่อเนื่อง) · ท้ายแผ่นลงชื่อกริดเดียว **วงเล็บปิดเสมอกัน** |
| หน้า 2 | เลขหน้าไทย `๒` · ป.จ.ว. ข้อ/เวลา · วันที่ · อ่านให้ฟังแล้ว · ลงชื่อชิดขวา ผู้กล่าวหาชี้รูป · พยานชี้รูป · พยาน · ผู้อำนวยการชี้รูป · **พงส./บันทึก/อ่าน** · ตำแหน่ง |
| ข้อความยาว | ช่องผลการชี้รูป **พิมพ์ต่อได้เรื่อย ๆ** · ล้นแผ่นแล้ว **เพิ่มหน้าอัตโนมัติ** · ลงชื่ออยู่หน้าสุดท้าย |
| slug | `photo-id` · `/templates/preview/photo-id` |
| UI | `OfficialPhotoIdSheet.tsx` · `SmartPolicePhotoIdPreviewClient.tsx` |

## บันทึกการชี้ตัวผู้ต้องหา

ต้นแบบ Word `บันทึกชี้ตัวผู้ต้องหา.docx` (blankFormId `20`) — **หนึ่งแผ่น A4 แนวตั้ง ค่าเริ่ม** · ล้นข้อ ๕ แล้วเพิ่มหน้า · **ห้าม** โชว์รหัสฟอร์ม · **ห้าม** ใส่ «หมายเหตุ» · โครงลงชื่อ/หัวชุดเดียวกับชี้รูป

| ชิ้น | ค่า |
|---|---|
| ชื่อบนแผ่น | `บันทึกการชี้ตัวผู้ต้องหา` — รายการแม่แบบใช้ `บันทึกชี้ตัวผู้ต้องหา` |
| หัว | ตาม §หัวสถานที่บันทึก (กริด 3 ส่วน · ช่องที่ 3 ชิดขวา) |
| หน้า 1 | ๑. ผู้อำนวยการชี้ตัว · ๒. คดีระหว่าง ปีกกา ผู้กล่าวหา/ผู้ต้องหา (ป้ายชิดขวา) · คดีอาญาที่+ข้อหา · ๓. ที่ชี้ตัว/วันเวลา · ๔. จำนวนคน + รายการ ๑.–๘. สองคอลัมน์ · ๕. วิธียืน/เดิน + ช่องคำตอบเส้นต่อเนื่อง · ๖. ลงชื่อชิดขวา กริดเดียว **วงเล็บปิดเสมอกัน** (ผู้ต้องหา · พยาน×๒ · ผู้อำนวยการชี้ตัว · **พงส./บันทึก/อ่าน**) — **ไม่มีช่องตำแหน่ง** |
| ข้อความยาว | ช่องข้อ ๕ เส้นจุดไข่ปลา **พิมพ์ต่อในช่องได้เรื่อย ๆ** (ห่อบรรทัด · ขยายตามข้อความ) · ล้นแผ่นแล้ว **เพิ่มหน้าอัตโนมัติ** แบบจับกุม · ลงชื่ออยู่หน้าสุดท้าย |
| slug | `lineup-id` · `/templates/preview/lineup-id` |
| UI | `OfficialLineupIdSheet.tsx` · `SmartPoliceLineupIdPreviewClient.tsx` |

## ปกสำนวน

ต้นแบบ Word `ปกสำนวน.docx` (blankFormId `21`) — **หนึ่งแผ่น A4 แนวตั้ง ค่าเริ่ม** · ล้นช่องยาวแล้วเพิ่มหน้า · **ห้าม** โชว์รหัสฟอร์ม · มีครุฑ + สำนักงานตำรวจแห่งชาติ · **ไม่มี** §หัวสถานที่บันทึก (โครงคนละแบบ)

| ชิ้น | ค่า |
|---|---|
| ชื่อบนแผ่น | `ปกสำนวน` (ขีดเส้นใต้ กึ่งกลาง แถวเดียวกับคดีที่) |
| หัว | ครุฑ `24mm` · `สำนักงานตำรวจแห่งชาติ` `20pt` · แถวบน คดีที่ซ้าย + ชื่อแบบกลาง · แถวล่าง ที่ทำการสอบสวนชิดขวา (~ครึ่งขวา) |
| หน้า 1 | ต้องหาว่ากระทำความผิดฐาน (๒ เส้นขึ้นไป) · ผู้เสียหาย · ผู้ต้องหา · รับแจ้งเหตุวันที่ + บัญชีของกลางลำดับที่ · เจ้าของสำนวน · การควบคุมผู้ต้องหา ซ้ายส่วนที่ 1 · **(๑)(๒)(๓) เริ่มส่วนที่ 2** ของกริด 3 ส่วน ยืดถึงขวา (ปล่อยชั่วคราว · ควบคุม+ครบวันที่ · ศาลสั่งขัง+ครบวันที่) · พยานที่อ้าง ๑.–๓. (อย่างน้อย ๒ เส้นต่อคน) · **วันที่นัดสอบสวน** ครั้งที่หนึ่ง–สาม (วันที่ / ชื่อพยาน / ชื่อผู้สอบสวน) · ส่งสำนวนไปยัง + รายงานการสอบสวนที่ + ลงวันที่ · **ช่องหมายเหตุ** ตามต้นฉบับ ๓ เส้น (เป็นช่องกรอก ไม่ใช่เชิงอรรถท้ายแผ่น) · เส้นทึบล่างสุดแผ่นสุดท้าย |
| ข้อความยาว | ข้อหา · ผู้เสียหาย · ผู้ต้องหา · พยาน · หมายเหตุ **พิมพ์ต่อในช่องได้** · ล้นแล้วเพิ่มหน้า |
| slug | `case-cover` · `/templates/preview/case-cover` |
| UI | `OfficialCaseCoverSheet.tsx` · `SmartPoliceCaseCoverPreviewClient.tsx` |

## รายงานการสอบสวน

ต้นแบบ Word `รายงานการสอบสวน.docx` (blankFormId `22`) — **หนึ่งแผ่น A4 แนวตั้ง ค่าเริ่ม** · ล้นช่องข้อเท็จจริงแล้วเพิ่มหน้า · **ห้าม** โชว์รหัสฟอร์ม · มีครุฑ + สำนักงานตำรวจแห่งชาติ · **ไม่มี** §หัวสถานที่บันทึก (วันที่/เดือน/พ.ศ. อยู่แถวหัวรายงาน)

| ชิ้น | ค่า |
|---|---|
| ชื่อบนแผ่น | `รายงานการสอบสวน` (ขีดเส้นใต้ กึ่งกลาง) · หน้า 2+ หัว `ข้อเท็จจริงและความเห็น` |
| หัวหน้า 1 | ครุฑ `24mm` · **เส้นตั้งซ้ายที่ `28mm`** ไม่สุดบน–ล่าง (`top/bottom 16mm`) · เนื้อหา padding ซ้าย `36mm` · คดี (ช่องสั้น) · สถานีตำรวจ/เขต/อำเภอ/จังหวัด · **วันที่ เดือน พ.ศ. เริ่มส่วนที่ 2** ของกริด 3 ส่วน · เสนอ · **คดีระหว่าง ปีกกากลางแบบคำให้การ** (SVG ชุดเดียว · เส้นบนผู้กล่าวหา · เส้นล่างผู้ต้องหา ป้ายชิดขวา) · ข้อหา ๓ เส้น · วันเวลาที่เกิดเหตุ · ตำบลที่เกิดเหตุ · วันเวลาที่ร้องทุกข์หรือกล่าวโทษ · วันเวลาที่ผู้ต้องหาถูกควบคุม… **ดังนี้คือ.-** |
| ข้อความยาว | หลัง `ดังนี้คือ.-` พิมพ์ต่อในเส้นได้เรื่อย ๆ · **ค่าเริ่ม ๓ แผ่น** (หน้า 2+ padding ซ้าย `22mm`) · ล้นแล้วเพิ่มหน้าอัตโนมัติ · ท้ายหน้าสุดท้าย: `จึงเสนอสำนวนการสอบสวน และความเห็นมาเพื่อโปรดพิจารณา` **เริ่มส่วนที่ 2** ของกริด 3 ส่วน · ลงชื่อชิดขวา ~62% `ลงชื่อ……พนักงานสอบสวน` / `(……)` กริดเดียววงเล็บเสมอกัน แบบชี้รูป |
| slug | `inquiry-report` · `/templates/preview/inquiry-report` |
| UI | `OfficialInquiryReportSheet.tsx` · `SmartPoliceInquiryReportPreviewClient.tsx` |

## บันทึกพนักงานสอบสวน

ต้นแบบ Word `บันทึกพนักงานสอบสวน.docx` (blankFormId `23`) — **หนึ่งแผ่น A4 แนวตั้ง ค่าเริ่ม** · ล้นช่องรายการปฏิบัติแล้วเพิ่มหน้า · **ห้าม** โชว์รหัสฟอร์ม · **ไม่มี** §หัวสถานที่บันทึก (หัวเป็น สถานีตำรวจ / อำเภอ / จังหวัด)

| ชิ้น | ค่า |
|---|---|
| ชื่อบนแผ่น | `บันทึกพนักงานสอบสวน` (ขีดเส้นใต้ กึ่งกลาง บนสุด) · หน้า 2+ มีเลขหน้าไทยกลาง |
| หัว | แถวเดียว: `สถานีตำรวจ` + จุด · `อำเภอ` + จุด · `จังหวัด` + จุด |
| ตาราง | เส้นทึบรอบนอก · 3 คอลัมน์ (`32mm` / กลางยืด / `40mm`) · หัวแถว 15pt สูง `14mm` · `วัน เดือน ปี` · `รายละเอียด` · `ลายมือชื่อ และตำแหน่งผู้บันทึก` (ขวาสองบรรทัด) · เส้นนอนจุดไข่ปลาในแถวข้อมูล |
| ข้อความยาว | วันเดือนปี · รายละเอียด · ลายมือชื่อ **พิมพ์ต่อในช่องได้** · ล้นแล้วเพิ่มหน้าอัตโนมัติ (ตารางชุดเดียวกันทุกแผ่น) |
| slug | `inquiry-memo` · `/templates/preview/inquiry-memo` |
| UI | `OfficialInquiryMemoSheet.tsx` · `SmartPoliceInquiryMemoPreviewClient.tsx` |

## บัญชีสำนวนการสอบสวน

ต้นแบบ Word `บัญชีสำนวนการสอบสวน.docx` (blankFormId `24`) — **ค่าเริ่ม ๑ แผ่น A4 เต็มหน้า · ลำดับที่ ๑–๓** · ข้อความในเซลล์ห่อแล้วล้นความสูงหน้า → ขึ้นหน้าอัตโนมัติ · **ห้าม** โชว์รหัสฟอร์ม · **ไม่มี** §หัวสถานที่บันทึก · มีครุฑ

| ชิ้น | ค่า |
|---|---|
| ชื่อบนแผ่น | `บัญชีสำนวนการสอบสวน` (ขีดเส้นใต้ กึ่งกลาง) · ครุฑหน้า 1 |
| หัว | แถวเดียว `คดีที่` · `สถานีตำรวจ` · `อำเภอ` · `จังหวัด` |
| ตาราง | ลำดับที่ · ชนิดและเลขหมายหนังสือ · ของ · ถึง · `จำนวน/แผ่น` (คอลัมน์เดียว) · เส้นทึบบน–ล่าง · **เลขลำดับเฉพาะรายการจริง (ค่าเริ่ม ๑–๓)** · ช่องว่างล่างเป็นเส้นตั้งต่อไม่มีเลข |
| ท้าย | หน้าสุดท้าย: รวมช่องทั้งแถว มีเส้นบน · แถว `รวมเอกสาร……รายการ จำนวน……แผ่น` (นับรายการที่มีข้อความ + รวมช่องจำนวน/แผ่น อัตโนมัติ เลขไทย) · แถวถัดไป `ลงชื่อ……ตรวจ/บันทึก` ชิดขวา ~62% · **ไม่มียศ** |
| หน้า 2+ | **แสดงเมื่อข้อความ/รายการล้นหน้า 1** (`packInquiryDocketPages` + วัดบรรทัด DOM) · เลข `-๒-` · **ห้าม** เชิงอรรถแบบพิมพ์ตำรวจ |
| slug | `inquiry-docket` · `/templates/preview/inquiry-docket` |
| UI | `OfficialInquiryDocketSheet.tsx` · `SmartPoliceInquiryDocketPreviewClient.tsx` |

## บันทึกตรวจสถานที่เกิดเหตุ

ต้นแบบ Word `บันทึกตรวจสถานที่เกิดเหตุ.docx` (blankFormId `25`) — **ค่าเริ่ม ๒ แผ่น A4** · ล้นช่องข้อ ๙–๑๓ แล้วเพิ่มหน้า · **ห้าม** โชว์รหัสฟอร์ม · **มี** §หัวสถานที่บันทึก

| ชิ้น | ค่า |
|---|---|
| ชื่อบนแผ่น | `บันทึกตรวจสถานที่เกิดเหตุ` (ขีดเส้นใต้ กึ่งกลาง) · หน้า 2+ เลข `-๒-` |
| หัว | §หัวสถานที่บันทึก ช่องที่ 3 · วันที่/เดือน/พ.ศ. แถวถัดไปในช่องที่ 3 · แล้วข้อความนำ `เจ้าพนักงานได้ตรวจสถานที่เกิดเหตุในคดีนี้ ปรากฏรายละเอียด ดังนี้.-` |
| หน้า 1 | ข้อ ๑ ผู้ตรวจ+ตำแหน่ง · ข้อ ๒ ผู้กล่าวหา · ข้อ ๓ ผู้ต้องหา · ข้อ ๔ ข้อหา · ข้อ ๕ วันเวลาเกิดเหตุ · ข้อ ๖ รับแจ้ง+ป.จ.ว.ข้อ · ข้อ ๗ วันเวลาตรวจ · ข้อ ๘ ที่อยู่เกิดเหตุ · ข้อ ๙ สภาพทั่วไป (เส้นต่อเนื่อง) · ข้อ ๑๐ เหตุการณ์โดยสังเขป (เติมจนสุดหน้า) |
| หน้า 2 | ข้อ ๑๐ ต่อถ้าล้น · ข้อ ๑๑ ความเสียหาย + ๑๑.๑ · ข้อ ๑๒ สิ่งของที่ยึดได้ · ข้อ ๑๓ ข้อสันนิษฐานเบื้องต้น · ลงชื่อชิดขวา ~62% ผู้ตรวจ/บันทึก / `( )` / ตำแหน่ง |
| ข้อความยาว | ข้อ ๙–๑๓ พิมพ์ต่อในช่องได้ · ล้นแล้วเพิ่มหน้าอัตโนมัติ · **ห้าม** เชิงอรรถแบบพิมพ์ตำรวจ |
| slug | `scene-inspect` · `/templates/preview/scene-inspect` |
| UI | `OfficialSceneInspectSheet.tsx` · `SmartPoliceSceneInspectPreviewClient.tsx` |

## หนังสือแจ้งความคืบหน้าทางคดี

ต้นแบบ Word `บันทึกแจ้งความคืบหน้าทางคดี.docx` (blankFormId `26`) — **ค่าเริ่ม ๑ แผ่น A4** · ล้นช่องข้อหา/ข้อ ๑–๓ แล้วเพิ่มหน้า · **ห้าม** โชว์รหัสฟอร์ม · **ไม่มี** §หัวสถานที่บันทึก (ใช้หัวหนังสือ: ที่ ซ้าย · สถานที่+วันที่ช่องที่ 3)

| ชิ้น | ค่า |
|---|---|
| ชื่อบนแผ่น | `หนังสือแจ้งความคืบหน้าการสอบสวนคดีอาญา` (กึ่งกลาง) · ไม่มีครุฑ |
| หัว | กริด 3 ส่วน: ช่อง 1 `ที่` + จุด · ช่อง 2 ว่าง · ช่อง 3 `สถานที่` + จุด แล้วแถว `วันที่` · `เดือน` · `พ.ศ.` |
| เนื้อหา | เรียน · ความผิดฐาน (เส้นต่อเนื่อง) · คดีที่ / ป.จ.ว.ข้อ · ลงวันที่คำร้อง · นั้น · ขอแจ้งความคืบหน้า…ดังนี้ · ข้อ ๑ ผลการดำเนินการ · ข้อ ๒ สิ่งที่จะดำเนินการต่อไป · ข้อ ๓ ข้อเสนอแนะ (ถ้ามี) |
| ท้าย | หน้าสุดท้าย ชิดขวา ~62%: `ขอแสดงความนับถือ` · `(ลงชื่อ……)` วงเล็บเสมอกัน · `ตำแหน่ง` · แล้วบล็อกติดต่อ `หมายเหตุ.-` ตามต้นฉบับ (ยศ/ชื่อ/ตำแหน่ง/โทร เจ้าของสำนวน + ผู้บังคับบัญชา) |
| ข้อความยาว | ความผิดฐาน · ข้อ ๑–๓ พิมพ์ต่อในช่องได้ · ล้นแล้วเพิ่มหน้าอัตโนมัติ · เลข `-๒-` |
| slug | `case-progress` · `/templates/preview/case-progress` |
| UI | `OfficialCaseProgressSheet.tsx` · `SmartPoliceCaseProgressPreviewClient.tsx` |

## ใบนำส่งผู้บาดเจ็บหรือศพ

ต้นแบบ Word `ใบนำส่งผู้บาดเจ็บหรือศพ.docx` (blankFormId `27`) — **ค่าเริ่ม ๒ แผ่น A4** (หน้า 1 พงส. · หน้า 2 แพทย์) · ช่องเหตุเต็มหน้า 1 ไม่ดันแผ่น `-๒-` ว่าง · ล้นเมื่อข้อความจริงเกินพื้นที่ · **ห้าม** โชว์รหัสฟอร์ม · **ไม่มี** §หัวสถานที่บันทึก (คดีที่ซ้าย · สถานีตำรวจ+วันที่ช่องที่ 3)

| ชิ้น | ค่า |
|---|---|
| ชื่อบนแผ่น 1 | `ใบนำส่งผู้บาดเจ็บหรือศพให้แพทย์ตรวจชันสูตร` (กึ่งกลาง) · ครุฑ |
| หัวหน้า 1 | กริด 3 ส่วน: ช่อง 1 `คดีที่` · ช่อง 2 ว่าง · ช่อง 3 `สถานีตำรวจ` แล้วแถว `วันที่` · `เดือน` · `พ.ศ.` |
| หน้า 1 | เลขที่ · ชื่อผู้บาดเจ็บหรือศพ · วันเวลาที่เกิดเหตุ · วันเวลาส่ง · ชื่อผู้นำส่ง · `เหตุที่ต้องบาดเจ็บหรือตายด้วยประการใดโดยย่อ กล่าวคือ .-` เส้นเต็มพื้นที่ที่เหลือ · ลงชื่อชิดขวา ~62% `(ลงชื่อ)……พนักงานสอบสวน / บันทึก` / `( )` / `(ตำแหน่ง)` |
| ชื่อบนแผ่น 2 | `ผลการตรวจชันสูตรบาดแผลหรือศพของแพทย์` (กึ่งกลาง) · ไม่มีครุฑ |
| หน้า 2 | เลขที่ · ตำบลที่แพทย์ตรวจ · ชื่อผู้บาดเจ็บหรือศพ · สถานีตำรวจที่นำส่ง · รับไว้วันที่/เดือน/พ.ศ./เวลา น. · `รายการที่แพทย์ได้ตรวจและความเห็น` เส้นเต็มพื้นที่ที่เหลือ · ลงชื่อชิดขวา ~62% `(ลงชื่อ)……นายแพทย์ผู้ตรวจ` / `( )` |
| ข้อความยาว | เหตุโดยย่อ · ความเห็นแพทย์ พิมพ์ต่อในช่องได้ · **ไม่** สร้างแผ่น `-๒-` ว่างจากหน้า 1 · ล้นเมื่อข้อความจริงเกินแล้วค่อยเพิ่มหน้า |
| slug | `injury-referral` · `/templates/preview/injury-referral` |
| UI | `OfficialInjuryReferralSheet.tsx` · `SmartPoliceInjuryReferralPreviewClient.tsx` |

## หนังสือส่งตรวจพิสูจน์

ต้นแบบ Word `หนังสือส่งตรวจพิสูจน์.docx` (blankFormId `28`) — **ค่าเริ่ม ๑ แผ่น A4** · ล้นช่องข้อ ๕–๑๐ แล้วเพิ่มหน้า · **ห้าม** โชว์รหัสฟอร์ม · **ห้าม** ใส่หมายเหตุ · **ไม่มี** §หัวสถานที่บันทึก (โครงบันทึกข้อความ)

| ชิ้น | ค่า |
|---|---|
| ชื่อบนแผ่น | `บันทึกข้อความ` (กึ่งกลาง · `20pt`) · ครุฑซ้าย |
| อักษร | **15pt** · ระยะบรรทัด `7.2mm` |
| หัว | `ส่วนราชการ` + `โทร` · `ที่` / `ลง` · `เรื่อง` · **เส้นทึบหนา** · `เรียน` · ข้อความนำ `พนักงานสอบสวนขอส่งของกลางมาเพื่อให้ตรวจพิสูจน์ดังนี้` |
| ข้อ | (๑) เลขที่คดี · ชื่อผู้ต้องหา · อายุ · สัญชาติ · (๒) วันเดือนปีที่เกิดเหตุ · (๓) สถานที่เกิดเหตุ · (๔) ชื่อผู้กล่าวหา · อายุ · สัญชาติ · (๕) ข้อกล่าวหา · (๖) พฤติการณ์ · (๗) สถานที่พบของกลาง · (๘) รายการของกลาง **เพิ่ม/ลดข้อย่อยได้** (ค่าเริ่ม ๘.๑–๘.๓) · (๙) จุดประสงค์ **เพิ่ม/ลดข้อย่อยได้** (ค่าเริ่ม ๙.๑–๙.๓) · (๑๐) ชื่อพนักงานสอบสวน |
| ท้าย | หน้าสุดท้าย ชิดขวา ~62% `(ลงชื่อ)……พนักงานสอบสวน` / `( )` / `(ตำแหน่ง)` |
| ข้อความยาว | ข้อ ๕–๑๐ พิมพ์ต่อในช่องได้ · ล้นแล้วเพิ่มหน้าอัตโนมัติ · เลข `-๒-` เฉพาะแผ่นต่อ |
| slug | `forensic-request` · `/templates/preview/forensic-request` |
| UI | `OfficialForensicRequestSheet.tsx` · `SmartPoliceForensicRequestPreviewClient.tsx` |

## บันทึกควบคุม

ต้นแบบ Word `บันทึกควบคุม.docx` (blankFormId `29`) — **ค่าเริ่ม ๒ แผ่น A4** · ตารางล้นแล้วเพิ่มหน้า · **ห้าม** โชว์รหัสฟอร์ม · **ไม่มี** §หัวสถานที่บันทึก (คดีที่ซ้าย · สถานีตำรวจขวา)

| ชิ้น | ค่า |
|---|---|
| ชื่อบนแผ่น | `บันทึกการควบคุมผู้ต้องหา` (กึ่งกลาง) · ครุฑ |
| หัวหน้า 1 | `คดีที่` · `สถานีตำรวจ` · **คดีระหว่าง ปีกกา** ผู้กล่าวหา/ผู้ต้องหา · `ฐานความผิด` · `วันและเวลาเริ่มการควบคุม` |
| ตาราง | **15pt** · หัวสูง `14mm` · คอลัมน์วันที่ `32mm` · ลายเซ็น `40mm` · `วัน เดือน ปี` · `รายการกระทำเฉพาะวัน` · `ลงชื่อพนักงานผู้สอบสวน` · `ลงชื่อหัวหน้าพนักงานสอบสวน` · เส้นทึบนอก + เส้นตั้ง · **ไม่มีเส้นนอนในช่อง** · พิมพ์ต่อในช่องได้ · ยืดเต็มพื้นที่ที่เหลือ |
| หน้า 2+ | เลข `(๒)` · ตารางต่อ · เชิงอรรถ ๑–๒ ตามต้นฉบับท้ายแผ่นสุดท้าย |
| slug | `custody-log` · `/templates/preview/custody-log` |
| UI | `OfficialCustodyLogSheet.tsx` · `SmartPoliceCustodyLogPreviewClient.tsx` |

## สัญญาประกัน

ต้นแบบ Word `สัญญาประกัน.docx` (blankFormId `30`) — **ค่าเริ่ม ๒ แผ่น A4** · ล้นช่องต้องหาว่า/ตอบ/ข้อ ๓ แล้วเพิ่มหน้า · ตารางนัด/ทรัพย์เพิ่มแถวได้ · **ห้าม** โชว์รหัสฟอร์ม · **มี** §หัวสถานีตำรวจ+วันที่ชิดขวาช่องที่ 3

| ชิ้น | ค่า |
|---|---|
| ชื่อบนแผ่น 1 | `คำร้องขอประกัน` (กึ่งกลาง) · ครุฑ |
| คำร้อง | §หัวสถานีตำรวจช่องที่ 3 · วันที่/เดือน/พ.ศ. แถวถัดไปในช่องที่ 3 · ข้าพเจ้า/อายุ ขอประกันตัว · ต้องหาว่า · หลักทรัพย์ท้ายสัญญา · ลงชื่อชิดขวา ~62% ผู้ยื่นคำร้อง · สอบถามนายประกัน ข้อ ๑–๒ + ตอบ · ลงชื่อนายประกัน/พนักงานสอบสวน |
| สัญญา | `สัญญาประกัน` · §หัวเขียนที่ช่องที่ 3 · วันที่/เดือน/พ.ศ. แถวถัดไปในช่องที่ 3 · ตัวตนนายประกัน · ข้อ ๑ ประกันตัว/ต้องหาว่า · ข้อ ๒ ใช้เงินตัวเลข/ตัวอักษร · ข้อ ๓ หลักทรัพย์ · ลงชื่อชิดขวา ผู้ประกัน/ผู้รับสัญญา/พยาน/พยานผู้เขียน |
| หน้า 2 | `กำหนดวันเวลาให้ส่งผู้ต้องหาต่อผู้ให้ประกัน` ตารางเส้นทึบ **15pt** แถว `7.8mm` · `บัญชีทรัพย์สินของผู้ประกัน…` ตารางราคาบาท/ส.ต. · ลงชื่อผู้ประกันชิดขวา |
| slug | `bail-bond` · `/templates/preview/bail-bond` |
| UI | `OfficialBailBondSheet.tsx` · `SmartPoliceBailBondPreviewClient.tsx` |

## หนังสือแจ้งสืบสวน

ต้นแบบ Word `แจ้งสืบสวน.docx` (blankFormId `31`) — **ค่าเริ่ม ๑ แผ่น A4** · ล้นช่องรายละเอียดผู้ต้องหา/เหตุเกิด/โดยกล่าวหาว่าแล้วเพิ่มหน้า · **ห้าม** โชว์รหัสฟอร์ม · **ห้าม** ใส่หมายเหตุ · **ไม่มี** §หัวสถานที่บันทึก (โครงบันทึกข้อความ — **คัดลอกส่วนหัวจากหนังสือส่งตรวจพิสูจน์**)

| ชิ้น | ค่า |
|---|---|
| ชื่อบนแผ่น | `บันทึกข้อความ` (กึ่งกลาง · `20pt`) · ครุฑซ้าย |
| อักษร | **15pt** · ระยะบรรทัด `7.2mm` |
| หัว | `ส่วนราชการ` + `โทร.` · `ที่` / `วันที่` · `เรื่อง` ค่าเริ่ม `ให้สืบสวนหาตัวคนร้าย` · **เส้นทึบหนา 2.25pt** · `เรียน` ค่าเริ่ม `เจ้าหน้าที่ฝ่ายสืบสวน` |
| เนื้อ | `ด้วยเมื่อวันที่` **ย่อหน้า 1 tab (12mm)** + จุดไข่ปลา + `ผู้ต้องหา` ชิดขวา · รายละเอียดผู้ต้องหา ≥๒ บรรทัด · `เหตุเกิด` ≥๒ บรรทัด · `พนักงานสอบสวนได้รับคำร้องทุกข์ไว้เป็นคดีอาญาที่` · `ลงวันที่` · `ปจว.ข้อ` · `เวลา` · `น.` · `โดยกล่าวหาว่า` ≥๑ บรรทัด |
| ท้าย | ข้อความปิด `ฉะนั้น … ทุกระยะ ๑๕ วัน` · ลงชื่อ**ต่อจากบรรทัดสุดท้าย** (ไม่ดันชิดล่างแผ่น) ชิดขวา ~62% `ลงชื่อ` / `( )` / `ตำแหน่ง` |
| ข้อความยาว | พิมพ์ต่อในช่องได้ · ล้นแล้วเพิ่มหน้าอัตโนมัติ · เลข `-๒-` เฉพาะแผ่นต่อ |
| slug | `investigate-notice` · `/templates/preview/investigate-notice` |
| UI | `OfficialInvestigateNoticeSheet.tsx` · `SmartPoliceInvestigateNoticePreviewClient.tsx` |

## บันทึกข้อความ

คัดลอกส่วนหัวจากหนังสือแจ้งสืบสวน — **ค่าเริ่ม ๑ แผ่น A4** · เนื้อหาว่างไม่มีรายละเอียดคดี · ล้นช่องเนื้อแล้วเพิ่มหน้า · **ห้าม** โชว์รหัสฟอร์ม · **ห้าม** ใส่หมายเหตุ · **ไม่มี** §หัวสถานที่บันทึก (โครงบันทึกข้อความ)

| ชิ้น | ค่า |
|---|---|
| ชื่อบนแผ่น | `บันทึกข้อความ` (กึ่งกลาง · `20pt`) · ครุฑซ้าย |
| อักษร | **15pt** · ระยะบรรทัด `7.2mm` |
| หัว | `ส่วนราชการ` + `โทร.` · `ที่` / `วันที่` · `เรื่อง` ว่าง · **เส้นทึบหนา 2.25pt** · `เรียน` ว่าง |
| เนื้อ | ช่องจุดไข่ปลาว่าง ย่อหน้าแรก 1 tab (12mm) · พิมพ์ต่อในช่องได้ |
| ท้าย | ลงชื่อ**ต่อจากบรรทัดสุดท้าย** ชิดขวา ~62% `ลงชื่อ` / `( )` / `ตำแหน่ง` |
| slug | `official-memo` · `/templates/preview/official-memo` |
| UI | `OfficialMemoSheet.tsx` · `SmartPoliceMemoPreviewClient.tsx` |

## หมายเรียกพยาน

ต้นแบบ Word `หมายเรียกพยาน.docx` (blankFormId `35`) — **ค่าเริ่ม ๑ แผ่น A4** · ล้นช่องด้วยเหตุ/ฉะนั้นให้แล้วเพิ่มหน้า · **ห้าม** โชว์รหัสฟอร์ม · **มี** §หัวสถานที่บันทึก (`สถานที่ออกหมาย` + `วันที่`/`เดือน`/`พ.ศ.` ช่องที่ 3) · ครุฑกึ่งกลาง + `สำนักงานตำรวจแห่งชาติ` · **มี** ใบรับหมายตำรวจท้ายแผ่น

| ชิ้น | ค่า |
|---|---|
| ชื่อบนแผ่น | `หมายเรียกพยาน` (กึ่งกลาง · ขีดเส้นใต้ · `15pt`) ใต้ `สำนักงานตำรวจแห่งชาติ` `18pt` |
| หัว | §หัวสถานที่บันทึก: กริด 3 ส่วน · ช่อง 1–2 ว่าง · ช่อง 3 `สถานที่ออกหมาย` + จุด · แถวถัดไป `วันที่` · `เดือน` · `พ.ศ.` แถวเดียว |
| เนื้อ | `คดีอาญาที่` · **คดีระหว่าง ปีกกา** (ผู้กล่าวหา บน / ผู้ต้องหา ล่าง · ป้ายชิดขวา) · `อาศัยอำนาจตามประมวลกฎหมายวิธีพิจารณาความอาญา พุทธศักราช ๒๔๗๗ มาตรา ๕๒` · `หมายมายัง` · `บ้านเลขที่` · `ถนน` · `แขวง/ตำบล` · `เขต/อำเภอ` · `จังหวัด` · `ผู้ใหญ่บ้าน/กำนัน` · `ด้วยเหตุ` (เส้นต่อเนื่อง) · `ฉะนั้นให้` (เส้นต่อเนื่อง) |
| นัดพบ | `ไป ณ ที่` + จุด · `ในวันที่` · `เดือน` · `พ.ศ.` · `เวลา` · `นาฬิกา` แถวเดียว |
| ท้าย | ลงชื่อชิดขวา ~62%: `ลงชื่อ……ผู้ออกหมาย` · `( )` วงเล็บเสมอกัน · `ตำแหน่ง` · **กล่องคำเตือน** กรอบทึบ `คำเตือน` + ป.อาญา ม.๑๖๘ |
| ใบรับหมาย | เส้นตัด `0.5pt dashed` · `ใบรับหมายตำรวจ` (กึ่งกลาง ขีดเส้นใต้) · `วันที่`/`เดือน`/`พ.ศ.`/`เวลา` · `ข้าพเจ้าได้รับหมายเรียกพยานของเจ้าพนักงานตำรวจ ซึ่งกำหนดให้ข้าพเจ้าไปยัง……` · `ในวันที่……เวลา……นาฬิกา ไว้แล้ว` · ลงชื่อ **2 คอลัมน์** ซ้าย `ผู้รับหมาย` / ขวา `ผู้ส่งหมาย` |
| ข้อความยาว | `ด้วยเหตุ` · `ฉะนั้นให้` พิมพ์ต่อในช่องได้ · ล้นแล้วเพิ่มหน้าอัตโนมัติ (`packWitnessSummonsPages`) · เลข `-๒-` เฉพาะแผ่นต่อ · ลงชื่อ/คำเตือน/ใบรับหมายอยู่หน้าสุดท้าย |
| slug | `witness-summons` · `/templates/preview/witness-summons` |
| UI | `OfficialWitnessSummonsSheet.tsx` · `SmartPoliceWitnessSummonsPreviewClient.tsx` |

| บทบาท | ไฟล์ |
|-----|-----|
| แผ่น A4 + ชุดหน้า + เอกสารทั้งชุด | `src/systems/smart-police/components/OfficialStatementFormSheet.tsx` (`OfficialStatementFormSheet` · `OfficialStatementFormDocument`) |
| ช่องพิมพ์ถาม–ตอบ (แถว · Enter · ไหลข้ามหน้า) | `src/systems/smart-police/components/StatementQaEditor.tsx` |
| ชุดหน้า / ใบต่อ / ไหลข้อความ | `src/lib/smart-police/form-templates/fill-statement.ts` (`statementPageSlot` · `flowStatementOverflow` · `appendContinuationSheetPair` · `removeStatementPageAt`) |
| CSS ช่องจุด · พิมพ์ | `src/app/globals.css` (`.sp-word-field` · `.sp-qa-cell` · `@media print .sp-a4-sheet`) |
| หน้าดูแม่แบบ / แก้ไขในคดี | `SmartPoliceStatementTemplatePreviewClient.tsx` · `SmartPoliceStatementEditorClient.tsx` |

---

## 1) กระดาษ · อักษร

| ค่า | ใช้ |
|---|---|
| `210mm × 297mm` · `overflow: hidden` · `box-sizing: border-box` | ทุกแผ่น (`.sp-a4-sheet`) |
| `"TH Sarabun New", "TH SarabunPSK", Sarabun, "Cordia New", Tahoma, sans-serif` | อักษรทั้งฟอร์ม |
| **`15pt` (`BODY` / `STMT`)** | **มาตรฐานทุกแม่แบบ** ทั้งข้อความ ช่องกรอก ตาราง แถบซ้าย ถาม–ตอบ ลงชื่อ หน้า 2 / ใบต่อ |
| `15pt` ตัวหนา ขีดเส้นใต้ (`underlineOffset 1mm`) | ชื่อแบบฟอร์มทั่วไป |
| `18pt`–`20pt` ตัวหนา | «สำนักงานตำรวจแห่งชาติ» · หัว `บันทึกข้อความ` |
| รหัสแบบ | **ห้าม** โชว์ `(ส ๕๖ - ๔)` / `(ส ๕๖ - ๖)` / `(ส ๕๖ - ๘)` บนแผ่น |
| ครุฑ `/smart-police/garuda.png` สูง `24mm` กึ่งกลาง | หัวหน้าแรก |
| สีตัวอักษร `#111` · พื้นขาว | ทั้งฟอร์ม |

ป้ายหน้าช่อง (เช่น «สถานีตำรวจ») = **ตัวหนา** `flex-shrink: 0`

---

## 2) ระยะแถว · ช่องกรอก · เส้น

| ค่า | ใช้ |
|---|---|
| `LINE = 7.2mm` | ระยะแถวช่องกรอกทั่วไป (`Row`: flex wrap · baseline · `gap 0 1.5mm`) — คู่กับตัวอักษร 15pt |
| `SIGN_LINE = 6.7mm` | แถวลงชื่อ — หลายช่องให้จัด **2 คอลัมน์** ตาม §ลงชื่อ 2 คอลัมน์ · จนท.ท้ายสุดอยู่ขวา |
| `STMT_LINE = 9.0mm` | ระยะบรรทัดโซนถาม–ตอบ คำให้การ (คู่กับ `STMT` 15pt) |
| **จุดไข่ปลา** `border-bottom: 0.5pt dotted #111` | ทุกช่องกรอก (`.sp-word-field`) และทุกเส้นบรรทัดถาม–ตอบ — **ชุดเดียวกัน** |
| **เส้นทึบ** `0.55pt solid #111` | เส้นแบ่งแถบซ้ายหน้าแรก · เส้นตั้งด้านเย็บเล่มหน้าหลัง/ใบต่อ |

- ช่องกรอก: `<input class="sp-word-field">` ไม่มีกรอบ/พื้น/เงา · focus ยังเป็นจุดเดิม (ห้าม ring ฟ้า)
- ช่องสั้น `Dot` (ความกว้างตามตัวอักษร `minCh`) · ช่องเต็มแถว `Line` / `Dot flex`
- **ป้าย + ช่องต้องอยู่แถวเดียวกัน** (เช่น ออกเมื่อ · หมดอายุ · ออกให้ ณ) — ห้ามป้ายบรรทัดหนึ่ง ช่องอีกบรรทัด เว้นป้ายยาวที่ตั้งใจวางเหนือ `Line`
- **ห้าม** ใช้ `repeating-linear-gradient` หรือจุดขนาดอื่นแทน `0.5pt dotted`

---

## 3) หน้าแรก (ส ๕๖-๔ ด้านหน้า)

- padding แผ่น `16mm 12mm 14mm 6mm`
- grid `40mm 1fr` × แถว `auto 1fr`
  - ซ้ายบน: ช่องว่างมีเส้นขวา — ให้ «คำให้การของ» เริ่ม **แนวเดียวกับแถวสถานีตำรวจ**
  - ขวาบน: ครุฑ + ชื่อหน่วย + ชื่อแบบฟอร์ม
  - ซ้ายล่าง (`aside` `15pt` · `gap 2.5mm` · เส้นขวา): ข้อมูลผู้ให้ถ้อยคำ · ลงชื่อบันทึก — **ห้าม** โชว์รหัสฟอร์ม
  - ขวาล่าง (`padding-left 3.5mm`): ช่องหัวฟอร์ม → ข้อความนำ «ขอให้ถ้อยคำต่อพนักงานสอบสวนด้วยความสัตย์จริงว่า» (`margin 0.3mm 0 3.5mm`) → **ถาม–ตอบเต็มพื้นที่ที่เหลือ** (`fill`)

---

## 4) หน้าหลัง / ใบต่อ (มีเส้นอย่างเดียว)

แผ่น `padding: 0` · จัดตำแหน่งแบบ absolute — ด้านเย็บเล่มเว้นกว้าง

| ค่า | |
|---|---|
| `LINED_TOP 28mm` · `LINED_BOTTOM 22mm` | ขอบบน/ล่างกรอบเส้น |
| `LINED_EDGE 14mm` | ขอบด้านนอก |
| `LINED_BINDING 50mm` | ขอบด้านเย็บ (มีเส้นทึบตั้ง · เว้น `2.5mm` จากข้อความ) |

| หน้า | หัว | เส้นตั้ง | ลงชื่อแนวตั้ง (ขอบเย็บ) | รหัสฟอร์ม |
|---|---|---|---|---|
| หน้าหลัก (หลังแผ่น 1) | ไม่มี | **ขวา** | หมุน 90° ในขอบขวา · ป้ายตามบทบาท | ไม่มี |
| ใบต่อ · หน้า | «ใบต่อคำให้การ ของ [ชื่อ] แผ่น [เลข]» บน `14mm` | **ซ้าย** | หมุน −90° ในขอบซ้าย · ป้ายตามบทบาท | ไม่โชว์รหัสแบบ |
| ใบต่อ · หลัง | ไม่มี | **ขวา** | หมุน 90° ในขอบขวา · ป้ายตามบทบาท | ไม่มี |

หน้า 2 และใบต่อ **ต้อง**มีแถบลงชื่อแนวตั้งในขอบเย็บ (`BindingMarginSignStrip`) — อักษร **15pt** (`STMT`) · ระยะ `STMT_LINE` · แถวบน «อ่านให้ฟังแล้วรับว่าเป็นความจริงถูกต้อง» · แถวล่างลงชื่อตามบทบาท · ป้าย `ผู้กล่าวหา` / `พยาน` / `ผู้ต้องหา` ตาม slug · **ห้าม**โชว์ `(ส ๕๖ - ๖)` · หัวใบต่อ «ใบต่อคำให้การ ของ» ก็ **15pt** · หน้าสุดท้ายยังมีบล็อก «อ่านให้ฟังแล้ว» ต่อท้ายถาม–ตอบเพิ่ม

---

## 5) ชุดหน้า

1 ชุด = **หน้าแรก + หน้าหลัก** (index 0–1 ลบไม่ได้) → **ใบต่อเป็นคู่ หน้า+หลัง** (index 2+)
ใช้ `statementPageSlot(i)` ตัดสิน kind / side / sheetNo — **ห้าม** hardcode ตาม index ในหน้า UI · **ห้าม**ใส่รหัสฟอร์มใน slot / แผ่น

- แสดง **ทุกหน้าเรียงต่อกันลงมาแบบ Word** (`OfficialStatementFormDocument`) — ไม่สลับทีละหน้า
- ลบใบต่อ = ลบทั้งคู่ (`removeStatementPageAt`)

---

## 6) ถาม–ตอบแบบ Word (`StatementQaEditor`)

โครง: **แถวละ 1 ย่อหน้า**

| ชนิด | พฤติกรรม |
|---|---|
| **ถาม / ตอบ** | ป้ายชิดซ้าย · **รายละเอียดเยื้อง 1 tab ทั้งก้อน** รวมเมื่อขึ้นบรรทัดใหม่ (hanging) |
| **Enter** (`cont`) | ขึ้นบรรทัดใหม่ **ชิดซ้ายสุด** — พิมพ์ `ถาม`/`ตอบ` แล้ว Tab เพื่อเข้าช่องรายละเอียด |
| **Tab ครั้งที่ 1** | รายละเอียด (`body`) เยื้อง 1 tab ทั้งก้อน — ห่อบรรทัดยังเยื้อง |
| **Tab ครั้งที่ 2** | ย่อหน้า (`para`) บรรทัดแรกเยื้อง **2 tab** · **ห่อบรรทัดเยื้อง 1 tab** (ห้ามชิดซ้ายสุด) |
| ไหลหน้า 2 | ต่อรายละเอียดเป็น `body` — **ห้าม**ชิดขอบซ้าย |

grid ถาม/ตอบ/body = `12mm \| 1fr` · Enter ชิดซ้ายเต็มแถว · `tab-size: 12mm`
`white-space: pre-wrap` · `overflow-wrap: anywhere`
เส้นจุดพื้นหลังสูง `STMT_LINE` ต่อแถว — ทุกบรรทัดข้อความต้องอยู่บนเส้น

| ปุ่ม | พฤติกรรม |
|---|---|
| คลิกพื้นที่ว่าง | เคอร์เซอร์ท้ายแถวสุดท้าย (ช่องแรกพิมพ์ได้ทันที) |
| **Enter** | ย่อหน้าใหม่ **ชิดซ้ายสุด** ไม่มีป้าย |
| กดป้ายซ้าย | สลับ ถาม → ตอบ → ว่าง |
| Shift+Enter | ขึ้นบรรทัดในแถวเดิม |
| **Tab** | ต้นแถว: ครั้งที่ 1 = รายละเอียด · ครั้งที่ 2 = ย่อหน้า Word · ในข้อความ = แท็บปกติ |
| Shift+Tab / Backspace ต้นแถว | ลดขั้นย่อหน้า |
| Backspace ต้นแถว | รวมกับแถวก่อน |
| ↑ ต้นแถว / ↓ ท้ายแถว | ย้ายแถว |
| วาง (paste) | ข้อความล้วนเท่านั้น |

placeholder ช่องว่าง: «พิมพ์คำถาม…» / «พิมพ์คำตอบ…» (`.sp-qa-cell[data-empty]::before` สี `#9ca3af`)
**ผู้ต้องหา:** ช่องว่างเริ่มต้นเป็นย่อหน้า**ไม่มีป้าย** (`emptyKind: cont`) — ไม่ขึ้นต้น «ถาม» ให้พิมพ์ข้อหา/ข้อความอื่นก่อน แล้วค่อยกดคอลัมน์ซ้ายใส่ป้าย · ไม่ seed คำถามตั้งต้น

**รูปแบบเก็บ** (`page.text`): บรรทัดละแถว `ถาม {ข้อความ}` / `ตอบ {ข้อความ}` · ย่อหน้าที่ต่อจากหน้าก่อน = บรรทัด**ไม่มีป้าย**ต้นหน้า · ว่าง = `""`

### ห้าม (บทเรียนที่พังมาแล้ว)

- ใช้ contentEditable ก้อนเดียว + `ถาม\t` + `text-indent` ติดลบ ทำ hanging indent — แท็บเลื่อน ป้ายหลุดบรรทัด
- ใช้ `\b` ใน regex กับภาษาไทย — จับ «ตอบ» ไม่ได้ วนสร้างตอบตลอด
- เขียน `innerText` ทับช่องที่กำลัง focus (เคอร์เซอร์กระโดด) — ช่องเป็น uncontrolled อัปเดตเฉพาะตอนไม่ focus
- รับ `insertParagraph` ซ้ำจากทั้ง keydown และ beforeinput — keydown `preventDefault` แล้ว beforeinput ใช้เป็นสำรองมือถือ

---

## 7) ไหลข้ามหน้าอัตโนมัติ

- พิมพ์จน**เต็มบรรทัดสุดท้าย**ของหน้า → ส่วนเกินไปต้นหน้าถัดไป · เคอร์เซอร์ตามไป
- ย่อหน้าที่ไม่พอดีหน้า **ตัดตรงจุดขึ้นบรรทัดจริง** (`fitTextLength` วัด rect ตัวอักษร) — ห้ามย้ายทั้งก้อนจนเหลือบรรทัดว่าง
- หน้าสุดท้ายเต็ม → `flowStatementOverflow` **ต่อใบต่อคู่ใหม่เอง** (ไม่ต้องกดปุ่มเพิ่ม)
- หน้าถัดไปขึ้นต้นด้วยย่อหน้าต่อจากถาม/ตอบ → ชนิด `body` เยื้อง 1 tab ทั้งก้อน (ห่อบรรทัดยังเยื้อง) ไม่ซ้ำป้าย
- กล่องช่องพิมพ์เมื่อเปิดไหล: `overflow-y: hidden` + **ล็อก `scrollTop = 0`** (เบราว์เซอร์เลื่อนกล่องตามเคอร์เซอร์ → วัดผิดว่ายังไม่เต็ม)
- Enter ไม่สลับถาม/ตอบ — ชิดซ้าย (`cont`) · พิมพ์ถาม/ตอบแล้ว Tab · Tab 1 รายละเอียด · Tab 2 ย่อหน้า Word

ยังไม่รองรับ: ลบข้อความแล้วดึงข้อความหน้าถัดไปกลับขึ้นมา

---

## 8) แถบเครื่องมือเหนือเอกสาร

- **แถวเดียว** พื้น `slate-800` · ปุ่มสูง `h-8` · ตัวอักษร `11px`
- ซ้าย→ขวา: ปุ่ม **กลับ** (chevron + ข้อความ · ลิงก์รายการแม่แบบ) · ชื่อแม่แบบ (truncate) · **ปุ่มเลขหน้า `1 2 3 …`** (`title`/`aria-label` = ชื่อเต็ม เช่น «ใบต่อ 1 · หลัง» · หน้าปัจจุบันพื้นขาว) · «ลบใบต่อนี้» เฉพาะเมื่อเคอร์เซอร์อยู่ใบต่อ · ปุ่มหลักชิดขวา
- หน้าดูแม่แบบอยู่ใน shell โมดูล (ไม่ `fixed` ทับทั้งจอ) — กดรายการแล้วไป `/templates/preview/{slug}`
- กดเลขหน้า = เลื่อนไปหน้านั้น (`scrollRequest`) · หน้าปัจจุบัน = หน้าที่ focus อยู่ (`onActivePageChange`)
- **ห้าม** ปุ่มที่ไม่มีหน้าที่แล้ว (เช่น «+ ใบต่อ» ในหน้าดูแม่แบบ — ไหลอัตโนมัติแทน) · ข้อความอธิบายยาวในแถบ

---

## 9) พิมพ์

`@media print`: `.sp-a4-sheet` = `210×297mm` · ไม่มีเงา/margin · `page-break-after: always` — หนึ่งแผ่นต่อหนึ่งหน้ากระดาษ

## เช็กลิสต์ฟอร์มใหม่

- [ ] A4 HTML + อักษร/ขนาดตาม §1
- [ ] ช่องกรอก `.sp-word-field` จุด `0.5pt dotted` · ป้ายแถวเดียวกับช่อง
- [ ] ระยะแถว `LINE` / `STMT_LINE` · เส้นทึบ `0.55pt`
- [ ] โซนข้อความยาวใช้ `StatementQaEditor` (หรือขยาย prop) — ไม่เขียน editor ใหม่
- [ ] ชุดหน้าผ่าน helper ใน `form-templates` · ไหลข้ามหน้า · เรียงหน้าแบบ Word
- [ ] แถบเครื่องมือแถวเดียว · เลขหน้า
- [ ] ทดสอบในเบราว์เซอร์: Enter/Tab/ไหลข้ามหน้า/ย่อหน้ายาวเกินหน้า

คู่กับ: `smart-police-module-dashboard-template.mdc` (โมดูล/สำนวน)


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
### .cursor/rules/used-car-showroom-module-dashboard-template.mdc
================================================================================

---
description: แม่แบบโมดูลโชว์รูมรถมือสอง (used-car-showroom) — ยึดซักผ้า·ชมรม·โรงแรม · กรอง+FormModal · ตั้งค่าครบ · กล่องเต็มขอบ
globs:
  - "**/systems/used-car-showroom/**"
  - "**/app/**/dashboard/used-car-showroom/**"
  - "**/app/car/**"
  - "**/app/api/used-car-showroom/**"
alwaysApply: false
---

# โชว์รูมรถมือสอง — แม่แบบโมดูล (used-car-showroom)

**Slug:** `used-car-showroom` · **แสดง:** โชว์รูมรถมือสอง · **groupId:** 1  
**แดชบอร์ด:** `/dashboard/used-car-showroom` · **พอร์ทัล:** `/car/[slug]` · หน้ารถ `/car/[slug]/v/[vehicleId]`

**ยึดแม่แบบหลักก่อนเสมอ:**  
`dashboard-module-design-check-laundry-first.mdc` · `laundry-module-dashboard-template.mdc` · `laundry-module-portal-website-template.mdc` · `dashboard-module-shop-settings-tabs.mdc` · `dashboard-module-list-filter.mdc` · `dashboard-page-width.mdc` · `dashboard-finance-module-template.mdc` · `club-event` (YouTube/แกลเลอรี) · `hotel-resort` (ชำระเงิน CASH|PROMPTPAY|TRANSFER|CREDIT_CARD)

---

## 0) ห้ามลืม (ทำไมเคยพลาด)

| ผิด | ถูก |
|-----|-----|
| รายการจัดการไม่มีกรอง / เพิ่มแบบช่อง inline | **ทุกแท็บย่อย** มีปุ่มแสดง/ซ่อนกรอง + **+ เพิ่ม → FormModal** |
| ตั้งค่ามีแค่ชื่อ/โลโก้ | พื้นฐาน · การเงิน (ภาษี·PIN·สลิป·มัดจำ) · เว็บ (แบนเนอร์·แกลเลอรี·โซเชียล) · เวลาเปิด · ลิงก์ QR |
| `px-*` / `max-w-*` ซ้ำรอบเนื้อหา | `WIDE_MODULE` + `usedCarShowroomPageStackClass` · แผง `usedCarShowroomPanelClass` เต็มความกว้างใต้ Shell |
| จองออนไลน์ไม่มีมัดจำ | **จองกันคัน = มัดจำ+สลิป** · **นัดดูรถ = ฟอร์มอย่างเดียว** |
| ค่างวดซับซ้อน | **flat อย่างเดียว** (เทียบราคาหน้าเต็นท์) |

---

## 1) เมนูหลัก (dock 4)

| key | หน้า |
|-----|------|
| dashboard | ภาพรวม · สต็อก · จอง · นัด · ไฟแนนซ์รอ · คิดค่างวด (flat) |
| manage | รถ · P&L · พนักงาน · โปร · ลูกค้า · บริษัทไฟแนนซ์ |
| finance | รายรับ/รายจ่าย · กรอง/กราฟ · สลิป · ค่าคอมต้อง `vehicleId` |
| settings | basic · finance · portal · hours · link |

Chrome: `UsedCarShowroomModuleChrome` · ยุบหัว → `UsedCarShowroomHeaderBarNav` ใน `DashboardShell`  
Tokens: `src/systems/used-car-showroom/lib/ui-tokens.ts`  
Sub-nav: `UsedCarShowroomPageSubNav` (panel เต็มขอบการ์ด)

---

## 2) การจัดการ — กรอง + FormModal (บังคับทุกแท็บ)

คู่กับ `dashboard-module-list-filter.mdc` · `dashboard-mobile-list-header-actions.mdc`

1. ปุ่ม **แสดง/ซ่อนกรอง** ทุก breakpoint (มือถือไอคอน · `sm+` มีข้อความ) + badge เมื่อกรองค้างและแผงปิด  
2. แผงกรอง: ชิปสถานะ + ค้นหา + ล้างเมื่อค้าง  
3. ปุ่ม **+ เพิ่ม** → `FormModal` + `mobileCentered` ใส่ฟิลด์ครบของแท็บนั้น  
4. ลำดับ action ขวา: **กรอง → เพิ่ม**  
5. P&L: มีกรองได้ · ไม่บังคับปุ่มเพิ่ม  
6. ลบ: `useAppNoticePopup().confirm` เท่านั้น  
7. วันที่โปร: `bangkokDateKey()` — ห้าม `toISOString().slice(0,10)`

อ้างอิงโค้ด: `UsedCarShowroomManageClient.tsx` · แม่แบบ `LaundryPackagesClient` / `LaundryPurchasesClient`

---

## 3) ตั้งค่า — แท็บมาตรฐาน

ตาม `dashboard-module-shop-settings-tabs.mdc`

| tab | เนื้อหา |
|-----|---------|
| basic | ชื่อ · โลโก้ · คำโปรย · เบอร์ · ที่อยู่ · **ละติจูด/ลองจิจูด + ดึงพิกัดจากเครื่อง** |
| finance | `AppModuleShopPaymentFields` · **อัปโหลดรูป QR พร้อมเพย์** · มัดจำ/โหมดจอง · `AppStaffDailyPinSettingsField` · `AppSlipPaperSizeSettingsField` |
| portal | slug · เปิดเว็บ · **LINE · FB · แผนที่** · **`UsedCarPortalMediaSettings`** (แบนเนอร์+แกลเลอรี+โซเชียล) |
| hours | `AppTime24Input` เปิด–ปิด (เวลาไทย) |
| link | `ModuleQrMonthlyGate` **ครั้งเดียว** + การ์ดลิงก์ลูกค้า/พนักงาน |

Prisma ร้าน: `taxId` · `slipPaperSize` · `portalBannerUrl` · `portalGalleryJson` · `staffDailyPinHash` · `portalBookingPaymentMode` · `depositAmountBaht` · `promptPayQrImageUrl` · **`shopLat` · `shopLng`**

### การเงิน — หมวดหมู่รายรับ/รายจ่าย

ตาม `dashboard-expense-cost-categories.mdc` · `dashboard-finance-detail-tabs.mdc`

- ปุ่ม **หมวดหมู่** บนทั้งแท็บรายรับและรายจ่าย → `FormModal` CRUD
- ชิปกรองหมวดใต้รายการ · บังคับเลือกหมวดตอนบันทึก
- API: `POST …/ledger` `action=createCategory|updateCategory|deleteCategory` · หมวด `systemKey` ลบไม่ได้
- ฟอร์มรายการ: หมวด · รายละเอียด · ยอด · หมายเหตุ · สลิป (+ ผูกรถเมื่อค่าคอม)

---

## 4) กล่องเต็มขอบ

1. `DashboardPagesShell` — `used-car-showroom` อยู่ใน `WIDE_MODULE_PREFIXES` + `DOCKED_MODULE_PREFIXES` → `max-w-none !px-0`  
2. Shell หัวมี `px-4 sm:px-6` — **ห้าม** ห่อ `children` ด้วย `px-*` ซ้ำ  
3. หน้าใช้ `usedCarShowroomPageStackClass` (`min-w-0 space-y-4`)  
4. การ์ด = `usedCarShowroomPanelClass` + `usedCarShowroomPanelSectionClass` (padding **ใน**การ์ด)  
5. มือถือ: `max-lg:pb-24` ให้พ้น dock

---

## 5) พอร์ทัลลูกค้า + เกตรายเดือน (บังคับ)

- Listing: `UsedCarPortalPublicClient` · Detail: `UsedCarVehicleDetailClient`  
- **จอง:** มัดจำ/เต็ม + สลิป (โหมด `NONE` = ปิดจอง รับแค่นัด)  
- **นัด:** `POST …/public/portal/[slug]/appointments` ไม่มัดจำ  
- สื่อ: YouTube lightbox · แกลเลอรี · แบนเนอร์จากตั้งค่า  
- **ลิงก์/QR สาธารณะ = แพ็กรายเดือนเท่านั้น**
  - UI: `ModuleQrMonthlyGate` ที่แท็บตั้งค่า `link`
  - **ปลายทางกลาง:** `ensureOwnerModuleDailyChargeOnPublicUse` เกตรายเดือนทุกโมดูล (ยกเว้นฟรี / LMS / ทดลอง ACTIVE)
  - เข้าจากลิงก์ภายนอก → บันทึก `user_module_daily_charges` (แพ็กรายเดือน = `tokensCharged: 0`) = นับว่าเดือนนั้นมีคนใช้งานแล้ว
  - **ห้าม** ใส่ `used-car-showroom` ใน `QR_LINK_DAILY_ALLOWED_MODULE_SLUGS`
  - แดชบอร์ดเจ้าของ (ล็อกอิน) ยังใช้สายรายวัน+หักโทเคนได้ตามปกติ — คนละเรื่องกับลิงก์สาธารณะ

---

## 6) เช็กลิสต์ก่อนถือว่างานจบ

- [ ] Manage ทุกแท็บมีกรอง + FormModal เพิ่ม (ยกเว้น P&L เพิ่ม)  
- [ ] Settings ครบ 5 แท็บ · PIN · ภาษี · **QR พร้อมเพย์อัปโหลด** · แบนเนอร์/แกลเลอรี · **LINE/FB/แผนที่** · **พิกัดร้าน** · เวลา  
- [ ] Finance: ปุ่มหมวดหมู่รายรับ+รายจ่าย · ชิปกรอง · CRUD หมวด  
- [ ] ไม่มี `px`/`max-w` ซ้ำรอบหน้า · panel เต็มความกว้าง  
- [ ] จอง = มัดจำ+สลิป · นัด = ฟอร์ม · ค่างวด = flat  
- [ ] sidebar icon · landing cover · **seed ~20/ฟีเจอร์** · รูป Unsplash ตรวจ HEAD · `prisma generate` หลัง schema  
- [ ] `npx tsc --noEmit` ผ่าน  

## แผนที่ไฟล์หลัก

| บทบาท | พาธ |
|-------|-----|
| Chrome / dock | `UsedCarShowroomModuleChrome.tsx` |
| Manage | `UsedCarShowroomManageClient.tsx` |
| Settings | `UsedCarShowroomSettingsClient.tsx` · `UsedCarPortalMediaSettings.tsx` |
| Finance | `UsedCarShowroomFinanceClient.tsx` |
| Dashboard | `UsedCarShowroomDashboardClient.tsx` |
| Portal | `UsedCarPortalPublicClient.tsx` · `UsedCarVehicleDetailClient.tsx` |
| Tokens | `lib/ui-tokens.ts` · `lib/card-tones.ts` |
| Nav | `used-car-showroom-module-nav.tsx` |
| Seed ทดลอง/demo | `src/lib/trial/seed-used-car-showroom.ts` · รูป `lib/portal-media.ts` |


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

# Village Finance / Housing pages — ใช้การ์ดหลักเดียว

เมื่อปรับหน้าในโมดูลหมู่บ้านกลุ่มจัดการบ้าน:
- `/dashboard/village/residents`
- `/dashboard/village/fees` — ฮับ 2 แท็บ: **บิล** | **รับชำระ** (`?tab=slips`)

## บังคับ

1. แต่ละหน้าต้องมี **การ์ดหลักเดียว** (`VillagePanelCard`) สำหรับเนื้อหาหลักของหน้านั้น  
   - ส่วนหัวหน้า (title/description/action) + ส่วนควบคุม (filter/form/buttons) + รายการ/ตาราง/กราฟ อยู่ในการ์ดเดียวกัน
2. ห้ามแยก “การ์ดฟิลเตอร์” กับ “การ์ดรายการ” เป็นคนละกล่องซ้อนกันในหน้าเดียวกัน
3. ถ้าต้องแบ่งช่วงเนื้อหาในกล่องเดียว ให้ใช้ `border-t`, spacing, หรือ section heading ภายในการ์ด แทนการสร้าง `VillagePanelCard` เพิ่ม
4. modal/dialog (เช่น `FormModal`) แยกได้ตามปกติ แต่ไม่นับเป็นการ์ดหลักของหน้า
5. `VillageHousingQuickTabs` ต้องวางบนสุดของหน้า แล้วตามด้วยการ์ดหลักเดียว — มี **2 เมนู**: บ้าน · ค่าส่วนกลาง

## สลิป (รับชำระ) — ไม่ใช่หน้าแยก

- **ไม่มี** หน้า `/dashboard/village/slips` แล้ว — redirect ไป `/dashboard/village/fees?tab=slips`
- สลิปเป็น **แท็บหลัก «รับชำระ»** ในการ์ดเดียวกับบิล (`VillageFeesClient`) ตามกฎ `dashboard-primary-secondary-menu-tabs.mdc`
 - แถบหลัก: `villagePrimaryTabShellClass` + `villagePrimaryTabPillClass(active)` · `role="tablist"` / `tabpanel`
 - `VillageSlipsClient` รับ prop **`embedded`** — เมื่อ embed **ห้าม** render `VillagePageStack` / `VillageHousingQuickTabs` / `VillagePanelCard` ซ้ำ
- ลิงก์ทุกที่ (การ์ด «สลิปรอตรวจ» หน้าภาพรวม ฯลฯ) ต้องชี้ **`/dashboard/village/fees?tab=slips`**
- `villageSubMenuItems` **ไม่มี** รายการสลิป — แต่ `villageMainKeyFromPathname` ยังแม็ป `/slips` เป็นกลุ่ม `housing`

## หน้าการเงิน `/dashboard/village/finance`

ยึด **`dashboard-finance-module-template.mdc`** (สรุป 3 การ์ด → `AppDashboardSection` ใบเดียว: กรอง · กราฟ · แท็บ ประวัติ/รายรับ · รายจ่าย)  
- `/dashboard/village/costs` → redirect `?panel=expenses`
- `/dashboard/village/annual` → redirect `?range=YEAR` (สรุปรายปีรวมในหน้าการเงิน — กรองปีนี้ + กราฟ)
- ส่งออก CSV รายปียังอยู่ที่เมนูตั้งค่า → ส่งออก

## เป้าหมาย UX

- มือถือและเดสก์ท็อปเห็นโครงเหมือนกัน: “หนึ่งหน้า หนึ่งการ์ดหลัก”
- ลดช่องว่างซ้ำซ้อน ทำให้เนื้อหาอ่านต่อเนื่องและดูเป็นระบบเดียวกัน
