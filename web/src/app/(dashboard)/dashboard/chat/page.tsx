import type { Metadata } from "next";
import { ChatRoom } from "@/systems/chat/components/ChatRoom";
import { PageHeader } from "@/components/ui/page-container";

export const metadata: Metadata = {
  title: "แชทชุมชน | MAWELL Buffet",
};

export default function ChatPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <PageHeader compact title="ห้องแชทชุมชน" />
      <div className="min-h-0 min-h-[min(480px,calc(100dvh-14rem))] flex-1">
        <ChatRoom />
      </div>
    </div>
  );
}
