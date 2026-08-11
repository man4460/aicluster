"use client";

import type { ButtonHTMLAttributes } from "react";

export function LoyaltyStampButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button suppressHydrationWarning {...props} />;
}
