import { cn } from "@/lib/cn";
import { PAGE_GUTTER_X } from "@/components/ui/page-container";

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
    <div className="mawell-card-surface mx-auto w-full max-w-md rounded-3xl p-6 shadow-lg sm:p-8">
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
    <div
      className={cn(
        "flex min-h-screen flex-col items-center justify-center bg-transparent py-10",
        PAGE_GUTTER_X,
      )}
    >
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
