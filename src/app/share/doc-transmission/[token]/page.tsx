import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/cn";
import {
  DOC_CATEGORY_BY_KEY,
  DOC_PRIORITY_BY_KEY,
  DOC_STATUS_BY_KEY,
  DOC_TIMELINE_ACTION_LABEL,
  formatThaiDateLong,
  formatThaiDateTime,
} from "@/systems/doc-transmission/lib/doc-types";

export const dynamic = "force-dynamic";

export default async function PublicDocSharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!token || token.length < 16 || token.length > 64) notFound();

  const record = await prisma.docTransmissionRecord.findFirst({
    where: { publicShareToken: token, isDeleted: false },
    include: {
      department: { select: { name: true, code: true } },
      timelineEntries: { orderBy: { occurredAt: "asc" } },
    },
  });
  if (!record) notFound();

  const setting = await prisma.docTransmissionSettings.findFirst({
    where: { ownerUserId: record.ownerUserId, trialSessionId: record.trialSessionId },
    select: { publicShareEnabled: true, orgName: true },
  });
  if (setting && !setting.publicShareEnabled) {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-center">
          <h1 className="text-lg font-bold text-rose-800">องค์กรปิดการแชร์ลิงก์ภายนอก</h1>
          <p className="mt-2 text-sm text-rose-700">
            ผู้ดูแลระบบขององค์กรได้ปิดการแชร์ลิงก์เอกสารสำหรับผู้นอกระบบไว้
          </p>
        </div>
      </main>
    );
  }

  const cat = DOC_CATEGORY_BY_KEY[record.category];
  const status = DOC_STATUS_BY_KEY[record.status];
  const priority = DOC_PRIORITY_BY_KEY[record.priority];

  return (
    <main className="mx-auto min-h-screen max-w-3xl bg-gradient-to-b from-[#f7f5ff] via-white to-[#eef2ff] p-4 sm:p-8">
      <div className="rounded-[2rem] border border-white/60 bg-white/85 p-5 shadow-[0_20px_60px_-30px_rgba(76,70,178,0.5)] ring-1 ring-white/55 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#66638c]">
              {cat.title} · ปี {record.academicYear}
            </p>
            <h1 className="mt-1 text-xl font-bold tracking-tight text-[#2e2a58] sm:text-2xl">
              {record.subject}
            </h1>
            <p className="mt-1 font-mono text-sm text-[#4d47b6]">{record.docNumber}</p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-1.5">
            <span className={cn("rounded-full px-2 py-1 text-xs font-bold ring-1", status.badge)}>
              {status.label}
            </span>
            {record.priority !== "NORMAL" ? (
              <span className={cn("rounded-full px-2 py-1 text-xs font-bold ring-1", priority.tone)}>
                {priority.label}
              </span>
            ) : null}
          </div>
        </div>

        {setting?.orgName ? (
          <p className="mt-2 text-xs text-[#66638c]">จาก: {setting.orgName}</p>
        ) : null}

        <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-wider text-[#66638c]">
              {cat.dateLabel}
            </dt>
            <dd className="font-semibold text-[#2e2a58]">
              {formatThaiDateLong(new Date(record.recordDate))}
            </dd>
          </div>
          {record.dueDate ? (
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-wider text-[#66638c]">
                กำหนดเสร็จ
              </dt>
              <dd className="font-semibold text-[#2e2a58]">
                {formatThaiDateLong(new Date(record.dueDate))}
              </dd>
            </div>
          ) : null}
          {record.person ? (
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-wider text-[#66638c]">
                {cat.personLabel}
              </dt>
              <dd className="font-semibold text-[#2e2a58]">{record.person}</dd>
            </div>
          ) : null}
          {record.department ? (
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-wider text-[#66638c]">
                หน่วยงาน
              </dt>
              <dd className="font-semibold text-[#2e2a58]">
                {record.department.code} · {record.department.name}
              </dd>
            </div>
          ) : null}
          {record.assigneeName ? (
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-wider text-[#66638c]">
                ผู้รับมอบ
              </dt>
              <dd className="font-semibold text-[#2e2a58]">
                {record.assigneeName}
                {record.assigneeDept ? ` · ${record.assigneeDept}` : ""}
              </dd>
            </div>
          ) : null}
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-wider text-[#66638c]">
              Tracking Code
            </dt>
            <dd className="font-mono text-[#4d47b6]">{record.trackingCode}</dd>
          </div>
        </dl>

        {record.note ? (
          <div className="mt-4 rounded-xl border border-white/55 bg-white/60 p-3 text-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#66638c]">หมายเหตุ</p>
            <p className="mt-1 whitespace-pre-wrap">{record.note}</p>
          </div>
        ) : null}

        {record.attachmentUrl ? (
          <div className="mt-4">
            <a
              href={record.attachmentUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-[#4d47b6] px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-[#5b61ff]"
            >
              เปิดไฟล์ {record.attachmentName ?? "PDF"}
            </a>
          </div>
        ) : null}

        {record.timelineEntries.length > 0 ? (
          <section className="mt-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#66638c]">
              Timeline
            </h2>
            <ol className="mt-2 space-y-2 border-l-2 border-[#e6e2f5] pl-4">
              {record.timelineEntries.map((t) => (
                <li key={t.id.toString()} className="relative">
                  <span className="absolute -left-[1.4rem] top-1.5 h-3 w-3 rounded-full bg-[#5b61ff] ring-4 ring-white" />
                  <div className="rounded-xl border border-white/55 bg-white/60 p-2.5">
                    <p className="text-sm font-semibold text-[#2e2a58]">
                      {DOC_TIMELINE_ACTION_LABEL[t.action]}
                    </p>
                    {t.note ? <p className="mt-0.5 text-xs text-[#5f5a8a]">{t.note}</p> : null}
                    <p className="mt-1 text-[10px] uppercase tracking-wider text-[#9591b8]">
                      {formatThaiDateTime(new Date(t.occurredAt))}
                      {t.actorName ? ` · โดย ${t.actorName}` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        <p className="mt-6 text-center text-[10px] text-[#9591b8]">
          ลิงก์อ่านอย่างเดียว · ผู้สร้างสามารถปิดได้ตลอดเวลา
        </p>
      </div>
    </main>
  );
}
