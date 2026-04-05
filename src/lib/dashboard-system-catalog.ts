/** รายการสำหรับหน้าแดชบอร์ด / explore — ไม่ผูก subscribe */
export type DashboardSystemCard = {
  href: string;
  label: string;
  emoji: string;
};

export const DASHBOARD_LIVE_SYSTEMS: DashboardSystemCard[] = [
  { href: "/dashboard/attendance", label: "เช็คชื่ออัจฉริยะ", emoji: "📋" },
  { href: "/dashboard/dormitory", label: "หอพัก", emoji: "🏠" },
  { href: "/dashboard/home-finance", label: "รายรับ–รายจ่าย", emoji: "💰" },
  { href: "/dashboard/village", label: "หมู่บ้าน", emoji: "🏘️" },
  { href: "/dashboard/barber", label: "ร้านตัดผม", emoji: "✂️" },
  { href: "/dashboard/car-wash", label: "คาร์แคร์", emoji: "🚿" },
  { href: "/dashboard/building-pos", label: "POS ร้านอาหาร", emoji: "🍽️" },
  { href: "/dashboard/parking", label: "ระบบเช่าที่จอดรถ", emoji: "📍" },
  { href: "/dashboard/chat", label: "แชท", emoji: "💬" },
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
