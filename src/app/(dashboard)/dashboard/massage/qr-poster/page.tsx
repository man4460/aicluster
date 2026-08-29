import { redirect } from "next/navigation";

export default function MassageQrPosterRedirectPage() {
  redirect("/dashboard/massage/settings?tab=link");
}
