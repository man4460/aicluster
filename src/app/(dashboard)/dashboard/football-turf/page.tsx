import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/lib/auth/session";
import { getFootballTurfDataScope } from "@/lib/trial/module-scopes";
import { FootballTurfDashboard } from "@/systems/football-turf/FootballTurfDashboard";

export const metadata: Metadata = {
  title: "สนามฟุตบอล | MAWELL",
};

export default async function FootballTurfDashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const scope = await getFootballTurfDataScope(session.sub);
  return (
    <FootballTurfDashboard
      ownerUserId={session.sub}
      trialSessionId={scope.trialSessionId}
    />
  );
}
