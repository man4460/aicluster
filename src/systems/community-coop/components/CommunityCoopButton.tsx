"use client";

import type { ButtonHTMLAttributes } from "react";

export function CommunityCoopButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button suppressHydrationWarning {...props} />;
}
