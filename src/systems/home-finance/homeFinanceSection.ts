export type HomeFinanceSection =
  | "dashboard"
  | "history"
  | "categories"
  | "utilities"
  | "vehicles"
  | "reminders";

/**
 * อ่านจาก pathname — ใช้ segment หลัง `home-finance` เท่านั้น
 * (ไม่ใช้ `includes("/history")` เพราะอาจไปชน path อื่นที่มีคำว่า history)
 */
export function deriveHomeFinanceSection(pathname: string): HomeFinanceSection {
  const pathOnly = (pathname.split("?")[0] ?? "").replace(/\/+$/, "") || "/";
  const segments = pathOnly.split("/").filter(Boolean);
  const idx = segments.indexOf("home-finance");
  if (idx < 0) return "dashboard";

  const sub = segments[idx + 1];
  switch (sub) {
    case "history":
      return "history";
    case "categories":
      return "categories";
    case "utilities":
      return "utilities";
    case "vehicles":
      return "vehicles";
    case "reminders":
      return "reminders";
    default:
      return "dashboard";
  }
}
