"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import Link from "next/link";
import {
  AppEmptyState,
  AppGalleryCameraFileInputs,
  AppImageLightbox,
  AppImagePickCameraButtons,
  AppImageThumb,
  AppSectionHeader,
  appDashboardInnerScrollClass,
  appTemplateOutlineButtonClass,
  useAppCameraCapture,
  useAppImageLightbox,
  useAppNoticePopup,
} from "@/components/app-templates";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import {
  formatBangkokDateTimeStable,
  formatVillageAmountStable,
} from "@/lib/village/format-display-stable";
import {
  createVillageIncomeCategory,
  createVillageIncomeEntry,
  deleteVillageIncomeCategory,
  deleteVillageIncomeEntry,
  fetchVillageFeePaymentHistory,
  fetchVillageIncomeCategories,
  fetchVillageIncomeEntries,
  updateVillageIncomeCategory,
  updateVillageIncomeEntry,
  uploadVillageIncomeSlip,
  type VillageFeePaymentRow,
  type VillageIncomeCategory,
  type VillageIncomeEntry,
} from "@/systems/village/village-income-client";
import { villageBtnPrimary } from "@/systems/village/village-ui";
import {
  villageFieldClass,
  villageFilterChipClass,
  villageListRowCardClass,
} from "@/systems/village/village-ui-tokens";
import {
  assetRowEditIconButtonClass,
  assetRowRemoveIconButtonClass,
  IconRowEdit,
  IconRowRemove,
} from "@/systems/asset/components/AssetRowActionIcons";

const VILLAGE_FEES_HREF = "/dashboard/village/fees";

function bangkokCalendarDay(iso: string): string {
  return new Date(iso).toLocaleString("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function IncomeToolbarButtons({
  onManageCategories,
  onAddIncome,
  compact = false,
}: {
  onManageCategories: () => void;
  onAddIncome: () => void;
  compact?: boolean;
}) {
  return (
    <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
      <button
        type="button"
        onClick={onManageCategories}
        className={cn(
          appTemplateOutlineButtonClass,
          "min-h-[40px] rounded-[1rem] px-3 text-xs font-black text-[#4d47b6]",
        )}
        aria-label="จัดการหมวดหมู่รายรับ"
        title="หมวดหมู่"
      >
        {compact ? "หมวด" : "หมวดหมู่"}
      </button>
      <button
        type="button"
        onClick={onAddIncome}
        className={cn(villageBtnPrimary, "min-h-[40px] min-w-[40px] rounded-[1rem] px-0 font-black sm:min-w-0 sm:px-4")}
        aria-label="เพิ่มรายรับ"
      >
        <span className="sm:hidden">+</span>
        <span className="hidden sm:inline">+ เพิ่มรายรับ</span>
      </button>
    </div>
  );
}

type Props = {
  keyword: string;
  dateFrom: string;
  dateTo: string;
  financeRangeLabel: string;
  refreshSignal: number;
  onRefreshFinance?: () => void;
};

export function VillageFinanceHistoryPanel({
  keyword,
  dateFrom,
  dateTo,
  financeRangeLabel,
  refreshSignal,
  onRefreshFinance,
}: Props) {
  const notice = useAppNoticePopup();
  const slipLb = useAppImageLightbox();
  const incomeGalleryRef = useRef<HTMLInputElement>(null);
  const incomeCamera = useAppCameraCapture({ title: "ถ่ายรูปสลิปรายรับ" });

  const [feePayments, setFeePayments] = useState<VillageFeePaymentRow[]>([]);
  const [incomes, setIncomes] = useState<VillageIncomeEntry[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<VillageIncomeCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [incomeFilterCat, setIncomeFilterCat] = useState<"all" | "COMMON_FEE" | string>("all");

  const [incomeOpen, setIncomeOpen] = useState(false);
  const [incomeBusy, setIncomeBusy] = useState(false);
  const [incomeEditing, setIncomeEditing] = useState<VillageIncomeEntry | null>(null);
  const [incomeLabel, setIncomeLabel] = useState("");
  const [incomeAmount, setIncomeAmount] = useState("");
  const [incomeCategoryId, setIncomeCategoryId] = useState("");
  const [incomeNote, setIncomeNote] = useState("");
  const [incomeSlipUrl, setIncomeSlipUrl] = useState("");
  const [incomeSlipBusy, setIncomeSlipBusy] = useState(false);

  const [incomeCatModalOpen, setIncomeCatModalOpen] = useState(false);
  const [incomeCatFormOpen, setIncomeCatFormOpen] = useState(false);
  const [incomeCatEdit, setIncomeCatEdit] = useState<VillageIncomeCategory | null>(null);
  const [incomeCatName, setIncomeCatName] = useState("");
  const [incomeCatBusy, setIncomeCatBusy] = useState(false);
  const [incomeCatErr, setIncomeCatErr] = useState<string | null>(null);

  const customIncomeCategories = useMemo(
    () => incomeCategories.filter((c) => c.kind === "CUSTOM" && !c.isBuiltin),
    [incomeCategories],
  );

  const kw = keyword.trim().toLowerCase();

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const [fees, incomeList, cats] = await Promise.all([
        fetchVillageFeePaymentHistory(),
        fetchVillageIncomeEntries(dateFrom, dateTo),
        fetchVillageIncomeCategories(),
      ]);
      setFeePayments(fees);
      setIncomes(incomeList);
      setIncomeCategories(cats);
      const customs = cats.filter((c) => c.kind === "CUSTOM" && !c.isBuiltin);
      setIncomeCategoryId((prev) =>
        prev && customs.some((c) => c.id === prev) ? prev : customs[0]?.id ?? "",
      );
    } catch (e) {
      setErr(e instanceof Error ? e.message : "โหลดไม่สำเร็จ");
      setFeePayments([]);
      setIncomes([]);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    void load();
  }, [load, refreshSignal]);

  const filteredFeePayments = useMemo(() => {
    let list = feePayments.filter((r) => Boolean(r.paid_at) && r.amount_paid > 0);
    if (dateFrom || dateTo) {
      list = list.filter((r) => {
        const day = bangkokCalendarDay(r.paid_at!);
        if (dateFrom && day < dateFrom) return false;
        if (dateTo && day > dateTo) return false;
        return true;
      });
    }
    if (!kw) return list;
    return list.filter((r) => {
      const hay = [r.house_no, r.owner_name, r.year_month, r.note]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(kw);
    });
  }, [feePayments, dateFrom, dateTo, kw]);

  const filteredHistoryRows = useMemo(() => {
    type Row =
      | { key: string; sortAt: string; kind: "fee"; fee: VillageFeePaymentRow }
      | { key: string; sortAt: string; kind: "income"; income: VillageIncomeEntry };

    const rows: Row[] = [];
    const showFees = incomeFilterCat === "all" || incomeFilterCat === "COMMON_FEE";
    const showIncomes = incomeFilterCat !== "COMMON_FEE";

    if (showFees) {
      for (const f of filteredFeePayments) {
        rows.push({ key: `fee-${f.id}`, sortAt: f.paid_at!, kind: "fee", fee: f });
      }
    }
    if (showIncomes) {
      let list = incomes;
      if (incomeFilterCat !== "all") {
        list = list.filter((row) => row.categoryId === incomeFilterCat);
      }
      if (kw) {
        list = list.filter((row) => {
          const hay = [row.label, row.note, row.categoryName].filter(Boolean).join(" ").toLowerCase();
          return hay.includes(kw);
        });
      }
      for (const row of list) {
        rows.push({ key: `income-${row.id}`, sortAt: row.earnedAt, kind: "income", income: row });
      }
    }
    return rows.sort((a, b) => (a.sortAt < b.sortAt ? 1 : a.sortAt > b.sortAt ? -1 : 0));
  }, [filteredFeePayments, incomes, incomeFilterCat, kw]);

  function resetIncomeForm() {
    setIncomeEditing(null);
    const preferred =
      incomeFilterCat !== "all" &&
      incomeFilterCat !== "COMMON_FEE" &&
      customIncomeCategories.some((c) => c.id === incomeFilterCat)
        ? incomeFilterCat
        : customIncomeCategories[0]?.id ?? "";
    setIncomeCategoryId(preferred);
    setIncomeLabel("");
    setIncomeAmount("");
    setIncomeNote("");
    setIncomeSlipUrl("");
  }

  function openIncomeCreate() {
    if (customIncomeCategories.length === 0) {
      setIncomeCatErr(null);
      setIncomeCatFormOpen(false);
      setIncomeCatModalOpen(true);
      return;
    }
    resetIncomeForm();
    setIncomeOpen(true);
  }

  function openIncomeEdit(row: VillageIncomeEntry) {
    setIncomeEditing(row);
    setIncomeCategoryId(row.categoryId);
    setIncomeLabel(row.label);
    setIncomeAmount(String(row.amountBaht));
    setIncomeNote(row.note ?? "");
    setIncomeSlipUrl(row.paymentSlipUrl?.trim() ?? "");
    setIncomeOpen(true);
  }

  async function uploadIncomeSlip(file: File) {
    setIncomeSlipBusy(true);
    setErr(null);
    try {
      const url = await uploadVillageIncomeSlip(file);
      setIncomeSlipUrl(url);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "อัปโหลดสลิปไม่สำเร็จ");
    } finally {
      setIncomeSlipBusy(false);
    }
  }

  async function onPickIncomeSlipFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    await uploadIncomeSlip(file);
  }

  async function submitIncome() {
    setIncomeBusy(true);
    setErr(null);
    try {
      if (!incomeCategoryId) throw new Error("เลือกหมวดหมู่รายรับ หรือเพิ่มหมวดก่อน");
      const label = incomeLabel.trim();
      const amount = Math.round(Number(incomeAmount || 0));
      if (!label) throw new Error("กรอกรายละเอียดรายการ");
      if (amount < 1) throw new Error("กรอกจำนวนเงินให้ถูกต้อง");
      const payload = {
        label,
        amountBaht: amount,
        categoryId: incomeCategoryId,
        note: incomeNote.trim() || null,
        paymentSlipUrl: incomeSlipUrl.trim() || null,
      };
      if (incomeEditing) {
        await updateVillageIncomeEntry(incomeEditing.id, payload);
      } else {
        await createVillageIncomeEntry(payload);
      }
      setIncomeOpen(false);
      resetIncomeForm();
      await load();
      onRefreshFinance?.();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "บันทึกรายรับไม่สำเร็จ");
    } finally {
      setIncomeBusy(false);
    }
  }

  async function deleteIncome(row: VillageIncomeEntry) {
    const ok = await notice.confirm(`ลบรายรับ «${row.label}» ใช่หรือไม่?`);
    if (!ok) return;
    setErr(null);
    try {
      await deleteVillageIncomeEntry(row.id);
      await load();
      onRefreshFinance?.();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "ลบรายรับไม่สำเร็จ";
      setErr(msg);
      notice.error(msg);
    }
  }

  function openIncomeCatCreate() {
    setIncomeCatEdit(null);
    setIncomeCatName("");
    setIncomeCatErr(null);
    setIncomeCatFormOpen(true);
  }

  function openIncomeCatEdit(c: VillageIncomeCategory) {
    if (c.isBuiltin || c.kind !== "CUSTOM") return;
    setIncomeCatEdit(c);
    setIncomeCatName(c.name);
    setIncomeCatErr(null);
    setIncomeCatFormOpen(true);
  }

  async function submitIncomeCategory() {
    setIncomeCatBusy(true);
    setIncomeCatErr(null);
    try {
      const name = incomeCatName.trim();
      if (!name) {
        setIncomeCatErr("กรอกชื่อหมวดหมู่");
        return;
      }
      if (incomeCatEdit) {
        await updateVillageIncomeCategory(incomeCatEdit.id, name);
      } else {
        await createVillageIncomeCategory(name);
      }
      setIncomeCatFormOpen(false);
      setIncomeCatEdit(null);
      setIncomeCatName("");
      await load();
    } catch (e) {
      setIncomeCatErr(e instanceof Error ? e.message : "บันทึกหมวดไม่สำเร็จ");
    } finally {
      setIncomeCatBusy(false);
    }
  }

  async function deleteIncomeCategory(c: VillageIncomeCategory) {
    const ok = await notice.confirm(
      `ลบหมวดหมู่ «${c.name}» ใช่หรือไม่?\n(ถ้ามีรายรับในหมวดนี้ต้องย้ายหรือลบก่อน)`,
    );
    if (!ok) return;
    setIncomeCatErr(null);
    try {
      await deleteVillageIncomeCategory(c.id);
      if (incomeFilterCat === c.id) setIncomeFilterCat("all");
      await load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "ลบหมวดไม่สำเร็จ";
      setIncomeCatErr(msg);
      notice.error(msg);
    }
  }

  const commonFeeLabel =
    incomeCategories.find((c) => c.kind === "COMMON_FEE")?.name ?? "ค่าส่วนกลาง";

  return (
    <>
      <AppSectionHeader
        tone="slate"
        title="ประวัติ / รายรับ"
        className="flex flex-row items-start justify-between gap-3 sm:items-center"
        actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
        action={
          <IncomeToolbarButtons
            compact
            onManageCategories={() => {
              setIncomeCatErr(null);
              setIncomeCatFormOpen(false);
              setIncomeCatModalOpen(true);
            }}
            onAddIncome={openIncomeCreate}
          />
        }
      />
      <p className="mt-2 text-xs font-semibold text-[#66638c]">
        ตามช่วง · {financeRangeLabel}
        {keyword.trim() ? ` · ค้นหา «${keyword.trim()}»` : ""}
        {" · "}
        รายรับค่าส่วนกลาง = ชำระแล้วเท่านั้น
        {" · "}
        <Link href={VILLAGE_FEES_HREF} className="font-bold text-[#4338ca] underline-offset-2 hover:underline">
          รับชำระ / ดูค้างชำระที่ค่าส่วนกลาง
        </Link>
      </p>

      <div
        className="mt-4 min-w-0 overflow-x-auto overflow-y-hidden overscroll-x-contain scroll-smooth pb-1 [-webkit-overflow-scrolling:touch]"
        role="group"
        aria-label="กรองตามหมวดหมู่รายรับ — เลื่อนซ้ายขวาได้"
      >
        <div className="flex w-max touch-pan-x gap-2 pr-1 sm:flex-wrap sm:pr-0">
          <button
            type="button"
            onClick={() => setIncomeFilterCat("all")}
            className={cn("shrink-0 snap-start transition", villageFilterChipClass(incomeFilterCat === "all"))}
            aria-pressed={incomeFilterCat === "all"}
          >
            ทั้งหมด
          </button>
          <button
            type="button"
            onClick={() => setIncomeFilterCat("COMMON_FEE")}
            className={cn("shrink-0 snap-start transition", villageFilterChipClass(incomeFilterCat === "COMMON_FEE"))}
            aria-pressed={incomeFilterCat === "COMMON_FEE"}
          >
            {commonFeeLabel}
          </button>
          {customIncomeCategories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setIncomeFilterCat(c.id)}
              className={cn("shrink-0 snap-start transition", villageFilterChipClass(incomeFilterCat === c.id))}
              aria-pressed={incomeFilterCat === c.id}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {err ? <p className="mt-3 text-sm font-semibold text-rose-600">{err}</p> : null}

      {loading ? (
        <div className="mt-4 h-32 animate-pulse rounded-2xl bg-[#ecebff]/40" aria-hidden />
      ) : filteredHistoryRows.length === 0 ? (
        <AppEmptyState tone="slate" className="mt-4">
          {customIncomeCategories.length === 0 && incomeFilterCat !== "COMMON_FEE"
            ? "เริ่มจากเพิ่มหมวด แล้วเพิ่มรายรับ — หรือดูค่าส่วนกลางจากการชำระ"
            : "ไม่พบรายการในช่วงนี้"}
        </AppEmptyState>
      ) : (
        <div
          className={cn("mt-4 max-h-[min(70vh,40rem)] min-h-0", appDashboardInnerScrollClass)}
          role="region"
          aria-label="ประวัติรายรับ"
        >
          <ul className="space-y-2 pr-0.5">
            {filteredHistoryRows.map((row) => {
              if (row.kind === "income") {
                const item = row.income;
                const slip = item.paymentSlipUrl?.trim() || "";
                return (
                  <li key={row.key} className={cn(villageListRowCardClass, "flex items-start gap-2")}>
                    {slip ? (
                      <AppImageThumb
                        src={slip}
                        alt={`สลิป ${item.label}`}
                        onOpen={() => slipLb.open(slip)}
                        className="h-14 w-14 shrink-0"
                      />
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-[#66638c]">
                        {formatBangkokDateTimeStable(item.earnedAt)}
                      </p>
                      <p className="mt-0.5 text-sm font-black text-[#1e1b4b]">{item.label}</p>
                      <p className="mt-0.5 text-[11px] font-bold text-[#4d47b6]">{item.categoryName}</p>
                      {item.note ? (
                        <p className="mt-0.5 text-xs font-semibold text-[#66638c]">{item.note}</p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <p className="text-lg font-black tabular-nums text-emerald-700">
                        ฿{formatVillageAmountStable(item.amountBaht)}
                      </p>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openIncomeEdit(item)}
                          className={assetRowEditIconButtonClass}
                          aria-label={`แก้ไขรายรับ ${item.label}`}
                          title="แก้ไข"
                        >
                          <IconRowEdit className="h-4 w-4" aria-hidden />
                        </button>
                        <button
                          type="button"
                          onClick={() => void deleteIncome(item)}
                          className={assetRowRemoveIconButtonClass}
                          aria-label={`ลบรายรับ ${item.label}`}
                          title="ลบ"
                        >
                          <IconRowRemove className="h-4 w-4" aria-hidden />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              }

              const f = row.fee;
              return (
                <li key={row.key} className={cn(villageListRowCardClass, "flex items-start gap-2")}>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black text-[#1e1b4b]">
                      บ้าน {f.house_no}
                      {f.owner_name ? ` · ${f.owner_name}` : ""}
                    </p>
                    <p className="mt-0.5 text-xs font-semibold text-[#66638c]">
                      งวด {f.year_month} · {f.status === "PAID" ? "ชำระแล้ว" : "ชำระบางส่วน"}
                    </p>
                    <p className="mt-0.5 text-[11px] font-bold text-[#4d47b6]">
                      {commonFeeLabel} · {formatBangkokDateTimeStable(f.paid_at!)}
                    </p>
                    {f.note ? (
                      <p className="mt-0.5 text-xs font-semibold text-[#66638c]">{f.note}</p>
                    ) : null}
                  </div>
                  <p className="shrink-0 text-lg font-black tabular-nums text-emerald-700">
                    ฿{formatVillageAmountStable(f.amount_paid)}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <FormModal
        open={incomeOpen}
        onClose={() => !incomeBusy && !incomeSlipBusy && setIncomeOpen(false)}
        title={incomeEditing ? "แก้ไขรายรับ" : "เพิ่มรายรับ"}
        mobileCentered
        size="lg"
        footer={
          <FormModalFooterActions
            onCancel={() => {
              if (!incomeBusy && !incomeSlipBusy) {
                setIncomeOpen(false);
                resetIncomeForm();
              }
            }}
            onSubmit={() => void submitIncome()}
            submitLabel="บันทึก"
            loading={incomeBusy}
          />
        }
      >
        <div className="space-y-3">
          <label className="block text-left text-sm font-bold text-[#1e1b4b]">
            หมวดหมู่
            <select
              value={incomeCategoryId}
              onChange={(e) => setIncomeCategoryId(e.target.value)}
              className={cn(villageFieldClass, "mt-1")}
              aria-label="หมวดหมู่รายรับ"
            >
              {customIncomeCategories.length === 0 ? <option value="">ยังไม่มีหมวด</option> : null}
              {customIncomeCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <p className="text-[11px] font-semibold text-[#8b87b8]">
            {commonFeeLabel}มาจากการชำระ — เพิ่มรายรับอื่นผ่านหมวดที่สร้างเอง
          </p>
          <label className="block text-left text-sm font-bold text-[#1e1b4b]">
            รายละเอียดรายการ
            <input
              className={cn(villageFieldClass, "mt-1")}
              value={incomeLabel}
              onChange={(e) => setIncomeLabel(e.target.value)}
              placeholder="เช่น ค่าเช่าพื้นที่ · ค่าจอดรถ"
            />
          </label>
          <label className="block text-left text-sm font-bold text-[#1e1b4b]">
            จำนวนเงิน (บาท)
            <input
              className={cn(villageFieldClass, "mt-1")}
              type="number"
              min={1}
              value={incomeAmount}
              onChange={(e) => setIncomeAmount(e.target.value)}
              placeholder="0"
            />
          </label>
          <label className="block text-left text-sm font-bold text-[#1e1b4b]">
            หมายเหตุ <span className="font-normal text-[#9b98c4]">(ไม่บังคับ)</span>
            <input
              className={cn(villageFieldClass, "mt-1")}
              value={incomeNote}
              onChange={(e) => setIncomeNote(e.target.value)}
              placeholder="รายละเอียดเพิ่มเติม"
            />
          </label>
          <div>
            <p className="text-sm font-bold text-[#1e1b4b]">
              รูปสลิป <span className="font-normal text-[#9b98c4]">(ไม่บังคับ)</span>
            </p>
            <AppGalleryCameraFileInputs
              galleryInputRef={incomeGalleryRef}
              cameraInputRef={incomeCamera.cameraInputRef}
              onChange={(e) => void onPickIncomeSlipFile(e)}
            />
            <div className="mt-2">
              <AppImagePickCameraButtons
                onPickGallery={() => incomeGalleryRef.current?.click()}
                onPickCamera={() => incomeCamera.openCamera((file) => void uploadIncomeSlip(file))}
                disabled={incomeBusy || incomeSlipBusy}
                busy={incomeSlipBusy}
              />
            </div>
            {incomeCamera.cameraModal}
            {incomeSlipUrl ? (
              <div className="mt-2 flex flex-wrap items-end gap-3">
                <AppImageThumb
                  src={incomeSlipUrl}
                  alt="สลิปรายรับ"
                  onOpen={() => slipLb.open(incomeSlipUrl)}
                  className="h-20 w-20"
                />
                <button
                  type="button"
                  onClick={() => setIncomeSlipUrl("")}
                  className={cn(appTemplateOutlineButtonClass, "rounded-[1rem] px-3 py-2 text-xs font-bold")}
                >
                  ลบสลิป
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </FormModal>

      <FormModal
        open={incomeCatModalOpen}
        onClose={() => !incomeCatBusy && setIncomeCatModalOpen(false)}
        title={incomeCatFormOpen ? (incomeCatEdit ? "แก้ไขหมวดหมู่" : "เพิ่มหมวดหมู่") : "หมวดหมู่รายรับ"}
        mobileCentered
        footer={
          incomeCatFormOpen ? (
            <FormModalFooterActions
              onCancel={() => {
                setIncomeCatFormOpen(false);
                setIncomeCatEdit(null);
                setIncomeCatName("");
                setIncomeCatErr(null);
              }}
              onSubmit={() => void submitIncomeCategory()}
              submitLabel={incomeCatEdit ? "บันทึก" : "เพิ่มหมวด"}
              loading={incomeCatBusy}
            />
          ) : (
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => openIncomeCatCreate()}
                className={cn(villageBtnPrimary, "rounded-[1rem] px-4 py-2 text-sm font-bold")}
              >
                + เพิ่มหมวดหมู่
              </button>
              <button
                type="button"
                onClick={() => setIncomeCatModalOpen(false)}
                className={cn(appTemplateOutlineButtonClass, "rounded-[1rem] px-4 py-2 text-sm font-bold")}
              >
                ปิด
              </button>
            </div>
          )
        }
      >
        {incomeCatErr ? <p className="mb-3 text-sm font-semibold text-rose-600">{incomeCatErr}</p> : null}
        {incomeCatFormOpen ? (
          <label className="block text-left text-sm font-bold text-[#1e1b4b]">
            ชื่อหมวดหมู่
            <input
              className={cn(villageFieldClass, "mt-1")}
              value={incomeCatName}
              onChange={(e) => setIncomeCatName(e.target.value)}
              placeholder="เช่น ค่าเช่าอื่นๆ · ค่าจอดรถ"
              autoFocus
            />
          </label>
        ) : (
          <ul className="space-y-2">
            {incomeCategories.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-2 rounded-[1.25rem] border border-white/50 bg-white/70 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-[#1e1b4b]">{c.name}</p>
                  {c.kind === "COMMON_FEE" ? (
                    <p className="text-[10px] font-semibold text-[#8b87b8]">หมวดหลัก · จากการชำระ</p>
                  ) : null}
                </div>
                {c.isBuiltin || c.kind !== "CUSTOM" ? null : (
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      className={assetRowEditIconButtonClass}
                      aria-label={`แก้ไขหมวด ${c.name}`}
                      title="แก้ไข"
                      onClick={() => openIncomeCatEdit(c)}
                    >
                      <IconRowEdit className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className={assetRowRemoveIconButtonClass}
                      aria-label={`ลบหมวด ${c.name}`}
                      title="ลบ"
                      onClick={() => void deleteIncomeCategory(c)}
                    >
                      <IconRowRemove className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </FormModal>

      <AppImageLightbox src={slipLb.src} onClose={slipLb.close} alt="สลิป" />
      {notice.popup}
    </>
  );
}
