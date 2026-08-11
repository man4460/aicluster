"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";

export const EducareButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(
  function EducareButton(props, ref) {
    return <button ref={ref} suppressHydrationWarning {...props} />;
  },
);
