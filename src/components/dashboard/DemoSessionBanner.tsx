/** แบนเนอร์เมื่อล็อกอินเป็นบัญชีทดลองสาธารณะ — ออกแล้วคืนเซสชันเดิมถ้ามี */
export function DemoSessionBanner() {
  return (
    <div className="fixed inset-x-3 bottom-[5.25rem] z-50 overflow-hidden rounded-[1.25rem] border border-white/60 bg-gradient-to-r from-amber-100/60 via-white/50 to-orange-100/55 px-4 py-3 shadow-[0_20px_46px_-24px_rgba(146,64,14,0.45)] backdrop-blur-xl ring-1 ring-inset ring-white/65 md:inset-x-auto md:bottom-4 md:right-4 md:w-[30rem] md:max-w-[calc(100vw-2rem)]">
      <span
        aria-hidden
        className="pointer-events-none absolute -left-10 -top-10 h-20 w-20 rotate-45 border-r border-white/70 border-b border-white/70 opacity-80"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-10 -right-10 h-20 w-20 rotate-45 border-l border-amber-200/70 border-t border-amber-200/70 opacity-80"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute right-14 top-0 h-12 w-px rotate-[35deg] bg-white/70"
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-black text-amber-950">บัญชีทดลองใช้งาน</p>
          <p className="mt-0.5 text-xs leading-snug text-amber-950/80">
            คุณกำลังดูระบบแบบตัวอย่างของผู้ให้บริการ — ข้อมูลอาจเป็นตัวอย่าง ไม่ใช่บัญชีลูกค้า
          </p>
        </div>
        <form action="/api/auth/demo/exit" method="POST" className="shrink-0">
          <button
            type="submit"
            suppressHydrationWarning
            className="w-full rounded-xl border border-white/70 bg-white/60 px-4 py-2.5 text-sm font-bold text-amber-900 shadow-sm backdrop-blur-md transition hover:bg-white/80 sm:w-auto"
          >
            ออกจากบัญชีทดลอง
          </button>
        </form>
      </div>
    </div>
  );
}
