"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AppImageLightbox,
  AppImageThumb,
  AppPickGalleryImageButton,
  AppTakePhotoButton,
  prepareImageFileForUpload,
  useAppCameraCapture,
  useAppImageLightbox,
  useAppNoticePopup,
} from "@/components/app-templates";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import {
  assetRowEditIconButtonClass,
  assetRowRemoveIconButtonClass,
  IconRowEdit,
  IconRowRemove,
} from "@/systems/asset/components/AssetRowActionIcons";
import { ProResumePagePanel } from "@/systems/pro-resume/components/ProResumePagePanel";
import {
  proResumeCardIconTileClass,
  proResumeTonedRowCardClass,
} from "@/systems/pro-resume/lib/card-tones";
import type {
  ResumeCertificateDto,
  ResumeEducationDto,
  ResumeExperienceDto,
  ResumeProfileDto,
} from "@/systems/pro-resume/lib/mappers";
import { proResumePageTitleIcon, proResumePageTitleTone, proResumeSectionIcon } from "@/systems/pro-resume/lib/page-menu-icons";
import {
  proResumeFieldClass,
  proResumePrimaryButtonClass,
  proResumeRowIconButtonClass,
  proResumeTextareaClass,
} from "@/systems/pro-resume/lib/ui-tokens";

const UPLOAD = "/api/pro-resume/session/upload";
const labelClass = "block space-y-1 text-xs font-bold text-[#4d47b6]";

function ReorderButtons({
  index,
  total,
  onUp,
  onDown,
  label,
}: {
  index: number;
  total: number;
  onUp: () => void;
  onDown: () => void;
  label: string;
}) {
  return (
    <div className="flex shrink-0 flex-col gap-0.5">
      <button
        type="button"
        className={proResumeRowIconButtonClass}
        disabled={index === 0}
        aria-label={`เลื่อนขึ้น ${label}`}
        title="เลื่อนขึ้น"
        onClick={onUp}
      >
        ↑
      </button>
      <button
        type="button"
        className={proResumeRowIconButtonClass}
        disabled={index >= total - 1}
        aria-label={`เลื่อนลง ${label}`}
        title="เลื่อนลง"
        onClick={onDown}
      >
        ↓
      </button>
    </div>
  );
}

export function ProResumeProfileClient({ initialProfile }: { initialProfile: ResumeProfileDto }) {
  const notice = useAppNoticePopup();
  const lb = useAppImageLightbox();
  const profileGalleryRef = useRef<HTMLInputElement>(null);
  const profileCamera = useAppCameraCapture();
  const [profile, setProfile] = useState(initialProfile);
  const [saving, setSaving] = useState(false);
  const [educations, setEducations] = useState<ResumeEducationDto[]>([]);
  const [experiences, setExperiences] = useState<ResumeExperienceDto[]>([]);
  const [certificates, setCertificates] = useState<ResumeCertificateDto[]>([]);

  const [eduModal, setEduModal] = useState<ResumeEducationDto | "new" | null>(null);
  const [expModal, setExpModal] = useState<ResumeExperienceDto | "new" | null>(null);
  const [certModal, setCertModal] = useState<ResumeCertificateDto | "new" | null>(null);

  const loadAll = useCallback(async () => {
    try {
      const [e, x, c] = await Promise.all([
        fetch("/api/pro-resume/session/educations").then((r) => r.json()),
        fetch("/api/pro-resume/session/experiences").then((r) => r.json()),
        fetch("/api/pro-resume/session/certificates").then((r) => r.json()),
      ]);
      setEducations(e.educations ?? []);
      setExperiences(x.experiences ?? []);
      setCertificates(c.certificates ?? []);
    } catch {
      notice.error("โหลดรายการไม่สำเร็จ");
    }
  }, [notice]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/pro-resume/session/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const data = (await res.json()) as { profile?: ResumeProfileDto; error?: string };
      if (!res.ok) throw new Error(data.error ?? "บันทึกไม่สำเร็จ");
      if (data.profile) setProfile(data.profile);
      notice.success("บันทึกโปรไฟล์แล้ว");
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const uploadProfileImage = async (file: File) => {
    setSaving(true);
    try {
      const prepared = await prepareImageFileForUpload(file);
      const fd = new FormData();
      fd.set("file", prepared);
      fd.set("kind", "profiles");
      const res = await fetch(UPLOAD, { method: "POST", body: fd });
      const data = (await res.json()) as { imageUrl?: string; error?: string };
      if (!res.ok || !data.imageUrl) throw new Error(data.error ?? "อัปโหลดไม่สำเร็จ");
      setProfile((p) => ({ ...p, profileImageUrl: data.imageUrl! }));
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "อัปโหลดไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const reorder = async (
    kind: "educations" | "experiences" | "certificates",
    ids: string[],
  ) => {
    const res = await fetch(`/api/pro-resume/session/${kind}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds: ids }),
    });
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      throw new Error(data.error ?? "จัดลำดับไม่สำเร็จ");
    }
    await loadAll();
  };

  const moveItem = async (
    kind: "educations" | "experiences" | "certificates",
    list: { id: string }[],
    index: number,
    dir: -1 | 1,
  ) => {
    const next = [...list];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j]!, next[index]!];
    try {
      await reorder(
        kind,
        next.map((r) => r.id),
      );
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "จัดลำดับไม่สำเร็จ");
    }
  };

  const deleteRow = async (kind: "educations" | "experiences" | "certificates", id: string, name: string) => {
    const ok = await notice.confirm(`ลบ «${name}» ใช่หรือไม่?`);
    if (!ok) return;
    const res = await fetch(`/api/pro-resume/session/${kind}/${id}`, { method: "DELETE" });
    if (!res.ok) {
      notice.error("ลบไม่สำเร็จ");
      return;
    }
    await loadAll();
  };

  return (
    <>
      {notice.popup}
      <AppImageLightbox src={lb.src} onClose={lb.close} alt="รูปโปรไฟล์" />

      <ProResumePagePanel
        title="โปรไฟล์"
        titleIcon={proResumePageTitleIcon("profile")}
        titleTone={proResumePageTitleTone("profile")}
        action={
          <button type="button" className={proResumePrimaryButtonClass} disabled={saving} onClick={() => void saveProfile()}>
            บันทึก
          </button>
        }
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
          <div className="space-y-3">
            <label className={labelClass}>
              ชื่อ-นามสกุล
              <input className={proResumeFieldClass} value={profile.fullName} onChange={(e) => setProfile((p) => ({ ...p, fullName: e.target.value }))} />
            </label>
            <label className={labelClass}>
              ตำแหน่ง / หัวข้อ
              <input className={proResumeFieldClass} value={profile.positionTitle} onChange={(e) => setProfile((p) => ({ ...p, positionTitle: e.target.value }))} />
            </label>
            <label className={labelClass}>
              เกี่ยวกับตัวเอง
              <textarea className={proResumeTextareaClass} value={profile.bio} onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))} />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className={labelClass}>
                อีเมล
                <input className={proResumeFieldClass} type="email" value={profile.contactEmail ?? ""} onChange={(e) => setProfile((p) => ({ ...p, contactEmail: e.target.value }))} />
              </label>
              <label className={labelClass}>
                โทรศัพท์
                <input className={proResumeFieldClass} value={profile.contactPhone ?? ""} onChange={(e) => setProfile((p) => ({ ...p, contactPhone: e.target.value }))} />
              </label>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <AppImageThumb
              src={profile.profileImageUrl}
              alt={profile.fullName}
              className="h-24 w-24 sm:h-28 sm:w-28"
              onOpen={() => profile.profileImageUrl && lb.open(profile.profileImageUrl)}
            />
            <AppPickGalleryImageButton
              disabled={saving}
              onClick={() => profileGalleryRef.current?.click()}
              className={proResumePrimaryButtonClass}
            >
              เลือกรูป
            </AppPickGalleryImageButton>
            <AppTakePhotoButton
              disabled={saving}
              onClick={() => profileCamera.openCamera((file) => void uploadProfileImage(file))}
              className={proResumePrimaryButtonClass}
            >
              ถ่ายรูป
            </AppTakePhotoButton>
            <input
              ref={profileGalleryRef}
              type="file"
              accept="image/*"
              className="sr-only"
              tabIndex={-1}
              aria-hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) void uploadProfileImage(file);
              }}
            />
            {profileCamera.cameraModal}
          </div>
        </div>

        <SectionList
          title="การศึกษา"
          tone="sky"
          icon={proResumeSectionIcon("education")}
          onAdd={() => setEduModal("new")}
          rows={educations.map((row, i) => (
            <li key={row.id} className={proResumeTonedRowCardClass("sky")}>
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <ReorderButtons
                  index={i}
                  total={educations.length}
                  label={row.degree}
                  onUp={() => void moveItem("educations", educations, i, -1)}
                  onDown={() => void moveItem("educations", educations, i, 1)}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-[#1e1b4b]">{row.degree}</p>
                  <p className="text-sm text-[#66638c]">{row.institution}</p>
                  {(row.startYear || row.endYear) && (
                    <p className="text-xs text-[#8b87b8]">
                      {row.startYear ?? "?"} – {row.endYear ?? "ปัจจุบัน"}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 gap-1 self-end sm:self-center">
                <button type="button" className={assetRowEditIconButtonClass} aria-label={`แก้ไข ${row.degree}`} title="แก้ไข" onClick={() => setEduModal(row)}>
                  <IconRowEdit className="h-4 w-4" />
                </button>
                <button type="button" className={assetRowRemoveIconButtonClass} aria-label={`ลบ ${row.degree}`} title="ลบ" onClick={() => void deleteRow("educations", row.id, row.degree)}>
                  <IconRowRemove className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        />

        <SectionList
          title="ประสบการณ์"
          tone="violet"
          icon={proResumeSectionIcon("experience")}
          onAdd={() => setExpModal("new")}
          rows={experiences.map((row, i) => (
            <li key={row.id} className={proResumeTonedRowCardClass("violet")}>
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <ReorderButtons
                  index={i}
                  total={experiences.length}
                  label={row.jobTitle}
                  onUp={() => void moveItem("experiences", experiences, i, -1)}
                  onDown={() => void moveItem("experiences", experiences, i, 1)}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-[#1e1b4b]">{row.jobTitle}</p>
                  <p className="text-sm text-[#66638c]">{row.company}</p>
                  <p className="text-xs text-[#8b87b8]">
                    {row.startDate || "?"} – {row.endDate || "ปัจจุบัน"}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 gap-1 self-end sm:self-center">
                <button type="button" className={assetRowEditIconButtonClass} aria-label={`แก้ไข ${row.jobTitle}`} title="แก้ไข" onClick={() => setExpModal(row)}>
                  <IconRowEdit className="h-4 w-4" />
                </button>
                <button type="button" className={assetRowRemoveIconButtonClass} aria-label={`ลบ ${row.jobTitle}`} title="ลบ" onClick={() => void deleteRow("experiences", row.id, row.jobTitle)}>
                  <IconRowRemove className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        />

        <SectionList
          title="ใบรับรอง"
          tone="emerald"
          icon={proResumeSectionIcon("certificate")}
          onAdd={() => setCertModal("new")}
          rows={certificates.map((row, i) => (
            <li key={row.id} className={proResumeTonedRowCardClass("emerald")}>
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <ReorderButtons
                  index={i}
                  total={certificates.length}
                  label={row.name}
                  onUp={() => void moveItem("certificates", certificates, i, -1)}
                  onDown={() => void moveItem("certificates", certificates, i, 1)}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-[#1e1b4b]">{row.name}</p>
                  <p className="text-sm text-[#66638c]">{row.issuedBy || "—"}</p>
                  {row.year ? <p className="text-xs text-[#8b87b8]">{row.year}</p> : null}
                </div>
                {row.fileUrl ? (
                  <AppImageThumb src={row.fileUrl} alt={row.name} onOpen={() => lb.open(row.fileUrl!)} />
                ) : null}
              </div>
              <div className="flex shrink-0 gap-1 self-end sm:self-center">
                <button type="button" className={assetRowEditIconButtonClass} aria-label={`แก้ไข ${row.name}`} title="แก้ไข" onClick={() => setCertModal(row)}>
                  <IconRowEdit className="h-4 w-4" />
                </button>
                <button type="button" className={assetRowRemoveIconButtonClass} aria-label={`ลบ ${row.name}`} title="ลบ" onClick={() => void deleteRow("certificates", row.id, row.name)}>
                  <IconRowRemove className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        />
      </ProResumePagePanel>

      <EducationModal open={eduModal !== null} row={eduModal} onClose={() => setEduModal(null)} onSaved={loadAll} notice={notice} />
      <ExperienceModal open={expModal !== null} row={expModal} onClose={() => setExpModal(null)} onSaved={loadAll} notice={notice} />
      <CertificateModal open={certModal !== null} row={certModal} onClose={() => setCertModal(null)} onSaved={loadAll} notice={notice} lb={lb} />
    </>
  );
}

function SectionList({
  title,
  tone,
  icon,
  onAdd,
  rows,
}: {
  title: string;
  tone: "sky" | "violet" | "emerald";
  icon: React.ReactNode;
  onAdd: () => void;
  rows: React.ReactNode[];
}) {
  return (
    <div className="space-y-2 border-t border-slate-200/80 pt-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-bold text-[#1e1b4b]">
          <span className={proResumeCardIconTileClass(tone, "md")} aria-hidden>
            {icon}
          </span>
          {title}
        </h3>
        <button type="button" className={proResumePrimaryButtonClass} onClick={onAdd} aria-label={`เพิ่ม${title}`}>
          + <span className="hidden sm:inline">เพิ่ม</span>
        </button>
      </div>
      {rows.length ? <ul className="space-y-2">{rows}</ul> : <p className="text-sm text-[#66638c]">ยังไม่มีรายการ</p>}
    </div>
  );
}

function EducationModal({
  open,
  row,
  onClose,
  onSaved,
  notice,
}: {
  open: boolean;
  row: ResumeEducationDto | "new" | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
  notice: ReturnType<typeof useAppNoticePopup>;
}) {
  const [form, setForm] = useState({ degree: "", institution: "", startYear: "", endYear: "", description: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (row && row !== "new") {
      setForm({
        degree: row.degree,
        institution: row.institution,
        startYear: row.startYear?.toString() ?? "",
        endYear: row.endYear?.toString() ?? "",
        description: row.description,
      });
    } else {
      setForm({ degree: "", institution: "", startYear: "", endYear: "", description: "" });
    }
  }, [open, row]);

  const submit = async () => {
    setBusy(true);
    try {
      const payload = {
        degree: form.degree,
        institution: form.institution,
        startYear: form.startYear ? Number(form.startYear) : null,
        endYear: form.endYear ? Number(form.endYear) : null,
        description: form.description,
      };
      const isEdit = row && row !== "new";
      const res = await fetch(isEdit ? `/api/pro-resume/session/educations/${row.id}` : "/api/pro-resume/session/educations", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "บันทึกไม่สำเร็จ");
      onClose();
      await onSaved();
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={row === "new" ? "เพิ่มการศึกษา" : "แก้ไขการศึกษา"}
      size="md"
      footer={<FormModalFooterActions onCancel={onClose} onSubmit={() => void submit()} submitLabel="บันทึก" loading={busy} submitDisabled={!form.degree.trim() || !form.institution.trim()} />}
    >
      <div className="space-y-3">
        <label className={labelClass}>วุฒิ<input className={proResumeFieldClass} value={form.degree} onChange={(e) => setForm((f) => ({ ...f, degree: e.target.value }))} /></label>
        <label className={labelClass}>สถาบัน<input className={proResumeFieldClass} value={form.institution} onChange={(e) => setForm((f) => ({ ...f, institution: e.target.value }))} /></label>
        <div className="grid grid-cols-2 gap-2">
          <label className={labelClass}>ปีเริ่ม<input className={proResumeFieldClass} inputMode="numeric" value={form.startYear} onChange={(e) => setForm((f) => ({ ...f, startYear: e.target.value }))} /></label>
          <label className={labelClass}>ปีจบ<input className={proResumeFieldClass} inputMode="numeric" value={form.endYear} onChange={(e) => setForm((f) => ({ ...f, endYear: e.target.value }))} /></label>
        </div>
        <label className={labelClass}>รายละเอียด<textarea className={proResumeTextareaClass} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></label>
      </div>
    </FormModal>
  );
}

function ExperienceModal({
  open,
  row,
  onClose,
  onSaved,
  notice,
}: {
  open: boolean;
  row: ResumeExperienceDto | "new" | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
  notice: ReturnType<typeof useAppNoticePopup>;
}) {
  const [form, setForm] = useState({ jobTitle: "", company: "", startDate: "", endDate: "", achievements: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (row && row !== "new") {
      setForm({
        jobTitle: row.jobTitle,
        company: row.company,
        startDate: row.startDate,
        endDate: row.endDate ?? "",
        achievements: row.achievements,
      });
    } else {
      setForm({ jobTitle: "", company: "", startDate: "", endDate: "", achievements: "" });
    }
  }, [open, row]);

  const submit = async () => {
    setBusy(true);
    try {
      const payload = { ...form, endDate: form.endDate || null };
      const isEdit = row && row !== "new";
      const res = await fetch(isEdit ? `/api/pro-resume/session/experiences/${row.id}` : "/api/pro-resume/session/experiences", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "บันทึกไม่สำเร็จ");
      onClose();
      await onSaved();
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={row === "new" ? "เพิ่มประสบการณ์" : "แก้ไขประสบการณ์"}
      size="md"
      footer={<FormModalFooterActions onCancel={onClose} onSubmit={() => void submit()} submitLabel="บันทึก" loading={busy} submitDisabled={!form.jobTitle.trim() || !form.company.trim()} />}
    >
      <div className="space-y-3">
        <label className={labelClass}>ตำแหน่ง<input className={proResumeFieldClass} value={form.jobTitle} onChange={(e) => setForm((f) => ({ ...f, jobTitle: e.target.value }))} /></label>
        <label className={labelClass}>บริษัท<input className={proResumeFieldClass} value={form.company} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))} /></label>
        <div className="grid grid-cols-2 gap-2">
          <label className={labelClass}>เริ่ม (เช่น 2020-01)<input className={proResumeFieldClass} value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} /></label>
          <label className={labelClass}>สิ้นสุด<input className={proResumeFieldClass} value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} placeholder="ว่าง = ปัจจุบัน" /></label>
        </div>
        <label className={labelClass}>ผลงาน / หน้าที่<textarea className={proResumeTextareaClass} value={form.achievements} onChange={(e) => setForm((f) => ({ ...f, achievements: e.target.value }))} /></label>
      </div>
    </FormModal>
  );
}

function CertificateModal({
  open,
  row,
  onClose,
  onSaved,
  notice,
  lb,
}: {
  open: boolean;
  row: ResumeCertificateDto | "new" | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
  notice: ReturnType<typeof useAppNoticePopup>;
  lb: ReturnType<typeof useAppImageLightbox>;
}) {
  const [form, setForm] = useState({ name: "", issuedBy: "", year: "", fileUrl: "" as string | null });
  const [busy, setBusy] = useState(false);
  const certGalleryRef = useRef<HTMLInputElement>(null);
  const certCamera = useAppCameraCapture();

  useEffect(() => {
    if (!open) return;
    if (row && row !== "new") {
      setForm({ name: row.name, issuedBy: row.issuedBy, year: row.year?.toString() ?? "", fileUrl: row.fileUrl });
    } else {
      setForm({ name: "", issuedBy: "", year: "", fileUrl: null });
    }
  }, [open, row]);

  const uploadCert = async (file: File) => {
    const prepared = await prepareImageFileForUpload(file);
    const fd = new FormData();
    fd.set("file", prepared);
    fd.set("kind", "certs");
    const res = await fetch(UPLOAD, { method: "POST", body: fd });
    const data = (await res.json()) as { imageUrl?: string; error?: string };
    if (!res.ok || !data.imageUrl) throw new Error(data.error ?? "อัปโหลดไม่สำเร็จ");
    setForm((f) => ({ ...f, fileUrl: data.imageUrl! }));
  };

  const submit = async () => {
    setBusy(true);
    try {
      const payload = {
        name: form.name,
        issuedBy: form.issuedBy,
        year: form.year ? Number(form.year) : null,
        fileUrl: form.fileUrl,
      };
      const isEdit = row && row !== "new";
      const res = await fetch(isEdit ? `/api/pro-resume/session/certificates/${row.id}` : "/api/pro-resume/session/certificates", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "บันทึกไม่สำเร็จ");
      onClose();
      await onSaved();
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={row === "new" ? "เพิ่มใบรับรอง" : "แก้ไขใบรับรอง"}
      size="md"
      footer={<FormModalFooterActions onCancel={onClose} onSubmit={() => void submit()} submitLabel="บันทึก" loading={busy} submitDisabled={!form.name.trim()} />}
    >
      <div className="space-y-3">
        <label className={labelClass}>ชื่อ<input className={proResumeFieldClass} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></label>
        <label className={labelClass}>ออกโดย<input className={proResumeFieldClass} value={form.issuedBy} onChange={(e) => setForm((f) => ({ ...f, issuedBy: e.target.value }))} /></label>
        <label className={labelClass}>ปี<input className={proResumeFieldClass} inputMode="numeric" value={form.year} onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))} /></label>
        <div className="flex flex-wrap items-center gap-2">
          {form.fileUrl ? <AppImageThumb src={form.fileUrl} alt="ใบรับรอง" onOpen={() => lb.open(form.fileUrl!)} /> : null}
          <AppPickGalleryImageButton disabled={busy} onClick={() => certGalleryRef.current?.click()}>
            แนบไฟล์
          </AppPickGalleryImageButton>
          <AppTakePhotoButton
            disabled={busy}
            onClick={() => certCamera.openCamera((file) => void uploadCert(file).catch((e) => notice.error(e instanceof Error ? e.message : "อัปโหลดไม่สำเร็จ")))}
          >
            ถ่ายรูป
          </AppTakePhotoButton>
          <input
            ref={certGalleryRef}
            type="file"
            accept="image/*"
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) void uploadCert(file).catch((err) => notice.error(err instanceof Error ? err.message : "อัปโหลดไม่สำเร็จ"));
            }}
          />
          {certCamera.cameraModal}
        </div>
      </div>
    </FormModal>
  );
}
