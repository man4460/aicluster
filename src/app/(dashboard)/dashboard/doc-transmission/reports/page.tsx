import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { DocReportsClient } from "@/systems/doc-transmission/components/DocReportsClient";

export const dynamic = "force-dynamic";

export default async function DocReportsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  return <DocReportsClient />;
}
