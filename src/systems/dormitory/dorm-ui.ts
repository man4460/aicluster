/** คลาส UI ร่วมโมดูลหอพัก — โทนเดียวกับคาร์แคร์ / template กลาง */
export const dormField =
  "w-full rounded-xl border border-white/60 bg-white/70 px-3 py-2.5 text-sm text-[#2e2a58] outline-none transition backdrop-blur-sm focus:border-[#4d47b6]/50 focus:bg-white focus:ring-2 focus:ring-[#5b61ff]/20";

export const dormCard =
  "rounded-[2rem] border border-white/60 bg-white/55 shadow-sm backdrop-blur-sm ring-1 ring-inset ring-white/50";

export const dormBtnPrimary =
  "app-btn-primary inline-flex min-h-[44px] items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-95 disabled:opacity-50 sm:min-h-0";

export const dormBtnSecondary =
  "app-btn-soft inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-200/90 bg-white px-4 py-2.5 text-sm font-semibold text-[#66638c] shadow-sm transition hover:bg-slate-50 sm:min-h-0";

/** การ์ดห้อง — ผังห้อง (แดชบอร์ด): เน้นเลขห้องกลาง แถบไฮไลต์ด้านบน */
export const dormRoomTile =
  "group relative flex h-full min-h-[160px] flex-col overflow-hidden rounded-[2rem] border border-white/60 bg-gradient-to-br from-white/60 via-indigo-50/20 to-violet-50/15 p-4 pt-[1.125rem] text-[#2e2a58] antialiased shadow-[0_18px_38px_-26px_rgba(30,27,75,0.35)] backdrop-blur-xl ring-1 ring-inset ring-white/50 transition-all duration-300 hover:-translate-y-1 hover:bg-white/70 hover:shadow-[0_24px_44px_-24px_rgba(30,27,75,0.4)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5b61ff]/35 focus-visible:ring-offset-2 before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-1.5 before:rounded-b-full before:bg-gradient-to-r before:from-[#5b61ff]/75 before:via-[#a78bfa]/45 before:to-[#5b61ff]/35 before:content-['']";

/** ห้องนี้มีรายการค้างชำระงวดเก่า (แดชบอร์ด) */
export const dormRoomTileOverdueHint =
  "after:pointer-events-none after:absolute after:right-3 after:top-3 after:z-[1] after:h-2 after:w-2 after:rounded-full after:bg-amber-500 after:shadow-sm after:ring-2 after:ring-white/90";

/** การ์ดห้อง — หน้าจัดการห้อง: ข้อมูลแนวแถว + CTA */
export const dormRoomListCard =
  "group relative flex h-full min-h-[168px] flex-col overflow-hidden rounded-[2rem] border border-white/60 bg-gradient-to-br from-white/60 via-indigo-50/20 to-violet-50/15 p-4 pt-[1.125rem] text-[#2e2a58] antialiased shadow-[0_18px_38px_-26px_rgba(30,27,75,0.35)] backdrop-blur-xl ring-1 ring-inset ring-white/50 transition-all duration-300 hover:-translate-y-1 hover:bg-white/70 hover:shadow-[0_24px_44px_-24px_rgba(30,27,75,0.4)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5b61ff]/35 focus-visible:ring-offset-2 before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-1.5 before:rounded-b-full before:bg-gradient-to-r before:from-[#5b61ff]/70 before:via-[#c4b5fd]/40 before:to-[#5b61ff]/30 before:content-['']";

export const dormRoomNumberHero =
  "text-center text-[1.75rem] font-black tabular-nums leading-none tracking-tight text-[#1e1b4b] antialiased transition-colors duration-200 group-hover:text-[#5b61ff]";

export const dormRoomNumberList =
  "text-[1.35rem] font-black tabular-nums leading-tight tracking-tight text-[#1e1b4b] antialiased transition-colors duration-200 group-hover:text-[#5b61ff] sm:text-xl";

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
  "mt-auto inline-flex items-center gap-1.5 border-t border-white/60 pt-3 text-[11px] font-semibold leading-none tracking-wide text-[#5b61ff] antialiased transition-[gap] duration-200 group-hover:gap-2";
