"use client";

import { CircleDot, Hash, MessageSquareText, UserRound } from "lucide-react";
import { AppEmptyState, AppImageThumb, useAppImageLightbox, AppImageLightbox } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import type { ClubDynamicLinkField } from "@/systems/club-event/lib/mappers";
import {
  clubEventCardIconTileClass,
  clubEventTonedGridCardClass,
  type ClubEventCardTone,
} from "@/systems/club-event/lib/card-tones";
import {
  formatClubSubmissionAnswer,
  summarizeClubLinkSubmissions,
  type ClubQuestionSummary,
  type ClubSubmissionRow,
} from "@/systems/club-event/lib/submission-summary";
import { clubEventSubmissionsCardGridClass } from "@/systems/club-event/lib/ui-tokens";

export type ClubEventSubmissionsTab = "summary" | "list";

const PERSON_TONES: ClubEventCardTone[] = ["violet", "indigo", "fuchsia", "sky", "cyan"];

function questionTone(kind: ClubQuestionSummary["kind"]): ClubEventCardTone {
  if (kind === "choice") return "violet";
  if (kind === "qty") return "amber";
  return "sky";
}

function QuestionKindIcon({ kind }: { kind: ClubQuestionSummary["kind"] }) {
  const cls = "h-4 w-4";
  if (kind === "choice") return <CircleDot className={cls} strokeWidth={2.25} aria-hidden />;
  if (kind === "qty") return <Hash className={cls} strokeWidth={2.25} aria-hidden />;
  return <MessageSquareText className={cls} strokeWidth={2.25} aria-hidden />;
}

function QuestionSummaryCard({
  q,
  total,
}: {
  q: ClubQuestionSummary;
  total: number;
}) {
  const tone = questionTone(q.kind);
  return (
    <article className={clubEventTonedGridCardClass(tone)}>
      <div className="flex min-w-0 items-start gap-2">
        <span className={clubEventCardIconTileClass(tone)} aria-hidden>
          <QuestionKindIcon kind={q.kind} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-sm font-black leading-snug text-[#1e1b4b]">{q.label}</h3>
          <p className="mt-0.5 text-[10px] font-semibold text-[#66638c]">
            {q.kind === "qty"
              ? `สั่ง ${q.answered}/${total} · รวม ${q.totalUnits.toLocaleString("th-TH")} ชิ้น`
              : q.kind === "choice"
                ? `ตอบ ${q.answered}/${total} · ตัวเลือก`
                : `ตอบ ${q.answered}/${total} · ข้อความ`}
          </p>
        </div>
      </div>

      {q.kind === "choice" ? (
        q.answered === 0 || q.options.every((o) => o.count === 0) ? (
          <p className="text-xs font-semibold text-[#8b87b8]">ยังไม่มีใครตอบ</p>
        ) : (
          <ul className="max-h-40 space-y-1 overflow-y-auto">
            {q.options
              .filter((o) => o.count > 0)
              .map((o) => (
                <li
                  key={o.value}
                  className="flex items-baseline justify-between gap-2 rounded-md bg-white/70 px-2 py-1 text-xs"
                >
                  <span className="min-w-0 truncate font-semibold text-[#1e1b4b]">{o.value}</span>
                  <span className="shrink-0 tabular-nums font-black text-[#4d47b6]">
                    {o.count.toLocaleString("th-TH")}
                    <span className="ml-0.5 font-semibold text-[#9490c0]">({o.pct}%)</span>
                  </span>
                </li>
              ))}
          </ul>
        )
      ) : q.kind === "qty" ? (
        q.items.length === 0 ? (
          <p className="text-xs font-semibold text-[#8b87b8]">ยังไม่มีตามขนาด</p>
        ) : (
          <>
            <ul className="max-h-40 space-y-1 overflow-y-auto">
              {q.items.map((item) => (
                <li
                  key={item.key}
                  className="flex items-baseline justify-between gap-2 rounded-md bg-white/70 px-2 py-1 text-xs"
                >
                  <span className="min-w-0 truncate font-bold text-[#1e1b4b]">{item.label}</span>
                  <span className="shrink-0 text-right tabular-nums">
                    <span className="font-black text-[#4d47b6]">{item.count.toLocaleString("th-TH")}</span>
                    <span className="ml-0.5 font-semibold text-[#66638c]">ชิ้น</span>
                    {item.amountBaht > 0 ? (
                      <span className="mt-0.5 block text-[10px] font-semibold text-[#8b87b8]">
                        ฿{item.amountBaht.toLocaleString("th-TH")}
                      </span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
            <p className="border-t border-[#e4e0f5]/90 pt-1.5 text-[11px] font-bold text-[#1e1b4b]">
              รวม {q.totalUnits.toLocaleString("th-TH")} ชิ้น
              {q.items.some((i) => i.amountBaht > 0) ? (
                <span className="ml-1 font-semibold text-[#4d47b6]">
                  · ฿{q.items.reduce((s, i) => s + i.amountBaht, 0).toLocaleString("th-TH")}
                </span>
              ) : null}
            </p>
          </>
        )
      ) : q.samples.length === 0 ? (
        <p className="text-xs font-semibold text-[#8b87b8]">ยังไม่มีใครตอบ</p>
      ) : (
        <ul className="max-h-40 space-y-1 overflow-y-auto">
          {q.samples.map((s, i) => (
            <li key={`${q.key}-${i}-${s.createdAt}`} className="rounded-md bg-white/70 px-2 py-1.5">
              <p className="line-clamp-3 whitespace-pre-wrap text-xs font-semibold text-[#1e1b4b]">{s.value}</p>
              <p className="mt-0.5 truncate text-[10px] font-semibold text-[#9490c0]">
                {s.name} ·{" "}
                {new Date(s.createdAt).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}
              </p>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

function PersonSubmissionCard({
  s,
  fields,
  tone,
  onOpenSlip,
}: {
  s: ClubSubmissionRow;
  fields: ClubDynamicLinkField[];
  tone: ClubEventCardTone;
  onOpenSlip: (url: string) => void;
}) {
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
  const answerEntries = answers
    ? Object.entries(answers).filter(([, v]) => Boolean(v))
    : legacyAnswer
      ? [["answer", legacyAnswer] as const]
      : [];
  const cardTone: ClubEventCardTone =
    typeof s.amountBaht === "number" && s.amountBaht > 0 ? "emerald" : tone;

  return (
    <article className={clubEventTonedGridCardClass(cardTone)}>
      <div className="flex min-w-0 items-start gap-2">
        {s.slipUrl ? (
          <AppImageThumb
            src={s.slipUrl}
            alt="สลิป"
            onOpen={() => onOpenSlip(s.slipUrl!)}
            className="h-10 w-10 shrink-0"
          />
        ) : (
          <span className={clubEventCardIconTileClass(cardTone)} aria-hidden>
            <UserRound className="h-4 w-4" strokeWidth={2.25} />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black text-[#1e1b4b]">{s.respondentName || "ไม่ระบุชื่อ"}</p>
          {s.respondentPhone ? (
            <p className="truncate text-[11px] font-semibold text-[#66638c]">{s.respondentPhone}</p>
          ) : null}
          {s.amountBaht != null ? (
            <p className="mt-0.5 text-xs font-black tabular-nums text-emerald-700">
              ฿{s.amountBaht.toLocaleString("th-TH")}
              {s.paymentMethod ? (
                <span className="ml-1 font-semibold text-[#8b87b8]">{s.paymentMethod}</span>
              ) : null}
            </p>
          ) : null}
        </div>
      </div>

      {answerEntries.length > 0 ? (
        <ol className="max-h-36 space-y-1 overflow-y-auto border-t border-slate-200/60 pt-2">
          {answerEntries.map(([k, v], idx) => (
            <li key={k} className="text-[11px] leading-snug">
              <span className="font-semibold text-[#4d47b6]">
                {idx + 1}. {labelOf(k)}
              </span>
              <span className="mt-0.5 block line-clamp-2 whitespace-pre-wrap font-semibold text-[#1e1b4b]">
                {formatClubSubmissionAnswer(v, fieldOf(k))}
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-[11px] font-semibold text-[#8b87b8]">ไม่มีคำตอบ</p>
      )}

      <p className="mt-auto text-[10px] font-semibold text-[#9490c0]">
        {new Date(s.createdAt).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}
      </p>
    </article>
  );
}

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
        <div className={cn(clubEventSubmissionsCardGridClass)} role="tabpanel">
          {summary.questions.length === 0 ? (
            <div className="col-span-full">
              <AppEmptyState>ไม่มีคำถามในแบบฟอร์มนี้ — ดูแท็บรายการรายคน</AppEmptyState>
            </div>
          ) : (
            summary.questions.map((q) => (
              <QuestionSummaryCard key={q.key} q={q} total={summary.total} />
            ))
          )}
        </div>
      ) : (
        <ul className={cn(clubEventSubmissionsCardGridClass, "list-none")} role="tabpanel">
          {rows.map((s, idx) => (
            <li key={s.id} className="min-w-0">
              <PersonSubmissionCard
                s={s}
                fields={fields}
                tone={PERSON_TONES[idx % PERSON_TONES.length]!}
                onOpenSlip={(url) => lb.open(url)}
              />
            </li>
          ))}
        </ul>
      )}
      <AppImageLightbox src={lb.src} onClose={lb.close} alt="สลิป" />
    </>
  );
}
