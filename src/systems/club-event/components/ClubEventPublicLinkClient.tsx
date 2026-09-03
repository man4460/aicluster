"use client";

import { useEffect, useState } from "react";
import { useAppNoticePopup } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  ClubEventPublicPaymentPanel,
  clubEventPublicPayBlocked,
  type ClubEventPublicPayMethod,
} from "@/systems/club-event/components/ClubEventPublicPaymentPanel";
import { CLUB_EVENT_LINK_TYPE_LABELS } from "@/systems/club-event/lib/mappers";
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
  const [answer, setAnswer] = useState("");
  const [method, setMethod] = useState<ClubEventPublicPayMethod>("PROMPTPAY");
  const [slipUrl, setSlipUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const { link, clubName, ownerId, paymentRulesNote } = data;
  const amountBaht = link.type === "PAYMENT" ? Number(link.config.amountBaht) || 0 : 0;
  const fieldLabel = link.config.fields?.[0]?.label ?? "คำถาม / หมายเหตุ";

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
    if (link.type === "PAYMENT" && clubEventPublicPayBlocked(method, amountBaht, slipUrl)) {
      notice.error("แนบสลิปหลังชำระด้วยพร้อมเพย์หรือโอน");
      return;
    }
    setSubmitting(true);
    try {
      const q = trialParam ? `?t=${encodeURIComponent(trialParam)}` : "";
      const res = await fetch(
        `/api/club-event/public/${encodeURIComponent(slug)}/links/${encodeURIComponent(linkId)}/submit${q}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            respondentName: name.trim(),
            respondentPhone: phone.trim(),
            answer: answer.trim(),
            paymentMethod: link.type === "PAYMENT" ? method : undefined,
            slipUrl: link.type === "PAYMENT" ? slipUrl : undefined,
            amountBaht: link.type === "PAYMENT" ? amountBaht : undefined,
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
        {link.eventTitle ? <p className="mt-2 text-xs font-semibold text-[#4d47b6]">กิจกรรม: {link.eventTitle}</p> : null}
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
        {link.type === "SURVEY" || link.type === "RSVP" ? (
          <label className={labelClass}>
            <span className={labelText}>{fieldLabel}</span>
            <textarea
              className={cn(clubEventTextareaClass, "mt-1")}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              disabled={submitting}
            />
          </label>
        ) : null}

        {link.type === "PAYMENT" ? (
          <ClubEventPublicPaymentPanel
            ownerId={ownerId}
            amountBaht={amountBaht}
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
