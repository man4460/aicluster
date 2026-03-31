import { headers } from "next/headers";
import { VillageSlipsClient } from "@/systems/village/components/VillageSlipsClient";

async function requestBaseUrl(): Promise<string> {
  const env = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (env && (env.startsWith("http://") || env.startsWith("https://"))) return env;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return "";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export default async function VillageSlipsPage() {
  const baseUrl = await requestBaseUrl();
  return <VillageSlipsClient baseUrl={baseUrl} />;
}
