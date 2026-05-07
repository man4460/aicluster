/** โทนการ์ดรายการงานซักผ้า — เทียบ `laneTone` ใน `CarWashServiceLanePanel` */

import type { LaundryOrderStatus } from "@/systems/laundry/laundry-order-status";

export type LaundryOrderCardToneClasses = {
  border: string;
  bg: string;
  ring: string;
  badge: string;
  hoverBorder: string;
  ribbonGradient: string;
};

export function laundryOrderCardToneClasses(status: LaundryOrderStatus): LaundryOrderCardToneClasses {
  switch (status) {
    case "PENDING_PICKUP":
      return {
        border: "border-amber-300/90",
        bg: "bg-amber-50/90",
        ring: "ring-amber-200/75",
        badge: "font-semibold text-amber-950",
        hoverBorder: "hover:border-amber-400",
        ribbonGradient: "from-amber-400 via-orange-400 to-rose-400",
      };
    case "PICKED_UP":
      return {
        border: "border-sky-300/90",
        bg: "bg-sky-50/90",
        ring: "ring-sky-200/75",
        badge: "font-semibold text-sky-950",
        hoverBorder: "hover:border-sky-400",
        ribbonGradient: "from-sky-400 via-blue-500 to-indigo-500",
      };
    case "SORTING":
      return {
        border: "border-violet-300/90",
        bg: "bg-violet-50/90",
        ring: "ring-violet-200/75",
        badge: "font-semibold text-violet-950",
        hoverBorder: "hover:border-violet-400",
        ribbonGradient: "from-violet-400 via-fuchsia-400 to-pink-400",
      };
    case "WASHING":
      return {
        border: "border-cyan-300/90",
        bg: "bg-cyan-50/90",
        ring: "ring-cyan-200/75",
        badge: "font-semibold text-cyan-950",
        hoverBorder: "hover:border-cyan-400",
        ribbonGradient: "from-cyan-400 via-sky-500 to-blue-600",
      };
    case "DRYING":
      return {
        border: "border-indigo-300/90",
        bg: "bg-indigo-50/90",
        ring: "ring-indigo-200/75",
        badge: "font-semibold text-indigo-950",
        hoverBorder: "hover:border-indigo-400",
        ribbonGradient: "from-indigo-400 via-violet-500 to-purple-600",
      };
    case "IRONING":
      return {
        border: "border-teal-300/90",
        bg: "bg-teal-50/90",
        ring: "ring-teal-200/75",
        badge: "font-semibold text-teal-950",
        hoverBorder: "hover:border-teal-400",
        ribbonGradient: "from-teal-400 via-emerald-400 to-cyan-500",
      };
    case "READY_TO_DELIVER":
    case "DELIVERING":
      return {
        border: "border-emerald-300/90",
        bg: "bg-emerald-50/90",
        ring: "ring-emerald-200/75",
        badge: "font-semibold text-emerald-950",
        hoverBorder: "hover:border-emerald-400",
        ribbonGradient: "from-emerald-400 via-green-400 to-lime-400",
      };
    case "COMPLETED":
      return {
        border: "border-slate-300/85",
        bg: "bg-slate-50/90",
        ring: "ring-slate-200/70",
        badge: "font-semibold text-slate-700",
        hoverBorder: "hover:border-slate-400",
        ribbonGradient: "from-slate-400 via-slate-500 to-slate-600",
      };
    case "CANCELLED":
      return {
        border: "border-rose-300/90",
        bg: "bg-rose-50/90",
        ring: "ring-rose-200/75",
        badge: "font-semibold text-rose-950",
        hoverBorder: "hover:border-rose-400",
        ribbonGradient: "from-rose-400 via-red-400 to-orange-400",
      };
  }
}
