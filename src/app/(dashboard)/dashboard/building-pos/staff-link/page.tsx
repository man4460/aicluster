import { redirect } from "next/navigation";

export const metadata = {
  title: "ลิงก์พนักงานเสิร์ฟ | POS ร้านอาหาร",
};

export default function BuildingPosStaffLinkPage() {
  redirect("/dashboard/building-pos?tab=qr&qr=staff");
}
