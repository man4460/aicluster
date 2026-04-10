/** คลาสใช้ร่วมหมู่บ้าน — โทนเดียวกับคาร์แวช (app-surface / app-btn-primary / ช่องกรอกขาวบนการ์ด) */

export const villageField =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#4d47b6]/40 focus:ring-2 focus:ring-[#4d47b6]/15";

/** การ์ดย่อย / รายการ — ใช้ app-surface เหมือนแผงหลักคาร์แวช */
export const villageCard = "app-surface p-4 sm:p-5";

/** แถบเครื่องมือ — การ์ดแยกใต้หัวข้อ */
export const villageToolbar = "app-surface flex flex-wrap items-end gap-3 p-3 sm:p-4";

/** ปุ่มหลักแบบไล่สี (globals .app-btn-primary) */
export const villageBtnPrimary =
  "app-btn-primary inline-flex min-h-[44px] items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:opacity-50 sm:min-h-0";

/** ปุ่มรอง — โทน app-btn-soft */
export const villageBtnSecondary =
  "app-btn-soft inline-flex min-h-[44px] items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-[#66638c] shadow-sm transition hover:bg-slate-50 sm:min-h-0";

export const villageTableWrap = "app-surface overflow-x-auto p-2 sm:p-3";

/** การ์ดบ้านแบบผังห้องพัก — แถบไล่สี + padding กระชับ */
export const villageHouseListCard =
  "group relative app-surface flex h-full min-h-[132px] flex-col overflow-hidden rounded-2xl p-3 pt-[0.9rem] text-slate-900 antialiased transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-[#6366f1]/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4d47b6]/35 focus-visible:ring-offset-2 before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:z-[1] before:h-1 before:rounded-b-full before:bg-gradient-to-r before:from-[#a8b0ff] before:via-[#f0abce] before:to-[#a5d8ff] before:content-['']";

export const villageHouseNumber =
  "text-xl font-bold tabular-nums leading-none tracking-tight text-slate-900 sm:text-[1.35rem]";

/** ป้ายคอลัมน์ซ้ายในการ์ดบ้าน — กว้างพอ «ค่าส่วนกลาง» */
export const villageHouseFieldLabel =
  "w-[5rem] shrink-0 self-start pt-0.5 text-[9px] font-semibold leading-tight text-slate-400";

export const villageHouseMetaRow = "flex items-start gap-2";

export const villageHouseCardDivider = "border-t border-slate-200/70";
