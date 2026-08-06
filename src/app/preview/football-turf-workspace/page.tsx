import type { Metadata } from "next";
import { FootballTurfWorkspaceDraftPreview } from "@/systems/football-turf/FootballTurfDashboard";

export const metadata: Metadata = {
  title: "Draft UI · สนามฟุตบอล | MAWELL",
};

export default function FootballTurfWorkspacePreviewPage() {
  return <FootballTurfWorkspaceDraftPreview />;
}
