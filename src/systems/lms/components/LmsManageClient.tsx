"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AppCameraCaptureModal,
  AppEmptyState,
  AppImageLightbox,
  AppImageThumb,
  AppPickGalleryImageButton,
  AppTakePhotoButton,
  prepareImageFileForUpload,
  useAppImageLightbox,
  useAppNoticePopup,
} from "@/components/app-templates";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import {
  assetRowEditIconButtonClass,
  assetRowRemoveIconButtonClass,
  IconRowEdit,
  IconRowRemove,
} from "@/systems/asset/components/AssetRowActionIcons";
import {
  LMS_MANAGE_TAB_ITEMS,
  lmsDashboardHref,
  lmsManageCourseHref,
  lmsManageHref,
  parseLmsManageTab,
  type LmsManageTabKey,
} from "@/systems/lms/lms-module-nav";
import { LmsPageSubNav } from "@/systems/lms/components/LmsPageSubNav";
import { LMS_LEARNER_QUOTA_DAILY, isLmsLearnerQuotaFull } from "@/systems/lms/lib/constants";
import type { LmsCourseDto, LmsLearnerDto } from "@/systems/lms/lib/mappers";
import {
  LMS_COURSE_STATUS_LABELS,
  LMS_ENROLLMENT_STATUS_LABELS,
} from "@/systems/lms/lib/mappers";
import {
  lmsFieldClass,
  lmsFilterChipClass,
  lmsFilterChipShellClass,
  lmsOutlineButtonClass,
  lmsPrimaryButtonClass,
  lmsRowCardClass,
  lmsTextareaClass,
} from "@/systems/lms/lib/ui-tokens";

function IconFilter({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} aria-hidden>
      <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" strokeLinejoin="round" />
    </svg>
  );
}

type CourseStatusFilter = "ALL" | "DRAFT" | "PUBLISHED";
type LearnerStatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

export function LmsManageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawTab = searchParams.get("tab");
  const tab = parseLmsManageTab(rawTab);
  const notice = useAppNoticePopup();
  const lb = useAppImageLightbox();
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [courses, setCourses] = useState<LmsCourseDto[]>([]);
  const [learners, setLearners] = useState<LmsLearnerDto[]>([]);
  const [quota, setQuota] = useState<{ used: number; max: number | null }>({
    used: 0,
    max: LMS_LEARNER_QUOTA_DAILY,
  });
  const [loading, setLoading] = useState(true);
  const [coverBusy, setCoverBusy] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);

  const [courseModal, setCourseModal] = useState(false);
  const [courseForm, setCourseForm] = useState({
    id: "",
    title: "",
    description: "",
    coverImageUrl: "" as string | null,
    status: "DRAFT" as "DRAFT" | "PUBLISHED",
    priceBaht: "0",
  });

  const [learnerModal, setLearnerModal] = useState(false);
  const [enrollModal, setEnrollModal] = useState(false);
  const [enrollSaving, setEnrollSaving] = useState(false);
  const [learnerForm, setLearnerForm] = useState({
    id: "",
    username: "",
    password: "",
    fullName: "",
  });
  const [enrollLearnerId, setEnrollLearnerId] = useState("");
  const [enrollCourseId, setEnrollCourseId] = useState("");

  const [filterOpen, setFilterOpen] = useState(true);
  const [courseStatusFilter, setCourseStatusFilter] = useState<CourseStatusFilter>("ALL");
  const [courseSearch, setCourseSearch] = useState("");
  const [learnerStatusFilter, setLearnerStatusFilter] = useState<LearnerStatusFilter>("ALL");
  const [learnerSearch, setLearnerSearch] = useState("");

  const setTab = useCallback(
    (next: string) => {
      router.replace(lmsManageHref(next as LmsManageTabKey), { scroll: false });
    },
    [router],
  );

  useEffect(() => {
    if (rawTab === "purchases") {
      router.replace(lmsDashboardHref("purchases"), { scroll: false });
    }
  }, [rawTab, router]);

  const loadCourses = useCallback(async () => {
    const res = await fetch("/api/lms/session/courses");
    const data = (await res.json()) as { courses?: LmsCourseDto[]; error?: string };
    if (!res.ok) throw new Error(data.error ?? "โหลดคอร์สไม่สำเร็จ");
    setCourses(data.courses ?? []);
  }, []);

  const loadLearners = useCallback(async () => {
    const res = await fetch("/api/lms/session/learners");
    const data = (await res.json()) as {
      learners?: LmsLearnerDto[];
      quota?: { used: number; max: number | null };
      error?: string;
    };
    if (!res.ok) throw new Error(data.error ?? "โหลดนักเรียนไม่สำเร็จ");
    setLearners(data.learners ?? []);
    setQuota(data.quota ?? { used: 0, max: LMS_LEARNER_QUOTA_DAILY });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === "courses") await loadCourses();
      else await Promise.all([loadLearners(), loadCourses()]);
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "โหลดไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [tab, loadCourses, loadLearners, notice.error]);

  useEffect(() => {
    void load();
  }, [load]);

  const openCourseCreate = () => {
    setCourseForm({ id: "", title: "", description: "", coverImageUrl: null, status: "DRAFT", priceBaht: "0" });
    setCourseModal(true);
  };

  const openCourseEdit = (c: LmsCourseDto) => {
    setCourseForm({
      id: c.id,
      title: c.title,
      description: c.description,
      coverImageUrl: c.coverImageUrl,
      status: c.status,
      priceBaht: String(c.priceBaht),
    });
    setCourseModal(true);
  };

  const saveCourse = async () => {
    if (!courseForm.title.trim()) {
      notice.error("กรอกชื่อคอร์ส");
      return;
    }
    try {
      const payload = {
        title: courseForm.title,
        description: courseForm.description,
        coverImageUrl: courseForm.coverImageUrl,
        status: courseForm.status,
        priceBaht: Number(courseForm.priceBaht) || 0,
      };
      const res = await fetch(
        courseForm.id ? `/api/lms/session/courses/${courseForm.id}` : "/api/lms/session/courses",
        {
          method: courseForm.id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "บันทึกไม่สำเร็จ");
      setCourseModal(false);
      await loadCourses();
      notice.success("บันทึกคอร์สแล้ว");
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    }
  };

  const deleteCourse = async (c: LmsCourseDto) => {
    const ok = await notice.confirm(`ลบคอร์ส «${c.title}» ใช่หรือไม่?`);
    if (!ok) return;
    try {
      const res = await fetch(`/api/lms/session/courses/${c.id}`, { method: "DELETE" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "ลบไม่สำเร็จ");
      await loadCourses();
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "ลบไม่สำเร็จ");
    }
  };

  const uploadCover = async (file: File) => {
    setCoverBusy(true);
    try {
      const prepared = await prepareImageFileForUpload(file);
      const fd = new FormData();
      fd.append("file", prepared);
      const res = await fetch("/api/lms/session/images/upload", { method: "POST", body: fd });
      const data = (await res.json()) as { imageUrl?: string; error?: string };
      if (!res.ok || !data.imageUrl) throw new Error(data.error ?? "อัปโหลดไม่สำเร็จ");
      setCourseForm((f) => ({ ...f, coverImageUrl: data.imageUrl! }));
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "อัปโหลดไม่สำเร็จ");
    } finally {
      setCoverBusy(false);
    }
  };

  const onCoverGallery = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) await uploadCover(file);
  };

  const saveLearner = async () => {
    const username = learnerForm.username.trim().toLowerCase();
    if (!learnerForm.fullName.trim() || username.length < 3) {
      notice.error("กรอกชื่อผู้ใช้ (อย่างน้อย 3 ตัว) และชื่อเต็ม");
      return;
    }
    if (!learnerForm.id && (!username || !learnerForm.password || learnerForm.password.length < 4)) {
      notice.error("กรอกชื่อผู้ใช้ รหัสผ่าน และชื่อเต็มให้ครบ");
      return;
    }
    try {
      const res = await fetch(
        learnerForm.id ? `/api/lms/session/learners/${learnerForm.id}` : "/api/lms/session/learners",
        {
          method: learnerForm.id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username,
            password: learnerForm.password || undefined,
            fullName: learnerForm.fullName,
          }),
        },
      );
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "บันทึกไม่สำเร็จ");
      setLearnerModal(false);
      await loadLearners();
      notice.success("บันทึกนักเรียนแล้ว");
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    }
  };

  const deleteLearner = async (l: LmsLearnerDto) => {
    const ok = await notice.confirm(`ลบนักเรียน «${l.fullName}»?`);
    if (!ok) return;
    try {
      const res = await fetch(`/api/lms/session/learners/${l.id}`, { method: "DELETE" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "ลบไม่สำเร็จ");
      await loadLearners();
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "ลบไม่สำเร็จ");
    }
  };

  const openEnrollModal = () => {
    setEnrollLearnerId("");
    setEnrollCourseId("");
    setEnrollModal(true);
  };

  const enroll = async () => {
    if (!enrollLearnerId || !enrollCourseId) {
      notice.error("เลือกนักเรียนและคอร์ส");
      return;
    }
    setEnrollSaving(true);
    try {
      const res = await fetch("/api/lms/session/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ learnerId: enrollLearnerId, courseId: enrollCourseId }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "ลงทะเบียนไม่สำเร็จ");
      setEnrollLearnerId("");
      setEnrollCourseId("");
      setEnrollModal(false);
      await loadLearners();
      notice.success("ลงทะเบียนแล้ว");
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "ลงทะเบียนไม่สำเร็จ");
    } finally {
      setEnrollSaving(false);
    }
  };

  const quotaFull = isLmsLearnerQuotaFull(quota);

  const courseStatusCounts = useMemo(() => {
    const all = courses.length;
    const draft = courses.filter((c) => c.status === "DRAFT").length;
    const published = courses.filter((c) => c.status === "PUBLISHED").length;
    return { ALL: all, DRAFT: draft, PUBLISHED: published };
  }, [courses]);

  const learnerStatusCounts = useMemo(() => {
    const all = learners.length;
    const active = learners.filter((l) => l.status === "ACTIVE").length;
    const inactive = learners.filter((l) => l.status === "INACTIVE").length;
    return { ALL: all, ACTIVE: active, INACTIVE: inactive };
  }, [learners]);

  const filteredCourses = useMemo(() => {
    const q = courseSearch.trim().toLowerCase();
    return courses.filter((c) => {
      if (courseStatusFilter !== "ALL" && c.status !== courseStatusFilter) return false;
      if (!q) return true;
      const hay = [c.title, c.description, LMS_COURSE_STATUS_LABELS[c.status]].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [courses, courseStatusFilter, courseSearch]);

  const filteredLearners = useMemo(() => {
    const q = learnerSearch.trim().toLowerCase();
    return learners.filter((l) => {
      if (learnerStatusFilter !== "ALL" && l.status !== learnerStatusFilter) return false;
      if (!q) return true;
      const enrollText = l.enrollments.map((e) => e.courseTitle).join(" ");
      const hay = [l.fullName, l.username, enrollText].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [learners, learnerStatusFilter, learnerSearch]);

  const courseFiltersActive = courseStatusFilter !== "ALL" || courseSearch.trim().length > 0;
  const learnerFiltersActive = learnerStatusFilter !== "ALL" || learnerSearch.trim().length > 0;
  const filtersActive = tab === "courses" ? courseFiltersActive : learnerFiltersActive;

  const resetCourseFilters = () => {
    setCourseStatusFilter("ALL");
    setCourseSearch("");
  };
  const resetLearnerFilters = () => {
    setLearnerStatusFilter("ALL");
    setLearnerSearch("");
  };

  const filterToggleButton = (
    <button
      type="button"
      onClick={() => setFilterOpen((o) => !o)}
      aria-expanded={filterOpen}
      aria-controls={tab === "courses" ? "lms-manage-courses-filter" : "lms-manage-learners-filter"}
      aria-label={filterOpen ? "ซ่อนตัวกรอง" : "แสดงตัวกรอง"}
      title={filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}
      className={cn(
        lmsOutlineButtonClass,
        "relative min-w-[40px] justify-center px-0 sm:px-3",
        filterOpen && "border-[#5b61ff]/45 bg-[#5b61ff]/10 ring-2 ring-[#5b61ff]/20",
        filtersActive && !filterOpen && "border-amber-300/80 bg-amber-50/90",
      )}
    >
      <IconFilter className="h-4 w-4 shrink-0" />
      <span className="hidden sm:inline">{filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}</span>
      {filtersActive && !filterOpen ? (
        <span
          className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-[#5b61ff] ring-2 ring-white"
          aria-hidden
        />
      ) : null}
    </button>
  );

  return (
    <div className="min-w-0 space-y-4">
      {notice.popup}
      <AppImageLightbox src={lb.src} onClose={lb.close} alt="รูปปกคอร์ส" />
      <LmsPageSubNav
        title="การจัดการ"
        items={LMS_MANAGE_TAB_ITEMS}
        activeKey={tab}
        onSelect={setTab}
        ariaLabel="เมนูย่อยการจัดการ"
        action={
          tab === "courses" ? (
            <div className="flex shrink-0 flex-nowrap items-center gap-1 sm:gap-1.5">
              {filterToggleButton}
              <button
                type="button"
                className={cn(lmsPrimaryButtonClass, "min-w-[40px] justify-center px-0 sm:px-3")}
                onClick={openCourseCreate}
                aria-label="เพิ่มคอร์ส"
              >
                <span className="sm:hidden">+</span>
                <span className="hidden sm:inline">+ เพิ่มคอร์ส</span>
              </button>
            </div>
          ) : (
            <div className="flex shrink-0 flex-nowrap items-center gap-1 sm:gap-1.5">
              {filterToggleButton}
              <button
                type="button"
                className={cn(lmsOutlineButtonClass, "min-w-[40px] justify-center px-0 sm:px-3")}
                onClick={openEnrollModal}
                aria-label="ลงทะเบียนคอร์ส"
                title="ลงทะเบียนคอร์ส"
              >
                <span className="sm:hidden">ลงทะเบียน</span>
                <span className="hidden sm:inline">ลงทะเบียนคอร์ส</span>
              </button>
              <button
                type="button"
                className={cn(lmsPrimaryButtonClass, "min-w-[40px] justify-center px-0 sm:px-3")}
                disabled={quotaFull}
                onClick={() => {
                  setLearnerForm({ id: "", username: "", password: "", fullName: "" });
                  setLearnerModal(true);
                }}
                aria-label="เพิ่มผู้เรียน"
              >
                <span className="sm:hidden">+</span>
                <span className="hidden sm:inline">+ เพิ่มผู้เรียน</span>
              </button>
            </div>
          )
        }
      >
        {loading ? (
          <p className="text-sm text-[#66638c]">กำลังโหลด…</p>
        ) : tab === "courses" ? (
          <div className="space-y-3">
            <div
              id="lms-manage-courses-filter"
              className={cn("space-y-3", filterOpen ? "block" : "hidden")}
            >
              <div className={lmsFilterChipShellClass} role="tablist" aria-label="กรองสถานะคอร์ส">
                {(
                  [
                    ["ALL", "ทั้งหมด"],
                    ["PUBLISHED", "เผยแพร่"],
                    ["DRAFT", "แบบร่าง"],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={courseStatusFilter === key}
                    className={lmsFilterChipClass(courseStatusFilter === key)}
                    onClick={() => setCourseStatusFilter(key)}
                  >
                    {label} · {courseStatusCounts[key]}
                  </button>
                ))}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
                <label className="min-w-0 flex-1 sm:max-w-[18rem]">
                  <span className="text-xs font-bold text-[#4d47b6]">ค้นหา</span>
                  <input
                    className={cn(lmsFieldClass, "mt-1 min-h-[44px]")}
                    placeholder="ชื่อคอร์ส · คำอธิบาย…"
                    value={courseSearch}
                    onChange={(e) => setCourseSearch(e.target.value)}
                  />
                </label>
                {courseFiltersActive ? (
                  <button type="button" className={lmsOutlineButtonClass} onClick={resetCourseFilters}>
                    ล้างกรอง
                  </button>
                ) : null}
              </div>
              <p className="text-xs font-semibold text-[#66638c]">
                แสดง {filteredCourses.length}/{courses.length}
              </p>
            </div>

            {courses.length === 0 ? (
              <AppEmptyState>ยังไม่มีคอร์ส — กดเพิ่มคอร์สเพื่อเริ่มต้น</AppEmptyState>
            ) : filteredCourses.length === 0 ? (
              <AppEmptyState>ไม่พบคอร์สตามเงื่อนไขกรอง</AppEmptyState>
            ) : (
              <ul className="space-y-3">
                {filteredCourses.map((c) => (
                  <li key={c.id} className={cn(lmsRowCardClass, "flex-col items-stretch gap-3")}>
                    <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 flex-1 gap-3">
                        {c.coverImageUrl ? (
                          <AppImageThumb
                            src={c.coverImageUrl}
                            alt={c.title}
                            onOpen={() => undefined}
                            className="h-14 w-14"
                          />
                        ) : null}
                        <div className="min-w-0">
                          <p className="font-bold text-[#1e1b4b]">{c.title}</p>
                          <p className="text-xs text-[#66638c]">
                            {LMS_COURSE_STATUS_LABELS[c.status]} · ฿{c.priceBaht.toLocaleString()} · บทเรียน{" "}
                            {c.lessonCount} · ลงทะเบียน {c.enrollmentCount}
                            {c.hasExam ? " · มีข้อสอบ" : ""}
                          </p>
                          {c.description ? (
                            <p className="mt-1 line-clamp-2 text-xs text-[#5f5a8a]">{c.description}</p>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5 self-end sm:self-start">
                        <Link
                          href={lmsManageCourseHref(c.id)}
                          className={cn(lmsOutlineButtonClass, "inline-flex min-h-9 items-center")}
                          aria-label={`บทเรียนและข้อสอบ ${c.title}`}
                        >
                          บทเรียน
                        </Link>
                        <button
                          type="button"
                          className={assetRowEditIconButtonClass}
                          aria-label={`แก้ไข ${c.title}`}
                          title="แก้ไข"
                          onClick={() => openCourseEdit(c)}
                        >
                          <IconRowEdit className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className={assetRowRemoveIconButtonClass}
                          aria-label={`ลบ ${c.title}`}
                          title="ลบ"
                          onClick={() => void deleteCourse(c)}
                        >
                          <IconRowRemove className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {quotaFull ? (
              <div
                role="status"
                className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm font-semibold text-amber-950"
              >
                โควตาผู้เรียนเต็ม {quota.used}/{quota.max} (สายรายวันสูงสุด {LMS_LEARNER_QUOTA_DAILY} คน)
                กรุณาสมัครแพ็กเกจรายเดือน (Monthly Subscription) เพื่อเพิ่มผู้เรียนไม่จำกัด
              </div>
            ) : (
              <p className="text-xs font-medium text-[#66638c]">
                โควตาผู้เรียน {quota.used}
                {quota.max == null ? " · ไม่จำกัด (แพ็กเดือน)" : `/${quota.max} คน (สายรายวัน)`}
              </p>
            )}

            <div
              id="lms-manage-learners-filter"
              className={cn("space-y-3", filterOpen ? "block" : "hidden")}
            >
              <div className={lmsFilterChipShellClass} role="tablist" aria-label="กรองสถานะนักเรียน">
                {(
                  [
                    ["ALL", "ทั้งหมด"],
                    ["ACTIVE", "ใช้งาน"],
                    ["INACTIVE", "ปิดใช้งาน"],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={learnerStatusFilter === key}
                    className={lmsFilterChipClass(learnerStatusFilter === key)}
                    onClick={() => setLearnerStatusFilter(key)}
                  >
                    {label} · {learnerStatusCounts[key]}
                  </button>
                ))}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
                <label className="min-w-0 flex-1 sm:max-w-[18rem]">
                  <span className="text-xs font-bold text-[#4d47b6]">ค้นหา</span>
                  <input
                    className={cn(lmsFieldClass, "mt-1 min-h-[44px]")}
                    placeholder="ชื่อ · username · คอร์ส…"
                    value={learnerSearch}
                    onChange={(e) => setLearnerSearch(e.target.value)}
                  />
                </label>
                {learnerFiltersActive ? (
                  <button type="button" className={lmsOutlineButtonClass} onClick={resetLearnerFilters}>
                    ล้างกรอง
                  </button>
                ) : null}
              </div>
              <p className="text-xs font-semibold text-[#66638c]">
                แสดง {filteredLearners.length}/{learners.length}
              </p>
            </div>

            {learners.length === 0 ? (
              <AppEmptyState>
                ยังไม่มีนักเรียน — เพิ่มบัญชีนักเรียน (สายรายวันสูงสุด {LMS_LEARNER_QUOTA_DAILY} คน)
              </AppEmptyState>
            ) : filteredLearners.length === 0 ? (
              <AppEmptyState>ไม่พบนักเรียนตามเงื่อนไขกรอง</AppEmptyState>
            ) : (
              <ul className="space-y-2">
                {filteredLearners.map((l) => (
                  <li key={l.id} className={lmsRowCardClass}>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-[#1e1b4b]">{l.fullName}</p>
                      <p className="text-xs text-[#66638c]">
                        @{l.username}
                        {l.status === "INACTIVE" ? " · ปิดใช้งาน" : ""}
                      </p>
                      {l.enrollments.length > 0 ? (
                        <ul className="mt-1 space-y-0.5">
                          {l.enrollments.map((en) => (
                            <li key={en.id} className="text-xs text-[#5f5a8a]">
                              {en.courseTitle} — {LMS_ENROLLMENT_STATUS_LABELS[en.status]} · {en.progressPercent}%
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-1 text-xs text-[#66638c]">ยังไม่ลงทะเบียนคอร์ส</p>
                      )}
                    </div>
                    <div className="ml-auto flex shrink-0 justify-end gap-1">
                      <button
                        type="button"
                        className={assetRowEditIconButtonClass}
                        aria-label={`แก้ไข ${l.fullName}`}
                        onClick={() => {
                          setLearnerForm({
                            id: l.id,
                            username: l.username,
                            password: "",
                            fullName: l.fullName,
                          });
                          setLearnerModal(true);
                        }}
                      >
                        <IconRowEdit className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className={assetRowRemoveIconButtonClass}
                        aria-label={`ลบ ${l.fullName}`}
                        onClick={() => void deleteLearner(l)}
                      >
                        <IconRowRemove className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </LmsPageSubNav>

      <FormModal
        open={courseModal}
        onClose={() => setCourseModal(false)}
        title={courseForm.id ? "แก้ไขคอร์ส" : "เพิ่มคอร์ส"}
        size="md"
        mobileCentered
        footer={
          <FormModalFooterActions
            onCancel={() => setCourseModal(false)}
            onSubmit={() => void saveCourse()}
            submitLabel="บันทึก"
          />
        }
      >
        <div className="space-y-3">
          <label className="block space-y-1">
            <span className="text-xs font-bold text-[#4d47b6]">ชื่อคอร์ส</span>
            <input
              className={lmsFieldClass}
              value={courseForm.title}
              onChange={(e) => setCourseForm((f) => ({ ...f, title: e.target.value }))}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-bold text-[#4d47b6]">คำอธิบาย</span>
            <textarea
              className={lmsTextareaClass}
              value={courseForm.description}
              onChange={(e) => setCourseForm((f) => ({ ...f, description: e.target.value }))}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-bold text-[#4d47b6]">ราคา (บาท)</span>
            <input
              className={lmsFieldClass}
              type="number"
              min={0}
              value={courseForm.priceBaht}
              onChange={(e) => setCourseForm((f) => ({ ...f, priceBaht: e.target.value }))}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-bold text-[#4d47b6]">สถานะ</span>
            <select
              className={lmsFieldClass}
              value={courseForm.status}
              onChange={(e) =>
                setCourseForm((f) => ({ ...f, status: e.target.value as "DRAFT" | "PUBLISHED" }))
              }
            >
              <option value="DRAFT">แบบร่าง</option>
              <option value="PUBLISHED">เผยแพร่</option>
            </select>
          </label>
          <div className="space-y-2">
            <p className="text-xs font-bold text-[#4d47b6]">รูปปก</p>
            {courseForm.coverImageUrl ? (
              <div className="flex flex-wrap items-center gap-2">
                <AppImageThumb
                  src={courseForm.coverImageUrl}
                  alt="ปก"
                  onOpen={() => lb.open(courseForm.coverImageUrl!)}
                />
                <button
                  type="button"
                  className={lmsOutlineButtonClass}
                  disabled={coverBusy}
                  onClick={() => setCourseForm((f) => ({ ...f, coverImageUrl: null }))}
                >
                  ลบรูป
                </button>
              </div>
            ) : null}
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => void onCoverGallery(e)}
            />
            <div className="flex flex-wrap gap-2">
              <AppPickGalleryImageButton
                disabled={coverBusy}
                onClick={() => galleryInputRef.current?.click()}
              />
              <AppTakePhotoButton disabled={coverBusy} onClick={() => setCameraOpen(true)} />
            </div>
          </div>
        </div>
      </FormModal>

      <AppCameraCaptureModal
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={(file) => {
          setCameraOpen(false);
          void uploadCover(file);
        }}
      />

      <FormModal
        open={learnerModal}
        onClose={() => setLearnerModal(false)}
        title={learnerForm.id ? "แก้ไขนักเรียน" : "เพิ่มนักเรียน"}
        size="md"
        mobileCentered
        footer={
          <FormModalFooterActions
            onCancel={() => setLearnerModal(false)}
            onSubmit={() => void saveLearner()}
            submitLabel="บันทึก"
          />
        }
      >
        <div className="space-y-3">
          <label className="block space-y-1">
            <span className="text-xs font-bold text-[#4d47b6]">ชื่อผู้ใช้</span>
            <input
              className={lmsFieldClass}
              value={learnerForm.username}
              autoComplete="username"
              onChange={(e) => setLearnerForm((f) => ({ ...f, username: e.target.value }))}
              placeholder="เช่น man"
            />
            <span className="text-[10px] font-medium text-[#66638c]">
              ใช้ล็อกอินพอร์ทัล · ห้ามซ้ำในสถาบันเดียวกัน
            </span>
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-bold text-[#4d47b6]">ชื่อเต็ม</span>
            <input
              className={lmsFieldClass}
              value={learnerForm.fullName}
              onChange={(e) => setLearnerForm((f) => ({ ...f, fullName: e.target.value }))}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-bold text-[#4d47b6]">
              {learnerForm.id ? "รหัสผ่านใหม่ (ว่าง = ไม่เปลี่ยน)" : "รหัสผ่าน"}
            </span>
            <input
              className={lmsFieldClass}
              type="password"
              value={learnerForm.password}
              onChange={(e) => setLearnerForm((f) => ({ ...f, password: e.target.value }))}
            />
          </label>
        </div>
      </FormModal>

      <FormModal
        open={enrollModal}
        onClose={() => setEnrollModal(false)}
        title="ลงทะเบียนคอร์ส"
        size="md"
        mobileCentered
        footer={
          <FormModalFooterActions
            onCancel={() => setEnrollModal(false)}
            onSubmit={() => void enroll()}
            submitLabel="ลงทะเบียน"
            loading={enrollSaving}
          />
        }
      >
        <div className="space-y-3">
          <label className="block space-y-1">
            <span className="text-xs font-bold text-[#4d47b6]">นักเรียน</span>
            <select
              className={lmsFieldClass}
              value={enrollLearnerId}
              onChange={(e) => setEnrollLearnerId(e.target.value)}
            >
              <option value="">เลือกนักเรียน</option>
              {learners.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.fullName} ({l.username})
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-bold text-[#4d47b6]">คอร์ส</span>
            <select
              className={lmsFieldClass}
              value={enrollCourseId}
              onChange={(e) => setEnrollCourseId(e.target.value)}
            >
              <option value="">เลือกคอร์ส</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </label>
        </div>
      </FormModal>
    </div>
  );
}
