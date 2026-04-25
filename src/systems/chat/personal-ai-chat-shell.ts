/**
 * คลาสของ wrapper นอกสุดของแชท AI — แหล่งเดียวสำหรับ `PersonalAiChat` และ skeleton ใน `chat-ai-client`
 * ห้ามคัดลอกสตริงซ้ำ: ถ้าแก้ layout นอก ให้แก้ที่นี่เท่านั้น
 * ไม่ผ่าน `cn` / tailwind-merge ที่นี่ — ลำดับ token ต้องคงที่สำหรับ skeleton
 */
export const PERSONAL_AI_CHAT_ROOT_CLASS =
  "relative flex max-h-full min-h-0 flex-1 flex-col gap-3 overflow-hidden text-slate-800 lg:h-full lg:flex-row lg:items-stretch lg:gap-4 lg:rounded-2xl lg:bg-gradient-to-br lg:from-[#f3f1fc] lg:via-[#faf9ff] lg:to-[#ebe8f7]/90 lg:p-1.5 lg:ring-1 lg:ring-[#e4e2f5]/80";

/** `aria-label` ของ `#personal-ai-digest` — ต้องตรงกับ skeleton (`chat-ai-client`) เพื่อ hydration */
export const PERSONAL_AI_DIGEST_ASIDE_ARIA_LABEL = "สรุปรายวัน — งาน รายการ โน้ต";

/** แถบสรุปรายวัน (ซ้าย) — ตรงกับ `PersonalAiDailyDigest` + `order-1` จากแชท */
export const PERSONAL_AI_CHAT_DIGEST_ASIDE_CLASS =
  "order-1 flex min-h-0 max-h-[min(52vh,28rem)] w-full min-w-0 shrink-0 flex-col overflow-hidden rounded-2xl border border-[#dcd7f0] bg-gradient-to-b from-[#faf9ff] via-[#f3f1fc] to-[#e8e4f7] shadow-xl shadow-indigo-950/[0.09] ring-1 ring-white/70 lg:h-full lg:max-h-none lg:w-72 lg:min-w-[18rem] xl:w-80";

/** ครอบ children ของ aside#personal-ai-digest — โซ่ flex ให้โซนเลื่อนทำงาน */
export const PERSONAL_AI_CHAT_DIGEST_INNER_CLASS =
  "flex min-h-0 w-full min-w-0 flex-1 flex-col";

/** การ์ดแชทหลัก (ขวา) */
export const PERSONAL_AI_CHAT_CARD_SHELL_CLASS =
  "order-2 flex min-h-[min(52vh,28rem)] min-w-0 max-h-full flex-1 flex-col overflow-hidden rounded-2xl border border-[#e4e2f5] bg-white shadow-lg shadow-indigo-950/[0.08] ring-1 ring-white/80 lg:h-full lg:min-h-0";

/**
 * พื้นที่เลื่อนข้อความในการ์ดแชท
 * ใช้ max-h อิง dvh ตลอด ไม่ใช่ lg:max-h-full กับ parent ที่เติบโตตามเนื้อหา (จะทำให้ทั้งการ์ดยืด ไม่มี scroll ด้านใน)
 */
export const PERSONAL_AI_CHAT_MESSAGES_SCROLL_CLASS =
  "min-h-0 flex-1 max-h-[min(68dvh,24rem)] overflow-y-auto overflow-x-hidden overscroll-contain bg-gradient-to-b from-[#f8f7fd]/90 via-[#faf9ff]/50 to-slate-50/40 px-3 py-4 touch-pan-y [scrollbar-gutter:stable] sm:max-h-[min(72dvh,32rem)] sm:px-4 sm:py-5 md:max-h-[min(76dvh,36rem)] lg:max-h-[min(78dvh,42rem)]";
