import { redirect } from "next/navigation";

export default function DormitoryCostsPage() {
  redirect("/dashboard/dormitory/finance?panel=expenses");
}
