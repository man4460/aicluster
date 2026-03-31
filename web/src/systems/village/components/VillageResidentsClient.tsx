"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-container";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import {
  createVillageSessionApiRepository,
  type VillageHouse,
  type VillageResident,
} from "@/systems/village/village-service";

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
    <div className="space-y-6">
      <PageHeader title="จัดการลูกบ้าน" description="แปลง/บ้าน และสมาชิกในบ้าน — ค้นหาและส่งออกรายชื่อเป็น CSV" />
      <div className="flex flex-wrap items-end gap-3">
        <label className="min-w-[200px] flex-1 text-sm">
          <span className="text-slate-600">ค้นหา</span>
          <input
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="เลขบ้าน ชื่อ เบอร์…"
          />
        </label>
        <a
          href={api.exportUrl("residents")}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
        >
          ดาวน์โหลด CSV ลูกบ้าน
        </a>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-lg bg-[#0000BF] px-4 py-2 text-sm font-medium text-white hover:opacity-95"
          onClick={() => setHouseModal({ mode: "add" })}
        >
          เพิ่มบ้าน / แปลง
        </button>
        <button type="button" className="rounded-lg border border-slate-200 px-4 py-2 text-sm" onClick={() => void load()}>
          รีเฟรช
        </button>
        <Link href="/dashboard/village/reports" className="rounded-lg border border-slate-200 px-4 py-2 text-sm leading-[1.25]">
          รายงาน &amp; Excel
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
          <li key={h.id} className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-slate-900">
                  บ้านเลขที่ {h.house_no}
                  {h.plot_label ? <span className="text-slate-500"> ({h.plot_label})</span> : null}
                </p>
                <p className="text-sm text-slate-600">
                  {h.owner_name || "—"} {h.phone ? `· ${h.phone}` : ""}
                </p>
                <p className="text-xs text-slate-500">
                  ค่าส่วนกลาง:{" "}
                  {h.monthly_fee_override != null ? `${h.monthly_fee_override} บาท (กำหนดเฉพาะหลังนี้)` : "ใช้ค่ามาตรฐานจากตั้งค่า"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium"
                  onClick={() => setHouseModal({ mode: "edit", house: h })}
                >
                  แก้ไขบ้าน
                </button>
                <button
                  type="button"
                  className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium"
                  onClick={() => setResidentModal({ houseId: h.id })}
                >
                  เพิ่มลูกบ้าน
                </button>
              </div>
            </div>
            <ul className="mt-3 space-y-1 border-t border-slate-100 pt-3">
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
          submitDisabled={busy || !houseNo.trim()}
          loading={busy}
          onSubmit={async () => {
            setBusy(true);
            try {
              const ov = override.trim() === "" ? null : Number.parseInt(override, 10);
              const body = {
                house_no: houseNo.trim(),
                plot_label: plot.trim() || null,
                owner_name: ownerName.trim() || null,
                phone: phone.trim() || null,
                monthly_fee_override: ov != null && Number.isFinite(ov) ? ov : null,
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
      <div className="space-y-3 text-sm">
        <label className="block">
          <span className="text-slate-600">เลขที่บ้าน</span>
          <input
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            value={houseNo}
            onChange={(e) => setHouseNo(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-slate-600">แปลง / หมายเหตุที่อยู่</span>
          <input
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            value={plot}
            onChange={(e) => setPlot(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-slate-600">ชื่อเจ้าบ้าน (แสดงผล)</span>
          <input
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-slate-600">เบอร์โทร</span>
          <input
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-slate-600">ค่าส่วนกลางเฉพาะหลัง (บาท) — เว้นว่าง = ใช้มาตรฐาน</span>
          <input
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
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
      <div className="space-y-3 text-sm">
        <label className="block">
          <span className="text-slate-600">ชื่อ-สกุล</span>
          <input
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-slate-600">เบอร์</span>
          <input
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={primary} onChange={(e) => setPrimary(e.target.checked)} />
          <span>เป็นผู้ติดต่อหลัก</span>
        </label>
      </div>
    </FormModal>
  );
}
