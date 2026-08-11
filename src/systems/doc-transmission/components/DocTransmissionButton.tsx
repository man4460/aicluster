"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";

export const DocTransmissionButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(
  function DocTransmissionButton(props, ref) {
    return <button ref={ref} suppressHydrationWarning {...props} />;
  },
);
