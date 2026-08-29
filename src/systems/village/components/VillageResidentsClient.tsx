"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { VillageEmptyDashed, VillagePageStack, VillagePanelCard } from "@/systems/village/components/VillagePageChrome";
import { VillageHousingQuickTabs } from "@/systems/village/components/VillageHousingQuickTabs";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { normalizeVillageHouseNo } from "@/lib/village/house-no";
import {
  createVillageSessionApiRepository,
  villageFeeCycleLabelTh,
  type VillageHouse,
  type VillageHouseFeeCycle,
} from "@/systems/village/village-service";
import {
  villageBtnPrimary,
  villageBtnSecondary,
  villageDivider,
  villageField,
  villageHouseCardDivider,
  villageHouseFieldLabel,
  villageHouseListCard,
  villageHouseMetaRow,
  villageHouseNumber,
} from "@/systems/village/village-ui";

type ResidentDraft = {
  key: string;
  id?: number;
  name: string;
  phone: string;
  is_primary: boolean;
};

function newDraftKey() {
  return `r-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function VillageResidentsClient() {
  const api = useMemo(() => createVillageSessionApiRepository(), []);
  const [houses, setHouses] = useState<VillageHouse[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const { houses: h } = await api.getHouses();
      setHouses(h);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "โหลดไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    void load();
  }, [load]);

  const [houseModal, setHouseModal] = useState<{
    mode: "add" | "edit";
    house?: VillageHouse;
  } | null>(null);
  const [q, setQ] = useState("");

  const needle = q.trim().toLowerCase();
  const filteredHouses = useMemo(() => {
    if (!needle) return houses;
    return houses.filter((h) => {
      const blob = [
        h.house_no,
        h.plot_label ?? "",
        h.owner_name ?? "",
        h.phone ?? "",
        h.billing_start_ym ?? "",
        ...h.residents.map((r) => [r.name, r.phone ?? "", r.note ?? ""].join(" ")),
      ]
        .join(" ")
        .toLowerCase();
      return blob.includes(needle);
    });
  }, [houses, needle]);

  return (
    <VillagePageStack>
      <VillageHousingQuickTabs />
      <VillagePanelCard
        title="ค้นหาและเครื่องมือ"
        description="เพิ่มบ้าน รีเฟรช หรือดาวน์โหลดรายงาน"
      >
        <div className="flex flex-col gap-4">
          <label className="min-w-[200px] flex-1 text-sm font-medium text-slate-700">
            ค้นหา
            <input
              className={`mt-1.5 ${villageField}`}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="เลขบ้าน ชื่อ เบอร์…"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={villageBtnPrimary} onClick={() => setHouseModal({ mode: "add" })}>
              + เพิ่มบ้าน
            </button>
            <button type="button" className={villageBtnSecondary} onClick={() => void load()}>
              รีเฟรช
            </button>
            <a href={api.exportUrl("residents")} className={villageBtnSecondary}>
              ดาวน์โหลด CSV
            </a>
            <Link href="/dashboard/village/reports" className={villageBtnSecondary}>
              ส่งออกอื่น ๆ
            </Link>
          </div>
        </div>
      </VillagePanelCard>
      {err ? <p className="text-sm text-rose-600">{err}</p> : null}
      {loading ? (
        <VillagePanelCard>
          <p className="text-center text-sm text-[#66638c]">กำลังโหลด…</p>
        </VillagePanelCard>
      ) : null}
      {!loading ? (
        <VillagePanelCard
          title="รายการบ้าน"
          description={
            needle
              ? `แสดง ${filteredHouses.length} จาก ${houses.length} หลังตามคำค้น`
              : houses.length === 0
                ? "เพิ่มบ้านได้จากแผงด้านบน — แสดงเป็นผังการ์ดเหมือนหน้าห้องพัก"
                : `ผังการ์ด ${houses.length} หลัง · กดแก้ไขเพื่อจัดการบ้านและผู้อาศัย`
          }
        >
          {filteredHouses.length === 0 ? (
            <VillageEmptyDashed>
              {houses.length === 0
                ? "ยังไม่มีบ้านในระบบ — กด «เพิ่มบ้าน» เพื่อเริ่มต้น"
                : "ไม่พบตามคำค้น — ลองเปลี่ยนคำค้นหา"}
            </VillageEmptyDashed>
          ) : (
            <ul className="mt-1 grid grid-cols-1 gap-3.5 md:grid-cols-2">
              {filteredHouses.map((h) => {
                const primary = h.residents.find((r) => r.is_primary) ?? h.residents[0] ?? null;
                const ownerLabel = primary?.name?.trim() || h.owner_name?.trim() || null;
                return (
                  <li key={h.id} className="min-w-0">
                    <article className={villageHouseListCard}>
                      <div className="flex min-h-0 flex-1 gap-3">
                        {/* ซ้าย — ข้อมูลบ้าน */}
                        <div className="flex min-w-0 flex-1 flex-col">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-[9px] font-semibold text-slate-400">เลขที่</span>
                              {h.listed_for_sale ? (
                                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-black text-amber-800 ring-1 ring-amber-200/80">
                                  ประกาศขาย
                                </span>
                              ) : null}
                            </div>
                            <p className={`${villageHouseNumber} mt-0.5`}>{h.house_no}</p>
                            {h.plot_label ? (
                              <p className="mt-1 line-clamp-1 text-[10px] leading-tight text-slate-500">{h.plot_label}</p>
                            ) : null}
                          </div>

                          <div className={`${villageHouseCardDivider} mt-2 space-y-1.5 border-slate-200/60 pt-2`}>
                            {ownerLabel ? (
                              <div className={villageHouseMetaRow}>
                                <span className={villageHouseFieldLabel}>เจ้าบ้าน</span>
                                <div className="min-w-0 flex-1 text-[11px] leading-snug">
                                  <span className="font-semibold text-slate-800">{ownerLabel}</span>
                                  {(primary?.phone ?? h.phone)?.trim() ? (
                                    <span className="text-slate-500 tabular-nums">
                                      {" "}
                                      · {(primary?.phone ?? h.phone)!.trim()}
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            ) : null}
                            <div className={villageHouseMetaRow}>
                              <span className={villageHouseFieldLabel}>ค่าส่วนกลาง</span>
                              <div className="min-w-0 flex-1 space-y-0.5">
                                <p className="line-clamp-2 text-[10px] leading-snug text-slate-600">
                                  {villageFeeCycleLabelTh(h.fee_cycle)}
                                </p>
                                <p className="text-[11px] font-semibold tabular-nums leading-tight text-slate-900">
                                  {h.monthly_fee_override != null
                                    ? `${h.monthly_fee_override.toLocaleString("th-TH")} บ./ด.`
                                    : "ตามโครงการ"}
                                </p>
                              </div>
                            </div>
                            <div className={villageHouseMetaRow}>
                              <span className={villageHouseFieldLabel}>เริ่มเก็บ</span>
                              <span className="min-w-0 flex-1 text-[11px] font-semibold tabular-nums text-slate-800">
                                {h.billing_start_ym?.trim() || "ไม่กำหนด"}
                              </span>
                            </div>
                          </div>

                          <div className={cn("mt-auto flex flex-wrap gap-1.5 border-t pt-2", villageDivider)}>
                            <button
                              type="button"
                              className="app-btn-soft rounded-lg px-2.5 py-1.5 text-[10px] font-semibold text-slate-800 sm:text-[11px]"
                              onClick={() => setHouseModal({ mode: "edit", house: h })}
                            >
                              แก้ไข
                            </button>
                          </div>
                        </div>

                        {/* ขวา — รายชื่อผู้อาศัย ไม่มีกรอบ */}
                        <div className="flex w-[42%] shrink-0 flex-col border-l border-slate-200/50 pl-3 sm:w-[38%]">
                          <span className="text-[9px] font-semibold tracking-wide text-slate-400">
                            ผู้อาศัย · {h.residents.length}
                          </span>
                          {h.residents.length === 0 ? (
                            <p className="mt-2 text-[10px] leading-snug text-slate-400">ยังไม่มีรายชื่อ</p>
                          ) : (
                            <ul className="mt-1.5 min-h-0 flex-1 space-y-1 overflow-hidden">
                              {h.residents.map((r) => (
                                <li key={r.id} className="min-w-0 text-[11px] leading-snug">
                                  <span className="font-semibold text-slate-800">{r.name}</span>
                                  {r.is_primary ? (
                                    <span className="ml-1 text-[9px] font-bold text-[#4d47b6]">เจ้าบ้าน</span>
                                  ) : null}
                                  {r.phone?.trim() ? (
                                    <span className="mt-0.5 block text-[10px] tabular-nums text-slate-500">
                                      {r.phone.trim()}
                                    </span>
                                  ) : null}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </article>
                  </li>
                );
              })}
            </ul>
          )}
        </VillagePanelCard>
      ) : null}

      {houseModal ? (
        <HouseFormModal
          api={api}
          mode={houseModal.mode}
          house={houseModal.house}
          onClose={() => setHouseModal(null)}
          onSaved={() => {
            setHouseModal(null);
            void load();
          }}
        />
      ) : null}
    </VillagePageStack>
  );
}

function HouseFormModal({
  api,
  mode,
  house,
  onClose,
  onSaved,
}: {
  api: ReturnType<typeof createVillageSessionApiRepository>;
  mode: "add" | "edit";
  house?: VillageHouse;
  onClose: () => void;
  onSaved: () => void;
}) {
  const residentsSectionId = useId();
  const [houseNo, setHouseNo] = useState(house?.house_no ?? "");
  const [plot, setPlot] = useState(house?.plot_label ?? "");
  const [override, setOverride] = useState(house?.monthly_fee_override != null ? String(house.monthly_fee_override) : "");
  const [feeCycle, setFeeCycle] = useState<VillageHouseFeeCycle>(house?.fee_cycle ?? "MONTHLY");
  const [billingStartYm, setBillingStartYm] = useState(house?.billing_start_ym ?? "");
  const [listedForSale, setListedForSale] = useState(house?.listed_for_sale ?? false);
  const [residents, setResidents] = useState<ResidentDraft[]>(() => {
    const existing = (house?.residents ?? []).map((r) => ({
      key: `id-${r.id}`,
      id: r.id,
      name: r.name,
      phone: r.phone ?? "",
      is_primary: r.is_primary,
    }));
    if (existing.length > 0) return existing;
    // บ้านเก่ามีแค่ชื่อเจ้าบ้าน — เติมเป็นแถวผู้อาศัย + ติ๊กเจ้าบ้าน
    const legacyName = house?.owner_name?.trim();
    if (legacyName) {
      return [
        {
          key: newDraftKey(),
          name: legacyName,
          phone: house?.phone?.trim() ?? "",
          is_primary: true,
        },
      ];
    }
    return [{ key: newDraftKey(), name: "", phone: "", is_primary: true }];
  });
  const [busy, setBusy] = useState(false);

  function updateResident(key: string, patch: Partial<ResidentDraft>) {
    setResidents((rows) =>
      rows.map((row) => {
        if (row.key !== key) {
          if (patch.is_primary === true) return { ...row, is_primary: false };
          return row;
        }
        return { ...row, ...patch };
      }),
    );
  }

  return (
    <FormModal
      open
      title={mode === "add" ? "เพิ่มบ้าน" : "แก้ไขบ้าน"}
      description="ข้อมูลบ้าน · เดือนเริ่มเก็บ · รายชื่อผู้อาศัย (ติ๊กเจ้าบ้าน)"
      onClose={onClose}
      size="lg"
      footer={
        <FormModalFooterActions
          cancelLabel="ยกเลิก"
          onCancel={onClose}
          submitLabel="บันทึก"
          submitDisabled={busy || !normalizeVillageHouseNo(houseNo)}
          loading={busy}
          onSubmit={async () => {
            setBusy(true);
            try {
              const ov = override.trim() === "" ? null : Number.parseInt(override, 10);
              const cleaned = residents
                .filter((r) => r.name.trim())
                .map((r) => ({
                  ...(r.id != null ? { id: r.id } : {}),
                  name: r.name.trim(),
                  phone: r.phone.trim() || null,
                  is_primary: r.is_primary,
                }));
              // ให้มีเจ้าบ้านอย่างน้อย 1 คนถ้ามีรายชื่อ
              if (cleaned.length > 0 && !cleaned.some((r) => r.is_primary)) {
                cleaned[0]!.is_primary = true;
              }
              const owner = cleaned.find((r) => r.is_primary) ?? cleaned[0] ?? null;
              const body = {
                house_no: normalizeVillageHouseNo(houseNo),
                plot_label: plot.trim() || null,
                owner_name: owner?.name ?? null,
                phone: owner?.phone ?? null,
                monthly_fee_override: ov != null && Number.isFinite(ov) ? ov : null,
                fee_cycle: feeCycle,
                billing_start_ym: billingStartYm.trim() || null,
                listed_for_sale: listedForSale,
                residents: cleaned,
              };
              if (mode === "add") await api.postHouse(body);
              else if (house) await api.patchHouse(house.id, body);
              onSaved();
            } catch (e) {
              alert(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
            } finally {
              setBusy(false);
            }
          }}
        />
      }
    >
      <div className="space-y-4 text-sm">
        <label className="block">
          <span className="text-xs font-medium text-slate-600">เลขที่บ้าน</span>
          <input
            className={`mt-1.5 ${villageField}`}
            value={houseNo}
            onChange={(e) => setHouseNo(e.target.value)}
            maxLength={120}
            placeholder="เช่น 222/284"
            autoComplete="off"
          />
          <span className="mt-1 block text-[11px] text-slate-400">เปรียบเทียบทั้งข้อความ — สแลชแบบไทย/อังกฤษจะถูกจัดเป็นแบบเดียวกัน</span>
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-600">แปลง / หมายเหตุที่อยู่</span>
          <input className={`mt-1.5 ${villageField}`} value={plot} onChange={(e) => setPlot(e.target.value)} />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-600">รอบเรียกเก็บ (อัตราด้านล่าง = บาทต่อเดือน)</span>
          <select
            className={`mt-1.5 ${villageField}`}
            value={feeCycle}
            onChange={(e) => setFeeCycle(e.target.value as VillageHouseFeeCycle)}
          >
            <option value="MONTHLY">รายเดือน — เรียกเก็บทุกเดือนเท่ากับอัตราต่อเดือน</option>
            <option value="SEMI_ANNUAL">รายหกเดือน — เรียกเก็บ ม.ค. และ ก.ค. (6 × อัตราต่อเดือน)</option>
            <option value="ANNUAL">รายปี — เรียกเก็บเดือน ม.ค. เท่านั้น (12 × อัตราต่อเดือน)</option>
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-600">อัตราต่อเดือนเฉพาะหลัง (บาท) — เว้นว่าง = ใช้มาตรฐาน</span>
          <input
            className={`mt-1.5 ${villageField}`}
            value={override}
            onChange={(e) => setOverride(e.target.value)}
            inputMode="numeric"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-600">เริ่มเก็บค่าส่วนกลาง (เดือน)</span>
          <input
            type="month"
            className={`mt-1.5 ${villageField}`}
            value={billingStartYm}
            onChange={(e) => setBillingStartYm(e.target.value)}
          />
          <span className="mt-1 block text-[11px] text-slate-400">เว้นว่าง = ไม่จำกัด (สร้างบิลได้ทุกเดือน)</span>
        </label>
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-amber-200/80 bg-amber-50/70 px-3 py-3 shadow-sm ring-1 ring-amber-100/80">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-400/40"
            checked={listedForSale}
            onChange={(e) => setListedForSale(e.target.checked)}
          />
          <span className="min-w-0">
            <span className="block text-sm font-bold text-slate-900">ประกาศขายบนเว็บลูกค้า</span>
            <span className="mt-0.5 block text-[11px] leading-snug text-slate-500">
              เมื่อเปิด บ้านหลังนี้จะโชว์ในหมวด «บ้านที่ประกาศขาย» พร้อมเบอร์โทรนิติจากตั้งค่าโครงการ
            </span>
          </span>
        </label>

        <section
          id={residentsSectionId}
          className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3 sm:p-4"
          aria-label="ผู้อาศัย"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">ผู้อาศัย</h3>
              <p className="mt-0.5 text-[10px] text-slate-500">ติ๊ก «เจ้าบ้าน» คนใดคนหนึ่ง — ไม่ต้องกรอกชื่อซ้ำ</p>
            </div>
            <button
              type="button"
              className="rounded-xl border border-[#5b61ff]/30 bg-white px-3 py-1.5 text-[11px] font-semibold text-[#4d47b6] shadow-sm"
              onClick={() =>
                setResidents((rows) => [
                  ...rows,
                  { key: newDraftKey(), name: "", phone: "", is_primary: rows.length === 0 },
                ])
              }
            >
              + เพิ่มผู้อาศัย
            </button>
          </div>
          {residents.length === 0 ? (
            <p className="mt-3 text-center text-[11px] text-slate-500">ยังไม่มีรายชื่อ — กดเพิ่มผู้อาศัย</p>
          ) : (
            <ul className="mt-3 space-y-2.5">
              {residents.map((r, idx) => (
                <li key={r.key} className="rounded-xl border border-white/80 bg-white/90 p-3 shadow-sm ring-1 ring-slate-200/60">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-bold text-slate-400">#{idx + 1}</span>
                    <button
                      type="button"
                      className="text-[11px] font-semibold text-rose-600 hover:underline"
                      onClick={() => setResidents((rows) => rows.filter((x) => x.key !== r.key))}
                    >
                      ลบ
                    </button>
                  </div>
                  <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                    <label className="block sm:col-span-2">
                      <span className="text-[10px] font-medium text-slate-500">ชื่อ-สกุล</span>
                      <input
                        className={`mt-1 ${villageField}`}
                        value={r.name}
                        onChange={(e) => updateResident(r.key, { name: e.target.value })}
                        placeholder="ชื่อผู้อาศัย"
                      />
                    </label>
                    <label className="flex items-end gap-2 pb-2 sm:row-span-2 sm:flex-col sm:items-start sm:justify-end sm:pb-0">
                      <span className="inline-flex items-center gap-2 rounded-lg border border-slate-200/80 bg-slate-50/80 px-2.5 py-2">
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-[#5b61ff]"
                          checked={r.is_primary}
                          onChange={(e) => updateResident(r.key, { is_primary: e.target.checked })}
                          aria-label={`เจ้าบ้าน ${r.name || `#${idx + 1}`}`}
                        />
                        <span className="text-[11px] font-bold text-[#4d47b6]">เจ้าบ้าน</span>
                      </span>
                    </label>
                    <label className="block sm:col-span-2">
                      <span className="text-[10px] font-medium text-slate-500">เบอร์</span>
                      <input
                        className={`mt-1 ${villageField}`}
                        value={r.phone}
                        onChange={(e) => updateResident(r.key, { phone: e.target.value })}
                        inputMode="tel"
                      />
                    </label>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </FormModal>
  );
}
