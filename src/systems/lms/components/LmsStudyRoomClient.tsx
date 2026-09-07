"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Circle, List } from "lucide-react";
import {
  appSafeAreaStickyHeaderPadClass,
  useAppNoticePopup,
} from "@/components/app-templates";
import { FormModal } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import { LmsCertificateDownload } from "@/systems/lms/components/LmsCertificateDownload";
import { LmsExamPanel } from "@/systems/lms/components/LmsExamPanel";
import { LmsSecureYoutubePlayer } from "@/systems/lms/components/LmsSecureYoutubePlayer";
import { lmsIconButtonClass, lmsOutlineButtonClass } from "@/systems/lms/lib/ui-tokens";

type Lesson = {
  id: string;
  title: string;
  youtubeUrl: string;
  orderIndex: number;
  durationSec: number;
};

type Progress = {
  lessonId: string;
  watchedPercent: number;
  completed: boolean;
};

type Props = { slug: string; courseId: string };

function LessonList({
  lessons,
  progress,
  activeLessonId,
  onSelect,
}: {
  lessons: Lesson[];
  progress: Progress[];
  activeLessonId: string | null;
  onSelect: (lessonId: string) => void;
}) {
  return (
    <ul className="space-y-1">
      {lessons.map((l, i) => {
        const done = progress.some((p) => p.lessonId === l.id && p.completed);
        const active = l.id === activeLessonId;
        return (
          <li key={l.id}>
            <button
              type="button"
              onClick={() => onSelect(l.id)}
              className={cn(
                "flex w-full items-start gap-2 rounded-lg px-2 py-2.5 text-left text-sm touch-manipulation",
                active ? "bg-indigo-50 text-indigo-900" : "text-slate-700 hover:bg-slate-50",
              )}
            >
              {done ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden />
              ) : (
                <Circle className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" aria-hidden />
              )}
              <span className="min-w-0">
                <span className="block font-medium line-clamp-2">
                  {i + 1}. {l.title}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function LmsStudyRoomClient({ slug, courseId }: Props) {
  const router = useRouter();
  const notice = useAppNoticePopup();
  const [title, setTitle] = useState("");
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [autoPlayNext, setAutoPlayNext] = useState(false);
  const [examUnlocked, setExamUnlocked] = useState(false);
  const [lessonMenuOpen, setLessonMenuOpen] = useState(false);
  const [exam, setExam] = useState<{
    title: string;
    passingScorePercent: number;
    questions: { id: string; questionText: string; choices: string[]; orderIndex: number }[];
  } | null>(null);
  const [certificateId, setCertificateId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const lastSentRef = useRef<Record<string, number>>({});
  const advancingRef = useRef(false);
  const lessonsRef = useRef<Lesson[]>([]);
  const progressRef = useRef<Progress[]>([]);
  const activeLessonIdRef = useRef<string | null>(null);

  useEffect(() => {
    lessonsRef.current = lessons;
  }, [lessons]);
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);
  useEffect(() => {
    activeLessonIdRef.current = activeLessonId;
  }, [activeLessonId]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/lms/public/${encodeURIComponent(slug)}/courses/${encodeURIComponent(courseId)}`,
        { credentials: "include" },
      );
      if (res.status === 401) {
        router.replace(`/lms/${encodeURIComponent(slug)}`);
        return;
      }
      const data = (await res.json()) as {
        error?: string;
        course?: { title: string };
        lessons?: Lesson[];
        progress?: Progress[];
        examUnlocked?: boolean;
        exam?: {
          title: string;
          passingScorePercent: number;
          questions: { id: string; questionText: string; choices: string[]; orderIndex: number }[];
        } | null;
        certificate?: { id: string } | null;
      };
      if (!res.ok) {
        notice.error(data.error || "โหลดห้องเรียนไม่สำเร็จ");
        return;
      }
      setTitle(data.course?.title || "คอร์ส");
      const ls = data.lessons || [];
      setLessons(ls);
      setProgress(data.progress || []);
      setExamUnlocked(Boolean(data.examUnlocked));
      setExam(data.exam ?? null);
      setCertificateId(data.certificate?.id ?? null);
      setActiveLessonId((prev) => {
        if (prev && ls.some((l) => l.id === prev)) return prev;
        const firstIncomplete = ls.find(
          (l) => !(data.progress || []).some((p) => p.lessonId === l.id && p.completed),
        );
        return firstIncomplete?.id ?? ls[0]?.id ?? null;
      });
    } catch {
      notice.error("เชื่อมต่อไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [slug, courseId, router, notice]);

  useEffect(() => {
    void load();
  }, [load]);

  const activeLesson = useMemo(
    () => lessons.find((l) => l.id === activeLessonId) ?? null,
    [lessons, activeLessonId],
  );

  const saveProgress = useCallback(
    async (lessonId: string, watchedPercent: number, completed: boolean) => {
      const last = lastSentRef.current[lessonId] ?? 0;
      if (!completed && watchedPercent < last + 5) return false;
      lastSentRef.current[lessonId] = Math.max(last, watchedPercent);
      try {
        const res = await fetch(`/api/lms/public/${encodeURIComponent(slug)}/progress`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lessonId, watchedPercent, completed }),
        });
        if (!res.ok) return false;
        const data = (await res.json()) as {
          progress?: Progress;
          enrollment?: { progressPercent: number; status: string };
        };
        if (data.progress) {
          setProgress((prev) => {
            const others = prev.filter((p) => p.lessonId !== lessonId);
            const next = [...others, data.progress!];
            progressRef.current = next;
            const allDone = lessonsRef.current.every((l) =>
              next.some((p) => p.lessonId === l.id && p.completed),
            );
            if (allDone) setExamUnlocked(true);
            return next;
          });
        }
        return true;
      } catch {
        return false;
      }
    },
    [slug],
  );

  const goToLesson = useCallback((lessonId: string, opts?: { autoPlay?: boolean }) => {
    setAutoPlayNext(opts?.autoPlay === true);
    setActiveLessonId(lessonId);
  }, []);

  const onPlayerProgress = useCallback(
    (pct: number, ended: boolean) => {
      const lessonId = activeLessonIdRef.current;
      if (!lessonId) return;
      const markDone = ended || pct >= 90;

      if (!ended) {
        void saveProgress(lessonId, pct, markDone);
        return;
      }

      if (advancingRef.current) return;
      advancingRef.current = true;
      void (async () => {
        try {
          await saveProgress(lessonId, 100, true);
          const list = lessonsRef.current;
          const idx = list.findIndex((l) => l.id === lessonId);
          const next = idx >= 0 ? list[idx + 1] : undefined;
          if (next) {
            goToLesson(next.id, { autoPlay: true });
          } else if (list.length > 0) {
            setExamUnlocked(true);
          }
        } finally {
          advancingRef.current = false;
        }
      })();
    },
    [saveProgress, goToLesson],
  );

  const pageShell = (children: ReactNode) => (
    <div className="min-h-[100dvh] bg-slate-50">
      {notice.popup}
      {children}
    </div>
  );

  if (loading) {
    return pageShell(
      <div
        className={cn(
          "flex min-h-[50vh] items-center justify-center px-4 text-sm text-slate-500",
          appSafeAreaStickyHeaderPadClass,
        )}
      >
        กำลังโหลดห้องเรียน…
      </div>,
    );
  }

  return pageShell(
    <>
      <header
        className={cn(
          "sticky top-0 z-30 border-b border-slate-200/80 bg-slate-50/95 backdrop-blur-md",
          appSafeAreaStickyHeaderPadClass,
        )}
      >
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-4">
          <Link
            href={`/lms/${encodeURIComponent(slug)}/dashboard`}
            className={cn(lmsOutlineButtonClass, "shrink-0")}
            aria-label="กลับแดชบอร์ด"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">แดชบอร์ด</span>
          </Link>
          <h1 className="min-w-0 flex-1 truncate text-base font-black tracking-tight text-slate-900 sm:text-lg">
            {title}
          </h1>
          <div className="flex shrink-0 items-center gap-1.5">
            {certificateId ? (
              <LmsCertificateDownload slug={slug} certificateId={certificateId} />
            ) : null}
            <button
              type="button"
              className={cn(lmsIconButtonClass, "lg:hidden")}
              aria-label="เปิดรายการบทเรียน"
              title="บทเรียน"
              aria-expanded={lessonMenuOpen}
              onClick={() => setLessonMenuOpen(true)}
            >
              <List className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      </header>

      <div
        className={cn(
          "mx-auto w-full max-w-6xl space-y-4 px-3 pt-3 sm:px-4 sm:pt-4",
          "pb-[max(1.5rem,calc(1rem+var(--mawell-safe-bottom,env(safe-area-inset-bottom,0px))))]",
        )}
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(260px,0.8fr)]">
          <div className="space-y-4">
            {activeLesson ? (
              <LmsSecureYoutubePlayer
                key={activeLesson.id}
                youtubeUrl={activeLesson.youtubeUrl}
                title={activeLesson.title}
                autoPlay={autoPlayNext}
                onProgress={onPlayerProgress}
              />
            ) : (
              <div className="flex aspect-video items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white text-sm text-slate-500">
                ยังไม่มีบทเรียนในคอร์สนี้
              </div>
            )}
            {activeLesson ? (
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="font-bold text-slate-900">{activeLesson.title}</h2>
                    <p className="mt-1 text-xs text-slate-500">
                      ความคืบหน้าบทนี้{" "}
                      {progress.find((p) => p.lessonId === activeLesson.id)?.watchedPercent ?? 0}%
                      {progress.find((p) => p.lessonId === activeLesson.id)?.completed
                        ? " · เรียนจบแล้ว"
                        : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    className={cn(lmsOutlineButtonClass, "shrink-0 lg:hidden")}
                    onClick={() => setLessonMenuOpen(true)}
                    aria-label="เลือกบทเรียน"
                  >
                    <List className="h-4 w-4" aria-hidden />
                    <span>บทเรียน</span>
                  </button>
                </div>
              </div>
            ) : null}

            {exam ? (
              <LmsExamPanel
                slug={slug}
                courseId={courseId}
                examTitle={exam.title}
                passingScorePercent={exam.passingScorePercent}
                questions={exam.questions}
                unlocked={examUnlocked}
                onPassed={(r) => {
                  if (r.certificateId) setCertificateId(r.certificateId);
                  void load();
                }}
              />
            ) : null}
          </div>

          <aside className="hidden rounded-xl border border-slate-200 bg-white p-3 shadow-sm lg:block">
            <h2 className="mb-2 px-1 text-sm font-bold text-slate-800">รายการบทเรียน</h2>
            <LessonList
              lessons={lessons}
              progress={progress}
              activeLessonId={activeLessonId}
              onSelect={(id) => goToLesson(id, { autoPlay: false })}
            />
          </aside>
        </div>
      </div>

      <FormModal
        open={lessonMenuOpen}
        onClose={() => setLessonMenuOpen(false)}
        title="รายการบทเรียน"
        description="เลือกบทเพื่อดูวิดีโอ — ไม่บังพื้นที่เล่นบนมือถือ"
        size="md"
        mobileCentered
      >
        <LessonList
          lessons={lessons}
          progress={progress}
          activeLessonId={activeLessonId}
          onSelect={(id) => {
            goToLesson(id, { autoPlay: false });
            setLessonMenuOpen(false);
          }}
        />
      </FormModal>
    </>,
  );
}
