import { redirect } from "next/navigation";

export default function MassageCheckInPage() {
  redirect("/dashboard/massage?tab=checkin");
}
