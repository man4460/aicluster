import { permanentRedirect } from "next/navigation";

type Props = {
  params: Promise<{ ownerId: string }>;
  searchParams: Promise<{ t?: string }>;
};

/** @deprecated ใช้ `/barber/[ownerId]` — คง redirect จากลิงก์เก่า `/m/...` */
export default async function BarberCustomerPortalLegacyRedirect({ params, searchParams }: Props) {
  const { ownerId } = await params;
  const sp = await searchParams;
  const q = sp.t?.trim() ? `?t=${encodeURIComponent(sp.t.trim())}` : "";
  permanentRedirect(`/barber/${ownerId}${q}`);
}
