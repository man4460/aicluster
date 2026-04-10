"use client";

import nextDynamic from "next/dynamic";

const LoginForm = nextDynamic(
  () => import("@/components/auth/LoginForm").then((m) => ({ default: m.LoginForm })),
  {
    ssr: false,
    loading: () => (
      <div
        className="mawell-card-surface mx-auto w-full max-w-md animate-pulse rounded-3xl p-6 shadow-lg sm:p-8"
        aria-hidden
      >
        <div className="mb-6 h-7 w-40 rounded bg-slate-200/80" />
        <div className="mb-4 h-11 w-full rounded-lg bg-slate-100" />
        <div className="mb-4 h-11 w-full rounded-lg bg-slate-100" />
        <div className="mb-4 h-14 w-full rounded-lg bg-slate-100" />
        <div className="h-11 w-full rounded-lg bg-[#0000BF]/30" />
      </div>
    ),
  },
);

export function LoginFormClient({
  redirectTo,
  initialErrorKey,
  googleOAuthEnabled,
}: {
  redirectTo: string;
  initialErrorKey?: string;
  googleOAuthEnabled: boolean;
}) {
  return (
    <LoginForm
      redirectTo={redirectTo}
      initialErrorKey={initialErrorKey}
      googleOAuthEnabled={googleOAuthEnabled}
    />
  );
}
