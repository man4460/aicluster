"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { VillagePageStack, VillagePanelCard } from "@/systems/village/components/VillagePageChrome";
import { VillageSettingsQuickTabs } from "@/systems/village/components/VillageSettingsQuickTabs";
import { createVillageSessionApiRepository, type VillageProfile } from "@/systems/village/village-service";
import { villageBtnPrimary, villageDivider, villageField } from "@/systems/village/village-ui";
import {
  villageMobileSelectClass,
  villagePrimaryTabPillClass,
  villagePrimaryTabShellClass,
} from "@/systems/village/village-ui-tokens";
import { cn } from "@/lib/cn";

type SettingsTab = "basic" | "fees" | "payment";

const VILLAGE_SETTINGS_TABS: { id: SettingsTab; label: string }[] = [
  { id: "basic", label: "ตั้งค่าพื้นฐาน" },
  { id: "fees", label: "ค่าส่วนกลาง" },
  { id: "payment", label: "ชำระเงิน" },
];

const SETTINGS_TAB_KEYS = new Set<string>(VILLAGE_SETTINGS_TABS.map((t) => t.id));

function parseSettingsTab(raw: string | null): SettingsTab {
  if (raw && SETTINGS_TAB_KEYS.has(raw)) return raw as SettingsTab;
  return "basic";
}

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
    <div>
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

function VillageSettingsForm({ profile }: { profile: VillageProfile }) {
  const api = useMemo(() => createVillageSessionApiRepository(), []);
  const router = useRouter();
  const pathname = usePathname() ?? "/dashboard/village/settings";
  const searchParams = useSearchParams();
  const [p, setP] = useState(profile);
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<SettingsTab>(() => parseSettingsTab(searchParams.get("tab")));

  useEffect(() => {
    setTab(parseSettingsTab(searchParams.get("tab")));
  }, [searchParams]);

  const selectTab = useCallback(
    (next: SettingsTab) => {
      setTab(next);
      const q = new URLSearchParams(searchParams.toString());
      if (next === "basic") q.delete("tab");
      else q.set("tab", next);
      const qs = q.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

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
        action={<VillageSettingsQuickTabs />}
      >
        <div className="mt-1 w-full sm:hidden">
          <label htmlFor="village-settings-menu-mobile" className="mb-1.5 block text-[11px] font-black text-[#4d47b6]">
            กรุณาเลือกหมวดตั้งค่า
          </label>
          <select
            id="village-settings-menu-mobile"
            value={tab}
            onChange={(e) => selectTab(e.target.value as SettingsTab)}
            className={villageMobileSelectClass}
            aria-label="กรุณาเลือกหมวดตั้งค่า"
          >
            {VILLAGE_SETTINGS_TABS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-1 hidden w-full sm:block">
          <nav className={villagePrimaryTabShellClass} aria-label="เมนูตั้งค่า">
            <div className="flex w-full min-w-0 flex-wrap gap-1" role="tablist">
              {VILLAGE_SETTINGS_TABS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === item.id}
                  id={`village-settings-tab-${item.id}`}
                  aria-controls={`village-settings-panel-${item.id}`}
                  onClick={() => selectTab(item.id)}
                  className={cn(villagePrimaryTabPillClass(tab === item.id), "grow-0 basis-auto")}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </nav>
        </div>

        <form
          className="mt-4 w-full"
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
                bank_name: (fd.get("bank_name") as string) || null,
                bank_account_number: (fd.get("bank_account_number") as string) || null,
                bank_account_name: (fd.get("bank_account_name") as string) || null,
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
          <div
            id="village-settings-panel-basic"
            role="tabpanel"
            aria-labelledby="village-settings-tab-basic"
            className={cn(tab === "basic" ? "block" : "hidden")}
          >
            <SettingsBlock
              icon={<IconBuilding className="h-5 w-5 text-[#3730a3]" />}
              tone="bg-[#4d47b6]/12"
              title="ข้อมูลโครงการ"
              hint="ชื่อ ที่อยู่ และเบอร์ติดต่อนิติ"
            >
              <label className="block">
                <FieldLabel>ชื่อโครงการ</FieldLabel>
                <input
                  id="display_name"
                  name="display_name"
                  key={`dn-${p.display_name ?? ""}`}
                  defaultValue={p.display_name ?? ""}
                  className={villageField}
                />
              </label>
              <label className="block">
                <FieldLabel>ที่อยู่</FieldLabel>
                <textarea
                  id="address"
                  name="address"
                  key={`ad-${p.address ?? ""}`}
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
                  key={`ph-${p.contact_phone ?? ""}`}
                  defaultValue={p.contact_phone ?? ""}
                  className={villageField}
                  inputMode="tel"
                />
              </label>
            </SettingsBlock>
          </div>

          <div
            id="village-settings-panel-fees"
            role="tabpanel"
            aria-labelledby="village-settings-tab-fees"
            className={cn(tab === "fees" ? "block" : "hidden")}
          >
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
                    key={`fee-${p.default_monthly_fee}`}
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
                    key={`due-${p.due_day_of_month}`}
                    defaultValue={p.due_day_of_month}
                    className={villageField}
                  />
                </label>
              </div>
            </SettingsBlock>
          </div>

          <div
            id="village-settings-panel-payment"
            role="tabpanel"
            aria-labelledby="village-settings-tab-payment"
            className={cn(tab === "payment" ? "block" : "hidden")}
          >
            <SettingsBlock
              icon={<IconWallet className="h-5 w-5 text-sky-700" />}
              tone="bg-sky-100/90"
              title="ชำระเงิน"
              hint="พร้อมเพย์ · บัญชีธนาคาร และข้อความแนะนำช่องทาง"
            >
              <label className="block">
                <FieldLabel>พร้อมเพย์ (ตัวเลข)</FieldLabel>
                <input
                  id="prompt_pay_phone"
                  name="prompt_pay_phone"
                  key={`pp-${p.prompt_pay_phone ?? ""}`}
                  defaultValue={p.prompt_pay_phone ?? ""}
                  className={villageField}
                  inputMode="numeric"
                />
              </label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <FieldLabel>ชื่อธนาคาร</FieldLabel>
                  <input
                    id="bank_name"
                    name="bank_name"
                    key={`bn-${p.bank_name ?? ""}`}
                    defaultValue={p.bank_name ?? ""}
                    className={villageField}
                    placeholder="เช่น กสิกรไทย · ไทยพาณิชย์"
                    autoComplete="organization"
                  />
                </label>
                <label className="block">
                  <FieldLabel>เลขบัญชี</FieldLabel>
                  <input
                    id="bank_account_number"
                    name="bank_account_number"
                    key={`ban-${p.bank_account_number ?? ""}`}
                    defaultValue={p.bank_account_number ?? ""}
                    className={villageField}
                    inputMode="numeric"
                    autoComplete="off"
                  />
                </label>
                <label className="block">
                  <FieldLabel>ชื่อบัญชี</FieldLabel>
                  <input
                    id="bank_account_name"
                    name="bank_account_name"
                    key={`baa-${p.bank_account_name ?? ""}`}
                    defaultValue={p.bank_account_name ?? ""}
                    className={villageField}
                    autoComplete="name"
                  />
                </label>
              </div>
              <label className="block">
                <FieldLabel>ช่องทางอื่น / หมายเหตุ</FieldLabel>
                <textarea
                  id="payment_channels_note"
                  name="payment_channels_note"
                  key={`note-${p.payment_channels_note ?? ""}`}
                  defaultValue={p.payment_channels_note ?? ""}
                  rows={2}
                  className={cn(villageField, "min-h-[4rem] resize-y")}
                  placeholder="เช่น โอนแล้วแจ้งไลน์ / สาขา"
                />
              </label>
            </SettingsBlock>
          </div>

          {err ? <p className="mt-3 text-sm text-rose-600">{err}</p> : null}

          <div className={cn("mt-5 border-t pt-4", villageDivider)}>
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

export function VillageSettingsClient() {
  const api = useMemo(() => createVillageSessionApiRepository(), []);
  const [p, setP] = useState<VillageProfile | null>(null);
  const [err, setErr] = useState<string | null>(null);

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
    <Suspense
      fallback={
        <VillagePageStack>
          <VillagePanelCard>
            <p className="text-center text-sm text-[#66638c]">กำลังโหลด…</p>
          </VillagePanelCard>
        </VillagePageStack>
      }
    >
      <VillageSettingsForm profile={p} />
    </Suspense>
  );
}
