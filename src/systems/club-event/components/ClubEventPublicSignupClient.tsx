"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import {
  AppGalleryCameraFileInputs,
  AppImageLightbox,
  AppImagePickCameraButtons,
  AppImageThumb,
  AppPublicCheckInGlassPage,
  appSafeAreaPortalHeaderClass,
  appSafeAreaPortalHeroTopPadClass,
  prepareImageFileForUpload,
  useAppCameraCapture,
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
import { CLUB_EVENT_PORTAL_SAMPLE_BANNER } from "@/systems/club-event/lib/portal-media";
import type { ClubPortalSignupCollectDues } from "@/systems/club-event/lib/portal-signup";
import {
  clubEventOutlineButtonClass,
  clubEventPortalFlatBlockClass,
  clubEventPortalHeaderNavOnLightLinkClass,
  clubEventPortalHeaderNavOnLightShellClass,
  clubEventPortalHeroCompactShellClass,
  clubEventPortalLabelClass,
  clubEventPortalPrimaryBtnClass,
  clubEventPortalPublicFieldClass,
  clubEventPortalShopNameClass,
  clubEventPortalShopNameHeroClass,
} from "@/systems/club-event/lib/ui-tokens";

export type ClubPublicSignupPayload = {
  ownerId: string;
  clubName: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  slug: string;
  tagline: string | null;
  paymentRulesNote: string;
  signupEnabled: boolean;
  collectDues: ClubPortalSignupCollectDues;
  dues: { amountBaht: number; periodKey: string; periodLabel: string } | null;
};

export function ClubEventPublicSignupClient({
  slug,
  trialParam,
  initialData,
}: {
  slug: string;
  trialParam?: string;
  initialData: ClubPublicSignupPayload;
}) {
  const notice = useAppNoticePopup();
  const lb = useAppImageLightbox();
  const photoGalleryRef = useRef<HTMLInputElement>(null);
  const { openCamera, cameraInputRef, cameraModal } = useAppCameraCapture({ title: "ถ่ายรูปสมาชิก" });

  const data = initialData;
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [nickname, setNickname] = useState("");
  const [gender, setGender] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [social, setSocial] = useState("");
  const [position, setPosition] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [dataConsent, setDataConsent] = useState(false);
  const [payDuesNow, setPayDuesNow] = useState(data.collectDues === "REQUIRED");
  const [method, setMethod] = useState<ClubEventPublicPayMethod>("PROMPTPAY");
  const [slipUrl, setSlipUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [duesPaid, setDuesPaid] = useState(false);

  const title = data.clubName.trim() || "ชมรม";
  const banner = data.bannerUrl?.trim() || CLUB_EVENT_PORTAL_SAMPLE_BANNER;
  const homeHref = trialParam
    ? `/club/${encodeURIComponent(slug)}?t=${encodeURIComponent(trialParam)}`
    : `/club/${encodeURIComponent(slug)}`;

  const showDuesBlock = data.collectDues !== "OFF" && data.dues && data.dues.amountBaht > 0;
  const mustPay = data.collectDues === "REQUIRED";
  const willPay = Boolean(showDuesBlock && (mustPay || payDuesNow));
  const amountBaht = willPay && data.dues ? data.dues.amountBaht : 0;

  useEffect(() => {
    setPayDuesNow(data.collectDues === "REQUIRED");
  }, [data.collectDues]);

  const scrollToForm = useCallback(() => {
    document.getElementById("signup-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  async function uploadPhoto(file: File | null) {
    if (!file || submitting) return;
    setPhotoBusy(true);
    try {
      const prepared = await prepareImageFileForUpload(file);
      const form = new FormData();
      form.set("ownerId", data.ownerId);
      form.set("file", prepared);
      const res = await fetch("/api/club-event/public/upload-slip", { method: "POST", body: form });
      const j = (await res.json().catch(() => ({}))) as { imageUrl?: string; error?: string };
      if (!res.ok || !j.imageUrl) throw new Error(j.error ?? "อัปโหลดรูปไม่สำเร็จ");
      setPhotoUrl(j.imageUrl);
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "อัปโหลดรูปไม่สำเร็จ");
    } finally {
      setPhotoBusy(false);
    }
  }

  function onPhotoInputChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    e.target.value = "";
    void uploadPhoto(file);
  }

  const submitBlocked = useMemo(() => {
    if (!firstName.trim() || phone.replace(/\D/g, "").length < 9 || !dataConsent) return true;
    if (willPay && clubEventPublicPayBlocked(method, amountBaht, slipUrl)) return true;
    return false;
  }, [amountBaht, dataConsent, firstName, method, phone, slipUrl, willPay]);

  async function submit() {
    if (submitBlocked || submitting) return;
    setSubmitting(true);
    try {
      const qs = trialParam ? `?t=${encodeURIComponent(trialParam)}` : "";
      const res = await fetch(`/api/club-event/public/${encodeURIComponent(slug)}/signup${qs}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          nickname: nickname.trim(),
          gender,
          phone,
          email: email.trim(),
          social: social.trim(),
          position: position.trim(),
          photoUrl,
          dataConsent,
          payDuesNow: willPay,
          paymentMethod: willPay ? method : undefined,
          slipUrl: willPay ? slipUrl : undefined,
        }),
      });
      const j = (await res.json().catch(() => ({}))) as {
        error?: string;
        duesPaid?: boolean;
      };
      if (!res.ok) throw new Error(j.error ?? "สมัครไม่สำเร็จ");
      setDuesPaid(Boolean(j.duesPaid));
      setDone(true);
      notice.success(j.duesPaid ? "สมัครและชำระค่าบำรุงสำเร็จ" : "สมัครสมาชิกสำเร็จ");
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "สมัครไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  }

  const shell = (children: ReactNode) => (
    <AppPublicCheckInGlassPage className="!px-0 !pt-0 sm:!px-0">
      {notice.popup}
      {cameraModal}
      {children}
      <AppImageLightbox src={lb.src} onClose={lb.close} alt="รูป" />
    </AppPublicCheckInGlassPage>
  );

  if (done) {
    return shell(
      <>
        <header className={appSafeAreaPortalHeaderClass}>
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
            <a href={homeHref} className={clubEventPortalHeaderNavOnLightLinkClass()}>
              กลับเว็บชมรม
            </a>
          </div>
        </header>
        <main className="relative z-10 mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className={cn(clubEventPortalFlatBlockClass, "space-y-3 text-center")}>
            <h1 className="text-2xl font-black text-[#1e1b4b]">สมัครสมาชิกเรียบร้อย</h1>
            <p className="text-sm font-semibold text-[#66638c]">
              {duesPaid
                ? "บันทึกข้อมูลและรับชำระค่าบำรุงแล้ว"
                : showDuesBlock
                  ? "บันทึกข้อมูลแล้ว — สามารถชำระค่าบำรุงทีหลังได้"
                  : "บันทึกข้อมูลสมาชิกแล้ว"}
            </p>
            <a href={homeHref} className={cn(clubEventPortalPrimaryBtnClass, "inline-flex")}>
              กลับเว็บชมรม
            </a>
          </div>
        </main>
      </>,
    );
  }

  return shell(
    <>
      <header className={appSafeAreaPortalHeaderClass}>
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <a href={homeHref} className="flex min-w-0 items-center gap-2 sm:gap-3" aria-label={title}>
            {data.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={data.logoUrl}
                alt=""
                className="h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-white/70 shadow-sm"
              />
            ) : (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/90 text-xs font-black text-[#0000BF] shadow-sm ring-2 ring-white/70">
                {(title || "C").slice(0, 1)}
              </span>
            )}
            <p className={cn("hidden truncate text-sm sm:block sm:text-base", clubEventPortalShopNameClass)}>
              {title}
            </p>
          </a>
          <nav className={clubEventPortalHeaderNavOnLightShellClass} aria-label="เมนู">
            <a href={homeHref} className={clubEventPortalHeaderNavOnLightLinkClass()}>
              กลับเว็บชมรม
            </a>
            <button type="button" className={clubEventPortalHeaderNavOnLightLinkClass()} onClick={scrollToForm}>
              กรอกฟอร์ม
            </button>
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
        <div
          className={cn(
            "relative z-10 mx-auto flex min-h-[42vh] max-w-6xl flex-col justify-end px-4 pb-8 sm:min-h-[50vh] sm:px-6 sm:pb-10",
            appSafeAreaPortalHeroTopPadClass,
          )}
        >
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#5f5a8a] drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)]">
              สมัครสมาชิก
            </p>
            <h1 className={cn("mt-1 text-3xl sm:text-4xl", clubEventPortalShopNameHeroClass)}>{title}</h1>
            {data.tagline ? (
              <p className="mt-2 text-sm font-semibold text-[#3f3a6a] drop-shadow-[0_1px_2px_rgba(255,255,255,0.85)] sm:text-base">
                {data.tagline}
              </p>
            ) : null}
          </div>
          <div id="hero-cta" className={clubEventPortalHeroCompactShellClass}>
            <button type="button" className={clubEventPortalPrimaryBtnClass} onClick={scrollToForm}>
              กรอกแบบฟอร์มสมัคร
            </button>
          </div>
        </div>
      </section>

      <main className="relative z-10 mx-auto max-w-6xl space-y-12 px-4 pb-16 pt-2 sm:space-y-14 sm:px-6">
        <ClubEventPortalSection id="signup-form" title="แบบฟอร์มสมัครสมาชิก" titleIcon="contact">
          <div className={cn(clubEventPortalFlatBlockClass, "space-y-4")}>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1">
                <span className={clubEventPortalLabelClass}>
                  ชื่อ<span className="text-rose-500"> *</span>
                </span>
                <input
                  className={clubEventPortalPublicFieldClass}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={submitting}
                  autoComplete="given-name"
                  required
                />
              </label>
              <label className="block space-y-1">
                <span className={clubEventPortalLabelClass}>นามสกุล</span>
                <input
                  className={clubEventPortalPublicFieldClass}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={submitting}
                  autoComplete="family-name"
                />
              </label>
              <label className="block space-y-1">
                <span className={clubEventPortalLabelClass}>ชื่อเล่น</span>
                <input
                  className={clubEventPortalPublicFieldClass}
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  disabled={submitting}
                />
              </label>
              <label className="block space-y-1">
                <span className={clubEventPortalLabelClass}>เพศ</span>
                <select
                  className={clubEventPortalPublicFieldClass}
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  disabled={submitting}
                >
                  <option value="">— ไม่ระบุ —</option>
                  <option value="MALE">ชาย</option>
                  <option value="FEMALE">หญิง</option>
                  <option value="OTHER">อื่น ๆ</option>
                </select>
              </label>
              <label className="block space-y-1 sm:col-span-2">
                <span className={clubEventPortalLabelClass}>
                  เบอร์โทร<span className="text-rose-500"> *</span>
                </span>
                <input
                  className={clubEventPortalPublicFieldClass}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="08x-xxx-xxxx"
                  inputMode="tel"
                  autoComplete="tel"
                  disabled={submitting}
                  required
                />
              </label>
              <label className="block space-y-1">
                <span className={clubEventPortalLabelClass}>อีเมล</span>
                <input
                  className={clubEventPortalPublicFieldClass}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  autoComplete="email"
                  disabled={submitting}
                />
              </label>
              <label className="block space-y-1">
                <span className={clubEventPortalLabelClass}>โซเชียล / LINE</span>
                <input
                  className={clubEventPortalPublicFieldClass}
                  value={social}
                  onChange={(e) => setSocial(e.target.value)}
                  disabled={submitting}
                />
              </label>
              <label className="block space-y-1 sm:col-span-2">
                <span className={clubEventPortalLabelClass}>ตำแหน่ง / บทบาท</span>
                <input
                  className={clubEventPortalPublicFieldClass}
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  disabled={submitting}
                />
              </label>
            </div>

            <div className="space-y-2">
              <span className={clubEventPortalLabelClass}>รูปสมาชิก (ไม่บังคับ)</span>
              <div className="flex flex-wrap items-center gap-3">
                <AppImageThumb
                  src={photoUrl}
                  alt="รูปสมาชิก"
                  onOpen={() => photoUrl && lb.open(photoUrl)}
                  emptyLabel="ยังไม่มีรูป"
                  className="h-20 w-20"
                />
                <AppImagePickCameraButtons
                  onPickGallery={() => photoGalleryRef.current?.click()}
                  onPickCamera={() => openCamera((file) => void uploadPhoto(file))}
                  disabled={submitting || photoBusy}
                  busy={photoBusy}
                  buttonClassName={clubEventOutlineButtonClass}
                />
              </div>
              <AppGalleryCameraFileInputs
                galleryInputRef={photoGalleryRef}
                cameraInputRef={cameraInputRef}
                onChange={onPhotoInputChange}
              />
            </div>

            <label className="flex min-h-[48px] cursor-pointer items-start gap-3 rounded-2xl border border-slate-100 bg-white/80 px-3 py-2.5">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-slate-300 text-[#5b61ff] focus:ring-[#5b61ff]"
                checked={dataConsent}
                disabled={submitting}
                onChange={(e) => setDataConsent(e.target.checked)}
              />
              <span className="min-w-0 text-sm font-semibold text-[#1e1b4b]">
                ยินยอมให้ชมรมเก็บข้อมูลส่วนบุคคลเพื่อการเป็นสมาชิก
                <span className="text-rose-500"> *</span>
              </span>
            </label>

            {showDuesBlock && data.dues ? (
              <div className="space-y-3">
                {data.collectDues === "OPTIONAL" ? (
                  <label className="flex min-h-[48px] cursor-pointer items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-3 py-2.5">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-[#5b61ff] focus:ring-[#5b61ff]"
                      checked={payDuesNow}
                      disabled={submitting}
                      onChange={(e) => setPayDuesNow(e.target.checked)}
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-black text-[#1e1b4b]">
                        ชำระค่าบำรุงตอนนี้ · {data.dues.periodLabel}
                      </span>
                      <span className="block text-[11px] font-semibold text-[#66638c]">
                        ฿{data.dues.amountBaht.toLocaleString("th-TH")} — ไม่ติ๊กก็สมัครก่อน แล้วชำระทีหลังได้
                      </span>
                    </span>
                  </label>
                ) : (
                  <div className="rounded-2xl border border-amber-100 bg-amber-50/80 px-3 py-2.5">
                    <p className="text-sm font-black text-[#1e1b4b]">
                      ต้องชำระค่าบำรุง · {data.dues.periodLabel}
                    </p>
                    <p className="text-[11px] font-semibold text-[#66638c]">
                      ฿{data.dues.amountBaht.toLocaleString("th-TH")}
                    </p>
                  </div>
                )}

                {willPay ? (
                  <ClubEventPublicPaymentPanel
                    ownerId={data.ownerId}
                    amountBaht={amountBaht}
                    method={method}
                    slipUrl={slipUrl}
                    onMethodChange={setMethod}
                    onSlipUrlChange={setSlipUrl}
                    paymentRulesNote={data.paymentRulesNote}
                    disabled={submitting}
                    trialParam={trialParam}
                  />
                ) : null}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                className={clubEventPortalPrimaryBtnClass}
                disabled={submitBlocked || submitting}
                onClick={() => void submit()}
              >
                {submitting ? "กำลังบันทึก…" : willPay ? "สมัครและชำระ" : "สมัครสมาชิก"}
              </button>
              <a href={homeHref} className={cn(clubEventOutlineButtonClass, "inline-flex items-center")}>
                ยกเลิก
              </a>
            </div>
          </div>
        </ClubEventPortalSection>
      </main>
    </>,
  );
}
