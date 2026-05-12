import { permanentRedirect } from "next/navigation";

/** เดิมใช้ /landing — หน้าแรกย้ายไป `/` แล้ว */
export default function LandingLegacyRedirect() {
  permanentRedirect("/");
}
