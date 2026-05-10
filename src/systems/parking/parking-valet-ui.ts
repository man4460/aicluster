/** UI tokens — บริการรับฝากจอดรถ (Emerald + Sky) — ให้สอดคล้องแม่แบบ glass / dock */
export const parkingValetGlassShellClass =
  "rounded-[2.5rem] border border-white/55 bg-gradient-to-br from-emerald-50/90 via-sky-50/40 to-white/90 shadow-[0_18px_42px_-28px_rgba(5,150,105,0.35)] backdrop-blur-2xl ring-1 ring-white/70";

export const parkingValetDockClass =
  "fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom,0px))] z-40 grid grid-cols-5 gap-1 rounded-[2.5rem] border border-emerald-200/80 bg-white/85 p-2 shadow-lg shadow-emerald-900/10 backdrop-blur-xl md:hidden";

export const parkingValetNavBtnActive =
  "bg-gradient-to-r from-emerald-600 to-sky-500 text-white shadow-md shadow-emerald-900/15";

export const parkingValetNavBtnIdle =
  "border border-slate-200/80 bg-white/90 text-slate-700 hover:border-emerald-300/80 hover:bg-emerald-50/60";

export const parkingValetDesktopNavClass =
  "hidden md:flex flex-wrap gap-2 border-t border-white/50 pt-4";

export const parkingValetPrimaryBtnClass =
  "inline-flex min-h-[44px] items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-600 to-sky-500 px-5 text-sm font-bold text-white shadow-md transition hover:brightness-105 disabled:opacity-50";

export const parkingValetSecondaryBtnClass =
  "inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-emerald-200 bg-white/90 px-5 text-sm font-semibold text-emerald-900 shadow-sm transition hover:bg-emerald-50/80";

export const parkingValetCardClass =
  "rounded-[2rem] border border-emerald-100/90 bg-white/75 p-5 shadow-sm backdrop-blur-sm ring-1 ring-white/80";
