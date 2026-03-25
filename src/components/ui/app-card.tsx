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
        "rounded-2xl border border-slate-200/80 bg-white shadow-sm",
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
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm leading-relaxed text-slate-500">{description}</p>
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
        "mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4",
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
      <span className="shrink-0 text-xs font-medium text-slate-500">{label}</span>
      <div className="min-w-0 text-right text-sm text-slate-900">{children}</div>
    </div>
  );
}
