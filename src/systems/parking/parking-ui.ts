/** โทน UI ระบบรับฝากจอดรถ — สอดคล้องคาร์แคร์ / template กลาง */

import {
  parkingCardSurfaceRadiusClass,
  parkingValetInnerCardClass,
} from "@/systems/parking/parking-ui-tokens";

export const parkingCard = parkingValetInnerCardClass;

export const parkingBtnPrimary =
  "app-btn-primary app-tap-feedback inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-md transition disabled:opacity-50";

export const parkingBtnSecondary =
  "app-tap-feedback inline-flex items-center justify-center rounded-xl border border-white/60 bg-white/80 px-4 py-2.5 text-sm font-semibold text-[#4d47b6] shadow-sm ring-1 ring-white/55 transition hover:border-[#5b61ff]/35 hover:bg-white disabled:opacity-50";

/** การ์ดช่องจอดบนแดชบอร์ด */
export const parkingSpotTile =
  `group relative flex min-h-[140px] flex-col overflow-hidden ${parkingCardSurfaceRadiusClass} border border-white/60 bg-gradient-to-br from-white/60 via-indigo-50/20 to-violet-50/15 p-4 shadow-[0_18px_38px_-26px_rgba(30,27,75,0.35)] backdrop-blur-xl ring-1 ring-inset ring-white/50 transition-all duration-300 hover:-translate-y-1 hover:bg-white/70 hover:shadow-[0_24px_44px_-24px_rgba(30,27,75,0.4)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5b61ff]/35 before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-1 before:rounded-b-full before:bg-gradient-to-r before:from-[#5b61ff]/80 before:via-[#a78bfa]/50 before:to-[#5b61ff]/40 before:content-['']`;

export const parkingSpotTileOccupied =
  "before:from-amber-500/90 before:via-amber-600/80 before:to-orange-500/70";

export const parkingField =
  "app-input w-full rounded-xl px-3 py-2.5 text-sm text-[#1e1b4b] outline-none transition focus:border-[#5b61ff]/45 focus:ring-2 focus:ring-[#5b61ff]/15";
