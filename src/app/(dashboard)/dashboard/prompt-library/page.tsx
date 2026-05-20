import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { ensureDefaultPromptCategories } from "@/systems/prompt-library/lib/defaults";
import { PromptLibraryHomeClient } from "@/systems/prompt-library/components/PromptLibraryHomeClient";

export const dynamic = "force-dynamic";

export default async function PromptLibraryHomePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  await ensureDefaultPromptCategories(session.sub);

  return <PromptLibraryHomeClient />;
}
