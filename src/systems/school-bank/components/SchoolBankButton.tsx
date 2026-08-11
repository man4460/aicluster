"use client";

import type { ButtonHTMLAttributes } from "react";

export function SchoolBankButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button suppressHydrationWarning {...props} />;
}
