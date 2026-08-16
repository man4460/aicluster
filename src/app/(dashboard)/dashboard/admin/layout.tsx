import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminHubChrome } from "@/components/admin/AdminHubChrome";
import { getSession } from "@/lib/auth/session";
import { cn } from "@/lib/cn";

export const metadata: Metadata = {
  title: "ศูนย์แอดมิน | MAWELL PLATFORM",
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
        /* dock แถวเดียวเลื่อนได้ — เว้นที่แบบโมดูลสนามฟุตบอล */
        "pb-24 lg:pb-0",
      )}
    >
      <AdminHubChrome />
      <div className="app-surface rounded-[1.75rem] px-3 py-3 sm:rounded-[2.5rem] sm:px-6 sm:py-6">
        {children}
      </div>
    </div>
  );
}
