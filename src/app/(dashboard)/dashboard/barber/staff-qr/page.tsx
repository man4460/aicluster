import { redirect } from "next/navigation";
import { BARBER_SETTINGS_LINK_HREF } from "@/systems/barber/barber-module-nav";

export default function BarberStaffQrPage() {
  redirect(BARBER_SETTINGS_LINK_HREF);
}
