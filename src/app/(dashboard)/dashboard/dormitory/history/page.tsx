import { redirect } from "next/navigation";

export default function DormitoryHistoryPage() {
  redirect("/dashboard/dormitory/finance?panel=history");
}
