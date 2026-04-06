/**
 * โทน UI ร้านตัดผม — ให้สอดคล้องคาร์แคร์ / template กลาง (ม่วง MAWELL)
 */
export const barberNavItemBase =
  "flex min-h-[44px] min-w-0 touch-manipulation select-none items-center justify-center rounded-xl px-3 text-sm font-semibold transition-colors active:opacity-90 sm:min-h-0 sm:w-auto sm:justify-center sm:px-3.5 sm:py-2";

/** สแต็กหลักใต้ PageHeader — ลดการซ้อนกับ app-surface ของเลย์เอาต์ */
export const barberPageStackClass = "min-w-0 space-y-5";

/** เซกชันแรกในเนื้อหาหน้า (ไม่มีเส้นแบ่งบน) */
export const barberSectionFirstClass = "min-w-0 space-y-4";

/** เซกชันถัดไป — แบ่งจากบล็อกก่อนหน้า */
export const barberSectionNextClass = "min-w-0 space-y-4 border-t border-[#ecebff] pt-5";

/** การ์ดแถวรายการมาตรฐาน */
export const barberListRowCardClass =
  "rounded-xl border border-[#ecebff] bg-white px-3 py-3 shadow-sm sm:py-2.5";

export const barberInlineAlertErrorClass =
  "rounded-xl border border-red-200/80 bg-red-50/90 px-4 py-3 text-sm leading-relaxed text-red-800";

export const barberInlineAlertSuccessClass =
  "rounded-xl border border-emerald-200/80 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-900";

/** กลุ่มปุ่มไอคอนแนวร้านตัดผม */
export const barberIconToolbarGroupClass =
  "flex items-center gap-0.5 rounded-lg border border-[#e8e6f8] bg-[#f8f7ff] p-0.5";

/** ปุ่มกลับแดชบอร์ด — สูงเท่าปุ่มหลัก MAWELL (app-btn-soft) */
export const barberDashboardBackLinkClass =
  "app-btn-soft inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-[#2e2a58] print:hidden";

/** แถวปุ่มหัวเซกชัน (ย้อนกลับ + ปุ่มหลัก) */
export const barberSectionActionsRowClass = "flex flex-wrap items-center gap-2 sm:gap-3";

/** การ์ดสถิติย่อยใต้แดชบอร์ด */
export const barberStatCardClass =
  "flex min-h-[100px] flex-col justify-center rounded-2xl border border-[#e8e6f4]/80 bg-white p-4 shadow-sm";
