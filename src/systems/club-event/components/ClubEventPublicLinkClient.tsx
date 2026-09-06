"use client";

import { useEffect, useMemo, useState } from "react";
import { useAppNoticePopup } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  ClubEventPublicPaymentPanel,
  clubEventPublicPayBlocked,
  type ClubEventPublicPayMethod,
} from "@/systems/club-event/components/ClubEventPublicPaymentPanel";
import {
  computeClubLinkAnswersAmountBaht,
  parseClubLinkQtyAnswer,
  serializeClubLinkQtyAnswer,
} from "@/systems/club-event/lib/link-field-amount";
import {
  CLUB_EVENT_LINK_TYPE_LABELS,
  normalizeClubDynamicLinkFields,
  type ClubDynamicLinkField,
} from "@/systems/club-event/lib/mappers";
import type { ClubDynamicLinkConfig, ClubEventDynamicLinkDto } from "@/systems/club-event/lib/mappers";
import {
  clubEventFieldClass,
  clubEventGlassShellClass,
  clubEventPrimaryButtonClass,
  clubEventTextareaClass,
} from "@/systems/club-event/lib/ui-tokens";

export type ClubPublicLinkPayload = {
  ownerId: string;
  clubName: string;
  paymentRulesNote: string;
  link: {
    id: string;
    type: ClubEventDynamicLinkDto["type"];
    title: string;
    config: ClubDynamicLinkConfig;
    eventTitle?: string | null;
  };
};

const labelClass = "block space-y-1";
const labelText = "text-xs font-bold text-[#4d47b6]";

function defaultQtyAnswerJson(f: ClubDynamicLinkField): string {
  const map: Record<string, number> = {};
  for (const item of f.qtyItems ?? []) {
    const q = item.defaultQty ?? 0;
    if (q > 0) map[item.key] = q;
  }
  return serializeClubLinkQtyAnswer(map);
}

function ClubEventQtyFieldInputs({
  field,
  value,
  disabled,
  onChange,
}: {
  field: ClubDynamicLinkField;
  value: string;
  disabled?: boolean;
  onChange: (next: string) => void;
}) {
  const map = parseClubLinkQtyAnswer(value);
  const items = field.qtyItems ?? [];
  const showPrice = items.some((i) => i.amountBaht > 0);
  const lineTotal = items.reduce((sum, item) => {
    const q = map[item.key] ?? 0;
    return sum + q * Math.max(0, item.amountBaht);
  }, 0);

  return (
    <div className="mt-1 space-y-2">
      <ul className="space-y-2">
        {items.map((item) => {
          const qty = map[item.key] ?? 0;
          return (
            <li key={item.key} className="flex items-center gap-2">
              <span className="min-w-0 flex-1 text-sm font-bold text-[#1e1b4b]">{item.label}</span>
              {showPrice ? (
                <span className="shrink-0 text-xs font-semibold text-[#66638c]">
                  ฿{item.amountBaht.toLocaleString("th-TH")}
                </span>
              ) : null}
              <input
                className={cn(clubEventFieldClass, "w-[4.5rem] shrink-0 text-center")}
                inputMode="numeric"
                value={qty === 0 ? "" : String(qty)}
                placeholder="0"
                disabled={disabled}
                aria-label={`จำนวน ${item.label}`}
                onChange={(e) => {
                  const raw = e.target.value.trim();
                  const n = raw === "" ? 0 : Math.max(0, Math.min(999, Math.floor(Number(raw)) || 0));
                  onChange(serializeClubLinkQtyAnswer({ ...map, [item.key]: n }));
                }}
              />
            </li>
          );
        })}
      </ul>
      {showPrice && lineTotal > 0 ? (
        <p className="text-xs font-bold text-[#4d47b6]">รวม ฿{lineTotal.toLocaleString("th-TH")}</p>
      ) : null}
    </div>
  );
}

function ClubEventExternalRedirect({ url }: { url: string }) {
  useEffect(() => {
    window.location.href = url;
  }, [url]);
  return (
    <div className="mx-auto max-w-lg px-3 py-10 text-center text-sm text-[#66638c]">
      กำลังเปิดลิงก์ภายนอก…
      <br />
      <a href={url} className="text-[#0000BF] underline">
        เปิดเอง
      </a>
    </div>
  );
}

export function ClubEventPublicLinkClient({
  slug,
  linkId,
  trialParam,
  initialData,
}: {
  slug: string;
  linkId: string;
  trialParam?: string;
  initialData: ClubPublicLinkPayload;
}) {
  const notice = useAppNoticePopup();
  const data = initialData;
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [method, setMethod] = useState<ClubEventPublicPayMethod>("PROMPTPAY");
  const [slipUrl, setSlipUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const { link, clubName, ownerId, paymentRulesNote } = data;
  const fields = useMemo(
    () => normalizeClubDynamicLinkFields(link.config.fields ?? []),
    [link.config.fields],
  );
  const computedAmount = useMemo(() => {
    if (link.type !== "PAYMENT") return 0;
    return computeClubLinkAnswersAmountBaht(fields, answers, {
      baseAmountBaht: Number(link.config.amountBaht) || 0,
    });
  }, [answers, fields, link.config.amountBaht, link.type]);

  useEffect(() => {
    const init: Record<string, string> = {};
    for (const f of fields) {
      init[f.key] = f.type === "qty" ? defaultQtyAnswerJson(f) : "";
    }
    setAnswers(init);
  }, [fields]);

  if (link.type === "URL" && link.config.url) {
    return <ClubEventExternalRedirect url={link.config.url} />;
  }

  if (done) {
    return (
      <div className="mx-auto max-w-lg px-3 py-10">
        <div className={cn("p-6 text-center", clubEventGlassShellClass)}>
          <p className="text-lg font-black text-[#1e1b4b]">ส่งข้อมูลแล้ว</p>
          <p className="mt-2 text-sm text-[#66638c]">ขอบคุณที่ตอบแบบฟอร์มของ {clubName}</p>
        </div>
      </div>
    );
  }

  const submit = async () => {
    if (!name.trim()) {
      notice.error("กรอกชื่อ");
      return;
    }
    for (const f of fields) {
      const val = (answers[f.key] ?? "").trim();
      if (f.type === "qty") {
        const map = parseClubLinkQtyAnswer(answers[f.key]);
        const total = Object.values(map).reduce((n, q) => n + q, 0);
        if (f.required && total <= 0) {
          notice.error(`กรอกจำนวน: ${f.label}`);
          return;
        }
        continue;
      }
      if (f.required && !val) {
        notice.error(`กรอก/เลือก: ${f.label}`);
        return;
      }
      const choiceLabels = (f.choiceOptions ?? []).map((o) => o.label);
      const allowed = choiceLabels.length > 0 ? choiceLabels : f.options;
      if (f.type === "choice" && val && allowed && !allowed.includes(val)) {
        notice.error(`ตัวเลือกไม่ถูกต้อง: ${f.label}`);
        return;
      }
    }
    if (link.type === "PAYMENT" && clubEventPublicPayBlocked(method, computedAmount, slipUrl)) {
      notice.error("แนบสลิปหลังชำระด้วยพร้อมเพย์หรือโอน");
      return;
    }
    setSubmitting(true);
    try {
      const q = trialParam ? `?t=${encodeURIComponent(trialParam)}` : "";
      const trimmedAnswers: Record<string, string> = {};
      for (const f of fields) {
        trimmedAnswers[f.key] = (answers[f.key] ?? "").trim();
      }
      const res = await fetch(
        `/api/club-event/public/${encodeURIComponent(slug)}/links/${encodeURIComponent(linkId)}/submit${q}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            respondentName: name.trim(),
            respondentPhone: phone.trim(),
            answers: trimmedAnswers,
            // รองรับลิงก์เก่าที่ยังมีช่องเดียว
            answer: trimmedAnswers[fields[0]?.key ?? "answer"] ?? "",
            paymentMethod: link.type === "PAYMENT" ? method : undefined,
            slipUrl: link.type === "PAYMENT" ? slipUrl : undefined,
            amountBaht: link.type === "PAYMENT" ? computedAmount : undefined,
          }),
        },
      );
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "ส่งไม่สำเร็จ");
      setDone(true);
      notice.success("บันทึกแล้ว");
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "ส่งไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-4 px-3 py-8 sm:px-4">
      {notice.popup}
      <header className={cn("p-5 text-center", clubEventGlassShellClass)}>
        <p className="text-xs font-bold uppercase tracking-widest text-[#9490c0]">{clubName}</p>
        <h1 className="mt-1 text-xl font-black text-[#1e1b4b]">{link.title}</h1>
        <p className="mt-1 text-sm text-[#66638c]">{CLUB_EVENT_LINK_TYPE_LABELS[link.type]}</p>
        {link.eventTitle ? (
          <p className="mt-2 text-xs font-semibold text-[#4d47b6]">กิจกรรม: {link.eventTitle}</p>
        ) : null}
        {link.config.description ? (
          <p className="mt-3 whitespace-pre-wrap text-left text-sm text-[#5f5a8a]">{link.config.description}</p>
        ) : null}
      </header>

      <div className="space-y-3 rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm">
        <label className={labelClass}>
          <span className={labelText}>ชื่อ-นามสกุล</span>
          <input
            className={cn(clubEventFieldClass, "mt-1")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="กรอกชื่อของคุณ"
            disabled={submitting}
          />
        </label>
        <label className={labelClass}>
          <span className={labelText}>เบอร์โทร</span>
          <input
            className={cn(clubEventFieldClass, "mt-1")}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="08x-xxx-xxxx"
            inputMode="tel"
            disabled={submitting}
          />
        </label>

        {fields.map((f) =>
          f.type === "qty" ? (
            <div key={f.key} className={labelClass}>
              <span className={labelText}>
                {f.label}
                {f.required ? <span className="text-rose-500"> *</span> : null}
              </span>
              <ClubEventQtyFieldInputs
                field={f}
                value={answers[f.key] ?? ""}
                disabled={submitting}
                onChange={(next) => setAnswers((a) => ({ ...a, [f.key]: next }))}
              />
            </div>
          ) : (
            <label key={f.key} className={labelClass}>
              <span className={labelText}>
                {f.label}
                {f.required ? <span className="text-rose-500"> *</span> : null}
              </span>
              {f.type === "choice" ? (
                <select
                  className={cn(clubEventFieldClass, "mt-1")}
                  value={answers[f.key] ?? ""}
                  onChange={(e) => setAnswers((a) => ({ ...a, [f.key]: e.target.value }))}
                  disabled={submitting}
                >
                  <option value="">— เลือก —</option>
                  {(f.choiceOptions && f.choiceOptions.length > 0
                    ? f.choiceOptions.map((opt) => ({
                        value: opt.label,
                        label:
                          opt.amountBaht > 0
                            ? `${opt.label} · ฿${opt.amountBaht.toLocaleString("th-TH")}`
                            : opt.label,
                      }))
                    : (f.options ?? []).map((opt) => ({ value: opt, label: opt }))
                  ).map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <textarea
                  className={cn(clubEventTextareaClass, "mt-1")}
                  value={answers[f.key] ?? ""}
                  onChange={(e) => setAnswers((a) => ({ ...a, [f.key]: e.target.value }))}
                  disabled={submitting}
                />
              )}
            </label>
          ),
        )}

        {link.type === "PAYMENT" ? (
          <ClubEventPublicPaymentPanel
            ownerId={ownerId}
            amountBaht={computedAmount}
            method={method}
            slipUrl={slipUrl}
            onMethodChange={setMethod}
            onSlipUrlChange={setSlipUrl}
            paymentRulesNote={paymentRulesNote}
            disabled={submitting}
            trialParam={trialParam}
          />
        ) : null}

        <button
          type="button"
          className={cn(clubEventPrimaryButtonClass, "w-full")}
          disabled={submitting}
          onClick={() => void submit()}
        >
          {submitting ? "กำลังส่ง…" : link.type === "PAYMENT" ? "ยืนยันการชำระ / ส่งข้อมูล" : "ส่งคำตอบ"}
        </button>
      </div>
    </div>
  );
}
