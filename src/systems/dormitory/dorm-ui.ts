/** คลาส UI ร่วมโมดูลหอพัก — โทนเดียวกับหมู่บ้าน/ตั้งค่า */
export const dormField =
  "w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#0000BF]/40 focus:bg-white focus:ring-2 focus:ring-[#0000BF]/15";

export const dormCard =
  "rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white via-white to-slate-50/90 shadow-sm";

export const dormBtnPrimary =
  "inline-flex items-center justify-center rounded-xl bg-[#0000BF] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0000a3] disabled:opacity-50";

export const dormBtnSecondary =
  "inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-[#0000BF]/30 hover:bg-[#0000BF]/[0.04]";

/** การ์ดห้อง — ผังห้อง (แดชบอร์ด): เน้นเลขห้องกลาง แถบไฮไลต์ด้านบน */
export const dormRoomTile =
  "group relative flex h-full min-h-[160px] flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-gradient-to-b from-white via-slate-50/40 to-slate-100/35 p-4 pt-[1.125rem] text-slate-900 antialiased shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#0000BF]/45 hover:shadow-lg hover:shadow-[#0000BF]/[0.08] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0000BF]/35 focus-visible:ring-offset-2 before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-gradient-to-r before:from-[#0000BF]/75 before:via-[#0000BF] before:to-indigo-500 before:content-['']";

/** ห้องนี้มีรายการค้างชำระงวดเก่า (แดชบอร์ด) */
export const dormRoomTileOverdueHint =
  "after:pointer-events-none after:absolute after:right-3 after:top-3 after:z-[1] after:h-2 after:w-2 after:rounded-full after:bg-amber-500 after:shadow-sm after:ring-2 after:ring-white/90";

/** การ์ดห้อง — หน้าจัดการห้อง: ข้อมูลแนวแถว + CTA */
export const dormRoomListCard =
  "group relative flex h-full min-h-[168px] flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-gradient-to-br from-white via-white to-slate-50/90 p-4 pt-[1.125rem] text-slate-900 antialiased shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#0000BF]/40 hover:shadow-md hover:shadow-[#0000BF]/[0.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0000BF]/35 focus-visible:ring-offset-2 before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-gradient-to-r before:from-slate-400/50 before:via-[#0000BF]/90 before:to-indigo-500/85 before:content-['']";

export const dormRoomNumberHero =
  "text-center text-[1.75rem] font-bold tabular-nums leading-none tracking-tight text-slate-900 antialiased transition-colors duration-200 group-hover:text-[#0000BF]";

export const dormRoomNumberList =
  "text-[1.35rem] font-bold tabular-nums leading-tight tracking-tight text-slate-900 antialiased transition-colors duration-200 group-hover:text-[#0000BF] sm:text-xl";

/** ป้ายชั้น / meta ในการ์ดผังห้อง */
export const dormRoomFloorPill =
  "inline-flex items-center justify-center rounded-lg bg-slate-100/95 px-2.5 py-1 text-[11px] font-semibold tabular-nums leading-none text-slate-700 ring-1 ring-slate-200/80";

/** สายสถานะว่าง/พัก (ผังห้อง) */
export const dormRoomOccLine =
  "text-center text-xs font-medium leading-normal text-slate-600 antialiased";

/** ประเภทห้องใต้สถานะ (ผังห้อง) */
export const dormRoomTypeHint =
  "line-clamp-2 text-center text-[11px] font-medium leading-snug text-slate-500 antialiased";

/** คั่นโซนในการ์ด (ผังห้อง) */
export const dormRoomCardDivider = "border-t border-slate-200/70";

/** ป้ายกำกับจิ๋วภาษาไทย — ใช้คู่ข้อมูลในการ์ด */
export const dormRoomFieldLabel =
  "whitespace-nowrap pt-0.5 text-[10px] font-semibold leading-tight text-slate-400 antialiased";

export const dormRoomMetaMuted =
  "text-[11px] font-medium leading-snug text-slate-500 antialiased sm:text-xs sm:leading-normal";

export const dormRoomMetaSoft =
  "text-[11px] font-medium leading-snug text-slate-600 antialiased sm:text-xs sm:leading-normal";

/** แถวข้อมูลแบบป้าย + ค่า (หน้ารายการห้อง) */
export const dormRoomStatRow = "grid grid-cols-[auto_1fr] items-start gap-x-3 gap-y-2 text-left";

export const dormRoomStatValue =
  "min-w-0 text-[11px] font-semibold leading-snug text-slate-800 antialiased sm:text-xs sm:leading-normal";

/** ลิงก์ CTA ท้ายการ์ดรายการห้อง */
export const dormRoomCardCta =
  "mt-auto inline-flex items-center gap-1.5 border-t border-slate-200/60 pt-3 text-[11px] font-semibold leading-none tracking-wide text-[#0000BF] antialiased transition-[gap] duration-200 group-hover:gap-2";
