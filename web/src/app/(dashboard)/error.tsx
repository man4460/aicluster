"use client";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-red-200 bg-red-50/90 p-8 text-center">
      <h1 className="text-lg font-semibold text-red-900">แดชบอร์ดเกิดข้อผิดพลาด</h1>
      <p className="mt-2 break-all text-left text-xs text-red-800/90">{error.message}</p>
      <p className="mt-4 text-sm text-red-800/80">
        ถ้าข้อความเกี่ยวกับคอลัมน์ใน MySQL ให้รัน migration ล่าสุดหรือสคริปต์{" "}
        <code className="rounded bg-white px-1">prisma/repair-user-columns.sql</code>
      </p>
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
