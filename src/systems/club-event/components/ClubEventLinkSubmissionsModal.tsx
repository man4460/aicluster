"use client";

import { useMemo, useState } from "react";
import { AppCompareBarList, AppEmptyState, AppImageThumb, useAppImageLightbox, AppImageLightbox } from "@/components/app-templates";
import { FormModal } from "@/components/ui/FormModal";
import type { ClubDynamicLinkField } from "@/systems/club-event/lib/mappers";
import {
  formatClubSubmissionAnswer,
  summarizeClubLinkSubmissions,
  type ClubSubmissionRow,
} from "@/systems/club-event/lib/submission-summary";
import {
  clubEventFilterChipClass,
  clubEventFilterChipShellClass,
} from "@/systems/club-event/lib/ui-tokens";

type ViewTab = "summary" | "list";

export function ClubEventLinkSubmissionsModal({
  open,
  onClose,
  title,
  rows,
  fields = [],
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  rows: ClubSubmissionRow[];
  fields?: ClubDynamicLinkField[];
}) {
  const [tab, setTab] = useState<ViewTab>("summary");
  const lb = useAppImageLightbox();
  const summary = useMemo(() => summarizeClubLinkSubmissions(rows, fields), [rows, fields]);

  return (
    <>
      <FormModal
        open={open}
        onClose={onClose}
        title={`คำตอบ · ${title}`}
        mobileCentered
        size="lg"
      >
        {rows.length === 0 ? (
          <AppEmptyState>ยังไม่มีคำตอบ</AppEmptyState>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <nav className={clubEventFilterChipShellClass} role="tablist" aria-label="มุมมองคำตอบ">
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === "summary"}
                  className={clubEventFilterChipClass(tab === "summary")}
                  onClick={() => setTab("summary")}
                >
                  สรุปตามคำถาม
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === "list"}
                  className={clubEventFilterChipClass(tab === "list")}
                  onClick={() => setTab("list")}
                >
                  รายการรายคน
                </button>
              </nav>
              <p className="text-xs font-bold text-[#4d47b6]">รวม {summary.total} คน</p>
            </div>

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
                        className="space-y-2 rounded-xl border border-[#d8d6ec]/80 bg-[#faf9ff]/60 p-3"
                      >
                        <div>
                          <h3 className="text-sm font-semibold text-[#1e1b4b]">{q.label}</h3>
                          <p className="mt-0.5 text-xs text-[#66638c]">
                            ตอบ {q.answered}/{summary.total} คน · ข้อความ
                          </p>
                        </div>
                        {q.samples.length === 0 ? (
                          <p className="rounded-xl border border-dashed border-[#d8d6ec] bg-white/80 py-6 text-center text-sm text-[#66638c]">
                            ยังไม่มีใครตอบคำถามนี้
                          </p>
                        ) : (
                          <ul className="max-h-56 space-y-2 overflow-y-auto">
                            {q.samples.map((s, i) => (
                              <li
                                key={`${q.key}-${i}-${s.createdAt}`}
                                className="rounded-lg border border-white bg-white px-3 py-2 text-sm shadow-sm"
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
                    ? (s.payload.fields as { key?: string; label?: string; type?: string; qtyItems?: ClubDynamicLinkField["qtyItems"] }[])
                    : fields.map((f) => ({ key: f.key, label: f.label, type: f.type, qtyItems: f.qtyItems }));
                  const labelOf = (key: string) =>
                    fieldMeta.find((f) => f.key === key)?.label?.trim() || key;
                  const fieldOf = (key: string) => fieldMeta.find((f) => f.key === key);
                  const legacyAnswer =
                    typeof s.payload.answer === "string" ? s.payload.answer : "";
                  return (
                    <li key={s.id} className="rounded-lg border border-slate-200/90 bg-white p-3 text-sm">
                      <p className="font-bold text-[#1e1b4b]">
                        {s.respondentName || "ไม่ระบุชื่อ"}
                        {s.respondentPhone ? ` · ${s.respondentPhone}` : ""}
                      </p>
                      {s.amountBaht != null ? (
                        <p className="text-[#4d47b6]">
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
          </div>
        )}
      </FormModal>
      <AppImageLightbox src={lb.src} onClose={lb.close} alt="สลิป" />
    </>
  );
}
