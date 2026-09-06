"use client";

import { AppEmptyState, AppImageThumb, useAppImageLightbox, AppImageLightbox } from "@/components/app-templates";
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
        <div className="space-y-3" role="tabpanel">
          {summary.questions.length === 0 ? (
            <AppEmptyState>ไม่มีคำถามในแบบฟอร์มนี้ — ดูแท็บรายการรายคน</AppEmptyState>
          ) : (
            summary.questions.map((q) => (
              <section
                key={q.key}
                className="rounded-xl border border-[#d8d6ec]/80 bg-[#faf9ff]/60 p-3 sm:p-3.5"
              >
                <div className="mb-2">
                  <h3 className="text-sm font-black text-[#1e1b4b]">{q.label}</h3>
                  <p className="mt-0.5 text-[11px] font-semibold text-[#66638c]">
                    {q.kind === "qty"
                      ? `สั่ง ${q.answered}/${summary.total} คน · รวม ${q.totalUnits.toLocaleString("th-TH")} ชิ้น/ห้อง`
                      : q.kind === "choice"
                        ? `ตอบ ${q.answered}/${summary.total} คน · ตัวเลือก`
                        : `ตอบ ${q.answered}/${summary.total} คน · ข้อความ`}
                  </p>
                </div>

                {q.kind === "choice" ? (
                  q.answered === 0 || q.options.every((o) => o.count === 0) ? (
                    <p className="text-sm font-semibold text-[#8b87b8]">ยังไม่มีใครตอบคำถามนี้</p>
                  ) : (
                    <ul className="space-y-1">
                      {q.options
                        .filter((o) => o.count > 0)
                        .map((o) => (
                          <li
                            key={o.value}
                            className="flex items-baseline justify-between gap-3 text-sm"
                          >
                            <span className="min-w-0 font-semibold text-[#1e1b4b]">{o.value}</span>
                            <span className="shrink-0 tabular-nums font-black text-[#4d47b6]">
                              {o.count.toLocaleString("th-TH")} คน
                              <span className="ml-1 font-semibold text-[#9490c0]">({o.pct}%)</span>
                            </span>
                          </li>
                        ))}
                    </ul>
                  )
                ) : q.kind === "qty" ? (
                  q.items.length === 0 ? (
                    <p className="text-sm font-semibold text-[#8b87b8]">ยังไม่มีคำสั่งซื้อตามขนาด</p>
                  ) : (
                    <>
                      <ul className="space-y-1.5">
                        {q.items.map((item) => (
                          <li
                            key={item.key}
                            className="flex items-baseline justify-between gap-3 rounded-lg border border-white/80 bg-white/90 px-2.5 py-1.5 text-sm"
                          >
                            <span className="min-w-0 font-bold text-[#1e1b4b]">{item.label}</span>
                            <span className="shrink-0 text-right">
                              <span className="tabular-nums font-black text-[#4d47b6]">
                                {item.count.toLocaleString("th-TH")}
                              </span>
                              <span className="ml-1 text-[11px] font-semibold text-[#66638c]">ชิ้น</span>
                              {item.amountBaht > 0 ? (
                                <span className="mt-0.5 block text-[11px] font-semibold tabular-nums text-[#8b87b8]">
                                  ฿{item.amountBaht.toLocaleString("th-TH")}
                                </span>
                              ) : null}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2 border-t border-[#e4e0f5] pt-2 text-xs font-bold text-[#1e1b4b]">
                        รวมทั้งสิ้น {q.totalUnits.toLocaleString("th-TH")} ชิ้น/ห้อง
                        {q.items.some((i) => i.amountBaht > 0) ? (
                          <span className="ml-1 font-semibold text-[#4d47b6]">
                            · ฿
                            {q.items.reduce((s, i) => s + i.amountBaht, 0).toLocaleString("th-TH")}
                          </span>
                        ) : null}
                      </p>
                    </>
                  )
                ) : q.samples.length === 0 ? (
                  <p className="text-sm font-semibold text-[#8b87b8]">ยังไม่มีใครตอบคำถามนี้</p>
                ) : (
                  <ul className="max-h-48 space-y-1 overflow-y-auto text-sm">
                    {q.samples.map((s, i) => (
                      <li
                        key={`${q.key}-${i}-${s.createdAt}`}
                        className="border-b border-[#eceaf8] py-1.5 last:border-0"
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
            ))
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
