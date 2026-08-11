"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";

export const AssetButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(
  function AssetButton(props, ref) {
    return <button ref={ref} suppressHydrationWarning {...props} />;
  },
);
