/**
 * โทน UI POS ร้านอาหาร — อิงแม่แบบคาร์แคร์ (glass / มุมมน / MAWELL)
 */

/** เปลือกโมดูลหลัก — เทียบ CarWashDashboard การ์ดหัว */
export const buildingPosModuleGlassShellClass =
  "overflow-hidden rounded-[2.5rem] max-md:rounded-2xl border border-white/50 bg-gradient-to-br from-white/50 via-indigo-50/25 to-violet-100/20 shadow-[0_24px_60px_-28px_rgba(30,27,75,0.32),inset_0_1px_0_0_rgba(255,255,255,0.55)] backdrop-blur-2xl ring-1 ring-inset ring-white/55";

/** พื้นที่เลื่อนเนื้อหา — ไม่ให้ถูก dock บัง (มือถือ) */
export const buildingPosShellMainPaddingBottomClass =
  "max-md:pb-[max(8.5rem,6rem+env(safe-area-inset-bottom,0px))] md:pb-0";

/** การ์ดสถิติแดชบอร์ด — เทียบ CarWashStat */
export const buildingPosStatCardEmeraldClass =
  "relative overflow-hidden rounded-[2rem] border border-white/60 bg-gradient-to-br from-white/60 via-emerald-50/35 to-emerald-100/30 p-4 shadow-[0_18px_38px_-26px_rgba(16,185,129,0.35)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_44px_-24px_rgba(30,27,75,0.35)] sm:p-5";

export const buildingPosStatCardIndigoClass =
  "relative overflow-hidden rounded-[2rem] border border-white/60 bg-gradient-to-br from-white/60 via-indigo-50/35 to-indigo-100/30 p-4 shadow-[0_18px_38px_-26px_rgba(79,70,229,0.45)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_44px_-24px_rgba(30,27,75,0.35)] sm:p-5";

export const buildingPosStatCardVioletClass =
  "relative overflow-hidden rounded-[2rem] border border-white/60 bg-gradient-to-br from-white/60 via-violet-50/30 to-fuchsia-50/25 p-4 shadow-[0_18px_38px_-26px_rgba(139,92,246,0.35)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_44px_-24px_rgba(30,27,75,0.35)] sm:p-5";

/** แถวรายการหมวด / เมนู — พื้นไล่ + โค้งชั้นใน */
export const buildingPosListRowCardClass =
  "relative overflow-hidden rounded-[2rem] border border-[#e8e6f4]/90 bg-gradient-to-br from-white via-white to-[#faf9ff]/95 px-2.5 py-3 shadow-[0_8px_26px_-18px_rgba(91,97,255,0.14)] transition-[box-shadow,border-color] duration-300 sm:px-4 sm:py-2.5 hover:border-[#d4cff7]/90 hover:shadow-[0_14px_36px_-22px_rgba(79,70,229,0.16)]";

/** Hub ใหญ่ (QR ฯลฯ) — ชั้นนอกสอดคล้องเปลือก 2.5rem */
export const buildingPosQrHubOuterClass =
  "overflow-hidden rounded-[2.5rem] max-md:rounded-2xl border border-white/50 bg-gradient-to-br from-white/55 via-[#faf9ff] to-indigo-50/25 shadow-[0_24px_60px_-28px_rgba(77,71,182,0.35)] backdrop-blur-xl ring-1 ring-inset ring-white/45";

/** แผงเนื้อหาภายใน (หมวด / เมนู / ต้นทุน) — glass อ่อน โค้ง 2rem */
export const buildingPosContentPanelClass =
  "app-surface rounded-[2rem] border border-white/60 bg-white/50 p-4 shadow-[0_16px_40px_-28px_rgba(30,27,75,0.18)] backdrop-blur-md sm:p-5";

/** แถบแท็บย่อย (เทียบแพ็กเกจ/สมาชิกบาร์เบอร์ / offers คาร์แคร์) */
export const buildingPosSubTabSegmentShellClass =
  "rounded-[2rem] border border-[#e4e0f5]/90 bg-gradient-to-r from-white/95 via-[#faf9ff] to-indigo-50/20 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.88)]";
