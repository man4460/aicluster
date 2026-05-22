/** คลาสใช้ร่วมหมู่บ้าน — โทนเดียวกับคาร์แคร์ / template กลาง */

import { villageGlassCardClass } from "@/systems/village/village-ui-tokens";

export const villageField =
  "w-full rounded-xl border border-white/60 bg-white/70 px-3 py-2.5 text-sm text-[#2e2a58] outline-none transition placeholder:text-[#66638c]/70 backdrop-blur-sm focus:border-[#4d47b6]/50 focus:bg-white focus:ring-2 focus:ring-[#5b61ff]/20";

/** การ์ดย่อย / รายการ */
export const villageCard =
  "rounded-[2rem] border border-white/60 bg-white/55 p-4 shadow-sm backdrop-blur-sm ring-1 ring-inset ring-white/50 sm:p-5";

/** การ์ด glass โค้งมนแบบคาร์แคร์สำหรับบล็อกย่อย */
export const villageGlassCard = villageGlassCardClass;

/** เส้นคั่นในโทน glass */
export const villageDivider = "border-white/70";

/** แถบเครื่องมือ */
export const villageToolbar =
  "rounded-[2rem] border border-white/60 bg-white/55 flex flex-wrap items-end gap-3 p-3 shadow-sm backdrop-blur-sm sm:p-4";

/** ปุ่มหลัก */
export const villageBtnPrimary =
  "app-btn-primary inline-flex min-h-[44px] items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:opacity-50 sm:min-h-0";

/** ปุ่มรอง */
export const villageBtnSecondary =
  "app-btn-soft inline-flex min-h-[44px] items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-[#66638c] shadow-sm transition hover:bg-white/55 sm:min-h-0";

export const villageTableWrap =
  "rounded-[2rem] border border-white/60 bg-white/55 overflow-x-auto p-2 shadow-sm backdrop-blur-sm sm:p-3";

/** การ์ดบ้านแบบผัง — แถบไล่สีม่วง MAWELL */
export const villageHouseListCard =
  "group relative flex h-full min-h-[132px] flex-col overflow-hidden rounded-[2rem] border border-white/60 bg-gradient-to-br from-white/60 via-indigo-50/20 to-violet-50/15 p-3 pt-[0.9rem] text-[#2e2a58] antialiased shadow-[0_18px_38px_-26px_rgba(30,27,75,0.35)] backdrop-blur-xl ring-1 ring-inset ring-white/50 transition-all duration-300 hover:-translate-y-1 hover:bg-white/70 hover:shadow-[0_24px_44px_-24px_rgba(30,27,75,0.4)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5b61ff]/35 focus-visible:ring-offset-2 before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:z-[1] before:h-1 before:rounded-b-full before:bg-gradient-to-r before:from-[#5b61ff]/75 before:via-[#c4b5fd]/40 before:to-[#5b61ff]/35 before:content-['']";

export const villageHouseNumber =
  "text-xl font-black tabular-nums leading-none tracking-tight text-[#1e1b4b] transition-colors duration-200 group-hover:text-[#5b61ff] sm:text-[1.35rem]";

/** ป้ายคอลัมน์ซ้ายในการ์ดบ้าน */
export const villageHouseFieldLabel =
  "w-[5rem] shrink-0 self-start pt-0.5 text-[9px] font-semibold leading-tight text-[#66638c]";

export const villageHouseMetaRow = "flex items-start gap-2";

export const villageHouseCardDivider = "border-t border-white/60";
