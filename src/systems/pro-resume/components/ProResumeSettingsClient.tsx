"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppNoticePopup } from "@/components/app-templates";
import { ModuleMonthlyUpgradeCta } from "@/components/dashboard/ModuleMonthlyUpgradeCta";
import { ModulePublicLinkQrPanel } from "@/components/qr/module-public-link-qr-panel";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import { PRO_RESUME_MODULE_SLUG } from "@/lib/modules/config";
import { TRIAL_PROD_SCOPE } from "@/lib/trial/constants";
import { ProResumePagePanel } from "@/systems/pro-resume/components/ProResumePagePanel";
import type { ResumeProfileDto } from "@/systems/pro-resume/lib/mappers";
import { proResumePageTitleIcon, proResumePageTitleTone } from "@/systems/pro-resume/lib/page-menu-icons";
import {
  proResumeFieldClass,
  proResumeOutlineButtonClass,
  proResumePrimaryButtonClass,
} from "@/systems/pro-resume/lib/ui-tokens";

const labelClass = "block space-y-1 text-xs font-bold text-[#4d47b6]";

function absoluteUrl(path: string): string {
  if (typeof window === "undefined") return path;
  return `${window.location.origin}${path.startsWith("/") ? path : `/${path}`}`;
}

export function ProResumeSettingsClient({
  initialProfile,
  hasMonthly,
  trialSessionId = TRIAL_PROD_SCOPE,
}: {
  initialProfile: ResumeProfileDto;
  hasMonthly: boolean;
  trialSessionId?: string;
}) {
  const notice = useAppNoticePopup();
  const router = useRouter();
  const [form, setForm] = useState(initialProfile);
  const [saving, setSaving] = useState(false);
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);
  const [monthlyOk, setMonthlyOk] = useState(hasMonthly);

  const publicAbsoluteUrl = useMemo(() => absoluteUrl(form.publicUrl), [form.publicUrl]);
  const canShare = monthlyOk;

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/pro-resume/session/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: form.slug,
          publicEnabled: form.publicEnabled,
        }),
      });
      const data = (await res.json()) as { profile?: ResumeProfileDto; error?: string };
      if (!res.ok) throw new Error(data.error ?? "บันทึกไม่สำเร็จ");
      if (data.profile) setForm(data.profile);
      notice.success("บันทึกแล้ว");
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const copyLink = async () => {
    if (!canShare) {
      setPremiumModalOpen(true);
      return;
    }
    try {
      await navigator.clipboard.writeText(publicAbsoluteUrl);
      notice.success("คัดลอกลิงก์แล้ว");
    } catch {
      notice.error("คัดลอกไม่สำเร็จ");
    }
  };

  const openPreview = async () => {
    if (!canShare) {
      setPremiumModalOpen(true);
      return;
    }
    if (!form.publicEnabled) {
      notice.error("เปิดเผยแพร่ก่อนเพื่อดูตัวอย่าง");
      return;
    }
    let copied = false;
    try {
      await navigator.clipboard.writeText(publicAbsoluteUrl);
      copied = true;
    } catch {
      /* เปิดตัวอย่างได้แม้คัดลอกไม่สำเร็จ */
    }
    window.open(form.publicUrl, "_blank", "noopener,noreferrer");
    if (copied) {
      notice.success("เปิดตัวอย่างและคัดลอกลิงก์แชร์แล้ว");
    }
  };

  return (
    <>
      {notice.popup}
      <ProResumePagePanel
        title="ตั้งค่า"
        titleIcon={proResumePageTitleIcon("settings")}
        titleTone={proResumePageTitleTone("settings")}
        action={
          <button type="button" className={proResumePrimaryButtonClass} disabled={saving} onClick={() => void saveProfile()}>
            บันทึก
          </button>
        }
      >
        <div className="space-y-4">
          <label className={labelClass}>
            Slug (URL สาธารณะ)
            <input
              className={proResumeFieldClass}
              value={form.slug}
              disabled={saving}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))}
            />
          </label>
          <p className="text-xs text-[#66638c]">ลิงก์สาธารณะ: /resume/{form.slug}</p>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-slate-300 text-[#0000BF] focus:ring-[#0000BF]/30"
              checked={form.publicEnabled}
              disabled={saving}
              onChange={(e) => setForm((f) => ({ ...f, publicEnabled: e.target.checked }))}
            />
            <span>
              <span className="block text-sm font-bold text-[#1e1b4b]">เปิดเผยแพร่โปรไฟล์</span>
              <span className="mt-0.5 block text-xs font-semibold text-[#66638c]">เมื่อเปิด ผู้เยี่ยมชมเข้า /resume/{form.slug} ได้</span>
            </span>
          </label>

          <div className="space-y-2 rounded-lg border border-slate-200/90 bg-slate-50/80 p-3">
            <p className="text-xs font-black text-[#4d47b6]">ตัวอย่าง / แชร์ลิงก์</p>
            <p className="break-all text-sm font-semibold text-[#1e1b4b]">{form.publicUrl}</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={cn(proResumeOutlineButtonClass, !canShare && "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 opacity-80")}
                onClick={() => void openPreview()}
                aria-disabled={!canShare}
              >
                เปิดตัวอย่าง
              </button>
              <button
                type="button"
                className={cn(proResumeOutlineButtonClass, !canShare && "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 opacity-80")}
                onClick={() => void copyLink()}
                aria-disabled={!canShare}
              >
                คัดลอกลิงก์
              </button>
            </div>
            {!monthlyOk ? (
              <ModuleMonthlyUpgradeCta
                moduleSlug={PRO_RESUME_MODULE_SLUG}
                benefit="แพ็กฟรี — เปิดตัวอย่าง / แชร์ลิงก์ / QR ต้องอัปเกรดรายเดือน"
                onUpgraded={() => {
                  setMonthlyOk(true);
                  setPremiumModalOpen(false);
                  router.refresh();
                }}
              />
            ) : null}
          </div>

          {canShare ? (
            <ModulePublicLinkQrPanel
              moduleSlug={PRO_RESUME_MODULE_SLUG}
              pageUrl={publicAbsoluteUrl}
              shopLabel={form.fullName || "Resume"}
              logoUrl={form.profileImageUrl}
              trialExportBlocked={trialSessionId !== TRIAL_PROD_SCOPE}
              tagline="สแกนเพื่อดูเรซูเม่และพอร์ตโฟลิโอ"
              mobileBannerText="สแกน QR หรือเปิดลิงก์เพื่อดูโปรไฟล์"
              openPrimaryLabel="เปิดโปรไฟล์"
              openSecondaryLabel="เปิดหน้า"
              qrAlt="QR เรซูเม่สาธารณะ"
              posterAlt="โปสเตอร์ QR เรซูเม่"
              downloadFilePrefix={`resume-${form.slug || "portal"}`}
            />
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-bold text-[#1e1b4b]">QR / โปสเตอร์แชร์</p>
              <ModuleMonthlyUpgradeCta
                moduleSlug={PRO_RESUME_MODULE_SLUG}
                benefit="แพ็กฟรี — เปิดตัวอย่าง / แชร์ลิงก์ / QR ต้องอัปเกรดรายเดือน"
                onUpgraded={() => {
                  setMonthlyOk(true);
                  setPremiumModalOpen(false);
                  router.refresh();
                }}
              />
            </div>
          )}
        </div>
      </ProResumePagePanel>

      <FormModal
        open={premiumModalOpen}
        onClose={() => setPremiumModalOpen(false)}
        title="อัปเกรดแพ็กรายเดือน"
        size="sm"
        footer={
          <FormModalFooterActions
            onCancel={() => setPremiumModalOpen(false)}
            cancelLabel="ปิด"
            submitLabel="ปิด"
            onSubmit={() => setPremiumModalOpen(false)}
          />
        }
      >
        <ModuleMonthlyUpgradeCta
          moduleSlug={PRO_RESUME_MODULE_SLUG}
          benefit="แพ็กฟรี — เปิดตัวอย่าง / แชร์ลิงก์ / QR ต้องอัปเกรดรายเดือน"
          onUpgraded={() => {
            setMonthlyOk(true);
            setPremiumModalOpen(false);
            router.refresh();
          }}
        />
      </FormModal>
    </>
  );
}
