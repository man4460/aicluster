import { redirect } from "next/navigation";

/** @deprecated ย้ายไป /dashboard/parking/finance */
export default async function ParkingHistoryRedirectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (typeof v === "string" && v) q.set(k, v);
    else if (Array.isArray(v) && v[0]) q.set(k, v[0]);
  }
  const qs = q.toString();
  redirect(qs ? `/dashboard/parking/finance?${qs}` : "/dashboard/parking/finance");
}
