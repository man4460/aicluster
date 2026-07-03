import { cn } from "@/lib/cn";
import { HOTEL_ROOM_STATUS_LABELS } from "@/systems/hotel-resort/lib/room-status";

type HotelResortRoomStatus = "VACANT" | "OCCUPIED" | "RESERVED" | "MAINTENANCE";

const tone: Record<HotelResortRoomStatus, string> = {
  VACANT: "border-emerald-200/80 bg-emerald-50/90 text-emerald-800",
  OCCUPIED: "border-indigo-200/80 bg-indigo-50/90 text-indigo-800",
  RESERVED: "border-amber-200/80 bg-amber-50/90 text-amber-800",
  MAINTENANCE: "border-rose-200/80 bg-rose-50/90 text-rose-800",
};

function statusIcon(status: HotelResortRoomStatus, className?: string) {
  const props = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2.2,
    "aria-hidden": true as const,
  };
  switch (status) {
    case "VACANT":
      return (
        <svg {...props}>
          <path d="M4 4h10v16H4zM14 12h6M17 9v6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "OCCUPIED":
      return (
        <svg {...props}>
          <path d="M3 12h18v7H3zM5 12V8a2 2 0 012-2h3v6M14 6h3a2 2 0 012 2v4" strokeLinejoin="round" />
        </svg>
      );
    case "RESERVED":
      return (
        <svg {...props}>
          <rect x="4" y="5" width="16" height="15" rx="2" />
          <path d="M8 3v4M16 3v4M4 10h16" strokeLinecap="round" />
        </svg>
      );
    case "MAINTENANCE":
      return (
        <svg {...props}>
          <path d="M14.7 6.3a4 4 0 105.657 5.657L8.5 23.5l-4-4L14.7 6.3z" strokeLinejoin="round" />
        </svg>
      );
  }
}

export function HotelResortRoomStatusBadge({
  status,
  className,
}: {
  status: HotelResortRoomStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wide",
        tone[status],
        className,
      )}
    >
      {statusIcon(status, "h-3 w-3")}
      {HOTEL_ROOM_STATUS_LABELS[status]}
    </span>
  );
}
