import { cn } from "@/lib/cn";

type AppCardProps = {
  children: React.ReactNode;
  className?: string;
  /** default: p-5 sm:p-6 */
  padding?: "default" | "compact" | "none";
};

export function AppCard({ children, className, padding = "default" }: AppCardProps) {
  const pad =
    padding === "default" ? "p-5 sm:p-6" : padding === "compact" ? "p-4" : "";
  return (
    <div
      className={cn(
        "app-surface rounded-2xl",
        pad,
        className,
      )}
    >
      {children}
    </div>
  );
}

type AppCardHeaderProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

export function AppCardHeader({ title, description, action, className }: AppCardHeaderProps) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-3", className)}>
      <div className="min-w-0">
        <h2 className="text-lg font-semibold tracking-tight text-[#2e2a58]">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm leading-relaxed text-[#5f5a8a]">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

type AppCardFooterProps = {
  children: React.ReactNode;
  className?: string;
};

export function AppCardFooter({ children, className }: AppCardFooterProps) {
  return (
    <div
      className={cn(
        "mt-4 flex flex-wrap items-center gap-2 border-t border-[#ecebff] pt-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

type DataRowProps = {
  label: string;
  children: React.ReactNode;
  className?: string;
};

/** แถว label / ค่า สำหรับการ์ดมือถือ */
export function DataRow({ label, children, className }: DataRowProps) {
  return (
    <div className={cn("flex items-start justify-between gap-3 py-1.5", className)}>
      <span className="shrink-0 text-xs font-medium text-[#66638c]">{label}</span>
      <div className="min-w-0 text-right text-sm text-[#2d2955]">{children}</div>
    </div>
  );
}
