"use client";

function isLikelyDatabaseError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("mysql") ||
    m.includes("prisma") ||
    m.includes("database") ||
    /\bP[0-9]{4}\b/.test(message)
  );
}

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const rawMessage = error.message ?? "";
  const showDbHint = isLikelyDatabaseError(rawMessage);
  const isDev = process.env.NODE_ENV === "development";

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-red-200 bg-red-50/90 p-8 text-center">
      <h1 className="text-lg font-semibold text-red-900">แดชบอร์ดเกิดข้อผิดพลาด</h1>

      {isDev ? (
        <p className="mt-2 break-words text-left text-xs font-mono leading-relaxed text-red-800/90">{rawMessage}</p>
      ) : (
        <p className="mt-2 text-left text-sm leading-relaxed text-red-800/85">
          เกิดข้อผิดพลาดชั่วคราว — ลองกด &quot;ลองใหม่&quot; หรือรีเฟรชหน้า
          {error.digest ? (
            <span className="mt-1 block text-xs text-red-800/70">รหัสอ้างอิง: {error.digest}</span>
          ) : null}
        </p>
      )}

      {showDbHint ? (
        <p className="mt-4 text-left text-sm text-red-800/80">
          ถ้าข้อความเกี่ยวกับคอลัมน์หรือ schema ของฐานข้อมูล ให้รัน migration ล่าสุดหรือสคริปต์{" "}
          <code className="rounded bg-white px-1">prisma/repair-user-columns.sql</code>
        </p>
      ) : (
        <p className="mt-4 text-left text-sm text-red-800/75">
          ถ้าเป็นปัญหาเครือข่ายหรือบริการภายนอก ลองใหม่ภายหลัง — หากยังเกิดซ้ำให้ติดต่อผู้ดูแลระบบ
        </p>
      )}

      <button
        type="button"
        onClick={() => reset()}
        className="mt-6 rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800"
      >
        ลองใหม่
      </button>
    </div>
  );
}
