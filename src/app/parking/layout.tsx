export default function ParkingPublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200/80 px-4 py-10">
      <div className="mx-auto w-full max-w-lg">{children}</div>
      <p className="mx-auto mt-8 max-w-lg text-center text-[10px] text-slate-400">
        หากสแกนแล้วไม่สำเร็จ แจ้งพนักงานลานจอด
      </p>
    </div>
  );
}
