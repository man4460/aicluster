/**
 * คลาสของ wrapper นอกสุดของแชท AI — แหล่งเดียวสำหรับ `PersonalAiChat` และ skeleton ใน `chat-ai-client`
 * ห้ามคัดลอกสตริงซ้ำ: ถ้าแก้ layout นอก ให้แก้ที่นี่เท่านั้น
 * ไม่ผ่าน `cn` / tailwind-merge ที่นี่ — ลำดับ token ต้องคงที่สำหรับ skeleton
 */
export const PERSONAL_AI_CHAT_ROOT_CLASS =
  "relative flex max-h-full min-h-0 flex-1 flex-col overflow-hidden text-slate-800 lg:h-full lg:rounded-2xl lg:bg-gradient-to-br lg:from-[#f3f1fc] lg:via-[#faf9ff] lg:to-[#ebe8f7]/90 lg:p-1.5 lg:ring-1 lg:ring-[#e4e2f5]/80";

/** การ์ดแชทหลัก — เต็มความกว้างใต้ root (ไม่มีแถบ digest ด้านข้าง) */
export const PERSONAL_AI_CHAT_CARD_SHELL_CLASS =
  "flex min-h-[min(56vh,30rem)] min-w-0 max-h-full flex-1 flex-col overflow-hidden rounded-2xl border border-[#e4e2f5] bg-white shadow-lg shadow-indigo-950/[0.08] ring-1 ring-white/80 lg:h-full lg:min-h-0";

/**
 * พื้นที่เลื่อนข้อความในการ์ดแชท
 * ใช้ max-h อิง dvh ตลอด ไม่ใช่ lg:max-h-full กับ parent ที่เติบโตตามเนื้อหา (จะทำให้ทั้งการ์ดยืด ไม่มี scroll ด้านใน)
 */
export const PERSONAL_AI_CHAT_MESSAGES_SCROLL_CLASS =
  "min-h-0 flex-1 max-h-[min(68dvh,24rem)] overflow-y-auto overflow-x-hidden overscroll-contain bg-[#d5ecc9] px-2 py-3 touch-pan-y [scrollbar-gutter:stable] shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] sm:max-h-[min(72dvh,32rem)] sm:px-3 sm:py-4 md:max-h-[min(76dvh,36rem)] lg:max-h-[min(78dvh,42rem)]";
