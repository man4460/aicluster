import { cn } from "@/lib/cn";

export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-6 text-center">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">{title}</h1>
        {subtitle ? <p className="mt-2 text-sm text-slate-600">{subtitle}</p> : null}
      </div>
      {children}
    </div>
  );
}

export function AuthPageFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f8fafc] px-4 py-10">
      {children}
    </div>
  );
}

export function AuthFooterLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      className={cn("text-sm font-medium text-[#0000BF] hover:underline", className)}
    >
      {children}
    </a>
  );
}
