"use client";

import { useMemo, useState } from "react";
import { AppImageLightbox, useAppImageLightbox } from "@/components/app-templates";
import {
  createBuildingPosSessionApiRepository,
  uploadBuildingPosSessionImage,
  type PosIngredient,
  type PosPurchaseOrder,
} from "@/systems/building-pos/building-pos-service";

type Repo = ReturnType<typeof createBuildingPosSessionApiRepository>;

export function BuildingPosIngredientsPanel({
  ingredients,
  onChanged,
}: {
  ingredients: PosIngredient[];
  onChanged: () => void | Promise<void>;
}) {
  const repo = useMemo(() => createBuildingPosSessionApiRepository(), []);
  const [name, setName] = useState("");
  const [unitLabel, setUnitLabel] = useState("");
  const [sortOrder, setSortOrder] = useState("100");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editUnitLabel, setEditUnitLabel] = useState("");
  const [editSortOrder, setEditSortOrder] = useState("100");
  const [editSaving, setEditSaving] = useState(false);

  async function addIngredient() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const so = Number(sortOrder);
      await repo.createIngredient({
        name: name.trim(),
        unit_label: unitLabel.trim(),
        sort_order: Number.isFinite(so) ? so : 100,
      });
      setName("");
      setUnitLabel("");
      setSortOrder("100");
      await onChanged();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(ing: PosIngredient) {
    setEditingId(ing.id);
    setEditName(ing.name);
    setEditUnitLabel(ing.unit_label);
    setEditSortOrder(String(ing.sort_order));
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(id: number) {
    if (!editName.trim()) return;
    setEditSaving(true);
    try {
      const so = Number(editSortOrder);
      await repo.updateIngredient(id, {
        name: editName.trim(),
        unit_label: editUnitLabel.trim(),
        sort_order: Number.isFinite(so) ? so : 100,
      });
      setEditingId(null);
      await onChanged();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setEditSaving(false);
    }
  }

  async function removeIngredient(id: number, label: string) {
    if (!window.confirm(`ลบรายการของ "${label}" ?`)) return;
    try {
      await repo.deleteIngredient(id);
      if (editingId === id) setEditingId(null);
      await onChanged();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "ลบไม่สำเร็จ");
    }
  }

  return (
    <section className="app-surface rounded-2xl p-4 sm:p-5">
      <div className="border-b border-[#ecebff] pb-4">
        <h2 className="text-lg font-bold text-[#2e2a58]">รายการของ</h2>
        <p className="mt-1 text-xs text-[#66638c]">
          ของที่ซื้อจากตลาด — ตั้งชื่อและหน่วย (กก., กรัม, ml) ใช้ในบันทึกการจ่ายตลาดและสูตรอาหาร
        </p>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-12 sm:items-end">
          <label className="sm:col-span-5">
            <span className="text-xs font-medium text-[#4d47b6]">ชื่อ</span>
            <input
              className="app-input mt-1 w-full rounded-xl px-3 py-2.5 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น เนื้อหมูสับ"
            />
          </label>
          <label className="sm:col-span-3">
            <span className="text-xs font-medium text-[#4d47b6]">หน่วย</span>
            <input
              className="app-input mt-1 w-full rounded-xl px-3 py-2.5 text-sm"
              value={unitLabel}
              onChange={(e) => setUnitLabel(e.target.value)}
              placeholder="กก."
            />
          </label>
          <label className="sm:col-span-2">
            <span className="text-xs font-medium text-[#4d47b6]">ลำดับ</span>
            <input
              className="app-input mt-1 w-full rounded-xl px-3 py-2.5 text-sm"
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            />
          </label>
          <div className="sm:col-span-2">
            <button
              type="button"
              disabled={saving || !name.trim()}
              onClick={() => void addIngredient()}
              className="app-btn-primary w-full rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
            >
              เพิ่ม
            </button>
          </div>
        </div>
      </div>
      <ul className="mt-4 grid grid-cols-1 gap-2">
        {ingredients.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[#d8d6ec] bg-[#faf9ff] py-8 text-center text-sm text-[#66638c]">ยังไม่มีรายการของ</p>
        ) : (
          ingredients.map((ing) => (
            <li
              key={ing.id}
              className="rounded-2xl border border-[#e1e3ff] bg-white px-3 py-3 text-sm shadow-sm"
            >
              {editingId === ing.id ? (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-12 sm:items-end">
                  <label className="sm:col-span-5">
                    <span className="text-xs font-medium text-[#4d47b6]">ชื่อ</span>
                    <input
                      className="app-input mt-1 w-full rounded-xl px-3 py-2.5 text-sm"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                  </label>
                  <label className="sm:col-span-3">
                    <span className="text-xs font-medium text-[#4d47b6]">หน่วย</span>
                    <input
                      className="app-input mt-1 w-full rounded-xl px-3 py-2.5 text-sm"
                      value={editUnitLabel}
                      onChange={(e) => setEditUnitLabel(e.target.value)}
                    />
                  </label>
                  <label className="sm:col-span-2">
                    <span className="text-xs font-medium text-[#4d47b6]">ลำดับ</span>
                    <input
                      className="app-input mt-1 w-full rounded-xl px-3 py-2.5 text-sm"
                      type="number"
                      value={editSortOrder}
                      onChange={(e) => setEditSortOrder(e.target.value)}
                    />
                  </label>
                  <div className="flex flex-wrap gap-2 sm:col-span-2 sm:justify-end">
                    <button
                      type="button"
                      disabled={editSaving || !editName.trim()}
                      onClick={() => void saveEdit(ing.id)}
                      className="app-btn-primary rounded-xl px-3 py-2 text-xs font-semibold disabled:opacity-50"
                    >
                      {editSaving ? "กำลังบันทึก…" : "บันทึก"}
                    </button>
                    <button
                      type="button"
                      disabled={editSaving}
                      onClick={cancelEdit}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                    >
                      ยกเลิก
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="min-w-0 font-medium text-[#2e2a58]">
                    {ing.name}
                    <span className="mt-0.5 block text-xs font-normal text-[#66638c]">
                      หน่วย {ing.unit_label || "—"} · ลำดับ {ing.sort_order}
                    </span>
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(ing)}
                      className="rounded-xl border border-[#c8c4ff] bg-[#f4f3ff] px-3 py-2 text-xs font-semibold text-[#4d47b6] hover:bg-[#ecebff]"
                    >
                      แก้ไข
                    </button>
                    <button
                      type="button"
                      onClick={() => void removeIngredient(ing.id, ing.name)}
                      className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                    >
                      ลบ
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))
        )}
      </ul>
    </section>
  );
}

type DraftLine = { ingredient_id: number; quantity: string; unit_price_baht: string };

export function BuildingPosPurchasesPanel({
  purchaseOrders,
  ingredients,
  onChanged,
}: {
  purchaseOrders: PosPurchaseOrder[];
  ingredients: PosIngredient[];
  onChanged: () => void | Promise<void>;
}) {
  const repo = useMemo(() => createBuildingPosSessionApiRepository(), []);
  const marketSlipLb = useAppImageLightbox();
  const ingById = useMemo(() => new Map(ingredients.map((x) => [x.id, x])), [ingredients]);
  const [purchasedOn, setPurchasedOn] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([{ ingredient_id: 0, quantity: "1", unit_price_baht: "0" }]);
  const [saving, setSaving] = useState(false);
  const [newSlipUrl, setNewSlipUrl] = useState("");
  const [newSlipUploading, setNewSlipUploading] = useState(false);

  const [editingPoId, setEditingPoId] = useState<number | null>(null);
  const [editPurchasedOn, setEditPurchasedOn] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editSlipUrl, setEditSlipUrl] = useState("");
  const [editSlipUploading, setEditSlipUploading] = useState(false);
  const [editLines, setEditLines] = useState<DraftLine[]>([]);
  const [editSaving, setEditSaving] = useState(false);

  async function uploadMarketSlip(
    file: File | undefined,
    setUrl: (s: string) => void,
    setBusy: (b: boolean) => void,
  ) {
    if (!file) return;
    setBusy(true);
    try {
      const url = await uploadBuildingPosSessionImage(file);
      setUrl(url);
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "อัปโหลดสลิปไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  function addLine() {
    setLines((prev) => [...prev, { ingredient_id: 0, quantity: "1", unit_price_baht: "0" }]);
  }

  function updateLine(i: number, patch: Partial<DraftLine>) {
    setLines((prev) => prev.map((row, j) => (j === i ? { ...row, ...patch } : row)));
  }

  function removeLine(i: number) {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((_, j) => j !== i)));
  }

  function startEditPo(po: PosPurchaseOrder) {
    setEditingPoId(po.id);
    setEditPurchasedOn(po.purchased_on);
    setEditNote(po.note);
    setEditSlipUrl(po.payment_slip_url?.trim() ?? "");
    setEditLines(
      po.lines.length > 0
        ? po.lines.map((l) => ({
            ingredient_id: l.ingredient_id,
            quantity: String(l.quantity),
            unit_price_baht: String(l.unit_price_baht),
          }))
        : [{ ingredient_id: 0, quantity: "1", unit_price_baht: "0" }],
    );
  }

  function cancelEditPo() {
    setEditingPoId(null);
  }

  function addEditLine() {
    setEditLines((prev) => [...prev, { ingredient_id: 0, quantity: "1", unit_price_baht: "0" }]);
  }

  function updateEditLine(i: number, patch: Partial<DraftLine>) {
    setEditLines((prev) => prev.map((row, j) => (j === i ? { ...row, ...patch } : row)));
  }

  function removeEditLine(i: number) {
    setEditLines((prev) => (prev.length <= 1 ? prev : prev.filter((_, j) => j !== i)));
  }

  async function submitEditPo() {
    if (editingPoId == null) return;
    if (ingredients.length === 0) {
      window.alert("เพิ่มรายการของก่อนแก้ไข");
      return;
    }
    const parsedLines = editLines
      .map((ln) => ({
        ingredient_id: ln.ingredient_id,
        quantity: Number(ln.quantity),
        unit_price_baht: Number(ln.unit_price_baht),
      }))
      .filter(
        (ln) =>
          ln.ingredient_id > 0 &&
          Number.isFinite(ln.quantity) &&
          ln.quantity > 0 &&
          Number.isFinite(ln.unit_price_baht) &&
          ln.unit_price_baht >= 0,
      );
    if (parsedLines.length === 0) {
      window.alert("กรอกอย่างน้อย 1 รายการ (ของที่ซื้อ จำนวน ราคาต่อหน่วย)");
      return;
    }
    setEditSaving(true);
    try {
      await repo.updatePurchaseOrder(editingPoId, {
        purchased_on: editPurchasedOn,
        note: editNote.trim() || null,
        payment_slip_url: editSlipUrl.trim() || null,
        lines: parsedLines,
      });
      setEditingPoId(null);
      await onChanged();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setEditSaving(false);
    }
  }

  async function submitPurchase() {
    if (ingredients.length === 0) {
      window.alert("เพิ่มรายการของก่อนบันทึกการจ่ายตลาด");
      return;
    }
    const parsedLines = lines
      .map((ln) => ({
        ingredient_id: ln.ingredient_id,
        quantity: Number(ln.quantity),
        unit_price_baht: Number(ln.unit_price_baht),
      }))
      .filter((ln) => ln.ingredient_id > 0 && Number.isFinite(ln.quantity) && ln.quantity > 0 && Number.isFinite(ln.unit_price_baht) && ln.unit_price_baht >= 0);
    if (parsedLines.length === 0) {
      window.alert("กรอกอย่างน้อย 1 รายการ (ของที่ซื้อ จำนวน ราคาต่อหน่วย)");
      return;
    }
    setSaving(true);
    try {
      await repo.createPurchaseOrder({
        purchased_on: purchasedOn,
        note: note.trim() || null,
        payment_slip_url: newSlipUrl.trim() || null,
        lines: parsedLines,
      });
      setNote("");
      setNewSlipUrl("");
      setLines([{ ingredient_id: 0, quantity: "1", unit_price_baht: "0" }]);
      await onChanged();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  async function deletePo(id: number) {
    if (!window.confirm("ลบบันทึกการจ่ายตลาดครั้งนี้? (รายการย่อยจะถูกลบด้วย)")) return;
    try {
      await repo.deletePurchaseOrder(id);
      if (editingPoId === id) setEditingPoId(null);
      await onChanged();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "ลบไม่สำเร็จ");
    }
  }

  return (
    <section className="app-surface rounded-2xl p-4 sm:p-5">
      <div className="border-b border-[#ecebff] pb-4">
        <h2 className="text-lg font-bold text-[#2e2a58]">บันทึกการจ่ายตลาด</h2>
        <p className="mt-1 text-xs text-[#66638c]">
          บันทึกแต่ละครั้งที่ไปจ่ายตลาด (วันที่ รายการ ราคา) — ระบบใช้ราคาซื้อล่าสุดคำนวณต้นทุนตามสูตร
        </p>
        <div className="mt-3 space-y-3 rounded-2xl border border-[#e1e3ff] bg-[#faf9ff]/80 p-3 sm:p-4">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <label className="text-xs font-medium text-[#4d47b6]">
              วันที่ไปตลาด
              <input
                type="date"
                className="app-input mt-1 w-full rounded-xl px-3 py-2.5 text-sm"
                value={purchasedOn}
                onChange={(e) => setPurchasedOn(e.target.value)}
              />
            </label>
            <label className="text-xs font-medium text-[#4d47b6]">
              หมายเหตุ <span className="font-normal text-[#9b98c4]">(ไม่บังคับ)</span>
              <input
                className="app-input mt-1 w-full rounded-xl px-3 py-2.5 text-sm"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="เช่น ตลาดไท / แม็คโคร"
              />
            </label>
          </div>
          <div className="rounded-xl border border-[#e6e4fa] bg-white p-3">
            <p className="text-xs font-medium text-[#4d47b6]">
              สลิปการจ่ายตลาด{" "}
              <span className="font-normal text-[#9b98c4]">(ไม่บังคับ — JPG PNG WEBP GIF)</span>
            </p>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              disabled={newSlipUploading || saving}
              className="mt-1 block w-full text-xs file:mr-2 file:rounded-lg file:border-0 file:bg-[#ecebff] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-[#4d47b6] disabled:opacity-50"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                void uploadMarketSlip(f, setNewSlipUrl, setNewSlipUploading);
              }}
            />
            {newSlipUploading ? (
              <p className="mt-1 text-xs text-[#66638c]">กำลังอัปโหลด…</p>
            ) : null}
            {newSlipUrl ? (
              <div className="mt-2 flex flex-wrap items-end gap-3">
                <button
                  type="button"
                  className="rounded-lg border-0 bg-transparent p-0 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4d47b6]"
                  onClick={() => marketSlipLb.open(newSlipUrl)}
                  aria-label="ดูรูปสลิปเต็มจอ"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- URL จากอัปโหลดในระบบ */}
                  <img
                    src={newSlipUrl}
                    alt="สลิป"
                    className="max-h-32 max-w-full cursor-pointer rounded-lg border border-[#ecebff] object-contain hover:opacity-95"
                  />
                </button>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setNewSlipUrl("")}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    ลบสลิป
                  </button>
                  <button
                    type="button"
                    onClick={() => marketSlipLb.open(newSlipUrl)}
                    className="rounded-lg border border-[#c8c4ff] bg-[#f4f3ff] px-3 py-1.5 text-xs font-semibold text-[#4d47b6] hover:bg-[#ecebff]"
                  >
                    ดูรูป
                  </button>
                </div>
              </div>
            ) : null}
          </div>
          <p className="text-xs font-medium text-[#4d47b6]">รายการ</p>
          <ul className="space-y-2">
            {lines.map((ln, i) => (
              <li key={i} className="flex flex-wrap items-end gap-2 rounded-xl border border-[#e6e4fa] bg-white p-2">
                <label className="min-w-[140px] flex-1 text-[10px] font-medium text-[#66638c] sm:min-w-[180px]">
                  รายการของ
                  <select
                    className="app-input mt-1 w-full rounded-lg px-2 py-2 text-sm"
                    value={ln.ingredient_id || ""}
                    onChange={(e) => updateLine(i, { ingredient_id: Number(e.target.value) })}
                  >
                    <option value="">เลือก</option>
                    {ingredients.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                        {g.unit_label ? ` (${g.unit_label})` : ""}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="w-[88px] text-[10px] font-medium text-[#66638c]">
                  จำนวน
                  <input
                    className="app-input mt-1 w-full rounded-lg px-2 py-2 text-sm tabular-nums"
                    inputMode="decimal"
                    value={ln.quantity}
                    onChange={(e) => updateLine(i, { quantity: e.target.value })}
                  />
                </label>
                <label className="w-[100px] text-[10px] font-medium text-[#66638c]">
                  ฿/หน่วย
                  <input
                    className="app-input mt-1 w-full rounded-lg px-2 py-2 text-sm tabular-nums"
                    inputMode="decimal"
                    value={ln.unit_price_baht}
                    onChange={(e) => updateLine(i, { unit_price_baht: e.target.value })}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => removeLine(i)}
                  className="mb-0.5 rounded-lg border border-slate-200 px-2 py-2 text-xs text-slate-500 hover:bg-slate-50"
                  aria-label="ลบแถว"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={addLine} className="app-btn-soft rounded-xl px-3 py-2 text-xs font-semibold text-[#4d47b6]">
              + แถว
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => void submitPurchase()}
              className="app-btn-primary rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
            >
              {saving ? "กำลังบันทึก…" : "บันทึกการจ่ายตลาด"}
            </button>
          </div>
        </div>
      </div>
      <ul className="mt-4 space-y-3">
        {purchaseOrders.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[#d8d6ec] bg-[#faf9ff] py-8 text-center text-sm text-[#66638c]">ยังไม่มีประวัติการจ่ายตลาด</p>
        ) : (
          purchaseOrders.map((po) => {
            const total = po.lines.reduce((s, l) => s + l.line_total_baht, 0);
            const slipPreview = po.payment_slip_url?.trim() ?? "";
            return (
              <li key={po.id} className="rounded-2xl border border-[#e1e3ff] bg-white p-3 shadow-sm sm:p-4">
                {editingPoId === po.id ? (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-[#4d47b6]">แก้ไขบันทึกครั้งนี้</p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <label className="text-xs font-medium text-[#4d47b6]">
                        วันที่ไปตลาด
                        <input
                          type="date"
                          className="app-input mt-1 w-full rounded-xl px-3 py-2.5 text-sm"
                          value={editPurchasedOn}
                          onChange={(e) => setEditPurchasedOn(e.target.value)}
                        />
                      </label>
                      <label className="text-xs font-medium text-[#4d47b6]">
                        หมายเหตุ <span className="font-normal text-[#9b98c4]">(ไม่บังคับ)</span>
                        <input
                          className="app-input mt-1 w-full rounded-xl px-3 py-2.5 text-sm"
                          value={editNote}
                          onChange={(e) => setEditNote(e.target.value)}
                          placeholder="เช่น ตลาดไท / แม็คโคร"
                        />
                      </label>
                    </div>
                    <div className="rounded-xl border border-[#e6e4fa] bg-[#faf9ff]/80 p-3">
                      <p className="text-xs font-medium text-[#4d47b6]">
                        สลิปการจ่ายตลาด{" "}
                        <span className="font-normal text-[#9b98c4]">(ไม่บังคับ)</span>
                      </p>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        disabled={editSlipUploading || editSaving}
                        className="mt-1 block w-full text-xs file:mr-2 file:rounded-lg file:border-0 file:bg-[#ecebff] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-[#4d47b6] disabled:opacity-50"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          e.target.value = "";
                          void uploadMarketSlip(f, setEditSlipUrl, setEditSlipUploading);
                        }}
                      />
                      {editSlipUploading ? (
                        <p className="mt-1 text-xs text-[#66638c]">กำลังอัปโหลด…</p>
                      ) : null}
                      {editSlipUrl ? (
                        <div className="mt-2 flex flex-wrap items-end gap-3">
                          <button
                            type="button"
                            className="rounded-lg border-0 bg-transparent p-0 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4d47b6]"
                            onClick={() => marketSlipLb.open(editSlipUrl)}
                            aria-label="ดูรูปสลิปเต็มจอ"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element -- สลิปจากระบบ */}
                            <img
                              src={editSlipUrl}
                              alt="สลิป"
                              className="max-h-32 max-w-full cursor-pointer rounded-lg border border-[#ecebff] object-contain hover:opacity-95"
                            />
                          </button>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => setEditSlipUrl("")}
                              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                            >
                              ลบสลิป
                            </button>
                            <button
                              type="button"
                              onClick={() => marketSlipLb.open(editSlipUrl)}
                              className="rounded-lg border border-[#c8c4ff] bg-[#f4f3ff] px-3 py-1.5 text-xs font-semibold text-[#4d47b6] hover:bg-[#ecebff]"
                            >
                              ดูรูป
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                    <p className="text-xs font-medium text-[#4d47b6]">รายการ</p>
                    <ul className="space-y-2">
                      {editLines.map((ln, i) => (
                        <li key={`e-${po.id}-${i}`} className="flex flex-wrap items-end gap-2 rounded-xl border border-[#e6e4fa] bg-[#faf9ff]/80 p-2">
                          <label className="min-w-[140px] flex-1 text-[10px] font-medium text-[#66638c] sm:min-w-[180px]">
                            รายการของ
                            <select
                              className="app-input mt-1 w-full rounded-lg px-2 py-2 text-sm"
                              value={ln.ingredient_id || ""}
                              onChange={(e) => updateEditLine(i, { ingredient_id: Number(e.target.value) })}
                            >
                              <option value="">เลือก</option>
                              {ingredients.map((g) => (
                                <option key={g.id} value={g.id}>
                                  {g.name}
                                  {g.unit_label ? ` (${g.unit_label})` : ""}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="w-[88px] text-[10px] font-medium text-[#66638c]">
                            จำนวน
                            <input
                              className="app-input mt-1 w-full rounded-lg px-2 py-2 text-sm tabular-nums"
                              inputMode="decimal"
                              value={ln.quantity}
                              onChange={(e) => updateEditLine(i, { quantity: e.target.value })}
                            />
                          </label>
                          <label className="w-[100px] text-[10px] font-medium text-[#66638c]">
                            ฿/หน่วย
                            <input
                              className="app-input mt-1 w-full rounded-lg px-2 py-2 text-sm tabular-nums"
                              inputMode="decimal"
                              value={ln.unit_price_baht}
                              onChange={(e) => updateEditLine(i, { unit_price_baht: e.target.value })}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => removeEditLine(i)}
                            className="mb-0.5 rounded-lg border border-slate-200 px-2 py-2 text-xs text-slate-500 hover:bg-slate-50"
                            aria-label="ลบแถว"
                          >
                            ×
                          </button>
                        </li>
                      ))}
                    </ul>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={addEditLine}
                        className="app-btn-soft rounded-xl px-3 py-2 text-xs font-semibold text-[#4d47b6]"
                      >
                        + แถว
                      </button>
                      <button
                        type="button"
                        disabled={editSaving}
                        onClick={() => void submitEditPo()}
                        className="app-btn-primary rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50"
                      >
                        {editSaving ? "กำลังบันทึก…" : "บันทึกการแก้ไข"}
                      </button>
                      <button
                        type="button"
                        disabled={editSaving}
                        onClick={cancelEditPo}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                      >
                        ยกเลิก
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-[#2e2a58]">{po.purchased_on}</p>
                        <p className="text-xs text-[#66638c]">
                          รวมประมาณ ฿{total.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          {po.note ? ` · ${po.note}` : ""}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => startEditPo(po)}
                          className="rounded-xl border border-[#c8c4ff] bg-[#f4f3ff] px-3 py-1.5 text-xs font-semibold text-[#4d47b6] hover:bg-[#ecebff]"
                        >
                          แก้ไข
                        </button>
                        <button
                          type="button"
                          onClick={() => void deletePo(po.id)}
                          className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700"
                        >
                          ลบครั้งนี้
                        </button>
                      </div>
                    </div>
                    {slipPreview ? (
                      <div className="mt-2 flex flex-wrap items-end gap-3 rounded-xl border border-[#ecebff] bg-[#faf9ff]/60 p-2">
                        <button
                          type="button"
                          className="rounded-lg border-0 bg-transparent p-0 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4d47b6]"
                          onClick={() => marketSlipLb.open(slipPreview)}
                          aria-label="ดูรูปสลิปเต็มจอ"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element -- สลิปจากระบบ */}
                          <img
                            src={slipPreview}
                            alt="สลิปการจ่ายตลาด"
                            className="max-h-24 max-w-[min(100%,12rem)] cursor-pointer rounded-lg border border-[#e1e3ff] object-contain hover:opacity-95"
                          />
                        </button>
                        <button
                          type="button"
                          onClick={() => marketSlipLb.open(slipPreview)}
                          className="rounded-lg border border-[#c8c4ff] bg-[#f4f3ff] px-3 py-1.5 text-xs font-semibold text-[#4d47b6] hover:bg-[#ecebff]"
                        >
                          ดูรูป
                        </button>
                      </div>
                    ) : null}
                    <ul className="mt-2 space-y-1 border-t border-[#ecebff] pt-2 text-xs text-[#2e2a58]">
                      {po.lines.map((l) => (
                        <li key={l.id} className="flex justify-between gap-2 tabular-nums">
                          <span className="min-w-0">
                            {ingById.get(l.ingredient_id)?.name ?? `#${l.ingredient_id}`} × {l.quantity}
                          </span>
                          <span>
                            @฿{l.unit_price_baht.toLocaleString()} = ฿{l.line_total_baht.toLocaleString()}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </li>
            );
          })
        )}
      </ul>
      <AppImageLightbox
        src={marketSlipLb.src}
        alt="สลิปการจ่ายตลาด"
        onClose={marketSlipLb.close}
      />
    </section>
  );
}
