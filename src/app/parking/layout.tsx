/**
 * ลิงก์สาธารณะจอดรถ — พอร์ทัลเว็บจองเต็มจอ (ไม่ห่อ max-w)
 * หน้าเช็คอิน QR กะทัดรัดห่อความกว้างเองใน client / page
 */
export default function ParkingPublicLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-[100dvh] w-full">{children}</div>;
}
