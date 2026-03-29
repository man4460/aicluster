export function BarberPortalMaintenance() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-slate-100 px-6 py-16 text-center">
      <div className="max-w-sm rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-200 text-2xl">
          ⏸
        </div>
        <h1 className="mt-5 text-lg font-bold text-slate-900">Closed for Maintenance</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          ระบบสมาชิกหน้าร้านปิดชั่วคราว — บริการเจ้าของร้านอาจหมดสิทธิ์หรือโทเคน
        </p>
        <p className="mt-4 text-xs text-slate-400">MAWELL · Customer QR Portal</p>
      </div>
    </div>
  );
}
