import { NextResponse } from "next/server";
import { withMediaRegistryAuth } from "@/systems/media-registry/lib/api-context";
import { loadMediaRegistryDashboard } from "@/systems/media-registry/lib/server-dashboard";
import { MEDIA_REGISTRY_ISSUE_TYPE } from "@/systems/media-registry/lib/constants";

export async function GET() {
  const auth = await withMediaRegistryAuth();
  if (!auth.ok) return auth.res;
  const data = await loadMediaRegistryDashboard(auth.userId);
  return NextResponse.json({
    ...data,
    issueTypes: Object.values(MEDIA_REGISTRY_ISSUE_TYPE),
  });
}
