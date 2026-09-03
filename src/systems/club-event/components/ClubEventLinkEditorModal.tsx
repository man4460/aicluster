"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useAppNoticePopup } from "@/components/app-templates";
import { FormModal } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import {
  CLUB_EVENT_LINK_TYPE_LABELS,
  normalizeClubDynamicLinkFields,
  type ClubDynamicLinkField,
  type ClubDynamicLinkFieldType,
  type ClubEventDynamicLinkDto,
  type ClubEventRecordDto,
} from "@/systems/club-event/lib/mappers";
import {
  clubEventFieldClass,
  clubEventFixedBottomActionClass,
  clubEventOutlineButtonClass,
  clubEventPrimaryButtonClass,
  clubEventTextareaClass,
} from "@/systems/club-event/lib/ui-tokens";

const labelClass = "block space-y-1";
const labelTextClass = "text-xs font-bold text-[#4d47b6]";

type LinkFormState = {
  id: string;
  type: ClubEventDynamicLinkDto["type"];
  title: string;
  description: string;
  url: string;
  amountBaht: string;
  eventId: string;
  fields: ClubDynamicLinkField[];
};

function newFieldKey(): string {
  return `q${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function emptyField(type: ClubDynamicLinkFieldType = "text"): ClubDynamicLinkField {
  return {
    key: newFieldKey(),
    label: "",
    type,
    options: type === "choice" ? ["ใช่", "ไม่ใช่"] : undefined,
    required: false,
  };
}

export function emptyClubLinkForm(preset?: {
  type?: ClubEventDynamicLinkDto["type"];
  title?: string;
  eventId?: string;
}): LinkFormState {
  return {
    id: "",
    type: preset?.type ?? "RSVP",
    title: preset?.title ?? "",
    description: "",
    url: "",
    amountBaht: "",
    eventId: preset?.eventId ?? "",
    fields: [emptyField("text")],
  };
}

export function clubLinkFormFromDto(l: ClubEventDynamicLinkDto): LinkFormState {
  const fields = normalizeClubDynamicLinkFields(l.config.fields ?? []);
  return {
    id: l.id,
    type: l.type,
    title: l.title,
    description: l.config.description ?? "",
    url: l.config.url ?? "",
    amountBaht: l.config.amountBaht != null ? String(l.config.amountBaht) : "",
    eventId: l.config.eventId ?? "",
    fields:
      fields.length > 0
        ? fields
        : l.type === "SURVEY" || l.type === "RSVP"
          ? [emptyField("text")]
          : [],
  };
}

export function ClubEventLinkEditorModal({
  open,
  onClose,
  initial,
  events,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  initial: LinkFormState;
  events: ClubEventRecordDto[];
  onSaved: () => void | Promise<void>;
}) {
  const notice = useAppNoticePopup();
  const [form, setForm] = useState<LinkFormState>(initial);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(initial);
  }, [open, initial]);

  const showFields = form.type === "SURVEY" || form.type === "RSVP" || form.type === "PAYMENT";

  const updateField = (index: number, patch: Partial<ClubDynamicLinkField>) => {
    setForm((f) => ({
      ...f,
      fields: f.fields.map((row, i) => {
        if (i !== index) return row;
        const next = { ...row, ...patch };
        if (patch.type === "choice" && !next.options?.length) {
          next.options = ["ตัวเลือก 1", "ตัวเลือก 2"];
        }
        if (patch.type === "text") {
          next.options = undefined;
        }
        return next;
      }),
    }));
  };

  const save = async () => {
    if (!form.title.trim()) {
      notice.error("กรอกชื่อลิงก์");
      return;
    }
    if (form.type === "URL" && !form.url.trim()) {
      notice.error("กรอก URL ปลายทาง");
      return;
    }
    if (form.type === "PAYMENT" && !(Number(form.amountBaht) > 0)) {
      notice.error("กรอกจำนวนเงินที่เก็บ (บาท)");
      return;
    }

    const fields = showFields
      ? normalizeClubDynamicLinkFields(
          form.fields.map((f, i) => ({
            ...f,
            key: f.key || `q${i + 1}`,
            label: f.label.trim(),
          })),
        )
      : [];

    if (showFields && (form.type === "SURVEY" || form.type === "RSVP")) {
      if (fields.length === 0) {
        notice.error("เพิ่มอย่างน้อย 1 คำถาม");
        return;
      }
      for (const f of fields) {
        if (f.type === "choice" && (!f.options || f.options.length < 2)) {
          notice.error(`คำถาม «${f.label}» ต้องมีอย่างน้อย 2 ตัวเลือก`);
          return;
        }
      }
    }

    setSaving(true);
    try {
      const config =
        form.type === "PAYMENT"
          ? {
              amountBaht: Number(form.amountBaht) || 0,
              description: form.description.trim() || undefined,
              eventId: form.eventId || undefined,
              fields: fields.length > 0 ? fields : undefined,
            }
          : form.type === "URL"
            ? { url: form.url.trim(), description: form.description.trim() || undefined }
            : {
                description: form.description.trim() || undefined,
                eventId: form.eventId || undefined,
                fields,
              };

      const payload = { type: form.type, title: form.title.trim(), config, isActive: true };
      const res = await fetch(
        form.id ? `/api/club-event/session/links/${form.id}` : "/api/club-event/session/links",
        {
          method: form.id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "บันทึกไม่สำเร็จ");
      onClose();
      await onSaved();
      notice.success("บันทึกลิงก์แล้ว");
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {notice.popup}
      <FormModal
        open={open}
        onClose={onClose}
        title={form.id ? "แก้ไขลิงก์" : "สร้างลิงก์"}
        mobileCentered
        size="lg"
        footer={
          <div className={clubEventFixedBottomActionClass}>
            <button
              type="button"
              className={cn(clubEventPrimaryButtonClass, "w-full sm:w-auto sm:px-6")}
              disabled={saving}
              onClick={() => void save()}
            >
              บันทึก
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <label className={labelClass}>
            <span className={labelTextClass}>ประเภทลิงก์</span>
            <select
              className={cn(clubEventFieldClass, "mt-1")}
              value={form.type}
              onChange={(e) => {
                const type = e.target.value as ClubEventDynamicLinkDto["type"];
                setForm((f) => ({
                  ...f,
                  type,
                  fields:
                    type === "SURVEY" || type === "RSVP" || type === "PAYMENT"
                      ? f.fields.length > 0
                        ? f.fields
                        : [emptyField("text")]
                      : [],
                }));
              }}
            >
              {(Object.keys(CLUB_EVENT_LINK_TYPE_LABELS) as ClubEventDynamicLinkDto["type"][]).map((t) => (
                <option key={t} value={t}>
                  {CLUB_EVENT_LINK_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </label>

          <label className={labelClass}>
            <span className={labelTextClass}>ชื่อลิงก์ (แสดงให้ผู้เข้าร่วม)</span>
            <input
              className={cn(clubEventFieldClass, "mt-1")}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="เช่น ลงทะเบียนกิจกรรม · สำรวจเมนูอาหาร"
            />
          </label>

          <label className={labelClass}>
            <span className={labelTextClass}>คำอธิบายสั้น</span>
            <textarea
              className={cn(clubEventTextareaClass, "mt-1")}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="รายละเอียดเพิ่มเติมบนหน้าฟอร์ม"
            />
          </label>

          {form.type !== "URL" ? (
            <label className={labelClass}>
              <span className={labelTextClass}>ผูกกับกิจกรรม (ถ้ามี)</span>
              <select
                className={cn(clubEventFieldClass, "mt-1")}
                value={form.eventId}
                onChange={(e) => setForm({ ...form, eventId: e.target.value })}
              >
                <option value="">— ไม่ระบุ —</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {form.type === "URL" ? (
            <label className={labelClass}>
              <span className={labelTextClass}>URL ปลายทาง</span>
              <input
                className={cn(clubEventFieldClass, "mt-1")}
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="https://..."
              />
            </label>
          ) : null}

          {form.type === "PAYMENT" ? (
            <label className={labelClass}>
              <span className={labelTextClass}>จำนวนเงินที่เก็บ (บาท)</span>
              <input
                className={cn(clubEventFieldClass, "mt-1")}
                value={form.amountBaht}
                onChange={(e) => setForm({ ...form, amountBaht: e.target.value })}
                placeholder="100"
                inputMode="decimal"
              />
            </label>
          ) : null}

          {showFields ? (
            <div className="space-y-3 rounded-lg border border-slate-200/90 bg-slate-50/60 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-black text-[#4d47b6]">ชุดคำถาม (นอกจากชื่อ-เบอร์)</p>
                <button
                  type="button"
                  className={cn(clubEventOutlineButtonClass, "gap-1")}
                  onClick={() => setForm((f) => ({ ...f, fields: [...f.fields, emptyField("text")] }))}
                >
                  <Plus className="h-4 w-4" aria-hidden />
                  เพิ่มคำถาม
                </button>
              </div>

              {form.fields.length === 0 ? (
                <p className="text-sm text-[#66638c]">ยังไม่มีคำถาม — กดเพิ่มคำถาม</p>
              ) : (
                <ul className="space-y-3">
                  {form.fields.map((field, index) => (
                    <li key={field.key} className="space-y-2 rounded-lg border border-slate-200/90 bg-white p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-bold text-[#9490c0]">คำถาม {index + 1}</p>
                        <button
                          type="button"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-rose-600 hover:bg-rose-50"
                          aria-label={`ลบคำถาม ${index + 1}`}
                          title="ลบคำถาม"
                          onClick={() =>
                            setForm((f) => ({ ...f, fields: f.fields.filter((_, i) => i !== index) }))
                          }
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                        </button>
                      </div>

                      <label className={labelClass}>
                        <span className={labelTextClass}>ข้อความคำถาม</span>
                        <input
                          className={cn(clubEventFieldClass, "mt-1")}
                          value={field.label}
                          onChange={(e) => updateField(index, { label: e.target.value })}
                          placeholder="เช่น ขนาดเสื้อ · แพ็กเกจอาหาร"
                        />
                      </label>

                      <div className="grid gap-2 sm:grid-cols-2">
                        <label className={labelClass}>
                          <span className={labelTextClass}>ประเภทคำตอบ</span>
                          <select
                            className={cn(clubEventFieldClass, "mt-1")}
                            value={field.type}
                            onChange={(e) =>
                              updateField(index, {
                                type: e.target.value as ClubDynamicLinkFieldType,
                              })
                            }
                          >
                            <option value="text">ข้อความ (text)</option>
                            <option value="choice">ตัวเลือก (choice)</option>
                          </select>
                        </label>
                        <label className="flex items-end gap-2 pb-1">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-slate-300"
                            checked={Boolean(field.required)}
                            onChange={(e) => updateField(index, { required: e.target.checked })}
                          />
                          <span className="text-xs font-bold text-[#4d47b6]">บังคับตอบ</span>
                        </label>
                      </div>

                      {field.type === "choice" ? (
                        <label className={labelClass}>
                          <span className={labelTextClass}>ตัวเลือก (บรรทัดละ 1 รายการ)</span>
                          <textarea
                            className={cn(clubEventTextareaClass, "mt-1")}
                            value={(field.options ?? []).join("\n")}
                            onChange={(e) =>
                              updateField(index, {
                                options: e.target.value
                                  .split("\n")
                                  .map((s) => s.trim())
                                  .filter(Boolean),
                              })
                            }
                            placeholder={"S\nM\nL\nXL"}
                          />
                        </label>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}
        </div>
      </FormModal>
    </>
  );
}
