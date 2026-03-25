/** ระยะห่างระหว่างพิกัด WGS84 (เมตร) */
export function distanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** ร้านตั้งพิกัดไว้และลูกค้าอยู่ในรัศมี (เมตร) */
export function isWithinRadiusMeters(
  shopLat: number | null | undefined,
  shopLon: number | null | undefined,
  clientLat: number,
  clientLon: number,
  radiusMeters: number,
): { ok: boolean; distance: number | null } {
  if (
    shopLat == null ||
    shopLon == null ||
    !Number.isFinite(shopLat) ||
    !Number.isFinite(shopLon) ||
    !Number.isFinite(clientLat) ||
    !Number.isFinite(clientLon)
  ) {
    return { ok: false, distance: null };
  }
  const d = distanceMeters(shopLat, shopLon, clientLat, clientLon);
  return { ok: d <= radiusMeters, distance: d };
}
