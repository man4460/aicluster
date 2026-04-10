"use client";

import { useEffect, useMemo, useState } from "react";
import { VillagePageStack, VillagePanelCard } from "@/systems/village/components/VillagePageChrome";
import { createVillageSessionApiRepository, type VillageProfile } from "@/systems/village/village-service";
import { villageBtnPrimary, villageField } from "@/systems/village/village-ui";
import { cn } from "@/lib/cn";

function IconBuilding({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path d="M4 21V8l8-5 8 5v13M9 21v-8h6v8" strokeLinejoin="round" />
      <path d="M9 12h2M13 12h2M9 16h2M13 16h2" strokeLinecap="round" />
    </svg>
  );
}

function IconCoin({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8.5v7M9.2 12h5.6" strokeLinecap="round" />
    </svg>
  );
}

function IconWallet({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path d="M4 7a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V7z" strokeLinejoin="round" />
      <path d="M4 10h16v4H4M16 14h2" strokeLinecap="round" />
    </svg>
  );
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconSave({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path d="M5 3h11l3 3v14a1 1 0 01-1 1H5a1 1 0 01-1-1V4a1 1 0 011-1z" strokeLinejoin="round" />
      <path d="M9 3v6h6V3M9 21v-5h6v5" strokeLinejoin="round" />
    </svg>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="mb-1 block text-[11px] font-bold tracking-wide text-slate-500">{children}</span>;
}

type SettingsBlockProps = {
  icon: React.ReactNode;
  tone: string;
  title: string;
  hint: string;
  children: React.ReactNode;
};

function SettingsBlock({ icon, tone, title, hint, children }: SettingsBlockProps) {
  return (
    <div className="border-t border-slate-200/70 pt-4 first:border-t-0 first:pt-0">
      <div className="flex gap-2.5">
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-inner", tone)} aria-hidden>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold leading-tight text-slate-900">{title}</h2>
          <p className="mt-0.5 text-[10px] leading-snug text-slate-500">{hint}</p>
        </div>
      </div>
      <div className="mt-3 space-y-3">{children}</div>
    </div>
  );
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
    return (
      <VillagePageStack>
        {err ? <p className="text-sm text-rose-600">{err}</p> : null}
        {!err ? (
          <VillagePanelCard>
            <p className="text-center text-sm text-[#66638c]">กำลังโหลด…</p>
          </VillagePanelCard>
        ) : null}
      </VillagePageStack>
    );
  }

  return (
    <VillagePageStack>
      {saved ? (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200/90 bg-emerald-50/95 px-3 py-2.5 text-sm font-semibold text-emerald-900 shadow-sm ring-1 ring-emerald-100">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-200/60 text-emerald-800">
            <IconCheck className="h-4 w-4" />
          </span>
          บันทึกแล้ว
        </div>
      ) : null}

      <VillagePanelCard
        title="ตั้งค่าโครงการ"
        description="ข้อมูลนิติ ค่าส่วนกลางเริ่มต้น และช่องทางชำระเงิน — รอบเรียกเก็บต่อหลังตั้งที่หน้าลูกบ้าน"
      >
        <form
          className="w-full"
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
          <SettingsBlock
            icon={<IconBuilding className="h-5 w-5 text-[#3730a3]" />}
            tone="bg-[#4d47b6]/12"
            title="ข้อมูลโครงการ"
            hint="ชื่อ ที่อยู่ และเบอร์ติดต่อนิติ"
          >
            <label className="block">
              <FieldLabel>ชื่อโครงการ</FieldLabel>
              <input id="display_name" name="display_name" defaultValue={p.display_name ?? ""} className={villageField} />
            </label>
            <label className="block">
              <FieldLabel>ที่อยู่</FieldLabel>
              <textarea
                id="address"
                name="address"
                defaultValue={p.address ?? ""}
                rows={3}
                className={cn(villageField, "min-h-[5rem] resize-y")}
              />
            </label>
            <label className="block">
              <FieldLabel>เบอร์นิติ</FieldLabel>
              <input
                id="contact_phone"
                name="contact_phone"
                defaultValue={p.contact_phone ?? ""}
                className={villageField}
                inputMode="tel"
              />
            </label>
          </SettingsBlock>

          <SettingsBlock
            icon={<IconCoin className="h-5 w-5 text-emerald-700" />}
            tone="bg-emerald-100/90"
            title="ค่าส่วนกลาง"
            hint="อัตราต่อเดือนเริ่มต้นและวันครบกำหนด"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block">
                <FieldLabel>บาท / เดือน</FieldLabel>
                <input
                  id="default_monthly_fee"
                  name="default_monthly_fee"
                  type="number"
                  min={0}
                  defaultValue={p.default_monthly_fee}
                  className={villageField}
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
                  className={villageField}
                />
              </label>
            </div>
          </SettingsBlock>

          <SettingsBlock
            icon={<IconWallet className="h-5 w-5 text-sky-700" />}
            tone="bg-sky-100/90"
            title="ชำระเงิน"
            hint="พร้อมเพย์และข้อความแนะนำช่องทาง"
          >
            <label className="block">
              <FieldLabel>พร้อมเพย์ (ตัวเลข)</FieldLabel>
              <input
                id="prompt_pay_phone"
                name="prompt_pay_phone"
                defaultValue={p.prompt_pay_phone ?? ""}
                className={villageField}
                inputMode="numeric"
              />
            </label>
            <label className="block">
              <FieldLabel>ช่องทางอื่น</FieldLabel>
              <textarea
                id="payment_channels_note"
                name="payment_channels_note"
                defaultValue={p.payment_channels_note ?? ""}
                rows={2}
                className={cn(villageField, "min-h-[4rem] resize-y")}
              />
            </label>
          </SettingsBlock>

          {err ? <p className="mt-3 text-sm text-rose-600">{err}</p> : null}

          <div className="mt-5 border-t border-slate-200/70 pt-4">
            <button
              type="submit"
              className={cn(villageBtnPrimary, "flex w-full min-h-[48px] items-center justify-center gap-2 sm:w-auto sm:min-w-[11rem]")}
            >
              <IconSave className="h-4 w-4 text-white/90" />
              บันทึก
            </button>
          </div>
        </form>
      </VillagePanelCard>
    </VillagePageStack>
  );
}
