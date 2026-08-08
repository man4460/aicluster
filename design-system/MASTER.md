# Mawell Design System Master

This is the single source of truth for UI/UX decisions in this project.

## Product Context

- Product: Mawell multi-module dashboard and service systems
- Platforms: desktop, tablet, mobile web
- UX direction: modern glass surfaces with soft enterprise readability
- Design language: Glassmorphism + Soft UI Evolution
- Primary gradient direction: blue to violet to pink (same direction as primary CTA)

## Core Principles

- Clarity first: always prioritize information hierarchy over decoration.
- Consistent surfaces: cards, panels, and headers must use shared glass tokens.
- Touch-ready interactions: desktop hover and mobile tap states must both be explicit.
- Progressive density: desktop can show more at once; mobile shows critical actions first.
- Accessibility baseline: visible focus, readable contrast, and reduced motion support.

## Breakpoints

- Mobile: `375` to `<768`
- Tablet: `768` to `<1024`
- Desktop: `1024+`
- XL desktop layout target: `1440`

## Tokens (Mapped to `src/app/globals.css`)

### Color Tokens

- `--background`: `#f7f6ff`
- `--foreground`: `#1e1b3a`
- `--surface`: `#ffffffcc`
- `--surface-strong`: `#ffffff`
- `--surface-border`: `#d8d9ff`
- `--ring-soft`: `#8b90ff66`
- `--brand-600`: `#5b61ff`
- `--brand-500`: `#7a7eff`
- `--brand-400`: `#9a9dff`
- `--banner-bg`: gradient token for notices and helper banners
- `--banner-border`: `#e6cbff`
- `--banner-text`: `#5a2a85`

### Effect Tokens

- `--soft-shadow`: `0 10px 30px -18px rgba(76, 58, 180, 0.28)`
- `--mawell-page-gradient`: primary page background stack
- `--mawell-card-gradient`: default card surface
- `--mawell-glass-border`: default glass border
- `--mawell-glass-highlight`: glass highlight overlay

## Shared Utility Classes

- `.mawell-card-surface`: default card for modules and widgets
- `.mawell-card-frame`: frame-only glass container
- `.mawell-glass-panel`: topbar/sidebar glass panel
- `.app-surface`, `.app-surface-strong`: reusable app cards
- `.app-gradient-text`: highlighted heading text
- `.app-btn-primary`, `.app-btn-soft`: button system
- `.app-input`: input field system
- `.app-banner`: info/warn banner container

## Layout Rules

- Top header remains sticky on dashboard pages.
- Left sidebar appears from desktop breakpoint and is hidden on mobile.
- Core workspace uses card surfaces and section headers with consistent spacing.
- Mobile uses bottom navigation for one-hand operation on high-frequency routes.

### Dashboard Navigation (Football Turf Standard)

- Desktop (`md+`): left sidebar must render only the **basic/main menu** group (`id: basic`, label `เมนูหลัก`). Do not render subscribed module groups in the left sidebar.
- Mobile (`<md`): primary navigation must be a fixed **bottom navigation bar** built from the same basic/main menu candidates.
- Active states (sidebar + bottom nav): never use black (`bg-slate-900`) for selected items; use the brand gradient token (`appDashboardBrandGradientFillClass`) and soft brand tints.
- Module switching: use the **header dropdown** (system-focus layout) or the dashboard home/module list surface; do not push module groups into the left sidebar.
- Default behavior: when entering `/dashboard` (home), the sidebar must be expanded by default (override any previously saved collapsed state).
- Density targets: desktop sidebar width `264px` (match football module) with compact paddings; mobile bottom nav should be compact (icon ~`32px`, minimal vertical padding) to maximize content height.
- Sidebar surface (desktop): use a white glass panel with a thin brand gradient bar header, not a full-height purple gradient block.
- Desktop gutter: do not add extra flex `gap` between sidebar and content; rely on the page container padding (`PAGE_GUTTER_X`) for consistent content spacing.
- Vertical alignment: on desktop, the sidebar panel must align vertically with page cards by adding `md:my-6 lg:my-8` (match `PageContainer` vertical padding rhythm).
- Card spacing: use consistent outer gaps (`gap-4` / `sm:gap-5`) and consistent card paddings (`p-4` / `sm:p-5`) across dashboard sections; avoid one-off `p-6` / `gap-6` that breaks rhythm.
- Width alignment: basic pages (`/dashboard`, `/dashboard/modules`, `/dashboard/profile`, `/dashboard/plans`, `/dashboard/chat`, `/dashboard/chat-ai`) must use the same wide container target (`max-w-[1680px] lg:px-8`).

### Dashboard Home (Pinned/Recent)

- Pinned count must reflect persisted storage (after filtering against current modules) and the UI should render the same number of pinned cards shown in the count.
- Recent count and visible cards must match the number of pinned cards (symmetry), filling from available modules when storage has fewer items.

### Modules Catalog (/dashboard/modules)

- Desktop: keep filters in a single top search surface (segmented selector + group dropdown). Avoid an internal left group sidebar that consumes width.
- Spacing: match dashboard rhythm (`space-y-4 sm:space-y-6`, `gap-4 sm:gap-5`) and avoid tall hero cards that force scrolling.
- Accent bars: show the thin gradient bar only once in the main “ระบบทั้งหมด” header card; do not repeat accent bars in sub-sections (featured/free/group lists).
- Group filter: use a dropdown (ทุกกลุ่ม + group list with counts).
- Width: `/dashboard/modules` should use the same full-width container as dashboard home (target `max-w-[1680px]` and `lg:px-8`) to avoid excessive side margins on desktop.
- Search controls: place search + segmented selector + group dropdown inside the same “ระบบทั้งหมด” header card, with horizontal scroll on mobile when needed.
- Single row: keep search controls on one row (`flex` + `overflow-x-auto`) and standardize control height to `h-10` for consistent alignment.
- Featured row: show **3 current modules** as image cards in a single row near the top; keep card sizes consistent.
- Free selector: provide a compact segmented selector (ทั้งหมด / ฟรี) near the search. Free mode shows only free modules.
- Main list: render the remaining modules as compact rows (not large hero cards) to reduce scroll length.
- Search input: always reserve left padding when rendering an icon (`pl-10`) so the icon never overlaps the text.

## Module Convergence Rules (Football Turf Standard)

Use these rules when updating existing modules or building new modules so they visually match the system frame (DashboardShell) and the Football Turf module.

### Surfaces & Background

- Do not add per-page background gradients inside module pages. Rely on `body` background (`--mawell-page-gradient`).
- Use `app-surface` (or `AppDashboardSection tone="violet"`) for all primary panels/cards.
- Avoid stacking new one-off `bg-white/.. + border-white/..` recipes. Prefer tokenized surfaces.

### Brand Accent

- Use the primary brand direction (blue → violet → pink) for accents, not random greens.
- Recommended accent patterns:
  - A thin top bar: `appDashboardBrandGradientBarClass` (use only on the primary page header / primary surface header; avoid repeating on every card)
  - Primary action: `app-btn-primary` or `appDashboardBrandCtaPillButtonClass`
  - Highlighted heading text: `app-gradient-text` (sparingly)

### Section Structure

- Use `AppDashboardSection tone="violet"` as the default container for each dashboard section.
- Use `AppSectionHeader tone="violet"` for section headers; keep titles short.
- Do not add long descriptions under headers. Use compact badges or inline hints only when required.

### Filters (Toolbar Pattern)

- Standard filter should be a collapsible toolbar with:
  - Title + summary line
  - Active filter count badge
  - Reset button
  - Show/hide toggle (desktop + mobile)
- Inputs should be inside a unified field wrapper (icon + control) with brand focus states.

### Buttons

- One primary CTA per section; keep others as neutral/outline.
- Button heights: 44–48px (touch ready).
- Always include `active:scale-*` and visible focus.
- Avoid `bg-slate-900` / black buttons for active states. Use `app-btn-primary` or the brand gradient token for selected/active buttons.

### Public Links (Booking / Check-in)

- Public booking/check-in pages must display the module name as the main title (not profile branding).
- Show the venue name/subtitle from module settings as the secondary line under the module title.

### POS / Order modules (Drink POS standard)

When building order-heavy modules, follow `.cursor/rules/drink-pos-module-dashboard-template.mdc`:

- Collapsible module header; on desktop collapsed tabs move into the purple global header; on mobile do **not** duplicate tabs there (bottom dock only).
- Hide/expand header control sits at the **far right** of the relevant header row.
- Entering a module workspace hides the main dashboard bottom nav (`isModuleWorkspacePath`).
- Mobile cart = dock summary slot + `FormModal` bill review (not a permanent tall cart panel).
- Product grid on mobile: **3 columns**, compact cards.
- Loyalty (if any): configurable `stampsPerReward` + `rewardTitle` — never hardcode “buy 10 get 1” in UI copy.
- Finance: period chips **Today / This month / This year / Custom**; **default = This month**; stats/charts/bill list follow the selected range (Bangkok timezone).

## Module Workspace UX/UI Rules (Drink POS + Football Turf Baseline)

ใช้กฎนี้เมื่ออัปเดตโมดูลงาน (building-pos, drink-pos, football-turf, barber, carwash ฯลฯ) หรือสร้างโมดูลใหม่ ให้ทุกโมดูลมี “ภาษา UI” เดียวกันตาม baseline ของ **POS ร้านเครื่องดื่ม** และ **สนามฟุตบอล**

---

### 1. ระยะขอบซ้าย-ขวา — ต้องชิดขอบ (Edge-to-edge)

- **Shell โมดูล (glass หลัก)**: outer padding ตายตัว = `px-4 py-4 sm:px-8 sm:py-6` (เทียบ drink-pos shell / football-turf shell)
- **ห่างระหว่าง shell header กับเนื้อหา**: หลัง accent bar ใช้ `mt-5` คงที่ (ไม่ผสม mt-4 / mt-6 ในหน้าเดียวกัน)
- **Content stack (แนวตั้งภายใน shell)**: `gap-4 sm:gap-6` หรือ `space-y-4 sm:space-y-6` — เลือก cadence หนึ่งแล้วใช้ทั้งหน้า
- **Edge-to-edge content (แถวเลื่อนแนวนอน / chip scroller / shelf)**: ใช้ pattern `-mx-4 px-4 sm:-mx-8 sm:px-8` เพื่อชิดขอบสุดของ shell พอดี (ไม่ `-mx-1` ใส่ไปตามใจ)
- **Header หน้า Dashboard Home / หน้ารวมระบบ**: หัวข้อ (label ขนาดเล็ก + H1 + badges) ให้ baseline ซ้าย align กับการ์ดเนื้อหา p-4 ภายใน โดยการเติม `pl-0.5 sm:pl-0` ให้กับ wrapper หัวข้อ
- **Mobile safe area + dock bottom**: เนื้อหาหลักต้องมี `pb-[max(8.5rem,6rem+env(safe-area-inset-bottom,0px))] lg:pb-0` (main scroll padding-bottom class) เพื่อไม่ให้เมนูล่างมือถือทับเนื้อหา

### 2. การแสดง/ซ่อนกลุ่มเมนูส่วนหัว (Header groups & collapsible)

- **Module shell header collapse**:
  - ปุ่ม **ซ่อนส่วนหัวโมดูล** (header collapse) วางไว้ที่ **มุมขวาบนสุด** ของ header row (ใกล้คู่มือการใช้งาน)
  - รูปแบบปุ่ม: icon-only คงที่ `h-10 min-h-[44px] w-10 items-center justify-center rounded-2xl border border-[#0000BF]/25 bg-white/80 text-[#4d47b6] shadow-sm backdrop-blur-md`
  - Collapsed behavior (desktop): เมื่อซ่อน header แล้ว แท็บของโมดูลจะย้ายไปแสดงในแถบหัวสีม่วง (global header bar ผ่าน `XxxHeaderBarNav` component) — **มือถือไม่ต้องย้าย** ให้ใช้ mobile bottom nav (bottom dock) แทน
- **Collapsible groups ใน sidebar / drawer (NavCollapsibleGroup)**:
  - outer card: `rounded-[1.15rem] p-1.5` + ความโปร่งแยกตามโหมด (sidebar: แสงสว่าง, drawer: มืด)
  - header button: `px-3 py-2 rounded-xl` + focus-visible ring ตามโหมด
  - **ปุ่ม chevron**: wrap เป็นกล่อง `h-8 w-8 rounded-lg` มี `bg` + `ring` แยกชัดเจน (ห้ามวาง icon ลอยโดยไม่มีพื้นหลัง)
  - inner items: `mt-2 px-1 flex flex-col gap-1.5`

### 3. ลิงก์ QR และการอัพโหลดต่างๆ (QR links / uploads)

- **QR Hub (แท็บ QR / ลิงก์)**:
  - ต้องแยก sub-tabs ชัดเจน: "ลิงก์ลูกค้าสั่ง / ลิงก์พนักงาน / ลิงก์เช็กอิน / การตั้งค่า" (ใช้ segment shell class: `SubTabSegmentShellClass`)
  - Public link หน้าลูกค้า: ต้องแสดงชื่อโมดูล + ชื่อสนาม/ร้าน จาก module settings เป็น main title — **ห้ามใช้ชื่อโปรไฟล์เป็นชื่อหน้าหลัก**
- **อัพโหลดรูปสลิป/ภาพ (upload pattern)**: ทุกหน้าที่มีการแนบสลิป ต้องมีคอมโพเนนต์ครบชุด:
  1. **File + Camera inputs**: `AppGalleryCameraFileInputs` หรือ `AppImagePickCameraButtons` (กล้อง + เลือกจากแกลเลอรี่)
  2. **Thumbnail preview**: `AppImageThumb`
  3. **Lightbox ดูขนาดใหญ่**: `AppImageLightbox` (คลิกที่ thumbnail เพื่อเปิด)
  4. **Loading state**: ป้าย "กำลังแนบสลิป..." / spinner ในปุ่ม
  5. **Success hint**: ข้อความยืนยันหลังอัพโหลดสำเร็จ (เช่น "แนบสลิปแล้ว ระบบจะบันทึกไปพร้อมรายการจอง")
  6. **Persist layer**: ฟังก์ชัน persist/save slip ให้เป็น lib แยก (ตัวอย่าง `football-turf/lib/persist-slip.ts`) — ห้าม scatter logic ในหน้าเดียว
- **สถานะการชำระสลิป**: status labels ต่างสถานะกันชัดเจน — "รอตรวจสลิป" (amber), "ชำระแล้ว" (emerald), "ยังไม่ชำระ" (slate)

### 4. UX/UI — สี (Color tokens)

- **Active state (สิ่งที่ถูกเลือก)**:
  - ห้ามใช้โทนดำ/มืด (`bg-slate-900`, `bg-black`, `bg-emerald-950/25`) เป็นสีของปุ่ม active แบบเด็ดขาด
  - ใช้ token **brand gradient** (`appDashboardBrandGradientFillClass`) + `text-white` + `shadow-md` เป็นมาตรฐานสำหรับ: nav active, button active, chip active, dock active
- **Idle state**:
  - Sidebar/nav: `text-slate-500 hover:bg-white/55 hover:text-slate-700`
  - Strip/segment: `bg-white/35 opacity-[0.72] hover:bg-white/75 hover:opacity-100`
- **Accent bar**:
  - ใช้ `appDashboardBrandGradientBarClass` (`h-1.5 w-full rounded-full`) เฉพาะใน **หัวหลัก (primary header)** เท่านั้น
  - ห้ามทำ accent bar ซ้ำในทุกการ์ดย่อยๆ — จะทำให้ UI รกเกินไป
- **Status semantic tones (สถานะงาน)**: ใช้สีตามความหมายตายตัว (ห้ามสุ่มสี):
  - `amber`: รอ/ดำเนินการใหม่ (รอรับออเดอร์, รอตรวจสลิป)
  - `sky`: กำลังทำ/เดินทาง (กำลังเตรียมอาหาร)
  - `emerald`: เสร็จ/ชำระ/ใช้งานได้ (เสิร์ฟแล้ว, ชำระแล้ว, สนามเปิด)
  - `brand gradient (indigo/violet/fuchsia)`: CTA หลัก / โมดูลส่วนตัว
- **Background**: ห้าม hardcode gradient สุ่ม (`from-slate-950 via-slate-900 to-slate-950`) ในแต่ละหน้า; ใช้ `--mawell-page-gradient` บน body หรือ `app-surface` สำหรับการ์ด

### 5. การซ่อน/แสดงการกรอง (Filters show/hide)

- **State pattern**: `const [filterOpen, setFilterOpen] = useState(false)`
- **Default behavior (สำคัญ)**:
  - **มือถือ (`<md`)**: ซ่อน filter panel โดย default — แสดงเฉพาะ summary line + toggle ปุ่ม (เพื่อประหยัดพื้นที่จอเล็ก)
  - **เดสก์ท็อป (`md+`)**: แสดง filter panel โดย default — ไม่ต้องบังคับกดเปิด
- **Toggle ปุ่ม (วาง far right ของ section header)**:
  - ต้องมี `aria-expanded` + `aria-label`
  - เมื่อ **มีเงื่อนไข active แต่ filter panel ถูกซ่อนอยู่** → เปลี่ยนโทนปุ่มเป็น `amber` (`border-amber-300/80 bg-amber-50/90`) เพื่อเตือนว่าการกรองกำลังมีผลอยู่
  - เมื่อ filter panel เปิดอยู่ → ใช้โทน brand (`border-[#0000BF]/45 bg-[#0000BF]/10 ring-2 ring-[#0000BF]/20`)
- **Layout ฟิลด์ filter**: ใช้ `mt-3 grid gap-3 sm:grid-cols-2` (drink-pos cadence) — ห้ามใช้ `gap-4` / `gap-2` สลับไปมา
- **Reset + Apply**: ต้องมี reset ปุ่ม และต้องแสดง "จำนวนเงื่อนไขที่ใช้งาน" เป็น badge ตรง toggle ปุ่ม

### 6. การซ่อน/แสดงกราฟ (Charts show/hide)

- **Default behavior**: กราฟ **ไม่ต้องซ่อน**โดย default (แต่ถ้าต้องการสร้าง toggle ให้ทำ pattern เดียวกับ filter panel: state + amber warning เมื่อซ่อนแต่ช่วงเวลาที่เลือกยังมีผล)
- **Spacing cadence (หัวข้อ → กราฟ)**: เลือก cadence หนึ่งแล้วใช้ทั้งโมดูล (ห้ามผสม mt-4 / mt-6 / mt-8 ในหน้าเดียว):
  - Compact: `mt-4`
  - Section คั่นชัดเจน: `mt-6 border-t border-[#ecebff] pt-6`
- **Section wrapper**: ใช้ `AppDashboardSection` + `AppSectionHeader` (tone="violet") เป็นมาตรฐาน — ห้ามสร้าง wrapper แยกเองแบบกระจัดกระจาย
- **Chart + Summary**: ถ้ามีสรุปยอดข้างๆ กราฟ ให้ layout เป็น `mt-4 flex flex-col gap-4 sm:flex-row sm:gap-5` (drink-pos pattern)
- **Empty state**: ถ้าไม่มีข้อมูลในช่วงเวลาที่เลือก → แสดง `AppEmptyState` (ห้ามเว้นช่องว่างเปล่าๆ)

### 7. การตัดคำอธิบาย (Conciseness)

- **Main header ทุกหน้า**:
  - ห้ามมี paragraph คำอธิบายยาวใต้ H1 (ตัดทิ้งทั้งหมด)
  - ต้องมีเฉพาะ: "ภาษาอังกฤษบรรทัดบน (font-black uppercase tracking-[0.2em] text-[#66638c] text-[10-11px]) + ไทย H1 บรรทัดล่าง"
- **แพ็กเกจ / plan descriptions**: สรุปเป็น bullet point **ไม่เกิน 4 บรรทัด** (ใช้ helper เช่น `buffetPlanBullets`) — ห้าม list โมดูลยาวๆ เป็น 10+ บรรทัด
- **Menu / product descriptions**: ใช้ `line-clamp-2` หรือ `line-clamp-1` ตาม layout; ห้ามแสดง description เต็ม 3-4 บรรทัดบนการ์ดเล็ก
- **Subtitles / hints**: ใช้ badge inline หรือ `text-[10-11px]` เท่านั้น; ห้าม paragraph ยาวเกิน 2 บรรทัด
- **Crumbs / nav labels**: ใช้ชื่อสั้นกระชับ (ไม่เกิน 2 คำ)

### 8. จัดระเบียบเป็นการ์ด 3 คอลัมน์ในคอม (Desktop 3-column grid)

- **Stat cards (ภาพรวม dashboard)**: `grid gap-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3` — ตั้งแต่ md (768px) ขึ้นไปต้องเป็น 3 คอลัมน์เสมอ
- **Product / service list grid (คอม)**: `grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3`
- **Booking / Check-in cards**: `grid gap-4 sm:grid-cols-3` (ตั้งแต่ sm ขึ้นไปต้องเป็น 3 คอลัมน์ — ตัวอย่าง football-turf check-in)
- **Card height standard**: ห้ามมีการ์ดหนึ่งใบสูง/เตี้ยมมากเกินไป; ใช้ pattern `group relative overflow-hidden rounded-[1.5rem] ...` + `flex flex-col` + `mt-auto` บน footer ของการ์ดเพื่อให้ footer จัดแนวกัน
- **Quick links / shortcut (dashboard home)**: `grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-2 lg:grid-cols-4` — สามารถปรับได้ แต่ต้องแน่นบน desktop (ห้าม 1 คอลัมน์ยาวบน xl)

### 9. ระเบียบความโค้งมน (Radius system 1.5 / 2.0)

- **ระดับชั้นความโค้งมนมาตรฐาน — ใช้ทุกโมดูล คงที่ ไม่ผสมผสาน**:
  1. **Shell glass / เปลือกโมดูลหลัก (ชั้นนอกสุด)**: `rounded-[2rem]` สำหรับ md+, `max-md:rounded-[1.5rem]` — โค้งมนใหญ่สุด 1 ชั้น
  2. **Surface cards / การ์ดเนื้อหา (แถวรายการ, สถิติ, product/service)**: `rounded-[1.5rem]` (24px) — มาตรฐานคงที่ทุกใบ
  3. **Shell ใน / Large inner panel (คู่กับเปลือก)**: `rounded-[2rem]` — เท่ากับ shell นอกเพื่อ stack ออกไม่ซ้อนทับมุม
  4. **Input field / ฟิลด์กรอก / select / filter pill**: `rounded-[1rem]` หรือ `rounded-2xl` (16px) — โค้งมนเล็กกลาง
  5. **Pill / Badge / Status chip เล็ก**: `rounded-full` — โค้งเต็มวง
  6. **Control เล็ก (checkbox, radio, icon-only `<h-8`)**: `rounded-lg` (8px) — กระชับ
- **ห้ามผสมโค้ง**: ห้ามมี `rounded-[2.5rem]`, `rounded-3xl`, หรือ `rounded-[2rem]` บนการ์ดเนื้อหาทั่วไป — ต้องยึด 1.5rem เสมอ (จนกว่ากฎจะเปลี่ยน)
- **ห้ามคม**: ห้ามใช้ `rounded-none` หรือ `rounded-sm` กับ panel / card / field — ทุกสิ่งที่ผู้ใช้สัมผัสต้องมีมุมโค้ง

### 10. ซ้าย-ขวา เต็มจอ (Full-width edge-to-screen)

- **ซ่อนขอบเฟรม — ให้เนื้อหาสัมผัสขอบหน้าจอทั้ง 2 ด้าน (มือถือ & คอม)**:
  - Shell หลักของโมดูลทั้งหมด: outer padding **ต้องผ่อนคลาย** ด้วย pattern `-mx-4 sm:-mx-8` บนเนื้อหา child ที่ต้องการสัมผัสขอบหน้าจอจริงๆ (ไม่ใช่แค่ขอบ shell)
  - **Rule ทั่วไป**: ถ้า content section ต้องการ "ชิดขอบเต็มจอจริง" (ไม่ใช่แค่ขอบใน shell padding) → ใช้ `w-screen relative left-1/2 -translate-x-1/2 !max-w-none` ถ้ายังไม่พอ แต่สำหรับเบ็ดเสร็จขอบ shell ธรรมดาใช้ `-mx-4 px-4 sm:-mx-8 sm:px-8` ตาม §1
- **Row scroll แนวนอน (Chip scroller / Shelf / Product band)**:
  - ต้องใช้ token `{Module}ChipScrollerClass` = `-mx-4 px-4 sm:-mx-8 sm:px-8 overflow-x-auto overscroll-x-contain [scrollbar-width:none]`
  - Shell inner spacing ก่อนและหลัง scroller: `mt-5 mb-5` คงที่ ไม่ผสมกับ `mt-4 / mt-6`
- **Full-width banner / strip (เช่น ส่วนแจ้งเตือนรอบระบบ)**:
  - ใช้ `w-screen left-1/2 -translate-x-1/2 relative !max-w-none` + `px-4 sm:px-8` สำหรับเนื้อหา ภายใน
  - Background ยืดออกเต็มความกว้างหน้าจอ ไม่ถูกจำกัดโดย max-width ของ shell
- **ห้าม**: ห้ามยก content ทั่วไปมาใช้ `w-screen` โดยไม่มีเหตุผล; ใช้เฉพาะส่วนที่ต้องการ **ความรู้สึกเต็มจอ** (hero strip, product shelf, banners เท่านั้น)

### 11. Page Width ที่ระดับ Dashboard Shell (Full-width Module Layout — เหมือนโรงแรม)

- **สาเหตุสำคัญ (Critical Root Cause)**: PageContainer ชั้นนอก (DashboardPagesShell) default ใช้ `max-w-6xl` — ถ้าไม่ใส่ path โมดูลงานเข้า WIDE_MODULE_PREFIXES → shell ทั้งโมดูลจะแคบอยู่กลางจอ (แม้จะตั้งค่า `-mx-4` ใน shell ในก็ไม่ช่วย เพราะ parent ถูกจำกัด width แล้ว)
- **กฎตายตัว — ทุกโมดูลงานต้องทำทันทีเมื่อสร้างโมดูลใหม่**:
  1. เปิดไฟล์ [DashboardPagesShell.tsx](file:///d:/Ai%20Cluster/src/components/dashboard/DashboardPagesShell.tsx)
  2. เพิ่ม path โมดูล (`/dashboard/xxx`) เข้า 2 รายการ:
     - **`WIDE_MODULE_PREFIXES`**: ถ้าโมดูลเป็นงานแบบ full-app (มี nav, stats, grid) — ให้ขยายเต็มจอ `PageContainer size="full"` = `max-w-none` + padding `!px-3 sm:!px-4 lg:!px-6` (baseline โรงแรม, สนามฟุตบอล, ร้านเครื่องดื่ม)
     - **`DOCKED_MODULE_PREFIXES`**: ถ้าโมดูลมี bottom dock mobile (AppMobileDockShell) ต้องเพิ่ม path ที่นี่ด้วย เพื่อ gutter `max-md:!px-3 sm:!px-6` ไม่ซ้อน padding ของ shell ชั้นใน
  3. **ไม่ต้องแก้ทุกครั้งใน PageContainer level** — สิ่งที่เกินขอบ shell ภายในโมดูลใช้ `-mx-4 px-4 sm:-mx-8 sm:px-8` ตาม §10
- **List baseline ของโมดูลที่ต้องเต็มจอ size=full (WIDE_MODULE_PREFIXES)**:
  football-turf, drink-pos, building-pos, **hotel-resort, car-wash, spa, rental, refill, loan, mqtt-service, line-integration, coop, booking, analytics, community-coop, dormitory, village, ecommerce-store, general-store-pos, school-bank, inventory, asset, doc-transmission, educare, smart-police, parking, media-registry, prompt-library, attendance, loyalty-stamp, appointment-queue, wait-queue, home-finance, vault, admin**
- **Special ระดับหน้า (ไม่ใช่โมดูลงาน)**:
  - Staff Kiosk pages (`/barber/staff`, `/massage/staff`, `/laundry/staff`): `!mx-0 !max-w-none !w-full !px-0 !py-0` (เต็มจอ 100% ไม่มี padding)
  - Dashboard Home, Modules, Profile, Plans, Chat: `max-w-[1680px] lg:!px-8` (กว้างแต่มีจำกัด ไม่เต็มจอ 100%)
  - Drink/Building POS order pages: `lg:min-h-0 lg:overflow-hidden lg:!py-3`

---

### §12 Header Collapse Standard Pattern (baseline โรงแรม — hide ทั้งใบ header, ไม่ใช่แค่ nav; global nav fallback bar)

**ต้องทำตาม baseline โรงแรม (HotelResortShell + DashboardShell global header) 1:1 ทุกโมดูล — ห้ามทำ chevron ซ่อนแค่ nav section เก่า**

1. **Naming Convention** (centralize ในไฟล์ `{module}-module-nav.tsx` ห้ามกระจายอยู่ใน tokens):
   - localStorage key: `mawell-{module}-module-header-collapsed` (เช่น `mawell-car-wash-module-header-collapsed`)
   - Custom event name: `mawell-{module}-header-collapse` (เช่น `mawell-car-wash-header-collapse`)
   - ตัวแปร: `{MODULE}_HEADER_COLLAPSE_KEY`, `{MODULE}_HEADER_COLLAPSE_EVENT` (const export จาก module-nav)

2. **Helpers sync function (ใน module-nav)**:
   ```ts
   export function read{Module}HeaderCollapsed(): boolean {
     try {
       if (typeof window === "undefined") return false;
       return window.localStorage.getItem({MODULE}_HEADER_COLLAPSE_KEY) === "1";
     } catch { return false; }
   }
   export function write{Module}HeaderCollapsed(collapsed: boolean): void {
     try {
       if (typeof window === "undefined") return;
       window.localStorage.setItem({MODULE}_HEADER_COLLAPSE_KEY, collapsed ? "1" : "0");
       window.dispatchEvent(new Event({MODULE}_HEADER_COLLAPSE_EVENT));
     } catch { /* ignore */ }
   }
   ```

3. **Icon = 3-line hamburger (ห้ามใช้ chevron)**:
   - เมื่อยังไม่ซ่อน (ปุ่ม collapse): เส้น 3 เส้นเต็ม `M4 8h16 M4 12h16 M4 16h16` (หัวขวาเต็ม)
   - เมื่อซ่อนแล้ว (ปุ่ม expand ใน global header bar): เส้นสุดท้ายสั้นลง `M4 8h16 M4 12h16 M4 16h10` (visual cue = compact)
   - Glyph stroke: `strokeWidth 2.25`, `strokeLinecap="round"`, `strokeLinejoin="round"`

4. **Level of hiding = ซ่อนทั้งใบ shell header (ห้ามซ่อนแค่ nav)**:
   - Module shell root element (ปกติเป็น `<header className={cn({module}ShellWrapperClass, ...)}>`) ต้องเพิ่ม conditional class:
     `headerCollapsed && "hidden"` — ซ่อน header ใบทั้งหมด (ไม่ใช่แค่ nav block ข้างใน)
   - ปุ่มซ่อนอยู่บน shell header นี้ด้วย; เมื่อกด → state เปลี่ยน → header ทั้งใบหายไป

5. **State sync architecture (ทั้ง Module shell และ DashboardShell global header)**:
   - ใช้ `useState(false)` initial value (SSR-safe default false, ห้ามอ่าน localStorage ก่อน mount)
   - Sync ผ่าน 2 channel ใน `useEffect` dependency on-module-flag:
     1. Custom event: `window.addEventListener({MODULE}_HEADER_COLLAPSE_EVENT, sync)`
     2. Native storage event: `window.addEventListener("storage", sync)` (sync กระเป๋าแท็บข้ามแท็บ)
   - ไม่ต้องใช้ `headerPrefHydrated` / hydration flag; **ทุกครั้ง render placeholder glyph** (`<Glyph collapsed={false}>` เสมอ ไม่ขึ้นกับ state) ในปุ่มซ่อน เพื่อป้องกัน hydration mismatch
   - เมื่อออกจากโมดูล (onModule flag เปลี่ยนเป็น false): reset ค่า `set{Module}HeaderCollapsed(false)` ทันที (ไม่คงสถานะซ่อนไว้ข้ามโมดูล)

6. **Global DashboardShell HeaderBar fallback (สำคัญ — user ซ่อนหัวแล้วต้องยังมี nav tab อยู่)**:
   - ต้องสร้าง component ชื่อ `{Module}HeaderBarNav.tsx` (path: `src/systems/{module}/components/{Module}HeaderBarNav.tsx`) mirror โครงสร้าง `HotelResortHeaderBarNav` 1:1
   - Export 2 ส่วน:
     - `{Module}HeaderExpandButton({onExpand})` — button 3-line expand glyph บน global header
     - `{Module}HeaderBarNav({onExpand})` — Suspense wrapper + inner component ใช้ `usePathname` + `useSearchParams` render nav tab list link จาก `{MODULE}_NAV_ITEMS` (รวม settings tab ด้วย); ต้องมีชื่อโมดูลขวาสุดทาง desktop md+ และ mobile split view
   - Tab active styling (บนสีม่วง global header — INVERSE ห้ามใช้ gradient เน้น):
     - Active: `bg-white text-[#4d47b6] shadow-md shadow-black/25 ring-1 ring-white/50`
     - Idle: `text-white/85 hover:bg-white/15 hover:text-white`
   - Icon size = `h-3.5 w-3.5`; label `hidden xl:inline`
   - **DashboardShell integration** (ทุกโมดูลทำซ้ำ 3 จุด):
     1. State + flag: `const [{module}HeaderCollapsed, set{Module}HeaderCollapsed] = useState(false);` + `const show{Module}HeaderBar = on{Module}Module && {module}HeaderCollapsed;`
     2. Sync useEffect block (ห้ามลืม cleanup listener) + reset เมื่อออกโมดูล
     3. Rendering block: `show{Module}HeaderBar ? (<> ... </>)` — desktop lg+: แสดง full `{Module}HeaderBarNav`; mobile: แสดง tokens/package/user label text + `{Module}HeaderExpandButton` (mobile ห้ามแสดง nav tab ใน global header bar — ให้เปิดหัวโมดูลถ้าจะกด tab)
   - Order ใน rendering fallback chain: Drink → Building → Football → Hotel → **(โมดูลใหม่เพิ่มตรงนี้ตามลำดับชื่อ)** → Admin

7. **Aria / accessibility attributes**:
   - ปุ่มซ่อนบน shell header: `title="ซ่อนส่วนหัวโมดูล"` หรือ `title="ย่อส่วนหัว"` + `aria-pressed={headerCollapsed}` (แทนที่จะใช้ aria-expanded เพราะเป็น toggle hide แทนที่จะเป็น open/close)
   - ปุ่ม expand บน global header: `title="แสดงส่วนหัวโมดูล"` + `aria-pressed`

---

### §13 Short Summary Report Standard (เวลา report งานให้สรุปสั้นๆ — ห้ามเขียนยาวรีเด็ดขาด)

> **หลักการเดียว**: user อ่าน 10 วิ ต้องรู้ทันทีว่า "ทำอะไรเสร็จ / ไฟล์ไหนเปลี่ยน / มี error ไหม"

#### 1. Report structure (4 ส่วนเท่านั้น — ห้ามเกิน):
```
✅ เสร็จแล้ว: [หัวข้อสั้น 1 บรรทัด]

📝 สิ่งที่ทำ (max 5 bullet, ไม่เกิน 1 บรรทัดต่อจุด):
- [file1](link): [การเปลี่ยนแปลงสั้นๆ]
- [file2](link): [การเปลี่ยนแปลงสั้นๆ]
...

🔍 ตรวจสอบ:
- Diagnostics: [PASS 0 error / FAIL จำนวน error]
```

#### 2. Rules ห้ามทำเด็ดขาด:
- ❌ **ห้าม**เขียนบรรยายยาวเกิน 1 บรรทัดต่อ bullet (ใช้คำย่อ ตัดข้อความซ้ำ)
- ❌ **ห้าม**เขียน step-by-step วิธีทำ / reason ยาวๆ (ถ้าถามอธิบายถึงจะตอบ)
- ❌ **ห้าม**ซ้ำรายละเอียดไฟล์เดิมหลายรอบ (รวม change ในไฟล์เดียวให้เป็น 1 bullet)
- ❌ **ห้าม**พูดถึง intermediate / Todo steps ว่า "เปลี่ยน state เป็น in_progress แล้ว" — user ไม่สนใจ workflow ภายใน
- ❌ **ห้าม**ใช้ข้อความ redundant เช่น "สำเร็จสมบูรณ์ครบทุกขั้นตอนครับ" — ใช้แค่ `✅ เสร็จแล้ว` พอ

#### 3. Link & file reference rules:
- 📎 ทุก bullet ต้องมี **clickable link ไปยังไฟล์จริง** (ไม่ต้องระบุ path แบบข้อความธรรมดา)
- 📎 ถ้ามีหลาย change ในไฟล์เดียวกัน → 1 link ไฟล์เดียวพอ (ต่อท้ายด้วยรายการสั้นๆ)
- 📎 ใช้ basename ชื่อไฟล์เป็น display name: `[car-wash-ui-tokens.ts](file:///...)` — ห้ามใส่ path full เป็นข้อความ

#### 4. Diagnostics / status report:
- PASS (0 error): เขียนแค่ `Diagnostics: PASS 0 error`
- FAIL (มี error): เขียน `Diagnostics: FAIL N errors` + **1 สรุปสั้นๆ ต่อท้ายว่า error เรื่องอะไร** (ไม่ต้อง paste log ยาว)
- Seed/scripts: ถ้าต้องรันเพิ่ม เขียนแค่ `Run: npm.cmd run db:seed` — 1 บรรทัด

#### 5. ตัวอย่างที่ถูกต้อง (เป็นแบบอย่าง):
```
✅ ปรับโมดูลคาร์แคร์ 4 col stat grid

📝 สิ่งที่ทำ:
- [car-wash-ui-tokens.ts](file:///d:/Ai%20Cluster/src/systems/car-wash/car-wash-ui-tokens.ts#L100-L101): `carWashStatGridClass` → `md/lg/xl:grid-cols-4` (4 ใบ 1 แถว)

🔍 ตรวจสอบ:
- Diagnostics: PASS 0 error
```

---

### §14 Finance Layout Standard (หน้าการเงินทุกโมดูล — ให้ตรงรูปแบบโรงแรมมาตรฐานเดียว)

> **Single source of truth = โรงแรม (HotelResortFinanceClient.tsx)** — ทุกโมดูล (massage, car-wash, barber, spa, rental, drink-pos ฯลฯ) หน้าการเงินต้องทำตามรูปแบบนี้เท่านั้น ห้าม deviate แบบเดี่ยว

#### 1. Top 3 Stat Cards (มีส่วนนี้ก่อนอื่นเสมอ — อยู่นอก AppDashboardSection):
- Grid class (4 tokens export ในทุกโมดูล `{module}FinanceStatsGridClass` + `{module}FinanceStatTailClass`):
  - Structure: `mt-4 grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-3` (มือถือ 2-col → L-shape ด้วย `StatTailClass`; เดสก์ท็อป sm+ 3-col พอดี 1 แถว)
  - `{module}FinanceStatTailClass = col-span-2 sm:col-span-1` (ใบสุดท้าย = กำไร: mobile full-width ล่างเดียว)
- 3 ใบ พอดี (ห้ามเกิน/ขาด):
  1. **รายได้ · ช่วงเวลา** → สีเขียว `text-emerald-700` / `tablenum-2xl-sm3xl`
  2. **ต้นทุน · ช่วงเวลา** → สีแดง `text-rose-600`
  3. **กำไรโดยประมาณ** → สีน้ำเงินเข้ม `text-[#1e1b4b]`
- Style การ์ดทั้ง 3: `rounded-xl border border-white/55 bg-white/50 px-3 py-3 shadow-sm ring-1 ring-inset ring-white/40` (glass soft — ขนาดเล็ก, ไม่หนาเกิน)
- Label: uppercase tracking-widest `text-[10px] font-black text-[#66638c]`

#### 2. Main wrapper: `AppDashboardSection tone="violet"` (ตรงโรงแรม ไม่ใช่ slate/indigo):
- Radius ครอบนอก: `rounded-[2rem]`
- Header ขวา action 3 ปุ่ม (ห้ามขาด 1 ปุ่ม):
  | ลำดับ | ปุ่ม | ปุ่มคู่มือ hotel รูปแบบ | Style | Aria | Extra Rule |
  |---|---|---|---|---|---|
  | 1 | ซ่อน/แสดงกรอง | filter funnel icon stroke 2.25 + 2 state label | appTemplateOutlineButtonClass rounded-xl text-xs font-black text-[#4d47b6] | aria-expanded/controls/title | filtersActive=true และ ซ่อนอยู่ → `border-amber-300/80 bg-amber-50/90` (สีเหลืองเตือนว่ามี filter อยู่) · filtersActive=true แสดง **dot indicator gradient 3 สี [indigo→violet→pink] absolute -right-1 -top-1** |
  | 2 | ซ่อน/แสดงกราฟ | text only (ไม่จำเป็นต้องมี icon) | outline button `[#0000BF]/10 ring 2 เมื่อเปิด | aria-expanded/controls/title | |
  | 3 | รีเฟรช | refresh rotate 2.25 stroke icon | mobile icon-only h40 w40, desktop + "รีเฟรช" text | disabled เมื่อ refreshing (opacity 50) + icon animate-spin | className="disabled:opacity-50" |

#### 3. Filter Panel (collapse id="{module}-finance-filter-panel"):
- **Range Chips 4 ใบ** (ห้ามขาด): วันนี้ (TODAY) · เดือนนี้ (MONTH default) · ปีนี้ (YEAR) · กำหนดเอง (CUSTOM)
  - Chip class: `{module}FilterChipClass(active)` function returns 2 state:
    - Active: `rounded-full border-[#5b61ff]/40 bg-[#5b61ff] px-4 py-2 text-xs font-black text-white shadow-md` (solid pill สี #5b61ff)
    - Idle: `rounded-full border-[#dedbf0]/90 bg-white/70 px-4 py-2 text-xs font-bold text-[#5b61ff] hover:bg-white` (white soft border)
  - Button wrapper: `inline-flex h-10 shrink-0 items-center justify-center px-3.5 sm:px-4`
- **CUSTOM date inputs (เฉพาะเมื่อ range=CUSTOM เท่านั้น)**: sm grid 2-col, label xs font-bold text-[#4d47b6], class `{module}FinanceFieldClass` + `mt-1`
  - FinanceFieldClass spec: `min-h-[44px] w-full rounded-xl border border-white/60 bg-white/70 px-3 py-2.5 text-left text-sm text-[#2e2a58] outline-none transition backdrop-blur-sm focus:border-[#4d47b6]/50 focus:bg-white focus:ring-2 focus:ring-[#5b61ff]/20`
- **Keyword search**: `sm:col-span-9` เมื่อ filtersActive=true (ไม่ใช่ MONTH หรือ มี keyword)
- **Reset button (เฉพาะเมื่อ filtersActive=true)**: `sm:col-span-3`, text-sm font-black rounded-2xl outline button, label = "รีเซ็ต · เดือนนี้"
- **กำลังดู Label**: `text-xs font-semibold text-[#66638c]` "กำลังดู: {ช่วง}"
- **Default state เสมอ MONTH (เดือนนี้)** — ไม่ใช่ TODAY / CUSTOM

#### 4. Charts Panel (collapse id="{module}-finance-charts" — default close = chartsOpen=false):
- Section label: `text-sm font-black text-[#1e1b4b]` "รายได้เทียบต้นทุน · {ช่วง}"
- Chart structure (ห้ามเปลี่ยน component):
  - `<AppSparkChartPanel>` wrapper
  - Inner: `<AppRevenueCostColumnChart compact title="" subtitle="" emptyText="ยังไม่มีข้อมูลในช่วงนี้" buckets={...} formatTitle={(b)=>`${b.label}: รายได้ ฿{format(b.revenue)} · ต้นทุน ฿{format(b.cost)}`} />`
- Bucket type standard: `{ key, label, revenueBaht: number, costBaht: number }`

#### 5. Finance SubTabs (2 ใบพอดี — ไม่รวม/ไม่แยก):
- Shell class: `{module}FinanceSubTabShellClass = rounded-[1.25rem] border border-[#e4e0f5]/90 bg-gradient-to-r from-white/95 via-[#faf9ff] to-indigo-50/20 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.88)]` (gradient white→indigo inset shadow white-top)
- 2 Tabs พอดี (ห้ามเกิน):
  1. `ประวัติ / รายรับ` (id = "sales" หรือ "history")
  2. `รายจ่าย` (id = "costs" หรือ "expenses")
- Tab pill active class (แต่ละโมดูลต้องใช้ Brand Gradient §4 single source of truth ไม่ใช่ white solid):
  - Active = `bg-gradient-to-r from-[#4338ca]/95 via-[#5b61ff]/95 to-[#ec4899]/85 text-white shadow-[0_10px_28px_-18px_rgba(124,58,237,0.55)] ring-1 ring-white/50` (3 สี ไล่ ม่วง-น้ำเงิน-ชมพู ตรง nav active §4)
  - Idle = `text-[#5b61ff]/90 hover:bg-white/50 hover:text-[#1e1b4b]`
  - Size: `flex-1 min-w-0 rounded-[1.25rem]`, mobile 11px, desktop sm text-sm, font-black
  - Aria role=tab, aria-selected, aria-labelledby, aria-controls + id naming pattern: `{module}-finance-tab-{id}` / `{module}-finance-panel-{id}`

#### 6. Finance List Item Cards (history rows + cost rows — share same base class):
- `{module}FinanceListItemCardClass = rounded-[1.25rem] sm:rounded-[2rem] px-3 sm:px-4 py-3` mobile radius ย่อ, desktop radius ใหญ่
- Base style: `border border-white/50 bg-gradient-to-br from-white/55 to-slate-50/15 shadow-sm ring-1 ring-inset ring-white/40 backdrop-blur-sm` (glass soft)

#### 7. Data Fetch / Defaults:
- **Default finance range = MONTH (เดือนนี้)** ห้าม TODAY เป็น default (โรงแรม MONTH)
- Stat ใบสุดท้าย (กำไร) ไม่ต้อง fetch ใหม่ คำนวณใน JSX ได้เลย: `totalRevenue - totalCost`
- Chart buckets ต้องมี 7+ จุด (weekly = 7 วัน / monthly = 30 วัน / yearly = 12 เดือน) ห้ามน้อยกว่า 2 จุด ไม่งั้นกราฟจะดูแปลก

#### 8. Token Naming Convention (ทุกโมดูลต้อง export 6 tokens นี้ใน ui-tokens):
```ts
// Base 6 Finance tokens (ตรงกันทุกโมดูล แค่เปลี่ยน prefix):
export const massageFinanceStatsGridClass = "mt-4 grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-3";
export const massageFinanceStatTailClass = "col-span-2 sm:col-span-1";
export const massageFinanceSubTabShellClass = "rounded-[1.25rem] ... p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.88)]";
export const massageFinanceListItemCardClass = "rounded-[1.25rem] sm:rounded-[2rem] ...";
export const massageFilterChipClass = (active: boolean) => active ? "rounded-full ..." : "rounded-full ...";
export const massageFinanceFieldClass = "min-h-[44px] w-full rounded-xl ... focus:ring-2 focus:ring-[#5b61ff]/20";
```

---

### §15 Car-Wash Finance — โรงแรม Pattern Rules (คาร์แคร์ 4 การเงินกฎจากคำสั่ง 2569-08-08)

> Baseline = โรงแรม (§14) + 4 ข้อเฉพาะโมดูลคาร์แคร์จากคำสั่ง user: "1. เมนูเงิน → การเงิน 2. ซ่อนกรอง/กราฟ 3. แถบเมนู 4. รายละเอียด/แก้ไข/ลบ/หมวดหมู่"

#### §15.1 Nav Label (เมนู "เงิน" → "การเงิน" — Label Full Name All Levels
- **หลักการ**: ห้ามใช้ชื่อย่อ "เงิน" เป็น shortLabel อีกต่อไป (ผู้ใช้ต้องการชื่อเต็ม)
- **ทุก nav item (CAR_WASH_TAB_ITEMS + CAR_WASH_NAV_ITEMS) ต้องมี:
  - `label: "การเงิน"` (ยังคงเดิม)
  - `shortLabel: "การเงิน"` (เปลี่ยนจาก `"เงิน"` → `"การเงิน"`)

#### §15.2 Filter Toggle + Charts Toggle Pattern (โรงแรม exact)
- **State ที่ต้องมี 3 ตัวแปร**:
  1. `filterOpen = useState(true)` — default = open เหมือนโรงแรม
  2. `chartsOpen = useState(false)` — default = **CLOSE (ซ่อน)** ตรงโรงแรม
  3. `filtersActive = useMemo(...)` — true เมื่อกรองไม่ใช่ค่า default (เดือนปัจจุบัน + search ว่าง)
- **3 Action Buttons ใน AppSectionHeader action**:
  1. **Filter Toggle**:
     - class= `appTemplateOutlineButtonClass` + `relative` (สำหรับจุด dot indicator
     - เมื่อ `filterOpen=true`: `border-[#0000BF]/45 bg-[#0000BF]/10 ring-2 ring-[#0000BF]/20` (น้ำเงินเข้ม active)
     - เมื่อ `filtersActive=true และ `filterOpen=false`: **`border-amber-300/80 bg-amber-50/90** (สีส้ม/แอมเบอร์ — แจ้งว่ามี filter แคบแต่ซ่อนอยู่ — MAE)
     - Dot indicator เมื่อ `filtersActive`: จุดสี gradient 3 สี `from-[#4338ca]/95 via-[#5b61ff]/95 to-[#ec4899]/85` + white ring 2 — absolute top-right
     - Icon= IconFilter SVG 2.2 stroke
  2. **Charts Toggle**:
     - class= `appTemplateOutlineButtonClass` — ไม่มี dot indicator
     - Default text: `chartsOpen=true → ซ่อนกราฟ / false → แสดงกราฟ`
     - Active state: `border-[#0000BF]/45 bg-[#0000BF]/10` (เหมือน filter open)
  3. **Refresh Button**:
     - class= `appTemplateOutlineButtonClass` + `rounded-[1rem]` (control 1.0)
     - Icon= `svg refresh` stroke 2.2 — `loading=animate-spin (disabled opacity-50)
- **Filter Panel**: `filterOpen ? "block" : "hidden"` on div wrapper with id= `car-wash-finance-filter-panel`
- **Charts Panel**: `chartsOpen ? render AppSparkChartPanel > AppRevenueCostColumnChart compact` (ซ่อนทั้งหมดเมื่อ close)

#### §15.3 2 SubTabs Finance Nav Pattern (โรงแรม exact gradient inset shadow)
- **Wrapper class ต้องใช้**: `carWashFinanceSubTabShellClass` (§14 export)
  - Spec: `rounded-[1.25rem] border border-[#e4e0f5]/90 bg-gradient-to-r from-white/95 via-[#faf9ff] to-indigo-50/20 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.88)]` (gradient inset shadow
- **Nav semantic structure**:
  - `<nav aria-label="เมนูการเงินคาร์แคร์">`
  - `<div role="tablist">` flex gap-1
- **Buttons 2 ใบ + Cost Tab Extra Actions Left Side**:
  - **ถ้า activeListTab = "costs"** → ซ้ายสุด มี `<div>` `border-r border-[#e4e0f5]/90 pr-1.5` (แบ่ง 2 ปุ่มหมวดหมู่ + เพิ่มรายจ่าย ด้านซ้ายก่อน tab buttons
  - **หมวดหมู่ Button** (จัดการหมวดหมู่):
    - `rounded-full border-white/60 bg-white/60 text-[#4d47b6] ring-1` idle style
    - label sm:inline `หมวดหมู่` (ไม่ใช่ "หมวด")
  - **เพิ่มรายจ่าย Button**:
    - `carWashCtaClass` + `rounded-full`
    - label sm:inline `+ เพิ่มรายจ่าย` (ไม่ใช่ "เพิ่มรายการ")
- **Tab Buttons Spec**:
  - label: `ประวัติรายรับ` (เปลี่ยนจาก "รายรับ") | `รายจ่าย`
  - `role="tab"` + `aria-selected` + `id=car-wash-finance-tab-*` + `aria-controls=car-wash-finance-panel-*`
  - **Active pill**: 3 สี Brand Gradient §4: `from-[#4338ca]/95 via-[#5b61ff]/95 to-[#ec4899]/85` + `text-white shadow-md ring-1 ring-white/40`
  - **Idle**: `text-slate-500 hover:bg-white/45 hover:text-slate-700`
  - Radius: `rounded-[1.25rem]` (tab shell hybrid)

#### §15.4 Costs UI Pattern (รายละเอียด / แก้ไข / ลบ / จัดการหมวดหมู่)
- **Costs Tab Opening Buttons (§15.3 แล้ว)
- **จัดการหมวดหมู่ Modal Button (Gear Icon):
  - เปิด FormModal same as โรงแรม
  - Inside modal: list categories list → สร้าง/แก้ไข/ลบ หมวด (same functions `openManageCategories`
- **เพิ่ม/แก้ไข Cost Entry Modal**:
  - Category dropdown หมวดหมู่ required (validate ไหม? alert ถ้าไม่มี category ให้สร้างก่อน
  - spent_at date local + amount currency + item_label text + note + slip photo (optional)
- **Cost List Row Action Buttons (3 action right side):
  - ✅ **รายละเอียด (SalesRowOpenDetailButton → detail modal)
  - ✏️ **แก้ไข (edit pencil icon PopupIconButton `border-[#4d47b6]/35 bg-[#ecebff] text-[#4d47b6]
  - 🗑️ **ลบ (trash icon danger popupIconBtnDanger red rose) confirm delete confirm dialog

---

## Interaction Rules

- Buttons and links must include hover, active, and focus-visible states.
- Transition duration target: `150-300ms` for micro-interactions.
- Clickable containers must use clear affordance (`cursor-pointer`, hover highlight).
- Avoid animation-only feedback; always include color or elevation change.

## Typography

- Primary font: `Noto Sans Thai` (loaded via Next font variable)
- Fallback: `ui-sans-serif`, `system-ui`, `sans-serif`
- Headings must stay compact with high contrast.
- Body text color should stay within `foreground` and muted variants only.

## Accessibility Checklist

- Contrast target: WCAG AA minimum for text and controls
- Focus rings visible on keyboard navigation
- Respect `prefers-reduced-motion` where motion is significant
- Ensure touch targets are at least 40px in mobile contexts
- Avoid relying on color only for status meaning

## Anti-Patterns

- Hard-coded random color values in component-level CSS
- New one-off shadows when tokenized shadows already exist
- Divergent border radius scales between pages without rationale
- Hidden actions on mobile that require hover to access
- Deep nested card styles that bypass shared surface classes

