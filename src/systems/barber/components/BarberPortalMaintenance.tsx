import { AppPublicCheckInGlassPage, appPublicCheckInGlassCardClass } from "@/components/app-templates";

export function BarberPortalMaintenance() {
  return (
    <AppPublicCheckInGlassPage>
      <div className="relative mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center text-center">
        <div className={appPublicCheckInGlassCardClass}>
          <div className="px-6 py-8 sm:px-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[1.25rem] border border-white/70 bg-gradient-to-br from-white/80 to-violet-100/60 text-[#5b61ff] shadow-[0_8px_24px_-8px_rgba(91,97,255,0.35)] backdrop-blur-xl ring-1 ring-inset ring-white/70">
              <svg
                viewBox="0 0 24 24"
                className="h-7 w-7"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            </div>
            <h1 className="mt-5 text-xl font-black tracking-tight text-[#1e1b4b]">ปิดให้บริการชั่วคราว</h1>
            <p className="mt-2 text-sm leading-relaxed text-[#6b6894]">
              ระบบสมาชิกหน้าร้านปิดชั่วคราว — บริการเจ้าของร้านอาจหมดสิทธิ์หรือโทเคน
            </p>
            <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#9490c0]">MAWELL · Customer QR Portal</p>
          </div>
        </div>
      </div>
    </AppPublicCheckInGlassPage>
  );
}
