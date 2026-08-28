import { redirect } from "next/navigation";
import { HOTEL_RESORT_SETTINGS_LINK_HREF } from "@/systems/hotel-resort/hotel-resort-module-nav";

export default function HotelResortGuestPortalPage() {
  redirect(HOTEL_RESORT_SETTINGS_LINK_HREF);
}
