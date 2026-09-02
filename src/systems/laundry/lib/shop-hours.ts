import { barberMinutesToHm, barberParseHmToMinutes } from "@/systems/barber/lib/booking-slots";

export { barberMinutesToHm as laundryMinutesToHm, barberParseHmToMinutes as laundryParseHmToMinutes };

export function laundryNormalizeOpenClose(openTime: string | null | undefined, closeTime: string | null | undefined) {
  const open = openTime && barberParseHmToMinutes(openTime) != null ? openTime : "09:00";
  const close = closeTime && barberParseHmToMinutes(closeTime) != null ? closeTime : "20:00";
  return { openTime: open, closeTime: close };
}
