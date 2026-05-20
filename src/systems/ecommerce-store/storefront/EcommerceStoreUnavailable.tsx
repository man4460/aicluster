import Link from "next/link";

export function EcommerceStoreUnavailable({
  storeName,
  reason,
}: {
  storeName?: string;
  reason: "paused" | "unavailable" | "not_found";
}) {
  const title =
    reason === "not_found"
      ? "ไม่พบร้านค้า"
      : reason === "paused"
        ? "ร้านปิดชั่วคราว"
        : "ร้านปิดชั่วคราว";
  const detail =
    reason === "unavailable"
      ? "เจ้าของร้านต้องเติมโทเคนหรือสมัครใช้งาน MAWELL ก่อนเปิดหน้าร้องอีกครั้ง"
      : reason === "paused"
        ? "เจ้าของร้านหยุดรับออเดอร์ชั่วคราว"
        : "ลิงก์ร้านอาจไม่ถูกต้อง";

  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center px-6 text-center">
      <div className="app-surface max-w-md rounded-[2rem] px-8 py-10">
        <p className="text-xs font-bold uppercase tracking-wider text-[#8b87b8]">MAWELL Shop</p>
        <h1 className="mt-2 font-black text-2xl tracking-tight text-[#1e1b4b]">{title}</h1>
        {storeName ? <p className="mt-1 text-sm font-semibold text-[#4d47b6]">{storeName}</p> : null}
        <p className="mt-4 text-sm text-[#66638c]">{detail}</p>
        <Link
          href="/"
          className="app-btn-primary mt-6 inline-flex min-h-[44px] items-center justify-center rounded-2xl px-6 text-sm font-bold"
        >
          กลับหน้าหลัก MAWELL
        </Link>
      </div>
    </div>
  );
}
