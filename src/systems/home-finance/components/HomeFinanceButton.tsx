"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";

export const HomeFinanceButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(
  function HomeFinanceButton(props, ref) {
    return <button ref={ref} suppressHydrationWarning {...props} />;
  },
);
