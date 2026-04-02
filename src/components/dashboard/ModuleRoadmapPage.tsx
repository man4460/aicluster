import Link from "next/link";
import { PageContainer, PageHeader } from "@/components/ui/page-container";

type Props = {
  emoji: string;
  title: string;
  description: string;
};

/**
 * หน้าโมดูลที่วางโครงไว้แล้ว — รอพัฒนาฟีเจอร์และผูก module_list / สิทธิ์ภายหลัง
 */
export function ModuleRoadmapPage({ emoji, title, description }: Props) {
  return (
    <PageContainer>
      <PageHeader
        title={`${emoji} ${title}`}
        description={description}
        action={
          <Link
            href="/dashboard"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-[#2e2a58] shadow-sm transition hover:bg-slate-50"
          >
            ← แดชบอร์ด
          </Link>
        }
      />
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <p className="text-sm leading-relaxed text-slate-600">
          โฟลเดอร์และเส้นทางหน้าเว็บจัดไว้แล้วในแพลตฟอร์ม — ฟังก์ชันหลักจะเชื่อมฐานข้อมูล แพ็กเกจ และสิทธิ์โมดูลเมื่อเปิดให้บริการ
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/dashboard/plans"
            className="rounded-lg bg-[#0000BF] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0000a3]"
          >
            ดูแพ็กเกจ
          </Link>
          <Link
            href="/dashboard/modules"
            className="rounded-lg border border-[#0000BF]/30 bg-[#0000BF]/5 px-4 py-2 text-sm font-medium text-[#0000BF] transition hover:bg-[#0000BF]/10"
          >
            โมดูลที่เปิดใช้
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}
