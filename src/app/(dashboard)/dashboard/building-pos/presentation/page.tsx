import { redirect } from "next/navigation";
import { BUILDING_POS_PUBLIC_PRESENTATION_HREF } from "@/systems/building-pos/building-pos-nav";

/** เส้นทางเก่าในแดชบอร์ด → หน้าสาธารณะเต็มจอ */
export default function BuildingPosPresentationRedirectPage() {
  redirect(BUILDING_POS_PUBLIC_PRESENTATION_HREF);
}
