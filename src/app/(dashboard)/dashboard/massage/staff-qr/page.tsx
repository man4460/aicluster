import { redirect } from "next/navigation";

export default function MassageStaffQrRedirectPage() {
  redirect("/dashboard/massage/settings?tab=link");
}
