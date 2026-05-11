"use client";

import { cn } from "@/lib/cn";
import { findVaultBrandPreset } from "@/systems/vault/lib/brand-presets";

/** วงกลม avatar สำหรับการ์ดบัญชี — ใช้สีและตัวอักษรจาก brand preset */
export function VaultBrandAvatar({
  brandKey,
  serviceName,
  size = "md",
  className,
}: {
  brandKey: string | null | undefined;
  serviceName?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const preset = findVaultBrandPreset(brandKey);
  const initial = preset.initial || serviceName?.trim().slice(0, 2).toUpperCase() || "•";
  const dimension =
    size === "lg" ? "h-14 w-14 text-lg" : size === "sm" ? "h-9 w-9 text-xs" : "h-11 w-11 text-sm";

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-2xl font-black tracking-tight shadow-md ring-1 ring-white/40",
        dimension,
        className,
      )}
      style={{
        backgroundColor: preset.color,
        color: preset.textColor ?? "#ffffff",
      }}
      aria-hidden
    >
      <span className="leading-none">{initial}</span>
    </div>
  );
}
