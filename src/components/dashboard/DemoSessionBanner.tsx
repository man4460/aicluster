/** แบนเนอร์เมื่อล็อกอินเป็นบัญชีทดลองสาธารณะ — ออกแล้วคืนเซสชันเดิมถ้ามี */
export function DemoSessionBanner() {
  return (
    <div className="mx-3 mb-0 mt-1 rounded-2xl border border-amber-300/90 bg-gradient-to-r from-amber-100 via-amber-50 to-orange-50 px-4 py-3 shadow-md shadow-amber-900/10 sm:mx-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-bold text-amber-950">บัญชีทดลองใช้งาน</p>
          <p className="mt-0.5 text-xs leading-snug text-amber-900/90">
            คุณกำลังดูระบบแบบตัวอย่างของผู้ให้บริการ — ข้อมูลอาจเป็นตัวอย่าง ไม่ใช่บัญชีลูกค้า
          </p>
        </div>
        <form action="/api/auth/demo/exit" method="POST" className="shrink-0">
          <button
            type="submit"
            className="w-full rounded-xl bg-amber-900 px-4 py-2.5 text-sm font-bold text-amber-50 shadow-md transition hover:bg-amber-950 sm:w-auto"
          >
            ออกจากบัญชีทดลอง
          </button>
        </form>
      </div>
    </div>
  );
}
