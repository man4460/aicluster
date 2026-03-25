"use client";

export function PrintButton({ label = "พิมพ์ใบเสร็จ" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-lg bg-[#0000BF] px-4 py-2 text-sm font-medium text-white hover:bg-[#0000a6]"
    >
      {label}
    </button>
  );
}
