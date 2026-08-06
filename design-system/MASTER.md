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
- **Card height standard**: ห้ามมีการ์ดหนึ่งใบสูง/เตี้ยมมากเกินไป; ใช้ pattern `group relative overflow-hidden rounded-[2rem] ...` + `flex flex-col` + `mt-auto` บน footer ของการ์ดเพื่อให้ footer จัดแนวกัน
- **Quick links / shortcut (dashboard home)**: `grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-2 lg:grid-cols-4` — สามารถปรับได้ แต่ต้องแน่นบน desktop (ห้าม 1 คอลัมน์ยาวบน xl)

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

