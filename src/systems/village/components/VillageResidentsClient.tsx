"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-container";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { normalizeVillageHouseNo } from "@/lib/village/house-no";
import {
  createVillageSessionApiRepository,
  villageFeeCycleLabelTh,
  type VillageHouse,
  type VillageHouseFeeCycle,
  type VillageResident,
} from "@/systems/village/village-service";
import {
  villageBtnPrimary,
  villageBtnSecondary,
  villageCard,
  villageField,
  villageToolbar,
} from "@/systems/village/village-ui";

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
  const [residentModal, setResidentModal] = useState<{ houseId: number } | null>(null);
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
        ...h.residents.map((r) => [r.name, r.phone ?? "", r.note ?? ""].join(" ")),
      ]
        .join(" ")
        .toLowerCase();
      return blob.includes(needle);
    });
  }, [houses, needle]);

  return (
    <div className="space-y-8">
      <PageHeader title="ลูกบ้าน" description="แปลง บ้าน และผู้พักอาศัย — ค้นหา ส่งออก CSV และกำหนดรอบค่าส่วนกลางต่อหลัง" />
      <div className={villageToolbar}>
        <label className="min-w-[200px] flex-1 text-sm font-medium text-slate-700">
          ค้นหา
          <input
            className={`mt-1.5 ${villageField}`}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="เลขบ้าน ชื่อ เบอร์…"
          />
        </label>
        <a href={api.exportUrl("residents")} className={villageBtnSecondary}>
          ดาวน์โหลด CSV
        </a>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={villageBtnPrimary} onClick={() => setHouseModal({ mode: "add" })}>
          เพิ่มบ้าน
        </button>
        <button type="button" className={villageBtnSecondary} onClick={() => void load()}>
          รีเฟรช
        </button>
        <Link href="/dashboard/village/reports" className={villageBtnSecondary}>
          ส่งออก CSV
        </Link>
      </div>
      {err ? <p className="text-sm text-rose-600">{err}</p> : null}
      {loading ? <p className="text-sm text-slate-500">กำลังโหลด…</p> : null}
      {needle ? (
        <p className="text-xs text-slate-500">
          แสดง {filteredHouses.length} จาก {houses.length} หลัง
        </p>
      ) : null}
      <ul className="space-y-4">
        {filteredHouses.map((h) => (
          <li key={h.id} className={`${villageCard} p-5`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-base font-semibold tracking-tight text-slate-900">
                  บ้านเลขที่ {h.house_no}
                  {h.plot_label ? <span className="font-normal text-slate-500"> ({h.plot_label})</span> : null}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {h.owner_name || "—"} {h.phone ? `· ${h.phone}` : ""}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-slate-500">
                  ค่าส่วนกลาง: {villageFeeCycleLabelTh(h.fee_cycle)} ·{" "}
                  {h.monthly_fee_override != null
                    ? `${h.monthly_fee_override.toLocaleString("th-TH")} บาท/เดือน (เฉพาะหลังนี้)`
                    : "อัตราต่อเดือนตามตั้งค่าโครงการ"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:border-[#0000BF]/25"
                  onClick={() => setHouseModal({ mode: "edit", house: h })}
                >
                  แก้ไขบ้าน
                </button>
                <button
                  type="button"
                  className="rounded-xl bg-[#0000BF]/10 px-3 py-2 text-xs font-semibold text-[#0000BF] hover:bg-[#0000BF]/15"
                  onClick={() => setResidentModal({ houseId: h.id })}
                >
                  เพิ่มลูกบ้าน
                </button>
              </div>
            </div>
            <ul className="mt-4 space-y-1 border-t border-slate-100 pt-4">
              {h.residents.length === 0 ? (
                <li className="text-sm text-slate-500">ยังไม่มีรายชื่อในบ้านนี้</li>
              ) : (
                h.residents.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span>
                      {r.name}
                      {r.is_primary ? <span className="ml-1 text-xs text-[#0000BF]">(หลัก)</span> : null}
                      {r.phone ? <span className="text-slate-500"> · {r.phone}</span> : null}
                    </span>
                    <ResidentActions api={api} resident={r} onDone={load} />
                  </li>
                ))
              )}
            </ul>
          </li>
        ))}
      </ul>

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
      {residentModal ? (
        <ResidentFormModal
          api={api}
          houseId={residentModal.houseId}
          onClose={() => setResidentModal(null)}
          onSaved={() => {
            setResidentModal(null);
            void load();
          }}
        />
      ) : null}
    </div>
  );
}

function ResidentActions({
  api,
  resident,
  onDone,
}: {
  api: ReturnType<typeof createVillageSessionApiRepository>;
  resident: VillageResident;
  onDone: () => void;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <span className="flex gap-1">
      <button
        type="button"
        disabled={busy}
        className="text-xs text-[#0000BF] hover:underline disabled:opacity-50"
        onClick={async () => {
          const name = window.prompt("ชื่อ", resident.name);
          if (name == null) return;
          setBusy(true);
          try {
            await api.patchResident(resident.id, { name: name.trim(), is_primary: resident.is_primary });
            onDone();
          } catch (e) {
            alert(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
          } finally {
            setBusy(false);
          }
        }}
      >
        แก้ไข
      </button>
      <button
        type="button"
        disabled={busy}
        className="text-xs text-rose-600 hover:underline disabled:opacity-50"
        onClick={async () => {
          if (!window.confirm("ลบรายชื่อนี้?")) return;
          setBusy(true);
          try {
            await api.deleteResident(resident.id);
            onDone();
          } catch (e) {
            alert(e instanceof Error ? e.message : "ลบไม่สำเร็จ");
          } finally {
            setBusy(false);
          }
        }}
      >
        ลบ
      </button>
    </span>
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
  const [houseNo, setHouseNo] = useState(house?.house_no ?? "");
  const [plot, setPlot] = useState(house?.plot_label ?? "");
  const [ownerName, setOwnerName] = useState(house?.owner_name ?? "");
  const [phone, setPhone] = useState(house?.phone ?? "");
  const [override, setOverride] = useState(house?.monthly_fee_override != null ? String(house.monthly_fee_override) : "");
  const [feeCycle, setFeeCycle] = useState<VillageHouseFeeCycle>(house?.fee_cycle ?? "MONTHLY");
  const [busy, setBusy] = useState(false);

  return (
    <FormModal
      open
      title={mode === "add" ? "เพิ่มบ้าน" : "แก้ไขบ้าน"}
      onClose={onClose}
      size="md"
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
      </div>
    </FormModal>
  );
}

function ResidentFormModal({
  api,
  houseId,
  onClose,
  onSaved,
}: {
  api: ReturnType<typeof createVillageSessionApiRepository>;
  houseId: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [primary, setPrimary] = useState(false);
  const [busy, setBusy] = useState(false);

  return (
    <FormModal
      open
      title="เพิ่มลูกบ้านในบ้านนี้"
      onClose={onClose}
      size="md"
      footer={
        <FormModalFooterActions
          onCancel={onClose}
          submitLabel="บันทึก"
          submitDisabled={busy || !name.trim()}
          loading={busy}
          onSubmit={async () => {
            setBusy(true);
            try {
              await api.postResident(houseId, { name: name.trim(), phone: phone.trim() || null, is_primary: primary });
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
          <span className="text-xs font-medium text-slate-600">ชื่อ-สกุล</span>
          <input className={`mt-1.5 ${villageField}`} value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-600">เบอร์</span>
          <input className={`mt-1.5 ${villageField}`} value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={primary} onChange={(e) => setPrimary(e.target.checked)} />
          <span>เป็นผู้ติดต่อหลัก</span>
        </label>
      </div>
    </FormModal>
  );
}
