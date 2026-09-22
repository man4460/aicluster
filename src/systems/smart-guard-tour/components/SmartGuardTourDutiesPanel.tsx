"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Route, ShieldCheck } from "lucide-react";
import { AppEmptyState, useAppNoticePopup } from "@/components/app-templates";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { bangkokDateKey } from "@/lib/time/bangkok";
import { cn } from "@/lib/cn";
import {
  assetRowRemoveIconButtonClass,
  IconRowRemove,
} from "@/systems/asset/components/AssetRowActionIcons";
import {
  smartGuardTourCardIconTileClass,
  smartGuardTourTonedRowCardClass,
} from "@/systems/smart-guard-tour/lib/card-tones";
import { formatMinutesHm } from "@/systems/smart-guard-tour/lib/wage-engine";
import {
  smartGuardTourFieldClass,
  smartGuardTourPrimaryButtonClass,
} from "@/systems/smart-guard-tour/lib/ui-tokens";

type DutyPayload = {
  dutyOn: string;
  weekStart: string;
  weekEnd: string;
  posts: Array<{ id: string; name: string; code: string | null; requiredStaffPerShift: number }>;
  templates: Array<{
    id: string;
    name: string;
    startHm: string;
    endHm: string;
    plannedMinutes: number;
    normalCapMinutes: number;
    shiftRateBaht: number;
  }>;
  schedules: Array<{ id: string; name: string }>;
  staff: Array<{ id: string; displayName: string; hourlyRateBaht: number; wageBahtPerShift?: number }>;
  duties: Array<{
    id: string;
    status: string;
    post: { id: string; name: string; code: string | null };
    staff: { id: string; displayName: string };
    template: { id: string; name: string; startHm: string; endHm: string };
    tourAssignments: Array<{ id: string; scheduleId: string; scheduleName: string }>;
  }>;
  weekWarnings: Array<{
    staffId: string;
    displayName: string;
    normalMinutes: number;
    otMinutes: number;
    weeklyNormalExceeded: boolean;
    weeklyNormalCapMinutes: number;
  }>;
  wageRules: { weeklyNormalCapMinutes: number; otMultiplier: number };
};

export function SmartGuardTourDutiesPanel({ readOnly = false }: { readOnly?: boolean }) {
  const notice = useAppNoticePopup();
  const [dutyOn, setDutyOn] = useState(bangkokDateKey());
  const [data, setData] = useState<DutyPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    postId: "",
    staffId: "",
    templateId: "",
    scheduleId: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/smart-guard-tour/session/duties?dutyOn=${encodeURIComponent(dutyOn)}&week=${encodeURIComponent(dutyOn)}`,
        { credentials: "include" },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "โหลดไม่สำเร็จ");
      setData(json as DutyPayload);
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "โหลดไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [dutyOn, notice]);

  useEffect(() => {
    void load();
  }, [load]);

  function openAdd() {
    setForm({
      postId: data?.posts[0]?.id ?? "",
      staffId: data?.staff[0]?.id ?? "",
      templateId: data?.templates[0]?.id ?? "",
      scheduleId: "",
    });
    setOpen(true);
  }

  async function save() {
    if (!form.postId || !form.staffId || !form.templateId) {
      notice.error("เลือกจุด · พนักงาน · กะ");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/smart-guard-tour/session/duties", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "post",
          dutyOn,
          postId: form.postId,
          staffId: form.staffId,
          templateId: form.templateId,
          scheduleId: form.scheduleId || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "บันทึกไม่สำเร็จ");
      if (json.weeklyWarning) {
        notice.success(
          `จัดเวรแล้ว · เตือนเกิน ${formatMinutesHm(json.weeklyNormalCapMinutes ?? 2880)}/สัปดาห์`,
        );
      } else {
        notice.success("จัดเวรแล้ว");
      }
      setOpen(false);
      await load();
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  async function removeDuty(id: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/smart-guard-tour/session/duties?dutyId=${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "ลบไม่สำเร็จ");
      notice.success("ลบเวรแล้ว");
      await load();
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "ลบไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  const warnings = (data?.weekWarnings ?? []).filter((w) => w.weeklyNormalExceeded);

  return (
    <div className="min-w-0 space-y-3">
      {notice.popup}
      <div className="flex min-w-0 flex-row flex-nowrap items-end justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-black tracking-tight text-[#1e1b4b] sm:text-base">จัดเวร</h3>
          <label className="mt-1 block max-w-[11rem] space-y-1 text-xs font-bold text-[#4d47b6] sm:max-w-[14rem]">
            วันที่
            <input
              type="date"
              className={smartGuardTourFieldClass}
              value={dutyOn}
              onChange={(e) => setDutyOn(e.target.value || bangkokDateKey())}
            />
          </label>
        </div>
        {!readOnly ? (
          <button
            type="button"
            className={cn(smartGuardTourPrimaryButtonClass, "mb-0.5 min-w-[40px] shrink-0")}
            aria-label="เพิ่มเวรประจำจุด"
            onClick={openAdd}
            disabled={!data?.posts.length || !data?.staff.length}
          >
            <span className="sm:hidden" aria-hidden>
              +
            </span>
            <span className="hidden sm:inline">+ จัดเวร</span>
          </button>
        ) : null}
      </div>

      {warnings.length > 0 ? (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/90 px-3 py-2 text-xs font-semibold text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <div className="min-w-0 space-y-0.5">
            {warnings.map((w) => (
              <p key={w.staffId}>
                {w.displayName}: ปกติ {formatMinutesHm(w.normalMinutes)} /{" "}
                {formatMinutesHm(w.weeklyNormalCapMinutes)} สัปดาห์นี้
              </p>
            ))}
          </div>
        </div>
      ) : null}

      {loading || !data ? (
        <p className="text-sm text-[#66638c]">กำลังโหลด…</p>
      ) : data.duties.length === 0 ? (
        <AppEmptyState>
          {data.posts.length === 0 ? "ยังไม่มีจุดรักษาการณ์" : "ยังไม่มีเวรวันนี้"}
        </AppEmptyState>
      ) : (
        <div className="space-y-2">
          {data.duties.map((d) => (
            <div key={d.id} className={smartGuardTourTonedRowCardClass("orange")}>
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <span className={smartGuardTourCardIconTileClass("orange")}>
                  <ShieldCheck className="h-5 w-5" strokeWidth={2.25} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-[#1e1b4b]">
                    {d.post.name}
                    {d.post.code ? ` · ${d.post.code}` : ""}
                  </p>
                  <p className="text-xs font-medium text-[#66638c]">
                    {d.staff.displayName} · {d.template.name} ({d.template.startHm}–{d.template.endHm})
                  </p>
                  {d.tourAssignments.length > 0 ? (
                    <p className="mt-0.5 flex flex-wrap items-center gap-1 text-[10px] font-bold text-sky-800">
                      <Route className="h-3 w-3" aria-hidden />
                      สายตรวจ: {d.tourAssignments.map((a) => a.scheduleName).join(", ")}
                    </p>
                  ) : null}
                </div>
              </div>
              {!readOnly ? (
                <button
                  type="button"
                  className={assetRowRemoveIconButtonClass}
                  aria-label={`ลบเวร ${d.post.name}`}
                  title="ลบ"
                  disabled={busy}
                  onClick={() => void removeDuty(d.id)}
                >
                  <IconRowRemove className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {!readOnly ? (
        <FormModal
          open={open}
          onClose={() => setOpen(false)}
          title="จัดเวรประจำจุด"
          size="md"
          footer={
            <FormModalFooterActions
              onCancel={() => setOpen(false)}
              onSubmit={() => void save()}
              submitLabel="บันทึก"
              submitDisabled={busy || !form.postId || !form.staffId || !form.templateId}
              loading={busy}
            />
          }
        >
          <div className="space-y-3">
            <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
              จุดรักษาการณ์
              <select
                className={smartGuardTourFieldClass}
                value={form.postId}
                onChange={(e) => setForm((f) => ({ ...f, postId: e.target.value }))}
              >
                {(data?.posts ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
              พนักงาน
              <select
                className={smartGuardTourFieldClass}
                value={form.staffId}
                onChange={(e) => setForm((f) => ({ ...f, staffId: e.target.value }))}
              >
                {(data?.staff ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.displayName}
                    {s.displayName}
                    {s.wageBahtPerShift && s.wageBahtPerShift > 0
                      ? ` · สำรอง ${s.wageBahtPerShift}฿/กะ`
                      : s.hourlyRateBaht > 0
                        ? ` · ${s.hourlyRateBaht}฿/ชม.`
                        : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
              กะ
              <select
                className={smartGuardTourFieldClass}
                value={form.templateId}
                onChange={(e) => setForm((f) => ({ ...f, templateId: e.target.value }))}
              >
                {(data?.templates ?? []).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.startHm}–{t.endHm}
                    {t.shiftRateBaht > 0 ? ` · ${t.shiftRateBaht}฿/กะ` : ""})
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
              สายตรวจควบ (ไม่บังคับ)
              <select
                className={smartGuardTourFieldClass}
                value={form.scheduleId}
                onChange={(e) => setForm((f) => ({ ...f, scheduleId: e.target.value }))}
              >
                <option value="">— ไม่มอบหมาย —</option>
                {(data?.schedules ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </FormModal>
      ) : null}
    </div>
  );
}
