export const clubEventPanelClass =
  "rounded-2xl border border-slate-100 bg-white/90 shadow-sm backdrop-blur-sm sm:rounded-3xl";

export const clubEventGlassShellClass =
  "rounded-[1.75rem] border border-white/50 bg-gradient-to-br from-white/70 via-white/55 to-violet-50/40 shadow-[0_8px_32px_rgba(30,27,75,0.06)] backdrop-blur-2xl sm:rounded-[2.5rem]";

export const clubEventMainPaddingBottomClass = "pb-24 sm:pb-8";

export const clubEventSubtitleClass = "hidden text-sm text-[#66638c] sm:block";

export const clubEventNavActiveClass =
  "bg-gradient-to-r from-[#0000BF] to-[#6366f1] text-white shadow-md shadow-indigo-500/20";

export const clubEventNavIdleClass =
  "border border-slate-100 bg-white/80 text-[#4d47b6] hover:bg-violet-50/80";

export const clubEventFilterChipClass = (active: boolean) =>
  active
    ? "border-[#0000BF]/40 bg-[#0000BF]/10 text-[#1e1b4b] ring-2 ring-[#0000BF]/15"
    : "border-slate-100 bg-white/90 text-[#5f5a8a] hover:border-violet-200";

export const clubEventFieldClass =
  "min-h-[44px] w-full rounded-xl border border-slate-100 bg-white/90 px-3 py-2 text-sm text-[#1e1b4b] outline-none ring-[#0000BF]/20 focus:border-[#0000BF]/40 focus:ring-2";

export const clubEventRowCardClass =
  "flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white/95 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4";

export const clubEventFixedBottomActionClass =
  "fixed inset-x-0 bottom-0 z-40 border-t border-slate-100 bg-white/95 p-3 backdrop-blur-xl sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none";

export const clubEventMobileDockClass =
  "fixed inset-x-3 bottom-3 z-50 rounded-[2rem] border border-white/50 bg-white/85 p-1.5 shadow-[0_12px_40px_rgba(30,27,75,0.12)] backdrop-blur-2xl sm:hidden";
