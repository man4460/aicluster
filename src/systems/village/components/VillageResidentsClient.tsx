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
  villageGlassCard,
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
              {filteredHouses.map((h) => (
                <li key={h.id} className="min-w-0">
                  <article className={villageHouseListCard}>
                    <div className="min-w-0 pr-1">
                      <div className="flex items-end justify-between gap-2">
                        <div>
                          <span className="text-[9px] font-semibold text-slate-400">เลขที่</span>
                          <p className={`${villageHouseNumber} mt-0.5`}>{h.house_no}</p>
                        </div>
                      </div>
                      {h.plot_label ? (
                        <p className="mt-1 line-clamp-1 text-[10px] leading-tight text-slate-500">{h.plot_label}</p>
                      ) : null}
                    </div>

                    <div className={`${villageHouseCardDivider} mt-2 space-y-1.5 border-slate-200/60 pt-2`}>
                      <div className={villageHouseMetaRow}>
                        <span className={villageHouseFieldLabel}>เจ้าบ้าน</span>
                        <div className="min-w-0 flex-1 text-[11px] leading-snug">
                          <span className="font-semibold text-slate-800">{h.owner_name?.trim() || "—"}</span>
                          {h.phone?.trim() ? (
                            <span className="text-slate-500 tabular-nums"> · {h.phone.trim()}</span>
                          ) : null}
                        </div>
                      </div>
                      <div className={`${villageHouseMetaRow} items-center`}>
                        <span className={villageHouseFieldLabel}>ผู้พัก</span>
                        <span className="inline-flex rounded-md bg-slate-100/95 px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-slate-700 ring-1 ring-slate-200/80">
                          {h.residents.length} คน
                        </span>
                      </div>
                      <div className={villageHouseMetaRow}>
                        <span className={villageHouseFieldLabel}>ค่าส่วนกลาง</span>
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <p className="text-[10px] leading-snug text-slate-600 line-clamp-2">
                            {villageFeeCycleLabelTh(h.fee_cycle)}
                          </p>
                          <p className="text-[11px] font-semibold tabular-nums leading-tight text-slate-900">
                            {h.monthly_fee_override != null
                              ? `${h.monthly_fee_override.toLocaleString("th-TH")} บ./ด. (เฉพาะหลังนี้)`
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

                    <div className="mt-2 flex-1">
                      {h.residents.length === 0 ? (
                        <p className="rounded-md border border-dashed border-white/75 bg-white/65 py-1.5 text-center text-[10px] font-medium leading-tight text-slate-500">
                          ยังไม่มีรายชื่อ — กดแก้ไขเพื่อเพิ่มผู้อาศัย
                        </p>
                      ) : (
                        <ul className="space-y-1">
                          {h.residents.map((r) => (
                            <li
                              key={r.id}
                              className={cn("rounded-md py-1 pl-1.5 pr-1", villageGlassCard)}
                            >
                              <span className="min-w-0 text-[10px] leading-tight sm:text-[11px]">
                                <span className="font-semibold text-slate-800">{r.name}</span>
                                {r.is_primary ? (
                                  <span className="ml-0.5 text-[9px] font-bold text-[#4d47b6]">หลัก</span>
                                ) : null}
                                {r.phone ? (
                                  <span className="ml-1 tabular-nums text-slate-500">{r.phone}</span>
                                ) : null}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
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
                  </article>
                </li>
              ))}
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
  const [ownerName, setOwnerName] = useState(house?.owner_name ?? "");
  const [phone, setPhone] = useState(house?.phone ?? "");
  const [override, setOverride] = useState(house?.monthly_fee_override != null ? String(house.monthly_fee_override) : "");
  const [feeCycle, setFeeCycle] = useState<VillageHouseFeeCycle>(house?.fee_cycle ?? "MONTHLY");
  const [billingStartYm, setBillingStartYm] = useState(house?.billing_start_ym ?? "");
  const [residents, setResidents] = useState<ResidentDraft[]>(() =>
    (house?.residents ?? []).map((r) => ({
      key: `id-${r.id}`,
      id: r.id,
      name: r.name,
      phone: r.phone ?? "",
      is_primary: r.is_primary,
    })),
  );
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
      description="ข้อมูลบ้าน · เดือนเริ่มเก็บ · และรายชื่อผู้อาศัย"
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
              const body = {
                house_no: normalizeVillageHouseNo(houseNo),
                plot_label: plot.trim() || null,
                owner_name: ownerName.trim() || null,
                phone: phone.trim() || null,
                monthly_fee_override: ov != null && Number.isFinite(ov) ? ov : null,
                fee_cycle: feeCycle,
                billing_start_ym: billingStartYm.trim() || null,
                residents: residents
                  .filter((r) => r.name.trim())
                  .map((r) => ({
                    ...(r.id != null ? { id: r.id } : {}),
                    name: r.name.trim(),
                    phone: r.phone.trim() || null,
                    is_primary: r.is_primary,
                  })),
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
          <span className="text-xs font-medium text-slate-600">ชื่อเจ้าบ้าน (แสดงผล)</span>
          <input className={`mt-1.5 ${villageField}`} value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-600">เบอร์โทร</span>
          <input className={`mt-1.5 ${villageField}`} value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" />
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

        <section
          id={residentsSectionId}
          className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3 sm:p-4"
          aria-label="ผู้อาศัย"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-900">ผู้อาศัย</h3>
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
                <li
                  key={r.key}
                  className="rounded-xl border border-white/80 bg-white/90 p-3 shadow-sm ring-1 ring-slate-200/60"
                >
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
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <label className="block sm:col-span-2">
                      <span className="text-[10px] font-medium text-slate-500">ชื่อ-สกุล</span>
                      <input
                        className={`mt-1 ${villageField}`}
                        value={r.name}
                        onChange={(e) => updateResident(r.key, { name: e.target.value })}
                        placeholder="ชื่อผู้อาศัย"
                      />
                    </label>
                    <label className="block">
                      <span className="text-[10px] font-medium text-slate-500">เบอร์</span>
                      <input
                        className={`mt-1 ${villageField}`}
                        value={r.phone}
                        onChange={(e) => updateResident(r.key, { phone: e.target.value })}
                        inputMode="tel"
                      />
                    </label>
                    <label className="flex items-center gap-2 pt-5">
                      <input
                        type="checkbox"
                        checked={r.is_primary}
                        onChange={(e) => updateResident(r.key, { is_primary: e.target.checked })}
                      />
                      <span className="text-[11px] font-medium text-slate-700">ผู้ติดต่อหลัก</span>
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
