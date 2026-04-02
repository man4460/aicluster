"use client";

import { useState } from "react";
import { parkingBtnSecondary } from "@/systems/parking/parking-ui";

export function ParkingCopyUrlButton({ url, label = "คัดลอกลิงก์เช็คอิน" }: { url: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={parkingBtnSecondary}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setDone(true);
          window.setTimeout(() => setDone(false), 2000);
        } catch {
          window.prompt("คัดลอกลิงก์:", url);
        }
      }}
    >
      {done ? "คัดลอกแล้ว" : label}
    </button>
  );
}
