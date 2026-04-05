"use client";

export function BuildingPosShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-full space-y-4 sm:space-y-6">
      <header className="app-surface rounded-2xl px-4 py-4 sm:px-6 sm:py-5 print:hidden">
        <h1 className="text-xl font-semibold tracking-tight text-[#2e2a58] sm:text-2xl">POS ร้านอาหาร</h1>
        <p className="mt-1 max-w-2xl text-sm leading-snug text-[#66638c]">
          เมนู ออเดอร์ QR สั่งอาหาร — ใช้บัญชีเจ้าของ
        </p>
      </header>

      {children}
    </div>
  );
}
