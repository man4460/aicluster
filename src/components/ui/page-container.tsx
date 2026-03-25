import { cn } from "@/lib/cn";

/** ใช้ sync กับ AuthPageFrame แนวนอน */
export const PAGE_GUTTER_X = "px-4 sm:px-6";
export const PAGE_GUTTER_Y = "py-6 sm:py-8";

type PageContainerProps = {
  children: React.ReactNode;
  className?: string;
  /** default max-w-6xl | narrow max-w-3xl | full ไม่จำกัดความกว้าง */
  size?: "default" | "narrow" | "full";
};

const sizeMax: Record<NonNullable<PageContainerProps["size"]>, string> = {
  default: "max-w-6xl",
  narrow: "max-w-3xl",
  full: "max-w-none",
};

/**
 * เทมเพลตความกว้าง + ระยะขอบหน้าแดชบอร์ด — ใช้ร่วมกันทุกหน้าใต้ /dashboard
 */
export function PageContainer({
  children,
  className,
  size = "default",
}: PageContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full",
        sizeMax[size],
        PAGE_GUTTER_X,
        PAGE_GUTTER_Y,
        className,
      )}
    >
      {children}
    </div>
  );
}

type PageHeaderProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  /** ลด margin ล่าง (เช่น หน้าแชทที่ต่อกล่องเต็มความสูง) */
  compact?: boolean;
};

/**
 * หัวข้อหน้ามาตราน (h1 + คำอธิบาย + ปุ่มด้านขวา)
 */
export function PageHeader({
  title,
  description,
  action,
  className,
  compact,
}: PageHeaderProps) {
  return (
    <header className={cn(!compact && "mb-6 sm:mb-8", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
          {description ? (
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </header>
  );
}
