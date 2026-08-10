import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  isDemoAccountConfiguredForEntry,
  isPublicDemoEntryFlagOn,
} from "@/lib/auth/demo-account";
import { getSession } from "@/lib/auth/session";
import { getServerAppBaseUrl } from "@/lib/url/server-app-base-url";
import { ModuleTryLinksAdmin } from "@/systems/admin/components/ModuleTryLinksAdmin";

export const metadata: Metadata = {
  title: "ลิงก์ทดลองโมดูล | MAWELL PLATFORM",
};

export default async function AdminModuleTryLinksPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/dashboard");

  const appBaseUrl = await getServerAppBaseUrl();
  const demoReady = isPublicDemoEntryFlagOn() && isDemoAccountConfiguredForEntry();

  return <ModuleTryLinksAdmin appBaseUrl={appBaseUrl} demoReady={demoReady} />;
}
