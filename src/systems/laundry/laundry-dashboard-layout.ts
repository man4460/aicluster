/**
 * กริดการ์ดรายการบนแดชบอร์ดซักผ้า — มือถือหนึ่งการ์ดต่อแถว · คอม (`sm+`) **2 คอลัมน์**ต่อแถว
 * (`grid-cols-1 sm:grid-cols-2`) — ใช้กับ **รายการงาน** เท่านั้น ไม่ใช้กับแถวสถิติ
 */
export const laundryDashboardCardGridClass =
  "grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3";

/** หน้า QR พนักงาน — หนึ่งการ์ดต่อแถวทุก breakpoint (เหมือนมือถือ ไม่จัด 2 คอลัมน์บนจอใหญ่) */
export const laundryStaffQrLandingCardGridClass = "grid grid-cols-1 gap-2 sm:gap-3";

/**
 * กริด **การ์ดสถิติวันนี้** (`LaundryStat` × 4)
 * - มือถือ: 2×2 (`grid-cols-2`)
 * - คอม (`lg+`): แถวเดียว 4 คอลัมน์ · คอลัมรายรับกว้างกว่า · ความสูงเท่ากันทั้งแถว
 */
export const laundryDashboardStatsGridClass =
  "grid auto-rows-fr grid-cols-2 gap-2 sm:gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.45fr)]";

/**
 * แท็บ «แพ็กเกจ» — **หนึ่งการ์ดต่อแถวทุก breakpoint** (บนคอมเป็นรายการแถวเต็มความกว้าง ไม่จัด 3 คอลัมน์)
 */
export const laundryPackageTabListGridClass = "grid grid-cols-1 gap-2 sm:gap-3";
