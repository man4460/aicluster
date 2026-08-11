"use client";

import type { ButtonHTMLAttributes } from "react";

export function DormButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button suppressHydrationWarning {...props} />;
}
