import Link from "next/link";

export default function ClubNotFound() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-3 px-4 py-16 text-center">
      <p className="text-lg font-black text-[#1e1b4b]">ไม่พบหน้าเว็บชมรม</p>
      <p className="text-sm text-[#66638c]">ลิงก์อาจผิด หรือชมรมปิดชั่วคราว</p>
      <Link href="/" className="text-sm font-semibold text-[#0000BF] underline">
        กลับหน้าแรก
      </Link>
    </div>
  );
}
