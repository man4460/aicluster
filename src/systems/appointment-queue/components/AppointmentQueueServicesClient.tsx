"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AppDashboardSection,
  AppSectionHeader,
  appDashboardSectionVioletClass,
} from "@/components/app-templates";
import { FormModal } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import {
  assetRowEditIconButtonClass,
  assetRowRemoveIconButtonClass,
  IconRowEdit,
  IconRowRemove,
} from "@/systems/asset/components/AssetRowActionIcons";
import type { AppointmentQueueServiceRow } from "@/systems/appointment-queue/lib/load-services";
import { aqFieldClass, aqListRowCardClass } from "@/systems/appointment-queue/appointment-queue-ui-tokens";

type Service = AppointmentQueueServiceRow;

function normalizeServices(value: unknown): Service[] {
  return Array.isArray(value) ? value : [];
}

type Props = {
  embedded?: boolean;
  initial?: Service[];
};

export function AppointmentQueueServicesClient({ embedded = false, initial }: Props) {
  const [rows, setRows] = useState<Service[]>(() => normalizeServices(initial));
  const [loading, setLoading] = useState(() => embedded && normalizeServices(initial).length === 0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [name, setName] = useState("");
  const [duration, setDuration] = useState(60);
  const [price, setPrice] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const res = await fetch("/api/appointment-queue/services", { credentials: "include" });
      const json = (await res.json().catch(() => ({}))) as { services?: Service[]; error?: string };
      if (!res.ok) {
        setErr(json.error ?? "โหลดไม่สำเร็จ");
        setRows([]);
        return;
      }
      setRows(normalizeServices(json.services));
    } catch {
      setErr("โหลดไม่สำเร็จ");
      setRows([]);
    }
  }, []);

  useEffect(() => {
    setRows(normalizeServices(initial));
  }, [initial]);

  useEffect(() => {
    if (!embedded) return;
    if (normalizeServices(initial).length > 0) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      await load();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [embedded, initial, load]);

  const list = normalizeServices(rows);

  const openAdd = () => {
    setEditing(null);
    setName("");
    setDuration(60);
    setPrice("");
    setErr(null);
    setModalOpen(true);
  };

  const openEdit = (s: Service) => {
    setEditing(s);
    setName(s.name);
    setDuration(s.durationMinutes);
    setPrice(s.priceBaht != null ? String(s.priceBaht) : "");
    setErr(null);
    setModalOpen(true);
  };

  const save = async () => {
    if (!name.trim()) return;
    setBusy(true);
    setErr(null);
    const priceBaht = price.trim() === "" ? null : Number(price);
    try {
      if (editing) {
        const res = await fetch(`/api/appointment-queue/services/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            durationMinutes: duration,
            priceBaht: Number.isFinite(priceBaht) ? priceBaht : null,
            isActive: true,
          }),
        });
        const json = (await res.json().catch(() => ({}))) as { service?: Service; error?: string };
        if (!res.ok) throw new Error(json.error ?? "บันทึกไม่สำเร็จ");
        if (json.service) {
          setRows((r) =>
            normalizeServices(r).map((x) => (x.id === editing.id ? { ...x, ...json.service! } : x)),
          );
        } else {
          await load();
        }
      } else {
        const res = await fetch("/api/appointment-queue/services", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            durationMinutes: duration,
            priceBaht: Number.isFinite(priceBaht) ? priceBaht : null,
          }),
        });
        const json = (await res.json().catch(() => ({}))) as {
          service?: { id: number; name: string };
          error?: string;
        };
        if (!res.ok) throw new Error(json.error ?? "เพิ่มไม่สำเร็จ");
        if (json.service) {
          setRows((r) => [
            ...normalizeServices(r),
            {
              id: json.service!.id,
              name: json.service!.name,
              durationMinutes: duration,
              priceBaht: Number.isFinite(priceBaht) ? priceBaht : null,
              isActive: true,
            },
          ]);
        }
        await load();
      }
      setModalOpen(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (s: Service) => {
    if (!confirm(`ลบบริการ «${s.name}»?`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/appointment-queue/services/${s.id}`, { method: "DELETE" });
      const json = (await res.json().catch(() => ({}))) as { error?: string; softDeleted?: boolean };
      if (!res.ok) throw new Error(json.error ?? "ลบไม่สำเร็จ");
      if (json.softDeleted) {
        setRows((r) =>
          normalizeServices(r).map((x) => (x.id === s.id ? { ...x, isActive: false } : x)),
        );
      } else {
        setRows((r) => normalizeServices(r).filter((x) => x.id !== s.id));
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "ลบไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  const listBody = (
    <>
      {err && !modalOpen ? <p className="text-sm font-medium text-rose-600">{err}</p> : null}
      {loading ? (
        <p className="text-sm text-[#66638c]">กำลังโหลด…</p>
      ) : list.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-white/60 bg-white/30 px-4 py-8 text-center text-sm text-[#66638c]">
          ยังไม่มีบริการ — เพิ่มเช่น จองสนาม A, จองสนาม B หรือชื่อบริการของร้านคุณ
        </p>
      ) : (
        <ul className="space-y-2">
          {list.map((s) => (
            <li key={s.id} className={cn(aqListRowCardClass, !s.isActive && "opacity-60")}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 text-left">
                  <p className="font-bold text-[#1e1b4b]">{s.name}</p>
                  <p className="text-sm text-[#66638c]">
                    {s.durationMinutes} นาที
                    {s.priceBaht != null ? ` · ฿${s.priceBaht}` : ""}
                    {!s.isActive ? " · ปิดใช้งาน" : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    className={assetRowEditIconButtonClass}
                    aria-label={`แก้ไข ${s.name}`}
                    title="แก้ไข"
                    disabled={busy}
                    onClick={() => openEdit(s)}
                  >
                    <IconRowEdit className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className={assetRowRemoveIconButtonClass}
                    aria-label={`ลบ ${s.name}`}
                    title="ลบ"
                    disabled={busy}
                    onClick={() => void remove(s)}
                  >
                    <IconRowRemove className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );

  const section = (
    <>
      <AppSectionHeader
        title="บริการ"
        description="กำหนดรายการที่ลูกค้าเลือกตอนจอง — เช่น สนาม A/B หรือบริการของร้าน"
        className="flex flex-row items-start justify-between gap-3 sm:items-center"
        actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
        action={
          <button
            type="button"
            disabled={busy}
            onClick={openAdd}
            className="app-btn-primary min-h-[40px] min-w-[40px] rounded-xl sm:min-w-0 sm:px-4"
            aria-label="เพิ่มบริการ"
          >
            <span className="text-lg sm:hidden" aria-hidden>
              +
            </span>
            <span className="hidden sm:inline">+ เพิ่มบริการ</span>
          </button>
        }
      />
      {listBody}
      <FormModal
        open={modalOpen}
        size="md"
        appearance="glass"
        glassTint="violet"
        onClose={() => setModalOpen(false)}
        title={editing ? "แก้ไขบริการ" : "เพิ่มบริการ"}
      >
        <div className="space-y-3 text-left">
          <label className="block text-sm font-semibold text-[#4d47b6]">
            ชื่อบริการ
            <input
              className={cn(aqFieldClass, "mt-1")}
              placeholder="เช่น จองสนาม A"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="block text-sm font-semibold text-[#4d47b6]">
            ระยะเวลา (นาที)
            <input
              type="number"
              min={15}
              max={480}
              step={15}
              className={cn(aqFieldClass, "mt-1")}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value) || 60)}
            />
          </label>
          <label className="block text-sm font-semibold text-[#4d47b6]">
            ราคา (ไม่บังคับ)
            <input
              type="number"
              min={0}
              className={cn(aqFieldClass, "mt-1")}
              placeholder="เว้นว่างได้"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </label>
          {err ? <p className="text-sm text-rose-600">{err}</p> : null}
          <button
            type="button"
            disabled={busy || !name.trim()}
            onClick={() => void save()}
            className="app-btn-primary min-h-[44px] w-full rounded-xl font-bold"
          >
            {busy ? "กำลังบันทึก…" : editing ? "บันทึก" : "เพิ่มบริการ"}
          </button>
        </div>
      </FormModal>
    </>
  );

  if (embedded) {
    return <div className="space-y-4">{section}</div>;
  }

  return (
    <AppDashboardSection className={appDashboardSectionVioletClass}>
      {section}
    </AppDashboardSection>
  );
}
