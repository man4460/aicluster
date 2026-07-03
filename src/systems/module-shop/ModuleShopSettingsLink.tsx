import Link from "next/link";
import { appTemplateOutlineButtonClass } from "@/components/app-templates";
import { cn } from "@/lib/cn";

export function ModuleShopSettingsLink({
  href,
  className,
  label = "ตั้งค่าร้าน",
}: {
  href: string;
  className?: string;
  label?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        appTemplateOutlineButtonClass,
        "inline-flex min-h-[40px] items-center rounded-xl px-4 text-sm font-bold",
        className,
      )}
    >
      {label}
    </Link>
  );
}
