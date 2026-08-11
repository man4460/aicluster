"use client";

import type { ButtonHTMLAttributes } from "react";

export function AppointmentQueueButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button suppressHydrationWarning {...props} />;
}
