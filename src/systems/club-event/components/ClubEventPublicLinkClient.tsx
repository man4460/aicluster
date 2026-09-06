"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AppImageLightbox,
  AppPublicCheckInGlassPage,
  useAppImageLightbox,
  useAppNoticePopup,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  ClubEventPublicPaymentPanel,
  clubEventPublicPayBlocked,
  type ClubEventPublicPayMethod,
} from "@/systems/club-event/components/ClubEventPublicPaymentPanel";
import { ClubEventPortalSection } from "@/systems/club-event/components/ClubEventPortalSection";
import {
  computeClubLinkAnswersAmountBaht,
  parseClubLinkQtyAnswer,
  serializeClubLinkQtyAnswer,
} from "@/systems/club-event/lib/link-field-amount";
import {
  CLUB_EVENT_LINK_TYPE_LABELS,
  normalizeClubDynamicLinkFields,
  type ClubDynamicLinkField,
  type ClubDynamicLinkConfig,
  type ClubEventDynamicLinkDto,
} from "@/systems/club-event/lib/mappers";
import { CLUB_EVENT_PORTAL_SAMPLE_BANNER } from "@/systems/club-event/lib/portal-media";
import {
  clubEventOutlineButtonClass,
  clubEventPortalFlatBlockClass,
  clubEventPortalHeaderNavOnLightLinkClass,
  clubEventPortalHeaderNavOnLightShellClass,
  clubEventPortalHeroCompactShellClass,
  clubEventPortalInsetPanelClass,
  clubEventPortalLabelClass,
  clubEventPortalPrimaryBtnClass,
  clubEventPortalPublicFieldClass,
  clubEventPortalPublicTextareaClass,
  clubEventPortalQtyRowClass,
  clubEventPortalShopNameClass,
  clubEventPortalShopNameHeroClass,
} from "@/systems/club-event/lib/ui-tokens";

export type ClubPublicLinkPayload = {
  ownerId: string;
  clubName: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  slug: string;
  tagline: string | null;
  paymentRulesNote: string;
  link: {
    id: string;
    type: ClubEventDynamicLinkDto["type"];
    title: string;
    config: ClubDynamicLinkConfig;
    eventTitle?: string | null;
  };
};

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
    <div className="mt-2 space-y-2">
      {showPrice ? (
        <div className="hidden text-[10px] font-bold uppercase tracking-wide text-[#9490c0] sm:grid sm:grid-cols-[minmax(0,1fr)_5.5rem_4.5rem] sm:gap-2">
          <span>ตัวเลือก</span>
          <span className="text-right">ราคาต่อหน่วย</span>
          <span className="text-center">จำนวน</span>
        </div>
      ) : null}
      <ul className="space-y-2">
        {items.map((item) => {
          const qty = map[item.key] ?? 0;
          return (
            <li
              key={item.key}
              className={cn(
                showPrice ? clubEventPortalQtyRowClass : "grid grid-cols-[minmax(0,1fr)_4.5rem] items-center gap-2",
              )}
            >
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#1e1b4b]">{item.label}</p>
                {showPrice ? (
                  <p className="text-xs font-semibold text-[#66638c] sm:hidden">
                    ฿{item.amountBaht.toLocaleString("th-TH")} / หน่วย
                  </p>
                ) : null}
              </div>
              {showPrice ? (
                <p className="hidden text-right text-sm font-semibold tabular-nums text-[#5f5a8a] sm:block">
                  ฿{item.amountBaht.toLocaleString("th-TH")}
                </p>
              ) : null}
              <input
                className={cn(clubEventPortalPublicFieldClass, "w-full px-2 text-center")}
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
        <p className="text-sm font-black tabular-nums text-emerald-700">
          รวม ฿{lineTotal.toLocaleString("th-TH")}
        </p>
      ) : null}
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
  const lb = useAppImageLightbox();
  const data = initialData;
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [method, setMethod] = useState<ClubEventPublicPayMethod>("PROMPTPAY");
  const [slipUrl, setSlipUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const { link, clubName, ownerId, paymentRulesNote, logoUrl, tagline } = data;
  const title = clubName.trim() || "ชมรม";
  const banner = data.bannerUrl?.trim() || CLUB_EVENT_PORTAL_SAMPLE_BANNER;
  const homeHref = trialParam
    ? `/club/${encodeURIComponent(slug)}?t=${encodeURIComponent(trialParam)}`
    : `/club/${encodeURIComponent(slug)}`;

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

  const scrollToForm = useCallback(() => {
    document.getElementById("form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const shell = (children: ReactNode) => (
    <AppPublicCheckInGlassPage className="!px-0 !pt-0 sm:!px-0">
      {notice.popup}
      {children}
      <AppImageLightbox src={lb.src} onClose={lb.close} alt="แบนเนอร์" />
    </AppPublicCheckInGlassPage>
  );

  const headerAndHero = (ctaLabel: string, ctaAction?: () => void, ctaHref?: string) => (
    <>
      <header className="absolute inset-x-0 top-0 z-30">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <a
            href={homeHref}
            className="flex min-w-0 items-center gap-3 rounded-full border border-white/70 bg-white/85 py-1.5 pl-1.5 pr-3 shadow-sm backdrop-blur-md"
          >
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
            ) : (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0000BF]/10 text-xs font-black text-[#0000BF]">
                {(title || "C").slice(0, 1)}
              </span>
            )}
            <p className={cn("truncate text-sm sm:text-base", clubEventPortalShopNameClass)}>{title}</p>
          </a>
          <nav className={clubEventPortalHeaderNavOnLightShellClass} aria-label="เมนู">
            <a href={homeHref} className={clubEventPortalHeaderNavOnLightLinkClass()}>
              กลับเว็บชมรม
            </a>
            {ctaHref ? (
              <a href={ctaHref} className={clubEventPortalHeaderNavOnLightLinkClass()}>
                {ctaLabel}
              </a>
            ) : (
              <button type="button" className={clubEventPortalHeaderNavOnLightLinkClass()} onClick={ctaAction}>
                {ctaLabel}
              </button>
            )}
          </nav>
        </div>
      </header>

      <section className="relative isolate min-h-[42vh] overflow-hidden sm:min-h-[50vh]">
        <button type="button" className="absolute inset-0 block" onClick={() => lb.open(banner)} aria-label="ดูแบนเนอร์">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={banner} alt="" className="h-full w-full object-cover object-center" />
        </button>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/35 via-white/10 to-[#faf9ff]/85" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#faf9ff] via-[#faf9ff]/70 to-transparent" />
        <div className="relative z-10 mx-auto flex min-h-[42vh] max-w-6xl flex-col justify-end px-4 pb-8 pt-24 sm:min-h-[50vh] sm:px-6 sm:pb-10">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#5f5a8a] drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)]">
              {CLUB_EVENT_LINK_TYPE_LABELS[link.type]}
            </p>
            <h1 className={cn("mt-1 text-3xl sm:text-4xl", clubEventPortalShopNameHeroClass)}>{link.title}</h1>
            {link.eventTitle ? (
              <p className="mt-2 text-sm font-semibold text-[#3f3a6a] drop-shadow-[0_1px_2px_rgba(255,255,255,0.85)] sm:text-base">
                {link.eventTitle}
              </p>
            ) : tagline ? (
              <p className="mt-2 text-sm font-semibold text-[#3f3a6a] drop-shadow-[0_1px_2px_rgba(255,255,255,0.85)] sm:text-base">
                {tagline}
              </p>
            ) : null}
          </div>
          <div id="hero-cta" className={clubEventPortalHeroCompactShellClass}>
            <p className="text-sm font-semibold text-[#5f5a8a] sm:pb-1">{title}</p>
            <div className="flex flex-wrap gap-2">
              {ctaHref ? (
                <a href={ctaHref} className={clubEventPortalPrimaryBtnClass}>
                  {ctaLabel}
                </a>
              ) : (
                <button type="button" className={clubEventPortalPrimaryBtnClass} onClick={ctaAction}>
                  {ctaLabel}
                </button>
              )}
              <a href={homeHref} className={cn(clubEventOutlineButtonClass, "inline-flex items-center")}>
                กลับเว็บชมรม
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );

  if (link.type === "URL" && link.config.url) {
    return shell(
      <>
        <ClubEventExternalRedirect url={link.config.url} />
        {headerAndHero("เปิดลิงก์", undefined, link.config.url)}
        <main className="relative z-10 mx-auto max-w-6xl space-y-12 px-4 pb-16 pt-2 sm:space-y-14 sm:px-6">
          <ClubEventPortalSection id="form" title={link.title}>
            <p className="text-sm font-semibold text-[#66638c]">กำลังเปิดลิงก์ภายนอก…</p>
            <a href={link.config.url} className={clubEventPortalPrimaryBtnClass}>
              เปิดเอง
            </a>
          </ClubEventPortalSection>
        </main>
      </>,
    );
  }

  if (done) {
    return shell(
      <>
        {headerAndHero("กลับเว็บชมรม", undefined, homeHref)}
        <main className="relative z-10 mx-auto max-w-6xl space-y-12 px-4 pb-16 pt-2 sm:space-y-14 sm:px-6">
          <ClubEventPortalSection id="form" title="ส่งข้อมูลแล้ว">
            <p className="text-sm font-semibold text-[#66638c]">ขอบคุณที่ตอบแบบฟอร์มของ {title}</p>
            <a href={homeHref} className={clubEventPortalPrimaryBtnClass}>
              กลับเว็บชมรม
            </a>
          </ClubEventPortalSection>
        </main>
      </>,
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

  return shell(
    <>
      {headerAndHero("กรอกแบบฟอร์ม", scrollToForm)}
      <main className="relative z-10 mx-auto max-w-6xl space-y-12 px-4 pb-16 pt-2 sm:space-y-14 sm:px-6">
        <ClubEventPortalSection
          id="form"
          title={link.title}
          subtitle={link.eventTitle ? `กิจกรรม · ${link.eventTitle}` : null}
        >
          <div className={clubEventPortalFlatBlockClass}>
            {link.config.description ? (
              <p className="whitespace-pre-wrap text-sm font-semibold leading-relaxed text-[#1e1b4b]">
                {link.config.description}
              </p>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1">
                <span className={clubEventPortalLabelClass}>ชื่อ-นามสกุล</span>
                <input
                  className={clubEventPortalPublicFieldClass}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="กรอกชื่อของคุณ"
                  disabled={submitting}
                  autoComplete="name"
                />
              </label>
              <label className="block space-y-1">
                <span className={clubEventPortalLabelClass}>เบอร์โทร</span>
                <input
                  className={clubEventPortalPublicFieldClass}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="08x-xxx-xxxx"
                  inputMode="tel"
                  autoComplete="tel"
                  disabled={submitting}
                />
              </label>
            </div>

            {fields.map((f) =>
              f.type === "qty" ? (
                <div key={f.key} className={clubEventPortalInsetPanelClass}>
                  <span className={clubEventPortalLabelClass}>
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
                <label key={f.key} className="block space-y-1">
                  <span className={clubEventPortalLabelClass}>
                    {f.label}
                    {f.required ? <span className="text-rose-500"> *</span> : null}
                  </span>
                  {f.type === "choice" ? (
                    <select
                      className={clubEventPortalPublicFieldClass}
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
                      className={clubEventPortalPublicTextareaClass}
                      value={answers[f.key] ?? ""}
                      onChange={(e) => setAnswers((a) => ({ ...a, [f.key]: e.target.value }))}
                      disabled={submitting}
                    />
                  )}
                </label>
              ),
            )}

            {link.type === "PAYMENT" ? (
              <div className={clubEventPortalInsetPanelClass}>
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
              </div>
            ) : null}

            <button
              type="button"
              className={cn(clubEventPortalPrimaryBtnClass, "w-full sm:w-auto sm:min-w-[12rem]")}
              disabled={submitting}
              onClick={() => void submit()}
            >
              {submitting ? "กำลังส่ง…" : link.type === "PAYMENT" ? "ยืนยันการชำระ / ส่งข้อมูล" : "ส่งคำตอบ"}
            </button>
          </div>
        </ClubEventPortalSection>
      </main>
    </>,
  );
}

function ClubEventExternalRedirect({ url }: { url: string }) {
  useEffect(() => {
    window.location.href = url;
  }, [url]);
  return null;
}
