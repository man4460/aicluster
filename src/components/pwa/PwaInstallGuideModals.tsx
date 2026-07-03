"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { usePwaInstall } from "@/components/pwa/pwa-install-context";
import { MAWELL_PWA_ICON_192 } from "@/lib/pwa/brand-assets";

function GuideShell({
  titleId,
  title,
  subtitle,
  steps,
  buttonLabel,
  buttonClassName,
  onClose,
}: {
  titleId: string;
  title: string;
  subtitle: string;
  steps: ReactNode[];
  buttonLabel: string;
  buttonClassName: string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[240] flex items-end justify-center bg-black/55 p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-[2rem] border border-white/70 bg-gradient-to-b from-white/95 via-[#f5f3ff] to-[#eef1ff] p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <Image
            src={MAWELL_PWA_ICON_192}
            alt=""
            width={56}
            height={56}
            className="h-14 w-14 shrink-0 rounded-2xl shadow-lg"
            unoptimized
          />
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-bold text-[#1f2240]">
              {title}
            </h2>
            <p className="mt-1 text-sm text-[#66638c]">{subtitle}</p>
          </div>
        </div>

        <ol className="mt-5 space-y-3 text-sm text-[#3a3666]">
          {steps.map((step, index) => (
            <li
              key={index}
              className="flex gap-3 rounded-2xl border border-white/80 bg-white/70 px-3 py-3"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#5b61ff]/15 text-xs font-bold text-[#4d47b6]">
                {index + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>

        <button type="button" onClick={onClose} className={buttonClassName}>
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}

/** โมดัลคู่มือติดตั้ง — แยก iPhone / iPad / Android (เทียบ MelodyWebapp) */
export function PwaInstallGuideModals() {
  const { iosGuideOpen, androidGuideOpen, isIpad, setIosGuideOpen, setAndroidGuideOpen } =
    usePwaInstall();

  const iosSteps = isIpad
    ? [
        <>
          กดปุ่ม <strong className="text-[#1f2240]">แชร์</strong> มุมขวาบนของ Safari
        </>,
        <>
          เลือก <strong className="text-[#1f2240]">Add to Home Screen</strong> หรือ{" "}
          <strong className="text-[#1f2240]">เพิ่มที่หน้าจอโฮม</strong>
        </>,
        <>
          กด <strong className="text-[#1f2240]">Add / เพิ่ม</strong> แล้วเปิดจากไอคอน MAWELL บนหน้าจอโฮม
        </>,
      ]
    : [
        <>
          กดปุ่ม <strong className="text-[#1f2240]">แชร์</strong> ด้านล่าง Safari
        </>,
        <>
          เลือก <strong className="text-[#1f2240]">Add to Home Screen</strong> หรือ{" "}
          <strong className="text-[#1f2240]">เพิ่มที่หน้าจอโฮม</strong>
        </>,
        <>
          กด <strong className="text-[#1f2240]">Add / เพิ่ม</strong> แล้วเปิดจากไอคอน MAWELL
        </>,
      ];

  return (
    <>
      {iosGuideOpen ? (
        <GuideShell
          titleId="pwa-ios-guide-title"
          title="ติดตั้ง MAWELL บนหน้าจอโฮม"
          subtitle={
            isIpad
              ? "iPad — เปิดแบบแอปเต็มจอ ไม่มีแถบ URL"
              : "iPhone — เปิดแบบแอปเต็มจอ ไม่มีแถบ URL"
          }
          steps={iosSteps}
          buttonLabel="เข้าใจแล้ว"
          buttonClassName="mt-5 min-h-[48px] w-full rounded-2xl bg-gradient-to-b from-[#5f63ff] to-[#4d47b6] px-4 py-3 text-sm font-semibold text-white"
          onClose={() => setIosGuideOpen(false)}
        />
      ) : null}

      {androidGuideOpen ? (
        <GuideShell
          titleId="pwa-android-guide-title"
          title="ติดตั้ง MAWELL บนหน้าจอโฮม"
          subtitle="Chrome / Edge บน Android"
          steps={[
            <>
              กดเมนู <strong className="text-[#1f2240]">⋮</strong> มุมขวาบนของ Chrome
            </>,
            <>
              เลือก <strong className="text-[#1f2240]">ติดตั้งแอป</strong> หรือ{" "}
              <strong className="text-[#1f2240]">Add to Home screen</strong>
            </>,
            <>
              กด <strong className="text-[#1f2240]">ติดตั้ง / Install</strong> แล้วเปิดจากไอคอน MAWELL
            </>,
          ]}
          buttonLabel="เข้าใจแล้ว"
          buttonClassName="mt-5 min-h-[48px] w-full rounded-2xl bg-gradient-to-b from-emerald-500 to-emerald-600 px-4 py-3 text-sm font-semibold text-white"
          onClose={() => setAndroidGuideOpen(false)}
        />
      ) : null}
    </>
  );
}
