/**
 * Chat AI ส่วนตัว (น้องมาเวล) — จุดเดียวสำหรับ “logic การ chat” ฝั่ง public API
 * การทำงานเต็มอยู่ที่ @/lib/chat-ai/personal-ai-service
 */
export { runPersonalAiChat, type PersonalAiRequest, type PersonalAiResult } from "@/lib/chat-ai/personal-ai-service";
export { requireChatAiPermission, type ChatAiAuthedUser } from "@/lib/chat-ai/permission-middleware";
