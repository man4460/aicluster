"use client";

import type { ButtonHTMLAttributes } from "react";

export function VaultButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button suppressHydrationWarning {...props} />;
}
