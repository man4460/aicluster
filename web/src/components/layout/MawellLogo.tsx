import { cn } from "@/lib/cn";

type Props = {
  className?: string;
  /** ขนาดตัวอักษรหลัก */
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: "text-xs leading-snug sm:text-sm md:text-base",
  md: "text-sm leading-snug sm:text-base md:text-lg lg:text-xl",
  lg: "text-base leading-snug sm:text-lg md:text-xl lg:text-2xl",
} as const;

export function MawellLogo({ className, size = "md" }: Props) {
  return (
    <div className={cn("inline-flex max-w-full flex-col", className)}>
      <div
        className={cn("leading-tight tracking-tight text-[#0000FF]", sizeClasses[size])}
        aria-label="MAWELL"
      >
        <span className="font-extrabold">
          M<span className="text-[#FF0000]">A</span>WELL
        </span>
      </div>
    </div>
  );
}
