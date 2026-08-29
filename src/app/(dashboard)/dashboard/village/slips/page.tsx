import { redirect } from "next/navigation";

export default function VillageSlipsPage() {
  redirect("/dashboard/village/fees?tab=slips");
}
