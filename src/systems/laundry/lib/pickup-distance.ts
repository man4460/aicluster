import { distanceMeters } from "@/lib/geo/haversine";

/** ระยะทางกม. ระหว่างร้านกับจุดรับผ้า — null ถ้าไม่มีพิกัดครบ */
export function laundryDistanceKm(
  shopLat: number | null | undefined,
  shopLng: number | null | undefined,
  pickupLat: number | null | undefined,
  pickupLng: number | null | undefined,
): number | null {
  if (
    shopLat == null ||
    shopLng == null ||
    pickupLat == null ||
    pickupLng == null ||
    !Number.isFinite(Number(shopLat)) ||
    !Number.isFinite(Number(shopLng)) ||
    !Number.isFinite(Number(pickupLat)) ||
    !Number.isFinite(Number(pickupLng))
  ) {
    return null;
  }
  const meters = distanceMeters(Number(shopLat), Number(shopLng), Number(pickupLat), Number(pickupLng));
  return Math.round((meters / 1000) * 1000) / 1000;
}

/** ค่าขนส่งจากระยะทาง (บาท) — null ถ้าไม่ตั้งอัตรา */
export function laundryPickupFeeBaht(distanceKm: number | null, feePerKmBaht: number | null | undefined): number | null {
  if (distanceKm == null || feePerKmBaht == null || feePerKmBaht <= 0) return null;
  return Math.round(distanceKm * feePerKmBaht);
}
