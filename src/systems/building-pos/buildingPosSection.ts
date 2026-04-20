export type BuildingPosSection = "dashboard" | "sales" | "staff-link" | "costs";

/**
 * อ่านจาก pathname — segment หลัง `building-pos` เท่านั้น
 * (ไม่ใช้ includes เพื่อไม่ชน path อื่น)
 */
export function deriveBuildingPosSection(pathname: string): BuildingPosSection {
  const pathOnly = (pathname.split("?")[0] ?? "").replace(/\/+$/, "") || "/";
  const segments = pathOnly.split("/").filter(Boolean);
  const idx = segments.indexOf("building-pos");
  if (idx < 0) return "dashboard";

  const sub = segments[idx + 1];
  if (sub === "sales") return "sales";
  if (sub === "staff-link") return "staff-link";
  if (sub === "costs") return "costs";
  return "dashboard";
}
