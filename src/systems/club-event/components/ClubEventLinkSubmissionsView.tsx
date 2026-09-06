"use client";

import { AppCompareBarList, AppEmptyState, AppImageThumb, useAppImageLightbox, AppImageLightbox } from "@/components/app-templates";
import type { ClubDynamicLinkField } from "@/systems/club-event/lib/mappers";
import {
  formatClubSubmissionAnswer,
  summarizeClubLinkSubmissions,
  type ClubSubmissionRow,
} from "@/systems/club-event/lib/submission-summary";

export type ClubEventSubmissionsTab = "summary" | "list";

export function ClubEventLinkSubmissionsView({
  rows,
  fields = [],
  tab,
}: {
  rows: ClubSubmissionRow[];
  fields?: ClubDynamicLinkField[];
  tab: ClubEventSubmissionsTab;
}) {
  const lb = useAppImageLightbox();
  const summary = summarizeClubLinkSubmissions(rows, fields);

  if (rows.length === 0) {
    return (
      <>
        <AppEmptyState>ยังไม่มีคำตอบ</AppEmptyState>
        <AppImageLightbox src={lb.src} onClose={lb.close} alt="สลิป" />
      </>
    );
  }

  return (
    <>
      {tab === "summary" ? (
        <div className="space-y-4" role="tabpanel">
          {summary.questions.length === 0 ? (
            <AppEmptyState>ไม่มีคำถามในแบบฟอร์มนี้ — ดูแท็บรายการรายคน</AppEmptyState>
          ) : (
            summary.questions.map((q) =>
              q.kind === "choice" ? (
                <AppCompareBarList
                  key={q.key}
                  title={q.label}
                  subtitle={`ตอบ ${q.answered}/${summary.total} คน · ตัวเลือก`}
                  emptyText="ยังไม่มีใครตอบคำถามนี้"
                  variant="brand"
                  formatAmount={(n) => `${n} คน`}
                  rows={
                    q.answered === 0
                      ? []
                      : q.options.map((o) => ({
                          key: o.value,
                          label: `${o.value} (${o.pct}%)`,
                          amount: o.count,
                          pct: o.pct,
                        }))
                  }
                />
              ) : q.kind === "qty" ? (
                <AppCompareBarList
                  key={q.key}
                  title={q.label}
                  subtitle={`ตอบ ${q.answered}/${summary.total} คน · จำนวนรวม`}
                  emptyText="ยังไม่มีใครตอบคำถามนี้"
                  variant="brand"
                  formatAmount={(n) => `${n} ชิ้น`}
                  rows={
                    q.answered === 0
                      ? []
                      : q.items.map((o) => ({
                          key: o.label,
                          label: `${o.label} (${o.pct}%)`,
                          amount: o.totalQty,
                          pct: o.pct,
                        }))
                  }
                />
              ) : (
                <section
                  key={q.key}
                  className="space-y-2 rounded-lg border border-slate-200/90 bg-slate-50/50 p-3"
                >
                  <div>
                    <h3 className="text-sm font-semibold text-[#1e1b4b]">{q.label}</h3>
                    <p className="mt-0.5 text-xs text-[#66638c]">
                      ตอบ {q.answered}/{summary.total} คน · ข้อความ
                    </p>
                  </div>
                  {q.samples.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-slate-200 bg-white py-6 text-center text-sm text-[#66638c]">
                      ยังไม่มีใครตอบคำถามนี้
                    </p>
                  ) : (
                    <ul className="max-h-56 space-y-2 overflow-y-auto">
                      {q.samples.map((s, i) => (
                        <li
                          key={`${q.key}-${i}-${s.createdAt}`}
                          className="rounded-lg border border-slate-200/90 bg-white px-3 py-2 text-sm"
                        >
                          <p className="whitespace-pre-wrap font-semibold text-[#1e1b4b]">{s.value}</p>
                          <p className="mt-0.5 text-[10px] font-semibold text-[#9490c0]">
                            {s.name} ·{" "}
                            {new Date(s.createdAt).toLocaleString("th-TH", {
                              timeZone: "Asia/Bangkok",
                            })}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ),
            )
          )}
        </div>
      ) : (
        <ul className="space-y-2" role="tabpanel">
          {rows.map((s) => {
            const answers =
              s.payload.answers && typeof s.payload.answers === "object"
                ? (s.payload.answers as Record<string, string>)
                : null;
            const fieldMeta = Array.isArray(s.payload.fields)
              ? (s.payload.fields as {
                  key?: string;
                  label?: string;
                  type?: string;
                  qtyItems?: ClubDynamicLinkField["qtyItems"];
                }[])
              : fields.map((f) => ({ key: f.key, label: f.label, type: f.type, qtyItems: f.qtyItems }));
            const labelOf = (key: string) => fieldMeta.find((f) => f.key === key)?.label?.trim() || key;
            const fieldOf = (key: string) => fieldMeta.find((f) => f.key === key);
            const legacyAnswer = typeof s.payload.answer === "string" ? s.payload.answer : "";
            return (
              <li key={s.id} className="rounded-lg border border-slate-200/90 bg-white p-3 text-sm">
                <p className="font-bold text-[#1e1b4b]">
                  {s.respondentName || "ไม่ระบุชื่อ"}
                  {s.respondentPhone ? ` · ${s.respondentPhone}` : ""}
                </p>
                {s.amountBaht != null ? (
                  <p className="font-black tabular-nums text-emerald-700">
                    ฿{s.amountBaht.toLocaleString("th-TH")}
                    {s.paymentMethod ? ` · ${s.paymentMethod}` : ""}
                  </p>
                ) : null}
                {answers ? (
                  <ol className="mt-2 space-y-1.5 border-t border-slate-100 pt-2">
                    {Object.entries(answers).map(([k, v], idx) =>
                      v ? (
                        <li key={k} className="text-[#66638c]">
                          <span className="font-semibold text-[#4d47b6]">
                            {idx + 1}. {labelOf(k)}
                          </span>
                          <span className="mt-0.5 block whitespace-pre-wrap text-[#1e1b4b]">
                            {formatClubSubmissionAnswer(v, fieldOf(k))}
                          </span>
                        </li>
                      ) : null,
                    )}
                  </ol>
                ) : legacyAnswer ? (
                  <p className="mt-1 whitespace-pre-wrap text-[#66638c]">{legacyAnswer}</p>
                ) : null}
                {s.slipUrl ? (
                  <div className="mt-2">
                    <AppImageThumb
                      src={s.slipUrl}
                      alt="สลิป"
                      onOpen={() => lb.open(s.slipUrl!)}
                      className="h-14 w-14"
                    />
                  </div>
                ) : null}
                <p className="mt-1 text-[10px] text-[#9490c0]">
                  {new Date(s.createdAt).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}
                </p>
              </li>
            );
          })}
        </ul>
      )}
      <AppImageLightbox src={lb.src} onClose={lb.close} alt="สลิป" />
    </>
  );
}
