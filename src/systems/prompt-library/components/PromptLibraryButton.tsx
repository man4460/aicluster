"use client";

import type { ButtonHTMLAttributes } from "react";

export function PromptLibraryButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button suppressHydrationWarning {...props} />;
}
