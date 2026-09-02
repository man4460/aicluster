"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FormModal } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import { LaundryPackageEditorModal } from "@/systems/laundry/components/LaundryPackageEditorModal";
import { type LaundryPackage, type LaundryRepository } from "@/systems/laundry/laundry-service";

function priceHint(pkg: LaundryPackage): string {
  const tiers = pkg.basket_tiers?.filter((t) => t.label.trim()) ?? [];
  if (tiers.length) {
    const prices = tiers.map((t) => t.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min === max ? `฿${min.toLocaleString("th-TH")}` : `฿${min.toLocaleString("th-TH")} – ฿${max.toLocaleString("th-TH")}`;
  }
  return `฿${pkg.base_price.toLocaleString("th-TH")}`;
}

function IconGear(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={props.className} aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" strokeLinecap="round" />
    </svg>
  );
}

function IconCheck(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={props.className} aria-hidden>
      <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type Step = "pick" | "detail";

export function LaundryRecordOrderModal({
  open,
  onClose,
  packages,
  repo,
  recorderDisplayName,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  packages: LaundryPackage[];
  repo: LaundryRepository;
  recorderDisplayName: string;
  onSaved: () => void | Promise<void>;
}) {
  const [step, setStep] = useState<Step>("pick");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [tierIndex, setTierIndex] = useState<number | null>(null);

  const [customerPhone, setCustomerPhone] = useState("");
  const [nickname, setNickname] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formErr, setFormErr] = useState("");

  /** จัดการแพ็กเกจ (โมดัลแชร์กับแท็บแพ็กเกจ) */
  const [manageOpen, setManageOpen] = useState(false);
  const [manageTargetId, setManageTargetId] = useState<number | null>(null);

  const activePackages = useMemo(() => packages.filter((p) => p.is_active), [packages]);

  const selectedPkg = useMemo(
    () => (selectedId != null ? activePackages.find((p) => p.id === selectedId) ?? null : null),
    [activePackages, selectedId],
  );

  const tiers = selectedPkg?.basket_tiers?.filter((t) => t.label.trim()) ?? [];

  const resolvedPrice = useMemo(() => {
    if (!selectedPkg) return 0;
    if (tiers.length && tierIndex != null && tiers[tierIndex]) return tiers[tierIndex].price;
    return selectedPkg.base_price;
  }, [selectedPkg, tierIndex, tiers]);

  const resetAll = useCallback(() => {
    setStep("pick");
    setSelectedId(null);
    setTierIndex(null);
    setCustomerPhone("");
    setNickname("");
    setFormErr("");
    setSubmitting(false);
  }, []);

  useEffect(() => {
    if (!open) resetAll();
  }, [open, resetAll]);

  function selectPackage(p: LaundryPackage) {
    setSelectedId(p.id);
    const list = p.basket_tiers?.filter((t) => t.label.trim()) ?? [];
    setTierIndex(list.length > 0 ? 0 : null);
  }

  function openManage(p: LaundryPackage) {
    setManageTargetId(p.id);
    setManageOpen(true);
  }

  const manageTarget = useMemo(
    () => (manageTargetId != null ? packages.find((p) => p.id === manageTargetId) ?? null : null),
    [packages, manageTargetId],
  );

  async function submitOrder() {
    setFormErr("");
    if (!selectedPkg) {
      setFormErr("เลือกแพ็กเกจก่อน");
      return;
    }
    const tier = tiers.length && tierIndex != null ? tiers[tierIndex] : null;

    setSubmitting(true);
    try {
      await repo.createOrder({
        customer_name: nickname.trim(),
        customer_phone: customerPhone.trim(),
        pickup_address: "หน้าร้าน",
        dropoff_address: "หน้าร้าน",
        service_type: tier ? `${selectedPkg.name} (${tier.label})` : selectedPkg.name,
        package_id: selectedPkg.id,
        package_name: selectedPkg.name,
        weight_kg: 0,
        item_count: 0,
        final_price: resolvedPrice,
        note: "",
        recorded_by_name: recorderDisplayName,
        status: "PICKED_UP",
      });
      await onSaved();
      onClose();
    } catch (e) {
      setFormErr(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  }

  const btnGhostSmall =
    "rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50";

  const btnPrimaryLarge =
    "app-btn-primary min-h-[48px] rounded-xl px-6 py-3 text-base font-bold shadow-lg shadow-indigo-200/80 hover:shadow-xl disabled:opacity-60";

  const pickFooter = (
    <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
      <button type="button" onClick={onClose} className={cn(btnGhostSmall, "self-start")}>
        ปิด
      </button>
      <button
        type="button"
        disabled={!selectedPkg}
        onClick={() => setStep("detail")}
        className={cn(btnPrimaryLarge, "w-full sm:w-auto sm:min-w-[14rem]")}
      >
        ถัดไป — ข้อมูลลูกค้า
      </button>
    </div>
  );

  const detailFooter = (
    <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setStep("pick")} className={btnGhostSmall}>
          ย้อนกลับ
        </button>
        <button type="button" onClick={onClose} className={btnGhostSmall}>
          ยกเลิก
        </button>
      </div>
      <button
        type="button"
        disabled={submitting}
        onClick={() => void submitOrder()}
        className={cn(btnPrimaryLarge, "w-full shrink-0 sm:w-auto sm:min-w-[11rem]")}
      >
        {submitting ? "กำลังบันทึก..." : "บันทึกรายการ"}
      </button>
    </div>
  );

  return (
    <>
      <FormModal
        open={open}
        onClose={onClose}
        title={step === "pick" ? "เลือกรายการ (แบบ POS)" : "เบอร์โทร · ชื่อ"}
        description={step === "pick" ? "แตะการ์ดเลือกแพ็กเกจ · เฟือง = จัดการรูป/ตะกร้า" : "ไม่บังคับ — เว้นว่างได้"}
        size="xl"
        mobileCentered
        footer={step === "pick" ? pickFooter : detailFooter}
      >
        {step === "pick" ?
          <div className="space-y-4">
            {activePackages.length === 0 ?
              <p className="rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/50 px-4 py-8 text-center text-sm text-[#4d47b6]">
                ยังไม่มีแพ็กเกจที่เปิดใช้ — ไปแท็บ &quot;แพ็กเกจ&quot; แล้วกด &quot;เพิ่มแพ็กเกจ&quot;
              </p>
            : <>
                <div className="grid max-h-[min(62vh,520px)] grid-cols-1 gap-3 overflow-y-auto pb-1 sm:grid-cols-3 sm:gap-4">
                  {activePackages.map((p) => {
                    const selected = selectedId === p.id;
                    return (
                      <div key={p.id} className="relative">
                        <button
                          type="button"
                          onClick={() => selectPackage(p)}
                          className={cn(
                            "relative flex w-full flex-col overflow-hidden rounded-2xl border text-left transition-all duration-200",
                            selected ?
                              "border-indigo-400 bg-indigo-50/90 shadow-[0_0_0_1px_rgba(99,102,241,0.35)] ring-2 ring-indigo-200/80"
                            : "border-slate-200/90 bg-white shadow-sm hover:border-indigo-200 hover:shadow-md",
                          )}
                        >
                          <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
                            {p.image_url ?
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={p.image_url} alt="" className="h-full w-full object-cover" loading="lazy" />
                            : <div className="flex h-full w-full items-center justify-center text-slate-400">
                                <svg viewBox="0 0 24 24" className="h-12 w-12 opacity-35" fill="none" stroke="currentColor" strokeWidth={1.5}>
                                  <path d="M12 3v3M12 18v3M3 12h3M18 12h3" strokeLinecap="round" />
                                  <rect x="6" y="6" width="12" height="12" rx="2" />
                                </svg>
                              </div>
                            }
                            {selected ?
                              <div className="absolute inset-0 flex items-center justify-center bg-indigo-600/25 backdrop-blur-[2px]">
                                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg ring-2 ring-white/60">
                                  <IconCheck className="h-5 w-5" />
                                </div>
                              </div>
                            : null}
                          </div>
                          <div className="space-y-1 p-3">
                            <p className="line-clamp-2 text-sm font-black text-[#2e2a58]">{p.name}</p>
                            <p className="text-xs font-bold text-indigo-600">{priceHint(p)}</p>
                            {p.description ?
                              <p className="line-clamp-2 text-[11px] leading-snug text-[#66638c]">{p.description}</p>
                            : null}
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => openManage(p)}
                          className="absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-xl border border-white/90 bg-white/95 text-[#4d47b6] shadow-md hover:bg-indigo-50"
                          aria-label={`จัดการแพ็กเกจ ${p.name}`}
                        >
                          <IconGear className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {selectedPkg && tiers.length > 0 ?
                  <div className="rounded-2xl border border-[#ecebff] bg-[#f8f7ff] p-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#66638c]">เลือกขนาดตะกร้า / ราคา</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {tiers.map((t, i) => (
                        <button
                          key={`${t.label}-${i}`}
                          type="button"
                          onClick={() => setTierIndex(i)}
                          className={cn(
                            "rounded-xl border px-3 py-2 text-left text-xs font-bold transition-all",
                            tierIndex === i ?
                              "border-indigo-400 bg-white text-indigo-700 shadow-sm ring-1 ring-indigo-200"
                            : "border-transparent bg-white/70 text-[#2e2a58] hover:border-indigo-200",
                          )}
                        >
                          <span className="block">{t.label}</span>
                          <span className="text-[11px] font-black text-indigo-600">฿{t.price.toLocaleString("th-TH")}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                : null}
              </>
            }
          </div>
        : <div className="grid grid-cols-1 gap-4">
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 px-3 py-2 text-sm text-[#2e2a58]">
              <span className="font-bold">{selectedPkg?.name}</span>
              {tiers.length > 0 && tierIndex != null && tiers[tierIndex] ?
                <span className="text-[#66638c]"> · {tiers[tierIndex].label} · ฿{tiers[tierIndex].price.toLocaleString("th-TH")}</span>
              : selectedPkg ?
                <span className="text-[#66638c]"> · ฿{selectedPkg.base_price.toLocaleString("th-TH")}</span>
              : null}
            </div>
            <label className="text-xs font-semibold text-[#4d47b6]">
              เบอร์โทร <span className="font-normal text-[#66638c]">(ไม่บังคับ)</span>
              <input
                className="app-input mt-1 w-full rounded-xl px-3 py-2.5 text-sm"
                inputMode="tel"
                autoComplete="tel"
                placeholder="เช่น 0812345678"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </label>
            <label className="text-xs font-semibold text-[#4d47b6]">
              ชื่อ <span className="font-normal text-[#66638c]">(ไม่บังคับ)</span>
              <input
                className="app-input mt-1 w-full rounded-xl px-3 py-2.5 text-sm"
                autoComplete="name"
                placeholder="เช่น พี่แป้ง"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
            </label>
            {formErr ?
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{formErr}</p>
            : null}
          </div>
        }
      </FormModal>

      <LaundryPackageEditorModal
        open={manageOpen && manageTarget != null}
        onClose={() => {
          setManageOpen(false);
          setManageTargetId(null);
        }}
        editingPackage={manageTarget}
        repo={repo}
        onSaved={onSaved}
      />
    </>
  );
}
