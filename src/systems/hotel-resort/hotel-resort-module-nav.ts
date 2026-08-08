/** เมนูหัวโมดูลโรงแรม / รีสอร์ท — ใช้ทั้งการ์ดหัวและแถบ header หลักเมื่อย่อ */



export const HOTEL_RESORT_BASE = "/dashboard/hotel-resort";

export const HOTEL_RESORT_SETTINGS_HREF = `${HOTEL_RESORT_BASE}/settings`;

export const HOTEL_RESORT_MODULE_DISPLAY_NAME = "โรงแรม / รีสอร์ท";



export const HOTEL_RESORT_HEADER_COLLAPSE_KEY = "mawell-hotel-resort-module-header-collapsed";

export const HOTEL_RESORT_HEADER_COLLAPSE_EVENT = "mawell-hotel-resort-header-collapse";



export type HotelResortNavKey =

  | "dashboard"

  | "rooms"

  | "bookings"

  | "checkIn"

  | "finance"

  | "guest"

  | "settings";



export type HotelResortNavItem = {

  key: HotelResortNavKey;

  href: string;

  label: string;

  shortLabel: string;

};



export const HOTEL_RESORT_NAV_ITEMS: HotelResortNavItem[] = [

  { key: "dashboard", href: HOTEL_RESORT_BASE, label: "แดชบอร์ด", shortLabel: "แดชบอร์ด" },

  { key: "rooms", href: `${HOTEL_RESORT_BASE}/rooms`, label: "ห้องพัก", shortLabel: "ห้อง" },

  { key: "bookings", href: `${HOTEL_RESORT_BASE}/bookings`, label: "จอง", shortLabel: "จอง" },

  { key: "checkIn", href: `${HOTEL_RESORT_BASE}/check-in`, label: "เช็คอิน", shortLabel: "เช็คอิน" },

  { key: "finance", href: `${HOTEL_RESORT_BASE}/finance`, label: "การเงิน", shortLabel: "การเงิน" },

  { key: "guest", href: `${HOTEL_RESORT_BASE}/guest-portal`, label: "ลิงก์", shortLabel: "ลิงก์" },

  { key: "settings", href: HOTEL_RESORT_SETTINGS_HREF, label: "ตั้งค่าร้าน", shortLabel: "ตั้งค่า" },

];



export function isHotelResortModulePath(pathname: string): boolean {

  return pathname === HOTEL_RESORT_BASE || pathname.startsWith(`${HOTEL_RESORT_BASE}/`);

}



export function hotelResortPathFlags(pathname: string) {

  const pathNorm = pathname.replace(/\/+$/, "") || pathname;

  const onModule = isHotelResortModulePath(pathname);

  const isRooms = pathNorm.endsWith(`${HOTEL_RESORT_BASE}/rooms`) || pathNorm.endsWith("/rooms");

  const isBookings = pathNorm.endsWith(`${HOTEL_RESORT_BASE}/bookings`) || pathNorm.endsWith("/bookings");

  const isCheckIn = pathNorm.endsWith(`${HOTEL_RESORT_BASE}/check-in`) || pathNorm.endsWith("/check-in");

  const isFinance = pathNorm.endsWith(`${HOTEL_RESORT_BASE}/finance`) || pathNorm.endsWith("/finance");

  const isGuest = pathNorm.endsWith(`${HOTEL_RESORT_BASE}/guest-portal`) || pathNorm.endsWith("/guest-portal");

  const isSettings = pathNorm === HOTEL_RESORT_SETTINGS_HREF || pathNorm.endsWith("/settings");

  const isDashboard =

    onModule && !isRooms && !isBookings && !isCheckIn && !isFinance && !isGuest && !isSettings;

  return { onModule, isDashboard, isRooms, isBookings, isCheckIn, isFinance, isGuest, isSettings };

}



export function isHotelResortNavItemActive(pathname: string, key: HotelResortNavKey): boolean {

  const f = hotelResortPathFlags(pathname);

  switch (key) {

    case "dashboard":

      return f.isDashboard;

    case "rooms":

      return f.isRooms;

    case "bookings":

      return f.isBookings;

    case "checkIn":

      return f.isCheckIn;

    case "finance":

      return f.isFinance;

    case "guest":

      return f.isGuest;

    case "settings":

      return f.isSettings;

    default:

      return false;

  }

}



export function readHotelResortHeaderCollapsed(): boolean {

  try {

    if (typeof window === "undefined") return false;

    return window.localStorage.getItem(HOTEL_RESORT_HEADER_COLLAPSE_KEY) === "1";

  } catch {

    return false;

  }

}



export function writeHotelResortHeaderCollapsed(collapsed: boolean): void {

  try {

    if (typeof window === "undefined") return;

    window.localStorage.setItem(HOTEL_RESORT_HEADER_COLLAPSE_KEY, collapsed ? "1" : "0");

    window.dispatchEvent(new Event(HOTEL_RESORT_HEADER_COLLAPSE_EVENT));

  } catch {

    /* ignore */

  }

}


