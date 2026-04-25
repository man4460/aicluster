import { permanentRedirect } from "next/navigation";

/** URL สั้นเก่า (ไม่มีขีด) — 308 ไป canonical เพื่อ UX / SEO */
export default function ChataiLegacyPage() {
  permanentRedirect("/dashboard/chat-ai");
}
