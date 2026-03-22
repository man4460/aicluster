import { cn } from "@/lib/cn";

type Props = {
  className?: string;
  /** ขนาดตัวอักษรหลัก */
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: "text-[10px] leading-snug sm:text-xs md:text-sm",
  md: "text-[11px] leading-snug sm:text-xs md:text-sm lg:text-base",
  lg: "text-xs leading-snug sm:text-sm md:text-lg lg:text-xl",
} as const;

export function MawellLogo({ className, size = "md" }: Props) {
  return (
    <div className={cn("inline-flex max-w-full flex-col", className)}>
      <div
        className={cn(
          "text-balance leading-tight tracking-tight text-[#0000FF]",
          sizeClasses[size],
        )}
        aria-label="MAWELL Buffet Management System"
      >
        <span className="font-extrabold">
          M<span className="text-[#FF0000]">A</span>WELL
        </span>
        <span className="font-semibold"> Buffet Management System</span>
      </div>
    </div>
  );
}
