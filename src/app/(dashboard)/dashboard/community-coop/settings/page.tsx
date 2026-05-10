import type { Metadata } from "next";
import { CommunityCoopSettingsClient } from "@/systems/community-coop/components/CommunityCoopSettingsClient";
import { requireCommunityCoopPage } from "@/systems/community-coop/lib/community-coop-page-auth";

export const metadata: Metadata = {
  title: "ตั้งค่า | สหกรณ์ชุมชน",
};

export default async function CommunityCoopSettingsPage() {
  const { settings } = await requireCommunityCoopPage();
  return <CommunityCoopSettingsClient initialName={settings.displayName} />;
}
