"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/page-container";
import { createVillageSessionApiRepository, type VillageProfile } from "@/systems/village/village-service";

export function VillageSettingsClient() {
  const api = useMemo(() => createVillageSessionApiRepository(), []);
  const [p, setP] = useState<VillageProfile | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const r = await api.getProfile();
        setP(r.profile);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "โหลดไม่สำเร็จ");
      }
    })();
  }, [api]);

  if (!p) {
    return err ? <p className="text-sm text-rose-600">{err}</p> : <p className="text-sm text-slate-500">กำลังโหลด…</p>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="การตั้งค่า" description="ชื่อโครงการ ค่าส่วนกลางมาตรฐาน วันครบกำหนด และช่องทางชำระ" />
      {saved ? <p className="text-sm text-emerald-700">บันทึกแล้ว</p> : null}
      <form
        className="max-w-xl space-y-8 text-sm"
        onSubmit={async (e) => {
          e.preventDefault();
          setErr(null);
          setSaved(false);
          const fd = new FormData(e.currentTarget);
          try {
            const r = await api.putProfile({
              display_name: (fd.get("display_name") as string) || null,
              address: (fd.get("address") as string) || null,
              contact_phone: (fd.get("contact_phone") as string) || null,
              prompt_pay_phone: (fd.get("prompt_pay_phone") as string) || null,
              payment_channels_note: (fd.get("payment_channels_note") as string) || null,
              default_monthly_fee: Number.parseInt(String(fd.get("default_monthly_fee")), 10) || 0,
              due_day_of_month: Number.parseInt(String(fd.get("due_day_of_month")), 10) || 5,
            });
            setP(r.profile);
            setSaved(true);
          } catch (er) {
            setErr(er instanceof Error ? er.message : "บันทึกไม่สำเร็จ");
          }
        }}
      >
        <fieldset className="space-y-4 rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">ข้อมูลโครงการ</legend>
          <label className="block">
            <span className="text-slate-600">ชื่อโครงการ / หมู่บ้าน</span>
            <input name="display_name" defaultValue={p.display_name ?? ""} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" />
          </label>
          <label className="block">
            <span className="text-slate-600">ที่อยู่ / หมายเหตุ</span>
            <textarea name="address" defaultValue={p.address ?? ""} rows={3} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" />
          </label>
          <label className="block">
            <span className="text-slate-600">เบอร์ติดต่อนิติ</span>
            <input name="contact_phone" defaultValue={p.contact_phone ?? ""} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" />
          </label>
        </fieldset>

        <fieldset className="space-y-4 rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">ค่าส่วนกลาง</legend>
          <label className="block">
            <span className="text-slate-600">ค่าส่วนกลางมาตรฐาน (บาท/เดือน)</span>
            <input
              name="default_monthly_fee"
              type="number"
              defaultValue={p.default_monthly_fee}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="text-slate-600">วันครบกำหนดชำระ (1–28)</span>
            <input
              name="due_day_of_month"
              type="number"
              min={1}
              max={28}
              defaultValue={p.due_day_of_month}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
        </fieldset>

        <fieldset className="space-y-4 rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">ช่องทางชำระเงิน</legend>
          <label className="block">
            <span className="text-slate-600">เบอร์พร้อมเพย์ (ตัวเลข)</span>
            <input name="prompt_pay_phone" defaultValue={p.prompt_pay_phone ?? ""} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" />
          </label>
          <label className="block">
            <span className="text-slate-600">ช่องทางชำระ (ข้อความ)</span>
            <textarea
              name="payment_channels_note"
              defaultValue={p.payment_channels_note ?? ""}
              rows={2}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
        </fieldset>

        {err ? <p className="text-sm text-rose-600">{err}</p> : null}
        <button type="submit" className="rounded-lg bg-[#0000BF] px-4 py-2 font-medium text-white">
          บันทึกการตั้งค่า
        </button>
      </form>
    </div>
  );
}
