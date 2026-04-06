/**
 * เลย์เอาต์มาตรฐานกราฟแท่งแนวตั้งแบบเลื่อน (spark) — ใช้คู่กับ
 * AppRevenueCostColumnChart / AppColumnBarSparkChart / AppColumnBarDualSparkChart
 */

/** การ์ดห่อกราฟแต่ละชุด (โทนม่วง MAWELL) */
export const appSparkChartPanelClass =
  "flex min-h-0 flex-col rounded-lg border border-[#d8d6ec] bg-[#faf9ff]/70 p-3 shadow-sm";

/** Grid สองคอลัมน์ (มือถือสแต็ก) สำหรับวางกราฟคู่ข้างกัน */
export const appSparkChartsTwoColumnGridClass =
  "grid min-w-0 grid-cols-1 items-start gap-3 lg:grid-cols-2 lg:gap-4";
