"use client";

import { useEffect, useRef, useState } from "react";
import { FormModal } from "@/components/ui/FormModal";
import {
  LAUNDRY_DURATION_HOURS_MAX,
  LAUNDRY_DURATION_HOURS_MIN,
  formatLaundryDurationHoursForInput,
  parseLaundryDurationHoursInput,
  roundLaundryDurationHours,
} from "@/systems/laundry/laundry-duration-hours";
import {
  uploadLaundrySessionImage,
  type LaundryBasketTier,
  type LaundryPackage,
  type LaundryRepository,
} from "@/systems/laundry/laundry-service";

function defaultCreateDraft() {
  const base = 45;
  return {
    draftName: "",
    draftPricingModel: "PER_KG" as LaundryPackage["pricing_model"],
    draftBasePrice: String(base),
    draftDuration: "24",
    draftDescription: "",
    draftImageUrl: "",
    draftTiers: [{ label: "ตะกร้า S", price: base }] as LaundryBasketTier[],
    draftActive: true,
    draftTotalSessions: "1",
  };
}

/**
 * สร้างหรือแก้ไขแพ็กเกจซักผ้า (รูป · ตะกร้า×ราคา · ราคาฐาน)
 * `editingPackage === null` → โหมดเพิ่มใหม่
 */
export function LaundryPackageEditorModal({
  open,
  onClose,
  editingPackage,
  repo,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  editingPackage: LaundryPackage | null;
  repo: LaundryRepository;
  onSaved: () => void | Promise<void>;
}) {
  const isEdit = editingPackage != null;
  const fileRef = useRef<HTMLInputElement>(null);

  const [draftName, setDraftName] = useState("");
  const [draftPricingModel, setDraftPricingModel] = useState<LaundryPackage["pricing_model"]>("PER_KG");
  const [draftBasePrice, setDraftBasePrice] = useState("");
  const [draftDuration, setDraftDuration] = useState("24");
  const [draftDescription, setDraftDescription] = useState("");
  const [draftImageUrl, setDraftImageUrl] = useState("");
  const [draftTiers, setDraftTiers] = useState<LaundryBasketTier[]>([{ label: "ตะกร้า S", price: 45 }]);
  const [draftActive, setDraftActive] = useState(true);
  const [draftTotalSessions, setDraftTotalSessions] = useState("1");

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!open) return;
    setErr("");
    if (editingPackage) {
      setDraftName(editingPackage.name);
      setDraftPricingModel(editingPackage.pricing_model);
      setDraftBasePrice(String(editingPackage.base_price));
      setDraftDuration(formatLaundryDurationHoursForInput(editingPackage.duration_hours));
      setDraftDescription(editingPackage.description);
      setDraftImageUrl(editingPackage.image_url?.trim() ?? "");
      setDraftTiers(
        editingPackage.basket_tiers?.length ?
          editingPackage.basket_tiers.map((t) => ({ ...t }))
        : [{ label: "ตะกร้า S", price: editingPackage.base_price }],
      );
      setDraftActive(editingPackage.is_active);
      setDraftTotalSessions(String(Math.max(1, editingPackage.total_sessions ?? 1)));
    } else {
      const d = defaultCreateDraft();
      setDraftName(d.draftName);
      setDraftPricingModel(d.draftPricingModel);
      setDraftBasePrice(d.draftBasePrice);
      setDraftDuration(d.draftDuration);
      setDraftDescription(d.draftDescription);
      setDraftImageUrl(d.draftImageUrl);
      setDraftTiers(d.draftTiers);
      setDraftActive(d.draftActive);
      setDraftTotalSessions(d.draftTotalSessions);
    }
  }, [open, editingPackage]);

  async function onImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setErr("");
    try {
      const url = await uploadLaundrySessionImage(f);
      setDraftImageUrl(url);
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "อัปโหลดรูปไม่สำเร็จ");
    }
  }

  async function submit() {
    const base = Number(draftBasePrice);
    if (!draftName.trim() || !Number.isFinite(base) || base < 0) {
      setErr("กรอกชื่อและราคาฐานให้ถูกต้อง");
      return;
    }
    const durParsed = parseLaundryDurationHoursInput(draftDuration);
    const durHours =
      durParsed != null && Number.isFinite(durParsed) ? roundLaundryDurationHours(durParsed) : NaN;
    if (
      durParsed == null ||
      !Number.isFinite(durHours) ||
      durHours < LAUNDRY_DURATION_HOURS_MIN - 1e-9 ||
      durHours > LAUNDRY_DURATION_HOURS_MAX + 1e-9
    ) {
      setErr(
        `เวลาประมาณ (ชม.) ไม่ถูกต้อง — ใส่ประมาณ ${LAUNDRY_DURATION_HOURS_MIN.toFixed(2)}–${LAUNDRY_DURATION_HOURS_MAX} ชม. (เช่น 24 / 1.5 / 0.30 = 30 นาที)`,
      );
      return;
    }
    const cleanedTiers = draftTiers
      .map((t) => ({ label: t.label.trim(), price: Math.round(Number(t.price)) }))
      .filter((t) => t.label.length > 0 && Number.isFinite(t.price) && t.price >= 0);
    const totalSessions = Math.trunc(Number(draftTotalSessions));
    if (!Number.isInteger(totalSessions) || totalSessions < 1 || totalSessions > 9999) {
      setErr("จำนวนครั้งต้องเป็นเลขจำนวนเต็ม 1–9999");
      return;
    }

    setSaving(true);
    setErr("");
    try {
      const nameTrim = draftName.trim().slice(0, 160);
      const descTrim = draftDescription.trim().slice(0, 800);
      const imgTrim = draftImageUrl.trim();
      const payload = {
        name: nameTrim,
        pricing_model: draftPricingModel,
        base_price: Math.round(base),
        duration_hours: durHours,
        total_sessions: totalSessions,
        description: descTrim,
        is_active: draftActive,
        image_url: imgTrim.length > 0 ? imgTrim.slice(0, 500) : null,
        basket_tiers: cleanedTiers.length > 0 ? cleanedTiers : null,
      };

      if (isEdit && editingPackage) {
        const updated = await repo.updatePackage(editingPackage.id, payload);
        if (updated == null) {
          setErr("ไม่พบแพ็กเกจในระบบ — รีเฟรชหน้าแล้วลองใหม่");
          return;
        }
      } else {
        await repo.createPackage(payload);
      }
      await onSaved();
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormModal
      open={open}
      onClose={() => !saving && onClose()}
      title={isEdit && editingPackage ? `จัดการแพ็กเกจ · ${editingPackage.name}` : "เพิ่มแพ็กเกจ"}
      description="รูป · ตะกร้า × ราคา · ราคาฐาน"
      size="lg"
      mobileCentered
      footer={
        <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
          >
            ปิด
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void submit()}
            className="app-btn-primary rounded-xl px-5 py-2.5 text-sm font-semibold disabled:opacity-60"
          >
            {saving ? "กำลังบันทึก..." : isEdit ? "บันทึกการตั้งค่า" : "บันทึกแพ็กเกจ"}
          </button>
        </div>
      }
    >
      <div className="max-h-[min(56vh,480px)] space-y-4 overflow-y-auto pr-1">
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => void onImagePick(e)} />
        <div className="flex flex-wrap items-start gap-3">
          <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
            {draftImageUrl ?
              // eslint-disable-next-line @next/next/no-img-element
              <img src={draftImageUrl} alt="" className="h-full w-full object-cover" />
            : <div className="flex h-full items-center justify-center text-[10px] text-slate-400">ไม่มีรูป</div>}
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-800 hover:bg-indigo-100"
            >
              อัปโหลด / เปลี่ยนรูป
            </button>
            <input
              className="app-input w-full rounded-xl px-3 py-2 text-xs"
              placeholder="หรือวาง URL รูป"
              value={draftImageUrl}
              onChange={(e) => setDraftImageUrl(e.target.value)}
            />
          </div>
        </div>

        <label className="block text-xs font-semibold text-[#4d47b6]">
          ชื่อแพ็กเกจ
          <input
            className="app-input mt-1 w-full rounded-xl px-3 py-2 text-sm"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            placeholder={isEdit ? undefined : "เช่น ซัก-อบ-พับ"}
          />
        </label>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold text-[#66638c]">
            โมเดลราคา
            <select
              className="app-input mt-1 w-full rounded-xl px-3 py-2 text-sm"
              value={draftPricingModel}
              onChange={(e) => setDraftPricingModel(e.target.value as LaundryPackage["pricing_model"])}
            >
              <option value="PER_KG">ต่อกก.</option>
              <option value="PER_ITEM">ต่อชิ้น</option>
              <option value="FLAT">เหมา</option>
            </select>
          </label>
          <label className="text-xs font-semibold text-[#66638c]">
            ราคาฐาน (บาท)
            <input
              className="app-input mt-1 w-full rounded-xl px-3 py-2 text-sm"
              type="number"
              min={0}
              value={draftBasePrice}
              onChange={(e) => setDraftBasePrice(e.target.value)}
            />
          </label>
          <label className="text-xs font-semibold text-[#66638c]">
            เวลาประมาณ (ชั่วโมง)
            <input
              className="app-input mt-1 w-full rounded-xl px-3 py-2 text-sm"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={draftDuration}
              onChange={(e) => setDraftDuration(e.target.value)}
              placeholder="เช่น 24 / 1.5 / 0.30 (30 นาที)"
            />
            <span className="mt-1 block text-[10px] font-normal leading-snug text-slate-500">
              ทศนิยมหลักเดียว = ส่วนของ 0.1 ชม. · สองหลัก = นาที (0.30 = ครึ่งชั่วโมง)
            </span>
          </label>
          <label className="flex cursor-pointer items-center gap-2 pt-6 text-xs font-semibold text-[#2e2a58]">
            <input type="checkbox" checked={draftActive} onChange={(e) => setDraftActive(e.target.checked)} />
            เปิดใช้บนการ์ด POS
          </label>
          <label className="text-xs font-semibold text-[#66638c]">
            จำนวนครั้งในแพ็ก
            <input
              className="app-input mt-1 w-full rounded-xl px-3 py-2 text-sm tabular-nums"
              type="number"
              min={1}
              max={9999}
              value={draftTotalSessions}
              onChange={(e) => setDraftTotalSessions(e.target.value)}
            />
            <span className="mt-1 block text-[10px] font-normal leading-snug text-slate-500">
              1 = รายครั้ง · มากกว่า 1 = เหมาซัก N ครั้ง (ขายเป็นสมาชิกแพ็ก)
            </span>
          </label>
        </div>

        <label className="block text-xs font-semibold text-[#66638c]">
          คำอธิบายสั้นๆ
          <textarea
            className="app-input mt-1 w-full rounded-xl px-3 py-2 text-sm"
            rows={2}
            value={draftDescription}
            onChange={(e) => setDraftDescription(e.target.value)}
          />
        </label>

        <div className="rounded-2xl border border-[#ecebff] bg-[#fafaff] p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#66638c]">ผ้าตะกร้าแต่ละขนาด × ราคา</p>
            <button
              type="button"
              onClick={() =>
                setDraftTiers((rows) => [...rows, { label: `ตะกร้า ${rows.length + 1}`, price: Number(draftBasePrice) || 0 }])
              }
              className="rounded-lg bg-white px-2 py-1 text-[11px] font-bold text-indigo-700 shadow-sm ring-1 ring-indigo-200 hover:bg-indigo-50"
            >
              + เพิ่มแถว
            </button>
          </div>
          <ul className="mt-2 space-y-2">
            {draftTiers.map((row, idx) => (
              <li key={idx} className="flex flex-wrap items-center gap-2 rounded-xl border border-white bg-white/90 p-2 shadow-sm">
                <input
                  className="app-input min-w-[8rem] flex-1 rounded-lg px-2 py-1.5 text-xs"
                  placeholder="ชื่อขนาด เช่น ตะกร้า M"
                  value={row.label}
                  onChange={(e) =>
                    setDraftTiers((prev) => prev.map((r, i) => (i === idx ? { ...r, label: e.target.value } : r)))
                  }
                />
                <input
                  className="app-input w-24 rounded-lg px-2 py-1.5 text-xs"
                  type="number"
                  min={0}
                  placeholder="บาท"
                  value={row.price === 0 ? "" : row.price}
                  onChange={(e) =>
                    setDraftTiers((prev) =>
                      prev.map((r, i) => (i === idx ? { ...r, price: Math.round(Number(e.target.value) || 0) } : r)),
                    )
                  }
                />
                <button
                  type="button"
                  disabled={draftTiers.length <= 1}
                  onClick={() => setDraftTiers((prev) => prev.filter((_, i) => i !== idx))}
                  className="rounded-lg px-2 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-30"
                >
                  ลบ
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] leading-snug text-[#66638c]">
            ถ้าไม่ต้องการแยกตะกร้า ให้เหลือแถวเดียวหรือใช้ราคาฐานด้านบน — ขั้นตอน POS จะใช้ราคาจากแถวที่เลือก
          </p>
        </div>

        {err ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{err}</p> : null}
      </div>
    </FormModal>
  );
}
