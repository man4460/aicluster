import { redirect } from "next/navigation";
import { DORMITORY_SETTINGS_HREF } from "@/systems/dormitory/dormitory-module-nav";

/** @deprecated ใช้ /dashboard/dormitory/settings?tab=links */
export default function DormitoryGuestPortalPage() {
  redirect(`${DORMITORY_SETTINGS_HREF}?tab=links`);
}
