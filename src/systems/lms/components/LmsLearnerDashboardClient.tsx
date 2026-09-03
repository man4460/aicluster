"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, ShoppingBag } from "lucide-react";
import {
  AppImageLightbox,
  useAppImageLightbox,
  useAppNoticePopup,
} from "@/components/app-templates";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import { LmsCertificateDownload } from "@/systems/lms/components/LmsCertificateDownload";
import {
  LmsPublicPaymentPanel,
  type LmsPayMethod,
} from "@/systems/lms/components/LmsPublicPaymentPanel";
import { LMS_FAKE_SLIP_WARNING } from "@/systems/lms/lib/purchases-shared";

type EnrollmentRow = {
  id: string;
  progressPercent: number;
  status: string;
  course?: {
    id: string;
    title: string;
    description: string;
    coverImageUrl: string | null;
  };
};

type CertRow = {
  id: string;
  courseId: string;
  certCode: string;
};

type CatalogCourse = {
  id: string;
  title: string;
  description: string;
  coverImageUrl: string | null;
  priceBaht: number;
  lessonCount: number;
  pendingPurchase?: boolean;
};

type PurchaseRow = {
  id: string;
  courseId: string;
  amountBaht: number;
  status: "PENDING_REVIEW" | "APPROVED" | "REJECTED";
  reviewerNote: string;
  slipUrl: string | null;
  course?: { id: string; title: string; coverImageUrl: string | null; priceBaht: number };
};

type Props = { slug: string };
type TabKey = "progress" | "done" | "buy";

export function LmsLearnerDashboardClient({ slug }: Props) {
  const router = useRouter();
  const notice = useAppNoticePopup();
  const lb = useAppImageLightbox();
  const [tab, setTab] = useState<TabKey>("progress");
  const [name, setName] = useState("");
  const [institute, setInstitute] = useState("");
  const [enrollments, setEnrollments] = useState<EnrollmentRow[]>([]);
  const [certs, setCerts] = useState<CertRow[]>([]);
  const [catalog, setCatalog] = useState<CatalogCourse[]>([]);
  const [purchases, setPurchases] = useState<PurchaseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyCourse, setBuyCourse] = useState<CatalogCourse | null>(null);
  const [payMethod, setPayMethod] = useState<LmsPayMethod>("PROMPTPAY");
  const [slipUrl, setSlipUrl] = useState<string | null>(null);
  const [ackRules, setAckRules] = useState(false);
  const [buyBusy, setBuyBusy] = useState(false);

  const loadMe = useCallback(async () => {
    const res = await fetch(`/api/lms/public/${encodeURIComponent(slug)}/me`, {
      credentials: "include",
    });
    if (res.status === 401) {
      router.replace(`/lms/${encodeURIComponent(slug)}`);
      return false;
    }
    const data = (await res.json()) as {
      error?: string;
      learner?: { fullName: string };
      institute?: { displayName: string };
      enrollments?: EnrollmentRow[];
      certificates?: CertRow[];
    };
    if (!res.ok) {
      notice.error(data.error || "โหลดไม่สำเร็จ");
      return false;
    }
    setName(data.learner?.fullName || "");
    setInstitute(data.institute?.displayName || "");
    setEnrollments(data.enrollments || []);
    setCerts(data.certificates || []);
    return true;
  }, [slug, router, notice]);

  const loadCatalog = useCallback(async () => {
    const res = await fetch(`/api/lms/public/${encodeURIComponent(slug)}/catalog`, {
      credentials: "include",
    });
    if (res.status === 401) return;
    const data = (await res.json()) as {
      courses?: CatalogCourse[];
      purchases?: PurchaseRow[];
    };
    if (res.ok) {
      setCatalog(data.courses || []);
      setPurchases(data.purchases || []);
    }
  }, [slug]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const ok = await loadMe();
      if (ok) await loadCatalog();
    } catch {
      notice.error("เชื่อมต่อไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [loadMe, loadCatalog, notice]);

  useEffect(() => {
    void load();
  }, [load]);

  const inProgress = useMemo(
    () => enrollments.filter((e) => e.status !== "COMPLETED"),
    [enrollments],
  );
  const completed = useMemo(
    () => enrollments.filter((e) => e.status === "COMPLETED"),
    [enrollments],
  );
  const list = tab === "progress" ? inProgress : completed;
  const pendingPurchases = useMemo(
    () => purchases.filter((p) => p.status === "PENDING_REVIEW"),
    [purchases],
  );

  async function logout() {
    await fetch(`/api/lms/public/${encodeURIComponent(slug)}/logout`, {
      method: "POST",
      credentials: "include",
    });
    router.replace(`/lms/${encodeURIComponent(slug)}`);
  }

  function openBuy(c: CatalogCourse) {
    setBuyCourse(c);
    setPayMethod("PROMPTPAY");
    setSlipUrl(null);
    setAckRules(false);
  }

  async function submitPurchase() {
    if (!buyCourse) return;
    if (!ackRules) {
      notice.error("ต้องยอมรับเงื่อนไขเกี่ยวกับสลิปก่อน");
      return;
    }
    if (buyCourse.priceBaht > 0 && !slipUrl) {
      notice.error("กรุณาแนบสลิปการโอน");
      return;
    }
    setBuyBusy(true);
    try {
      const res = await fetch(`/api/lms/public/${encodeURIComponent(slug)}/purchases`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: buyCourse.id,
          payMethod,
          slipUrl,
          acknowledgedRules: true,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        enrolled?: boolean;
        pendingReview?: boolean;
      };
      if (!res.ok) {
        notice.error(data.error || "ส่งคำขอไม่สำเร็จ");
        return;
      }
      setBuyCourse(null);
      await load();
      if (data.enrolled) {
        if (data.pendingReview) {
          notice.success("ส่งสลิปแล้ว — เข้าเรียนได้ทันที สถาบันจะตรวจสลิปต่อไป");
        } else {
          notice.success("ลงทะเบียนคอร์สฟรีแล้ว — กดเข้าเรียนได้ทันที");
        }
        setTab("progress");
      } else {
        notice.success("ส่งคำขอซื้อแล้ว");
      }
    } catch {
      notice.error("เชื่อมต่อไม่สำเร็จ");
    } finally {
      setBuyBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8">
      {notice.popup}
      <AppImageLightbox src={lb.src} onClose={lb.close} alt="สลิป" />
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-indigo-600">{institute}</p>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">สวัสดี {name}</h1>
          <p className="text-sm text-slate-500">คอร์สที่กำลังเรียน · เรียนจบ · ซื้อเพิ่ม</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <div
            role="tablist"
            className="inline-flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1"
          >
            {(
              [
                { key: "progress" as const, label: `กำลังเรียน (${inProgress.length})` },
                { key: "done" as const, label: `เรียนจบแล้ว (${completed.length})` },
                { key: "buy" as const, label: `ซื้อคอร์ส (${catalog.length})` },
              ] as const
            ).map((t) => (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={tab === t.key}
                className={cn(
                  "min-h-9 rounded-lg px-3 text-sm font-semibold",
                  tab === t.key ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600",
                )}
                onClick={() => setTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => void logout()}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700"
            aria-label="ออกจากระบบ"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            ออกจากระบบ
          </button>
        </div>
      </header>

      {loading ? (
        <p className="text-sm text-slate-500">กำลังโหลด…</p>
      ) : tab === "buy" ? (
        <div className="space-y-4">
          {pendingPurchases.length > 0 ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-sm text-amber-950">
              <p className="font-bold">สลิปรอสถาบันตรวจ {pendingPurchases.length} รายการ</p>
              <p className="mt-0.5 text-xs text-amber-900/80">
                คุณเข้าเรียนได้แล้วระหว่างรอตรวจ — หากสลิปไม่ผ่าน สิทธิ์เรียนอาจถูกถอน
              </p>
              <ul className="mt-1 space-y-0.5 text-xs">
                {pendingPurchases.map((p) => (
                  <li key={p.id}>{p.course?.title || "คอร์ส"} · ฿{p.amountBaht.toLocaleString()}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {purchases.filter((p) => p.status === "REJECTED").length > 0 ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-sm text-rose-950">
              <p className="font-bold">คำขอที่ถูกปฏิเสธ</p>
              <ul className="mt-1 space-y-1 text-xs">
                {purchases
                  .filter((p) => p.status === "REJECTED")
                  .map((p) => (
                    <li key={p.id}>
                      {p.course?.title || "คอร์ส"} — {p.reviewerNote || "สลิปไม่ถูกต้อง"}
                      {p.slipUrl ? (
                        <button
                          type="button"
                          className="ml-2 font-bold text-indigo-700 underline"
                          onClick={() => lb.open(p.slipUrl!)}
                        >
                          ดูสลิป
                        </button>
                      ) : null}
                    </li>
                  ))}
              </ul>
            </div>
          ) : null}

          {catalog.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
              ไม่มีคอร์สให้ซื้อเพิ่มตอนนี้
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {catalog.map((c) => (
                <article
                  key={c.id}
                  className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  {c.coverImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.coverImageUrl} alt="" className="h-36 w-full object-cover" />
                  ) : (
                    <div className="flex h-36 items-center justify-center bg-gradient-to-br from-indigo-100 to-slate-100 text-sm text-indigo-700">
                      LMS
                    </div>
                  )}
                  <div className="flex flex-1 flex-col gap-3 p-4">
                    <h2 className="line-clamp-2 text-base font-bold text-slate-900">{c.title}</h2>
                    {c.description ? (
                      <p className="line-clamp-2 text-xs text-slate-500">{c.description}</p>
                    ) : null}
                    <p className="text-sm font-black text-indigo-700">
                      {c.priceBaht > 0 ? `฿${c.priceBaht.toLocaleString()}` : "ฟรี"}
                      <span className="ml-2 text-xs font-medium text-slate-500">
                        · {c.lessonCount} บทเรียน
                      </span>
                    </p>
                    <button
                      type="button"
                      disabled={c.pendingPurchase}
                      onClick={() => openBuy(c)}
                      className="mt-auto inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      <ShoppingBag className="h-4 w-4" aria-hidden />
                      {c.pendingPurchase ? "รอตรวจสลิป" : c.priceBaht > 0 ? "ซื้อคอร์ส" : "ลงทะเบียนฟรี"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          {tab === "progress" ? "ยังไม่มีคอร์สที่กำลังเรียน" : "ยังไม่มีคอร์สที่เรียนจบ"}
          <div className="mt-3">
            <button
              type="button"
              className="text-sm font-bold text-indigo-700 underline"
              onClick={() => setTab("buy")}
            >
              ไปซื้อคอร์ส
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {tab === "progress" && pendingPurchases.length > 0 ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-sm text-amber-950">
              <p className="font-bold">มีสลิปรอสถาบันตรวจ — เรียนได้ตามปกติระหว่างรอ</p>
            </div>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
          {list.map((e) => {
            const cert = certs.find((c) => c.courseId === e.course?.id);
            const slipPending = purchases.some(
              (p) => p.courseId === e.course?.id && p.status === "PENDING_REVIEW",
            );
            return (
              <article
                key={e.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                {e.course?.coverImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={e.course.coverImageUrl} alt="" className="h-36 w-full object-cover" />
                ) : (
                  <div className="flex h-36 items-center justify-center bg-gradient-to-br from-indigo-100 to-slate-100 text-sm text-indigo-700">
                    LMS
                  </div>
                )}
                <div className="flex flex-1 flex-col gap-3 p-4">
                  <h2 className="line-clamp-2 text-base font-bold text-slate-900">
                    {e.course?.title || "คอร์ส"}
                  </h2>
                  {slipPending ? (
                    <p className="text-[11px] font-semibold text-amber-700">สลิปรอตรวจ — เรียนได้แล้ว</p>
                  ) : null}
                  {e.course?.description ? (
                    <p className="line-clamp-2 text-xs text-slate-500">{e.course.description}</p>
                  ) : null}
                  <div>
                    <div className="mb-1 flex justify-between text-xs text-slate-500">
                      <span>ความคืบหน้า</span>
                      <span>{e.progressPercent}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-indigo-500 transition-all"
                        style={{ width: `${Math.min(100, e.progressPercent)}%` }}
                      />
                    </div>
                  </div>
                  <div className="mt-auto flex flex-wrap gap-2">
                    {e.course ? (
                      <Link
                        href={`/lms/${encodeURIComponent(slug)}/course/${encodeURIComponent(e.course.id)}`}
                        className="inline-flex min-h-10 flex-1 items-center justify-center rounded-lg bg-indigo-600 px-3 text-sm font-semibold text-white"
                      >
                        {e.status === "COMPLETED" ? "ดูคอร์ส" : "เข้าเรียน"}
                      </Link>
                    ) : null}
                    {cert ? (
                      <LmsCertificateDownload slug={slug} certificateId={cert.id} />
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
          </div>
        </div>
      )}

      <FormModal
        open={Boolean(buyCourse)}
        onClose={() => {
          if (buyBusy) return;
          setBuyCourse(null);
        }}
        title={buyCourse ? `ซื้อ · ${buyCourse.title}` : "ซื้อคอร์ส"}
        description="ชำระเงินและแนบสลิป — เข้าเรียนได้ทันที สถาบันจะตรวจสลิปภายหลัง"
        size="lg"
        mobileCentered
        footer={
          <FormModalFooterActions
            onCancel={() => setBuyCourse(null)}
            onSubmit={() => void submitPurchase()}
            submitLabel={buyCourse && buyCourse.priceBaht <= 0 ? "ลงทะเบียนฟรี" : "ส่งคำขอซื้อ"}
            submitDisabled={buyBusy || !ackRules || (Boolean(buyCourse && buyCourse.priceBaht > 0) && !slipUrl)}
            loading={buyBusy}
          />
        }
      >
        {buyCourse ? (
          <div className="space-y-4">
            <div
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-semibold leading-relaxed text-rose-950"
            >
              {LMS_FAKE_SLIP_WARNING}
            </div>
            <LmsPublicPaymentPanel
              slug={slug}
              amountBaht={buyCourse.priceBaht}
              method={payMethod}
              slipUrl={slipUrl}
              onMethodChange={setPayMethod}
              onSlipUrlChange={setSlipUrl}
              disabled={buyBusy}
            />
            <label className="flex items-start gap-2 text-xs font-semibold text-slate-800">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={ackRules}
                disabled={buyBusy}
                onChange={(e) => setAckRules(e.target.checked)}
              />
              <span>
                ข้าพเจ้ายืนยันว่าสลิปเป็นของจริง และยอมรับว่าหากตรวจพบสลิปปลอมอาจถูกปฏิเสธและ{" "}
                <strong className="text-rose-700">ลบบัญชีผู้เรียน</strong>
              </span>
            </label>
          </div>
        ) : null}
      </FormModal>
    </div>
  );
}
