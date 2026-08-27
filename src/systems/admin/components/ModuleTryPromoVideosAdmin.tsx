"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AppDashboardSection,
  AppEmptyState,
  AppSectionHeader,
  appDashboardBrandCtaPillButtonClass,
  appTemplateOutlineButtonClass,
} from "@/components/app-templates";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import type { TryPromoVideoPublic } from "@/lib/modules/try-promo";
import { extractYoutubeVideoId, youtubeThumbUrl } from "@/lib/youtube-url";
import {
  assetRowEditIconButtonClass,
  assetRowRemoveIconButtonClass,
  IconRowEdit,
  IconRowRemove,
} from "@/systems/asset/components/AssetRowActionIcons";

type Draft = {
  id: string;
  title: string;
  hint: string;
  youtubeUrl: string;
};

function newDraft(): Draft {
  return {
    id: `tmp-${Date.now().toString(36)}`,
    title: "",
    hint: "",
    youtubeUrl: "",
  };
}

export function ModuleTryPromoVideosAdmin({
  moduleSlug,
  moduleTitle,
}: {
  moduleSlug: string;
  moduleTitle: string;
}) {
  const [open, setOpen] = useState(false);
  const [videos, setVideos] = useState<Draft[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [form, setForm] = useState<Draft>(newDraft());

  const load = useCallback(async () => {
    setErr(null);
    const res = await fetch(`/api/admin/module-try-promo/${encodeURIComponent(moduleSlug)}`, {
      credentials: "include",
    });
    const j = (await res.json().catch(() => ({}))) as {
      videos?: TryPromoVideoPublic[];
      error?: string;
    };
    if (!res.ok) {
      setErr(j.error ?? "โหลดวิดีโอไม่สำเร็จ");
      setVideos([]);
      return;
    }
    setVideos(
      (j.videos ?? []).map((v) => ({
        id: v.id,
        title: v.title,
        hint: v.hint,
        youtubeUrl: v.youtubeUrl,
      })),
    );
  }, [moduleSlug]);

  useEffect(() => {
    if (!open) return;
    void load();
  }, [open, load]);

  function openAdd() {
    setEditIdx(null);
    setForm(newDraft());
  }

  function openEdit(i: number) {
    const v = videos[i];
    if (!v) return;
    setEditIdx(i);
    setForm({ ...v });
  }

  function saveFormLocal() {
    const title = form.title.trim();
    const youtubeUrl = form.youtubeUrl.trim();
    if (!title || !youtubeUrl) {
      setErr("กรอกชื่อและลิงก์ YouTube");
      return;
    }
    if (!extractYoutubeVideoId(youtubeUrl)) {
      setErr("ลิงก์ YouTube ไม่ถูกต้อง");
      return;
    }
    setErr(null);
    setVideos((prev) => {
      const next = [...prev];
      const row = { ...form, title, youtubeUrl, hint: form.hint.trim() };
      if (editIdx == null) next.push(row);
      else next[editIdx] = row;
      return next;
    });
    setEditIdx(null);
    setForm(newDraft());
  }

  async function persist() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/module-try-promo/${encodeURIComponent(moduleSlug)}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videos: videos.map((v) => ({
            id: v.id.startsWith("tmp-") ? undefined : v.id,
            title: v.title,
            hint: v.hint || null,
            youtubeUrl: v.youtubeUrl,
          })),
        }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string; videos?: TryPromoVideoPublic[] };
      if (!res.ok) {
        setErr(j.error ?? "บันทึกไม่สำเร็จ");
        return;
      }
      setVideos(
        (j.videos ?? []).map((v) => ({
          id: v.id,
          title: v.title,
          hint: v.hint,
          youtubeUrl: v.youtubeUrl,
        })),
      );
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  const editing = editIdx !== null || form.title || form.youtubeUrl;

  return (
    <>
      <button
        type="button"
        className={cn(appTemplateOutlineButtonClass, "min-h-9 px-3 text-xs font-bold")}
        onClick={() => setOpen(true)}
        aria-label={`จัดการวิดีโอ ${moduleTitle}`}
        title="วิดีโอหน้าทดลอง"
      >
        วิดีโอ
      </button>

      <FormModal
        open={open}
        onClose={() => {
          if (busy) return;
          setOpen(false);
          setEditIdx(null);
          setForm(newDraft());
          setErr(null);
        }}
        title={`วิดีโอ · ${moduleTitle}`}
        description="วางลิงก์ YouTube — ลูกค้ากดดูในหน้า /try ได้เลย"
        size="lg"
        mobileCentered
        footer={
          <FormModalFooterActions
            onCancel={() => {
              if (busy) return;
              setOpen(false);
            }}
            onSubmit={() => void persist()}
            submitLabel="บันทึกทั้งหมด"
            loading={busy}
            submitDisabled={busy}
          />
        }
      >
        <div className="space-y-4">
          {err ? <p className="text-sm font-semibold text-rose-600">{err}</p> : null}

          <AppDashboardSection tone="violet" className="!rounded-[1.25rem] !p-3 sm:!p-4">
            <AppSectionHeader
              title={editIdx == null ? "เพิ่มคลิป" : "แก้ไขคลิป"}
              className="flex flex-row items-start justify-between gap-3"
              actionWrapClassName="shrink-0"
              action={
                editIdx != null ? (
                  <button
                    type="button"
                    className={cn(appTemplateOutlineButtonClass, "min-h-9 px-3 text-xs")}
                    onClick={() => {
                      setEditIdx(null);
                      setForm(newDraft());
                    }}
                  >
                    ยกเลิกแก้
                  </button>
                ) : null
              }
            />
            <div className="mt-3 space-y-2">
              <label className="block text-xs font-bold text-[#4d47b6]">
                ชื่อคลิป
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="app-input mt-1 min-h-11 w-full rounded-xl px-3 text-sm font-semibold"
                  placeholder="เช่น วิธีรับออเดอร์"
                />
              </label>
              <label className="block text-xs font-bold text-[#4d47b6]">
                ลิงก์ YouTube
                <input
                  value={form.youtubeUrl}
                  onChange={(e) => setForm((f) => ({ ...f, youtubeUrl: e.target.value }))}
                  className="app-input mt-1 min-h-11 w-full rounded-xl px-3 text-sm font-semibold"
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </label>
              <label className="block text-xs font-bold text-[#4d47b6]">
                คำอธิบายสั้น (ไม่บังคับ)
                <input
                  value={form.hint}
                  onChange={(e) => setForm((f) => ({ ...f, hint: e.target.value }))}
                  className="app-input mt-1 min-h-11 w-full rounded-xl px-3 text-sm font-semibold"
                  placeholder="เช่น ส่งครัวแบบเรียลไทม์"
                />
              </label>
              <button
                type="button"
                className={cn(appDashboardBrandCtaPillButtonClass, "min-h-10 w-full sm:w-auto sm:px-4")}
                onClick={saveFormLocal}
              >
                {editIdx == null ? "เพิ่มในรายการ" : "อัปเดตรายการ"}
              </button>
              {editing && extractYoutubeVideoId(form.youtubeUrl) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={youtubeThumbUrl(extractYoutubeVideoId(form.youtubeUrl)!)}
                  alt=""
                  className="mt-2 h-24 w-auto rounded-lg object-cover"
                />
              ) : null}
            </div>
          </AppDashboardSection>

          {videos.length === 0 ? (
            <AppEmptyState tone="violet">ยังไม่มีคลิป — เพิ่มลิงก์ YouTube ด้านบน แล้วกดบันทึกทั้งหมด</AppEmptyState>
          ) : (
            <ul className="space-y-2">
              {videos.map((v, i) => {
                const vid = extractYoutubeVideoId(v.youtubeUrl);
                return (
                  <li
                    key={v.id}
                    className="flex items-start gap-3 rounded-xl border border-white/70 bg-white/85 p-3 shadow-sm"
                  >
                    {vid ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={youtubeThumbUrl(vid)}
                        alt=""
                        className="h-14 w-20 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-14 w-20 shrink-0 rounded-lg bg-slate-100" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-sm font-black text-[#1e1b4b]">{v.title}</p>
                      {v.hint ? (
                        <p className="mt-0.5 break-words text-xs font-medium text-[#66638c]">{v.hint}</p>
                      ) : null}
                      <p className="mt-1 break-all text-[10px] text-[#8b87a8]">{v.youtubeUrl}</p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        className={assetRowEditIconButtonClass}
                        aria-label={`แก้ไข ${v.title}`}
                        title="แก้ไข"
                        onClick={() => openEdit(i)}
                      >
                        <IconRowEdit className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className={assetRowRemoveIconButtonClass}
                        aria-label={`ลบ ${v.title}`}
                        title="ลบ"
                        onClick={() => setVideos((prev) => prev.filter((_, j) => j !== i))}
                      >
                        <IconRowRemove className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </FormModal>
    </>
  );
}
