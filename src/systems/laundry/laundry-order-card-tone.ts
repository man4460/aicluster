/** โทนการ์ดรายการงานซักผ้า — เส้นสีซ้าย + พื้นอ่อน */

import type { LaundryOrderStatus } from "@/systems/laundry/laundry-order-status";

export type LaundryOrderCardToneClasses = {
  leftBorder: string;
  bg: string;
  badge: string;
  hoverShadow: string;
};

export function laundryOrderCardToneClasses(status: LaundryOrderStatus): LaundryOrderCardToneClasses {
  switch (status) {
    case "PENDING_PICKUP":
      return {
        leftBorder: "border-l-amber-500",
        bg: "bg-amber-50/50",
        badge: "font-semibold text-amber-950",
        hoverShadow: "hover:shadow-md hover:shadow-amber-100/80",
      };
    case "PICKED_UP":
      return {
        leftBorder: "border-l-sky-500",
        bg: "bg-sky-50/50",
        badge: "font-semibold text-sky-950",
        hoverShadow: "hover:shadow-md hover:shadow-sky-100/80",
      };
    case "SORTING":
      return {
        leftBorder: "border-l-violet-500",
        bg: "bg-violet-50/40",
        badge: "font-semibold text-violet-950",
        hoverShadow: "hover:shadow-md hover:shadow-violet-100/80",
      };
    case "WASHING":
      return {
        leftBorder: "border-l-cyan-500",
        bg: "bg-cyan-50/40",
        badge: "font-semibold text-cyan-950",
        hoverShadow: "hover:shadow-md hover:shadow-cyan-100/80",
      };
    case "DRYING":
      return {
        leftBorder: "border-l-indigo-500",
        bg: "bg-indigo-50/40",
        badge: "font-semibold text-indigo-950",
        hoverShadow: "hover:shadow-md hover:shadow-indigo-100/80",
      };
    case "IRONING":
      return {
        leftBorder: "border-l-teal-500",
        bg: "bg-teal-50/40",
        badge: "font-semibold text-teal-950",
        hoverShadow: "hover:shadow-md hover:shadow-teal-100/80",
      };
    case "READY_TO_DELIVER":
    case "DELIVERING":
      return {
        leftBorder: "border-l-emerald-500",
        bg: "bg-emerald-50/40",
        badge: "font-semibold text-emerald-950",
        hoverShadow: "hover:shadow-md hover:shadow-emerald-100/80",
      };
    case "COMPLETED":
      return {
        leftBorder: "border-l-slate-400",
        bg: "bg-slate-50/80",
        badge: "font-semibold text-slate-700",
        hoverShadow: "hover:shadow-md",
      };
    case "CANCELLED":
      return {
        leftBorder: "border-l-rose-500",
        bg: "bg-rose-50/40",
        badge: "font-semibold text-rose-950",
        hoverShadow: "hover:shadow-md hover:shadow-rose-100/80",
      };
  }
}
