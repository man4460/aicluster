import { cn } from "@/lib/cn";

/** โค้งเทียบการ์ดแจ้งเตือน/การ์ดย่อย MAWELL (`rounded-[2rem]`) — ใช้ทุกที่ที่เรียก TrialSandboxStrip */
const stripRootClass =
  "flex min-h-8 w-full items-center gap-2 rounded-[1rem] border border-red-950/20 bg-red-600 px-3 py-1 text-white shadow-sm sm:min-h-9 sm:gap-3 sm:px-4 sm:py-1.5 print:hidden";

const textClass =
  "min-w-0 flex-1 truncate text-[11px] font-semibold leading-tight tracking-tight text-white sm:text-xs";

type TrialSandboxStripProps = {
  children: React.ReactNode;
  /** ปุ่มหรือฟอร์มทางขวา (เช่น ออกจากบัญชีทดลอง) */
  trailing?: React.ReactNode;
  className?: string;
};

/** แถบแจ้งโหมดทดลอง — บาง สีแดง ข้อความกระชับ */
export function TrialSandboxStrip({ children, trailing, className }: TrialSandboxStripProps) {
  return (
    <div role="status" className={cn(stripRootClass, className)}>
      <div className={textClass}>{children}</div>
      {trailing ? <div className="shrink-0">{trailing}</div> : null}
    </div>
  );
}
