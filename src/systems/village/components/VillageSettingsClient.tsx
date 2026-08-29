"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  AppShopLogoField,
  AppSlipPaperSizeSettingsField,
  appTemplateOutlineButtonClass,
  type AppSlipPaperSize,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { villagePublicPortalUrl } from "@/lib/village/public-url";
import { normalizeModuleSlipPaperSize } from "@/lib/profile/module-slip-paper-size";
import { VillageGuestPortalHubClient } from "@/systems/village/components/VillageGuestPortalHubClient";
import { VillagePageStack, VillagePanelCard } from "@/systems/village/components/VillagePageChrome";
import { VillagePortalMediaSettings } from "@/systems/village/components/VillagePortalMediaSettings";
import { VillageSettingsQuickTabs } from "@/systems/village/components/VillageSettingsQuickTabs";
import { createVillageSessionApiRepository, type VillageProfile } from "@/systems/village/village-service";
import { villageBtnPrimary, villageDivider, villageField } from "@/systems/village/village-ui";
import {
  villageMobileSelectClass,
  villagePrimaryTabPillClass,
  villagePrimaryTabShellClass,
} from "@/systems/village/village-ui-tokens";

type SettingsTab = "basic" | "fees" | "payment" | "portal" | "links";

const VILLAGE_SETTINGS_TABS: { id: SettingsTab; label: string }[] = [
  { id: "basic", label: "ตั้งค่าพื้นฐาน" },
  { id: "fees", label: "ค่าส่วนกลาง" },
  { id: "payment", label: "ชำระเงิน" },
  { id: "portal", label: "ตั้งค่าเว็ปลิงค์ลูกค้า" },
  { id: "links", label: "ลิงก์ / QR" },
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

function IconGlobe({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" strokeLinecap="round" />
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

function VillagePortalLinkPanel({
  ownerId,
  trialSessionId,
}: {
  ownerId: string;
  trialSessionId: string;
}) {
  const [copyMsg, setCopyMsg] = useState<string | null>(null);
  const portalPath = useMemo(
    () => villagePublicPortalUrl("", ownerId, trialSessionId),
    [ownerId, trialSessionId],
  );

  const absoluteUrl = (path: string) => {
    if (typeof window === "undefined") return path;
    return `${window.location.origin}${path.startsWith("/") ? path : `/${path}`}`;
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(absoluteUrl(portalPath));
      setCopyMsg("คัดลอกลิงก์เว็บโครงการแล้ว");
    } catch {
      setCopyMsg("คัดลอกลิงก์ไม่สำเร็จ");
    }
  };

  return (
    <div className="space-y-4 text-left">
      <p className="text-sm text-[#66638c]">
        ลิงก์สาธารณะให้ลูกบ้าน / ผู้สนใจดูบ้านในโครงการ · ติดต่อนิติ · QR โปสเตอร์ด้านล่าง
      </p>
      {copyMsg ? <p className="text-sm font-semibold text-emerald-700">{copyMsg}</p> : null}
      <div className="space-y-2 rounded-[1.25rem] border border-white/60 bg-white/55 p-3 sm:p-4">
        <p className="text-xs font-bold text-[#4d47b6]">เว็บโครงการ (ลูกค้า)</p>
        <p className="break-all text-sm font-semibold text-[#1e1b4b]">{portalPath}</p>
        <div className="flex flex-wrap gap-2">
          <a
            href={portalPath}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(appTemplateOutlineButtonClass, "min-h-10 rounded-xl px-4 text-sm font-bold")}
          >
            เปิดลิงก์
          </a>
          <button
            type="button"
            onClick={() => void copy()}
            className="app-btn-primary min-h-10 rounded-xl px-4 text-sm font-bold"
          >
            คัดลอกลิงก์
          </button>
        </div>
      </div>
    </div>
  );
}

type SettingsProps = {
  initial: VillageProfile;
  ownerId: string;
  trialSessionId: string;
  baseUrl: string;
  villageLabel: string;
  logoUrl?: string | null;
  trialExportBlocked?: boolean;
};

function VillageSettingsForm({
  initial,
  ownerId,
  trialSessionId,
  baseUrl,
  villageLabel,
  logoUrl = null,
  trialExportBlocked = false,
}: SettingsProps) {
  const api = useMemo(() => createVillageSessionApiRepository(), []);
  const router = useRouter();
  const pathname = usePathname() ?? "/dashboard/village/settings";
  const searchParams = useSearchParams();
  const [p, setP] = useState(initial);
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<SettingsTab>(() => parseSettingsTab(searchParams.get("tab")));
  const [defaultPaperSize, setDefaultPaperSize] = useState<AppSlipPaperSize>(() =>
    normalizeModuleSlipPaperSize(initial.default_paper_size),
  );
  const [taxId, setTaxId] = useState(initial.tax_id ?? "");
  const [autoGenerateFees, setAutoGenerateFees] = useState(initial.auto_generate_fees ?? true);
  const [tagline, setTagline] = useState(initial.tagline ?? "");
  const [logoUrlState, setLogoUrlState] = useState(initial.logo_url);
  const [contactLine, setContactLine] = useState(initial.contact_line ?? "");
  const [facebookUrl, setFacebookUrl] = useState(initial.facebook_url ?? "");
  const [mapUrl, setMapUrl] = useState(initial.map_url ?? "");
  const [portalBannerUrl, setPortalBannerUrl] = useState(initial.portal_banner_url ?? "");
  const [portalGallery, setPortalGallery] = useState<string[]>(initial.portal_gallery ?? []);
  const [addressDraft, setAddressDraft] = useState(initial.address ?? "");

  useEffect(() => {
    setTab(parseSettingsTab(searchParams.get("tab")));
  }, [searchParams]);

  useEffect(() => {
    setDefaultPaperSize(normalizeModuleSlipPaperSize(p.default_paper_size));
    setTaxId(p.tax_id ?? "");
    setAutoGenerateFees(p.auto_generate_fees ?? true);
    setTagline(p.tagline ?? "");
    setLogoUrlState(p.logo_url);
    setContactLine(p.contact_line ?? "");
    setFacebookUrl(p.facebook_url ?? "");
    setMapUrl(p.map_url ?? "");
    setPortalBannerUrl(p.portal_banner_url ?? "");
    setPortalGallery(p.portal_gallery ?? []);
    setAddressDraft(p.address ?? "");
  }, [
    p.default_paper_size,
    p.tax_id,
    p.auto_generate_fees,
    p.tagline,
    p.logo_url,
    p.contact_line,
    p.facebook_url,
    p.map_url,
    p.portal_banner_url,
    p.portal_gallery,
    p.address,
  ]);

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

  const applyProfile = (profile: VillageProfile) => {
    setP(profile);
  };

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
        description="ข้อมูลนิติ · ค่าส่วนกลาง · ชำระเงิน · เว็บลูกค้า · ลิงก์ / QR"
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
            if (tab === "links") return;
            setErr(null);
            setSaved(false);
            setBusy(true);
            const fd = new FormData(e.currentTarget);
            try {
              const r = await api.putProfile({
                display_name: (fd.get("display_name") as string) || null,
                address: addressDraft.trim() || null,
                contact_phone: (fd.get("contact_phone") as string) || null,
                prompt_pay_phone: (fd.get("prompt_pay_phone") as string) || null,
                payment_channels_note: (fd.get("payment_channels_note") as string) || null,
                bank_name: (fd.get("bank_name") as string) || null,
                bank_account_number: (fd.get("bank_account_number") as string) || null,
                bank_account_name: (fd.get("bank_account_name") as string) || null,
                tax_id: taxId.trim() || null,
                default_paper_size: defaultPaperSize,
                default_monthly_fee: Number.parseInt(String(fd.get("default_monthly_fee")), 10) || 0,
                due_day_of_month: Number.parseInt(String(fd.get("due_day_of_month")), 10) || 5,
                auto_generate_fees: autoGenerateFees,
                tagline: tagline.trim() || null,
                logo_url: logoUrlState,
                contact_line: contactLine.trim() || null,
                facebook_url: facebookUrl.trim() || null,
                map_url: mapUrl.trim() || null,
                portal_banner_url: portalBannerUrl.trim() || null,
                portal_gallery: portalGallery,
              });
              applyProfile(r.profile);
              setSaved(true);
            } catch (er) {
              setErr(er instanceof Error ? er.message : "บันทึกไม่สำเร็จ");
            } finally {
              setBusy(false);
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
              <AppShopLogoField
                logoUrl={logoUrlState}
                fallbackLabel={p.display_name ?? "หมู่บ้าน"}
                uploadUrl="/api/village/session/profile/logo"
                onLogoUrlChange={setLogoUrlState}
              />
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
                <FieldLabel>คำโปรย (เว็บลูกค้า)</FieldLabel>
                <input
                  id="tagline"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className={villageField}
                  placeholder="เช่น หมู่บ้านคุณภาพ · สงบ · ใกล้เมือง"
                />
              </label>
              <label className="block">
                <FieldLabel>ที่อยู่</FieldLabel>
                <textarea
                  id="address"
                  name="address"
                  value={addressDraft}
                  onChange={(e) => setAddressDraft(e.target.value)}
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
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-emerald-200/70 bg-white/80 px-3 py-3 shadow-sm ring-1 ring-emerald-100/80">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#4d47b6] focus:ring-[#4d47b6]/30"
                  checked={autoGenerateFees}
                  onChange={(e) => setAutoGenerateFees(e.target.checked)}
                />
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-slate-900">สร้างบิลค่าส่วนกลางอัตโนมัติ</span>
                  <span className="mt-0.5 block text-[11px] leading-snug text-slate-500">
                    เมื่อเปิด ระบบจะเติมบิลเดือนที่เลือกตอนเปิดหน้าค่าส่วนกลาง และผ่าน cron เดือนปัจจุบัน (เวลาไทย)
                    — ปุ่ม «สร้าง/เติม» ใช้ได้เสมอ
                  </span>
                </span>
              </label>
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
              <label className="block">
                <FieldLabel>เลขผู้เสียภาษีโครงการ</FieldLabel>
                <input
                  id="tax_id"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  className={villageField}
                  inputMode="numeric"
                  placeholder="ใช้บนใบแจ้งหนี้ · ใบเสร็จ · ใบกำกับ"
                  autoComplete="off"
                />
              </label>
              <AppSlipPaperSizeSettingsField
                label="ขนาดกระดาษเริ่มต้นเมื่อพิมพ์"
                hint="ใบแจ้งหนี้ · ใบเสร็จ · ใบกำกับ · 58 mm กึ่งกลาง · 80 mm / A4 ชิดซ้าย"
                fieldClassName={villageField}
                value={defaultPaperSize}
                onChange={setDefaultPaperSize}
              />
            </SettingsBlock>
          </div>

          <div
            id="village-settings-panel-portal"
            role="tabpanel"
            aria-labelledby="village-settings-tab-portal"
            className={cn(tab === "portal" ? "block" : "hidden")}
          >
            <SettingsBlock
              icon={<IconGlobe className="h-5 w-5 text-violet-700" />}
              tone="bg-violet-100/90"
              title="เว็ปลิงค์ลูกค้า"
              hint="แบนเนอร์ · แกลเลอรี · ที่อยู่ · โซเชียล แสดงบนหน้าสาธารณะ"
            >
              <VillagePortalMediaSettings
                bannerUrl={portalBannerUrl}
                gallery={portalGallery}
                address={addressDraft}
                contactLine={contactLine}
                facebookUrl={facebookUrl}
                mapUrl={mapUrl}
                onBannerUrlChange={setPortalBannerUrl}
                onGalleryChange={setPortalGallery}
                onAddressChange={setAddressDraft}
                onContactLineChange={setContactLine}
                onFacebookUrlChange={setFacebookUrl}
                onMapUrlChange={setMapUrl}
                disabled={busy}
              />
            </SettingsBlock>
          </div>

          {tab === "links" ? (
            <div
              id="village-settings-panel-links"
              role="tabpanel"
              aria-labelledby="village-settings-tab-links"
              className="space-y-4 text-left"
            >
              <VillagePortalLinkPanel ownerId={ownerId} trialSessionId={trialSessionId} />
              <VillageGuestPortalHubClient
                ownerId={ownerId}
                trialSessionId={trialSessionId}
                baseUrl={baseUrl}
                villageLabel={villageLabel || p.display_name || "หมู่บ้าน"}
                logoUrl={logoUrlState ?? logoUrl}
                trialExportBlocked={trialExportBlocked}
              />
            </div>
          ) : null}

          {err ? <p className="mt-3 text-sm text-rose-600">{err}</p> : null}

          {tab !== "links" ? (
            <div className={cn("mt-5 border-t pt-4", villageDivider)}>
              <button
                type="submit"
                disabled={busy}
                className={cn(
                  villageBtnPrimary,
                  "flex w-full min-h-[48px] items-center justify-center gap-2 sm:w-auto sm:min-w-[11rem]",
                )}
              >
                <IconSave className="h-4 w-4 text-white/90" />
                {busy ? "กำลังบันทึก…" : "บันทึก"}
              </button>
            </div>
          ) : null}
        </form>
      </VillagePanelCard>
    </VillagePageStack>
  );
}

export function VillageSettingsClient(props: SettingsProps) {
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
      <VillageSettingsForm {...props} />
    </Suspense>
  );
}
