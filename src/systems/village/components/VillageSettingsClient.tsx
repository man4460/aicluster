"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/page-container";
import { createVillageSessionApiRepository, type VillageProfile } from "@/systems/village/village-service";

function IconBuilding({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 21V8l8-5 8 5v13M9 21v-8h6v8" strokeLinejoin="round" />
      <path d="M9 12h2M13 12h2M9 16h2M13 16h2" strokeLinecap="round" />
    </svg>
  );
}

function IconCoin({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8.5v7M9.2 12h5.6" strokeLinecap="round" />
    </svg>
  );
}

function IconWallet({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 7a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V7z" strokeLinejoin="round" />
      <path d="M4 10h16v4H4M16 14h2" strokeLinecap="round" />
    </svg>
  );
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconSave({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M5 3h11l3 3v14a1 1 0 01-1 1H5a1 1 0 01-1-1V4a1 1 0 011-1z" strokeLinejoin="round" />
      <path d="M9 3v6h6V3M9 21v-5h6v5" strokeLinejoin="round" />
    </svg>
  );
}

const inputClass =
  "mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0000BF]/40 focus:bg-white focus:ring-2 focus:ring-[#0000BF]/15";

type SettingsSectionProps = {
  icon: React.ReactNode;
  tone: string;
  title: string;
  hint: string;
  children: React.ReactNode;
};

function SettingsSection({ icon, tone, title, hint, children }: SettingsSectionProps) {
  return (
    <section className="rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white via-white to-slate-50/90 p-5 shadow-sm">
      <div className="flex gap-3 border-b border-slate-100 pb-4">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${tone}`} aria-hidden>
          {icon}
        </div>
        <div className="min-w-0 pt-0.5">
          <h2 className="text-base font-semibold tracking-tight text-slate-900">{title}</h2>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{hint}</p>
        </div>
      </div>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-xs font-medium text-slate-600">{children}</span>;
}

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
    return err ? (
      <p className="text-sm text-rose-600">{err}</p>
    ) : (
      <p className="text-sm text-slate-500">กำลังโหลด…</p>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader title="ตั้งค่าโครงการ" description="ใช้เป็นค่าเริ่มต้นสำหรับบิลและสลิป — แก้แล้วกดบันทึก" />

      {saved ? (
        <p className="flex items-center gap-2 rounded-xl border border-emerald-200/80 bg-emerald-50/90 px-4 py-2.5 text-sm font-medium text-emerald-800">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
            <IconCheck />
          </span>
          บันทึกแล้ว
        </p>
      ) : null}

      <form
        className="w-full space-y-5"
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
        <SettingsSection
          icon={<IconBuilding className="text-[#0000BF]" />}
          tone="bg-[#0000BF]/10"
          title="ข้อมูลโครงการ"
          hint="ชื่อ ที่อยู่ และเบอร์ติดต่อนิติ"
        >
          <label className="block">
            <FieldLabel>ชื่อโครงการ</FieldLabel>
            <input id="display_name" name="display_name" defaultValue={p.display_name ?? ""} className={inputClass} />
          </label>
          <label className="block">
            <FieldLabel>ที่อยู่</FieldLabel>
            <textarea id="address" name="address" defaultValue={p.address ?? ""} rows={3} className={inputClass} />
          </label>
          <label className="block">
            <FieldLabel>เบอร์นิติ</FieldLabel>
            <input id="contact_phone" name="contact_phone" defaultValue={p.contact_phone ?? ""} className={inputClass} inputMode="tel" />
          </label>
        </SettingsSection>

        <SettingsSection
          icon={<IconCoin className="text-emerald-700" />}
          tone="bg-emerald-100/80"
          title="ค่าส่วนกลาง"
          hint="อัตราต่อเดือนเริ่มต้นและวันครบกำหนด — รอบเรียกเก็บ (รายเดือน/หกเดือน/ปี) กำหนดที่แต่ละหลังในหน้าลูกบ้าน"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <FieldLabel>บาท / เดือน</FieldLabel>
              <input
                id="default_monthly_fee"
                name="default_monthly_fee"
                type="number"
                min={0}
                defaultValue={p.default_monthly_fee}
                className={inputClass}
              />
            </label>
            <label className="block">
              <FieldLabel>ครบกำหนดวันที่ (1–28)</FieldLabel>
              <input
                id="due_day_of_month"
                name="due_day_of_month"
                type="number"
                min={1}
                max={28}
                defaultValue={p.due_day_of_month}
                className={inputClass}
              />
            </label>
          </div>
        </SettingsSection>

        <SettingsSection
          icon={<IconWallet className="text-sky-700" />}
          tone="bg-sky-100/80"
          title="ชำระเงิน"
          hint="พร้อมเพย์และข้อความแนะนำช่องทาง"
        >
          <label className="block">
            <FieldLabel>พร้อมเพย์ (ตัวเลข)</FieldLabel>
            <input id="prompt_pay_phone" name="prompt_pay_phone" defaultValue={p.prompt_pay_phone ?? ""} className={inputClass} inputMode="numeric" />
          </label>
          <label className="block">
            <FieldLabel>ช่องทางอื่น</FieldLabel>
            <textarea id="payment_channels_note" name="payment_channels_note" defaultValue={p.payment_channels_note ?? ""} rows={2} className={inputClass} />
          </label>
        </SettingsSection>

        {err ? <p className="text-sm text-rose-600">{err}</p> : null}

        <button
          type="submit"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0000BF] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0000a3] sm:w-auto sm:min-w-[200px]"
        >
          <IconSave className="text-white/90" />
          บันทึก
        </button>
      </form>
    </div>
  );
}
