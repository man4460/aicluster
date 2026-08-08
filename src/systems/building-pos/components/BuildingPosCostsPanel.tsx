"use client";

import { useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  AppEmptyState,
  AppGalleryCameraFileInputs,
  AppImageLightbox,
  AppImagePickCameraButtons,
  AppImageThumb,
  appTemplateOutlineButtonClass,
  prepareImageFileForUpload,
  useAppCameraCapture,
  useAppImageLightbox,
  useAppNoticePopup,
} from "@/components/app-templates";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import {
  assetRowEditIconButtonClass,
  assetRowRemoveIconButtonClass,
  IconRowEdit,
  IconRowRemove,
} from "@/systems/asset/components/AssetRowActionIcons";
import {
  createBuildingPosSessionApiRepository,
  uploadBuildingPosSessionImage,
  type PosCostCategory,
  type PosCostEntry,
} from "@/systems/building-pos/building-pos-service";
import {
  buildingPosChipActiveClass,
  buildingPosChipIdleClass,
  buildingPosContentPanelClass,
  buildingPosFieldClass,
  buildingPosListRowCardClass,
  buildingPosSelectFieldClass,
} from "@/systems/building-pos/components/building-pos-ui-tokens";

function formatCostSpentAt(iso: string) {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return iso;
  return d.toLocaleString("th-TH", { timeZone: "Asia/Bangkok", dateStyle: "medium", timeStyle: "short" });
}

/** ต้นทุนแบบง่าย — หมวดหมู่ + รายการ · ยอด · หมายเหตุ · สลิป */
export function BuildingPosCostsPanel({
  costCategories,
  costEntries,
  onChanged,
  embedded = false,
  emptyWhenFilteredMessage,
}: {
  costCategories: PosCostCategory[];
  costEntries: PosCostEntry[];
  onChanged: () => void | Promise<void>;
  /** ฝังในแท็บการเงิน — ไม่ห่อการ์ดนอกซ้ำ */
  embedded?: boolean;
  /** เมื่อรายการว่างเพราะกรองช่วงเวลา (ไม่ใช่ยังไม่เคยบันทึก) */
  emptyWhenFilteredMessage?: string;
}) {
  const repo = useMemo(() => createBuildingPosSessionApiRepository(), []);
  const slipLb = useAppImageLightbox();
  const notice = useAppNoticePopup();
  const galleryRef = useRef<HTMLInputElement>(null);
  const { openCamera, cameraInputRef, cameraModal } = useAppCameraCapture({ title: "ถ่ายรูปสลิปรายจ่าย" });

  const sortedCategories = useMemo(
    () => [...costCategories].sort((a, b) => a.sort_order - b.sort_order || a.id - b.id),
    [costCategories],
  );
  const sortedEntries = useMemo(
    () =>
      [...costEntries].sort(
        (a, b) => new Date(b.spent_at).getTime() - new Date(a.spent_at).getTime() || b.id - a.id,
      ),
    [costEntries],
  );

  const [filterCat, setFilterCat] = useState<number | "all">("all");
  const filteredEntries = useMemo(() => {
    if (filterCat === "all") return sortedEntries;
    return sortedEntries.filter((e) => e.category_id === filterCat);
  }, [sortedEntries, filterCat]);

  const [catModalOpen, setCatModalOpen] = useState(false);
  const [catFormOpen, setCatFormOpen] = useState(false);
  const [catEditing, setCatEditing] = useState<PosCostCategory | null>(null);
  const [catName, setCatName] = useState("");
  const [catBusy, setCatBusy] = useState(false);
  const [catErr, setCatErr] = useState<string | null>(null);

  const [costModalOpen, setCostModalOpen] = useState(false);
  const [costEditing, setCostEditing] = useState<PosCostEntry | null>(null);
  const [costCategoryId, setCostCategoryId] = useState("");
  const [costLabel, setCostLabel] = useState("");
  const [costAmount, setCostAmount] = useState("");
  const [costNote, setCostNote] = useState("");
  const [costSlipUrl, setCostSlipUrl] = useState("");
  const [costSlipBusy, setCostSlipBusy] = useState(false);
  const [costBusy, setCostBusy] = useState(false);
  const [costErr, setCostErr] = useState<string | null>(null);

  function closeCatForm() {
    setCatFormOpen(false);
    setCatEditing(null);
    setCatName("");
    setCatErr(null);
  }

  function openCatCreate() {
    setCatEditing(null);
    setCatName("");
    setCatErr(null);
    setCatFormOpen(true);
  }

  function openCatEdit(c: PosCostCategory) {
    setCatEditing(c);
    setCatName(c.name);
    setCatErr(null);
    setCatFormOpen(true);
  }

  async function submitCategory() {
    const name = catName.trim();
    if (!name) {
      setCatErr("กรอกชื่อหมวดหมู่");
      return;
    }
    setCatBusy(true);
    setCatErr(null);
    try {
      if (catEditing) {
        await repo.updateCostCategory(catEditing.id, { name });
      } else {
        await repo.createCostCategory({ name });
      }
      closeCatForm();
      await onChanged();
    } catch (e) {
      setCatErr(e instanceof Error ? e.message : "บันทึกหมวดไม่สำเร็จ");
    } finally {
      setCatBusy(false);
    }
  }

  async function deleteCategory(c: PosCostCategory) {
    const ok = await notice.confirm(
      `ลบหมวดหมู่ «${c.name}» ใช่หรือไม่?\n(ถ้ามีรายจ่ายในหมวดนี้ต้องย้ายหรือลบก่อน)`,
    );
    if (!ok) return;
    setCatErr(null);
    try {
      await repo.deleteCostCategory(c.id);
      if (filterCat === c.id) setFilterCat("all");
      await onChanged();
    } catch (e) {
      setCatErr(e instanceof Error ? e.message : "ลบหมวดไม่สำเร็จ");
      notice.error(e instanceof Error ? e.message : "ลบหมวดไม่สำเร็จ");
    }
  }

  function resetCostForm() {
    setCostEditing(null);
    const preferred =
      filterCat !== "all" && sortedCategories.some((c) => c.id === filterCat)
        ? filterCat
        : sortedCategories[0]?.id;
    setCostCategoryId(preferred != null ? String(preferred) : "");
    setCostLabel("");
    setCostAmount("");
    setCostNote("");
    setCostSlipUrl("");
    setCostErr(null);
  }

  function openCostCreate() {
    if (sortedCategories.length === 0) {
      closeCatForm();
      setCatModalOpen(true);
      return;
    }
    resetCostForm();
    setCostModalOpen(true);
  }

  function openCostEdit(entry: PosCostEntry) {
    setCostEditing(entry);
    setCostCategoryId(entry.category_id ? String(entry.category_id) : sortedCategories[0] ? String(sortedCategories[0].id) : "");
    setCostLabel(entry.label);
    setCostAmount(String(entry.amount_baht));
    setCostNote(entry.note ?? "");
    setCostSlipUrl(entry.payment_slip_url?.trim() ?? "");
    setCostErr(null);
    setCostModalOpen(true);
  }

  async function uploadCostSlip(file: File) {
    setCostSlipBusy(true);
    setCostErr(null);
    try {
      const prepared = await prepareImageFileForUpload(file);
      const url = await uploadBuildingPosSessionImage(prepared);
      setCostSlipUrl(url);
    } catch (err) {
      setCostErr(err instanceof Error ? err.message : "อัปโหลดสลิปไม่สำเร็จ");
    } finally {
      setCostSlipBusy(false);
    }
  }

  async function onPickSlipFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    await uploadCostSlip(file);
  }

  async function submitCost() {
    const label = costLabel.trim();
    const amount = Number(costAmount);
    const categoryId = Number(costCategoryId);
    if (!label) {
      setCostErr("กรอกรายละเอียดรายการ");
      return;
    }
    if (!Number.isFinite(amount) || amount < 1) {
      setCostErr("กรอกจำนวนเงินให้ถูกต้อง");
      return;
    }
    if (!Number.isFinite(categoryId) || categoryId < 1) {
      setCostErr("เลือกหมวดหมู่");
      return;
    }
    setCostBusy(true);
    setCostErr(null);
    try {
      const payload = {
        label,
        amount_baht: Math.round(amount),
        category_id: categoryId,
        note: costNote.trim() || null,
        payment_slip_url: costSlipUrl.trim() || null,
      };
      if (costEditing) {
        await repo.updateCostEntry(costEditing.id, payload);
      } else {
        await repo.createCostEntry(payload);
      }
      setCostModalOpen(false);
      resetCostForm();
      await onChanged();
    } catch (e) {
      setCostErr(e instanceof Error ? e.message : "บันทึกรายจ่ายไม่สำเร็จ");
    } finally {
      setCostBusy(false);
    }
  }

  async function deleteCost(entry: PosCostEntry) {
    const ok = await notice.confirm(`ลบรายจ่าย «${entry.label}» ใช่หรือไม่?`);
    if (!ok) return;
    try {
      await repo.deleteCostEntry(entry.id);
      await onChanged();
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "ลบไม่สำเร็จ");
    }
  }

  const body = (
    <>
      {notice.popup}
      <div className={cn("flex flex-row items-start justify-between gap-3", !embedded && "border-b border-[#ecebff] pb-4")}>
        <h2 className="min-w-0 text-lg font-black tracking-tight text-[#1e1b4b]">
          {embedded ? "รายจ่าย" : "ต้นทุน / รายจ่าย"}
        </h2>
        <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => {
              closeCatForm();
              setCatModalOpen(true);
            }}
            className={cn(
              appTemplateOutlineButtonClass,
              "inline-flex min-h-[40px] items-center justify-center rounded-xl px-3 text-xs font-semibold text-[#4d47b6] sm:px-4 sm:text-sm",
            )}
            aria-label="จัดการหมวดหมู่รายจ่าย"
            title="หมวดหมู่ — เพิ่ม แก้ไข ลบ"
          >
            หมวดหมู่
          </button>
          <button
            type="button"
            onClick={openCostCreate}
            className="app-btn-primary inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl px-0 text-sm font-semibold sm:min-w-0 sm:px-4"
            aria-label="เพิ่มรายจ่าย"
          >
            <span className="sm:hidden" aria-hidden>
              +
            </span>
            <span className="hidden sm:inline">+ เพิ่มรายจ่าย</span>
          </button>
        </div>
      </div>

      <div
        className="mt-4 min-w-0 overflow-x-auto overflow-y-hidden overscroll-x-contain scroll-smooth pb-1 [-webkit-overflow-scrolling:touch]"
        role="group"
        aria-label="กรองตามหมวดหมู่ — เลื่อนซ้ายขวาได้"
      >
        <div className="flex w-max touch-pan-x gap-2 pr-1 sm:flex-wrap sm:pr-0">
          <button
            type="button"
            onClick={() => setFilterCat("all")}
            className={cn(
              "shrink-0 snap-start transition",
              filterCat === "all" ? buildingPosChipActiveClass : buildingPosChipIdleClass,
            )}
            aria-pressed={filterCat === "all"}
          >
            ทั้งหมด
          </button>
          {sortedCategories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setFilterCat(c.id)}
              className={cn(
                "shrink-0 snap-start transition",
                filterCat === c.id ? buildingPosChipActiveClass : buildingPosChipIdleClass,
              )}
              aria-pressed={filterCat === c.id}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {sortedCategories.length === 0 ? (
        <p className="mt-3 text-xs font-semibold text-amber-800">สร้างหมวดก่อนจึงจะบันทึกรายจ่ายได้ — กด «หมวดหมู่»</p>
      ) : null}

      {filteredEntries.length === 0 ? (
        <AppEmptyState tone="slate" className="mt-4">
          {sortedCategories.length === 0
            ? "เริ่มจากเพิ่มหมวด แล้วเพิ่มรายจ่าย"
            : sortedEntries.length === 0
              ? emptyWhenFilteredMessage || "ยังไม่มีรายจ่าย — กด «+ เพิ่มรายจ่าย»"
              : "ไม่มีรายจ่ายในหมวดนี้"}
        </AppEmptyState>
      ) : (
        <ul className="mt-4 max-h-[min(70vh,40rem)] space-y-2 overflow-y-auto pr-0.5" aria-label="รายการรายจ่าย">
          {filteredEntries.map((entry) => {
            const slip = entry.payment_slip_url?.trim() || "";
            return (
              <li key={entry.id} className={cn(buildingPosListRowCardClass, "flex items-start gap-2")}>
                {slip ? (
                  <AppImageThumb
                    src={slip}
                    alt={`สลิป ${entry.label}`}
                    onOpen={() => slipLb.open(slip)}
                    className="h-14 w-14 shrink-0"
                  />
                ) : null}
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold tabular-nums text-[#66638c]">
                    {formatCostSpentAt(entry.spent_at)}
                  </p>
                  <p className="mt-0.5 truncate text-sm font-black text-[#1e1b4b]">{entry.label}</p>
                  <p className="mt-0.5 text-[11px] font-bold text-[#4d47b6]">
                    {entry.category_name?.trim() || "ไม่มีหมวด"}
                  </p>
                  {entry.note?.trim() ? (
                    <p className="mt-0.5 text-xs font-semibold text-[#66638c]">{entry.note}</p>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <p className="text-base font-black tabular-nums text-rose-600">
                    ฿{entry.amount_baht.toLocaleString("th-TH")}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      className={assetRowEditIconButtonClass}
                      aria-label={`แก้ไขรายจ่าย ${entry.label}`}
                      title="แก้ไข"
                      onClick={() => openCostEdit(entry)}
                    >
                      <IconRowEdit className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className={assetRowRemoveIconButtonClass}
                      aria-label={`ลบรายจ่าย ${entry.label}`}
                      title="ลบ"
                      onClick={() => void deleteCost(entry)}
                    >
                      <IconRowRemove className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <AppImageLightbox src={slipLb.src} onClose={slipLb.close} alt="สลิปรายจ่าย" />

      <FormModal
        open={catModalOpen}
        onClose={() => !catBusy && setCatModalOpen(false)}
        title={catFormOpen ? (catEditing ? "แก้ไขหมวดหมู่" : "เพิ่มหมวดหมู่") : "หมวดหมู่รายจ่าย"}
        mobileCentered
        footer={
          catFormOpen ? (
            <FormModalFooterActions
              onCancel={closeCatForm}
              onSubmit={() => void submitCategory()}
              submitLabel={catEditing ? "บันทึกการแก้ไข" : "เพิ่มหมวดหมู่"}
              loading={catBusy}
            />
          ) : (
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={openCatCreate}
                className="app-btn-primary rounded-xl px-4 py-2 text-sm font-bold"
              >
                + เพิ่มหมวดหมู่
              </button>
              <button
                type="button"
                onClick={() => setCatModalOpen(false)}
                className={cn(appTemplateOutlineButtonClass, "rounded-xl px-4 py-2 text-sm font-bold")}
              >
                ปิด
              </button>
            </div>
          )
        }
      >
        {catErr ? <p className="mb-3 text-sm font-semibold text-rose-600">{catErr}</p> : null}
        {catFormOpen ? (
          <label className="block text-left text-sm font-bold text-[#1e1b4b]">
            ชื่อหมวดหมู่
            <input
              className={cn(buildingPosFieldClass, "mt-1")}
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              placeholder="เช่น วัตถุดิบ · สาธารณูปโภค · ค่าเช่า"
              autoFocus
            />
          </label>
        ) : sortedCategories.length === 0 ? (
          <p className="rounded-[1.25rem] border border-dashed border-[#d8d6ec] bg-[#faf9ff] px-3 py-6 text-center text-sm font-semibold text-[#66638c]">
            ยังไม่มีหมวด — กด «เพิ่มหมวดหมู่»
          </p>
        ) : (
          <ul className="space-y-2">
            {sortedCategories.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-2 rounded-[1.25rem] border border-white/50 bg-white/70 px-3 py-2.5"
              >
                <p className="min-w-0 truncate text-sm font-black text-[#1e1b4b]">{c.name}</p>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    className={assetRowEditIconButtonClass}
                    aria-label={`แก้ไขหมวด ${c.name}`}
                    title="แก้ไข"
                    onClick={() => openCatEdit(c)}
                  >
                    <IconRowEdit className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className={assetRowRemoveIconButtonClass}
                    aria-label={`ลบหมวด ${c.name}`}
                    title="ลบ"
                    onClick={() => void deleteCategory(c)}
                  >
                    <IconRowRemove className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </FormModal>

      <FormModal
        open={costModalOpen}
        onClose={() => !costBusy && !costSlipBusy && setCostModalOpen(false)}
        title={costEditing ? "แก้ไขรายจ่าย" : "เพิ่มรายจ่าย"}
        mobileCentered
        footer={
          <FormModalFooterActions
            onCancel={() => !costBusy && setCostModalOpen(false)}
            onSubmit={() => void submitCost()}
            submitLabel="บันทึก"
            loading={costBusy}
          />
        }
      >
        <div className="space-y-3">
          {costErr ? <p className="text-sm font-semibold text-rose-600">{costErr}</p> : null}
          <label className="block text-left text-sm font-bold text-[#1e1b4b]">
            หมวดหมู่
            <select
              value={costCategoryId}
              onChange={(e) => setCostCategoryId(e.target.value)}
              className={cn(buildingPosSelectFieldClass, "mt-1")}
              aria-label="หมวดหมู่รายจ่าย"
            >
              {sortedCategories.length === 0 ? <option value="">ยังไม่มีหมวด</option> : null}
              {sortedCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-left text-sm font-bold text-[#1e1b4b]">
            รายละเอียดรายการ
            <input
              className={cn(buildingPosFieldClass, "mt-1")}
              value={costLabel}
              onChange={(e) => setCostLabel(e.target.value)}
              placeholder="เช่น ค่าไฟ · ซื้อผัก · ค่าเช่าร้าน"
            />
          </label>
          <label className="block text-left text-sm font-bold text-[#1e1b4b]">
            จำนวนเงิน (บาท)
            <input
              className={cn(buildingPosFieldClass, "mt-1")}
              type="number"
              min={1}
              value={costAmount}
              onChange={(e) => setCostAmount(e.target.value)}
              placeholder="0"
            />
          </label>
          <label className="block text-left text-sm font-bold text-[#1e1b4b]">
            หมายเหตุ <span className="font-normal text-[#9b98c4]">(ไม่บังคับ)</span>
            <input
              className={cn(buildingPosFieldClass, "mt-1")}
              value={costNote}
              onChange={(e) => setCostNote(e.target.value)}
              placeholder="รายละเอียดเพิ่มเติม"
            />
          </label>
          <div>
            <p className="text-sm font-bold text-[#1e1b4b]">
              รูปสลิป <span className="font-normal text-[#9b98c4]">(ไม่บังคับ)</span>
            </p>
            <AppGalleryCameraFileInputs
              galleryInputRef={galleryRef}
              cameraInputRef={cameraInputRef}
              onChange={(e) => void onPickSlipFile(e)}
            />
            <div className="mt-2">
              <AppImagePickCameraButtons
                onPickGallery={() => galleryRef.current?.click()}
                onPickCamera={() => openCamera((file) => void uploadCostSlip(file))}
                disabled={costBusy || costSlipBusy}
                busy={costSlipBusy}
              />
            </div>
            {cameraModal}
            {costSlipUrl ? (
              <div className="mt-2 flex flex-wrap items-end gap-3">
                <AppImageThumb
                  src={costSlipUrl}
                  alt="สลิปรายจ่าย"
                  onOpen={() => slipLb.open(costSlipUrl)}
                  className="h-20 w-20"
                />
                <button
                  type="button"
                  onClick={() => setCostSlipUrl("")}
                  className={cn(appTemplateOutlineButtonClass, "rounded-xl px-3 py-2 text-xs font-bold")}
                >
                  ลบสลิป
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </FormModal>
    </>
  );

  if (embedded) return body;
  return <section className={buildingPosContentPanelClass}>{body}</section>;
}
