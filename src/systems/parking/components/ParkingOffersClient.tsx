"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AppEmptyState,
  useAppNoticePopup,
} from "@/components/app-templates";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import {
  IconRowEdit,
  IconRowRemove,
  assetRowEditIconButtonClass,
  assetRowRemoveIconButtonClass,
} from "@/systems/asset/components/AssetRowActionIcons";
import { ParkingPageStack, ParkingPanelCard } from "@/systems/parking/components/ParkingPageChrome";
import {
  parkingPricingModeLabel,
  type ParkingPricingMode,
} from "@/systems/parking/parking-module-nav";
import { parkingBtnPrimary, parkingField } from "@/systems/parking/parking-ui";
import {
  parkingPrimaryTabPillClass,
  parkingPrimaryTabShellClass,
  parkingValetInnerCardClass,
} from "@/systems/parking/parking-ui-tokens";

type Pkg = {
  id: number;
  name: string;
  price: number;
  stay_mode: ParkingPricingMode;
  stay_units: number;
  total_uses: number;
  description: string;
  is_active: boolean;
};

type Membership = {
  id: number;
  customer_name: string;
  customer_phone: string;
  license_plate: string;
  package_id: number;
  package_name: string;
  paid_amount: number;
  total_uses: number;
  used_uses: number;
  is_active: boolean;
};

type OffersTab = "packages" | "memberships";

export function ParkingOffersClient() {
  const notice = useAppNoticePopup();
  const [tab, setTab] = useState<OffersTab>("packages");
  const [packages, setPackages] = useState<Pkg[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [pkgModal, setPkgModal] = useState(false);
  const [mbrModal, setMbrModal] = useState(false);
  const [editingPkg, setEditingPkg] = useState<Pkg | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [pkgForm, setPkgForm] = useState({
    name: "",
    price: "0",
    stay_mode: "DAILY" as ParkingPricingMode,
    stay_units: "1",
    total_uses: "1",
    description: "",
    is_active: true,
  });
  const [mbrForm, setMbrForm] = useState({
    customer_name: "",
    customer_phone: "",
    license_plate: "",
    package_id: "",
    paid_amount: "0",
    total_uses: "10",
    is_active: true,
  });

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, mRes] = await Promise.all([
        fetch("/api/parking/packages"),
        fetch("/api/parking/memberships"),
      ]);
      const pData = (await pRes.json()) as { packages?: Pkg[] };
      const mData = (await mRes.json()) as { memberships?: Membership[] };
      setPackages(pData.packages ?? []);
      setMemberships(mData.memberships ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const multiUsePackages = useMemo(
    () => packages.filter((p) => p.is_active && p.total_uses > 1),
    [packages],
  );

  function openCreatePkg() {
    setEditingPkg(null);
    setPkgForm({
      name: "",
      price: "0",
      stay_mode: "DAILY",
      stay_units: "1",
      total_uses: "1",
      description: "",
      is_active: true,
    });
    setErr(null);
    setPkgModal(true);
  }

  function openEditPkg(p: Pkg) {
    setEditingPkg(p);
    setPkgForm({
      name: p.name,
      price: String(p.price),
      stay_mode: p.stay_mode,
      stay_units: String(p.stay_units),
      total_uses: String(p.total_uses),
      description: p.description,
      is_active: p.is_active,
    });
    setErr(null);
    setPkgModal(true);
  }

  async function savePkg() {
    setBusy(true);
    setErr(null);
    try {
      const body = {
        name: pkgForm.name.trim(),
        price: Number(pkgForm.price) || 0,
        stay_mode: pkgForm.stay_mode,
        stay_units: Number(pkgForm.stay_units) || 1,
        total_uses: Number(pkgForm.total_uses) || 1,
        description: pkgForm.description,
        is_active: pkgForm.is_active,
      };
      const res = await fetch(
        editingPkg ? `/api/parking/packages/${editingPkg.id}` : "/api/parking/packages",
        {
          method: editingPkg ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setErr(data.error ?? "บันทึกไม่สำเร็จ");
        return;
      }
      setPkgModal(false);
      await reload();
    } finally {
      setBusy(false);
    }
  }

  async function deletePkg(p: Pkg) {
    const ok = await notice.confirm(`ลบแพ็กเกจ「${p.name}」?`, { title: "ลบแพ็กเกจ", confirmLabel: "ลบ", tone: "error" });
    if (!ok) return;
    await fetch(`/api/parking/packages/${p.id}`, { method: "DELETE" });
    await reload();
  }

  function openCreateMbr() {
    const first = multiUsePackages[0];
    setMbrForm({
      customer_name: "",
      customer_phone: "",
      license_plate: "",
      package_id: first ? String(first.id) : "",
      paid_amount: first ? String(first.price) : "0",
      total_uses: first ? String(first.total_uses) : "10",
      is_active: true,
    });
    setErr(null);
    setMbrModal(true);
  }

  async function saveMbr() {
    setBusy(true);
    setErr(null);
    try {
      const pkgId = Number(mbrForm.package_id);
      const pkg = packages.find((p) => p.id === pkgId);
      if (!pkg) {
        setErr("เลือกแพ็กเกจ");
        return;
      }
      const res = await fetch("/api/parking/memberships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: mbrForm.customer_name.trim(),
          customer_phone: mbrForm.customer_phone.trim(),
          license_plate: mbrForm.license_plate.trim(),
          package_id: pkgId,
          package_name: pkg.name,
          paid_amount: Number(mbrForm.paid_amount) || 0,
          total_uses: Number(mbrForm.total_uses) || pkg.total_uses,
          is_active: mbrForm.is_active,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setErr(data.error ?? "บันทึกไม่สำเร็จ");
        return;
      }
      setMbrModal(false);
      await reload();
    } finally {
      setBusy(false);
    }
  }

  async function deleteMbr(m: Membership) {
    const ok = await notice.confirm(`ลบสมาชิก「${m.customer_name}」?`, {
      title: "ลบสมาชิก",
      confirmLabel: "ลบ",
      tone: "error",
    });
    if (!ok) return;
    await fetch(`/api/parking/memberships/${m.id}`, { method: "DELETE" });
    await reload();
  }

  return (
    <ParkingPageStack>
      <ParkingPanelCard
        title="แพ็กเกจ / สมาชิก"
        description="แพ็กเกจบริการ · สมาชิกเหมาจ่าย (ตัดสิทธิ์ตอนเช็คอิน)"
        headerClassName="flex flex-row items-start justify-between gap-3 sm:items-center"
        action={
          <button
            type="button"
            onClick={() => (tab === "packages" ? openCreatePkg() : openCreateMbr())}
            aria-label={tab === "packages" ? "เพิ่มแพ็กเกจ" : "เพิ่มสมาชิก"}
            className={cn(
              parkingBtnPrimary,
              "inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl px-2.5 sm:min-w-0 sm:px-4",
            )}
          >
            <span className="sm:hidden text-lg leading-none">+</span>
            <span className="hidden sm:inline">{tab === "packages" ? "+ เพิ่มแพ็กเกจ" : "+ เพิ่มสมาชิก"}</span>
          </button>
        }
      >
        <nav className={parkingPrimaryTabShellClass} role="tablist" aria-label="แพ็กเกจหรือสมาชิก">
          {(
            [
              { key: "packages" as const, label: "แพ็กเกจ" },
              { key: "memberships" as const, label: "สมาชิก" },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              className={parkingPrimaryTabPillClass(tab === t.key)}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="mt-4" role="tabpanel">
          {loading ? (
            <p className="text-sm text-[#66638c]">กำลังโหลด…</p>
          ) : tab === "packages" ? (
            packages.length === 0 ? (
              <AppEmptyState tone="glass">ยังไม่มีแพ็กเกจ</AppEmptyState>
            ) : (
              <ul className="space-y-3">
                {packages.map((p) => (
                  <li key={p.id} className={cn(parkingValetInnerCardClass, "flex items-start justify-between gap-3")}>
                    <div className="min-w-0">
                      <p className="font-black text-[#1e1b4b]">{p.name}</p>
                      <p className="mt-0.5 text-xs font-semibold text-[#66638c]">
                        ฿{p.price.toLocaleString("th-TH")} · {parkingPricingModeLabel(p.stay_mode)} ×{p.stay_units} ·{" "}
                        {p.total_uses > 1 ? `${p.total_uses} ครั้ง` : "รายครั้ง"}
                        {!p.is_active ? " · ปิด" : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button type="button" className={assetRowEditIconButtonClass} aria-label={`แก้ไข ${p.name}`} onClick={() => openEditPkg(p)}>
                        <IconRowEdit className="h-4 w-4" />
                      </button>
                      <button type="button" className={assetRowRemoveIconButtonClass} aria-label={`ลบ ${p.name}`} onClick={() => void deletePkg(p)}>
                        <IconRowRemove className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )
          ) : memberships.length === 0 ? (
            <AppEmptyState tone="glass">ยังไม่มีสมาชิก — สร้างแพ็กเกจที่มีมากกว่า 1 ครั้งก่อน</AppEmptyState>
          ) : (
            <ul className="space-y-3">
              {memberships.map((m) => (
                <li key={m.id} className={cn(parkingValetInnerCardClass, "flex items-start justify-between gap-3")}>
                  <div className="min-w-0">
                    <p className="font-black text-[#1e1b4b]">{m.customer_name}</p>
                    <p className="mt-0.5 text-xs font-semibold tabular-nums text-[#66638c]">
                      {m.license_plate} · {m.customer_phone}
                    </p>
                    <p className="mt-1 text-xs font-bold text-[#4d47b6]">
                      {m.package_name} · เหลือ {Math.max(0, m.total_uses - m.used_uses)}/{m.total_uses}
                    </p>
                  </div>
                  <button type="button" className={assetRowRemoveIconButtonClass} aria-label={`ลบ ${m.customer_name}`} onClick={() => void deleteMbr(m)}>
                    <IconRowRemove className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </ParkingPanelCard>

      <FormModal
        open={pkgModal}
        onClose={() => setPkgModal(false)}
        title={editingPkg ? "แก้ไขแพ็กเกจ" : "เพิ่มแพ็กเกจ"}
        size="md"
        mobileCentered
        footer={
          <FormModalFooterActions
            onCancel={() => setPkgModal(false)}
            onSubmit={() => void savePkg()}
            submitLabel="บันทึก"
            submitDisabled={!pkgForm.name.trim() || busy}
            loading={busy}
          />
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-[#5f5a8a]">ชื่อแพ็กเกจ</label>
            <input className={`${parkingField} mt-1`} value={pkgForm.name} onChange={(e) => setPkgForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-[#5f5a8a]">ราคา (บาท)</label>
              <input type="number" min={0} className={`${parkingField} mt-1`} value={pkgForm.price} onChange={(e) => setPkgForm((f) => ({ ...f, price: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#5f5a8a]">จำนวนครั้ง</label>
              <input type="number" min={1} className={`${parkingField} mt-1`} value={pkgForm.total_uses} onChange={(e) => setPkgForm((f) => ({ ...f, total_uses: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-[#5f5a8a]">โหมดสิทธิ์</label>
              <select className={`${parkingField} mt-1`} value={pkgForm.stay_mode} onChange={(e) => setPkgForm((f) => ({ ...f, stay_mode: e.target.value as ParkingPricingMode }))}>
                <option value="HOURLY">ชั่วโมง</option>
                <option value="DAILY">วัน</option>
                <option value="MONTHLY">เดือน</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#5f5a8a]">หน่วยต่อครั้ง</label>
              <input type="number" min={1} className={`${parkingField} mt-1`} value={pkgForm.stay_units} onChange={(e) => setPkgForm((f) => ({ ...f, stay_units: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#5f5a8a]">รายละเอียด</label>
            <textarea className={`${parkingField} mt-1 min-h-[64px]`} value={pkgForm.description} onChange={(e) => setPkgForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold text-[#2e2a58]">
            <input type="checkbox" checked={pkgForm.is_active} onChange={(e) => setPkgForm((f) => ({ ...f, is_active: e.target.checked }))} />
            เปิดใช้งาน
          </label>
          {err ? <p className="text-sm text-rose-700">{err}</p> : null}
        </div>
      </FormModal>

      <FormModal
        open={mbrModal}
        onClose={() => setMbrModal(false)}
        title="เพิ่มสมาชิก / เหมาจ่าย"
        size="md"
        mobileCentered
        footer={
          <FormModalFooterActions
            onCancel={() => setMbrModal(false)}
            onSubmit={() => void saveMbr()}
            submitLabel="บันทึก"
            submitDisabled={!mbrForm.customer_name.trim() || !mbrForm.license_plate.trim() || !mbrForm.package_id || busy}
            loading={busy}
          />
        }
      >
        <div className="space-y-3">
          {multiUsePackages.length === 0 ? (
            <p className="text-sm text-amber-800">ต้องมีแพ็กเกจที่จำนวนครั้ง &gt; 1 ก่อน</p>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-[#5f5a8a]">แพ็กเกจ</label>
                <select
                  className={`${parkingField} mt-1`}
                  value={mbrForm.package_id}
                  onChange={(e) => {
                    const id = e.target.value;
                    const pkg = packages.find((p) => String(p.id) === id);
                    setMbrForm((f) => ({
                      ...f,
                      package_id: id,
                      paid_amount: pkg ? String(pkg.price) : f.paid_amount,
                      total_uses: pkg ? String(pkg.total_uses) : f.total_uses,
                    }));
                  }}
                >
                  {multiUsePackages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.total_uses} ครั้ง)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5f5a8a]">ชื่อลูกค้า</label>
                <input className={`${parkingField} mt-1`} value={mbrForm.customer_name} onChange={(e) => setMbrForm((f) => ({ ...f, customer_name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-[#5f5a8a]">เบอร์โทร</label>
                  <input className={`${parkingField} mt-1`} value={mbrForm.customer_phone} onChange={(e) => setMbrForm((f) => ({ ...f, customer_phone: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5f5a8a]">ทะเบียน</label>
                  <input className={`${parkingField} mt-1`} value={mbrForm.license_plate} onChange={(e) => setMbrForm((f) => ({ ...f, license_plate: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-[#5f5a8a]">ยอดชำระ</label>
                  <input type="number" min={0} className={`${parkingField} mt-1`} value={mbrForm.paid_amount} onChange={(e) => setMbrForm((f) => ({ ...f, paid_amount: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5f5a8a]">จำนวนสิทธิ์</label>
                  <input type="number" min={1} className={`${parkingField} mt-1`} value={mbrForm.total_uses} onChange={(e) => setMbrForm((f) => ({ ...f, total_uses: e.target.value }))} />
                </div>
              </div>
            </>
          )}
          {err ? <p className="text-sm text-rose-700">{err}</p> : null}
        </div>
      </FormModal>

      {notice.popup}
    </ParkingPageStack>
  );
}
