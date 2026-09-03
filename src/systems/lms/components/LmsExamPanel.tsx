"use client";

import { useState } from "react";
import { CheckCircle2, RotateCcw, XCircle } from "lucide-react";
import { useAppNoticePopup } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { LmsCertificateDownload } from "@/systems/lms/components/LmsCertificateDownload";

export type LmsExamQuestionPublic = {
  id: string;
  questionText: string;
  choices: string[];
  orderIndex: number;
};

type Props = {
  slug: string;
  courseId: string;
  examTitle: string;
  passingScorePercent: number;
  questions: LmsExamQuestionPublic[];
  unlocked: boolean;
  onPassed?: (result: { scorePercent: number; certificateId?: string }) => void;
};

type ExamResult = {
  scorePercent: number;
  passed: boolean;
  correct: number;
  total: number;
  certificateId?: string;
};

export function LmsExamPanel({
  slug,
  courseId,
  examTitle,
  passingScorePercent,
  questions,
  unlocked,
  onPassed,
}: Props) {
  const notice = useAppNoticePopup();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ExamResult | null>(null);

  function retake() {
    setAnswers({});
    setResult(null);
  }

  async function submit() {
    if (!unlocked) {
      notice.error("เรียนบทเรียนให้ครบก่อนทำแบบทดสอบ");
      return;
    }
    const missing = questions.some((q) => !answers[q.id]);
    if (missing) {
      notice.error("ตอบคำถามให้ครบทุกข้อ");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/lms/public/${encodeURIComponent(slug)}/exam/submit`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, answers }),
      });
      const data = (await res.json()) as {
        error?: string;
        scorePercent?: number;
        passed?: boolean;
        correct?: number;
        total?: number;
        certificate?: { id: string };
      };
      if (!res.ok) {
        notice.error(data.error || "ส่งแบบทดสอบไม่สำเร็จ");
        return;
      }
      const score = data.scorePercent ?? 0;
      const passed = Boolean(data.passed);
      const next: ExamResult = {
        scorePercent: score,
        passed,
        correct: data.correct ?? 0,
        total: data.total ?? questions.length,
        certificateId: data.certificate?.id,
      };
      setResult(next);
      if (passed) {
        notice.success(`ผ่านแบบทดสอบ! คะแนน ${score}% — ดาวน์โหลดใบประกาศได้ด้านล่าง`, {
          title: "ผ่านเกณฑ์แล้ว",
        });
        onPassed?.({ scorePercent: score, certificateId: data.certificate?.id });
      } else {
        notice.warning(
          `ยังไม่ผ่าน — ได้ ${score}% (เกณฑ์ผ่าน ${passingScorePercent}%) กด «ทำข้อสอบใหม่» เพื่อลองอีกครั้ง`,
          { title: "ยังไม่ผ่านเกณฑ์" },
        );
      }
    } catch {
      notice.error("เชื่อมต่อไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  }

  if (!unlocked) {
    return (
      <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-900">
        ทำแบบทดสอบได้เมื่อเรียนบทเรียนครบทุกตอน
        {notice.popup}
      </div>
    );
  }

  const showQuestions = !result?.passed;

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      {notice.popup}
      <div>
        <h3 className="text-base font-bold text-slate-900">{examTitle}</h3>
        <p className="text-xs text-slate-500">เกณฑ์ผ่าน {passingScorePercent}%</p>
      </div>

      {result ? (
        <div
          role="status"
          className={cn(
            "rounded-2xl border px-4 py-4 shadow-sm",
            result.passed
              ? "border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50"
              : "border-rose-200 bg-gradient-to-br from-rose-50 via-white to-amber-50",
          )}
        >
          <div className="flex items-start gap-3">
            {result.passed ? (
              <CheckCircle2 className="mt-0.5 h-7 w-7 shrink-0 text-emerald-600" aria-hidden />
            ) : (
              <XCircle className="mt-0.5 h-7 w-7 shrink-0 text-rose-600" aria-hidden />
            )}
            <div className="min-w-0 flex-1 space-y-1">
              <p
                className={cn(
                  "text-base font-black tracking-tight",
                  result.passed ? "text-emerald-900" : "text-rose-900",
                )}
              >
                {result.passed ? "ผ่านแบบทดสอบ" : "ยังไม่ผ่านแบบทดสอบ"}
              </p>
              <p className={cn("text-sm", result.passed ? "text-emerald-800" : "text-rose-800")}>
                คะแนน {result.scorePercent}% ({result.correct}/{result.total} ข้อ)
                {!result.passed ? ` · ต้องได้ไม่ต่ำกว่า ${passingScorePercent}%` : null}
              </p>
              {result.passed ? (
                <p className="text-xs text-emerald-700/90">
                  คุณสามารถดาวน์โหลดใบประกาศนียบัตรได้แล้ว
                </p>
              ) : (
                <p className="text-xs text-rose-700/90">
                  กลับไปทบทวนบทเรียนแล้วทำข้อสอบใหม่อีกครั้งได้
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {result.passed && result.certificateId ? (
              <LmsCertificateDownload
                slug={slug}
                certificateId={result.certificateId}
                label="ดาวน์โหลดใบประกาศ"
              />
            ) : null}
            {!result.passed ? (
              <button
                type="button"
                onClick={retake}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white"
              >
                <RotateCcw className="h-4 w-4" aria-hidden />
                ทำข้อสอบใหม่
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {showQuestions ? (
        <>
          <ol className="space-y-4">
            {questions.map((q, i) => (
              <li key={q.id} className="space-y-2">
                <p className="text-sm font-semibold text-slate-800">
                  {i + 1}. {q.questionText}
                </p>
                <div className="grid gap-1.5">
                  {q.choices.map((choice, ci) => {
                    const value = String(ci);
                    const selected = answers[q.id] === value || answers[q.id] === choice;
                    const locked = Boolean(result);
                    return (
                      <label
                        key={`${q.id}-${ci}`}
                        className={cn(
                          "flex items-start gap-2 rounded-lg border px-3 py-2 text-sm",
                          locked ? "cursor-default opacity-80" : "cursor-pointer",
                          selected
                            ? "border-indigo-400 bg-indigo-50 text-indigo-950"
                            : "border-slate-200 bg-slate-50 text-slate-700",
                        )}
                      >
                        <input
                          type="radio"
                          className="mt-1"
                          name={q.id}
                          checked={selected}
                          disabled={locked}
                          onChange={() =>
                            setAnswers((prev) => ({ ...prev, [q.id]: value }))
                          }
                        />
                        <span>{choice}</span>
                      </label>
                    );
                  })}
                </div>
              </li>
            ))}
          </ol>
          {!result ? (
            <button
              type="button"
              disabled={submitting}
              onClick={() => void submit()}
              className="inline-flex min-h-10 w-full items-center justify-center rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white disabled:opacity-60 sm:w-auto"
            >
              {submitting ? "กำลังตรวจ…" : "ส่งแบบทดสอบ"}
            </button>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
