"use client";

import type { ButtonHTMLAttributes } from "react";

export function HotelResortButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button suppressHydrationWarning {...props} />;
}
