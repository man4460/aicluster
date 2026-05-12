import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminHubChrome } from "@/components/admin/AdminHubChrome";
import { getSession } from "@/lib/auth/session";
import { cn } from "@/lib/cn";

export const metadata: Metadata = {
  title: "ศูนย์แอดมิน | MAWELL Buffet",
};

export default async function AdminSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/dashboard");

  return (
    <div
      className={cn(
        "max-w-full space-y-4 sm:space-y-6",
        /* ช่องว่างให้ dock มือถือ (2 แถว) ไม่บังเนื้อหา — เทียบคาร์แคร์ */
        "pb-[calc(8.5rem+env(safe-area-inset-bottom,0px))] md:pb-0",
      )}
    >
      <AdminHubChrome />
      <div className="app-surface rounded-[1.75rem] px-4 py-4 sm:rounded-[2.5rem] sm:px-6 sm:py-6">{children}</div>
    </div>
  );
}
