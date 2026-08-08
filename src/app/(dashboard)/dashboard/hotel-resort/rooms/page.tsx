import { HotelResortRoomsClient } from "@/systems/hotel-resort/HotelResortRoomsClient";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function HotelResortRoomsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  return <HotelResortRoomsClient />;
}
