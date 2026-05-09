/** แสดงเมื่อโหลดข้อมูลจากเซิร์ฟเวอร์ล้มเหลว (เช่น DB ไม่ตอบ) — ใช้ร่วมในเลย์เอาต์แดชบอร์ด */
export function DashboardDataLoadError({ message }: { message: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 bg-gradient-to-b from-slate-50 to-white p-8 text-center">
      <p className="max-w-md text-sm font-medium text-amber-950">{message}</p>
      <p className="max-w-lg text-xs leading-relaxed text-slate-600">
        ตรวจสอบว่า MySQL ทำงานและค่า <code className="rounded bg-slate-100 px-1">DATABASE_URL</code> ใน{" "}
        <code className="rounded bg-slate-100 px-1">.env</code> ถูกต้อง จากนั้นรัน{" "}
        <code className="rounded bg-slate-100 px-1">npx prisma migrate deploy</code> ให้ครบ แล้วรีสตาร์ทเซิร์ฟเวอร์
        Next — บ่อยครั้งสาเหตุคือตารางจาก migration ยังไม่ถูกสร้างหรือมี migration ค้างที่ล้มค้างไว้
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <a
          href="/dashboard"
          className="rounded-xl bg-[#0000BF] px-4 py-2 text-sm font-semibold text-white hover:bg-[#000098]"
        >
          ลองกลับแดชบอร์ด
        </a>
        <a
          href="/login"
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
        >
          เข้าสู่ระบบใหม่
        </a>
      </div>
    </div>
  );
}
