"use client";

import type { ButtonHTMLAttributes } from "react";

export function WaitQueueButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button suppressHydrationWarning {...props} />;
}
