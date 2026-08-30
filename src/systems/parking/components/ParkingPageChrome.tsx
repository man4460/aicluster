import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { parkingPanelCardClass } from "@/systems/parking/parking-ui-tokens";

export function ParkingPageStack({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("space-y-4 sm:space-y-6", className)}>{children}</div>;
}

/** การ์ดเนื้อหาหลัก — glass แบบคาร์แคร์ */
export function ParkingPanelCard({
  title,
  description,
  action,
  children,
  className,
  headerClassName,
}: {
  title?: string;
  description?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
  headerClassName?: string;
}) {
  const hasHead = Boolean(title || description || action);
  const hasBody = children != null && children !== false;
  return (
    <section className={cn(parkingPanelCardClass, "flex flex-col", hasBody && "gap-4", className)}>
      {hasHead ? (
        <div
          className={cn(
            "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
            hasBody && "border-b border-white/50 pb-4",
            headerClassName,
          )}
        >
          <div className="min-w-0">
            {title ? <h2 className="text-base font-black tracking-tight text-[#1e1b4b] sm:text-lg">{title}</h2> : null}
            {description ? <div className="mt-0.5 text-xs leading-relaxed text-[#66638c]">{description}</div> : null}
          </div>
          {action ? <div className="shrink-0 self-start pt-0.5 sm:pt-0">{action}</div> : null}
        </div>
      ) : null}
      {hasBody ? children : null}
    </section>
  );
}
