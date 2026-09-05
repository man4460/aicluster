"use client";

import { cn } from "@/lib/cn";
import {
  ecommerceStoreFieldClass,
} from "@/systems/ecommerce-store/lib/ui-tokens";

type Props = {
  contactLine: string;
  facebookUrl: string;
  mapUrl: string;
  onContactLineChange: (value: string) => void;
  onFacebookUrlChange: (url: string) => void;
  onMapUrlChange: (url: string) => void;
  disabled?: boolean;
};

const fieldClass = cn(ecommerceStoreFieldClass, "mt-1");
const labelClass = "block space-y-1 text-xs font-bold text-[#4d47b6]";

/** สื่อติดต่อพอร์ทัล — LINE · Facebook · แผนที่ (แม่แบบซักผ้า) */
export function EcommercePortalMediaSettings({
  contactLine,
  facebookUrl,
  mapUrl,
  onContactLineChange,
  onFacebookUrlChange,
  onMapUrlChange,
  disabled = false,
}: Props) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-bold text-[#4d47b6]">ช่องทางติดต่อบนเว็บร้าน</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={labelClass}>
          LINE ID
          <input
            className={fieldClass}
            value={contactLine}
            onChange={(e) => onContactLineChange(e.target.value)}
            placeholder="@lineid"
            disabled={disabled}
          />
        </label>
        <label className={labelClass}>
          Facebook URL
          <input
            className={fieldClass}
            value={facebookUrl}
            onChange={(e) => onFacebookUrlChange(e.target.value)}
            placeholder="https://facebook.com/…"
            disabled={disabled}
          />
        </label>
        <label className={cn(labelClass, "sm:col-span-2")}>
          ลิงก์แผนที่
          <input
            className={fieldClass}
            value={mapUrl}
            onChange={(e) => onMapUrlChange(e.target.value)}
            placeholder="https://maps.google.com/…"
            disabled={disabled}
          />
        </label>
      </div>
    </div>
  );
}
