import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminHubChrome } from "@/components/admin/AdminHubChrome";
import { getSession } from "@/lib/auth/session";

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
    <div className="max-w-full space-y-4 sm:space-y-6">
      <AdminHubChrome />
      <div className="app-surface rounded-2xl px-4 py-4 sm:px-6 sm:py-5">{children}</div>
    </div>
  );
}
