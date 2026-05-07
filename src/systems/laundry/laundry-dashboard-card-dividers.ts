/** เส้นคั่น + เงา inset การ์ดแดชบอร์ดซักผ้า — ใช้ที่แถบ «อัปเดตสถานะ» ใน `LaundryOrderCard` */

export type LaundryDashboardPanelTone = "violet" | "slate";

export function laundryDashboardCardDividerClasses(tone: LaundryDashboardPanelTone) {
  const dividerClass =
    tone === "violet" ? "border-white/55" : "border-slate-200/90";
  const dividerStrong =
    tone === "violet" ? "border-white/70" : "border-slate-300/85";
  const dimVerticalRidge =
    tone === "violet" ?
      "shadow-[inset_8px_0_18px_-12px_rgba(255,255,255,0.42),inset_-8px_0_16px_-12px_rgba(30,27,75,0.07)]"
    : "shadow-[inset_8px_0_18px_-12px_rgba(255,255,255,0.75),inset_-8px_0_16px_-12px_rgba(15,23,42,0.06)]";
  const dimHorizontalMetaRidge =
    tone === "violet" ?
      "shadow-[inset_0_4px_12px_-8px_rgba(255,255,255,0.38),inset_0_-6px_14px_-10px_rgba(30,27,75,0.09)]"
    : "shadow-[inset_0_4px_12px_-8px_rgba(255,255,255,0.65),inset_0_-6px_14px_-10px_rgba(15,23,42,0.07)]";
  const dimHorizontalStripRidge =
    tone === "violet" ?
      "shadow-[inset_0_8px_18px_-10px_rgba(30,27,75,0.1),inset_0_-5px_14px_-8px_rgba(255,255,255,0.32)]"
    : "shadow-[inset_0_8px_18px_-10px_rgba(15,23,42,0.08),inset_0_-5px_14px_-8px_rgba(255,255,255,0.55)]";

  return {
    dividerClass,
    dividerStrong,
    dimVerticalRidge,
    dimHorizontalMetaRidge,
    dimHorizontalStripRidge,
  };
}
