"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import {
  assetRowEditIconButtonClass,
  assetRowRemoveIconButtonClass,
  IconRowEdit,
  IconRowRemove,
} from "@/systems/asset/components/AssetRowActionIcons";
import { useAppNoticePopup } from "@/components/app-templates";
import { ProResumePagePanel } from "@/systems/pro-resume/components/ProResumePagePanel";
import { ProResumeRichTextField } from "@/systems/pro-resume/components/ProResumeRichTextField";
import {
  proResumeCardIconTileClass,
  proResumeTonedRowCardClass,
} from "@/systems/pro-resume/lib/card-tones";
import type { ResumeSkillDto } from "@/systems/pro-resume/lib/mappers";
import {
  proResumePageTitleIcon,
  proResumePageTitleTone,
  proResumeSectionIcon,
} from "@/systems/pro-resume/lib/page-menu-icons";
import {
  proResumeFieldClass,
  proResumeFilterChipClass,
  proResumeFilterChipShellClass,
  proResumeOutlineButtonClass,
  proResumePrimaryButtonClass,
  proResumeRowIconButtonClass,
} from "@/systems/pro-resume/lib/ui-tokens";

const labelClass = "block space-y-1 text-xs font-bold text-[#4d47b6]";

const SKILL_LEVEL_PRESETS = ["พื้นฐาน", "ดี", "ดีมาก", "เชี่ยวชาญ"] as const;

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

export function ProResumeSkillsClient() {
  const notice = useAppNoticePopup();
  const [skills, setSkills] = useState<ResumeSkillDto[]>([]);
  const [filterOpen, setFilterOpen] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [modal, setModal] = useState<ResumeSkillDto | "new" | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/pro-resume/session/skills");
      const data = (await res.json()) as { skills?: ResumeSkillDto[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? "โหลดไม่สำเร็จ");
      setSkills(data.skills ?? []);
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "โหลดไม่สำเร็จ");
    }
  }, [notice]);

  useEffect(() => {
    void load();
  }, [load]);

  const levelOptions = useMemo(() => {
    const set = new Set<string>();
    for (const s of skills) {
      const lv = s.level.trim();
      if (lv) set.add(lv);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "th"));
  }, [skills]);

  const filtersActive = Boolean(keyword.trim() || levelFilter !== "all");

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return skills.filter((s) => {
      if (levelFilter !== "all" && s.level.trim() !== levelFilter) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.level.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)
      );
    });
  }, [skills, keyword, levelFilter]);

  const reorder = async (ids: string[]) => {
    const res = await fetch("/api/pro-resume/session/skills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds: ids }),
    });
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      throw new Error(data.error ?? "จัดลำดับไม่สำเร็จ");
    }
    await load();
  };

  const moveItem = async (index: number, dir: -1 | 1) => {
    if (filtersActive) {
      notice.error("ล้างตัวกรองก่อนจัดลำดับ");
      return;
    }
    const next = [...skills];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j]!, next[index]!];
    try {
      await reorder(next.map((r) => r.id));
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "จัดลำดับไม่สำเร็จ");
    }
  };

  const deleteRow = async (id: string, name: string) => {
    const ok = await notice.confirm(`ลบทักษะ «${name}» ใช่หรือไม่?`);
    if (!ok) return;
    const res = await fetch(`/api/pro-resume/session/skills/${id}`, { method: "DELETE" });
    if (!res.ok) {
      notice.error("ลบไม่สำเร็จ");
      return;
    }
    await load();
  };

  return (
    <>
      {notice.popup}

      <ProResumePagePanel
        title="ทักษะพิเศษ"
        subtitle="ความสามารถพิเศษที่จะนำเสนอบนเรซูเม่สาธารณะ"
        titleIcon={proResumePageTitleIcon("skills")}
        titleTone={proResumePageTitleTone("skills")}
        action={
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              className={cn(
                proResumeOutlineButtonClass,
                "relative inline-flex min-h-[40px] min-w-[40px] items-center justify-center gap-1.5 sm:min-w-0 sm:px-3",
                filterOpen && "border-[#0000BF]/45 bg-[#0000BF]/10 ring-2 ring-[#0000BF]/20",
                filtersActive && !filterOpen && "border-amber-300/80 bg-amber-50/90",
              )}
              aria-expanded={filterOpen}
              aria-controls="pro-resume-skills-filter-panel"
              aria-label={filterOpen ? "ซ่อนตัวกรอง" : "แสดงตัวกรอง"}
              title={filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}
              onClick={() => setFilterOpen((o) => !o)}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M4 5h16M7 12h10M10 19h4" strokeLinecap="round" />
              </svg>
              <span className="hidden sm:inline">{filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}</span>
              {filtersActive && !filterOpen ? (
                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-amber-500" aria-hidden />
              ) : null}
            </button>
            <button
              type="button"
              className={cn(proResumePrimaryButtonClass, "min-h-[40px] min-w-[40px] sm:min-w-0")}
              onClick={() => setModal("new")}
              aria-label="เพิ่มทักษะพิเศษ"
            >
              <span className="sm:hidden">+</span>
              <span className="hidden sm:inline">+ เพิ่มทักษะ</span>
            </button>
          </div>
        }
      >
        <div
          id="pro-resume-skills-filter-panel"
          className={cn("space-y-3", filterOpen ? "block" : "hidden")}
        >
          <nav className={proResumeFilterChipShellClass} role="tablist" aria-label="กรองระดับทักษะ">
            <button
              type="button"
              role="tab"
              aria-selected={levelFilter === "all"}
              className={proResumeFilterChipClass(levelFilter === "all")}
              onClick={() => setLevelFilter("all")}
            >
              ทั้งหมด ({skills.length})
            </button>
            {levelOptions.map((lv) => (
              <button
                key={lv}
                type="button"
                role="tab"
                aria-selected={levelFilter === lv}
                className={proResumeFilterChipClass(levelFilter === lv)}
                onClick={() => setLevelFilter(lv)}
              >
                {lv} ({skills.filter((s) => s.level.trim() === lv).length})
              </button>
            ))}
          </nav>
          <label className={labelClass}>
            ค้นหา
            <input
              className={proResumeFieldClass}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="ชื่อทักษะ · ระดับ · รายละเอียด"
            />
          </label>
          {filtersActive ? (
            <button
              type="button"
              className={proResumeOutlineButtonClass}
              onClick={() => {
                setKeyword("");
                setLevelFilter("all");
              }}
            >
              ล้างกรอง
            </button>
          ) : null}
          <p className="text-xs font-medium text-[#66638c]">
            แสดง {filtered.length}/{skills.length}
          </p>
        </div>

        {filtered.length ? (
          <ul className="space-y-2">
            {filtered.map((row, i) => (
              <li key={row.id} className={proResumeTonedRowCardClass("amber")}>
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  {!filtersActive ? (
                    <ReorderButtons
                      index={i}
                      total={filtered.length}
                      label={row.name}
                      onUp={() => void moveItem(i, -1)}
                      onDown={() => void moveItem(i, 1)}
                    />
                  ) : null}
                  <span className={proResumeCardIconTileClass("amber", "md")} aria-hidden>
                    {proResumeSectionIcon("skill")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-[#1e1b4b]">{row.name}</p>
                    {row.level.trim() ? (
                      <p className="text-sm font-semibold text-[#4d47b6]">{row.level}</p>
                    ) : null}
                    {row.description.trim() ? (
                      <p className="mt-0.5 line-clamp-2 text-xs text-[#66638c]">{row.description.replace(/<[^>]+>/g, " ")}</p>
                    ) : null}
                  </div>
                </div>
                <div className="flex shrink-0 gap-1 self-end sm:self-center">
                  <button
                    type="button"
                    className={assetRowEditIconButtonClass}
                    aria-label={`แก้ไข ${row.name}`}
                    title="แก้ไข"
                    onClick={() => setModal(row)}
                  >
                    <IconRowEdit className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className={assetRowRemoveIconButtonClass}
                    aria-label={`ลบ ${row.name}`}
                    title="ลบ"
                    onClick={() => void deleteRow(row.id, row.name)}
                  >
                    <IconRowRemove className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[#66638c]">
            {skills.length ? "ไม่พบรายการตามตัวกรอง" : "ยังไม่มีทักษะพิเศษ — กดเพิ่มเพื่อเริ่มนำเสนอ"}
          </p>
        )}
      </ProResumePagePanel>

      <SkillModal open={modal !== null} row={modal} onClose={() => setModal(null)} onSaved={load} notice={notice} />
    </>
  );
}

function SkillModal({
  open,
  row,
  onClose,
  onSaved,
  notice,
}: {
  open: boolean;
  row: ResumeSkillDto | "new" | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
  notice: ReturnType<typeof useAppNoticePopup>;
}) {
  const [form, setForm] = useState({ name: "", level: "", description: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (row && row !== "new") {
      setForm({ name: row.name, level: row.level, description: row.description });
    } else {
      setForm({ name: "", level: "", description: "" });
    }
  }, [open, row]);

  const submit = async () => {
    setBusy(true);
    try {
      const payload = {
        name: form.name,
        level: form.level,
        description: form.description,
      };
      const isEdit = row && row !== "new";
      const res = await fetch(isEdit ? `/api/pro-resume/session/skills/${row.id}` : "/api/pro-resume/session/skills", {
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
      title={row === "new" ? "เพิ่มทักษะพิเศษ" : "แก้ไขทักษะพิเศษ"}
      description="ชื่อและความสามารถพิเศษที่จะโชว์บนเรซูเม่สาธารณะ"
      size="md"
      footer={
        <FormModalFooterActions
          onCancel={onClose}
          onSubmit={() => void submit()}
          submitLabel="บันทึก"
          loading={busy}
          submitDisabled={!form.name.trim()}
        />
      }
    >
      <div className="space-y-3">
        <label className={labelClass}>
          ชื่อทักษะ / ความสามารถ
          <input
            className={proResumeFieldClass}
            value={form.name}
            disabled={busy}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="เช่น นำเสนอแผนธุรกิจ · ถ่ายภาพผลิตภัณฑ์"
          />
        </label>
        <div className="space-y-1.5">
          <p className="text-xs font-bold text-[#4d47b6]">ระดับ (ไม่บังคับ)</p>
          <div className="flex flex-wrap gap-1.5">
            {SKILL_LEVEL_PRESETS.map((lv) => (
              <button
                key={lv}
                type="button"
                className={proResumeFilterChipClass(form.level === lv)}
                disabled={busy}
                onClick={() => setForm((f) => ({ ...f, level: f.level === lv ? "" : lv }))}
              >
                {lv}
              </button>
            ))}
          </div>
          <input
            className={proResumeFieldClass}
            value={form.level}
            disabled={busy}
            onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))}
            placeholder="หรือพิมพ์ระดับเอง"
          />
        </div>
        <ProResumeRichTextField
          label="รายละเอียด / จุดเด่น"
          value={form.description}
          disabled={busy}
          onChange={(description) => setForm((f) => ({ ...f, description }))}
          placeholder={`# จุดเด่น
ใช้ในงานนำเสนอและปิดการขาย

~ รายละเอียดเสริม

- ตัวอย่างผลงานหรือบริบทการใช้
- เครื่องมือ / เทคนิคที่เกี่ยวข้อง`}
        />
      </div>
    </FormModal>
  );
}
