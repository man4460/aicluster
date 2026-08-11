"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";

export const ActivityLogsButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(
  function ActivityLogsButton(props, ref) {
    return <button ref={ref} suppressHydrationWarning {...props} />;
  },
);
