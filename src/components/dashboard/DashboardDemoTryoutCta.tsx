import {
  isDemoAccountConfiguredForEntry,
  isDemoSessionUsername,
  isPublicDemoEntryFlagOn,
} from "@/lib/auth/demo-account";

/**
 * ปุ่มเข้าบัญชีทดลองบนแดชบอร์ด — แสดงเฉพาะเมื่อเปิด NEXT_PUBLIC_DEMO_ENTRY และตั้ง DEMO_ACCOUNT_* แล้ว และผู้ใช้ไม่ได้เป็นบัญชีทดลองอยู่
 */
export function DashboardDemoTryoutCta({ username }: { username: string }) {
  if (!isPublicDemoEntryFlagOn() || !isDemoAccountConfiguredForEntry()) return null;
  if (isDemoSessionUsername(username)) return null;

  return (
    <div className="w-full overflow-hidden rounded-2xl border-2 border-[#0000BF]/25 bg-gradient-to-br from-[#0000BF] via-[#4338ca] to-indigo-600 p-px shadow-md shadow-indigo-900/15">
      <div className="rounded-[0.9rem] bg-white px-3 py-3 sm:px-4">
        <p className="text-center text-[10px] font-semibold uppercase tracking-wide text-[#0000BF]">
          ลองก่อนตัดสินใจ
        </p>
        <form action="/api/auth/demo/enter" method="POST" className="mt-2">
          <input type="hidden" name="next" value="/dashboard" />
          <button
            type="submit"
            className="w-full rounded-xl bg-gradient-to-r from-[#0000BF] to-indigo-600 py-2.5 text-sm font-bold text-white shadow-md transition hover:from-[#0000a3] hover:to-indigo-700 active:scale-[0.99]"
          >
            ทดลองใช้งานระบบจริง
          </button>
        </form>
        <p className="mt-1.5 text-center text-[10px] leading-snug text-slate-600">
          จะสลับเป็นบัญชีตัวอย่างชั่วคราว · ออกได้จากแบนเนอร์ด้านบน
        </p>
      </div>
    </div>
  );
}
