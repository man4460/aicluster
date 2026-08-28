import { redirect } from "next/navigation";
import { DRINK_POS_SETTINGS_LINK_HREF } from "@/systems/drink-pos/lib/drink-pos-module-nav";

export default function DrinkPosMembersPage() {
  redirect(DRINK_POS_SETTINGS_LINK_HREF);
}
