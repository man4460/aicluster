"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AppEmptyState, useAppNoticePopup } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  assetRowRemoveIconButtonClass,
  IconRowEdit,
  IconRowRemove,
} from "@/systems/asset/components/AssetRowActionIcons";
import { LmsPageBlock, LmsPageSubNav } from "@/systems/lms/components/LmsPageSubNav";
import { LMS_MANAGE_PATH } from "@/systems/lms/lms-module-nav";
import type { LmsCourseDto, LmsExamDto, LmsLessonDto } from "@/systems/lms/lib/mappers";
import { lmsYoutubeWatchUrlFromStored } from "@/systems/lms/lib/youtube";
import {
  lmsFieldClass,
  lmsOutlineButtonClass,
  lmsPrimaryButtonClass,
  lmsRowIconButtonClass,
  lmsTextareaClass,
} from "@/systems/lms/lib/ui-tokens";

type QuestionDraft = {
  questionText: string;
  choices: [string, string, string, string];
  correctIndex: number;
};

const emptyQuestion = (): QuestionDraft => ({
  questionText: "",
  choices: ["", "", "", ""],
  correctIndex: 0,
});

type ContentTab = "lessons" | "exam";

const CONTENT_TABS: { key: ContentTab; label: string; shortLabel: string }[] = [
  { key: "lessons", label: "บทเรียน", shortLabel: "บท" },
  { key: "exam", label: "ข้อสอบ", shortLabel: "สอบ" },
];

type Props = {
  courseId: string;
};

export function LmsCourseContentClient({ courseId }: Props) {
  const router = useRouter();
  const notice = useAppNoticePopup();

  const [tab, setTab] = useState<ContentTab>("lessons");
  const [course, setCourse] = useState<LmsCourseDto | null>(null);
  const [lessons, setLessons] = useState<LmsLessonDto[]>([]);
  const [exam, setExam] = useState<LmsExamDto | null>(null);
  const [loading, setLoading] = useState(true);

  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [creatingLesson, setCreatingLesson] = useState(false);
  const [lessonForm, setLessonForm] = useState({ title: "", youtubeUrl: "" });
  const [lessonSaving, setLessonSaving] = useState(false);

  const [examPassing, setExamPassing] = useState(70);
  const [questions, setQuestions] = useState<QuestionDraft[]>([emptyQuestion()]);
  const [examSaving, setExamSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/lms/session/courses/${encodeURIComponent(courseId)}`);
      const data = (await res.json()) as {
        course?: LmsCourseDto;
        lessons?: LmsLessonDto[];
        exam?: LmsExamDto | null;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "โหลดไม่สำเร็จ");
      if (!data.course) throw new Error("ไม่พบคอร์ส");
      setCourse(data.course);
      setLessons(data.lessons ?? []);
      setExam(data.exam ?? null);
      setExamPassing(data.exam?.passingScorePercent ?? 70);
      setQuestions(
        data.exam?.questions?.length
          ? data.exam.questions.map((q) => ({
              questionText: q.questionText,
              choices: [
                q.choices[0] ?? "",
                q.choices[1] ?? "",
                q.choices[2] ?? "",
                q.choices[3] ?? "",
              ] as [string, string, string, string],
              correctIndex: q.correctIndex,
            }))
          : [emptyQuestion()],
      );
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "โหลดไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [courseId, notice.error]);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreateLesson = () => {
    setEditingLessonId(null);
    setCreatingLesson(true);
    setLessonForm({ title: "", youtubeUrl: "" });
    setTab("lessons");
  };

  const openEditLesson = (les: LmsLessonDto) => {
    setCreatingLesson(false);
    setEditingLessonId(les.id);
    setLessonForm({
      title: les.title,
      youtubeUrl: lmsYoutubeWatchUrlFromStored(les.youtubeUrl) ?? les.youtubeUrl,
    });
  };

  const closeLessonEditor = () => {
    setCreatingLesson(false);
    setEditingLessonId(null);
    setLessonForm({ title: "", youtubeUrl: "" });
  };

  const saveLesson = async () => {
    if (!lessonForm.title.trim() || !lessonForm.youtubeUrl.trim()) {
      notice.error("กรอกชื่อบทเรียนและลิงก์ YouTube");
      return;
    }
    setLessonSaving(true);
    try {
      if (creatingLesson) {
        const res = await fetch("/api/lms/session/lessons", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courseId,
            title: lessonForm.title,
            youtubeUrl: lessonForm.youtubeUrl,
          }),
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) throw new Error(data.error ?? "เพิ่มบทเรียนไม่สำเร็จ");
        notice.success("เพิ่มบทเรียนแล้ว");
      } else if (editingLessonId) {
        const res = await fetch(`/api/lms/session/lessons/${editingLessonId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: lessonForm.title,
            youtubeUrl: lessonForm.youtubeUrl,
          }),
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) throw new Error(data.error ?? "บันทึกบทเรียนไม่สำเร็จ");
        notice.success("บันทึกบทเรียนแล้ว");
      }
      closeLessonEditor();
      await load();
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setLessonSaving(false);
    }
  };

  const moveLesson = async (lesson: LmsLessonDto, dir: -1 | 1) => {
    const idx = lessons.findIndex((l) => l.id === lesson.id);
    const other = lessons[idx + dir];
    if (!other) return;
    try {
      const res = await fetch(`/api/lms/session/lessons/${lesson.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ swapWithId: other.id }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "เรียงลำดับไม่สำเร็จ");
      await load();
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "เรียงลำดับไม่สำเร็จ");
    }
  };

  const deleteLesson = async (lesson: LmsLessonDto) => {
    const ok = await notice.confirm(`ลบบทเรียน «${lesson.title}»?`);
    if (!ok) return;
    try {
      const res = await fetch(`/api/lms/session/lessons/${lesson.id}`, { method: "DELETE" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "ลบไม่สำเร็จ");
      if (editingLessonId === lesson.id) closeLessonEditor();
      await load();
      notice.success("ลบบทเรียนแล้ว");
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "ลบไม่สำเร็จ");
    }
  };

  const saveExam = async () => {
    setExamSaving(true);
    try {
      const res = await fetch("/api/lms/session/exams", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          passingScorePercent: examPassing,
          questions: questions.map((q) => ({
            questionText: q.questionText,
            choices: q.choices,
            correctIndex: q.correctIndex,
          })),
        }),
      });
      const data = (await res.json()) as { exam?: LmsExamDto; error?: string };
      if (!res.ok) throw new Error(data.error ?? "บันทึกข้อสอบไม่สำเร็จ");
      setExam(data.exam ?? null);
      notice.success("บันทึกข้อสอบแล้ว");
      await load();
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "บันทึกข้อสอบไม่สำเร็จ");
    } finally {
      setExamSaving(false);
    }
  };

  const showLessonEditor = creatingLesson || editingLessonId != null;

  return (
    <div className="min-w-0">
      {notice.popup}

      <LmsPageSubNav
        title={course?.title ?? "คอร์ส"}
        items={CONTENT_TABS}
        activeKey={tab}
        onSelect={(key) => setTab(key as ContentTab)}
        ariaLabel="บทเรียนหรือข้อสอบ"
        action={
          <div className="flex shrink-0 flex-nowrap items-center gap-1 sm:gap-1.5">
            <Link
              href={LMS_MANAGE_PATH}
              className={cn(lmsOutlineButtonClass, "inline-flex min-h-10 min-w-[40px] items-center justify-center gap-1.5 px-0 sm:px-3")}
              aria-label="ย้อนกลับ"
              title="ย้อนกลับ"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">ย้อนกลับ</span>
            </Link>
            {tab === "lessons" ? (
              <button
                type="button"
                className={cn(lmsPrimaryButtonClass, "min-w-[40px] justify-center px-0 sm:px-3")}
                onClick={openCreateLesson}
                aria-label="เพิ่มบทเรียน"
              >
                <span className="sm:hidden">+</span>
                <span className="hidden sm:inline">+ เพิ่มบทเรียน</span>
              </button>
            ) : (
              <button
                type="button"
                className={cn(lmsOutlineButtonClass, "min-w-[40px] justify-center px-0 sm:px-3")}
                onClick={() => setQuestions((q) => [...q, emptyQuestion()])}
                aria-label="เพิ่มคำถาม"
              >
                <span className="sm:hidden">+</span>
                <span className="hidden sm:inline">+ คำถาม</span>
              </button>
            )}
          </div>
        }
      >
        {loading ? (
          <p className="text-sm text-[#66638c]">กำลังโหลด…</p>
        ) : !course ? (
          <AppEmptyState>
            ไม่พบคอร์ส —{" "}
            <button
              type="button"
              className="font-semibold text-[#4d47b6] underline"
              onClick={() => router.push(LMS_MANAGE_PATH)}
            >
              กลับรายการคอร์ส
            </button>
          </AppEmptyState>
        ) : tab === "lessons" ? (
          <LmsPageBlock first>
            <div className="space-y-3">
              {lessons.length === 0 && !showLessonEditor ? (
                <AppEmptyState>ยังไม่มีบทเรียน — กดเพิ่มบทเรียนด้านขวาบน</AppEmptyState>
              ) : (
                <ul className="space-y-2">
                  {lessons.map((les, i) => {
                    const active = editingLessonId === les.id;
                    return (
                      <li key={les.id}>
                        <button
                          type="button"
                          onClick={() => openEditLesson(les)}
                          className={cn(
                            "flex w-full items-center gap-2 rounded-xl border p-3 text-left transition",
                            active
                              ? "border-[#5b61ff]/45 bg-[#5b61ff]/8 ring-1 ring-[#5b61ff]/20"
                              : "border-slate-200/90 bg-white hover:border-[#5b61ff]/30 hover:bg-slate-50/80",
                          )}
                        >
                          <span className="w-7 shrink-0 text-center text-xs font-black text-[#66638c]">
                            {i + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-[#1e1b4b]">{les.title}</p>
                            <p className="truncate text-[10px] text-[#66638c]">
                              {lmsYoutubeWatchUrlFromStored(les.youtubeUrl) ?? les.youtubeUrl}
                            </p>
                          </div>
                          <span className="hidden shrink-0 text-xs font-semibold text-[#4d47b6] sm:inline">
                            แก้ไข
                          </span>
                          <IconRowEdit className="h-4 w-4 shrink-0 text-[#4d47b6] sm:hidden" aria-hidden />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}

              {showLessonEditor ? (
                <div className="space-y-3 rounded-xl border border-slate-200/90 bg-slate-50/60 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-[#1e1b4b]">
                      {creatingLesson ? "เพิ่มบทเรียนใหม่" : "แก้ไขบทเรียน"}
                    </h3>
                    <button type="button" className={lmsOutlineButtonClass} onClick={closeLessonEditor}>
                      ยกเลิก
                    </button>
                  </div>
                  <label className="block space-y-1">
                    <span className="text-xs font-bold text-[#4d47b6]">ชื่อบทเรียน</span>
                    <input
                      className={lmsFieldClass}
                      value={lessonForm.title}
                      onChange={(e) => setLessonForm((f) => ({ ...f, title: e.target.value }))}
                      placeholder="เช่น บทที่ 1 แนะนำคอร์ส"
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-xs font-bold text-[#4d47b6]">ลิงก์ YouTube</span>
                    <input
                      className={lmsFieldClass}
                      value={lessonForm.youtubeUrl}
                      onChange={(e) => setLessonForm((f) => ({ ...f, youtubeUrl: e.target.value }))}
                      placeholder="https://www.youtube.com/watch?v=…"
                    />
                  </label>
                  {!creatingLesson && editingLessonId ? (
                    <div className="flex flex-wrap items-center justify-end gap-1">
                      <button
                        type="button"
                        className={lmsRowIconButtonClass}
                        disabled={lessons.findIndex((l) => l.id === editingLessonId) <= 0}
                        aria-label="เลื่อนขึ้น"
                        onClick={() => {
                          const les = lessons.find((l) => l.id === editingLessonId);
                          if (les) void moveLesson(les, -1);
                        }}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className={lmsRowIconButtonClass}
                        disabled={
                          lessons.findIndex((l) => l.id === editingLessonId) >= lessons.length - 1
                        }
                        aria-label="เลื่อนลง"
                        onClick={() => {
                          const les = lessons.find((l) => l.id === editingLessonId);
                          if (les) void moveLesson(les, 1);
                        }}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        className={assetRowRemoveIconButtonClass}
                        aria-label="ลบบทเรียน"
                        title="ลบ"
                        onClick={() => {
                          const les = lessons.find((l) => l.id === editingLessonId);
                          if (les) void deleteLesson(les);
                        }}
                      >
                        <IconRowRemove className="h-4 w-4" />
                      </button>
                    </div>
                  ) : null}
                  <div className="flex justify-end">
                    <button
                      type="button"
                      className={lmsPrimaryButtonClass}
                      disabled={lessonSaving}
                      onClick={() => void saveLesson()}
                    >
                      {lessonSaving
                        ? "กำลังบันทึก…"
                        : creatingLesson
                          ? "เพิ่มบทเรียน"
                          : "บันทึกบทเรียน"}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </LmsPageBlock>
        ) : (
          <LmsPageBlock first>
            <div className="space-y-4">
              <p className="text-xs text-[#66638c]">
                {exam
                  ? "แก้ไขข้อสอบท้ายคอร์ส"
                  : "ยังไม่มีข้อสอบ — กรอกแล้วกดบันทึกเพื่อสร้าง"}
              </p>
              <label className="flex flex-wrap items-center justify-end gap-2 text-xs font-bold text-[#4d47b6]">
                คะแนนผ่าน (%)
                <input
                  className={cn(lmsFieldClass, "w-24")}
                  type="number"
                  min={0}
                  max={100}
                  value={examPassing}
                  onChange={(e) => setExamPassing(Number(e.target.value) || 0)}
                />
              </label>

              {questions.map((q, qi) => (
                <div key={qi} className="space-y-3 rounded-xl border border-slate-200/90 bg-white p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-black text-[#66638c]">คำถาม {qi + 1}</p>
                    {questions.length > 1 ? (
                      <button
                        type="button"
                        className={assetRowRemoveIconButtonClass}
                        aria-label={`ลบคำถาม ${qi + 1}`}
                        onClick={() => setQuestions((prev) => prev.filter((_, i) => i !== qi))}
                      >
                        <IconRowRemove className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                  <textarea
                    className={lmsTextareaClass}
                    rows={2}
                    placeholder="ข้อความคำถาม"
                    value={q.questionText}
                    onChange={(e) =>
                      setQuestions((prev) =>
                        prev.map((row, i) => (i === qi ? { ...row, questionText: e.target.value } : row)),
                      )
                    }
                  />
                  <div className="grid gap-2 sm:grid-cols-2">
                    {q.choices.map((ch, ci) => (
                      <label key={ci} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`q-${qi}-correct`}
                          checked={q.correctIndex === ci}
                          onChange={() =>
                            setQuestions((prev) =>
                              prev.map((row, i) => (i === qi ? { ...row, correctIndex: ci } : row)),
                            )
                          }
                          aria-label={`ตัวเลือก ${ci + 1} เป็นคำตอบถูก`}
                        />
                        <input
                          className={lmsFieldClass}
                          placeholder={`ตัวเลือก ${ci + 1}`}
                          value={ch}
                          onChange={(e) =>
                            setQuestions((prev) =>
                              prev.map((row, i) => {
                                if (i !== qi) return row;
                                const choices = [...row.choices] as [string, string, string, string];
                                choices[ci] = e.target.value;
                                return { ...row, choices };
                              }),
                            )
                          }
                        />
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              <div className="flex justify-end">
                <button
                  type="button"
                  className={lmsPrimaryButtonClass}
                  disabled={examSaving}
                  onClick={() => void saveExam()}
                >
                  {examSaving ? "กำลังบันทึก…" : "บันทึกข้อสอบ"}
                </button>
              </div>
            </div>
          </LmsPageBlock>
        )}
      </LmsPageSubNav>
    </div>
  );
}
