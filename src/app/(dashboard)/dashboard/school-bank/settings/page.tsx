import type { Metadata } from "next";
import { SchoolBankSettingsClient } from "@/systems/school-bank/components/SchoolBankSettingsClient";
import { requireSchoolBankPage } from "@/systems/school-bank/lib/school-bank-page-auth";

export const metadata: Metadata = {
  title: "ตั้งค่า | ธนาคารโรงเรียน",
};

export default async function SchoolBankSettingsPage() {
  const { settings } = await requireSchoolBankPage();
  return <SchoolBankSettingsClient initialName={settings.displayName} />;
}
