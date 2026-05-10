import { WaitQueueShell } from "@/systems/wait-queue/components/WaitQueueShell";
import { requireWaitQueuePage } from "@/systems/wait-queue/lib/wait-queue-page-auth";

export default async function WaitQueueModuleLayout({ children }: { children: React.ReactNode }) {
  const { site } = await requireWaitQueuePage();
  return <WaitQueueShell siteName={site.name}>{children}</WaitQueueShell>;
}
