import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

/** แผนผังระบบถูกถอดออกแล้ว — redirect ไปแดชบอร์ด */
export default async function SystemsExplorePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  redirect("/dashboard");
}
