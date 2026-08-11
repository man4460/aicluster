"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";

export const AttendanceButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(
  function AttendanceButton(props, ref) {
    return <button ref={ref} suppressHydrationWarning {...props} />;
  },
);
