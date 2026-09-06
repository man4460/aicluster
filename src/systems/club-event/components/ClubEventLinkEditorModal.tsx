"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useAppNoticePopup } from "@/components/app-templates";
import { FormModal } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import { clubLinkFieldsHavePrices } from "@/systems/club-event/lib/link-field-amount";
import {
  CLUB_EVENT_LINK_TYPE_LABELS,
  defaultClubLinkQtyItems,
  normalizeClubDynamicLinkFields,
  type ClubDynamicLinkChoiceOption,
  type ClubDynamicLinkField,
  type ClubDynamicLinkFieldType,
  type ClubDynamicLinkQtyItem,
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
  linkAnnualDues: boolean;
};

export type ClubProfileDuesOption = {
  enabled: boolean;
  amountBaht: number;
  periodLabel: string;
  linkId: string | null;
};

function newFieldKey(): string {
  return `q${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function choiceOptionsOf(field: ClubDynamicLinkField): ClubDynamicLinkChoiceOption[] {
  if (field.choiceOptions && field.choiceOptions.length > 0) return field.choiceOptions;
  return (field.options ?? []).map((label) => ({ label, amountBaht: 0 }));
}

function emptyField(type: ClubDynamicLinkFieldType = "text"): ClubDynamicLinkField {
  if (type === "qty") {
    return {
      key: newFieldKey(),
      label: "ขนาดเสื้อ",
      type: "qty",
      qtyItems: defaultClubLinkQtyItems(),
      required: false,
    };
  }
  if (type === "choice") {
    const choiceOptions: ClubDynamicLinkChoiceOption[] = [
      { label: "ใช่", amountBaht: 0 },
      { label: "ไม่ใช่", amountBaht: 0 },
    ];
    return {
      key: newFieldKey(),
      label: "",
      type: "choice",
      choiceOptions,
      options: choiceOptions.map((o) => o.label),
      required: false,
    };
  }
  return {
    key: newFieldKey(),
    label: "",
    type: "text",
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
    linkAnnualDues: false,
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
    linkAnnualDues: Boolean(l.config.linkAnnualDues) || Boolean(l.config.annualDuesLinkId),
  };
}

export function ClubEventLinkEditorModal({
  open,
  onClose,
  initial,
  events,
  onSaved,
  lockEventId = false,
  profileDues = null,
}: {
  open: boolean;
  onClose: () => void;
  initial: LinkFormState;
  events: ClubEventRecordDto[];
  onSaved: () => void | Promise<void>;
  /** เมื่อสร้าง/แก้จากหน้ารายละเอียดกิจกรรม — ห้ามเปลี่ยนกิจกรรมที่ผูก */
  lockEventId?: boolean;
  profileDues?: ClubProfileDuesOption | null;
}) {
  const notice = useAppNoticePopup();
  const [form, setForm] = useState<LinkFormState>(initial);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(initial);
  }, [open, initial]);

  const showFields = form.type === "SURVEY" || form.type === "RSVP" || form.type === "PAYMENT";

  const addField = (type: ClubDynamicLinkFieldType = "text") => {
    setForm((f) => ({ ...f, fields: [...f.fields, emptyField(type)] }));
  };

  const addQuestionButtons = (
    <div className="flex flex-wrap gap-1">
      <button
        type="button"
        className={cn(clubEventOutlineButtonClass, "gap-1")}
        onClick={() => addField("text")}
      >
        <Plus className="h-4 w-4" aria-hidden />
        เพิ่มคำถาม
      </button>
      <button
        type="button"
        className={cn(clubEventOutlineButtonClass, "gap-1")}
        onClick={() => addField("qty")}
      >
        <Plus className="h-4 w-4" aria-hidden />
        ขนาดเสื้อ
      </button>
    </div>
  );

  const updateField = (index: number, patch: Partial<ClubDynamicLinkField>) => {
    setForm((f) => ({
      ...f,
      fields: f.fields.map((row, i) => {
        if (i !== index) return row;
        const next: ClubDynamicLinkField = { ...row, ...patch };
        if (patch.type === "choice") {
          const opts = choiceOptionsOf(next);
          next.choiceOptions =
            opts.length >= 2
              ? opts
              : [
                  { label: "ตัวเลือก 1", amountBaht: 0 },
                  { label: "ตัวเลือก 2", amountBaht: 0 },
                ];
          next.options = next.choiceOptions.map((o) => o.label);
          next.qtyItems = undefined;
        }
        if (patch.type === "qty") {
          next.qtyItems = next.qtyItems && next.qtyItems.length > 0 ? next.qtyItems : defaultClubLinkQtyItems();
          next.options = undefined;
          next.choiceOptions = undefined;
          if (!next.label.trim()) next.label = "ขนาดเสื้อ";
        }
        if (patch.type === "text") {
          next.options = undefined;
          next.choiceOptions = undefined;
          next.qtyItems = undefined;
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
    if (lockEventId && !form.eventId) {
      notice.error("ต้องผูกกับกิจกรรม");
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

    if (form.type === "PAYMENT") {
      const base = Number(form.amountBaht) || 0;
      if (base <= 0 && !clubLinkFieldsHavePrices(fields)) {
        notice.error("กรอกยอดตั้งต้น หรือกำหนดราคาในคำถาม (ตัวเลือก / ขนาดเสื้อ)");
        return;
      }
    }

    if (showFields && (form.type === "SURVEY" || form.type === "RSVP" || form.type === "PAYMENT")) {
      if ((form.type === "SURVEY" || form.type === "RSVP") && fields.length === 0) {
        notice.error("เพิ่มอย่างน้อย 1 คำถาม");
        return;
      }
      for (const f of fields) {
        if (f.type === "choice" && (!f.choiceOptions || f.choiceOptions.length < 2) && (!f.options || f.options.length < 2)) {
          notice.error(`คำถาม «${f.label}» ต้องมีอย่างน้อย 2 ตัวเลือก`);
          return;
        }
        if (f.type === "qty") {
          if (!f.qtyItems || f.qtyItems.length < 1) {
            notice.error(`คำถาม «${f.label}» ต้องมีอย่างน้อย 1 รายการย่อย`);
            return;
          }
          if (f.qtyItems.some((item) => !item.label.trim())) {
            notice.error(`คำถาม «${f.label}» — กรอกชื่อรายการย่อยให้ครบ (เช่น XL)`);
            return;
          }
        }
      }
    }

    setSaving(true);
    try {
      const eventId = form.eventId || undefined;
      const duesExtras =
        profileDues?.enabled && form.linkAnnualDues
          ? {
              linkAnnualDues: true as const,
              annualDuesLinkId: profileDues.linkId ?? undefined,
            }
          : { linkAnnualDues: false as const };
      const config =
        form.type === "PAYMENT"
          ? {
              amountBaht: Number(form.amountBaht) || 0,
              description: form.description.trim() || undefined,
              eventId,
              fields: fields.length > 0 ? fields : undefined,
              ...duesExtras,
            }
          : form.type === "URL"
            ? {
                url: form.url.trim(),
                description: form.description.trim() || undefined,
                eventId,
                ...duesExtras,
              }
            : {
                description: form.description.trim() || undefined,
                eventId,
                fields,
                ...duesExtras,
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
            <span className="mt-1 block text-[11px] font-semibold text-[#8b87b8]">
              จำเป็น — กำหนดพฤติกรรมลิงก์ (ลงทะเบียน / สำรวจ / เก็บเงิน / ลิงก์นอก)
            </span>
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

          {profileDues?.enabled && profileDues.amountBaht > 0 ? (
            <label className="flex min-h-[48px] cursor-pointer items-center gap-3 rounded-2xl border border-slate-100 bg-white px-3 py-2.5">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-[#5b61ff] focus:ring-[#5b61ff]"
                checked={form.linkAnnualDues}
                onChange={(e) => setForm({ ...form, linkAnnualDues: e.target.checked })}
              />
              <span className="min-w-0">
                <span className="block text-sm font-black text-[#1e1b4b]">
                  พ่วงค่าบำรุง · {profileDues.periodLabel}
                </span>
                <span className="block text-[11px] font-semibold text-[#66638c]">
                  ฿{profileDues.amountBaht.toLocaleString("th-TH")} — ผู้กรอกเลือกจ่ายพร้อมลิงก์นี้ได้
                </span>
              </span>
            </label>
          ) : null}

          {lockEventId ? (
            <p className="rounded-lg border border-slate-200/90 bg-slate-50/80 px-3 py-2 text-xs font-semibold text-[#66638c]">
              ผูกกับกิจกรรม:{" "}
              <span className="text-[#1e1b4b]">
                {events.find((ev) => ev.id === form.eventId)?.title ?? "กิจกรรมนี้"}
              </span>
            </p>
          ) : (
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
          )}

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
            clubLinkFieldsHavePrices(form.fields) ? (
              <p className="rounded-lg border border-emerald-100 bg-emerald-50/80 px-3 py-2 text-xs font-semibold text-emerald-800">
                ยอดชำระคำนวณอัตโนมัติจากราคาในคำถาม (ตัวเลือก / จำนวน × ราคา) — ไม่ต้องกรอกยอดตั้งต้น
              </p>
            ) : (
              <label className={labelClass}>
                <span className={labelTextClass}>ยอดตั้งต้น (บาท) — ไม่บังคับถ้าใส่ราคาในคำถาม</span>
                <input
                  className={cn(clubEventFieldClass, "mt-1")}
                  value={form.amountBaht}
                  onChange={(e) => setForm({ ...form, amountBaht: e.target.value })}
                  placeholder="เว้นว่างหรือ 0 ได้"
                  inputMode="decimal"
                />
                <span className="mt-1 block text-[11px] font-semibold text-[#8b87b8]">
                  ใช้เมื่อเก็บเงินคงที่ · ถ้าคิดจากคำถาม ให้ใส่ราคาที่ตัวเลือก/ขนาดเสื้อแทน
                </span>
              </label>
            )
          ) : null}

          {showFields ? (
            <div className="space-y-3 rounded-lg border border-slate-200/90 bg-slate-50/60 p-3 pb-20 sm:pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-black text-[#4d47b6]">ชุดคำถาม (นอกจากชื่อ-เบอร์)</p>
                {addQuestionButtons}
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
                            <option value="text">ข้อความ</option>
                            <option value="choice">ตัวเลือก (ใส่ราคาได้)</option>
                            <option value="qty">จำนวน × ราคา (ขนาดเสื้อ)</option>
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
                        <div className="space-y-2">
                          <span className={labelTextClass}>ตัวเลือก</span>
                          <div className="grid grid-cols-[minmax(0,1fr)_5.5rem_2.5rem] gap-2 text-[10px] font-bold text-[#8b87b8]">
                            <span>ตัวเลือก</span>
                            <span>ราคาต่อหน่วย</span>
                            <span className="sr-only">ลบ</span>
                          </div>
                          <ul className="space-y-2">
                            {choiceOptionsOf(field).map((opt, optIdx) => (
                              <li
                                key={`${field.key}-opt-${optIdx}`}
                                className="grid grid-cols-[minmax(0,1fr)_5.5rem_2.5rem] gap-2"
                              >
                                <input
                                  className={cn(clubEventFieldClass, "min-w-0")}
                                  value={opt.label}
                                  onChange={(e) => {
                                    const opts = [...choiceOptionsOf(field)];
                                    opts[optIdx] = { ...opts[optIdx]!, label: e.target.value };
                                    updateField(index, {
                                      choiceOptions: opts,
                                      options: opts.map((o) => o.label),
                                    });
                                  }}
                                  placeholder={`ตัวเลือก ${optIdx + 1}`}
                                />
                                <input
                                  className={cn(clubEventFieldClass, "text-center")}
                                  value={opt.amountBaht > 0 ? String(opt.amountBaht) : ""}
                                  onChange={(e) => {
                                    const opts = [...choiceOptionsOf(field)];
                                    const n = Math.max(0, Math.round(Number(e.target.value)) || 0);
                                    opts[optIdx] = { ...opts[optIdx]!, amountBaht: n };
                                    updateField(index, {
                                      choiceOptions: opts,
                                      options: opts.map((o) => o.label),
                                    });
                                  }}
                                  placeholder="0"
                                  inputMode="decimal"
                                  aria-label={`ราคาต่อหน่วยตัวเลือก ${optIdx + 1}`}
                                />
                                <button
                                  type="button"
                                  className="inline-flex h-9 w-10 shrink-0 items-center justify-center rounded-lg text-rose-600 hover:bg-rose-50 disabled:opacity-40"
                                  aria-label={`ลบตัวเลือก ${optIdx + 1}`}
                                  title="ลบตัวเลือก"
                                  disabled={choiceOptionsOf(field).length <= 2}
                                  onClick={() => {
                                    const opts = choiceOptionsOf(field).filter((_, i) => i !== optIdx);
                                    updateField(index, {
                                      choiceOptions: opts,
                                      options: opts.map((o) => o.label),
                                    });
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" aria-hidden />
                                </button>
                              </li>
                            ))}
                          </ul>
                          <button
                            type="button"
                            className={cn(clubEventOutlineButtonClass, "w-full gap-1 sm:w-auto")}
                            onClick={() => {
                              const opts = [...choiceOptionsOf(field)];
                              opts.push({ label: `ตัวเลือก ${opts.length + 1}`, amountBaht: 0 });
                              updateField(index, {
                                choiceOptions: opts,
                                options: opts.map((o) => o.label),
                              });
                            }}
                          >
                            <Plus className="h-4 w-4" aria-hidden />
                            เพิ่มตัวเลือก
                          </button>
                          <p className="text-[11px] font-semibold text-[#8b87b8]">
                            อย่างน้อย 2 ตัวเลือก · ราคา 0 = ไม่คิดเงินเพิ่ม
                          </p>
                        </div>
                      ) : null}

                      {field.type === "qty" ? (
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className={labelTextClass}>รายการย่อย</span>
                            <button
                              type="button"
                              className={cn(clubEventOutlineButtonClass, "gap-1")}
                              onClick={() => updateField(index, { qtyItems: defaultClubLinkQtyItems() })}
                            >
                              ขนาดเสื้อ 3XL–SS
                            </button>
                          </div>
                          <div className="grid grid-cols-[minmax(0,1fr)_4.25rem_5.25rem_2.5rem] gap-2 text-[10px] font-bold text-[#8b87b8]">
                            <span>ตัวเลือก</span>
                            <span>จำนวน</span>
                            <span>ราคาต่อหน่วย</span>
                            <span className="sr-only">ลบ</span>
                          </div>
                          <ul className="space-y-2">
                            {(field.qtyItems ?? []).map((item, itemIdx) => (
                              <li
                                key={item.key}
                                className="grid grid-cols-[minmax(0,1fr)_4.25rem_5.25rem_2.5rem] gap-2"
                              >
                                <input
                                  className={cn(clubEventFieldClass, "min-w-0")}
                                  value={item.label}
                                  onChange={(e) => {
                                    const items = [...(field.qtyItems ?? [])];
                                    items[itemIdx] = { ...items[itemIdx]!, label: e.target.value };
                                    updateField(index, { qtyItems: items });
                                  }}
                                  placeholder="เช่น XL"
                                  aria-label={`ตัวเลือก ${itemIdx + 1}`}
                                />
                                <input
                                  className={cn(clubEventFieldClass, "text-center")}
                                  value={item.defaultQty && item.defaultQty > 0 ? String(item.defaultQty) : ""}
                                  onChange={(e) => {
                                    const items = [...(field.qtyItems ?? [])];
                                    const n = Math.max(0, Math.min(999, Math.floor(Number(e.target.value)) || 0));
                                    items[itemIdx] = { ...items[itemIdx]!, defaultQty: n };
                                    updateField(index, { qtyItems: items });
                                  }}
                                  placeholder="0"
                                  inputMode="numeric"
                                  aria-label={`จำนวน ${item.label || `รายการ ${itemIdx + 1}`}`}
                                />
                                <input
                                  className={cn(clubEventFieldClass, "text-center")}
                                  value={item.amountBaht > 0 ? String(item.amountBaht) : ""}
                                  onChange={(e) => {
                                    const items = [...(field.qtyItems ?? [])];
                                    const n = Math.max(0, Math.round(Number(e.target.value)) || 0);
                                    items[itemIdx] = { ...items[itemIdx]!, amountBaht: n };
                                    updateField(index, { qtyItems: items });
                                  }}
                                  placeholder="0"
                                  inputMode="decimal"
                                  aria-label={`ราคาต่อหน่วย ${item.label || `รายการ ${itemIdx + 1}`}`}
                                />
                                <button
                                  type="button"
                                  className="inline-flex h-9 w-10 shrink-0 items-center justify-center rounded-lg text-rose-600 hover:bg-rose-50 disabled:opacity-40"
                                  aria-label={`ลบรายการ ${item.label || itemIdx + 1}`}
                                  title="ลบรายการ"
                                  disabled={(field.qtyItems ?? []).length <= 1}
                                  onClick={() => {
                                    const items = (field.qtyItems ?? []).filter((_, i) => i !== itemIdx);
                                    updateField(index, { qtyItems: items });
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" aria-hidden />
                                </button>
                              </li>
                            ))}
                          </ul>
                          <button
                            type="button"
                            className={cn(clubEventOutlineButtonClass, "w-full gap-1 sm:w-auto")}
                            onClick={() => {
                              const items: ClubDynamicLinkQtyItem[] = [...(field.qtyItems ?? [])];
                              items.push({
                                key: `item_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
                                label: "",
                                amountBaht: 0,
                                defaultQty: 0,
                              });
                              updateField(index, { qtyItems: items });
                            }}
                          >
                            <Plus className="h-4 w-4" aria-hidden />
                            เพิ่มตัวเลือก
                          </button>
                          <p className="text-[11px] font-semibold text-[#8b87b8]">
                            จำนวน = ค่าเริ่มบนฟอร์มผู้ตอบ · ราคาต่อหน่วยใช้เมื่อประเภทลิงก์เป็นเก็บเงิน
                          </p>
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
              <div className="border-t border-slate-200/80 pt-3">{addQuestionButtons}</div>
            </div>
          ) : null}
        </div>
      </FormModal>
    </>
  );
}
