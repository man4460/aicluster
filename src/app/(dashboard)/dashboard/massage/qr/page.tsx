import { redirect } from "next/navigation";

/** ย้ายไปตั้งค่า → ลิงก์ QR */
export default function MassageQrHubPage() {
  redirect("/dashboard/massage/settings?tab=link");
}
