import { CHAT_AI_DASHBOARD_HREF } from "@/lib/dashboard/chat-ai-href";

/** การ์ดแผนผังระบบ — `imageUrl` มาจากแอดมิน (module_list.card_image_url) เมื่อมี `moduleSlug` */
export type DashboardSystemCard = {
  href: string;
  label: string;
  emoji: string;
  imageUrl?: string | null;
};

export type DashboardSystemCatalogEntry = DashboardSystemCard & {
  moduleSlug?: string;
};

export const DASHBOARD_LIVE_SYSTEMS: DashboardSystemCatalogEntry[] = [
  { href: "/dashboard/attendance", label: "เช็คอินอัจฉริยะ", emoji: "📋", moduleSlug: "attendance" },
  { href: "/dashboard/dormitory", label: "หอพัก", emoji: "🏠", moduleSlug: "dormitory" },
  { href: "/dashboard/home-finance", label: "รายรับ–รายจ่าย", emoji: "💰", moduleSlug: "income-expense-basic" },
  { href: "/dashboard/village", label: "หมู่บ้าน", emoji: "🏘️", moduleSlug: "village" },
  { href: "/dashboard/barber", label: "ร้านตัดผม", emoji: "✂️", moduleSlug: "barber" },
  { href: "/dashboard/car-wash", label: "คาร์แคร์", emoji: "🚿", moduleSlug: "car-wash" },
  { href: "/dashboard/building-pos", label: "POS ร้านอาหาร", emoji: "🍽️", moduleSlug: "building-pos" },
  { href: "/dashboard/parking", label: "ระบบเช่าที่จอดรถ", emoji: "📍", moduleSlug: "parking" },
  { href: "/dashboard/chat", label: "แชท", emoji: "💬" },
  { href: CHAT_AI_DASHBOARD_HREF, label: "Chat AI", emoji: "🌟" },
  { href: "/dashboard/modules", label: "โมดูล / ทดลอง", emoji: "🧩" },
];

export const DASHBOARD_ROADMAP_SYSTEMS: DashboardSystemCard[] = [
  { href: "/dashboard/analytics", label: "วิเคราะห์", emoji: "📊" },
  { href: "/dashboard/booking", label: "จองคิว", emoji: "📅" },
  { href: "/dashboard/coop", label: "สหกรณ์", emoji: "🏦" },
  { href: "/dashboard/inventory", label: "คลัง / สต็อก", emoji: "📦" },
  { href: "/dashboard/laundry", label: "ซักรีด", emoji: "🧺" },
  { href: "/dashboard/line-integration", label: "LINE", emoji: "📱" },
  { href: "/dashboard/loan", label: "สินเชื่อ", emoji: "💳" },
  { href: "/dashboard/rental", label: "เช่าสื่อ", emoji: "📀" },
  { href: "/dashboard/spa", label: "นวด / สปา", emoji: "🧖‍♀️" },
];

export function mergeLiveSystemCardImages(
  bySlug: Record<string, string | null | undefined>,
): DashboardSystemCard[] {
  return DASHBOARD_LIVE_SYSTEMS.map(({ moduleSlug, ...card }) => ({
    ...card,
    imageUrl: moduleSlug ? (bySlug[moduleSlug] ?? null) : card.imageUrl,
  }));
}
