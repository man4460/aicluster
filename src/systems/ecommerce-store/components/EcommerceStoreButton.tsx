"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";

export const EcommerceStoreButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(
  function EcommerceStoreButton(props, ref) {
    return <button ref={ref} suppressHydrationWarning {...props} />;
  },
);
